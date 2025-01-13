import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import * as recast from 'recast'
import typescript from '@rollup/plugin-typescript'
import cleanup from 'js-cleanup'
import commonjs from '@rollup/plugin-commonjs'
import ts from 'typescript'
import replace from '@rollup/plugin-replace'
import * as babylonParser from 'recast/parsers/babylon.js'
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars'
import styles from 'rollup-plugin-styles'
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets'
import glob from 'fast-glob'
import { paramCase } from 'param-case'
import copy from 'rollup-plugin-copy'
import { v5 as uuidv5 } from 'uuid'
import * as fs from 'node:fs'
import * as nodePath from 'node:path'
import { fileURLToPath } from 'node:url'
import subpackagePlugin, {
  type EntryGroup,
  type Manifest,
  type SubPackage
} from './rollup-subpackage-plugin.js'
import carryDtsPlugin from './rollup-carry-dts-plugin.js'

function createEntityName(names: string[]): ts.EntityName {
  if (names.length === 1) {
    return ts.factory.createIdentifier(names[0]!)
  }
  const identifiers = names.map((name) => ts.factory.createIdentifier(name))

  let qualifiedName = ts.factory.createQualifiedName(identifiers.shift()!, identifiers.shift()!)
  while (identifiers.length > 0) {
    qualifiedName = ts.factory.createQualifiedName(qualifiedName, identifiers.shift()!)
  }

  return qualifiedName
}
function replaceInterface(int: ts.InterfaceDeclaration, from: string, entityName: string[]) {
  const importType = ts.factory.createImportTypeNode(
    ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(from)),
    undefined,
    createEntityName(entityName),
    int.typeParameters?.map((param) => ts.factory.createTypeReferenceNode(param.name)),
    false
  )

  return ts.factory.createTypeAliasDeclaration(undefined, int.name, int.typeParameters, importType)
}
function createReplacer(from: string, names: string[]): (int: ts.InterfaceDeclaration) => ts.Node {
  return (int: ts.InterfaceDeclaration) => replaceInterface(int, from, names)
}

const interfaceOverride = new Map<string, (int: ts.InterfaceDeclaration) => ts.Node>()
interfaceOverride.set('Event', createReplacer('vscode', ['Event']))
interfaceOverride.set(
  'IActionDescriptor',
  createReplacer('vs/editor/editor.api', ['editor', 'IActionDescriptor'])
)
interfaceOverride.set(
  'ICodeEditor',
  createReplacer('vs/editor/editor.api', ['editor', 'ICodeEditor'])
)
interfaceOverride.set('IEditor', createReplacer('vs/editor/editor.api', ['editor', 'IEditor']))
interfaceOverride.set(
  'ITextModel',
  createReplacer('vs/editor/editor.api', ['editor', 'ITextModel'])
)
interfaceOverride.set(
  'IEditorOptions',
  createReplacer('vs/editor/editor.api', ['editor', 'IEditorOptions'])
)
interfaceOverride.set(
  'IEditorOverrideServices',
  createReplacer('vs/editor/editor.api', ['editor', 'IEditorOverrideServices'])
)
interfaceOverride.set(
  'IStandaloneCodeEditor',
  createReplacer('vs/editor/editor.api', ['editor', 'IStandaloneCodeEditor'])
)
interfaceOverride.set(
  'IStandaloneDiffEditor',
  createReplacer('vs/editor/editor.api', ['editor', 'IStandaloneDiffEditor'])
)
interfaceOverride.set(
  'IStandaloneEditorConstructionOptions',
  createReplacer('vs/editor/editor.api', ['editor', 'IStandaloneEditorConstructionOptions'])
)
interfaceOverride.set(
  'IStandaloneDiffEditorConstructionOptions',
  createReplacer('vs/editor/editor.api', ['editor', 'IStandaloneDiffEditorConstructionOptions'])
)

const COMMON_PACKAGE_NAME_UUID_NAMESPACE = '251b3eab-b5c9-4930-9c6c-6b38f697d291'

