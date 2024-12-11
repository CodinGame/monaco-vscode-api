import nodeResolve from '@rollup/plugin-node-resolve'
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets'
import type { ModuleInfo, OutputOptions, Plugin, PluginContext } from 'rollup'
import firstBy from 'thenby'
import * as rollup from 'rollup'

function jaccardSimilarity(a: GroupSet, b: GroupSet) {
  const intersectionSize = Array.from(a.groups).filter((x) => b.groups.has(x)).length
  const unionSize = new Set([...a.groups, ...b.groups]).size

  return intersectionSize / unionSize
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

interface Options {
  stage?: 'generateBundle' | 'writeBundle'
  getEntryGroups: (
    entrypoints: string[],
    options: OutputOptions
  ) => { name: string; entrypointNames: Map<string, string> }[]
}

interface GroupSet {
  modules: Set<Module>
  groups: Set<string>
}

interface Module {
  id: string
  /**
   * Is only defined if the module is an entrypoint
   */
  entrypointName?: string
  moduleInfo: ModuleInfo
  groups: Set<string>
  dependencies: Module[]
}

function computeGroupListKey(groupIds: Set<string>) {
  return JSON.stringify(Array.from(groupIds).sort())
}

export default ({ getEntryGroups, stage = 'generateBundle' }: Options): Plugin => ({
  name: 'subpackages',
  [stage]: async function (this: PluginContext, options: OutputOptions) {
    const allModulesIds = Array.from(this.getModuleIds())
    const allModules: Module[] = []

    const entryModules: Module[] = []

    // create a Module instance for each module id
    const moduleMap = new Map<string, Module>()
    for (const moduleId of allModulesIds) {
      const moduleInfo = this.getModuleInfo(moduleId)!

      const module: Module = {
        id: moduleId,
        groups: new Set(),
        moduleInfo,
        dependencies: []
      }
      if (moduleInfo.isEntry) {
        entryModules.push(module)
      }
      allModules.push(module)
      moduleMap.set(moduleId, module)
    }

    // Now that all module objects are created, create links between them
    for (const module of allModules) {
      module.dependencies = [
        ...module.moduleInfo.importedIds,
        ...module.moduleInfo.dynamicallyImportedIds
      ].map((moduleId) => moduleMap.get(moduleId)!)
    }

    // group related entrypoint into groups
    const groups = getEntryGroups(
      entryModules.map((module) => module.id),
      options
    )

    // console.log({ entrygroups: JSON.stringify(groups, null, 2) })

    // Compute module group references
    function propagate(group: string, module: Module) {
      if (module.groups.has(group)) {
        return
      }
      module.groups.add(group)

      for (const dependency of module.dependencies) {
        propagate(group, dependency)
      }
    }
    for (const group of groups) {
      for (const [entrypoint, entrypointName] of Array.from(group.entrypointNames.entries())) {
        const entryModule = moduleMap.get(entrypoint)!
        entryModule.entrypointName = entrypointName
        propagate(group.name, entryModule)
      }
    }

    // create all combination groups
    const groupMap = new Map<string, GroupSet>()
    for (const module of allModules) {
      const groups = module.groups.has('main') ? new Set(['main']) : module.groups
      const groupSetKey = computeGroupListKey(
        // if the module is referenced from the main package, just ignore the other ones
        // TODO parametrize main
        groups
      )
      let groupSet = groupMap.get(groupSetKey)
      if (groupSet == null) {
        groupSet = {
          groups,
          modules: new Set()
        }
        groupMap.set(groupSetKey, groupSet)
      }
      groupSet.modules.add(module)
    }
    const allGroupSets = Array.from(groupMap.values())

    let { filtered: entryGroupSets, removed: combinationGroupSets } = splitArray(
      allGroupSets,
      (groupSet) => groupSet.groups.size === 1
    )

    // console.log({ entryGroupSets: entryGroupSets.map((s) => s.groups) })

    // only keep those that we can merge
    const isMergeable = (groupSet: GroupSet) => {
      // TODO constant
      if (groupSet.modules.size > 10) {
        // do not merge groups that are already too big
        return false
      }
      if (Array.from(groupSet.modules).some((module) => module.moduleInfo.isExternal)) {
        // do not merge groups referencing external modules
        return false
      }
      return true
    }

    const compareGroupSets = firstBy((groupset: GroupSet) => groupset.groups.size).thenBy(
      (groupset: GroupSet) => computeGroupListKey(groupset.groups)
    )

    // try to merge mergeable groups
    const getMergeableGroupSets = () =>
      combinationGroupSets.filter(isMergeable).sort(compareGroupSets)

    let mergeableGroupSets = getMergeableGroupSets()
    do {
      let bestSimilarity = -1
      let bestSimlilarityGroupSets: [GroupSet, GroupSet] | undefined
      for (let i = 0; i < mergeableGroupSets.length; ++i) {
        for (let j = i + 1; j < mergeableGroupSets.length; ++j) {
          const a = mergeableGroupSets[i]!
          const b = mergeableGroupSets[j]!
          const similarity = jaccardSimilarity(a, b)
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity
            bestSimlilarityGroupSets = [a, b]
          }
        }
      }

      if (bestSimilarity < 0.5) {
        break
      }

      if (bestSimlilarityGroupSets != null) {
        const [to, from] = bestSimlilarityGroupSets
        // console.log('mergin', to.groups, from.groups)
        // remove 2nd group
        combinationGroupSets = combinationGroupSets.filter((groupSet) => groupSet !== from)

        // merge 2nd group into first one
        from.groups.forEach((group) => to.groups.add(group))
        from.modules.forEach((module) => to.modules.add(module))
      }

      // update
      mergeableGroupSets = getMergeableGroupSets()
    } while (mergeableGroupSets.length > 1)

    const finalGroupSets = [...entryGroupSets, ...combinationGroupSets].sort(compareGroupSets)

    for (const groupSet of finalGroupSets) {
      const entryModules = Array.from(groupSet.modules).filter(
        (module) => module.entrypointName != null
      )

      const groupBundle = await rollup.rollup({
        input: Object.fromEntries(
          entryModules.map((module) => [module.entrypointName!, module.id])
        ),
        treeshake: false,
        plugins: [
          importMetaAssets({
            include: ['**/*.ts', '**/*.js']
            // assets are externals and this plugin is not able to ignore external assets
          }),
          nodeResolve({
            extensions: ['', '.ts', '.js']
          }),
          {
            name: 'custom-resolution',
            resolveId(source, importer, options) {}
          },
          {
            name: 'bundle-generator',
            generateBundle() {
              // this.emitFile({
              //   fileName: 'package.json',
              //   needsCodeReference: false,
              //   source: JSON.stringify(packageJson, null, 2),
              //   type: 'asset'
              // })
            }
          }
        ]
      })

      console.log(
        Array.from(groupSet.groups).join(', ') +
          ' => ' +
          groupSet.modules.size +
          ' (' +
          Array.from(groupSet.modules)
            .map((m) => m.id)
            .slice(0, 5)
            .join(', ') +
          ') ' +
          Array.from(groupSet.modules)
            .filter((module) => module.moduleInfo.isExternal)
            .map((m) => m.id)
      )
    }
    // console.log(
    //   keptGroupSets.map(
    //     (groupSet) => Array.from(groupSet.groups).join(', ') + ' => ' + groupSet.modules.size + '(' + Array.from(groupSet.modules).slice(0, 5).join(', ') + ')'
    //   )
    // )
    //
  }
})
