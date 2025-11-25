import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import type { PackageJson } from 'type-fest'
import replace from '@rollup/plugin-replace'
import glob from 'fast-glob'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'
import { EDITOR_API_PACKAGE_NAME } from './tools/config'
import { execSync } from 'child_process'
import importMetaAssets from './plugins/import-meta-assets-plugin.js'

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

function getInstalledVersion(libName: string) {
  const output = execSync(`npm ls ${libName} --json --depth 1 --long`).toString()

  interface Package {
    name: string
    version: string
    dependencies: Record<string, Package>
  }
  const parsed: Package = JSON.parse(output)

  const getVersionRecursive = (pack: Package): string | undefined => {
    if (pack.name === libName) {
      return pack.version
    }
    const versions = new Set(
      Object.values(pack.dependencies)
        .map(getVersionRecursive)
        .filter((version) => version != null)
    )
    if (versions.size > 2) {
      throw new Error(`Multiple version found for package ${libName}: ${Array.from(versions)}`)
    }
    if (versions.size === 1) {
      return versions.values().next().value
    }
    return undefined
  }

  return getVersionRecursive(parsed)
}

const resolver: rollup.Plugin = {
  name: 'resolver',
  resolveId(source, importer) {
    if (source.includes('.worker.js') && importer?.endsWith('workerManager.js')) {
      console.log({ source, importer })
      return {
        id: path.resolve(path.dirname(importer), source)
      }
    }

    const resolved = importer != null ? path.resolve(path.dirname(importer), source) : source
    const dependencyPath = path.resolve(MONACO_EDITOR_DIR, '../external')

    if (resolved.startsWith(dependencyPath)) {
      return {
        external: true,
        id: path.relative(dependencyPath, resolved).split(path.sep)[0]!
      }
    }

    if (source.endsWith('editor.api.js') || source.endsWith('editor.api2.js')) {
      return {
        id: 'monaco-editor',
        external: true
      }
    }
    if (source.includes('editor.worker.start')) {
      return {
        id: 'monaco-editor/esm/vs/editor/editor.worker.start.js',
        external: true
      }
    }

    if (resolved.startsWith(MONACO_EDITOR_DIR) && !fs.existsSync(resolved)) {
      return {
        external: true,
        id: `@codingame/monaco-vscode-api/vscode/vs/${path.relative(MONACO_EDITOR_DIR, resolved.replace(/\.js/, ''))}`,
        moduleSideEffects: false
      }
    }

    return undefined
  }
}

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
        treeshake: {
          preset: 'smallest'
        },
        output: {
          minifyInternalExports: false,
          preserveModules: true,
          sanitizeFileName(fileName) {
            // Remove spaces in name to prevent creating any issues
            return fileName.replace(/\s+/g, '_')
          },
          assetFileNames: '[name][extname]',
          format: 'esm',
          dir: `dist/packages/monaco-vscode-standalone-${language}-language-features`,
          entryFileNames: '[name].js',
          hoistTransitiveImports: false
        },
        plugins: [
          replace({
            AMD: false,
            preventAssignment: true
          }),
          importMetaAssets(),
          resolver,
          {
            name: 'loader',
            generateBundle() {
              const dependencies = Object.fromEntries(
                Array.from(this.getModuleIds())
                  .map((id) => this.getModuleInfo(id)!)
                  .filter(
                    (infos) =>
                      infos.isExternal &&
                      !infos.id.startsWith('@codingame') &&
                      !infos.id.startsWith('monaco-editor')
                  )
                  .map((module) => {
                    const version = getInstalledVersion(module.id)
                    if (version == null) {
                      this.error({ message: `Unable to find version of ${module.id}` })
                    }
                    return [module.id, version]
                  })
              )

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
                  'monaco-editor': `npm:${EDITOR_API_PACKAGE_NAME}@^${pkg.version}`,
                  ...dependencies
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
      index: path.resolve(BASIC_LANGUAGE_DIR, '_.contribution.js')
    },
    treeshake: {
      preset: 'smallest'
    },
    output: {
      minifyInternalExports: false,
      preserveModules: true,
      sanitizeFileName(fileName) {
        // Remove spaces in name to prevent creating any issues
        return fileName.replace(/\s+/g, '_')
      },
      assetFileNames: '[name][extname]',
      format: 'esm',
      dir: 'dist/packages/monaco-vscode-standalone-languages',
      entryFileNames: '[name].js',
      hoistTransitiveImports: false
    },
    plugins: [
      replace({
        AMD: false,
        preventAssignment: true
      }),
      importMetaAssets(),
      resolver,
      {
        name: 'loader',
        generateBundle() {
          const dependencies = Object.fromEntries(
            Array.from(this.getModuleIds())
              .map((id) => this.getModuleInfo(id)!)
              .filter(
                (infos) =>
                  infos.isExternal &&
                  !infos.id.startsWith('@codingame') &&
                  !infos.id.startsWith('monaco-editor')
              )
              .map((module) => {
                const version = getInstalledVersion(module.id)
                if (version == null) {
                  this.error({ message: `Unable to find version of ${module.id}` })
                }
                return [module.id, version]
              })
          )

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
              'monaco-editor': `npm:${EDITOR_API_PACKAGE_NAME}@^${pkg.version}`,
              ...dependencies
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
