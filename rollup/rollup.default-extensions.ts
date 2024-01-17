import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets'
import { PackageJson } from 'type-fest'
import { pascalCase } from 'pascal-case'
import * as fs from 'fs'
import * as fsPromise from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import metadataPlugin from './rollup-metadata-plugin'
import extensionDirectoryPlugin from '../dist/rollup-extension-directory-plugin/rollup-extension-directory-plugin.js'
import pkg from '../package.json' assert { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const EXTENSIONS = ['', '.ts', '.js']

const BASE_DIR = path.resolve(__dirname, '..')
const DEFAULT_EXTENSIONS_PATH = path.resolve(BASE_DIR, 'vscode-default-extensions')

const defaultExtensions = fs.readdirSync(DEFAULT_EXTENSIONS_PATH, { withFileTypes: true })
  .filter(f => f.isDirectory() && fs.existsSync(path.resolve(DEFAULT_EXTENSIONS_PATH, f.name, 'package.json')))
  .map(f => f.name)

const languageGrammarExtensions: string[] = []
const languageFeatureExtensions: string[] = []
for (const extension of defaultExtensions) {
  const extensionPath = path.resolve(DEFAULT_EXTENSIONS_PATH, extension, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(extensionPath).toString())
  if ((packageJson.contributes?.languages ?? []).length > 0) {
    languageGrammarExtensions.push(extension)
  }
  if (extension.endsWith('language-features')) {
    languageFeatureExtensions.push(extension)
  }
}

export default rollup.defineConfig([
  ...defaultExtensions.map(name => (<rollup.RollupOptions>{
    input: path.resolve(DEFAULT_EXTENSIONS_PATH, name),
    output: [{
      minifyInternalExports: false,
      assetFileNames: chunkInfo => {
        if (chunkInfo.name != null && chunkInfo.name.endsWith('d.ts')) {
          // append .txt at the end of d.ts files: those file are required by the typescript extension and are just expected to be loaded as simple text
          return 'resources/[name][extname].txt'
        }
        return 'resources/[name][extname]'
      },
      format: 'esm',
      dir: `dist/default-extension-${name}`,
      entryFileNames: 'index.js',
      chunkFileNames: '[name].js',
      hoistTransitiveImports: false
    }],
    external (source) {
      return source === 'vscode/extensions'
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
      nodeResolve({
        extensions: EXTENSIONS
      }),
      importMetaAssets(),
      {
        name: 'dynamic-import-polyfill',
        renderDynamicImport (): { left: string, right: string } {
          return {
            left: 'import(',
            right: ').then(module => module.default ?? module)'
          }
        }
      },
      extensionDirectoryPlugin({
        include: `${DEFAULT_EXTENSIONS_PATH}/**/*`,
        transformManifest (manifest) {
          return {
            ...manifest,
            main: undefined
          }
        },
        async getAdditionalResources (manifest, directory) {
          if (manifest.name === 'typescript-language-features') {
            const files = (await fsPromise.readdir(path.resolve(directory, 'dist/browser/typescript'), {
              withFileTypes: true
            })).filter(f => f.isFile()).map(f => f.name)
            return files.map(file => ({ path: path.join('./dist/browser/typescript', file), mimeType: 'text/plain' }))
          }
          return []
        }
      }),
      metadataPlugin({
        handle (_, dependencies, entrypoints, exclusiveModules, options, bundle) {
          const entrypoint = Object.values(bundle).filter(v => (v as rollup.OutputChunk).isEntry)[0]!.fileName
          const packageJson: PackageJson = {
            name: `@codingame/monaco-vscode-${name}-default-extension`,
            ...Object.fromEntries(Object.entries(pkg).filter(([key]) => ['version', 'keywords', 'author', 'license', 'repository', 'type'].includes(key))),
            private: false,
            description: `Default VSCode extension designed to be used with ${pkg.name}`,
            main: entrypoint,
            module: entrypoint,
            types: 'index.d.ts',
            dependencies: {
              vscode: `npm:${pkg.name}@^${pkg.version}`,
              ...Object.fromEntries(Object.entries(pkg.dependencies).filter(([key]) => dependencies.has(key)))
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
            source: 'declare const whenReady: () => Promise<void>\nexport { whenReady }',
            type: 'asset'
          })
        }
      })
    ]
  })), ...[{
    name: '@codingame/monaco-vscode-all-default-extensions',
    directory: 'default-extension-all',
    extensions: defaultExtensions
  }, {
    name: '@codingame/monaco-vscode-all-language-default-extensions',
    directory: 'default-extension-all-languages',
    extensions: languageGrammarExtensions
  }, {
    name: '@codingame/monaco-vscode-all-language-feature-default-extensions',
    directory: 'default-extension-all-language-features',
    extensions: languageFeatureExtensions
  }].map(({ name, directory, extensions }) => (<rollup.RollupOptions>{
    input: 'index.js',
    output: [{
      format: 'esm',
      dir: 'dist/' + directory,
      entryFileNames: 'index.js'
    }],
    external () {
      return true
    },
    plugins: [{
      name: 'code-loader',
      resolveId () {
        return 'index.js'
      },
      load () {
        return `
${extensions.map(name => `import { whenReady as whenReady${pascalCase(name)} } from '@codingame/monaco-vscode-${name}-default-extension'`).join('\n')}
const whenReady = Promise.all(
${extensions.map(name => `  whenReady${pascalCase(name)}()`).join(',\n')}
)
        `
      }
    },
    metadataPlugin({
      handle (_, dependencies, entrypoints, exclusiveModules, options, bundle) {
        const entrypoint = Object.values(bundle).filter(v => (v as rollup.OutputChunk).isEntry)[0]!.fileName
        const packageJson: PackageJson = {
          name,
          ...Object.fromEntries(Object.entries(pkg).filter(([key]) => ['version', 'keywords', 'author', 'license', 'repository', 'type'].includes(key))),
          private: false,
          description: `Meta package including default VSCode extensions designed to be used with ${pkg.name}`,
          main: entrypoint,
          module: entrypoint,
          types: 'index.d.ts',
          dependencies: Object.fromEntries(Array.from(dependencies).map(name => [
            name,
            pkg.version
          ]))
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
          source: 'declare const whenReady: () => Promise<void>\nexport { whenReady }',
          type: 'asset'
        })
      }
    })]
  }))])
