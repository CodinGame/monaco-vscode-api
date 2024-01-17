import { createFilter, FilterPattern, dataToEsm } from '@rollup/pluginutils'
import { Plugin } from 'rollup'
import type { IExtensionManifest } from 'vs/platform/extensions/common/extensions'
import glob from 'fast-glob'
import * as path from 'path'
import * as fsPromise from 'fs/promises'
import { parseJson, toResource } from './extension-tools.js'
interface Options {
  include?: FilterPattern
  exclude?: FilterPattern
  transformManifest?: (manifest: IExtensionManifest) => IExtensionManifest
}

export default function plugin ({
  include,
  exclude,
  transformManifest = manifest => manifest
}: Options): Plugin {
  const filter = createFilter(include, exclude)

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

      // Load extension resources
      const basename = path.basename(id)
      if (basename === 'package.json') {
        const content = await fsPromise.readFile(id)
        const parsed = parseJson<IExtensionManifest>(id, content.toString('utf-8'))
        return {
          code: dataToEsm(transformManifest(parsed), {
            compact: true,
            namedExports: false,
            preferConst: false
          })
        }
      }

      // load extension directory as a module that loads the extension
      const stat = await fsPromise.stat(id)
      if (stat.isDirectory()) {
        // Load the extension directory as a module importing the required files and registering the extension
        const manifestPath = path.resolve(id, 'package.json')
        try {
          const resources = (await glob('**/*', {
            cwd: id,
            onlyFiles: true
          })).map(toResource)

          function generateFileRegistrationInstruction (filePath: string, importPath: string, mimeType?: string) {
            return `registerFileUrl('${filePath}', new URL('${importPath}', import.meta.url).toString()${mimeType != null ? `, '${mimeType}'` : ''})`
          }

          return `
import manifest from '${manifestPath}'
import { registerExtension } from 'vscode/extensions'

const { registerFileUrl, whenReady } = registerExtension(manifest)
${resources.map(resource => {
  const lines: string[] = resource.extensionPaths.map(extensionPath =>
    generateFileRegistrationInstruction(extensionPath, path.resolve(id, resource.path), resource.mimeType)
  )

  return lines.join('\n')
}).join('\n')}

export { whenReady }
`
        } catch (err) {
          console.error(err, (err as Error).stack)
          throw err
        }
      }

      return undefined
    }
  }
}
