import { createFilter } from '@rollup/pluginutils'
import path from 'path'
import type { Plugin } from 'rollup'
import postcss from 'postcss'
import postcssUrl from 'postcss-url'
import * as fs from 'node:fs'
import * as acorn from 'acorn'

export interface Options {
  include?: string[]
  exclude?: string[]
  preserveAssetsRoot?: string
}

export default ({
  preserveAssetsRoot,
  include = ['**/*.css'],
  exclude = []
}: Options = {}): Plugin => {
  const styles: Record<string, string> = {}
  const filter = createFilter(include, exclude)

  return {
    name: 'import-css',

    /**
     * Force output file as .css
     */
    outputOptions(options) {
      return {
        ...options,
        entryFileNames(chunkInfo) {
          const sup =
            (typeof options.entryFileNames === 'function'
              ? options.entryFileNames(chunkInfo)
              : options.entryFileNames) ?? '[name].js'

          if (chunkInfo.name.endsWith('.css')) {
            return sup.replace(/\.js$/, '')
          }

          return sup
        }
      }
    },

    /**
     * Transform the css into a module containing it
     */
    transform(code, id) {
      if (!filter(id)) return

      styles[id] = code

      return {
        code: `renderCSS(${JSON.stringify(code)}); export default 'fakeExport'`
      }
    },

    /**
     * transform back the chunk into a css file, and emit referenced asset files
     */
    async renderChunk(code, chunk) {
      if (chunk.fileName.endsWith('.css')) {
        const parsed = acorn.parse(code, { ecmaVersion: 2022, sourceType: 'module' })
        const css = (
          ((parsed.body[0] as acorn.ExpressionStatement).expression as acorn.CallExpression)
            .arguments[0] as acorn.Literal
        ).value as string

        await postcss([
          postcssUrl({
            url: async (asset, dir) => {
              let fileName: string | undefined
              if (preserveAssetsRoot != null) {
                fileName = path
                  .relative(path.resolve(process.cwd(), preserveAssetsRoot), asset.absolutePath!)
                  .replace(/^(\.\.\/)+/g, '')
              }

              const resolved = await this.resolve(
                asset.url,
                dir.file != null ? path.join(dir.file, 'unknownFile.css') : undefined
              )
              if (resolved != null && !resolved.external) {
                this.emitFile({
                  type: 'asset',
                  fileName,
                  source: await fs.promises.readFile(resolved.id),
                  needsCodeReference: false
                })
              }

              return asset.url
            }
          })
        ]).process(css, { from: chunk.fileName })

        return css
      }

      return null
    }
  }
}
