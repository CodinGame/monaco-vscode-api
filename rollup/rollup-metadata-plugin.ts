import type { OutputBundle, OutputChunk, OutputOptions, Plugin, PluginContext } from 'rollup'
import { builtinModules } from 'module'
import path from 'path'

interface Group {
  name: string
  modules: Set<string>
  entrypoints: Set<string>
  dependencies: Set<string>
  groupDependencies: Set<string>
  // A greater priority means the that this group will be chosen for module present in multiple groups
  priority: number
}

interface GroupResult {
  name: string
  directDependencies: Set<string>
  exclusiveModules: Set<string>
  entrypoints: Set<string>
}

interface Options {
  stage?: 'generateBundle' | 'writeBundle'
  getGroup?: (entryPoint: string, options: OutputOptions) => { name: string, publicName?: string, priority?: number }
  handle (this: PluginContext, group: GroupResult, moduleGroupName: Map<string, string | undefined>, options: OutputOptions, bundle: OutputBundle): void | Promise<void>
}

export default ({ handle, getGroup = () => ({ name: 'main' }), stage = 'generateBundle' }: Options): Plugin => ({
  name: 'generate-metadata',
  [stage]: async function (this: PluginContext, options: OutputOptions, bundle: OutputBundle) {
    const dependencyCache = new Map<string, Set<string>>()
    const externalDependencyCache = new Map<string, Set<string>>()

    const inputToOutput = Object.fromEntries(Object.values(bundle)
      .filter((chunk): chunk is OutputChunk => 'code' in chunk)
      .map(chunk => [
        chunk.facadeModuleId,
        path.resolve(options.dir!, chunk.preliminaryFileName)
      ]))

    const moduleExternalDependencies = new Map<string, Set<string>>()
    const getModuleDependencies = (id: string, paths: string[]): { internal: Set<string>, external: Set<string> } => {
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
        const dependencies = [...moduleInfo.importedIds, ...moduleInfo.dynamicallyImportedIds].map(depId => {
          return getModuleDependencies(depId, [...paths, id])
        })
        dependencyCache.set(id, new Set([inputToOutput[id] ?? id, ...dependencies.flatMap(d => Array.from(d.internal))]))
        externalDependencyCache.set(id, new Set(dependencies.flatMap(d => Array.from(d.external))))
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
      const { internal: internalDependencies, external: externalDependencies } = getModuleDependencies(moduleInfo.id, [])

      if (!groups.has(groupName)) {
        groups.set(groupName, {
          entrypoints: new Set<string>(),
          name: groupName,
          modules: new Set<string>(),
          dependencies: new Set(),
          groupDependencies: new Set(),
          priority: priority ?? 0
        })
      }
      const group = groups.get(groupName)!
      internalDependencies.forEach(d => group.modules.add(d))
      externalDependencies.forEach(d => group.dependencies.add(d))
      group.entrypoints.add(id)

      if (publicName != null) {
        groupByPublicName.set(publicName, group)
      }
    }

    for (const group of groups.values()) {
      group.groupDependencies = new Set(Array.from(group.dependencies).map(d => groupByPublicName.get(d)?.name).filter((g): g is string => g != null))
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
    for (const [id, groups] of moduleGroups.entries()) {
      // Find a group that everyone depends on
      const greatestPriority = Math.max(...groups.map(g => g.priority))
      const priorityGroups = groups.filter(g => g.priority >= greatestPriority)
      moduleGroup.set(id, priorityGroups.find(group => priorityGroups.filter(ogroup => ogroup !== group).every(ogroup => ogroup.groupDependencies.has(group.name))) ?? null)
    }

    const moduleGroupName = new Map(Array.from(moduleGroup.entries()).map(([module, group]) => [module, group?.name]))

    const groupResults = Array.from(groups.entries()).map(([name, group]) => {
      const exclusiveModules = new Set(Array.from(group.modules).filter(module => moduleGroup.get(module) === group))
      const directDependencies = new Set(Array.from(exclusiveModules).flatMap(module => Array.from(moduleExternalDependencies.get(module) ?? new Set<string>())))

      return <GroupResult>{
        directDependencies,
        entrypoints: group.entrypoints,
        exclusiveModules,
        name
      }
    })

    await Promise.all(groupResults.map(async (group) => {
      await handle.call(this, group, moduleGroupName, options, bundle)
    }))
  }
})
