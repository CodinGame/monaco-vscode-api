import type { OutputBundle, OutputChunk, OutputOptions, Plugin, PluginContext } from 'rollup'
import { builtinModules } from 'module'
import path from 'path'

interface Group {
  name: string
  dependencies: Set<string>
  modules: Set<string>
  entrypoints: Set<string>
}

interface Options {
  stage?: 'generateBundle' | 'writeBundle'
  getGroup?: (entryPoint: string, options: OutputOptions) => string
  handle (this: PluginContext, groupName: string, dependencies: Set<string>, entrypoints: Set<string>, exclusiveModules: Set<string>, options: OutputOptions, bundle: OutputBundle): void | Promise<void>
}

export default ({ handle, getGroup = () => 'main', stage = 'generateBundle' }: Options): Plugin => ({
  name: 'generate-metadata',
  [stage]: async function (this: PluginContext, options: OutputOptions, bundle: OutputBundle) {
    const dependencyCache = new Map<string, { externals: Set<string>, internals: Set<string> }>()

    const inputToOutput = Object.fromEntries(Object.values(bundle)
      .filter((chunk): chunk is OutputChunk => 'code' in chunk)
      .map(chunk => [
        chunk.facadeModuleId,
        path.resolve(options.dir!, chunk.preliminaryFileName)
      ]))
    const getModuleDependencies = (id: string, path: string[]): { externals: Set<string>, internals: Set<string> } => {
      if (path.includes(id)) {
        // Break recursive imports
        return {
          externals: new Set(),
          internals: new Set()
        }
      }
      if (!dependencyCache.has(id)) {
        const moduleInfo = this.getModuleInfo(id)!
        if (moduleInfo.isExternal) {
          const match = /^(?:@[^/]*\/)?[^/]*/.exec(id)
          dependencyCache.set(id, {
            externals: new Set(match != null && !builtinModules.includes(match[0]) ? [match[0]] : []),
            internals: new Set([])
          })
        } else {
          const dependencies = [...moduleInfo.importedIds, ...moduleInfo.dynamicallyImportedIds].map(depId => {
            return getModuleDependencies(depId, [...path, id])
          })
          dependencyCache.set(id, {
            externals: new Set(dependencies.map(t => t.externals).flatMap(map => Array.from(map))),
            internals: new Set([inputToOutput[id] ?? id, ...dependencies.map(t => t.internals).flatMap(map => Array.from(map))])
          })
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
          dependencies: new Set<string>(),
          entrypoints: new Set<string>(),
          name: groupName,
          modules: new Set<string>()
        })
      }
      const group = groups.get(groupName)!
      dependencies.externals.forEach(d => group.dependencies.add(d))
      dependencies.internals.forEach(d => group.modules.add(d))
      group.entrypoints.add(id)
    }

    const moduleUseCount = new Map<string, number>()
    for (const [_, group] of groups.entries()) {
      for (const module of group.modules) {
        moduleUseCount.set(module, (moduleUseCount.get(module) ?? 0) + 1)
      }
    }

    await Promise.all(Array.from(groups.entries()).map(async ([name, group]) => {
      const exclusiveModules = new Set(Array.from(group.modules).filter(module => moduleUseCount.get(module)! <= 1))
      await handle.call(this, name, group.dependencies, exclusiveModules, group.entrypoints, options, bundle)
    }))
  }
})
