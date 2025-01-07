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

async function extractDtsImports(fileName: string, content: string) {
  const sourceFile = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true)

  const imports: string[] = []

  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier
      if (ts.isStringLiteral(moduleSpecifier)) {
        imports.push(moduleSpecifier.text)
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return imports
}

export default (): Plugin => ({
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
    const imports = await extractDtsImports(id, content)

    return {
      code: (
        await Promise.all(
          imports.map(async (imp) => {
            if (['.css'].includes(nodePath.extname(imp))) {
              // Do not transform asset imports
              return imp
            }

            const resolved = await this.resolve(imp, id)
            if (resolved != null && resolved.external !== false) {
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
        dts: content
      }
    }
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

    const sourceFile = ts.createSourceFile(chunk.fileName, dtsSource, ts.ScriptTarget.Latest)

    const dtsImports: ts.StringLiteral[] = []
    for (const child of sourceFile.getChildren()[0]!.getChildren()) {
      if (ts.isImportDeclaration(child) && ts.isStringLiteral(child.moduleSpecifier)) {
        dtsImports.push(child.moduleSpecifier)
      }
    }

    const originalImports = Array.from(new Set(dtsImports.map((i) => i.text)))
    const transformedImports = Array.from(
      new Set(
        this.parse(code)
          .body.filter((node) => node.type === 'ImportDeclaration')
          .map((node) => node.source.value!.toString().replace(/\.d\.ts/, '.js'))
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

    return printer.printFile(sourceFile)
  }
})
