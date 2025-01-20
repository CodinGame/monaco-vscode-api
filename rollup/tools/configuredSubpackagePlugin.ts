import { paramCase } from 'param-case'
import { v5 as uuidv5 } from 'uuid'
import chalk from 'chalk'
import * as rollup from 'rollup'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets'
import * as fs from 'node:fs'
import * as nodePath from 'node:path'
import { BASE_DIR, EXTENSIONS, pkg, external, VSCODE_SRC_DIR, DIST_DIR } from './config.js'
import carryDtsPlugin from '../plugins/rollup-carry-dts-plugin.js'
import subpackagePlugin, {
  type EntryGroup,
  type Manifest,
  type SubPackage,
  type SubPackageExternalDependency
} from '../plugins/rollup-subpackage-plugin.js'
import resolveAssetUrlPlugin from '../plugins/resolve-asset-url-plugin.js'

const COMMON_PACKAGE_NAME_UUID_NAMESPACE = '251b3eab-b5c9-4930-9c6c-6b38f697d291'

/**
 * Files to expose in the editor-api package (just exporting everyting from the corresponding VSCode file)
 * for compability with libraries that import internal monaco-editor modules
 */
const EDITOR_API_EXPOSE_MODULES = [
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
  'vs/editor/contrib/find/browser/findController'
]

const ALLOWED_MAIN_DEPENDENCIES = new Set(['@vscode/iconv-lite-umd', 'jschardet', 'marked'])

const workerGroups: Record<string, string> = {
  languageDetection: 'language-detection-worker',
  outputLinkComputer: 'output',
  textmate: 'textmate',
  notebook: 'notebook',
  localFileSearch: 'search'
}

export function configuredSubpackagePlugin(): rollup.Plugin {
  return subpackagePlugin({
    getEntryGroups(entrypoints, options) {
      const serviceOverrideDir = nodePath.resolve(options.dir!, 'service-override')
      const workersDir = nodePath.resolve(options.dir!, 'workers')

      const getGroupName = (id: string) => {
        if (id.startsWith(serviceOverrideDir)) {
          const name = paramCase(nodePath.basename(id, '.js'))
          return `service-override:${name}`
        }
        if (id.startsWith(workersDir)) {
          const name = workerGroups[nodePath.basename(id, '.worker.js')]
          return name != null ? `service-override:${name}` : 'main'
        }
        if (id === nodePath.resolve(options.dir!, 'editor.api.js')) {
          return 'editor.api'
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
          // console.log('ADDING DTS', entrypoint, dts)
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
              name: '@codingame/monaco-vscode-api',
              alias: 'vscode',
              version: '0.0.0-semantic-release',
              description: pkg.description
            }
          case 'editor.api':
            return {
              name: '@codingame/monaco-vscode-editor-api',
              alias: 'monaco-editor',
              version: '0.0.0-semantic-release',
              description: `${pkg.description} - monaco-editor compatible api`
            }
          default: {
            const match = /^(.*):(.*)$/.exec(uniqueGroup)!
            const [_, category, name] = match
            return {
              name: `@codingame/monaco-vscode-${paramCase(name!)}-${category}`,
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
          const [_, _category, name] = match
          return name
        })
        .join(', ')
      return {
        name: `@codingame/monaco-vscode-${uuidv5(Array.from(groups.values()).join('-'), COMMON_PACKAGE_NAME_UUID_NAMESPACE)}-common`,
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
      const isEditorApi = packageName === '@codingame/monaco-vscode-editor-api'
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
            include: ['**/*.ts', '**/*.js']
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
              if (source === 'vscode') {
                return {
                  external: true,
                  id: 'vscode'
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

      if (packageName === '@codingame/monaco-vscode-api') {
        rollupOptions.plugins = [
          rollupOptions.plugins,
          {
            name: 'reference-proposed-types',
            async renderChunk(code, chunk) {
              if (chunk.fileName.endsWith('extensions.d.ts')) {
                return `/// <reference path="./vscode-dts/vscode.proposed.d.ts" />\n${code}`
              }
              return undefined
            }
          }
        ]
      }

      if (packageName === '@codingame/monaco-vscode-editor-api') {
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
                return (
                  await fs.promises.readFile(
                    nodePath.resolve(BASE_DIR, 'monaco-editor/editor.api.d.ts')
                  )
                ).toString()
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
                  source: `export * from 'vscode/vscode/${modulePath}'`,
                  type: 'asset'
                })
                this.emitFile({
                  fileName: `esm/${modulePath}.d.ts`,
                  needsCodeReference: false,
                  source: `export * from 'vscode/vscode/${modulePath}'`,
                  type: 'asset'
                })
              }
              this.emitFile({
                fileName: 'esm/vs/editor/editor.worker.js',
                needsCodeReference: false,
                source: "export * from 'vscode/workers/editor.worker'",
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
      const externalTypeOnlyDependencies: SubPackageExternalDependency[] = []
      for (const externalDependency of allExternalDependencies) {
        if (
          Array.from(externalDependency.importers).some((importer) => !importer.endsWith('.d.ts'))
        ) {
          externalDependencies.push(externalDependency)
        } else {
          externalTypeOnlyDependencies.push(externalDependency)
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
        ),
        peerDependencies: Object.fromEntries(
          externalTypeOnlyDependencies.map((d) => {
            return [d.name, d.version]
          })
        ),
        peerDependenciesMeta: Object.fromEntries(
          externalTypeOnlyDependencies.map((d) => {
            return [d.name, { optional: true }]
          })
        )
      }
      switch (manifest.name!) {
        case '@codingame/monaco-vscode-api': {
          return <Manifest>{
            ...baseManifest,
            main: 'api.js',
            module: 'api.js',
            exports: {
              '.': {
                default: './api.js'
              },
              './vscode/*': {
                default: './vscode/src/*.js',
                types: './vscode/src/*.d.ts'
              },
              './*': {
                default: './*.js',
                types: './*.d.ts'
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
        case '@codingame/monaco-vscode-editor-api': {
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
                './vscode/*': {
                  default: './vscode/src/*.js',
                  types: './vscode/src/*.d.ts'
                },
                './*': {
                  default: './*.js',
                  types: './*.d.ts'
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
                './vscode/*': {
                  default: './vscode/src/*.js',
                  types: './vscode/src/*.d.ts'
                },
                ...(entrypoints.has('worker.js')
                  ? {
                      './worker': {
                        default: './worker.js'
                      }
                    }
                  : {}),
                './*': {
                  default: './*.js',
                  types: './*.d.ts'
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
      const mainPackage = subpackages.find((p) => p.name === '@codingame/monaco-vscode-api')!
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

      function createTree(moduleId: string, seen: Set<String> = new Set<string>()): Node[] {
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
