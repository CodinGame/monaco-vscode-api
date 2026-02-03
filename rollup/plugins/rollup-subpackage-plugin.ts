/**
 * Plugin allowing to generate multiple inter-dependant sub-packages from a single project
 * Only work when preserveModules is enabled
 * It is provided with a `getEntryGroups` function that provides groups that contain one or multiple entrypoint
 * Then it assigns every referenced modules (even non-entry) to their referenced group
 * Then it creates every group combinations (groupSet) so that every module is only referenced from a single groupSet (modules that are referenced from the main package are forced in the main package)
 * Then it tries to reduce the number of groupSet by merging small groupSets (smaller than `MERGEABLE_GROUP_MAX_SIZE` modules) that have a jaccard similarity greater than `MIN_MERGE_JACCARD_SIMILARITY` (in term of listed groups)
 * Then it runs rollup for each remaining groupSet
 */

import type { OutputOptions, Plugin, PluginContext } from 'rollup'
import * as rollup from 'rollup'
import thenby from 'thenby'
import type { PackageJson } from 'type-fest'
import * as nodePath from 'node:path'
import { builtinModules } from 'module'
import * as fs from 'node:fs'
import { execSync } from 'node:child_process'
import { sanitizeFileName } from '../tools/config'

export interface SubPackageModule {
  id: string
  imported: Set<string>
  importers: Set<string>
  isEntry: boolean
}
export interface SubPackageExternalDependency {
  name: string
  version: string
  importers: Set<string>
}

export interface SubPackage {
  name: string
  groups: Set<string>
  entrypoints: Set<string>
  modules: Set<string>
  externalDependencies: SubPackageExternalDependency[]
  packageDependencies: SubPackageDependency[]
}

export interface SubPackageDependency {
  package: SubPackage
  importers: Set<string>
}

const { firstBy } = thenby

function getInstalledVersion(libName: string) {
  const output = execSync(`npm ls ${libName} --json --depth 1 --long`).toString()
  const parsed: {
    dependencies: Record<string, { name: string; version: string }>
  } = JSON.parse(output)
  const details = parsed.dependencies[libName]

  return details
}

function splitArray<T>(
  set: T[],
  isInFirstSet: (item: T) => boolean
): { filtered: T[]; removed: T[] } {
  const filtered: T[] = []
  const removed: T[] = []
  for (const groupSet of set) {
    if (isInFirstSet(groupSet)) {
      filtered.push(groupSet)
    } else {
      removed.push(groupSet)
    }
  }
  return {
    filtered,
    removed
  }
}

export interface EntryGroup {
  name: string
  /**
   * Entrypoints of the group, used as rollup input
   */
  entrypoints: string[]
  /**
   * if it's a main group, as soon as a module is references from this group, it'll end up directly in that group insead of optionally generating a common package
   */
  main?: boolean
}

export type Manifest = PackageJson.PackageJsonStandard &
  PackageJson.NonStandardEntryPoints &
  PackageJson.TypeScriptConfiguration

export interface GroupSetName {
  name: string
  version?: string
  alias?: string
  description?: string
}
export interface Options {
  stage?: 'generateBundle' | 'writeBundle'
  /**
   * Move entrypoint into several groups
   */
  getEntryGroups(this: PluginContext, entrypoints: string[], options: OutputOptions): EntryGroup[]
  getGroupSetName(
    this: PluginContext,
    groups: Set<string>,
    externalDependencies: Set<string>
  ): GroupSetName
  /**
   * Override rollup configuration for subpackage
   */
  getRollupOptions?: (
    packageName: string,
    groups: Set<string>,
    options: rollup.RollupOptions
  ) => rollup.RollupOptions
  /**
   * For each module, refer to its configured main module to compute groups
   */
  getMainModule?: (id: string) => string | undefined
  /**
   * Override subpackage manifest
   */
  getManifest?: (
    this: PluginContext,
    packageName: string,
    groups: Set<string>,
    entrypoints: Set<string>,
    manifest: Manifest,
    externalDependencies: SubPackageExternalDependency[]
  ) => Manifest
  /**
   * How a file should be import from a subpackage to another subpackage
   */
  getInterPackageImport?: (path: string, groupSetName: GroupSetName) => string

