import type { OutputBundle, OutputOptions, Plugin, PluginContext } from 'rollup'
import { builtinModules } from 'module'

interface Group {
  name: string
  publicName?: string
  modules: Set<string>
  entrypoints: Set<string>
  dependencies: Set<string>
  groupDependencies: Set<string>
  // A greater priority means the that this group will be chosen for module present in multiple groups
  priority: number
  isCombination: boolean
}

interface GroupResult {
  name: string
  directDependencies: Set<string>
  exclusiveModules: Set<string>
  entrypoints: Set<string>
  isCombination: boolean
}

interface Options {
  stage?: 'generateBundle' | 'writeBundle'
  getGroup?: (
    entryPoint: string,
    options: OutputOptions
  ) => { name: string; publicName?: string; priority?: number }
  handle(
    this: PluginContext,
    params: {
      group: GroupResult
      moduleGroupName: Map<string, string | undefined>
      otherDependencies: Set<string>
      otherModules: Set<string>
      options: OutputOptions
      bundle: OutputBundle
    }
  ): void | Promise<void>
  // Should shared modules be put in new combination groups
  // By default, they are put in the group with the highest priority
  generateCombinationGroups?: boolean
  getCombinedGroup?: (names: string[]) => { name: string; publicName?: string }
  minCompinedGroupSize?: number
}

