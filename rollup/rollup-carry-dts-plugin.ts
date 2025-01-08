/**
 * Plugin carrying types from input to output, rewriting the imports
 * Constraints:
 * - preserveModules should be enabled
 */
import type { Plugin } from 'rollup'
import ts from 'typescript'
import type * as estree from 'estree'
import * as nodePath from 'node:path'
import * as fs from 'node:fs'
const printer = ts.createPrinter()

export interface PluginConfig {
  external?: (source: string, importer: string | undefined) => boolean
}

export default ({ external = () => false }: PluginConfig = {}): Plugin => ({
  name: 'carry-dts',
  async transform(code, id) {
    // Make module import their own dts if it exists
    const dts = id.replace(/(?:\.js)?$/, '.d.ts')

    if (fs.existsSync(dts)) {
      return `import '${dts}'\n${code}`
    }

    return undefined
  },
  async load(id) {
    if (!id.endsWith('.d.ts')) {
      return undefined
    }

    // load d.ts files by replacing them by a modules importing everything the .d.ts imports
    const content = (await fs.promises.readFile(id)).toString()

    const sourceFile = ts.createSourceFile(id, content, ts.ScriptTarget.Latest, true)

    const imports: string[] = []

    function transformer(context: ts.TransformationContext) {
      return (rootNode: ts.Node): ts.Node | undefined => {
        function visit(node: ts.Node): ts.Node | undefined {
          if (ts.isImportDeclaration(node) && node.importClause == null) {
            return undefined
          }
          if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
            if (node.moduleSpecifier != null && ts.isStringLiteral(node.moduleSpecifier)) {
              imports.push(node.moduleSpecifier.text)
            }
          }
          if (
            ts.isImportTypeNode(node) &&
            ts.isLiteralTypeNode(node.argument) &&
            ts.isStringLiteral(node.argument.literal)
          ) {
            imports.push(node.argument.literal.text)
          }
          return ts.visitEachChild(node, visit, context)
        }
        return ts.visitNode(rootNode, visit)
      }
    }

    // Transformer le fichier source
    const result = ts.transform(sourceFile, [transformer as ts.TransformerFactory<ts.Node>])

    return {
      code: (
        await Promise.all(
          imports.map(async (imp) => {
            if (['.css'].includes(nodePath.extname(imp))) {
              // Do not transform asset imports
              return imp
            }
            if (external(imp, id)) {
              return imp
            }

            const dts = imp.replace(/(\.js)?$/, '.d.ts')
            const dtsResolved = await this.resolve(dts, id)
            if (dtsResolved != null) {
              return dts
            }

            return imp
          })
        )
      )
        .map((imp) => `import '${imp}'`)
        .join('\n'),
      moduleSideEffects: 'no-treeshake',
      meta: {
        dts: printer.printFile(result.transformed[0] as ts.SourceFile)
      }
    }
  },
  onLog(level, log) {
    if (
      level === 'warn' &&
      log.code === 'CIRCULAR_DEPENDENCY' &&
      log.ids!.every((id) => id.endsWith('.d.ts'))
    ) {
      return false
    }

    return true
  },
  outputOptions(options) {
    // update entryFileNames so that d.ts files aren't renamed
    return {
      ...options,
      entryFileNames(chunkInfo) {
        const sup =
          (typeof options.entryFileNames === 'function'
            ? options.entryFileNames(chunkInfo)
            : options.entryFileNames) ?? '[name].js'

        if (chunkInfo.name.endsWith('.d')) {
          return sup.replace(/\.js$/, '.ts')
        }
        return sup
      }
    }
  },
  renderChunk(code, chunk) {
    if (chunk.moduleIds.length !== 1) {
      return undefined
    }
    const module = chunk.moduleIds[0]!
    if (!module.endsWith('d.ts')) {
      // remove injected d.ts imports
      const ast = this.parse(code)

      const importRangesToRemove: [number, number][] = []

      for (const node of ast.body) {
        if (node.type === 'ImportDeclaration' && node.specifiers.length === 0) {
          if (node.source.value != null && node.source.value.toString().endsWith('.d.ts')) {
            const fixedNode = node as estree.ImportDeclaration & { start: number; end: number }
            const range: [number, number] = [fixedNode.start, fixedNode.end]
            importRangesToRemove.push(range)
          }
        }
      }
      if (importRangesToRemove.length === 0) {
        return undefined
      }

      let transformedCode = ''
      let lastIndex = 0
      for (const [start, end] of importRangesToRemove) {
        transformedCode += code.slice(lastIndex, start)
        lastIndex = end
      }

      transformedCode += code.slice(lastIndex)

      return transformedCode
    }

    // Overwise, transform back the generated module into the original d.ts file (and replace imports)
    const info = this.getModuleInfo(module)!

    const dtsSource = info.meta.dts
    if (dtsSource == null) {
      return undefined
    }

    let sourceFile = ts.createSourceFile(chunk.fileName, dtsSource, ts.ScriptTarget.Latest)

    const dtsImports: ts.StringLiteral[] = []

    function visit(child: ts.Node): ts.Node {
      if (
        (ts.isImportDeclaration(child) || ts.isExportDeclaration(child)) &&
        child.moduleSpecifier != null &&
        ts.isStringLiteral(child.moduleSpecifier)
      ) {
        dtsImports.push(child.moduleSpecifier)
      }
      if (
        ts.isImportTypeNode(child) &&
        ts.isLiteralTypeNode(child.argument) &&
        ts.isStringLiteral(child.argument.literal)
      ) {
        dtsImports.push(child.argument.literal)
      }
      return ts.visitEachChild(child, visit, undefined)
    }

    ts.visitNode(sourceFile, visit)

    const originalImports = Array.from(new Set(dtsImports.map((i) => i.text)))
    const transformedImports = Array.from(
      new Set(
        this.parse(code)
          .body.filter((node) => node.type === 'ImportDeclaration')
          .map((node) => node.source.value!.toString().replace(/\.d\.ts$/, '.js'))
      )
    )

    if (originalImports.length !== transformedImports.length) {
      throw new Error('Mismatching import count for ' + chunk.fileName)
    }

    const transformedImportMapping = new Map<string, string>()
    for (let i = 0; i < originalImports.length; ++i) {
      transformedImportMapping.set(originalImports[i]!, transformedImports[i]!)
    }

    for (let i = 0; i < dtsImports.length; ++i) {
      dtsImports[i]!.text = transformedImportMapping.get(dtsImports[i]!.text)!
    }

    // Also transform `declare module '...' and `import(...)`
    const transformer: ts.TransformerFactory<ts.Node> = (context) => (rootNode) => {
      function visit(node: ts.Node): ts.Node {
        if (ts.isModuleDeclaration(node) && ts.isStringLiteral(node.name)) {
          node = ts.factory.updateModuleDeclaration(
            node,
            node.modifiers,
            ts.factory.createStringLiteral(
              transformedImportMapping.get(node.name.text) ?? node.name.text
            ),
            node.body
          )
        }
        if (
          ts.isImportTypeNode(node) &&
          ts.isLiteralTypeNode(node.argument) &&
          ts.isStringLiteral(node.argument.literal)
        ) {
          node = ts.factory.updateImportTypeNode(
            node,
            ts.factory.updateLiteralTypeNode(
              node.argument,
              ts.factory.createStringLiteral(
                transformedImportMapping.get(node.argument.literal.text) ??
                  node.argument.literal.text
              )
            ),
            node.attributes,
            node.qualifier,
            node.typeArguments
          )
        }
        return ts.visitEachChild(node, visit, context)
      }

      return ts.visitNode(rootNode, visit)
    }

    sourceFile = ts.transform(sourceFile, [transformer]).transformed[0] as ts.SourceFile

    return printer.printFile(sourceFile)
  }
})
