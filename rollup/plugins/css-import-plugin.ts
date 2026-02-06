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
     * Transform the css into a module containing it, also resolve assets and emit rollup assets for them
     */
    async transform(code, id) {
      if (!filter(id)) return

      const replacements: Record<string, string> = {}

      await postcss([
        postcssUrl({
          url: async (asset) => {
            let fileName: string | undefined
            if (preserveAssetsRoot != null) {
              fileName = path
                .relative(path.resolve(process.cwd(), preserveAssetsRoot), asset.absolutePath!)
                .replace(/^(\.\.\/)+/g, '')
            }

            const resolved = await this.resolve(asset.url, id)
            if (resolved != null && !resolved.external) {
              const assetId = this.emitFile({
                type: 'asset',
                fileName,
                source: await fs.promises.readFile(resolved.id),
                needsCodeReference: false
              })

              replacements[asset.url] = assetId
            }

            return asset.url
          }
        })
      ]).process(code, { from: id })

      return {
        code: `renderCSS(${JSON.stringify(code)}, {${Object.entries(replacements)
          .map(([url, assetId]) => `"${url}": import.meta.ROLLUP_FILE_URL_${assetId}`)
          .join(', ')}}); export default 'fakeExport'`
      }
    },

    /**
     * transform back the chunk into a css file, replacing the urls with the emitted ones
     */
    async renderChunk(code, chunk) {
      if (chunk.fileName.endsWith('.css')) {
        const parsed = acorn.parse(code, { ecmaVersion: 2022, sourceType: 'module' })

        const renderCssArguments = (
          (parsed.body[0] as acorn.ExpressionStatement).expression as acorn.CallExpression
        ).arguments
        const css = (renderCssArguments[0] as acorn.Literal).value as string
        const replacements = (renderCssArguments[1] as acorn.ObjectExpression).properties.reduce(
          (acc, prop) => {
            if (
              prop.type === 'Property' &&
              prop.key.type === 'Literal' &&
              prop.value.type === 'Literal'
            ) {
              acc[prop.key.value as string] = prop.value.value as string
            }
            return acc
          },
          {} as Record<string, string>
        )

        return Object.entries(replacements).reduce(
          (acc, [url, replacedUrl]) => acc.replaceAll(url, replacedUrl),
          css
        )
      }

      return null
    }
  }
}