export default ({
  handle,
  getGroup = () => ({ name: 'main' }),
  stage = 'generateBundle',
  generateCombinationGroups = false,
  getCombinedGroup = (names) => ({ name: names.reduce((a, b) => `${a}_${b}`) }),
  minCompinedGroupSize = 10
}: Options): Plugin => ({
  name: 'generate-metadata',
  [stage]: async function (this: PluginContext, options: OutputOptions, bundle: OutputBundle) {
    const dependencyCache = new Map<string, Set<string>>()
    const externalDependencyCache = new Map<string, Set<string>>()

    const moduleExternalDependencies = new Map<string, Set<string>>()
    const getModuleDependencies = (
      id: string,
      paths: string[]
    ): { internal: Set<string>; external: Set<string> } => {
      if (paths.includes(id)) {
        // Break recursive imports
        return { internal: new Set(), external: new Set() }
      }
      const moduleInfo = this.getModuleInfo(id)!
      if (moduleInfo.isExternal) {
        const match = /^(?:@[^/]*\/)?[^/]*/.exec(id)
        if (match != null && !builtinModules.includes(match[0])) {
          const caller = paths[paths.length - 1]!
          const dependencyList = moduleExternalDependencies.get(caller) ?? new Set()
          dependencyList.add(match[0])
          moduleExternalDependencies.set(caller, dependencyList)
          externalDependencyCache.set(id, new Set([match[0]]))
        } else {
          externalDependencyCache.set(id, new Set([]))
        }
        dependencyCache.set(id, new Set())
      } else if (!dependencyCache.has(id)) {
        const dependencies = [...moduleInfo.importedIds, ...moduleInfo.dynamicallyImportedIds].map(
          (depId) => {
            return getModuleDependencies(depId, [...paths, id])
          }
        )
        dependencyCache.set(
          id,
          new Set([id, ...dependencies.flatMap((d) => Array.from(d.internal))])
        )
        externalDependencyCache.set(
          id,
          new Set(dependencies.flatMap((d) => Array.from(d.external)))
        )
      }

      return {
        internal: dependencyCache.get(id)!,
        external: externalDependencyCache.get(id)!
      }
    }

    const groups = new Map<string, Group>()
    const groupByPublicName = new Map<string, Group>()
    for (const id of this.getModuleIds()) {
      const moduleInfo = this.getModuleInfo(id)!
      if (!moduleInfo.isEntry) {
        continue
      }
      const { name: groupName, publicName, priority } = getGroup(id, options)
      const { internal: internalDependencies, external: externalDependencies } =
        getModuleDependencies(moduleInfo.id, [])

      if (!groups.has(groupName)) {
        groups.set(groupName, {
          entrypoints: new Set<string>(),
          publicName,
          name: groupName,
          modules: new Set<string>(),
          dependencies: new Set(),
          groupDependencies: new Set(),
          priority: priority ?? 0,
          isCombination: false
        })
      }
      const group = groups.get(groupName)!
      internalDependencies.forEach((d) => group.modules.add(d))
      externalDependencies.forEach((d) => group.dependencies.add(d))
      group.entrypoints.add(id)

      if (publicName != null) {
        groupByPublicName.set(publicName, group)
      }
    }

    const moduleGroups = new Map<string, Group[]>()
    for (const [_, group] of groups.entries()) {
      for (const module of group.modules) {
        if (!moduleGroups.has(module)) {
          moduleGroups.set(module, [])
        }
        moduleGroups.get(module)!.push(group)
      }
    }

    const moduleGroup = new Map<string, Group | null>()
    const combinedModuleGroup = new Map<string, Group>()
    for (const [id, currentModuleGroups] of moduleGroups.entries()) {
      // Find a group that everyone depends on
      const greatestPriority = Math.max(...currentModuleGroups.map((g) => g.priority))
      const priorityGroups = currentModuleGroups.filter((g) => g.priority >= greatestPriority)

      const groupThatEveryOneDependsOn = priorityGroups.find((group) =>
        priorityGroups
          .filter((ogroup) => ogroup !== group)
          .every((ogroup) => ogroup.groupDependencies.has(group.name))
      )
      moduleGroup.set(id, groupThatEveryOneDependsOn ?? null)

      if (generateCombinationGroups && groupThatEveryOneDependsOn == null) {
        const newGroup = getCombinedGroup(priorityGroups.map((g) => g.name))
        let group = groups.get(newGroup.name)
        if (group == null) {
          // The combination group doesn't exists yet
          group = {
            entrypoints: new Set<string>(),
            name: newGroup.name,
            publicName: newGroup.publicName,
            modules: new Set<string>(),
            dependencies: new Set(),
            groupDependencies: new Set(),
            priority: 0,
            isCombination: true
          }
          groups.set(newGroup.name, group)
          if (newGroup.publicName != null) {
            groupByPublicName.set(newGroup.publicName, group)
          }
        }
        group.modules.add(id)
        combinedModuleGroup.set(id, group)
      }
    }

    for (const group of groups.values()) {
      group.groupDependencies = new Set(
        Array.from(group.dependencies)
          .map((d) => groupByPublicName.get(d)?.name)
          .filter((g): g is string => g != null)
      )
    }

    for (const [id, group] of combinedModuleGroup) {
      if (group.modules.size < minCompinedGroupSize) {
        // if the combined group is too small and if it doesn't have direct dependencies, remove it
        groups.delete(group.name)
      } else {
        moduleGroup.set(id, group)

        if (group.publicName != null) {
          const previousGroups = moduleGroups.get(id)
          if (previousGroups != null) {
            for (const previousGroup of previousGroups) {
              previousGroup.dependencies.add(group.publicName)
            }
          }
        }
      }
    }

    const moduleGroupName = new Map(
      Array.from(moduleGroup.entries()).map(([module, group]) => [module, group?.name])
    )

    const groupResults = Array.from(groups.entries()).map(([name, group]) => {
      const exclusiveModules = new Set(
        Array.from(group.modules).filter((module) => moduleGroup.get(module) === group)
      )
      const directDependencies = new Set(
        Array.from(exclusiveModules).flatMap((module) =>
          Array.from(moduleExternalDependencies.get(module) ?? new Set<string>())
        )
      )

      return <GroupResult>{
        directDependencies,
        entrypoints: group.entrypoints,
        exclusiveModules,
        name,
        isCombination: group.isCombination
      }
    })

    const otherDependencies = new Set(
      Array.from(moduleExternalDependencies.values())
        .map((set) => Array.from(set))
        .flat()
    )
    const otherModules = new Set(Array.from(moduleGroups.keys()))
    for (const group of groupResults) {
      for (const directDependency of group.directDependencies) {
        otherDependencies.delete(directDependency)
      }
      for (const exclusiveModule of group.exclusiveModules) {
        otherModules.delete(exclusiveModule)
      }
    }

    await Promise.all(
      groupResults.map(async (group) => {
        await handle.call(this, {
          group,
          moduleGroupName,
          otherDependencies,
          otherModules,
          options,
          bundle
        })
      })
    )
  }
})
