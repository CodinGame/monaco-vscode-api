import { createFilter, FilterPattern, dataToEsm } from '@rollup/pluginutils'
import { Plugin } from 'rollup'
import { IExtensionManifest } from 'vs/platform/extensions/common/extensions'
import { localizeManifest } from 'vs/platform/extensionManagement/common/extensionNls.js'
import * as path from 'path'
import * as fsPromise from 'fs/promises'
import * as fs from 'fs'
import { extractPathsFromExtensionManifest, parseJson } from './extension-tools'

interface Options {
  include?: FilterPattern
  exclude?: FilterPattern
}

export default function plugin (options: Options): Plugin {
  const filter = createFilter(options.include, options.exclude)

  return {
    name: 'default-extensions-loader',
    resolveId (source) {
      if (filter(source)) {
        return source
      }
      return undefined
    },
    async load (id) {
      // load extension directory as a module that loads the extension
      if (!filter(id)) {
        return
      }
      // load extension directory as a module that loads the extension
      const stat = await fsPromise.stat(id)
      if (!stat.isDirectory()) {
        return
      }
      const manifestPath = path.resolve(id, 'package.json')
      const manifest = JSON.parse((await fsPromise.readFile(manifestPath)).toString('utf8'))
      try {
        const filePaths = extractPathsFromExtensionManifest(manifest)
        return `
import manifest from '${manifestPath}'
import { registerExtension } from '../src/extensions'
import { onExtHostInitialized } from '../src/vscode-services/extHost'
onExtHostInitialized(() => {
const { registerFile } = registerExtension(manifest)
${filePaths.map(filePath => (`
registerFile('${filePath}', async () => await import('${path.resolve(id, filePath)}'))`))}
})
      `
      } catch (err) {
        console.error(err, (err as Error).stack)
        throw err
      }
    },
    async transform (code, id) {
      if (!filter(id)) {
        return code
      }
      const stat = await fsPromise.stat(id)
      if (stat.isDirectory()) {
        return code
      }
      const basename = path.basename(id)
      if (basename === 'package.json') {
        let parsed = parseJson<IExtensionManifest>(id, code)
        const nlsFile = path.resolve(path.dirname(id), 'package.nls.json')
        if (fs.existsSync(nlsFile)) {
          parsed = localizeManifest(parsed, parseJson(id, (await fsPromise.readFile(nlsFile)).toString()))
        }
        // Load extension package.json and package.nls.json as a json
        return {
          code: dataToEsm(parsed, {
            compact: true,
            namedExports: false,
            preferConst: false
          })
        }
      } else {
        // transform extension files to strings
        return {
          code: `export default ${JSON.stringify(code)};`,
          map: { mappings: '' }
        }
      }
    }
  }
}
