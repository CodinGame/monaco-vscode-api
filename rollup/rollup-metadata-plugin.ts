import type { OutputBundle, OutputChunk, OutputOptions, Plugin, PluginContext } from 'rollup'
import { builtinModules } from 'module'
import path from 'path'

interface Group {
  name: string
  modules: Set<string>
  entrypoints: Set<string>
}

interface GroupResult {
  name: string
  directDependencies: Set<string>
  exclusiveModules: Set<string>
  entrypoints: Set<string>
}

interface Options {
  stage?: 'generateBundle' | 'writeBundle'
  getGroup?: (entryPoint: string, options: OutputOptions) => string
  handle (this: PluginContext, group: GroupResult, commonDependencies: Set<string>, options: OutputOptions, bundle: OutputBundle): void | Promise<void>
}

export default ({ handle, getGroup = () => 'main', stage = 'generateBundle' }: Options): Plugin => ({
  name: 'generate-metadata',
  [stage]: async function (this: PluginContext, options: OutputOptions, bundle: OutputBundle) {
    const dependencyCache = new Map<string, Set<string>>()

    const inputToOutput = Object.fromEntries(Object.values(bundle)
      .filter((chunk): chunk is OutputChunk => 'code' in chunk)
      .map(chunk => [
        chunk.facadeModuleId,
        path.resolve(options.dir!, chunk.preliminaryFileName)
      ]))

    const commonExternalDependencies = new Set<string>()
    const moduleExternalDependencies = new Map<string, Set<string>>()
    const getModuleDependencies = (id: string, paths: string[]): Set<string> => {
      if (paths.includes(id)) {
        // Break recursive imports
        return new Set()
      }
      if (!dependencyCache.has(id)) {
        const moduleInfo = this.getModuleInfo(id)!
        if (moduleInfo.isExternal) {
          const match = /^(?:@[^/]*\/)?[^/]*/.exec(id)
          if (match != null && !builtinModules.includes(match[0])) {
            const caller = paths[paths.length - 1]!
            const dependencyList = moduleExternalDependencies.get(caller) ?? new Set()
            dependencyList.add(match[0])
            moduleExternalDependencies.set(caller, dependencyList)
            commonExternalDependencies.add(match[0])
          }
          dependencyCache.set(id, new Set([]))
        } else {
          const dependencies = [...moduleInfo.importedIds, ...moduleInfo.dynamicallyImportedIds].map(depId => {
            return getModuleDependencies(depId, [...paths, id])
          })
          dependencyCache.set(id, new Set([inputToOutput[id] ?? id, ...dependencies.flatMap(d => Array.from(d))]))
        }
      }

      return dependencyCache.get(id)!
    }

    const groups = new Map<string, Group>()
    for (const id of this.getModuleIds()) {
      const moduleInfo = this.getModuleInfo(id)!
      if (!moduleInfo.isEntry) {
        continue
      }
      const groupName = getGroup(id, options)
      const dependencies = getModuleDependencies(moduleInfo.id, [])

      if (!groups.has(groupName)) {
        groups.set(groupName, {
          entrypoints: new Set<string>(),
          name: groupName,
          modules: new Set<string>()
        })
      }
      const group = groups.get(groupName)!
      dependencies.forEach(d => group.modules.add(d))
      group.entrypoints.add(id)
    }

    const moduleUseCount = new Map<string, number>()
    for (const [_, group] of groups.entries()) {
      for (const module of group.modules) {
        moduleUseCount.set(module, (moduleUseCount.get(module) ?? 0) + 1)
      }
    }

    const groupResults = Array.from(groups.entries()).map(([name, group]) => {
      const exclusiveModules = new Set(Array.from(group.modules).filter(module => moduleUseCount.get(module)! <= 1))
      const directDependencies = new Set(Array.from(exclusiveModules).flatMap(module => Array.from(moduleExternalDependencies.get(module) ?? new Set<string>())))
      for (const directDependency of directDependencies) {
        commonExternalDependencies.delete(directDependency)
      }

      return <GroupResult>{
        directDependencies,
        entrypoints: group.entrypoints,
        exclusiveModules,
        name
      }
    })

    await Promise.all(groupResults.map(async (group) => {
      await handle.call(this, group, commonExternalDependencies, options, bundle)
    }))
  }
})
