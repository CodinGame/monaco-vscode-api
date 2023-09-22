import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets'
import * as fs from 'fs'
import * as fsPromise from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import extensionDirectoryPlugin from '../dist/rollup-extension-directory-plugin.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const EXTENSIONS = ['', '.ts', '.js']

const BASE_DIR = path.resolve(__dirname, '..')
const DEFAULT_EXTENSIONS_PATH = path.resolve(BASE_DIR, 'vscode-default-extensions')

const defaultExtensions = fs.readdirSync(DEFAULT_EXTENSIONS_PATH, { withFileTypes: true })
  .filter(f => f.isDirectory() && fs.existsSync(path.resolve(DEFAULT_EXTENSIONS_PATH, f.name, 'package.json')))
  .map(f => f.name)

export default rollup.defineConfig(defaultExtensions.map(name => (<rollup.RollupOptions>{
  input: path.resolve(DEFAULT_EXTENSIONS_PATH, name),
  output: [{
    minifyInternalExports: false,
    assetFileNames: chunkInfo => {
      if (chunkInfo.name != null && chunkInfo.name.endsWith('d.ts')) {
        // append .txt at the end of d.ts files: those file are required by the typescript extension and are just expected to be loaded as simple text
        return '[name][extname].txt'
      }
      return '[name][extname]'
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
        if (manifest.name === 'configuration-editing') {
          manifest = {
            ...manifest,
            contributes: {
              ...manifest.contributes,
              jsonValidation: manifest.contributes!.jsonValidation!.map(validation => {
                return {
                  fileMatch: (validation.fileMatch as string).replaceAll('%APP_SETTINGS_HOME%', 'user:'),
                  url: validation.url
                }
              })
            }
          }
        }
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
    })]
})))
