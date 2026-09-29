import type { Plugin, PluginContext } from 'rollup'

interface FeatureIsolationCheckOptions {
  /** Matches the modules of the optional features (e.g. chat, notebook, mcp) */
  featureModules: RegExp
  /** Matches the entry points that are allowed to load feature modules (their service overrides) */
  allowedEntries: RegExp
  /**
   * Maximum size (in bytes of transformed code) of the feature modules statically reachable from
   * the other entry points. It covers the known remaining dependencies, and fails the build when a
   * VSCode update (or a change here) makes more of the features load unconditionally
   */
  maxSize: number
}

/**
 * Checks that optional features are only loaded by their own service overrides, so that a workbench
 * without them doesn't load (and bundle) their implementation
 */
export default ({
  featureModules,
  allowedEntries,
  maxSize
}: FeatureIsolationCheckOptions): Plugin => {
  function getSize(context: PluginContext, id: string) {
    return context.getModuleInfo(id)?.code?.length ?? 0
  }

  function collectStaticImports(context: PluginContext, from: string[]) {
    const seen = new Set<string>(from)
    const queue = [...from]
    while (queue.length > 0) {
      const id = queue.pop()!
      for (const imported of context.getModuleInfo(id)?.importedIds ?? []) {
        if (!seen.has(imported)) {
          seen.add(imported)
          queue.push(imported)
        }
      }
    }
    return seen
  }

  return {
    name: 'feature-isolation-check',
    buildEnd(error) {
      if (error != null) {
        return
      }
      const entries = Array.from(this.getModuleIds()).filter(
        (id) => this.getModuleInfo(id)!.isEntry && !allowedEntries.test(id)
      )
      const reachable = collectStaticImports(this, entries)
      const reachableFeatureModules = Array.from(reachable).filter((id) => featureModules.test(id))
      const totalSize = reachableFeatureModules.reduce((acc, id) => acc + getSize(this, id), 0)

      // Where the other modules start depending on the features, and how much each of them loads
      const crossings = Array.from(reachable)
        .filter((id) => !featureModules.test(id))
        .flatMap((importer) =>
          this.getModuleInfo(importer)!
            .importedIds.filter((id) => featureModules.test(id))
            .map((imported) => ({ importer, imported }))
        )
        .map(({ importer, imported }) => ({
          importer,
          imported,
          size: Array.from(collectStaticImports(this, [imported]))
            .filter((id) => featureModules.test(id))
            .reduce((acc, id) => acc + getSize(this, id), 0)
        }))
        .sort((a, b) => b.size - a.size)

      const kb = (size: number) => `${Math.round(size / 1024)}KB`
      const shorten = (id: string) => id.replace(/^.*?\/(vs|src)\//, '$1/')
      const report = [
        `${reachableFeatureModules.length} feature modules (${kb(totalSize)}) are loaded without their service overrides (max ${kb(maxSize)})`,
        ...crossings
          .slice(0, 20)
          .map(
            ({ importer, imported, size }) =>
              `  ${kb(size).padStart(7)}  ${shorten(importer)} -> ${shorten(imported)}`
          )
      ].join('\n')

      if (totalSize > maxSize) {
        this.error(report)
      }
      this.info(report)
    }
  }
}
