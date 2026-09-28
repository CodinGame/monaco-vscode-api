import type { Plugin } from 'rollup'
import * as fs from 'node:fs'
import * as nodePath from 'node:path'

/**
 * The extension host main thread participants are split between several `extensionHost.*.contribution` files,
 * and `inertMainThreadCustomer` silently registers an inert implementation for any missing one.
 *
 * This checks that every main thread participant is still part of the build, so that one that is forgotten
 * (e.g. while rebasing the VSCode patches after VSCode added one) fails the build instead of being silently inert
 */
export default ({ vscodeSrcDir }: { vscodeSrcDir: string }): Plugin => {
  return {
    name: 'extension-host-bridges-check',
    buildEnd(error) {
      if (error != null) {
        return
      }
      const directory = nodePath.resolve(vscodeSrcDir, 'vs/workbench/api/browser')
      const moduleIds = new Set(this.getModuleIds())
      const missing = fs
        .readdirSync(directory)
        .filter((file) => /^mainThread\w+\.js$/.test(file))
        .map((file) => nodePath.resolve(directory, file))
        .filter((file) => /\bextHost(Named)?Customer\b/.test(fs.readFileSync(file, 'utf-8')))
        .filter((file) => !moduleIds.has(file))

      if (missing.length > 0) {
        this.error(
          `Extension host main thread participants not imported by any extensionHost.*.contribution file:\n${missing
            .map((file) => `  ${nodePath.relative(vscodeSrcDir, file)}`)
            .join('\n')}`
        )
      }
    }
  }
}