const pkg = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url).pathname).toString()
)

const __dirname = nodePath.dirname(fileURLToPath(import.meta.url))

const ALLOWED_MAIN_DEPENDENCIES = new Set(['@vscode/iconv-lite-umd', 'jschardet', 'marked'])

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

const SIDE_EFFECT_CONSTRUCTORS = new Set(['DomListener'])

const PURE_OR_TO_REMOVE_FUNCTIONS = new Set([...PURE_FUNCTIONS])

/**
 * Files to expose in the editor-api package (just exporting everyting from the corresponding VSCode file)
 * for compability with libraries that import internal monaco-editor modules
 */
const EDITOR_API_EXPOSE_MODULES = [
  // use by monaco-vim
  'vs/editor/common/commands/shiftCommand',
  'vs/editor/browser/config/tabFocus',

  // monaco-graphql
  'vs/editor/contrib/inlineCompletions/browser/inlineCompletions.contribution',
  'vs/editor/contrib/format/browser/formatActions',
  'vs/editor/contrib/bracketMatching/browser/bracketMatching',
  'vs/editor/browser/coreCommands',
  'vs/editor/contrib/clipboard/browser/clipboard',
  'vs/editor/contrib/cursorUndo/browser/cursorUndo',
  'vs/editor/contrib/contextmenu/browser/contextmenu',
  'vs/editor/contrib/find/browser/findController'
]

const EXTENSIONS = ['', '.ts', '.js']

const BASE_DIR = nodePath.resolve(__dirname, '..')
const TSCONFIG = nodePath.resolve(BASE_DIR, 'tsconfig.rollup.json')
const SRC_DIR = nodePath.resolve(BASE_DIR, 'src')
const DIST_DIR = nodePath.resolve(BASE_DIR, 'dist')
const DIST_DIR_MAIN = nodePath.resolve(DIST_DIR, 'tmp')
const VSCODE_DIR = nodePath.resolve(BASE_DIR, 'vscode')
const VSCODE_SRC_DIR = nodePath.resolve(VSCODE_DIR, 'src')
const OVERRIDE_PATH = nodePath.resolve(BASE_DIR, 'src/override')

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

const nlsKeys: [moduleId: string, keys: string[]][] = []
let nlsIndex = 0

