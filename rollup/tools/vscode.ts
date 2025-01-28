import * as rollup from 'rollup'
import * as babylonParser from 'recast/parsers/babylon.js'
import * as recast from 'recast'
import ts from 'typescript'
import thenby from 'thenby'
import * as fs from 'node:fs'
import * as nodePath from 'node:path'
import {
  DIST_DIR,
  DIST_DIR_MAIN,
  OVERRIDE_PATH,
  SRC_DIR,
  VSCODE_DIR,
  VSCODE_SRC_DIR
} from './config.js'

const { firstBy } = thenby

const PURE_ANNO = '#__PURE__'
const PURE_FUNCTIONS = new Set([
  '__param',
  'createProxyIdentifier',
  'createDecorator',
  'localize',
  'localize2',
  'Registry.as',
  'Object.freeze',
  'URI.parse',
  'URI.from',
  'transparent',
  'darken',
  'lighten',
  'Color.fromHex',
  'asBrowserUri',
  'values',
  'keys',
  'toString',
  'ContextKeyExpr.and',
  'ContextKeyExpr.or',
  'ContextKeyExpr.equals',
  'ContextKeyExpr.regex',
  'ContextKeyExpr.false',
  'ContextKeyNotExpr.create',
  'ContextKeyDefinedExpr.create',
  'notEqualsTo',
  'notEquals',
  'toNegated',
  'isEqualTo',
  'SyncDescriptor',
  'getProxy',
  'map',
  'some',
  'asFileUri',
  'has',
  'negate'
])

const EXTENSIONS = ['', '.ts', '.js']
const SIDE_EFFECT_CONSTRUCTORS = new Set(['DomListener'])

const PURE_OR_TO_REMOVE_FUNCTIONS = new Set([...PURE_FUNCTIONS])

function isCallPure(
  file: string,
  functionName: string,
  node: recast.types.namedTypes.CallExpression
): boolean {
  const args = node.arguments
  if (functionName === '__decorate') {
    const code = recast.print(node).code
    if (code.includes('extHostNamedCustomer') || code.includes('extHostCustomer')) {
      return false
    }
    return true
  }

  if (functionName === 'MenuRegistry.appendMenuItem') {
    const firstParamCode = recast.print(args[0]!).code
    if (firstParamCode.startsWith('MenuId.AccountsContext')) {
      return true
    }
  }

  if (functionName === 'registerSingleton') {
    if (
      file.includes('vs/workbench/api/') ||
      file.includes('vs/editor') ||
      file.includes('vs/platform/undoRedo/common/undoRedoService') ||
      file.includes('vs/platform/actionWidget/browser/actionWidget')
    ) {
      return false
    }
    return true
  }

  return PURE_OR_TO_REMOVE_FUNCTIONS.has(functionName)
}

function getMemberExpressionPath(
  node: recast.types.namedTypes.MemberExpression | recast.types.namedTypes.Identifier
): string | null {
  if (node.type === 'MemberExpression') {
    if (
      node.property.type === 'Identifier' &&
      (node.object.type === 'Identifier' || node.object.type === 'MemberExpression')
    ) {
      const parentName = getMemberExpressionPath(node.object)
      if (parentName == null) {
        return null
      }
      return `${parentName}.${node.property.name}`
    }
  } else {
    return node.name
  }
  return null
}

