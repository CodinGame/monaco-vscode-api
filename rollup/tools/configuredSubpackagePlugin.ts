import * as changeCase from 'change-case'
import { v5 as uuidv5 } from 'uuid'
import chalk from 'chalk'
import * as rollup from 'rollup'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import importMetaAssets from '../plugins/import-meta-assets-plugin.js'
import * as fs from 'node:fs'
import * as nodePath from 'node:path'
import {
  BASE_DIR,
  EXTENSIONS,
  pkg,
  external,
  VSCODE_SRC_DIR,
  DIST_DIR,
  MAIN_PACKAGE_NAME,
  EDITOR_API_PACKAGE_NAME,
  EXTENSION_API_PACKAGE_NAME,
  DIST_DIR_MAIN
} from './config.js'
import carryDtsPlugin from '../plugins/rollup-carry-dts-plugin.js'
import subpackagePlugin, {
  type EntryGroup,
  type Manifest,
  type SubPackage,
  type SubPackageExternalDependency
} from '../plugins/rollup-subpackage-plugin.js'
import resolveAssetUrlPlugin from '../plugins/resolve-asset-url-plugin.js'
import css from '../plugins/css-import-plugin.js'

const COMMON_PACKAGE_NAME_UUID_NAMESPACE = '251b3eab-b5c9-4930-9c6c-6b38f697d291'

/**
 * Files to expose in the editor-api package (just exporting everyting from the corresponding VSCode file)
 * for compability with libraries that import internal monaco-editor modules
 */
const EDITOR_API_EXPOSE_MODULES = [
  // language workers
  'vs/editor/editor.worker.start',

  // use by monaco-vim
  'vs/editor/common/commands/shiftCommand',
  'vs/editor/browser/config/tabFocus',

  // monaco-graphql
  'vs/editor/contrib/inlineCompletions/browser/inlineCompletions.contribution',
  'vs/editor/contrib/format/browser/formatActions',
  'vs/editor/contrib/bracketMatching/browser/bracketMatching',
  'vs/editor/contrib/hover/browser/hoverContribution',
  'vs/editor/browser/coreCommands',
  'vs/editor/contrib/clipboard/browser/clipboard',
  'vs/editor/contrib/cursorUndo/browser/cursorUndo',
  'vs/editor/contrib/contextmenu/browser/contextmenu',
  'vs/editor/contrib/find/browser/findController',

  // GraphiQL
  'vs/base/common/uri',
  'vs/editor/common/services/editorBaseApi',
  'vs/editor/common/standalone/standaloneEnums',
  'vs/editor/browser/controller/mouseTarget',
  'vs/editor/common/core/range',
]

const ALLOWED_MAIN_DEPENDENCIES = new Set([
  '@vscode/iconv-lite-umd',
  'jschardet',
  'marked',
  'dompurify'
])

const workerGroups: Record<string, string> = {
  languageDetection: 'service-override:language-detection-worker',
  outputLinkComputer: 'service-override:output',
  textmate: 'service-override:textmate',
  notebook: 'service-override:notebook',
  localFileSearch: 'service-override:search'
}

