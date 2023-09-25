import { createFilter, FilterPattern, dataToEsm } from '@rollup/pluginutils'
import { Plugin } from 'rollup'
import { IExtensionManifest } from 'vs/platform/extensions/common/extensions'
import { localizeManifest } from 'vs/platform/extensionManagement/common/extensionNls.js'
import * as path from 'path'
import * as fsPromise from 'fs/promises'
import * as fs from 'fs'
import { ExtensionResource, extractResourcesFromExtensionManifest, parseJson } from './extension-tools'

interface Options {
  include?: FilterPattern
  exclude?: FilterPattern
  transformManifest?: (manifest: IExtensionManifest) => IExtensionManifest
  getAdditionalResources?: (manifest: IExtensionManifest, directory: string) => Promise<ExtensionResource[]>
}

export default function plugin ({
  include,
  exclude,
  transformManifest = manifest => manifest,
  getAdditionalResources = () => Promise.resolve([])
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
        let parsed = parseJson<IExtensionManifest>(id, content.toString('utf-8'))
        const nlsFile = path.resolve(path.dirname(id), 'package.nls.json')
        if (fs.existsSync(nlsFile)) {
          parsed = localizeManifest(parsed, parseJson(id, (await fsPromise.readFile(nlsFile)).toString()))
        }
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
        const manifest = transformManifest(parseJson<IExtensionManifest>(id, (await fsPromise.readFile(manifestPath)).toString('utf8')))
        try {
          const extensionResources = await extractResourcesFromExtensionManifest(manifest, async (resourcePath) => {
            return (await fsPromise.readFile(path.join(id, resourcePath)))
          })
          const resources = Array.from(new Set([
            ...extensionResources,
            ...await getAdditionalResources(manifest, id)
          ]))

          function generateFileRegistrationInstruction (filePath: string, importPath: string, mimeType?: string) {
            return `registerFileUrl('${filePath}', new URL('${importPath}', import.meta.url).toString()${mimeType != null ? `, '${mimeType}'` : ''})`
          }

          return `
import manifest from '${manifestPath}'
import { registerExtension } from 'vscode/extensions'

const { registerFileUrl, whenReady } = registerExtension(manifest)
${resources.map(resource => {
  const lines: string[] = [
    generateFileRegistrationInstruction(resource.path, path.resolve(id, resource.realPath ?? resource.path), resource.mimeType)
  ]
  if (resource.realPath != null && resource.realPath !== resource.path) {
    lines.push(generateFileRegistrationInstruction(resource.realPath, path.resolve(id, resource.realPath), resource.mimeType))
  }

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
