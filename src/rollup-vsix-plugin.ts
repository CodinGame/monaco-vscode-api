import { createFilter, FilterPattern, dataToEsm } from '@rollup/pluginutils'
import { InputPluginOption, Plugin } from 'rollup'
import * as yauzl from 'yauzl'
import { IExtensionManifest } from 'vs/platform/extensions/common/extensions'
import { localizeManifest } from 'vs/platform/extensionManagement/common/extensionNls.js'
import { isBinaryFileSync } from 'isbinaryfile'
import { lookup as lookupMimeType } from 'mime-types'
import { Readable } from 'stream'
import * as path from 'path'
import { buildExtensionCode, compressResource, extractResourcesFromExtensionManifest, parseJson } from './extension-tools'

interface Options {
  include?: FilterPattern
  exclude?: FilterPattern
  withCode?: (extensionPath: string) => boolean
  rollupPlugins: InputPluginOption[]
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
  rollupPlugins,
  withCode = () => true
}: Options): Plugin {
  const filter = createFilter(include, exclude)
  const vsixFiles: Record<string, Record<string, Buffer>> = {}

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
      const rawMatch = /^vsix:(.*):(.*)\.raw$/.exec(id)
      if (rawMatch != null) {
        const vsixFile = vsixFiles[rawMatch[1]!]!
        const resourcePath = rawMatch[2]!
        if (resourcePath.endsWith('.js')) {
          const code = await buildExtensionCode(resourcePath, rollupPlugins, async (resourcePath) => {
            return vsixFile[getVsixPath(resourcePath)]?.toString('utf-8') ?? 'export default ""'
          })
          return {
            code: `export default ${JSON.stringify(code)};`,
            map: { mappings: '' }
          }
        }
        const content = vsixFile[getVsixPath(resourcePath)]!
        if (isBinaryFileSync(content)) {
          return {
            code: `export default Uint8Array.from(window.atob(${JSON.stringify(content.toString('base64'))}), v => v.charCodeAt(0));`,
            map: { mappings: '' }
          }
        } else {
          return {
            code: `export default ${JSON.stringify(compressResource(id, content.toString('utf-8')))};`,
            map: { mappings: '' }
          }
        }
      }
      const match = /^vsix:(.*):(.*)\.vsjson$/.exec(id)
      if (match != null) {
        const file = match[2]!
        const vsixFile = vsixFiles[match[1]!]!
        let parsed = parseJson<IExtensionManifest>(id, vsixFile[file]!.toString('utf8'))
        if (file === 'package.json' && 'package.nls.json' in vsixFile) {
          parsed = localizeManifest(parsed, parseJson(id, vsixFile['package.nls.json']!.toString()))
        }
        return {
          code: dataToEsm(parsed, {
            compact: true,
            namedExports: false,
            preferConst: false
          })
        }
      }

      if (!filter(id)) return null

      const files = await readVsix(id)
      const manifest = parseJson<IExtensionManifest>(id, files['package.json']!.toString('utf8'))

      const extensionResources = (await extractResourcesFromExtensionManifest(manifest, async path => {
        return files[getVsixPath(path)]!
      })).filter(resource => getVsixPath(resource.path) in files)

      const vsixFile: Record<string, Buffer> = Object.keys(files).reduce((acc, usedFile) => {
        return ({
          ...acc,
          [usedFile]: files[getVsixPath(usedFile)]!
        })
      }, {} as Record<string, Buffer>)
      vsixFiles[id] = vsixFile

      const syncPaths = extensionResources.filter(resource => resource.sync).map(r => r.path)
      const asyncPaths = extensionResources.filter(resource => !resource.sync).map(r => r.path)
      return `
import manifest from 'vsix:${id}:package.json.vsjson'
import { registerExtension, onExtHostInitialized } from 'vscode/extensions'
${syncPaths.map((resourcePath, index) => (`
import resource_${index} from 'vsix:${id}:${resourcePath}.raw'`)).join('\n')}

onExtHostInitialized(() => {
  const { registerFile, registerSyncFile, runCode } = registerExtension(manifest)
${asyncPaths.map((filePath) => (`
  registerFile('${filePath}', async () => (await import('vsix:${id}:${filePath}.raw')).default)`)).join('\n')}
${syncPaths.map((resourcePath, index) => (`
  registerSyncFile('${resourcePath}', resource_${index}, '${lookupMimeType(resourcePath)}')`)).join('\n')}

${withCode(id) ? '  runCode()' : ''}
})
`
    }
  }
}
