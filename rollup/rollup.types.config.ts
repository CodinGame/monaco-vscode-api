import * as rollup from 'rollup'
import dts from 'rollup-plugin-dts'
import * as tsMorph from 'ts-morph'
import { paramCase } from 'param-case'
import fastGlob from 'fast-glob'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'
import * as fsPromise from 'fs/promises'
import metadataPlugin from './rollup-metadata-plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const project = new tsMorph.Project({
  tsConfigFilePath: path.resolve(__dirname, '../tsconfig.types.json'),
  manipulationSettings: {
    quoteKind: tsMorph.QuoteKind.Single
  }
})

const PROJECT_ROOT = path.join(__dirname, '..')
const VSCODE_DIR = path.join(PROJECT_ROOT, 'vscode')
const VSCODE_SRC_DIR = path.join(VSCODE_DIR, 'src')
const VSCODE_SRC_DTS_DIR = path.join(VSCODE_SRC_DIR, 'vscode-dts')
const DIST_DIR = path.join(PROJECT_ROOT, 'dist')
const DIST_DIR_MAIN = path.resolve(DIST_DIR, 'main')
const DIST_DIR_VSCODE_SRC_MAIN = path.resolve(DIST_DIR_MAIN, 'vscode/src')
const TYPES_SRC_DIR = path.join(DIST_DIR, 'types/src')
const SERVICE_OVERRIDE_DIR = path.join(TYPES_SRC_DIR, 'service-override')

const interfaceOverride = new Map<string, string>()
interfaceOverride.set('Event<T>', 'vscode.Event<T>')
interfaceOverride.set(
  'IActionDescriptor',
  "import('vs/editor/editor.api').editor.IActionDescriptor"
)
interfaceOverride.set('ICodeEditor', "import('vs/editor/editor.api').editor.ICodeEditor")
interfaceOverride.set('IEditor', "import('vs/editor/editor.api').editor.IEditor")
interfaceOverride.set('URI', "import('vs/editor/editor.api').Uri")
interfaceOverride.set('ITextModel', "import('vs/editor/editor.api').editor.ITextModel")
interfaceOverride.set(
  'vs/editor/common/config/editorOptions:IEditorOptions',
  "import('vs/editor/editor.api').editor.IEditorOptions"
)
interfaceOverride.set(
  'IEditorOverrideServices',
  "import('vs/editor/editor.api').editor.IEditorOverrideServices"
)
interfaceOverride.set(
  'IStandaloneCodeEditor',
  "import('vs/editor/editor.api').editor.IStandaloneCodeEditor"
)
interfaceOverride.set(
  'IStandaloneDiffEditor',
  "import('vs/editor/editor.api').editor.IStandaloneDiffEditor"
)
interfaceOverride.set(
  'IStandaloneEditorConstructionOptions',
  "import('vs/editor/editor.api').editor.IStandaloneEditorConstructionOptions"
)
interfaceOverride.set(
  'IStandaloneDiffEditorConstructionOptions',
  "import('vs/editor/editor.api').editor.IStandaloneDiffEditorConstructionOptions"
)

function isExternal(id: string) {
  if (id.endsWith('.css')) {
    return true
  }
  if (id.includes('.contribution')) {
    return true
  }

  return [
    'vscode',
    'tas-client-umd',
    'vscode-textmate',
    'rollup',
    '@rollup/pluginutils',
    '@xterm'
  ].some((external) => id === external || id.startsWith(`${external}/`))
}

const proposedApiTypes = await fastGlob('vscode.proposed.*.d.ts', {
  cwd: VSCODE_SRC_DTS_DIR
})