export function configuredSubpackagePlugin(): rollup.Plugin {
  return subpackagePlugin({
    getEntryGroups(entrypoints, options) {
      const serviceOverrideDir = nodePath.resolve(options.dir!, 'service-override')
      const workersDir = nodePath.resolve(options.dir!, 'workers')

      const getGroupName = (id: string) => {
        if (id.startsWith(serviceOverrideDir)) {
          const name = changeCase.kebabCase(nodePath.basename(id, '.js'))
          return `service-override:${name}`
        }
        if (id === nodePath.resolve(options.dir!, 'editor.api.js')) {
          return 'editor.api'
        }
        if (
          id === nodePath.resolve(options.dir!, 'extension.api.js') ||
          id === nodePath.resolve(options.dir!, 'localExtensionHost.js')
        ) {
          return 'extension.api'
        }
        if (id.startsWith(workersDir)) {
          const name = workerGroups[nodePath.basename(id, '.worker.js')]
          return name != null ? name : 'main'
        }
        return 'main'
      }

      const groupMaps = new Map<string, EntryGroup>()
      for (const entrypoint of entrypoints) {
        const name = getGroupName(entrypoint)

        const group: EntryGroup = groupMaps.get(name) ?? {
          name,
          entrypoints: [],
          main: name === 'main'
        }
        groupMaps.set(name, group)
        group.entrypoints.push(entrypoint)
        const dts = entrypoint.replace(/\.js$/, '.d.ts')
        if (fs.existsSync(dts)) {
          group.entrypoints.push(dts)
        }
      }

      return Array.from(groupMaps.values())
    },
    getGroupSetName(groups) {
      if (groups.size === 1) {
        const uniqueGroup = groups.values().next().value!
        switch (uniqueGroup) {
          case 'main':
            return {
              name: MAIN_PACKAGE_NAME,
              version: '0.0.0-semantic-release',
              description: pkg.description
            }
          case 'editor.api':
            return {
              name: EDITOR_API_PACKAGE_NAME,
              alias: 'monaco-editor',
              version: '0.0.0-semantic-release',
              description: `${pkg.description} - monaco-editor compatible api`
            }
          case 'extension.api':
            return {
              name: EXTENSION_API_PACKAGE_NAME,
              alias: 'vscode',
              version: '0.0.0-semantic-release',
              description: `${pkg.description} - VSCode extension compatible api`
            }
          default: {
            const match = /^(.*):(.*)$/.exec(uniqueGroup)
            if (match == null) {
              throw new Error(`Unable to parse group "${uniqueGroup}"`)
            }
            const [, category, name] = match
            return {
              name: `@codingame/monaco-vscode-${changeCase.kebabCase(name!)}-${category}`,
              version: '0.0.0-semantic-release',
              description: `${pkg.description} - ${name} ${category}`
            }
          }
        }
      }

      const name = Array.from(groups.values())
        .slice()
        .sort()
        .map((groupName) => {
          const match = /^(.*):(.*)$/.exec(groupName)
          if (match == null) {
            return groupName
          }
          return match[2]
        })
        .join(', ')
      return {
        name: `@codingame/monaco-vscode-${uuidv5(Array.from(groups.values()).sort().join('-'), COMMON_PACKAGE_NAME_UUID_NAMESPACE)}-common`,
        version: '0.0.0-semantic-release',
        description: `${pkg.description} - common package (${name})`
      }
    },
    getMainModule(id) {
      // attach .d.ts files to their .js file
      return id.replace(/\.d\.ts$/, '.js')
    },
    getRollupOptions(packageName, groups, options) {
      const isCommonPackage = groups.size > 1
      const isEditorApi = packageName === EDITOR_API_PACKAGE_NAME
      const needsEmptyModule = isCommonPackage || isEditorApi

      const rollupOptions: rollup.RollupOptions = {
        ...options,
        treeshake: false,
        external,
        output: {
          ...options.output,
          dir: `dist/packages/${packageName.replace(/^.*\//, '')}`
        },
        plugins: [
          options.plugins,
          importMetaAssets({
            include: ['**/*.ts', '**/*.js'],
            preserveAssetsRoot: DIST_DIR_MAIN
          }),
          css({
            preserveAssetsRoot: DIST_DIR_MAIN
          }),
          commonjs({
            include: '**/vscode-semver/**/*'
          }),
          resolveAssetUrlPlugin(),
          nodeResolve({
            extensions: EXTENSIONS
          }),
          carryDtsPlugin({
            external
          }),
          {
            name: 'resolve-vscode',
            resolveId(source) {
              if (source === 'vscode' || source === 'monaco-editor') {
                return {
                  external: true,
                  id: source
                }
              }
              return undefined
            }
          },
          needsEmptyModule
            ? {
                name: 'empty-file-generator',
                generateBundle() {
                  this.emitFile({
                    fileName: 'empty.js',
                    needsCodeReference: false,
                    source: 'export {}',
                    type: 'asset'
                  })
                }
              }
            : []
        ]
      }

      rollupOptions.plugins = [
        rollupOptions.plugins,
        {
          name: 'reference-proposed-types',
          async renderChunk(code, chunk) {
            if (packageName === MAIN_PACKAGE_NAME && chunk.fileName.endsWith('extensions.d.ts')) {
              return `
import './vscode-dts/vscode.proposed.d.ts'
import './vscode-dts/vscode.d.ts'
${code}`
            }
            if (
              packageName === EXTENSION_API_PACKAGE_NAME &&
              chunk.fileName.endsWith('extension.api.d.ts')
            ) {
              return `
import '${MAIN_PACKAGE_NAME}/vscode-dts/vscode'
import '${MAIN_PACKAGE_NAME}/vscode-dts/vscode.proposed'
${code}`
            }
            return undefined
          }
        }
      ]

      if (packageName === EDITOR_API_PACKAGE_NAME) {
        rollupOptions.input = {
          'esm/vs/editor/editor.api': (rollupOptions.input as string[])[0]!,
          'esm/vs/editor/editor.api.d': (rollupOptions.input as string[])[0]!.replace(
            /\.js$/,
            '.d.ts'
          )
        }
        rollupOptions.plugins = [
          rollupOptions.plugins,
          {
            name: 'replace-editor-types',
            async renderChunk(code, chunk) {
              if (chunk.fileName.endsWith('vscode/src/vs/editor/editor.api.d.ts')) {
                const monacoEditorTypes = (
                  await fs.promises.readFile(
                    nodePath.resolve(BASE_DIR, 'monaco-editor/editor.api.d.ts')
                  )
                ).toString()

                const monacoWorkerTypes = Array.from(
                  monacoEditorTypes.matchAll(/export namespace languages\..*?^}/gms)
                )
                  .map((match) => match[0])
                  .join('\n')

                return `${code}\n${monacoWorkerTypes}`
              }
              return undefined
            }
          },
          {
            name: 'editor-api-expose-modules',
            async generateBundle() {
              for (const modulePath of EDITOR_API_EXPOSE_MODULES) {
                // make sure file exists
                fs.statSync(nodePath.resolve(VSCODE_SRC_DIR, `${modulePath}.js`))
                this.emitFile({
                  fileName: `esm/${modulePath}.js`,
                  needsCodeReference: false,
                  source: `export * from '${MAIN_PACKAGE_NAME}/vscode/${modulePath}'`,
                  type: 'asset'
                })
                this.emitFile({
                  fileName: `esm/${modulePath}.d.ts`,
                  needsCodeReference: false,
                  source: `export * from '${MAIN_PACKAGE_NAME}/vscode/${modulePath}'`,
                  type: 'asset'
                })
              }
              this.emitFile({
                fileName: 'esm/vs/editor/editor.worker.js',
                needsCodeReference: false,
                source: `export * from '${MAIN_PACKAGE_NAME}/workers/editor.worker'`,
                type: 'asset'
              })
              this.emitFile({
                fileName: 'esm/vs/editor/edcore.main.js',
                needsCodeReference: false,
                source: `export * from './editor.api.js';`,
                type: 'asset'
              })
            }
          }
        ]
      }

      if (groups.size === 1 && groups.values().next().value!.startsWith('service-override:')) {
        // replace input list by Record to be able to name the entrypoint "index" and the worker entrypoint "worker"
        const serviceOverrideEntryPoint = (rollupOptions.input as string[]).find((e) =>
          e.includes('/service-override/')
        )!
        const workerEntryPoint = (rollupOptions.input as string[]).find((e) =>
          e.includes('/workers/')
        )

        rollupOptions.input = {
          index: serviceOverrideEntryPoint,
          'index.d': serviceOverrideEntryPoint.replace(/\.js$/, '.d.ts'),
          ...(workerEntryPoint != null
            ? {
                worker: workerEntryPoint
              }
            : {})
        }
      }

      return rollupOptions
    },
    getInterPackageImport(path, groupSetName) {
      if (/service-override\/[a-zA-Z]+\.(js|d\.ts)$/.exec(path) != null) {
        // reference the package entrypoint
        return groupSetName.alias ?? groupSetName.name
      }
      return `${groupSetName.alias ?? groupSetName.name}/${path.replace(/vscode\/src\//, 'vscode/').replace(/\.(js|d\.ts)$/, '')}`
    },
    getManifest(packageName, groups, entrypoints, manifest, allExternalDependencies) {
      const externalDependencies: SubPackageExternalDependency[] = []
      for (const externalDependency of allExternalDependencies) {
        if (
          Array.from(externalDependency.importers).some((importer) => !importer.endsWith('.d.ts'))
        ) {
          externalDependencies.push(externalDependency)
        }
      }

      const baseManifest: Manifest = {
        ...Object.fromEntries(
          Object.entries(pkg).filter(([key]) =>
            [
              'name',
              'description',
              'version',
              'keywords',
              'author',
              'license',
              'repository',
              'type',
              'private'
            ].includes(key)
          )
        ),
        private: false,
        ...manifest,
        dependencies: Object.fromEntries(
          externalDependencies.map((d) => {
            return [d.name, d.version]
          })
        )
      }
      switch (manifest.name!) {
        case MAIN_PACKAGE_NAME: {
          return <Manifest>{
            ...baseManifest,
            main: 'services.js',
            module: 'services.js',
            exports: {
              '.': {
                types: './services.d.ts',
                default: './services.js'
              },
              './vscode/*.css': {
                default: './vscode/src/*.css'
              },
              './vscode/*': {
                types: './vscode/src/*.d.ts',
                default: './vscode/src/*.js'
              },
              './*': {
                types: './*.d.ts',
                default: './*.js'
              }
            },
            typesVersions: {
              '*': {
                services: ['./services.d.ts'],
                extensions: ['./extensions.d.ts'],
                'service-override/*': ['./service-override/*.d.ts'],
                monaco: ['./monaco.d.ts'],
                assets: ['./assets.d.ts'],
                lifecycle: ['./lifecycle.d.ts'],
                l10n: ['./l10n.d.ts'],
                'vscode/*': ['./vscode/src/*.d.ts']
              }
            }
          }
        }
        case EXTENSION_API_PACKAGE_NAME: {
          return <Manifest>{
            ...baseManifest,
            main: 'extension.api.js',
            module: 'extension.api.js',
            exports: {
              '.': {
                default: './extension.api.js'
              },
              './vscode/*.css': {
                default: './vscode/src/*.css'
              },
              './vscode/*': {
                types: './vscode/src/*.d.ts',
                default: './vscode/src/*.js'
              },
              './*': {
                types: './*.d.ts',
                default: './*.js'
              }
            },
            typesVersions: {
              '*': {
                'vscode/*': ['./vscode/src/*.d.ts']
              }
            }
          }
        }
        case EDITOR_API_PACKAGE_NAME: {
          return <Manifest>{
            ...baseManifest,
            exports: {
              '.': './esm/vs/editor/editor.api.js',
              ...Object.fromEntries(
                [
                  'vs/editor/editor.api',
                  'vs/editor/editor.worker',
                  ...EDITOR_API_EXPOSE_MODULES
                ].flatMap((module) => {
                  return Object.entries({
                    [`./esm/${module}`]: `./esm/${module}.js`,
                    [`./esm/${module}.js`]: `./esm/${module}.js`
                  })
                })
              ),
              './esm/vs/basic-languages/*': './empty.js',
              './esm/vs/language/*': './empty.js'
            },
            main: 'esm/vs/editor/editor.api.js',
            module: 'esm/vs/editor/editor.api.js',
            types: 'esm/vs/editor/editor.api.d.ts'
          }
        }
        default: {
          if (groups.size > 1) {
            // common package
            return <Manifest>{
              ...baseManifest,
              exports: {
                '.': {
                  default: './empty.js'
                },
                './vscode/*.css': {
                  default: './vscode/src/*.css'
                },
                './vscode/*': {
                  types: './vscode/src/*.d.ts',
                  default: './vscode/src/*.js'
                },
                './*': {
                  types: './*.d.ts',
                  default: './*.js'
                }
              },
              typesVersions: {
                '*': {
                  'vscode/*': ['./vscode/src/*.d.ts']
                }
              }
            }
          } else {
            // service-override package
            return {
              ...baseManifest,
              main: 'index.js',
              module: 'index.js',
              types: 'index.d.ts',
              exports: {
                '.': {
                  default: './index.js'
                },
                './vscode/*.css': {
                  default: './vscode/src/*.css'
                },
                './vscode/*': {
                  types: './vscode/src/*.d.ts',
                  default: './vscode/src/*.js'
                },
                ...(entrypoints.has('worker.js')
                  ? {
                      './worker': {
                        default: './worker.js'
                      }
                    }
                  : {}),
                './*': {
                  types: './*.d.ts',
                  default: './*.js'
                }
              },
              typesVersions: {
                '*': {
                  'vscode/*': ['./vscode/src/*.d.ts']
                }
              }
            }
          }
        }
      }
    },
    async finalize(subpackages, getModule) {
      const mainSubpackageDependencies = new Set<SubPackage>()

      interface DependencyImporter {
        packagePath: string[]
        importers: Set<string>
      }
      interface Dependency {
        name: string
        importers: DependencyImporter[]
      }

      const mainDependenciesMap = new Map<string, Dependency>()

      const propagate = (subpackage: SubPackage, path: string[]) => {
        if (mainSubpackageDependencies.has(subpackage)) {
          return
        }
        mainSubpackageDependencies.add(subpackage)

        for (const dependency of subpackage.externalDependencies) {
          const importers = new Set(
            Array.from(dependency.importers).filter((importer) => !importer.endsWith('.d.ts'))
          )
          if (importers.size === 0) {
            continue
          }

          let existing = mainDependenciesMap.get(dependency.name)
          if (existing == null) {
            existing = {
              name: dependency.name,
              importers: []
            }
            mainDependenciesMap.set(dependency.name, existing)
          }

          existing.importers.push({
            importers,
            packagePath: [...path, subpackage.name]
          })
        }

        for (const dependency of subpackage.packageDependencies) {
          if (Array.from(dependency.importers).every((importer) => importer.endsWith('.d.ts'))) {
            continue
          }
          propagate(dependency.package, [...path, subpackage.name])
        }
      }
      const mainPackage = subpackages.find((p) => p.name === MAIN_PACKAGE_NAME)!
      propagate(mainPackage, [])

      const mainDependencies = Array.from(mainDependenciesMap.values())

      const notAllowedDependencies = mainDependencies.filter(
        (d) => !ALLOWED_MAIN_DEPENDENCIES.has(d.name)
      )

      interface Node {
        module: string
        subpackage?: string
        importers: Node[]
      }

      function createTree(moduleId: string, seen: Set<string> = new Set<string>()): Node[] {
        const subpackage = subpackages.find((p) => p.modules.has(moduleId))

        if (subpackage != null && !mainSubpackageDependencies.has(subpackage)) {
          return []
        }

        if (seen.has(moduleId)) {
          return [
            {
              module: `dedup: ${moduleId}`,
              subpackage: subpackage?.name,
              importers: []
            }
          ]
        }

        seen = new Set([...seen, moduleId])
        const module = getModule(moduleId)

        return [
          {
            module: moduleId,
            subpackage: subpackage?.name,
            importers: Array.from(module!.importers).flatMap((module) => createTree(module, seen))
          }
        ]
      }

      for (const notAllowedDependency of notAllowedDependencies) {
        const importers = notAllowedDependency.importers.flatMap((pack) =>
          Array.from(pack.importers)
        )

        const tree = importers.flatMap((module) => createTree(module))

        function printTree(node: Node, prefix: string = '', isLast: boolean = true): string[] {
          const connector = isLast ? '└── ' : '├── '

          const leaf = node.importers.length === 0

          let module = nodePath.relative(DIST_DIR, node.module)
          if (leaf) {
            module = chalk.blue(module)
          }
          const content = [`${prefix}${connector}${module} (${node.subpackage ?? 'unknown'})`]

          const newPrefix = prefix + (isLast ? '    ' : '│   ')
          const childCount = node.importers.length

          node.importers.forEach((child, index) => {
            const isChildLast = index === childCount - 1
            content.push(...printTree(child, newPrefix, isChildLast))
          })
          return content
        }

        const renderedTree = printTree({
          importers: tree,
          module: notAllowedDependency.name
        }).join('\n')

        this.error(`Not allowed dependency ${notAllowedDependency.name}:\n${renderedTree}`)
      }
    }
  })
}
