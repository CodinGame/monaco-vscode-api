import type { Plugin } from 'rollup'
import * as rollup from 'rollup'
import glob from 'fast-glob'
import * as nodePath from 'node:path'
import * as fs from 'node:fs'

export default ({ vscodeSrcDir }: { vscodeSrcDir: string }): Plugin => {
  const realPaths = new Map<string, string>()
  return <rollup.Plugin>{
    name: 'vscode-asset-glob-meta-url',
    async resolveId(importee) {
      if (!importee.includes('*')) {
        return null
      }

      const fakePath = nodePath.resolve(vscodeSrcDir, importee.replace(/\*/, 'all'))
      realPaths.set(fakePath, importee)
      return fakePath
    },
    async load(id) {
      const realPath = realPaths.get(id)
      if (realPath == null) {
        return undefined
      }
      const files = await glob(realPath, { cwd: vscodeSrcDir })

      const fileRefs = await Promise.all(
        files.map(async (file) => {
          const filePath = nodePath.resolve(vscodeSrcDir, file)
          const ref = this.emitFile({
            type: 'asset',
            name: nodePath.basename(file),
            source: await fs.promises.readFile(filePath),
            fileName: nodePath.join('vscode/src', file)
          })
          return { file, ref }
        })
      )
      return `export default {${fileRefs.map(({ file, ref }) => `\n  '${file}': new URL(import.meta.ROLLUP_FILE_URL_${ref}, import.meta.url).href`).join(',')}\n}`
    }
  }
}
