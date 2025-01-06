import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import type { PackageJson } from 'type-fest'
import replace from '@rollup/plugin-replace'
import glob from 'fast-glob'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'
const pkg = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url).pathname).toString()
)

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const EXTENSIONS = ['', '.ts', '.js']

const BASE_DIR = path.resolve(__dirname, '..')
const MONACO_EDITOR_DIR = path.resolve(BASE_DIR, 'monaco-editor')
const BASIC_LANGUAGE_DIR = path.resolve(MONACO_EDITOR_DIR, 'basic-languages')
const LANGUAGE_FEATURE_DIR = path.resolve(MONACO_EDITOR_DIR, 'language')

const monacoContributions = (
  await glob('**/monaco.contribution.js', {
    cwd: LANGUAGE_FEATURE_DIR,
    onlyFiles: true
  })
).map((fileName) => path.resolve(LANGUAGE_FEATURE_DIR, fileName))

export default rollup.defineConfig([
  ...(await Promise.all(
    monacoContributions.map(async (contributionFile) => {
      const dirname = path.dirname(contributionFile)
      const language = path.basename(dirname)
      return <rollup.RollupOptions>{
        input: {
          index: contributionFile,
          worker: path.resolve(
            dirname,
            (
              await glob('*.worker.js', {
                cwd: path.dirname(contributionFile)
              })
            )[0]!
          )
        },
        output: {
          minifyInternalExports: false,
          preserveModules: true,
          assetFileNames: '[name][extname]',
          format: 'esm',
          dir: `dist/standalone-language-feature-${language}`,
          entryFileNames: '[name].js',
          hoistTransitiveImports: false
        },
        plugins: [
          replace({
            AMD: false,
            preventAssignment: true
          }),
          {
            name: 'loader',
            resolveId(source) {
              if (source.endsWith('editor/editor.api.js')) {
                return {
                  id: 'monaco-editor',
                  external: true
                }
              }
              if (source.endsWith('editor/editor.worker.js')) {
                return {
                  id: 'monaco-editor/esm/vs/editor/editor.worker.js',
                  external: true
                }
              }
              return undefined
            },
            generateBundle() {
              const packageJson: PackageJson = {
                name: `@codingame/monaco-vscode-standalone-${language}-language-features`,
                ...Object.fromEntries(
                  Object.entries(pkg).filter(([key]) =>
                    ['version', 'keywords', 'author', 'license', 'repository', 'type'].includes(key)
                  )
                ),
                private: false,
                description: `monaco-editor ${language} language features bundled to work with ${pkg.name}`,
                exports: {
                  '.': {
                    default: './index.js'
                  },
                  './worker': {
                    default: './worker.js'
                  }
                },
                main: 'index.js',
                module: 'index.js',
                dependencies: {
                  'monaco-editor': `npm:@codingame/monaco-vscode-editor-api@^${pkg.version}`
                }
              }
              this.emitFile({
                fileName: 'package.json',
                needsCodeReference: false,
                source: JSON.stringify(packageJson, null, 2),
                type: 'asset'
              })
            }
          },
          nodeResolve({
            extensions: EXTENSIONS
          })
        ]
      }
    })
  )),
  {
    input: {
      index: path.resolve(BASIC_LANGUAGE_DIR, 'monaco.contribution.js')
    },
    output: {
      minifyInternalExports: false,
      preserveModules: true,
      assetFileNames: '[name][extname]',
      format: 'esm',
      dir: 'dist/monarch-basic-languages',
      entryFileNames: '[name].js',
      hoistTransitiveImports: false
    },
    plugins: [
      replace({
        AMD: false,
        preventAssignment: true
      }),
      {
        name: 'loader',
        resolveId(source) {
          if (source.endsWith('editor/editor.api.js')) {
            return {
              id: 'monaco-editor',
              external: true
            }
          }
          return undefined
        },
        generateBundle() {
          const packageJson: PackageJson = {
            name: '@codingame/monaco-vscode-standalone-languages',
            ...Object.fromEntries(
              Object.entries(pkg).filter(([key]) =>
                ['version', 'keywords', 'author', 'license', 'repository', 'type'].includes(key)
              )
            ),
            private: false,
            description: `monaco-editor default language bundled to work with ${pkg.name}`,
            main: 'index.js',
            module: 'index.js',
            types: 'index.d.ts',
            dependencies: {
              'monaco-editor': `npm:@codingame/monaco-vscode-editor-api@^${pkg.version}`
            }
          }
          this.emitFile({
            fileName: 'package.json',
            needsCodeReference: false,
            source: JSON.stringify(packageJson, null, 2),
            type: 'asset'
          })
        }
      },
      nodeResolve({
        extensions: EXTENSIONS
      })
    ]
  }
])
