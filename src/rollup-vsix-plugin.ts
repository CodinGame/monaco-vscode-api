import { createFilter, FilterPattern } from '@rollup/pluginutils'
import { InputPluginOption, Plugin } from 'rollup'
import * as yauzl from 'yauzl'
import type { IExtensionManifest } from 'vs/platform/extensions/common/extensions'
import { IFs, createFsFromVolume, Volume } from 'memfs'
import { Readable } from 'stream'
import * as path from 'path'
import { ExtensionResource, extractResourcesFromExtensionManifest, parseJson } from './extension-tools.js'

interface Options {
  include?: FilterPattern
  exclude?: FilterPattern
  rollupPlugins?: InputPluginOption[]
  transformManifest?: (manifest: IExtensionManifest) => IExtensionManifest
  getAdditionalResources?: (manifest: IExtensionManifest) => Promise<ExtensionResource[]>
}

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

async function readVsix (file: string): Promise<IFs> {
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
        resolve(createFsFromVolume(Volume.fromJSON(files, '/')))
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

      const vsixFS = await readVsix(id)
      const readFileSync = (filePath: string) => vsixFS.readFileSync(path.join('/', filePath)) as Buffer
      const manifest = transformManifest(parseJson<IExtensionManifest>(id, readFileSync('package.json').toString('utf8')))

      const getFileContent = async (filePath: string): Promise<Buffer> => {
        return readFileSync(filePath)
      }
      const listFiles = async (filePath: string) => {
        return (vsixFS.readdirSync(path.join('/', filePath)) as string[])
      }
      const extensionResources = (await extractResourcesFromExtensionManifest(manifest, getFileContent, listFiles))
        .filter(resource => vsixFS.existsSync(path.join('/', resource.realPath ?? resource.path)))

      const resources = [
        ...extensionResources,
        ...await getAdditionalResources(manifest)
      ]

      const pathMapping = (await Promise.all(resources.map(async resource => {
        const assetPath = getVsixPath(resource.realPath ?? resource.path)
        let url: string
        if (process.env.NODE_ENV === 'development') {
          url = `'data:text/javascript;base64,${readFileSync(assetPath).toString('base64')}'`
        } else {
          url = 'import.meta.ROLLUP_FILE_URL_' + this.emitFile({
            type: 'asset',
            name: `${path.basename(id)}/${path.basename(assetPath)}`,
            source: readFileSync(assetPath)
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

      return `
import { registerExtension } from 'vscode/extensions'

const manifest = ${JSON.stringify(manifest)}

const { registerFileUrl, whenReady } = registerExtension(manifest)

${pathMapping.map(({ pathInExtension, url, mimeType }) => (`
registerFileUrl('${pathInExtension}', ${url}${mimeType != null ? `, '${mimeType}'` : ''})`)).join('\n')}

export { whenReady }
`
    }
  }
}
