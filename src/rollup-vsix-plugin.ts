import { createFilter, FilterPattern, dataToEsm } from '@rollup/pluginutils'
import { Plugin } from 'rollup'
import * as yauzl from 'yauzl'
import { Readable } from 'stream'
import * as path from 'path'
import { extractPathsFromExtensionManifest } from './extension-tools'
import { parse } from '../vscode/vs/base/common/json.js'

interface Options {
  include?: FilterPattern
  exclude?: FilterPattern
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

const defaultOptions: Options = {
  include: '**/*.vsix'
}

export default function plugin (options: Options = defaultOptions): Plugin {
  const filter = createFilter(options.include, options.exclude)
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
      const rawMatch = /vsix:(.*):(.*)\.raw/.exec(id)
      if (rawMatch != null) {
        const content = vsixFiles[rawMatch[1]!]![rawMatch[2]!]!.toString('utf8')
        return `export default ${JSON.stringify(content)};`
      }
      const match = /vsix:(.*):(.*)\.vsjson/.exec(id)
      if (match != null) {
        const parsed = parse(vsixFiles[match[1]!]![match[2]!]!.toString('utf8'))
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
      const manifest = parse(files['package.json']!.toString('utf8'))
      function getVsixPath (file: string) {
        return path.relative('/', path.resolve('/', file))
      }

      const usedFiles = extractPathsFromExtensionManifest(manifest).filter(file => getVsixPath(file) in files)

      const allFiles = ['package.json', 'package.nls.json', ...usedFiles]
      const nlsExists = files['package.nls.json'] != null

      const vsixFile: Record<string, Buffer> = allFiles.reduce((acc, usedFile) => {
        return ({
          ...acc,
          [usedFile]: files[getVsixPath(usedFile)]!
        })
      }, {} as Record<string, Buffer>)
      vsixFiles[id] = vsixFile

      return `
import manifest from 'vsix:${id}:package.json.vsjson'
${nlsExists ? `import nls from 'vsix:${id}:package.nls.json.vsjson'` : ''}
import { registerExtension, onExtHostInitialized } from 'vscode/extensions'
onExtHostInitialized(() => {
  const { registerFile } = registerExtension(manifest${nlsExists ? ', nls' : ''})
${usedFiles.map((filePath) => (`
  registerFile('${filePath}', async () => (await import('vsix:${id}:${filePath}.raw')).default)`))}
})
`
    }
  }
}
