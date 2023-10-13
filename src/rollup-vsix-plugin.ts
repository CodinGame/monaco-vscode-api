import { createFilter, FilterPattern } from '@rollup/pluginutils'
import { InputPluginOption, Plugin } from 'rollup'
import * as yauzl from 'yauzl'
import { IExtensionManifest } from 'vs/platform/extensions/common/extensions'
import { localizeManifest } from 'vs/platform/extensionManagement/common/extensionNls.js'
import { ConsoleLogger } from 'vs/platform/log/common/log'
import { Readable } from 'stream'
import * as path from 'path'
import { ExtensionResource, extractResourcesFromExtensionManifest, parseJson } from './extension-tools'

interface Options {
  include?: FilterPattern
  exclude?: FilterPattern
  rollupPlugins?: InputPluginOption[]
  transformManifest?: (manifest: IExtensionManifest) => IExtensionManifest
  getAdditionalResources?: (manifest: IExtensionManifest) => Promise<ExtensionResource[]>
}

const logger = new ConsoleLogger()

function read (stream: Readable): Promise<Buffer> {
  const bufs: Buffer[] = []
  return new Promise((resolve) => {
    stream.on('data', function (d) {
      bufs.push(d)
    })
    stream.on('end', function () {
      resolve(Buffer.concat(bufs))
    })
  })
}

async function readVsix (file: string): Promise<Record<string, Buffer>> {
  return new Promise((resolve) => {
    const files: Record<string, Buffer> = {}
    yauzl.open(file, { lazyEntries: true }, (err, zipfile) => {
      if (err != null) throw err
      zipfile.readEntry()
      zipfile.on('entry', function (entry: yauzl.Entry) {
        if (/\/$/.test(entry.fileName) || !entry.fileName.startsWith('extension/')) {
          zipfile.readEntry()
        } else {
          zipfile.openReadStream(entry, async function (err, readStream) {
            if (err != null) throw err
            readStream.on('end', function () {
              zipfile.readEntry()
            })
            files[entry.fileName.slice('extension/'.length)] = await read(readStream)
          })
        }
      })
      zipfile.on('end', function () {
        resolve(files)
      })
    })
  })
}

function getVsixPath (file: string) {
  return path.relative('/', path.resolve('/', file))
}

export default function plugin ({
  include = '**/*.vsix',
  exclude,
  transformManifest = manifest => manifest,
  getAdditionalResources = () => Promise.resolve([])
}: Options = {}): Plugin {
  const filter = createFilter(include, exclude)

  return {
    name: 'vsix-loader',
    resolveId (source) {
      if (filter(source)) {
        return source
      }
      if (source.startsWith('vsix:')) {
        return source
      }
      return undefined
    },
    async load (id) {
      if (!filter(id)) return null

      const files = await readVsix(id)
      const manifest = transformManifest(parseJson<IExtensionManifest>(id, files['package.json']!.toString('utf8')))

      const extensionResources = (await extractResourcesFromExtensionManifest(manifest, async path => {
        return files[getVsixPath(path)]!
      })).filter(resource => getVsixPath(resource.realPath ?? resource.path) in files)

      const vsixFile = Object.fromEntries(Object.entries(files).map(([key, value]) => [getVsixPath(key), value]))

      const resources = [
        ...extensionResources,
        ...await getAdditionalResources(manifest)
      ]

      const pathMapping = (await Promise.all(resources.map(async resource => {
        const assetPath = getVsixPath(resource.realPath ?? resource.path)
        let url: string
        if (process.env.NODE_ENV === 'development') {
          url = `'data:text/javascript;base64,${vsixFile[assetPath]!.toString('base64')}'`
        } else {
          url = 'import.meta.ROLLUP_FILE_URL_' + this.emitFile({
            type: 'asset',
            name: `${path.basename(id)}/${path.basename(assetPath)}`,
            source: vsixFile[assetPath]
          })
        }

        return [{
          pathInExtension: getVsixPath(resource.path),
          url,
          mimeType: resource.mimeType
        }, ...(resource.realPath != null
          ? [{
              pathInExtension: getVsixPath(resource.realPath),
              url,
              mimeType: resource.mimeType
            }]
          : [])]
      }))).flat()

      let packageJson = parseJson<IExtensionManifest>(id, vsixFile['package.json']!.toString('utf8'))
      if ('package.nls.json' in vsixFile) {
        packageJson = localizeManifest(logger, packageJson, parseJson(id, vsixFile['package.nls.json']!.toString()))
      }

      return `
import { registerExtension } from 'vscode/extensions'

const manifest = ${JSON.stringify(transformManifest(packageJson))}

const { registerFileUrl, whenReady } = registerExtension(manifest)

${pathMapping.map(({ pathInExtension, url, mimeType }) => (`
registerFileUrl('${pathInExtension}', ${url}${mimeType != null ? `, '${mimeType}'` : ''})`)).join('\n')}

export { whenReady }
`
    }
  }
}