export function transformVSCodeCode(id: string, code: string): string {
  // HACK: assign typescript decorator result to a decorated class field so rollup doesn't remove them
  // before:
  // __decorate([
  //     memoize
  // ], InlineBreakpointWidget.prototype, "getId", null);
  //
  // after:
  // InlineBreakpointWidget.__decorator = __decorate([
  //     memoize
  // ], InlineBreakpointWidget.prototype, "getId", null);

  let patchedCode = code.replace(
    /(^__decorate\(\[\n.*\n\], (.*).prototype)/gm,
    '$2.__decorator = $1'
  )

  const ast = recast.parse(patchedCode, {
    parser: babylonParser
  })
  let transformed: boolean = false
  function addComment(
    node: recast.types.namedTypes.NewExpression | recast.types.namedTypes.CallExpression
  ) {
    if (!(node.comments ?? []).some((comment) => comment.value === PURE_ANNO)) {
      transformed = true
      node.comments ??= []
      node.comments.unshift(recast.types.builders.commentBlock(PURE_ANNO, true))
      return recast.types.builders.parenthesizedExpression(node)
    }
    return node
  }
  recast.visit(ast.program.body, {
    visitNewExpression(path) {
      const node = path.node
      if (node.callee.type === 'Identifier' && !SIDE_EFFECT_CONSTRUCTORS.has(node.callee.name)) {
        path.replace(addComment(node))
      }
      this.traverse(path)
    },
    visitCallExpression(path) {
      const node = path.node
      const name =
        node.callee.type === 'MemberExpression' || node.callee.type === 'Identifier'
          ? getMemberExpressionPath(node.callee)
          : null

      if (node.callee.type === 'MemberExpression') {
        if (node.callee.property.type === 'Identifier') {
          const names: string[] = [node.callee.property.name]
          if (name != null) {
            names.unshift(name)
          }
          if (names.some((name) => isCallPure(id, name, node))) {
            path.replace(addComment(node))
          }
        }
      } else if (node.callee.type === 'Identifier' && isCallPure(id, node.callee.name, node)) {
        path.replace(addComment(node))
      }
      this.traverse(path)
    },
    visitClassDeclaration(path) {
      /**
       * The whole point of this method is to transform to static field declarations
       * ```
       * class Toto {
       * }
       * Toto.FIELD = 'tata'
       * ```
       * become
       * ```
       * class Toto {
       *   static FIELD = 'tata'
       * }
       * ```
       * So rollup will know it's a static field without side effects
       * As per version 3.26, it the class extends an external class (from monaco), rollup will infer the field has a side effect
       * It is mainly designed for `OnAutoForwardedAction` with has a static field and pull a lot of unused code
       * => https://rollupjs.org/repl/?version=3.26.0&shareable=JTdCJTIyZXhhbXBsZSUyMiUzQW51bGwlMkMlMjJtb2R1bGVzJTIyJTNBJTVCJTdCJTIybmFtZSUyMiUzQSUyMm1haW4uanMlMjIlMkMlMjJjb2RlJTIyJTNBJTIyJTVDbmNsYXNzJTIwVG90byUyMGV4dGVuZHMlMjBEaXNwb3NhYmxlJTIwJTdCJTVDbiU3RCU1Q25Ub3RvLkZJRUxEJTIwJTNEJTIwJ3RhdGEnJTVDbiUyMiUyQyUyMmlzRW50cnklMjIlM0F0cnVlJTdEJTVEJTJDJTIyb3B0aW9ucyUyMiUzQSU3QiUyMm91dHB1dCUyMiUzQSU3QiUyMmZvcm1hdCUyMiUzQSUyMmVzJTIyJTdEJTJDJTIydHJlZXNoYWtlJTIyJTNBJTIyc21hbGxlc3QlMjIlN0QlN0Q=
       */
      if (!(path.node.id?.type === 'Identifier')) {
        this.traverse(path)
        return
      }
      let statemementListPath = path.parentPath
      while (statemementListPath != null && !Array.isArray(statemementListPath.value)) {
        statemementListPath = statemementListPath.parentPath
      }
      const parentIndex = statemementListPath.value.indexOf(path.node)
      for (let i = parentIndex + 1; i < path.parentPath.value.length; ++i) {
        const node: recast.types.namedTypes.Node = path.parentPath.value[i]
        function isExpressionStatement(
          node: recast.types.namedTypes.Node
        ): node is recast.types.namedTypes.ExpressionStatement {
          return node.type === 'ExpressionStatement'
        }
        function isLiteral(
          node: recast.types.namedTypes.Node
        ): node is
          | recast.types.namedTypes.NumericLiteral
          | recast.types.namedTypes.Literal
          | recast.types.namedTypes.BooleanLiteral
          | recast.types.namedTypes.DecimalLiteral {
          return [
            'NumericLiteral',
            'Literal',
            'StringLiteral',
            'BooleanLiteral',
            'DecimalLiteral'
          ].includes(node.type)
        }
        if (
          isExpressionStatement(node) &&
          node.expression.type === 'AssignmentExpression' &&
          node.expression.left.type === 'MemberExpression' &&
          node.expression.left.object.type === 'Identifier' &&
          node.expression.left.object.name === path.node.id.name &&
          node.expression.left.property.type === 'Identifier' &&
          isLiteral(node.expression.right)
        ) {
          const fieldName = node.expression.left.property.name
          path.node.body.body.push(
            recast.types.builders.classProperty(
              recast.types.builders.identifier(fieldName),
              node.expression.right,
              null,
              true
            )
          )
          path.parentPath.value.splice(i--, 1)
          transformed = true
        } else {
          break
        }
      }
      this.traverse(path)
    }
  })
  if (transformed) {
    patchedCode = recast.print(ast).code
    patchedCode = patchedCode.replace(/\/\*#__PURE__\*\/\s+/g, '/*#__PURE__*/ ') // Remove space after PURE comment
  }

  return patchedCode
}

function resolveVscode(importee: string, importer?: string) {
  if (importee.endsWith('.js')) {
    importee = importee.slice(0, -3)
  }
  if (importer != null && importee.startsWith('.')) {
    importee = nodePath.resolve(nodePath.dirname(importer), importee)
  }

  if (importee.startsWith('vscode/')) {
    return resolve(nodePath.relative('vscode', importee), [VSCODE_DIR])
  }
  let vscodeImportPath = importee
  if (importee.startsWith(VSCODE_SRC_DIR)) {
    vscodeImportPath = nodePath.relative(VSCODE_SRC_DIR, importee)
  }
  const overridePath = resolve(vscodeImportPath, [OVERRIDE_PATH])
  if (overridePath != null) {
    return overridePath
  }

  if (vscodeImportPath.startsWith('vs/')) {
    return resolve(vscodeImportPath, [VSCODE_SRC_DIR])
  }
  return undefined
}

export function resolveVscodePlugin(): rollup.Plugin {
  return {
    name: 'resolve-vscode',
    resolveId: (importeeUrl, importer) => {
      const result = /^(.*?)(\?.*)?$/.exec(importeeUrl)!
      const importee = result[1]!
      const search = result[2] ?? ''

      const resolved = resolveVscode(importee, importer)

      if (resolved != null) {
        return `${resolved}${search}`
      }
      return undefined
    },
    async load(id) {
      if (!id.startsWith(VSCODE_SRC_DIR) && !id.startsWith(OVERRIDE_PATH)) {
        return undefined
      }
      if (!id.endsWith('.js') && !id.endsWith('.ts')) {
        return undefined
      }

      const content = (await fs.promises.readFile(id)).toString('utf-8')
      return transformVSCodeCode(id, content)
    }
  }
}

export function vscodeLocalizationPlugin(): rollup.Plugin {
  const nlsKeys: [moduleId: string, keys: string[]][] = []
  let nlsIndex = 0

  return {
    name: 'transform-localization',
    async generateBundle(options, bundle) {
      const orderedChunks = Object.values(bundle)
        .filter(
          (chunk): chunk is rollup.OutputChunk =>
            chunk.type === 'chunk' && chunk.fileName.endsWith('.js') && chunk.moduleIds.length === 1
        )
        .sort(firstBy((chunk) => chunk.fileName))

      for (const chunk of orderedChunks) {
        const id = chunk.moduleIds[0]!
        const translationPath = nodePath
          .relative(id.startsWith(OVERRIDE_PATH) ? OVERRIDE_PATH : VSCODE_SRC_DIR, id)
          .slice(0, -3) // remove extension
          .replace(/\._[^/.]*/g, '') // remove own refactor module suffixes

        const moduleNlsKeys: string[] = []
        const ast = recast.parse(chunk.code, {
          parser: babylonParser
        })
        recast.visit(ast.program.body, {
          visitCallExpression(path) {
            const node = path.node
            const name =
              node.callee.type === 'MemberExpression' || node.callee.type === 'Identifier'
                ? getMemberExpressionPath(node.callee)
                : null

            if (name != null && (name.endsWith('localize') || name.endsWith('localize2'))) {
              let localizationKey: string
              if (path.node.arguments[0]?.type === 'StringLiteral') {
                localizationKey = path.node.arguments[0].value
              } else if (path.node.arguments[0]?.type === 'ObjectExpression') {
                const properties = path.node.arguments[0].properties
                const keyProperty = properties.find<recast.types.namedTypes.ObjectProperty>(
                  (prop): prop is recast.types.namedTypes.ObjectProperty =>
                    prop.type === 'ObjectProperty' &&
                    prop.key.type === 'Identifier' &&
                    prop.key.name === 'key'
                )
                if (keyProperty == null) {
                  throw new Error('No key property')
                }
                if (keyProperty.value.type !== 'StringLiteral') {
                  throw new Error('Key property is not literal')
                }
                localizationKey = keyProperty.value.value
              } else if (
                path.node.arguments[0]?.type === 'TemplateLiteral' &&
                path.node.arguments[0].expressions.length === 0 &&
                path.node.arguments[0].quasis.length === 1
              ) {
                localizationKey = path.node.arguments[0].quasis[0]!.value.raw
              } else {
                throw new Error('Unable to extract translation key')
              }

              let moduleNlsIndex = moduleNlsKeys.indexOf(localizationKey)
              if (moduleNlsIndex === -1) {
                moduleNlsIndex = moduleNlsKeys.push(localizationKey) - 1
              }
              path.replace(
                recast.types.builders.callExpression(path.node.callee, [
                  recast.types.builders.numericLiteral(nlsIndex + moduleNlsIndex),
                  ...path.node.arguments.slice(1)
                ])
              )
            }
            this.traverse(path)
          }
        })

        if (moduleNlsKeys.length > 0) {
          chunk.code = recast.print(ast).code

          nlsKeys.push([translationPath, moduleNlsKeys])
          nlsIndex += moduleNlsKeys.length
        }
      }
    },
    async writeBundle() {
      await fs.promises.writeFile(
        nodePath.resolve(DIST_DIR, 'nls.keys.json'),
        JSON.stringify(nlsKeys, null, 2)
      )
    }
  }
}

function resolve(_path: string, fromPaths: string[]) {
  for (const fromPath of fromPaths) {
    for (const extension of EXTENSIONS) {
      const outputPath = nodePath.resolve(fromPath, `${_path}${extension}`)
      if (fs.existsSync(outputPath) && fs.lstatSync(outputPath).isFile()) {
        return outputPath
      }
      const directoryIndexOutputPath = nodePath.resolve(fromPath, `${_path}/index${extension}`)
      if (
        fs.existsSync(directoryIndexOutputPath) &&
        fs.lstatSync(directoryIndexOutputPath).isFile()
      ) {
        return directoryIndexOutputPath
      }
    }
  }
  return undefined
}

function fixedRelative(from: string, to: string) {
  let relative = nodePath.relative(from, to)
  if (!relative.startsWith('.')) {
    relative = './' + relative
  }
  return relative
}

export function relativizeVscodeImportsTransformer(context: ts.TransformationContext) {
  const rewrite = (path: string, importer: string) => {
    if (path.startsWith('vs/') || path.startsWith('vscode/')) {
      const pathDestFile = nodePath.resolve(
        DIST_DIR_MAIN,
        'vscode',
        'src',
        path.replace(/^vscode\/src\//, '')
      )
      const importerDestFile = nodePath.resolve(
        DIST_DIR_MAIN,
        nodePath.relative(SRC_DIR, nodePath.dirname(importer))
      )

      return fixedRelative(importerDestFile, pathDestFile)
    }
    return path
  }

  return (file: ts.SourceFile | ts.Bundle): ts.SourceFile | ts.Bundle => {
    if (!ts.isSourceFile(file) || !file.isDeclarationFile) {
      return file
    }
    const visitor: ts.Visitor = (node): ts.Node => {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier != null &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const importPath = node.moduleSpecifier.text
        const rewritten = rewrite(importPath, file.fileName)

        if (importPath !== rewritten) {
          if (ts.isImportDeclaration(node)) {
            node = ts.factory.updateImportDeclaration(
              node,
              node.modifiers,
              node.importClause,
              ts.factory.createStringLiteral(rewritten),
              node.attributes
            )
          } else {
            node = ts.factory.updateExportDeclaration(
              node,
              node.modifiers,
              node.isTypeOnly,
              node.exportClause,
              ts.factory.createStringLiteral(rewritten),
              node.attributes
            )
          }
        }
      }

      if (ts.isModuleDeclaration(node) && ts.isStringLiteral(node.name)) {
        const rewritten = rewrite(node.name.text, file.fileName)
        node = ts.factory.updateModuleDeclaration(
          node,
          node.modifiers,
          ts.factory.createStringLiteral(rewritten),
          node.body
        )
      }

      if (
        ts.isImportTypeNode(node) &&
        ts.isLiteralTypeNode(node.argument) &&
        ts.isStringLiteral(node.argument.literal)
      ) {
        const rewritten = rewrite(node.argument.literal.text, file.fileName)
        node = ts.factory.updateImportTypeNode(
          node,
          ts.factory.updateLiteralTypeNode(
            node.argument,
            ts.factory.createStringLiteral(rewritten)
          ),
          node.attributes,
          node.qualifier,
          node.typeArguments
        )
      }

      return ts.visitEachChild(node, visitor, context)
    }

    return ts.visitNode(file, visitor) as ts.SourceFile
  }
}