function transformVSCodeCode(id: string, code: string) {
  const translationPath = nodePath
    .relative(id.startsWith(OVERRIDE_PATH) ? OVERRIDE_PATH : VSCODE_SRC_DIR, id)
    .slice(0, -3) // remove extension
    .replace(/\._[^/.]*/g, '') // remove own refactor module suffixes

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

  const moduleNlsKeys: string[] = []

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
        transformed = true
      } else if (node.callee.type === 'MemberExpression') {
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
      } else if (node.callee.type === 'FunctionExpression') {
        const lastInstruction = node.callee.body.body[node.callee.body.body.length - 1]
        const lastInstructionIsReturn =
          lastInstruction?.type === 'ReturnStatement' && lastInstruction.argument != null
        if (node.arguments.length > 0 || lastInstructionIsReturn) {
          // heuristic: mark IIFE with parameters or with a return as pure, because typescript compile enums as IIFE
          path.replace(addComment(node))
        }
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
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (transformed) {
    patchedCode = recast.print(ast).code
    patchedCode = patchedCode.replace(/\/\*#__PURE__\*\/\s+/g, '/*#__PURE__*/ ') // Remove space after PURE comment
  }

  if (moduleNlsKeys.length > 0) {
    nlsKeys.push([translationPath, moduleNlsKeys])
    nlsIndex += moduleNlsKeys.length
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

const input = {
  api: './src/extension.api.ts',
  'editor.api': './src/editor.api.ts',
  localExtensionHost: './src/localExtensionHost.ts',
  extensions: './src/extensions.ts',
  services: './src/services.ts',
  l10n: './src/l10n.ts',
  assets: './src/assets.ts',
  lifecycle: './src/lifecycle.ts',
  workbench: './src/workbench.ts',
  'missing-services': './src/missing-services.ts',
  tools: './src/tools.ts',
  monaco: './src/monaco.ts',
  ...Object.fromEntries(
    fs
      .readdirSync(nodePath.resolve(SRC_DIR, 'service-override'), { withFileTypes: true })
      .filter((f) => f.isFile())
      .map((f) => f.name)
      .map((name) => [
        `service-override/${nodePath.basename(name, '.ts')}`,
        `./src/service-override/${name}`
      ])
  ),
  ...Object.fromEntries(
    fs
      .readdirSync(nodePath.resolve(SRC_DIR, 'workers'), { withFileTypes: true })
      .filter((f) => f.isFile())
      .map((f) => f.name)
      .map((name) => [`workers/${nodePath.basename(name, '.ts')}`, `./src/workers/${name}`])
  )
}

const workerGroups: Record<string, string> = {
  languageDetection: 'language-detection-worker',
  outputLinkComputer: 'output',
  textmate: 'textmate',
  notebook: 'notebook',
  localFileSearch: 'search'
}

const externals = Object.keys({ ...pkg.dependencies })
const external = (source: string, importer?: string) => {
  if (importer != null && importer.startsWith(VSCODE_DIR) && source === 'vscode') {
    // if vscode is imported from vscode code itself, mark it as external
    return true
  }
  if (source.includes('tas-client-umd')) return true
  return externals.some((external) => source === external || source.startsWith(`${external}/`))
}

function fixedRelative(from: string, to: string) {
  let relative = nodePath.relative(from, to)
  if (!relative.startsWith('.')) {
    relative = './' + relative
  }
  return relative
}

const COMMON_PLUGINS: rollup.InputPluginOption = [
  importMetaAssets({
    include: ['**/*.ts', '**/*.js']
  }),
  commonjs({
    include: '**/vscode-semver/**/*'
  }),
  {
    name: 'resolve-asset-url',
    resolveFileUrl(options) {
      let relativePath = options.relativePath
      if (!relativePath.startsWith('.')) {
        relativePath = `./${options.relativePath}`
      }
      return `'${relativePath}'`
    }
  },
  nodeResolve({
    extensions: EXTENSIONS
  })
]

export default (args: Record<string, string>): rollup.RollupOptions[] => {
  const vscodeVersion = args['vscode-version']
  delete args['vscode-version']
  const vscodeCommit = args['vscode-commit']
  delete args['vscode-commit']
  const vscodeRef = args['vscode-ref']
  delete args['vscode-ref']
  if (vscodeVersion == null) {
    throw new Error('Vscode version is mandatory')
  }
  return rollup.defineConfig([
    {
      cache: false,
      treeshake: {
        annotations: true,
        preset: 'smallest',
        moduleSideEffects(id) {
          if (id.includes('terminalContribExports')) {
            return false
          }
          return true
        },
        tryCatchDeoptimization: true
      },
      external,
      output: [
        {
          preserveModules: true,
          preserveModulesRoot: 'src',
          minifyInternalExports: false,
          assetFileNames: 'assets/[name][extname]',
          format: 'esm',
          dir: DIST_DIR_MAIN,
          entryFileNames: (chunkInfo) => {
            // Rename node_modules to external so it's not removed while publishing the package
            // tslib and rollup-plugin-styles are bundled
            if (chunkInfo.name.includes('node_modules')) {
              return chunkInfo.name.replace('node_modules', 'external') + '.js'
            }

            return '[name].js'
          },
          hoistTransitiveImports: false
        }
      ],
      input,
      plugins: [
        COMMON_PLUGINS,
        carryDtsPlugin({
          external,
          transformers: [
            (context) => (rootNode) => {
              const sourceFile = rootNode.getSourceFile()
              const fileName = sourceFile.fileName
              if (!fileName.includes('vs/editor') && !fileName.includes('vs/base')) {
                return rootNode
              }
              if (fileName.endsWith('editor.api.d.ts')) {
                return rootNode
              }
              function visit(node: ts.Node): ts.Node {
                if (ts.isInterfaceDeclaration(node)) {
                  const name = node.name.text
                  const replacement = interfaceOverride.get(name)
                  if (replacement != null) {
                    const nodeReplacement = replacement(node)
                    return nodeReplacement
                  }
                }
                return ts.visitEachChild(node, visit, context)
              }
              return ts.visitNode(rootNode, visit)
            }
          ]
        }),
        {
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
          },
          async writeBundle() {
            await fs.promises.writeFile(
              nodePath.resolve(DIST_DIR, 'nls.keys.json'),
              JSON.stringify(nlsKeys, null, 2)
            )
          }
        },
        typescript({
          noEmitOnError: true,
          tsconfig: TSCONFIG,
          compilerOptions: {
            rootDir: SRC_DIR,
            declaration: true,
            declarationDir: DIST_DIR_MAIN,
            outDir: DIST_DIR_MAIN,
            allowJs: true
          },
          transformers: {
            afterDeclarations: [
              function relativizeImport(context) {
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

                return (file) => {
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
            ],
            before: [
              {
                type: 'program',
                factory: function factory(program) {
                  return function transformerFactory(context) {
                    return function transformer(sourceFile) {
                      if (sourceFile.fileName.endsWith('extension.api.ts')) {
                        let exportEqualsFound = false
                        function visitor(node: ts.Node): ts.Node {
                          // Transform `export = api` to `export { field1, field2, ... } = api` as the first syntax is not supported when generating ESM
                          if (ts.isExportAssignment(node) && (node.isExportEquals ?? false)) {
                            if (ts.isIdentifier(node.expression)) {
                              const declaration = program
                                .getTypeChecker()
                                .getSymbolAtLocation(node.expression)!.declarations![0]!
                              if (
                                ts.isVariableDeclaration(declaration) &&
                                declaration.initializer != null &&
                                ts.isObjectLiteralExpression(declaration.initializer)
                              ) {
                                const propertyNames = declaration.initializer.properties.map(
                                  (prop) => (prop.name as ts.Identifier).text
                                )
                                exportEqualsFound = true
                                return context.factory.createVariableStatement(
                                  [context.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
                                  context.factory.createVariableDeclarationList(
                                    [
                                      context.factory.createVariableDeclaration(
                                        context.factory.createObjectBindingPattern(
                                          propertyNames.map((name) =>
                                            context.factory.createBindingElement(
                                              undefined,
                                              undefined,
                                              context.factory.createIdentifier(name)
                                            )
                                          )
                                        ),
                                        undefined,
                                        undefined,
                                        node.expression
                                      )
                                    ],
                                    ts.NodeFlags.Const
                                  )
                                )
                              }
                            }
                          }
                          return node
                        }
                        const transformed = ts.visitEachChild(sourceFile, visitor, context)
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (!exportEqualsFound) {
                          throw new Error('`export =` not found in api.ts')
                        }
                        return transformed
                      }
                      return sourceFile
                    }
                  }
                }
              }
            ]
          }
        }),
        replace({
          VSCODE_VERSION: JSON.stringify(vscodeVersion),
          VSCODE_REF: JSON.stringify(vscodeRef),
          VSCODE_COMMIT: JSON.stringify(vscodeCommit),
          'globalThis.require': 'undefined',
          preventAssignment: true
        }),
        (() => {
          const realPaths = new Map<string, string>()
          return <rollup.Plugin>{
            name: 'vscode-asset-glob-meta-url',
            async resolveId(importee) {
              if (!importee.includes('*')) {
                return null
              }

              const fakePath = nodePath.resolve(VSCODE_SRC_DIR, importee.replace(/\*/, 'all'))
              realPaths.set(fakePath, importee)
              return fakePath
            },
            async load(id) {
              const realPath = realPaths.get(id)
              if (realPath == null) {
                return undefined
              }
              const files = await glob(realPath, { cwd: VSCODE_SRC_DIR })

              const fileRefs = await Promise.all(
                files.map(async (file) => {
                  const filePath = nodePath.resolve(VSCODE_SRC_DIR, file)
                  const ref = this.emitFile({
                    type: 'asset',
                    name: nodePath.basename(file),
                    source: await fs.promises.readFile(filePath)
                  })
                  return { file, ref }
                })
              )
              return `export default {${fileRefs.map(({ file, ref }) => `\n  '${file}': new URL(import.meta.ROLLUP_FILE_URL_${ref}, import.meta.url).href`).join(',')}\n}`
            }
          }
        })(),
        styles({
          mode: 'inject',
          minimize: true
        }),
        {
          name: 'dynamic-import-polyfill',
          renderDynamicImport({ targetModuleId }): { left: string; right: string } {
            // Hack for @vscode/tree-sitter-wasm that doesn't export its parser correctly (as default instead of a named export, in commonjs)
            if (targetModuleId === '@vscode/tree-sitter-wasm') {
              return {
                left: 'import(',
                right: ').then(module => ({ Parser: module.default ?? module }))'
              }
            }
            // dynamic imports of vscode-oniguruma and vscode-textmate aren't working without it on vite
            return {
              left: 'import(',
              right: ').then(module => module.default ?? module)'
            }
          }
        },
        dynamicImportVars({
          exclude: ['**/amdX.js']
        }),
        {
          name: 'cleanup',
          renderChunk(code) {
            return cleanup(code, null, {
              comments: 'none',
              sourcemap: false
            }).code
          }
        },
        subpackagePlugin({
          getEntryGroups(entrypoints, options) {
            const serviceOverrideDir = nodePath.resolve(options.dir!, 'service-override')
            const workersDir = nodePath.resolve(options.dir!, 'workers')

            const getGroupName = (id: string) => {
              if (id.startsWith(serviceOverrideDir)) {
                const name = paramCase(nodePath.basename(id, '.js'))
                return `service-override:${name}`
              }
              if (id.startsWith(workersDir)) {
                const name = workerGroups[nodePath.basename(id, '.worker.js')]
                return name != null ? `service-override:${name}` : 'main'
              }
              if (id === nodePath.resolve(options.dir!, 'editor.api.js')) {
                return 'editor.api'
              }
              return 'main'
            }

            const groupMaps = new Map<string, EntryGroup>()
            for (const entrypoint of entrypoints) {
              const name = getGroupName(entrypoint)

              const group: EntryGroup = groupMaps.get(name) ?? {
                name,
                entrypoints: [],
                main: name === 'main'
              }
              groupMaps.set(name, group)
              group.entrypoints.push(entrypoint)
              const dts = entrypoint.replace(/\.js$/, '.d.ts')
              if (fs.existsSync(dts)) {
                // console.log('ADDING DTS', entrypoint, dts)
                group.entrypoints.push(dts)
              }
            }

            return Array.from(groupMaps.values())
          },
          getGroupSetName(groups) {
            if (groups.size === 1) {
              const uniqueGroup = groups.values().next().value!
              switch (uniqueGroup) {
                case 'main':
                  return {
                    name: '@codingame/monaco-vscode-api',
                    alias: 'vscode',
                    version: '0.0.0-semantic-release',
                    description: pkg.description
                  }
                case 'editor.api':
                  return {
                    name: '@codingame/monaco-vscode-editor-api',
                    alias: 'monaco-editor',
                    version: '0.0.0-semantic-release',
                    description: `${pkg.description} - monaco-editor compatible api`
                  }
                default: {
                  const match = /^(.*):(.*)$/.exec(uniqueGroup)!
                  const [_, category, name] = match
                  return {
                    name: `@codingame/monaco-vscode-${paramCase(name!)}-${category}`,
                    version: '0.0.0-semantic-release',
                    description: `${pkg.description} - ${name} ${category}`
                  }
                }
              }
            }

            const name = Array.from(groups.values())
              .slice()
              .sort()
              .map((groupName) => {
                const match = /^(.*):(.*)$/.exec(groupName)
                if (match == null) {
                  return groupName
                }
                const [_, _category, name] = match
                return name
              })
              .join(', ')
            return {
              name: `@codingame/monaco-vscode-${uuidv5(Array.from(groups.values()).join('-'), COMMON_PACKAGE_NAME_UUID_NAMESPACE)}-common`,
              version: '0.0.0-semantic-release',
              description: `${pkg.description} - common package (${name})`
            }
          },
          getMainModule(id) {
            // attach .d.ts files to their .js file
            return id.replace(/\.d\.ts$/, '.js')
          },
          getRollupOptions(packageName, groups, options) {
            const isCommonPackage = groups.size > 1
            const isEditorApi = packageName === '@codingame/monaco-vscode-editor-api'
            const needsEmptyModule = isCommonPackage || isEditorApi

            const rollupOptions: rollup.RollupOptions = {
              ...options,
              treeshake: false,
              external,
              output: {
                ...options.output,
                dir: `dist/packages/${packageName.replace(/^.*\//, '')}`
              },
              plugins: [
                options.plugins,
                COMMON_PLUGINS,
                carryDtsPlugin({
                  external
                }),
                {
                  name: 'resolve-vscode',
                  resolveId(source) {
                    if (source === 'vscode') {
                      return {
                        external: true,
                        id: 'vscode'
                      }
                    }
                    return undefined
                  }
                },
                needsEmptyModule
                  ? {
                      name: 'empty-file-generator',
                      generateBundle() {
                        this.emitFile({
                          fileName: 'empty.js',
                          needsCodeReference: false,
                          source: 'export {}',
                          type: 'asset'
                        })
                      }
                    }
                  : []
              ]
            }

            if (packageName === '@codingame/monaco-vscode-api') {
              rollupOptions.plugins = [
                rollupOptions.plugins,
                {
                  name: 'reference-proposed-types',
                  async renderChunk(code, chunk) {
                    if (chunk.fileName.endsWith('extensions.d.ts')) {
                      return `/// <reference path="./vscode-dts/vscode.proposed.d.ts" />\n${code}`
                    }
                    return undefined
                  }
                },
                {
                  name: 'replace-editor-types',
                  async renderChunk(code, chunk) {
                    if (chunk.fileName.endsWith('vscode/src/vs/editor/editor.api.d.ts')) {
                      return (
                        await fs.promises.readFile(
                          nodePath.resolve(BASE_DIR, 'monaco-editor/editor.api.d.ts')
                        )
                      ).toString()
                    }
                    return undefined
                  }
                }
              ]
            }

            if (packageName === '@codingame/monaco-vscode-editor-api') {
              rollupOptions.input = {
                'esm/vs/editor/editor.api': (rollupOptions.input as string[])[0]!,
                'esm/vs/editor/editor.api.d': (rollupOptions.input as string[])[0]!.replace(
                  /\.js$/,
                  '.d.ts'
                )
              }
              rollupOptions.plugins = [
                rollupOptions.plugins,
                {
                  name: 'editor-api-expose-modules',
                  async generateBundle() {
                    for (const modulePath of EDITOR_API_EXPOSE_MODULES) {
                      // make sure file exists
                      fs.statSync(nodePath.resolve(VSCODE_SRC_DIR, `${modulePath}.js`))
                      this.emitFile({
                        fileName: `esm/${modulePath}.js`,
                        needsCodeReference: false,
                        source: `export * from 'vscode/vscode/${modulePath}'`,
                        type: 'asset'
                      })
                      this.emitFile({
                        fileName: `esm/${modulePath}.d.ts`,
                        needsCodeReference: false,
                        source: `export * from 'vscode/vscode/${modulePath}'`,
                        type: 'asset'
                      })
                    }
                    this.emitFile({
                      fileName: 'esm/vs/editor/editor.worker.js',
                      needsCodeReference: false,
                      source: "export * from 'vscode/workers/editor.worker'",
                      type: 'asset'
                    })
                  }
                }
              ]
            }

            if (
              groups.size === 1 &&
              groups.values().next().value!.startsWith('service-override:')
            ) {
              // replace input list by Record to be able to name the entrypoint "index" and the worker entrypoint "worker"
              const serviceOverrideEntryPoint = (rollupOptions.input as string[]).find((e) =>
                e.includes('/service-override/')
              )!
              const workerEntryPoint = (rollupOptions.input as string[]).find((e) =>
                e.includes('/workers/')
              )

              rollupOptions.input = {
                index: serviceOverrideEntryPoint,
                'index.d': serviceOverrideEntryPoint.replace(/\.js$/, '.d.ts'),
                ...(workerEntryPoint != null
                  ? {
                      worker: workerEntryPoint
                    }
                  : {})
              }
            }

            return rollupOptions
          },
          getInterPackageImport(path, groupSetName) {
            if (/service-override\/[a-zA-Z]+\.(js|d\.ts)$/.exec(path) != null) {
              // reference the package entrypoint
              return groupSetName.alias ?? groupSetName.name
            }
            return `${groupSetName.alias ?? groupSetName.name}/${path.replace(/vscode\/src\//, 'vscode/').replace(/\.(js|d\.ts)$/, '')}`
          },
          getManifest(packageName, groups, entrypoints, manifest, externalDependencies) {
            const baseManifest: Manifest = {
              ...Object.fromEntries(
                Object.entries(pkg).filter(([key]) =>
                  [
                    'name',
                    'description',
                    'version',
                    'keywords',
                    'author',
                    'license',
                    'repository',
                    'type',
                    'private'
                  ].includes(key)
                )
              ),
              private: false,
              ...manifest,
              dependencies: Object.fromEntries(
                externalDependencies
                  // Remove external dependencies importer from d.ts files
                  .filter((d) =>
                    Array.from(d.importers).some((importer) => !importer.endsWith('.d.ts'))
                  )
                  .map((d) => {
                    return [d.name, d.version]
                  })
              )
            }
            switch (manifest.name!) {
              case '@codingame/monaco-vscode-api': {
                const notAllowedDependencies = Object.keys(baseManifest.dependencies ?? {}).filter(
                  (d) => !ALLOWED_MAIN_DEPENDENCIES.has(d)
                )
                if (notAllowedDependencies.length > 0) {
                  this.warn(
                    `Not allowed dependencies detected in main package: ${notAllowedDependencies.join(', ')}`
                  )
                }
                return <Manifest>{
                  ...baseManifest,
                  main: 'api.js',
                  module: 'api.js',
                  exports: {
                    '.': {
                      default: './api.js'
                    },
                    './vscode/*': {
                      default: './vscode/src/*.js',
                      types: './vscode/src/*.d.ts'
                    },
                    './*': {
                      default: './*.js',
                      types: './*.d.ts'
                    }
                  },
                  typesVersions: {
                    '*': {
                      services: ['./services.d.ts'],
                      extensions: ['./extensions.d.ts'],
                      'service-override/*': ['./service-override/*.d.ts'],
                      monaco: ['./monaco.d.ts'],
                      assets: ['./assets.d.ts'],
                      lifecycle: ['./lifecycle.d.ts'],
                      l10n: ['./l10n.d.ts'],
                      'vscode/*': ['./vscode/src/*.d.ts']
                    }
                  }
                }
              }
              case '@codingame/monaco-vscode-editor-api': {
                return <Manifest>{
                  ...baseManifest,
                  exports: {
                    '.': './esm/vs/editor/editor.api.js',
                    ...Object.fromEntries(
                      [
                        'vs/editor/editor.api',
                        'vs/editor/editor.worker',
                        ...EDITOR_API_EXPOSE_MODULES
                      ].flatMap((module) => {
                        return Object.entries({
                          [`./esm/${module}`]: `./esm/${module}.js`,
                          [`./esm/${module}.js`]: `./esm/${module}.js`
                        })
                      })
                    ),
                    './esm/vs/basic-languages/*': './empty.js',
                    './esm/vs/language/*': './empty.js'
                  },
                  main: 'esm/vs/editor/editor.api.js',
                  module: 'esm/vs/editor/editor.api.js',
                  types: 'esm/vs/editor/editor.api.d.ts'
                }
              }
              default: {
                if (groups.size > 1) {
                  // common package
                  return <Manifest>{
                    ...baseManifest,
                    exports: {
                      '.': {
                        default: './empty.js'
                      },
                      './vscode/*': {
                        default: './vscode/src/*.js',
                        types: './vscode/src/*.d.ts'
                      },
                      './*': {
                        default: './*.js',
                        types: './*.d.ts'
                      }
                    }
                  }
                } else {
                  // service-override package
                  return {
                    ...baseManifest,
                    main: 'index.js',
                    module: 'index.js',
                    types: 'index.d.ts',
                    exports: {
                      '.': {
                        default: './index.js'
                      },
                      './vscode/*': {
                        default: './vscode/src/*.js',
                        types: './vscode/src/*.d.ts'
                      },
                      ...(entrypoints.has('worker.js')
                        ? {
                            './worker': {
                              default: './worker.js'
                            }
                          }
                        : {}),
                      './*': {
                        default: './*.js',
                        types: './*.d.ts'
                      }
                    }
                  }
                }
              }
            }
          },
          async finalize(subpackages) {
            const mainDependendentPackages = new Set<SubPackage>()

            const propagate = (mainPackage: SubPackage) => {
              for (const dependency of mainPackage.packageDependencies) {
                if (
                  !mainDependendentPackages.has(dependency) &&
                  Array.from(dependency.importers).some((importer) => !importer.endsWith('.d.ts'))
                ) {
                  mainDependendentPackages.add(dependency)
                  propagate(dependency)
                }
              }
            }
            propagate(subpackages.find((p) => p.name === '@codingame/monaco-vscode-api')!)

            for (const subpackage of mainDependendentPackages) {
              console.log(subpackage.name, subpackage.externalDependencies)
            }

            const allMainDependencies = new Set(
              Array.from(mainDependendentPackages).flatMap((p) => {
                return p.externalDependencies
                  .filter((d) =>
                    Array.from(d.importers).some((importer) => !importer.endsWith('.d.ts'))
                  )
                  .map((ed) => {
                    return ed.name
                  })
              })
            )

            console.log(allMainDependencies)
          }
        }),
        {
          name: 'clean',
          async closeBundle() {
            try {
              await fs.promises.rm(DIST_DIR_MAIN, {
                recursive: true
              })
            } catch (err) {
              // ignore, may not exists
            }
          }
        },
        copy({
          hook: 'writeBundle',
          targets: [
            { src: ['README.md'], dest: 'dist/packages/monaco-vscode-api' },
            {
              src: 'vscode/src/vs/workbench/contrib/debug/common/debugProtocol.d.ts',
              dest: 'dist/packages/monaco-vscode-api/'
            },
            {
              src: 'vscode/src/vscode-dts/*.d.ts',
              dest: 'dist/packages/monaco-vscode-api/vscode-dts'
            }
          ]
        })
      ]
    }
  ])
}

function resolve(_path: string, fromPaths: string[]) {
  for (const fromPath of fromPaths) {
    for (const extension of EXTENSIONS) {
      const outputPath = nodePath.resolve(fromPath, `${_path}${extension}`)
      if (fs.existsSync(outputPath) && fs.lstatSync(outputPath).isFile()) {
        return outputPath
      }
    }
  }
  return undefined
}
