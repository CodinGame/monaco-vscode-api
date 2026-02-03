import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import type { IExtensionManifest } from 'vs/platform/extensions/common/extensions'
import { dataToEsm } from '@rollup/pluginutils'
import type { PackageJson } from 'type-fest'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as fsPromise from 'fs/promises'
import resolveAssetUrlPlugin from './plugins/resolve-asset-url-plugin.js'
import { MAIN_PACKAGE_NAME, sanitizeFileName } from './tools/config.js'

const pkg = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url).pathname).toString()
)

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const EXTENSIONS = ['', '.ts', '.js']

const BASE_DIR = path.resolve(__dirname, '..')
const LOC_PATH = path.resolve(BASE_DIR, 'vscode-loc')
const DIST_DIR = path.resolve(BASE_DIR, 'dist')

const locExtensions = fs
  .readdirSync(LOC_PATH, { withFileTypes: true })
  .filter((f) => f.isDirectory() && fs.existsSync(path.resolve(LOC_PATH, f.name, 'package.json')))
  .map((f) => f.name)

const nlsKeys: [string, string[]][] = JSON.parse(
  (await fs.promises.readFile(path.resolve(DIST_DIR, 'nls.keys.json'))).toString()
)

export default rollup.defineConfig([
  ...locExtensions.map(
    (name) =>
      <rollup.RollupOptions>{
        input: {
          index: path.resolve(LOC_PATH, name)
        },
        output: [
          {
            minifyInternalExports: false,
            preserveModules: true,
            sanitizeFileName,
            assetFileNames: '[name][extname]',
            format: 'esm',
            dir: `dist/packages/monaco-${name}`,
            entryFileNames: '[name].js',
            hoistTransitiveImports: false
          }
        ],
        external(source) {
          return source.startsWith(MAIN_PACKAGE_NAME)
        },
        plugins: [
          resolveAssetUrlPlugin(),
          {
            name: 'loader',
            resolveId(source) {
              return source
            },
            async load(id) {
              if (path.dirname(id) === LOC_PATH) {
                const packageJson: IExtensionManifest = JSON.parse(
                  (await fsPromise.readFile(path.resolve(id, 'package.json'))).toString()
                )
                const mainLocalization = packageJson.contributes!.localizations![0]!

                const mainTranslation = mainLocalization.translations.find(
                  (t) => t.id === 'vscode'
                )!
                const otherTranslations = mainLocalization.translations.filter(
                  (t) => t.id !== 'vscode'
                )

                const translationAssets: Record<string, string> = Object.fromEntries(
                  await Promise.all(
                    otherTranslations.map(async (t) => {
                      const assetRef = this.emitFile({
                        type: 'asset',
                        name: path.relative('.', t.path),
                        source: await fsPromise.readFile(path.resolve(id, t.path))
                      })
                      return [t.id, assetRef]
                    })
                  )
                )

                return `
import { registerLocalization } from '${MAIN_PACKAGE_NAME}/l10n'
import content from '${path.resolve(id, mainTranslation.path)}'

const manifest = ${JSON.stringify(packageJson)}
registerLocalization(manifest, '${mainLocalization.languageId}', content, {
${Object.entries(translationAssets)
  .map(
    ([id, assetRef]) =>
      `  '${id}': new URL(import.meta.ROLLUP_FILE_URL_${assetRef}, import.meta.url).href`
  )
  .join(',\n')}
})
  `
              }
              return undefined
            },
            transform(code, id) {
              if (!id.endsWith('.json')) return null

              const parsed: Record<string, Record<string, string>> = JSON.parse(code).contents

              const encoded = nlsKeys.flatMap(([moduleId, keys]) => {
                const moduleValues = parsed[moduleId]
                return keys.map((key) => moduleValues?.[key])
              })

              return {
                code: dataToEsm(encoded, {
                  preferConst: true
                }),
                map: { mappings: '' }
              }
            },
            generateBundle() {
              const packageJson: PackageJson = {
                name: `@codingame/monaco-${name.toLowerCase()}`,
                ...Object.fromEntries(
                  Object.entries(pkg).filter(([key]) =>
                    ['version', 'keywords', 'author', 'license', 'repository', 'type'].includes(key)
                  )
                ),
                private: false,
                description: `Language pack designed to be used with ${pkg.name}`,
                main: 'index.js',
                module: 'index.js',
                types: 'index.d.ts',
                dependencies: {
                  [pkg.name]: pkg.version
                }
              }
              this.emitFile({
                fileName: 'package.json',
                needsCodeReference: false,
                source: JSON.stringify(packageJson, null, 2),
                type: 'asset'
              })

              this.emitFile({
                fileName: 'index.d.ts',
                needsCodeReference: false,
                source: 'export {}',
                type: 'asset'
              })
            }
          },
          nodeResolve({
            extensions: EXTENSIONS
          })
        ]
      }
  )
])
