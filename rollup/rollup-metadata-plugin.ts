import type { OutputBundle, OutputOptions, Plugin, PluginContext } from 'rollup'
import { builtinModules } from 'module'

interface Group {
  name: string
  dependencies: Set<string>
  entrypoints: Set<string>
}

interface Options {
  getGroup?: (entryPoint: string, options: OutputOptions) => string
  handle (this: PluginContext, groupName: string, dependencies: Set<string>, entrypoints: Set<string>, options: OutputOptions, bundle: OutputBundle): void | Promise<void>
}

export default ({ handle, getGroup = () => 'main' }: Options): Plugin => ({
  name: 'generate-metadata',
  async generateBundle (options: OutputOptions, bundle: OutputBundle) {
    const externalDependencyCache = new Map<string, Set<string>>()
    const getModuleExternalDependencies = (id: string, path: string[]): Set<string> => {
      if (!externalDependencyCache.has(id)) {
        const moduleInfo = this.getModuleInfo(id)!
        if (moduleInfo.isExternal) {
          const match = /^(?:@[^/]*\/)?[^/]*/.exec(id)
          externalDependencyCache.set(id, new Set(match != null && !builtinModules.includes(match[0]) ? [match[0]] : []))
        } else {
          externalDependencyCache.set(id, new Set([...moduleInfo.importedIds, ...moduleInfo.dynamicallyImportedIds].flatMap(depId => Array.from(getModuleExternalDependencies(depId, [...path, id])))))
        }
      }

      return externalDependencyCache.get(id)!
    }

    const groups = new Map<string, Group>()
    for (const id of this.getModuleIds()) {
      const moduleInfo = this.getModuleInfo(id)!
      if (!moduleInfo.isEntry) {
        continue
      }
      const groupName = getGroup(id, options)
      const externalDependencies = getModuleExternalDependencies(moduleInfo.id, [])

      if (!groups.has(groupName)) {
        groups.set(groupName, {
          dependencies: new Set<string>(),
          entrypoints: new Set<string>(),
          name: groupName
        })
      }
      const group = groups.get(groupName)!
      externalDependencies.forEach(d => group.dependencies.add(d))
      group.entrypoints.add(id)
    }

    await Promise.all(Array.from(groups.entries()).map(async ([name, group]) => {
      await handle.call(this, name, group.dependencies, group.entrypoints, options, bundle)
    }))
  }
})