  /**
   * Final step, provided with the subpackage tree and their dependencies
   */
  finalize?: (
    this: PluginContext,
    subpackages: SubPackage[],
    getModule: (path: string) => SubPackageModule | undefined
  ) => Promise<void>

  ignoreDependencies?: string[]
}

interface GroupSet {
  modules: Set<Module>
  groups: Set<string>
  externalDependencies: Set<string>
  transitiveExternalDependencies: Set<string>
}

interface Module {
  id: string
  dependencyIds: Set<string>
  importerIds: Set<string>
  /**
   * groups referencing the module
   */
  groups: Set<string>
  dependencies: Module[]
  importers: Module[]
  externalDependencies: Set<string>
  transitiveExternalDependencies: Set<string>

  isEntry: boolean
}

function computeGroupListKey(groupIds: Set<string>) {
  return JSON.stringify(Array.from(groupIds).sort())
}

export default ({
  getEntryGroups,
  getGroupSetName,
  getMainModule,
  getRollupOptions = (packageName, groups, options) => options,
  getManifest,
  getInterPackageImport = (path, groupName) => `${groupName.alias ?? groupName.name}/${path}`,
  finalize,
  stage = 'writeBundle',
  ignoreDependencies
}: Options): Plugin => ({
  name: 'subpackages',
  [stage]: async function (
    this: PluginContext,
    options: OutputOptions,
    bundle: rollup.OutputBundle
  ) {
    const allChunkIds = Object.keys(bundle)
    const allModules: Module[] = []

    const entryChunkIds: string[] = allChunkIds.filter((chunkId) => {
      const output = bundle[chunkId]!
      return output.type === 'chunk' && output.isEntry
    })

    const groups = getEntryGroups.call(
      this,
      entryChunkIds.map((chunkId) => nodePath.resolve(options.dir!, chunkId)),
      options
    )

    const declaredEntryChunkIds = new Set(
      groups
        .flatMap((g) => g.entrypoints)
        .map((entrypoint) => nodePath.relative(options.dir!, entrypoint))
    )

    const allEntryChunkIds = new Set([...declaredEntryChunkIds, ...allChunkIds])

    const moduleToChunk = new Map(
      Object.values(bundle)
        .filter((chunk) => chunk.type === 'chunk')
        .flatMap((chunk) =>
          chunk.moduleIds.map((moduleId) => <[string, rollup.OutputChunk]>[moduleId, chunk])
        )
    )

    // create a Module instance for each module absolute path
    const moduleMap = new Map<string, Module>()
    for (const moduleId of allEntryChunkIds) {
      const output = bundle[moduleId]

      if ((output == null || output.type !== 'chunk') && !declaredEntryChunkIds.has(moduleId)) {
        continue
      }
      const chunk = output != null && output.type === 'chunk' ? output : undefined

      const externalDependencies = new Set(
        chunk?.moduleIds.flatMap((moduleId) => {
          const moduleInfo = this.getModuleInfo(moduleId)!
          const importedModules = [...moduleInfo.importedIds, ...moduleInfo.dynamicallyImportedIds]
          return importedModules.filter((importedId) => this.getModuleInfo(importedId)!.isExternal)
        }) ?? []
      )

      const path = nodePath.resolve(options.dir!, moduleId)

      const getImporters = (moduleId: string): string[] => {
        const chunk = moduleToChunk.get(moduleId)
        if (chunk != null) {
          return [nodePath.resolve(options.dir!, chunk.fileName)]
        }
        // if the chunk doesn't exist, it's because the module only contains imports/exports, to continue to importers
        return this.getModuleInfo(moduleId)!.importers.flatMap(getImporters)
      }
      const module: Module = {
        id: path,
        groups: new Set(),
        dependencyIds: new Set(
          chunk != null ? [...chunk.imports, ...chunk.dynamicImports, ...chunk.referencedFiles] : []
        ),
        importerIds: new Set(
          chunk?.moduleIds
            .flatMap((moduleId) => this.getModuleInfo(moduleId)!.importers)
            .flatMap(getImporters)
        ),
        dependencies: [],
        importers: [],
        externalDependencies,
        transitiveExternalDependencies: new Set(),
        isEntry: false
      }
      allModules.push(module)
      moduleMap.set(path, module)
    }

    // Now that all module objects are created, create links between them
    for (const module of allModules) {
      module.dependencies = Array.from(module.dependencyIds)
        .map((moduleId) => moduleMap.get(nodePath.resolve(options.dir!, moduleId)))
        .filter((m) => m != null)

      module.importers = Array.from(module.importerIds)
        .map((moduleId) => moduleMap.get(nodePath.resolve(options.dir!, moduleId)))
        .filter((m) => m != null)
    }

    const getMainModuleIfExists = (module: Module) => {
      const mainModuleId = getMainModule?.(module.id)
      if (mainModuleId != null) {
        return moduleMap.get(mainModuleId) ?? null
      }
      return null
    }
    // Compute transitive external dependencies
    const propagateDependency = (module: Module, dependencies: string[]) => {
      const sizeBefore = module.transitiveExternalDependencies.size
      for (const dependency of dependencies) {
        module.transitiveExternalDependencies.add(dependency)
      }

      if (module.transitiveExternalDependencies.size > sizeBefore) {
        for (const importer of module.importers) {
          const mainModule = getMainModuleIfExists(importer)
          if (mainModule != null) {
            propagateDependency(mainModule, dependencies)
          }
        }
      }
    }
    for (const module of allModules) {
      const mainModule = getMainModuleIfExists(module)
      if (mainModule != null && mainModule.externalDependencies.size > 0) {
        propagateDependency(mainModule, Array.from(mainModule.externalDependencies))
      }
    }

    // group related entrypoint into groups
    const mainGroups = groups.filter((g) => g.main ?? false)
    const mainGroupNames = new Set(mainGroups.map((g) => g.name))
    const entryModuleGroups = new Map<string, string>()
    for (const group of groups) {
      for (const entrypoint of group.entrypoints) {
        entryModuleGroups.set(entrypoint, group.name)
      }
    }

    // Compute module group references
    function propagate(group: string, module: Module) {
      if (module.groups.has(group)) {
        return
      }
      module.groups.add(group)

      for (const dependency of module.dependencies) {
        // if this if the entry module of another subpackage, stop propagating
        const mainModule = getMainModule?.(dependency.id) ?? dependency.id
        const entryModuleGroup =
          entryModuleGroups.get(mainModule) ?? entryModuleGroups.get(dependency.id)

        if (entryModuleGroup != null && entryModuleGroup !== group) {
          continue
        }

        propagate(group, dependency)
      }
    }
    for (const group of groups) {
      for (const entrypoint of group.entrypoints) {
        const entryModule = moduleMap.get(entrypoint)!
        propagate(group.name, entryModule)
        entryModule.isEntry = true
      }
    }

    // create all combination groups
    const groupSetMap = new Map<string, GroupSet>()
    for (const module of allModules) {
      function getSingleMainGroup(groups: Set<string>) {
        const moduleMainGroups = new Set(Array.from(groups).filter((g) => mainGroupNames.has(g)))
        return moduleMainGroups.size === 1 ? moduleMainGroups : undefined
      }

      let mainModule = module
      const mainModuleId = getMainModule?.(module.id)
      if (mainModuleId != null) {
        mainModule = moduleMap.get(mainModuleId) ?? module
      }

      const groups = getSingleMainGroup(mainModule.groups) ?? mainModule.groups

      if (groups.size === 0) {
        continue
      }
      const groupSetKey = computeGroupListKey(
        // if the module is referenced from the main package, just ignore the other ones
        groups
      )
      let groupSet = groupSetMap.get(groupSetKey)
      if (groupSet == null) {
        groupSet = {
          groups,
          modules: new Set(),
          externalDependencies: new Set(),
          transitiveExternalDependencies: new Set()
        }
        groupSetMap.set(groupSetKey, groupSet)
      }
      groupSet.modules.add(module)
      for (const externalDependency of mainModule.externalDependencies) {
        groupSet.externalDependencies.add(externalDependency)
      }
      for (const externalDependency of mainModule.transitiveExternalDependencies!) {
        groupSet.transitiveExternalDependencies.add(externalDependency)
      }
    }
    const allGroupSets = Array.from(groupSetMap.values())

    // eslint-disable-next-line prefer-const
    let { filtered: entryGroupSets, removed: combinationGroupSets } = splitArray(
      allGroupSets,
      (groupSet) => groupSet.groups.size === 1
    )

    // Merge compatible common packages
    const includesAll = <T>(set: Set<T>, included: Set<T>) => {
      return Array.from(included).every((item) => set.has(item))
    }
    const setEquals = <T>(a: Set<T>, b: Set<T>) => {
      return a.size === b.size && includesAll(a, b)
    }
    const isIncluded = (a: GroupSet, b: GroupSet) => {
      return (
        includesAll(a.groups, b.groups) &&
        includesAll(a.transitiveExternalDependencies, b.transitiveExternalDependencies)
      )
    }
    const areMergeable = (a: GroupSet, b: GroupSet) => {
      if (setEquals(a.transitiveExternalDependencies, b.transitiveExternalDependencies)) return true
      return isIncluded(a, b) || isIncluded(b, a)
    }
    const merge = (a: GroupSet, b: GroupSet): GroupSet => {
      return {
        externalDependencies: new Set([...a.externalDependencies, ...b.externalDependencies]),
        transitiveExternalDependencies: new Set([
          ...a.transitiveExternalDependencies,
          ...b.transitiveExternalDependencies
        ]),
        groups: new Set([...a.groups, ...b.groups]),
        modules: new Set([...a.modules, ...b.modules])
      }
    }
    loop: for (;;) {
      for (let i = 0; i < combinationGroupSets.length; ++i) {
        const a = combinationGroupSets[i]!
        for (let j = i + 1; j < combinationGroupSets.length; ++j) {
          const b = combinationGroupSets[j]!
          if (areMergeable(a, b)) {
            combinationGroupSets = combinationGroupSets.filter((gs) => gs != a && gs != b)
            combinationGroupSets.push(merge(a, b))
            continue loop
          }
        }
      }
      break
    }

    // Merge groups with same dependencies as main package with it
    const mainGroupSets = entryGroupSets.filter(
      (gs) => gs.groups.size === 1 && mainGroupNames.has(Array.from(gs.groups)[0]!)
    )
    for (const mainGroupSet of mainGroupSets) {
      for (let i = combinationGroupSets.length - 1; i >= 0; --i) {
        const combinationGroupSet = combinationGroupSets[i]!
        if (
          includesAll(
            mainGroupSet.transitiveExternalDependencies,
            combinationGroupSet.transitiveExternalDependencies
          )
        ) {
          mainGroupSet.modules = new Set([...mainGroupSet.modules, ...combinationGroupSet.modules])
          mainGroupSet.externalDependencies = new Set([
            ...mainGroupSet.externalDependencies,
            ...combinationGroupSet.externalDependencies
          ])
          combinationGroupSets = combinationGroupSets.filter((gs) => gs !== combinationGroupSet)
        }
      }
    }

    const compareGroupSets = firstBy((groupset: GroupSet) => groupset.groups.size).thenBy(
      (groupset: GroupSet) => computeGroupListKey(groupset.groups)
    )

    const finalGroupSets = [...entryGroupSets, ...combinationGroupSets].sort(compareGroupSets)

    // associate all modules to their selected groupset
    const moduleGroupSets = new Map(
      finalGroupSets.flatMap((groupSet) => Array.from(groupSet.modules).map((m) => [m, groupSet]))
    )

    const subpackages: SubPackage[] = []
    const ownPackageAliases = new Map<string, { name: string; version?: string }>()
    const promises: Promise<void>[] = []
    for (const groupSet of finalGroupSets) {
      const {
        name: packageName,
        alias: packageAlias,
        version: packageVersion,
        description: packageDescription
      } = getGroupSetName.call(this, groupSet.groups, groupSet.transitiveExternalDependencies)
      ownPackageAliases.set(packageAlias ?? packageName, {
        name: packageName,
        version: packageVersion
      })

      this.info({
        message: `Bundling ${packageName}...`
      })

      function getPackageDirectory(packageName: string) {
        return packageName.replace(/^.*\//, '')
      }

      promises.push(
        (async () => {
          const subPackageOptions = getRollupOptions(packageName, groupSet.groups, {
            input: Array.from(groupSet.modules).map((module) => module.id),
            output: {
              preserveModules: true,
              preserveModulesRoot: options.dir!,
              minifyInternalExports: false,
              sanitizeFileName,
              assetFileNames: 'assets/[name][extname]',
              format: 'esm',
              dir: nodePath.resolve(options.dir!, `packages/${getPackageDirectory(packageName)}`),
              entryFileNames: '[name].js',
              chunkFileNames: '[name].js',
              hoistTransitiveImports: false
            },
            plugins: [
              {
                name: 'subpackage-custom-resolution',
                resolveId(source, importer) {
                  const resolved = nodePath.resolve(
                    (importer != null ? nodePath.dirname(importer) : undefined) ?? options.dir!,
                    source
                  )

                  const module = moduleMap.get(resolved) ?? moduleMap.get(resolved + '.js')
                  if (module == null) {
                    return undefined
                  }
                  const moduleGroupSet = moduleGroupSets.get(module)!
                  if (groupSet === moduleGroupSet) {
                    // in own package
                    return undefined
                  } else {
                    // It's from another package, mark it as optional
                    const groupName = getGroupSetName.call(
                      this,
                      moduleGroupSet.groups,
                      moduleGroupSet.transitiveExternalDependencies
                    )
                    return {
                      id: getInterPackageImport(
                        nodePath.relative(options.dir!, resolved),
                        groupName
                      ),
                      external: true
                    }
                  }
                }
              },
              {
                name: 'bundle-generator',
                generateBundle(options, bundle: rollup.OutputBundle) {
                  if (getManifest == null) {
                    return
                  }
                  const externalDependencies: SubPackageExternalDependency[] = Array.from(
                    Array.from(this.getModuleIds())
                      .map((id) => this.getModuleInfo(id)!)
                      .filter((infos) => infos.isExternal)
                      .flatMap((infos): SubPackageExternalDependency[] => {
                        const match = /^(?:@[^/]*\/)?[^/]*/.exec(infos.id)
                        if (
                          match != null &&
                          !builtinModules.includes(match[0]) &&
                          match[0] !== (packageAlias ?? packageName)
                        ) {
                          const name = match[0]
                          let version = '*'
                          if (ownPackageAliases.has(name)) {
                            const packageDetails = ownPackageAliases.get(name)!
                            if (packageDetails.name !== name) {
                              version = `npm:${packageDetails.name}@${packageDetails.version ?? '*'}`
                            } else if (packageDetails.version != null) {
                              version = packageDetails.version
                            }
                          } else {
                            if (ignoreDependencies != null && ignoreDependencies.includes(name)) {
                              return []
                            }
                            try {
                              const installedVersion = getInstalledVersion(name)
                              if (installedVersion == null) {
                                this.error({ message: `Unable to find version of ${name}` })
                              }
                              if (installedVersion.name !== name) {
                                version = `npm:${installedVersion.name}@${installedVersion.version ?? '*'}`
                              } else {
                                version = installedVersion.version!
                              }
                            } catch (err) {
                              console.error(err)
                              this.error({
                                message: `Unable to find version of ${name}`,
                                stack: (err as Error).stack
                              })
                            }
                          }

                          return [
                            {
                              name,
                              version,
                              importers: new Set([...infos.importers, ...infos.dynamicImporters])
                            }
                          ]
                        } else {
                          return []
                        }
                      })
                      .reduce<Map<string, SubPackageExternalDependency>>((map, dependency) => {
                        const existing = map.get(dependency.name)
                        if (existing == null) {
                          map.set(dependency.name, { ...dependency })
                        } else {
                          for (const importer of dependency.importers) {
                            existing.importers.add(importer)
                          }
                        }
                        return map
                      }, new Map<string, SubPackageExternalDependency>())
                      .values()
                  ).sort(firstBy((d) => d.name))

                  const entrypoints = new Set(
                    groupSet.groups.size === 1
                      ? Object.values(bundle)
                          .filter((c) => c.type === 'chunk' && c.isEntry)
                          .map((c) => c.fileName)
                      : []
                  )

                  subpackages.push({
                    name: packageName,
                    groups: groupSet.groups,
                    modules: new Set(this.getModuleIds()),
                    entrypoints,
                    externalDependencies,
                    packageDependencies: []
                  })

                  const manifest = getManifest.call(
                    this,
                    packageName,
                    groupSet.groups,
                    entrypoints,
                    {
                      name: packageName,
                      version: packageVersion,
                      description: packageDescription,
                      type: 'module',
                      dependencies: Object.fromEntries(
                        externalDependencies.map((d) => {
                          return [d.name, d.version]
                        })
                      )
                    },
                    externalDependencies
                  )
                  this.emitFile({
                    fileName: 'package.json',
                    needsCodeReference: false,
                    source: JSON.stringify(manifest, null, 2),
                    type: 'asset'
                  })
                }
              }
            ]
          })
          const subpackageBundle = await rollup.rollup(subPackageOptions)

          this.info({
            message: `Generating ${packageName}...`
          })

          await subpackageBundle.write(subPackageOptions.output as OutputOptions)
          await subpackageBundle.close()
        })().catch((err) => {
          throw new Error(`Unable to build subpackage ${packageName}: ${err.message}`)
        })
      )
    }

    await Promise.all(promises)

    const subpackageMap = new Map<string, SubPackage>(subpackages.map((p) => [p.name, p]))

    // transform dependencies => externalDependencies + packageDependencies
    for (const subpackage of subpackages) {
      const dependencies = subpackage.externalDependencies
      subpackage.externalDependencies = []
      for (const dependency of dependencies) {
        const packageDependency = subpackageMap.get(
          ownPackageAliases.get(dependency.name)?.name ?? dependency.name
        )
        if (packageDependency != null) {
          subpackage.packageDependencies.push({
            package: packageDependency,
            importers: dependency.importers
          })
        } else {
          subpackage.externalDependencies.push(dependency)
        }
      }
    }

    await finalize?.call(this, subpackages, (moduleId) => {
      const module = moduleMap.get(moduleId)
      if (module != null) {
        return {
          id: moduleId,
          imported: module.dependencyIds,
          importers: module.importerIds,
          isEntry: module.isEntry
        }
      }
      return undefined
    })

    // Remove tmp directory
    try {
      await fs.promises.rm(options.dir!, {
        recursive: true
      })
    } catch {
      // ignore, may not exists
    }
  }
})
