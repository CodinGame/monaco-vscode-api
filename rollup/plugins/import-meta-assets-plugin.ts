import * as fs from 'fs'
import * as path from 'path'
import { createFilter } from '@rollup/pluginutils'
import { asyncWalk } from 'estree-walker'
import MagicString from 'magic-string'
import {
  dynamicImportToGlob as dynamicURLToGlob,
  VariableDynamicImportError as VariableURLError
} from '@rollup/plugin-dynamic-import-vars'
import type { Plugin } from 'rollup'
import type { NewExpression, Node } from 'estree'
import * as acorn from 'acorn'

/**
 * Extract the relative path from an AST node representing this kind of expression `new URL('./path/to/asset.ext', import.meta.url)`.
 *
 * @param node - The AST node
 * @returns The relative path
 */
function getRelativeAssetPath(node: NewExpression): string {
  // either normal string expression or else it would be Template Literal with a single quasi
  const firstArgument = node.arguments[0]!

  if (firstArgument.type === 'Literal') {
    return firstArgument.value as string
  }
  if (firstArgument.type === 'TemplateLiteral') {
    return firstArgument.quasis[0]!.value.cooked!
  }
  throw new Error('Unable to URL path')
}

/**
 * Checks if a AST node represents this kind of expression: `new URL('./path/to/asset.ext', import.meta.url)`.
 *
 * @param node - The AST node
 */
function getImportMetaUrlType(node: NewExpression): undefined | 'static' | 'dynamic' {
  const isNewURL =
    node.callee.type === 'Identifier' &&
    node.callee.name === 'URL' &&
    node.arguments.length === 2 &&
    (node.arguments[0]!.type === 'Literal' ||
      // Allow template literals, reuses @rollup/plugin-dynamic-import-vars logic
      node.arguments[0]!.type === 'TemplateLiteral') &&
    typeof getRelativeAssetPath(node) === 'string' &&
    node.arguments[1]!.type === 'MemberExpression' &&
    node.arguments[1].object.type === 'MetaProperty' &&
    node.arguments[1].property.type === 'Identifier' &&
    node.arguments[1].property.name === 'url'

  if (!isNewURL) {
    return undefined
  }

  if (node.arguments[0]!.type === 'TemplateLiteral' && node.arguments[0].expressions.length > 0) {
    return 'dynamic'
  }

  return 'static'
}

export interface Options {
  include?: string | string[]
  exclude?: string | string[]
  warnOnError?: boolean
  transform?: (assetContents: Buffer, absoluteAssetPath: string) => Promise<Buffer>
  preserveAssetsRoot?: string
}

/**
 * Detects assets references relative to modules using patterns such as `new URL('./path/to/asset.ext', import.meta.url)`.
 * The assets are added to the rollup pipeline, allowing them to be transformed and hash the filenames.
 * Patterns that represent directories are skipped.
 *
 * @param options
 * @return A Rollup Plugin
 */