export default rollup.defineConfig(
  (<
    {
      input: Record<string, string>
      output: string
      preserveModulesRoot?: string
      main?: boolean
    }[]
  >[
    {
      input: {
        'services.d': './dist/types/src/services.d.ts',
        'extensions.d': './dist/types/src/extensions.d.ts',
        'monaco.d': './dist/types/src/monaco.d.ts',
        'l10n.d': './dist/types/src/l10n.d.ts',
        'editor.api.d': './dist/types/src/editor.api.d.ts',
        ...Object.fromEntries(
          fs
            .readdirSync(path.resolve(DIST_DIR, 'types/src/service-override'), {
              withFileTypes: true
            })
            .filter((f) => f.isFile())
            .map((f) => f.name)
            .map((name) => [
              `service-override/${path.basename(name, '.ts')}`,
              `./dist/types/src/service-override/${name}`
            ])
        )
      },
      output: 'dist/main',
      main: true
    },
    {
      input: {
        'rollup-vsix-plugin.d': './dist/types/src/rollup-vsix-plugin.d.ts'
      },
      output: 'dist/rollup-vsix-plugin'
    },
    {
      input: {
        'rollup-extension-directory-plugin.d':
          './dist/types/src/rollup-extension-directory-plugin.d.ts'
      },
      output: 'dist/rollup-extension-directory-plugin'
    }
  ]).map(
    ({ input, output, preserveModulesRoot = TYPES_SRC_DIR }) =>
      <rollup.RollupOptions>{
        input,
        treeshake: false,
        output: {
          preserveModules: true,
          preserveModulesRoot,
          format: 'esm',
          dir: output,
          entryFileNames: (chunkInfo) => {
            // Rename node_modules to external so it's not removing while publishing the package
            // tslib and rollup-plugin-styles and bundled
            if (chunkInfo.name.includes('node_modules')) {
              return chunkInfo.name.replace('node_modules', 'external') + '.ts'
            }
            return '[name].ts'
          }
        },
        external: (id) => isExternal(id),
        plugins: [
          metadataPlugin({
            stage: 'writeBundle', // rollup-plugin-dts needs the file to exist on the disk
            getGroup(id: string) {
              if (id.startsWith(SERVICE_OVERRIDE_DIR)) {
                const name = path.basename(id, '.d.ts')
                return {
                  name: `service-override/${name}`,
                  publicName: `@codingame/monaco-vscode-${name}-service-override`
                }
              }
              if (id === path.resolve(TYPES_SRC_DIR, 'editor.api.d.ts')) {
                return {
                  name: 'editor.api',
                  publicName: '@codingame/monaco-vscode-editor-api'
                }
              }
              return {
                name: 'main',
                publicName: 'vscode',
                priority: 1
              }
            },
            async handle({
              group: { name: groupName, exclusiveModules, entrypoints },
              moduleGroupName,
              bundle
            }) {
              if (groupName === 'main') {
                return
              }

              const serviceOverrideEntryPoint = Array.from(entrypoints)[0]!
              const entrypointInfo = this.getModuleInfo(serviceOverrideEntryPoint)!

              const groupBundle = await rollup.rollup({
                input: {
                  [groupName === 'editor.api' ? 'esm/vs/editor/editor.api.d' : 'index.d']:
                    'entrypoint'
                },
                external: (id) => {
                  if (id === 'vscode') {
                    // we need to load the proposed types of vscode, so let says it's not external and override the load method to load the proposed types
                    return undefined
                  }
                  return isExternal(id)
                },
                plugins: [
                  {
                    name: 'loader',
                    resolveId(source, importer) {
                      if (source === 'entrypoint') {
                        return source
                      }
                      if (source === 'vscode') {
                        return {
                          id: 'vscode',
                          external: true
                        }
                      }
                      const importerDir = path.dirname(path.resolve(DIST_DIR_MAIN, importer ?? '/'))
                      const resolved = path.resolve(importerDir, source)
                      const resolvedWithoutExtension = resolved.endsWith('.js')
                        ? resolved.slice(0, -3)
                        : resolved
                      const resolvedWithExtension = resolvedWithoutExtension.endsWith('.d.ts')
                        ? resolvedWithoutExtension
                        : `${resolvedWithoutExtension}.d.ts`

                      const isVscodeFile = resolved.startsWith(
                        path.resolve(DIST_DIR_MAIN, 'vscode')
                      )
                      const isServiceOverride =
                        path.dirname(resolved) === path.resolve(DIST_DIR_MAIN, 'service-override')
                      const isExclusive = exclusiveModules.has(resolvedWithExtension)

                      if ((isVscodeFile || isServiceOverride) && !isExclusive) {
                        function getPackageFromGroupName(groupName: string) {
                          if (groupName === 'main') {
                            return 'vscode'
                          }
                          const [_, category, name] = /^(.*):(.*)$/.exec(groupName)!
                          return `@codingame/monaco-vscode-${name}-${category}`
                        }
                        const importFromGroup = isVscodeFile
                          ? (moduleGroupName.get(resolved) ?? 'main')
                          : 'main'
                        const importFromModule = getPackageFromGroupName(importFromGroup)
                        const externalResolved = resolved.startsWith(DIST_DIR_VSCODE_SRC_MAIN)
                          ? `${importFromModule}/vscode/${path.relative(DIST_DIR_VSCODE_SRC_MAIN, resolvedWithoutExtension)}`
                          : `${importFromModule}/${path.relative(DIST_DIR_MAIN, resolvedWithoutExtension)}`
                        // Those modules will be imported from external monaco-vscode-api
                        return {
                          id: externalResolved,
                          external: true
                        }
                      }

                      return undefined
                    },
                    load(id) {
                      if (id === 'entrypoint') {
                        const entryTypesPath = `${path.resolve(DIST_DIR_MAIN, groupName)}`
                        const codeLines: string[] = []
                        if ((entrypointInfo.exports ?? []).includes('default')) {
                          codeLines.push(`export { default } from '${entryTypesPath}'`)
                        }
                        if ((entrypointInfo.exports ?? []).some((e) => e !== 'default')) {
                          codeLines.push(`export * from '${entryTypesPath}'`)
                        }
                        return codeLines.join('\n')
                      }
                      if (id.startsWith('vscode/')) {
                        return (
                          bundle[path.relative('vscode', id)] as rollup.OutputChunk | undefined
                        )?.code
                      }
                      return (
                        bundle[path.relative(DIST_DIR_MAIN, id)] as rollup.OutputChunk | undefined
                      )?.code
                    }
                  },
                  dts({
                    respectExternal: true
                  })
                ]
              })
              await groupBundle.write({
                preserveModules: true,
                preserveModulesRoot: path.dirname(path.resolve(DIST_DIR_MAIN, groupName)),
                minifyInternalExports: false,
                assetFileNames: 'assets/[name][extname]',
                format: 'esm',
                dir: path.resolve(DIST_DIR, paramCase(groupName.replace(/\//g, '-'))),
                entryFileNames: '[name].ts',
                hoistTransitiveImports: false
              })
              await groupBundle.close()

              // remove exclusive files from main bundle to prevent them from being duplicated
              await Promise.all(
                Array.from(exclusiveModules)
                  .filter((m) => m.startsWith(DIST_DIR_MAIN))
                  .map(async (module) => {
                    await fsPromise.rm(module)
                  })
              )
            }
          }),
          {
            name: 'change-unsupported-syntax',
            transform(code) {
              return code.replace(
                'export import Severity = BaseSeverity;',
                'type Severity = BaseSeverity; export { Severity }'
              )
            }
          },
          {
            name: 'resolve-vscode-proposed-types',
            transform(code) {
              return code.replace('/** PROPOSED-type-references */', () =>
                proposedApiTypes
                  .map((file) => `/// <reference path="./vscode-dts/${file}" />`)
                  .join('\n')
              )
            },
            async generateBundle() {
              await Promise.all(
                proposedApiTypes.map(async (file) =>
                  this.emitFile({
                    type: 'asset',
                    needsCodeReference: false,
                    fileName: `vscode-dts/${file}`,
                    source: await fsPromise.readFile(path.resolve(VSCODE_SRC_DTS_DIR, file))
                  })
                )
              )
            }
          },
          {
            name: 'replace-interfaces',
            load(id) {
              const sourceFile = project.addSourceFileAtPath(id)

              if (id.includes('node_modules') && id.includes('xterm')) {
                // xterm modules use `declare module` syntax not supposed by the rollup-dts-plugin, so let's transform the code
                const module = sourceFile.getModules()[0]!
                for (const _interface of module.getInterfaces()) {
                  _interface.setIsExported(true)
                }
                return `${sourceFile
                  .getImportDeclarations()
                  .map((e) => e.getText())
                  .join('\n')}\n${module.getBodyText()}`
              }

              if (sourceFile.getImportDeclaration('vscode') == null) {
                sourceFile.addImportDeclaration({
                  moduleSpecifier: 'vscode',
                  namespaceImport: 'vscode'
                })
              }

              return sourceFile.getFullText()
            },
            transform(code, id) {
              if (!id.endsWith('editor.api.d.ts')) {
                interfaceOverride.forEach((value, key) => {
                  const [, path, name] = /(?:(.*):)?(.*)/.exec(key)!
                  if (path == null || path === id) {
                    code = code.replace(
                      `interface ${name} `,
                      `type ${name} = ${value}\ninterface _${name} `
                    )
                  }
                })
              } else {
                code = code.replace(
                  "declare module 'vs/editor/editor.api'",
                  "declare module 'vscode/vscode/vs/editor/editor.api'"
                )
              }
              return code
            },
            renderChunk(code, chunk) {
              const chunkParentPath = path.resolve(DIST_DIR, path.dirname(chunk.fileName))
              if (code.includes('DebugProtocol')) {
                const importPath = path.relative(
                  chunkParentPath,
                  path.resolve(DIST_DIR, 'debugProtocol.d.ts')
                )
                return `/// <reference path="./${importPath}" />\n\n${code}`
              }
              return undefined
            },
            async generateBundle(options, bundle) {
              const editorTypesChunk = bundle['vscode/src/vs/editor/editor.api.d.ts'] as
                | rollup.OutputChunk
                | undefined
              if (editorTypesChunk != null) {
                editorTypesChunk.code = (
                  await fs.promises.readFile(
                    path.resolve(PROJECT_ROOT, 'monaco-editor/editor.api.d.ts')
                  )
                ).toString('utf-8')
              }
            }
          },
          {
            name: 'resolve-vscode',
            resolveId: async function (importee, importer) {
              const importeeWithoutExtension = importee.endsWith('.js')
                ? importee.slice(0, -3)
                : importee
              if (importeeWithoutExtension.startsWith('vscode/')) {
                return path.resolve(
                  VSCODE_DIR,
                  path.relative('vscode', `${importeeWithoutExtension}.d.ts`)
                )
              }
              if (
                importeeWithoutExtension.startsWith('.') &&
                importer != null &&
                importeeWithoutExtension.startsWith(VSCODE_SRC_DIR)
              ) {
                importee = path.relative(
                  VSCODE_SRC_DIR,
                  path.resolve(path.dirname(importer), importeeWithoutExtension)
                )
              }
              if (importeeWithoutExtension.startsWith('vs/')) {
                return path.join(VSCODE_SRC_DIR, `${importeeWithoutExtension}.d.ts`)
              }
              return undefined
            }
          },
          dts({
            respectExternal: true
          })
        ]
      }
  )
)
