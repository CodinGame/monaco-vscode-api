import { createFilter, FilterPattern, dataToEsm } from '@rollup/pluginutils'
import { Plugin } from 'rollup'
import type { IExtensionManifest } from 'vs/platform/extensions/common/extensions'
import * as path from 'path'
import * as fs from 'fs'
import { getExtensionResources, parseJson } from './extension-tools.js'
import { ExtensionFileMetadata } from './extensions.js'

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
        const content = await fs.promises.readFile(id)
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
      const stat = await fs.promises.stat(id)
      if (stat.isDirectory()) {
        // Load the extension directory as a module importing the required files and registering the extension
        const manifestPath = path.resolve(id, 'package.json')
        const manifest = transformManifest(parseJson<IExtensionManifest>(id, (await fs.promises.readFile(manifestPath)).toString('utf8')))
        try {
          const resources = await getExtensionResources(manifest, fs, id)

          const resourcePaths = resources.map(r => r.path)
          const readmePath = resourcePaths.filter(child => /^readme(\.txt|\.md|)$/i.test(child))[0]
          const changelogPath = resourcePaths.filter(child => /^changelog(\.txt|\.md|)$/i.test(child))[0]

          function generateFileRegistrationInstruction (filePath: string, importPath: string, mimeType?: string, size?: number) {
            return `registerFileUrl('${filePath}', new URL('${importPath}', import.meta.url).toString(), ${JSON.stringify(<ExtensionFileMetadata>{
              mimeType,
              size
            })})`
          }

          return `
import manifest from '${manifestPath}'
import { registerExtension } from 'vscode/extensions'

const { registerFileUrl, whenReady } = registerExtension(manifest, undefined, ${JSON.stringify({ system: true, readmePath, changelogPath })})
${resources.map(resource => {
  const lines: string[] = resource.extensionPaths.map(extensionPath =>
    generateFileRegistrationInstruction(extensionPath, path.resolve(id, resource.path), resource.mimeType, resource.size)
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

export {
  IExtensionManifest
}