export default function importMetaAssets({
  include,
  exclude,
  warnOnError,
  transform,
  preserveAssetsRoot
}: Options = {}): Plugin {
  const filter = createFilter(include, exclude)

  return {
    name: 'rollup-plugin-import-meta-assets',
    async transform(code, id) {
      if (!filter(id)) {
        return null
      }

      // Part 1: resolve dynamic template literal expressions
      const parsed = acorn.parse(code, { ranges: true, ecmaVersion: 2022, sourceType: 'module' })

      let dynamicURLIndex = -1
      let ms: MagicString | undefined

      await asyncWalk(parsed, {
        enter: async (_node) => {
          const node = _node as Node
          if (node.type !== 'NewExpression') {
            return
          }
          const importMetaUrlType = getImportMetaUrlType(node)

          if (importMetaUrlType !== 'dynamic') {
            return
          }
          dynamicURLIndex += 1

          try {
            // see if this is a Template Literal with expressions inside, and generate a glob expression
            const glob = dynamicURLToGlob(
              node.arguments[0]!,
              code.substring(node.range![0], node.range![1])
            )

            if (!glob) {
              // this was not a variable dynamic url
              return
            }

            const { default: globby } = await import('globby')
            // execute the glob
            const result = await globby(glob, { cwd: path.dirname(id) })
            const paths = result.map((r) =>
              r.startsWith('./') || r.startsWith('../') ? r : `./${r}`
            )

            // create magic string if it wasn't created already
            ms = ms || new MagicString(code)
            // unpack variable dynamic url into a function with url statements per file, rollup
            // will turn these into chunks automatically
            ms.prepend(
              `function __variableDynamicURLRuntime${dynamicURLIndex}__(path) {
  switch (path) {
${paths.map((p) => `    case '${p}': return new URL('${p}', import.meta.url);`).join('\n')}
${`    default: return new Promise(function(resolve, reject) {
      (typeof queueMicrotask === 'function' ? queueMicrotask : setTimeout)(
        reject.bind(null, new Error("Unknown variable dynamic new URL statement: " + path))
      );
    })\n`}   }
 }\n\n`
            )
            // call the runtime function instead of doing a dynamic url, the url specifier will
            // be evaluated at runtime and the correct url will be returned by the injected function
            ms.overwrite(
              node.range![0],
              node.range![1] + 7,
              `__variableDynamicURLRuntime${dynamicURLIndex}__`
            )
          } catch (error) {
            if (error instanceof VariableURLError && warnOnError) {
              this.warn(error)
            } else {
              this.error(error as Error)
            }
          }
        }
      })

      let newCode = code
      if (ms && dynamicURLIndex !== -1) {
        newCode = ms.toString()
      }

      // Part 2: emit asset files
      const ast = acorn.parse(newCode, { ranges: true, ecmaVersion: 2022, sourceType: 'module' })
      const magicString = new MagicString(newCode)
      let modifiedCode = false

      await asyncWalk(ast, {
        enter: async (_node) => {
          const node = _node as Node
          if (node.type !== 'NewExpression') {
            return
          }
          const importMetaUrlType = getImportMetaUrlType(node)
          if (!importMetaUrlType) {
            return
          }

          if (importMetaUrlType === 'static') {
            const absoluteScriptDir = path.dirname(id)
            const relativeAssetPath = getRelativeAssetPath(node)
            const resolved = await this.resolve(relativeAssetPath, id)
            if (resolved == null) {
              this.error(`Unable to resolve "${relativeAssetPath}" from "${id}"`)
              return
            }
            if (resolved.external) {
              return
            }
            const absoluteAssetPath = path.resolve(absoluteScriptDir, relativeAssetPath)
            const assetName = path.basename(absoluteAssetPath)

            try {
              const assetContents = await fs.promises.readFile(resolved.id)
              const transformedAssetContents =
                transform != null
                  ? await transform(assetContents, absoluteAssetPath)
                  : assetContents
              if (transformedAssetContents === null) {
                return
              }

              let fileName: string | undefined
              if (preserveAssetsRoot != null) {
                if (resolved.id.includes('node_modules')) {
                  fileName = path.join('external', relativeAssetPath)
                } else {
                  fileName = path
                    .relative(path.resolve(process.cwd(), preserveAssetsRoot), absoluteAssetPath)
                    .replace(/^(\.\.\/)+/g, '')
                }
              }

              const ref = this.emitFile({
                type: 'asset',
                name: assetName,
                source: transformedAssetContents,
                fileName
              })
              magicString.overwrite(
                node.arguments[0]!.range![0],
                node.arguments[0]!.range![1],
                `import.meta.ROLLUP_FILE_URL_${ref}`
              )
              modifiedCode = true
            } catch (error) {
              // Do not process directories, just skip
              if ((error as Error & { code: string }).code !== 'EISDIR') {
                if (warnOnError) {
                  this.warn(error as Error, node.arguments[0]!.range![0])
                } else {
                  this.error(error as Error, node.arguments[0]!.range![0])
                }
              }
            }
          }
        }
      })

      return {
        code: magicString.toString(),
        map: modifiedCode ? magicString.generateMap({ hires: true, includeContent: true }) : null
      }
    }
  }
}
