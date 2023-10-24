import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import { IExtensionManifest } from 'vs/platform/extensions/common/extensions'
import { dataToEsm } from '@rollup/pluginutils'
import { PackageJson } from 'type-fest'
import glob from 'fast-glob'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as fsPromise from 'fs/promises'
import pkg from '../package.json' assert { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const EXTENSIONS = ['', '.ts', '.js']

const BASE_DIR = path.resolve(__dirname, '..')
const LOC_PATH = path.resolve(BASE_DIR, 'vscode-loc')
const DIST_DIR = path.resolve(BASE_DIR, 'dist')
const NODE_MODULES_DIR = path.resolve(BASE_DIR, 'node_modules')
const MONACO_EDITOR_DIR = path.resolve(NODE_MODULES_DIR, './monaco-editor')
const MONACO_EDITOR_ESM_DIR = path.resolve(MONACO_EDITOR_DIR, './esm')

const locExtensions = fs.readdirSync(LOC_PATH, { withFileTypes: true })
  .filter(f => f.isDirectory() && fs.existsSync(path.resolve(LOC_PATH, f.name, 'package.json')))
  .map(f => f.name)

const vscodeModules = (await glob('**/vscode/src/**/*.js', {
  cwd: DIST_DIR,
  onlyFiles: true
})).map(fileName => /vscode\/src\/(.*).js$/.exec(fileName)![1]!)

const monacoModules = (await glob('**/*.js', {
  cwd: MONACO_EDITOR_ESM_DIR,
  onlyFiles: true
})).map(fileName => fileName.slice(0, -3))

const usedModules = new Set<string>([...vscodeModules, ...monacoModules])

export default rollup.defineConfig([
  ...locExtensions.map(name => (<rollup.RollupOptions>{
    input: {
      index: path.resolve(LOC_PATH, name)
    },
    output: [{
      minifyInternalExports: false,
      preserveModules: true,
      assetFileNames: '[name][extname]',
      format: 'esm',
      dir: `dist/${name}`,
      entryFileNames: '[name].js',
      hoistTransitiveImports: false
    }],
    external (source) {
      return source === 'vscode/l10n'
    },
    plugins: [
      {
        name: 'resolve-asset-url',
        resolveFileUrl (options) {
          let relativePath = options.relativePath
          if (!relativePath.startsWith('.')) {
            relativePath = `./${options.relativePath}`
          }
          return `'${relativePath}'`
        }
      },
      {
        name: 'loader',
        resolveId (source) {
          return source
        },
        async load (id) {
          if (path.dirname(id) === LOC_PATH) {
            const packageJson: IExtensionManifest = JSON.parse((await fsPromise.readFile(path.resolve(id, 'package.json'))).toString())
            const mainLocalization = packageJson.contributes!.localizations![0]!

            const mainTranslation = mainLocalization.translations.find(t => t.id === 'vscode')!
            const otherTranslations = mainLocalization.translations.filter(t => t.id !== 'vscode')!

            const translationAssets: Record<string, string> = Object.fromEntries(await Promise.all(otherTranslations.map(async t => {
              const assetRef = this.emitFile({
                type: 'asset',
                name: path.relative('.', t.path),
                source: await fsPromise.readFile(path.resolve(id, t.path))
              })
              return [t.id, assetRef]
            })))

            return `
import { registerLocalization } from 'vscode/l10n'
import content from '${path.resolve(id, mainTranslation.path)}'
registerLocalization('${mainLocalization.languageId}', content, {
${Object.entries(translationAssets).map(([id, assetRef]) => `  '${id}': new URL(import.meta.ROLLUP_FILE_URL_${assetRef}, import.meta.url).href`).join(',\n')}
})
  `
          }
          return undefined
        },
        transform (code, id) {
          if (!id.endsWith('.json')) return null

          const parsed = JSON.parse(code).contents
          // remove keys that we don't use
          const filtered = Object.fromEntries(Object.entries(parsed).filter(([key]) => usedModules.has(key)))

          return {
            code: dataToEsm(filtered, {
              preferConst: true
            }),
            map: { mappings: '' }
          }
        },
        generateBundle () {
          const packageJson: PackageJson = {
            name: `@codingame/monaco-${name.toLowerCase()}`,
            ...Object.fromEntries(Object.entries(pkg).filter(([key]) => ['version', 'keywords', 'author', 'license', 'repository', 'type'].includes(key))),
            private: false,
            description: `Language pack designed to be used with ${pkg.name}`,
            main: 'index.js',
            module: 'index.js',
            types: 'index.d.ts',
            dependencies: {
              vscode: `npm:${pkg.name}@^${pkg.version}`
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
  }))
])
