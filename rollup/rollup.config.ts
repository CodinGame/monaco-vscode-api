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
import { PackageJson } from 'type-fest'
import copy from 'rollup-plugin-copy'
import * as fs from 'node:fs'
import * as nodePath from 'node:path'
import { fileURLToPath } from 'node:url'
import metadataPlugin from './rollup-metadata-plugin'

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
 * root files that should never be extracted from the main package to a service override package
 */
const SHARED_ROOT_FILES_BETWEEN_PACKAGES = [
  'services.js',
  'extensions.js',
  'monaco.js',
  'assets.js',
  'lifecycle.js',
  'workbench.js',
  'missing-services.js',
  'l10n.js'
]
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
  'vs/editor/contrib/hover/browser/contentHoverController',
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
const DIST_DIR_MAIN = nodePath.resolve(DIST_DIR, 'main')
const DIST_SERVICE_OVERRIDE_DIR_MAIN = nodePath.resolve(DIST_DIR_MAIN, 'service-override')
const VSCODE_SRC_DIST_DIR = nodePath.resolve(DIST_DIR_MAIN, 'vscode', 'src')
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

  // import weak so that AbstractTextEditor is not imported just to do an instanceof on it
  if (
    importer != null &&
    importer.includes('vs/workbench/api/browser/mainThreadDocumentsAndEditors') &&
    importee.includes('browser/parts/editor/textEditor')
  ) {
    importee = importee.replace('textEditor', 'textEditor.weak')
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
const external: rollup.ExternalOption = (source) => {
  if (source.includes('tas-client-umd')) return true
  return externals.some((external) => source === external || source.startsWith(`${external}/`))
}

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
          dir: 'dist/main',
          entryFileNames: (chunkInfo) => {
            // Rename node_modules to external so it's not removing while publishing the package
            // tslib and rollup-plugin-styles and bundled
            if (chunkInfo.name.includes('node_modules')) {
              return chunkInfo.name.replace('node_modules', 'external') + '.js'
            }
            return '[name].js'
          },
          chunkFileNames: '[name].js',
          hoistTransitiveImports: false
        }
      ],
      input,
      plugins: [
        importMetaAssets({
          include: ['**/*.ts', '**/*.js']
        }),
        commonjs({
          include: '**/vscode-semver/**/*'
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
        }),
        typescript({
          noEmitOnError: true,
          tsconfig: TSCONFIG,
          compilerOptions: {
            outDir: 'dist/main'
          },
          transformers: {
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
        })
      ]
    },
    {
      // 2nd pass to improve treeshaking
      cache: false,
      treeshake: {
        annotations: true,
        preset: 'smallest',
        propertyReadSideEffects: false,
        tryCatchDeoptimization: true,
        moduleSideEffects(id) {
          return id.startsWith(DIST_DIR) || id.endsWith('.css')
        }
      },
      external,
      input: Object.fromEntries(Object.keys(input).map((f) => [f, `./dist/main/${f}`])),
      output: [
        {
          preserveModules: true,
          preserveModulesRoot: 'dist/main',
          minifyInternalExports: false,
          assetFileNames: 'assets/[name][extname]',
          format: 'esm',
          dir: 'dist/main',
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          hoistTransitiveImports: false
        }
      ],
      plugins: [
        importMetaAssets({
          include: ['**/*.ts', '**/*.js']
          // assets are externals and this plugin is not able to ignore external assets
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
        {
          name: 'improve-treeshaking',
          transform(code, id) {
            if (id.includes('semver')) {
              // ignore semver because it's commonjs code and rollup commonjs code generate IIFEs that this plugin will remove
              return
            }
            const ast = recast.parse(code, {
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
              visitCallExpression(path) {
                const node = path.node
                if (node.callee.type === 'MemberExpression') {
                  if (node.callee.property.type === 'Identifier') {
                    const name = getMemberExpressionPath(node.callee)
                    if (
                      (name != null && PURE_FUNCTIONS.has(name)) ||
                      PURE_FUNCTIONS.has(node.callee.property.name)
                    ) {
                      path.replace(addComment(node))
                    }
                  }
                } else if (
                  node.callee.type === 'Identifier' &&
                  PURE_FUNCTIONS.has(node.callee.name)
                ) {
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
                return undefined
              },
              visitThrowStatement() {
                return false
              }
            })
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (transformed) {
              code = recast.print(ast).code
              code = code.replace(/\/\*#__PURE__\*\/\s+/g, '/*#__PURE__*/ ') // Remove space after PURE comment
            }
            return code
          }
        },
        {
          name: 'externalize-service-overrides',
          resolveId(source, importer) {
            const importerDir = nodePath.dirname(nodePath.resolve(DIST_DIR_MAIN, importer ?? '/'))
            const resolved = nodePath.resolve(importerDir, source)
            if (nodePath.dirname(resolved) === DIST_SERVICE_OVERRIDE_DIR_MAIN && importer != null) {
              const serviceOverride = nodePath.basename(resolved, '.js')
              return {
                external: true,
                id: `@codingame/monaco-vscode-${paramCase(serviceOverride)}-service-override`
              }
            }
            return undefined
          }
        },
        nodeResolve({
          extensions: EXTENSIONS
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
        metadataPlugin({
          generateCombinationGroups: true,
          getCombinedGroup(names) {
            const name = names
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
              .join('-')
            return {
              name: `common:${name}`,
              publicName: `@codingame/monaco-vscode-${name}-common`
            }
          },
          // generate package.json and service-override packages
          getGroup(id: string, options) {
            const serviceOverrideDir = nodePath.resolve(options.dir!, 'service-override')
            const workersDir = nodePath.resolve(options.dir!, 'workers')

            if (id.startsWith(serviceOverrideDir)) {
              const name = paramCase(nodePath.basename(id, '.js'))
              return {
                name: `service-override:${name}`,
                publicName: `@codingame/monaco-vscode-${name}-service-override`
              }
            }
            if (id.startsWith(workersDir)) {
              const name = workerGroups[nodePath.basename(id, '.worker.js')]
              return {
                name: name != null ? `service-override:${name}` : 'main',
                publicName:
                  name != null ? `@codingame/monaco-vscode-${name}-service-override` : 'vscode'
              }
            }
            if (id === nodePath.resolve(options.dir!, 'editor.api.js')) {
              return {
                name: 'editor.api',
                publicName: '@codngame/monaco-vscode-editor-api'
              }
            }
            return {
              name: 'main',
              publicName: 'vscode',
              priority: 1
            }
          },
          async handle({ group, moduleGroupName, otherDependencies, otherModules, bundle }) {
            const customResolutionPlugin = ({
              customLoad,
              forMain = false
            }: {
              customLoad: (id: string) => string | undefined
              forMain?: boolean
            }) =>
              <rollup.Plugin>{
                name: 'custom-resolution',
                resolveId(source, importer) {
                  if (source === 'entrypoint' || source === 'worker') {
                    return source
                  }
                  if (source.startsWith('@codingame/monaco-vscode-')) {
                    return {
                      external: true,
                      id: source
                    }
                  }
                  const importerDir = nodePath.dirname(
                    nodePath.resolve(DIST_DIR_MAIN, importer ?? '/')
                  )
                  const resolved = nodePath.resolve(importerDir, source)
                  const resolvedWithExtension = resolved.endsWith('.js')
                    ? resolved
                    : `${resolved}.js`

                  const isVscodeFile = resolved.startsWith(VSCODE_SRC_DIST_DIR)
                  const isServiceOverride =
                    nodePath.dirname(resolved) === DIST_SERVICE_OVERRIDE_DIR_MAIN
                  const isExclusive = group.exclusiveModules.has(resolvedWithExtension)
                  const pathFromRoot = nodePath.relative(DIST_DIR_MAIN, resolvedWithExtension)
                  const shouldBeShared = SHARED_ROOT_FILES_BETWEEN_PACKAGES.includes(
                    nodePath.relative(DIST_DIR_MAIN, resolvedWithExtension)
                  )
                  if (pathFromRoot.startsWith('external/') && !isExclusive) {
                    if (forMain) {
                      return undefined
                    }
                    return {
                      external: true,
                      id: `vscode/${pathFromRoot}`
                    }
                  }

                  if (((isVscodeFile || isServiceOverride) && !isExclusive) || shouldBeShared) {
                    function getPackageFromGroupName(groupName: string) {
                      if (groupName === 'main') {
                        return 'vscode'
                      }
                      const [_, category, name] = /^(.*):(.*)$/.exec(groupName)!
                      return `@codingame/monaco-vscode-${name}-${category}`
                    }
                    const importFromGroup = isVscodeFile
                      ? (moduleGroupName.get(resolved) ?? 'main')
                      : 'main'
                    if (importFromGroup === 'main' && forMain) {
                      return undefined
                    }

                    const importFromModule = getPackageFromGroupName(importFromGroup)
                    // Those modules will be imported from external monaco-vscode-api
                    let externalResolved = resolved.startsWith(VSCODE_SRC_DIST_DIR)
                      ? `${importFromModule}/vscode/${nodePath.relative(VSCODE_SRC_DIST_DIR, resolved)}`
                      : `${importFromModule}/${nodePath.relative(DIST_DIR_MAIN, resolved)}`
                    if (externalResolved.endsWith('.js')) {
                      externalResolved = externalResolved.slice(0, -3)
                    }
                    return {
                      id: externalResolved,
                      external: true
                    }
                  }

                  return undefined
                },
                load(id) {
                  const customLoadResult = customLoad(id)
                  if (customLoadResult != null) {
                    return customLoadResult
                  }
                  if (id.startsWith('vscode/')) {
                    return (
                      bundle[nodePath.relative('vscode', id)] as rollup.OutputChunk | undefined
                    )?.code
                  }
                  return (
                    bundle[nodePath.relative(DIST_DIR_MAIN, id)] as rollup.OutputChunk | undefined
                  )?.code
                },
                resolveFileUrl(options) {
                  let relativePath = options.relativePath
                  if (!relativePath.startsWith('.')) {
                    relativePath = `./${options.relativePath}`
                  }
                  return `'${relativePath}'`
                }
              }

            if (group.name === 'main') {
              const dependencies = new Set([...group.directDependencies, ...otherDependencies])
              const externalMainDependencies = Object.fromEntries(
                Object.entries(pkg.dependencies).filter(([key]) => dependencies.has(key))
              )
              const notAllowedDependencies = Object.keys(externalMainDependencies).filter(
                (d) => !ALLOWED_MAIN_DEPENDENCIES.has(d)
              )
              if (notAllowedDependencies.length > 0) {
                this.warn(
                  `Not allowed dependencies detected in main package: ${notAllowedDependencies.join(', ')}`
                )
              }

              // Generate package.json
              const packageJson: PackageJson = {
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
                      'type'
                    ].includes(key)
                  )
                ),
                private: false,
                main: 'api.js',
                module: 'api.js',
                exports: {
                  '.': {
                    default: './api.js'
                  },
                  './services': {
                    types: './services.d.ts',
                    default: './services.js'
                  },
                  './localExtensionHost': {
                    types: './localExtensionHost.d.ts',
                    default: './localExtensionHost.js'
                  },
                  './extensions': {
                    types: './extensions.d.ts',
                    default: './extensions.js'
                  },
                  './assets': {
                    types: './assets.d.ts',
                    default: './assets.js'
                  },
                  './missing-services': {
                    default: './missing-services.js'
                  },
                  './lifecycle': {
                    types: './lifecycle.d.ts',
                    default: './lifecycle.js'
                  },
                  './workbench': {
                    default: './workbench.js'
                  },
                  './service-override/*': {
                    types: './service-override/*.d.ts',
                    default: './service-override/*.js'
                  },
                  './workers/*': {
                    default: './workers/*.js'
                  },
                  './monaco': {
                    types: './monaco.d.ts',
                    default: './monaco.js'
                  },
                  './l10n': {
                    types: './l10n.d.ts',
                    default: './l10n.js'
                  },
                  './vscode/*': {
                    default: './vscode/src/*.js'
                  },
                  './external/*': {
                    default: './external/*'
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
                },
                dependencies: {
                  ...externalMainDependencies,
                  ...Object.fromEntries(
                    Array.from(dependencies)
                      .filter((dep) => dep.startsWith('@codingame/monaco-vscode-'))
                      .map((dep) => [dep, pkg.version])
                  )
                }
              }
              this.emitFile({
                fileName: 'package.json',
                needsCodeReference: false,
                source: JSON.stringify(packageJson, null, 2),
                type: 'asset'
              })

              const groupBundle = await rollup.rollup({
                input: Array.from([...group.exclusiveModules, ...otherModules]),
                external,
                treeshake: false,
                plugins: [
                  importMetaAssets({
                    include: ['**/*.ts', '**/*.js']
                  }),
                  nodeResolve({
                    extensions: EXTENSIONS
                  }),
                  customResolutionPlugin({
                    forMain: true,
                    customLoad() {
                      return undefined
                    }
                  })
                ]
              })
              const output = await groupBundle.generate({
                preserveModules: true,
                preserveModulesRoot: nodePath.resolve(DIST_DIR, 'main'),
                minifyInternalExports: false,
                assetFileNames: 'assets/[name][extname]',
                format: 'esm',
                dir: nodePath.resolve(DIST_DIR, 'main'),
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                hoistTransitiveImports: false
              })
              for (const chunkOrAsset of output.output) {
                if (chunkOrAsset.type === 'chunk') {
                  this.emitFile({
                    type: 'prebuilt-chunk',
                    code: chunkOrAsset.code,
                    fileName: chunkOrAsset.fileName,
                    exports: chunkOrAsset.exports,
                    map: chunkOrAsset.map ?? undefined,
                    sourcemapFileName: chunkOrAsset.sourcemapFileName ?? undefined
                  })
                }
                bundle[chunkOrAsset.fileName] = chunkOrAsset
              }

              await groupBundle.close()
            } else if (group.name === 'editor.api') {
              const directory = nodePath.resolve(DIST_DIR, 'editor-api')

              await fs.promises.mkdir(directory, {
                recursive: true
              })

              const packageJson: PackageJson = {
                name: '@codingame/monaco-vscode-editor-api',
                version: '0.0.0-semantic-release',
                keywords: [],
                author: {
                  name: 'CodinGame',
                  url: 'http://www.codingame.com'
                },
                license: 'MIT',
                repository: {
                  type: 'git',
                  url: 'git+https://github.com/CodinGame/monaco-vscode-api.git'
                },
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
                type: 'module',
                private: false,
                description:
                  'VSCode public API plugged on the monaco editor - monaco-editor compatible api',
                main: 'esm/vs/editor/editor.api.js',
                module: 'esm/vs/editor/editor.api.js',
                types: 'esm/vs/editor/editor.api.d.ts',
                dependencies: {
                  vscode: `npm:${pkg.name}@^${pkg.version}`
                }
              }
              const groupBundle = await rollup.rollup({
                input: {
                  'esm/vs/editor/editor.api': 'entrypoint'
                },
                external,
                treeshake: false,
                plugins: [
                  nodeResolve({
                    extensions: EXTENSIONS
                  }),
                  customResolutionPlugin({
                    customLoad: (id) => {
                      if (id === 'entrypoint') {
                        return `export * from '${Array.from(group.entrypoints)[0]!.slice(0, -3)}'`
                      }
                      return undefined
                    }
                  }),
                  {
                    name: 'bundle-generator',
                    generateBundle() {
                      this.emitFile({
                        fileName: 'package.json',
                        needsCodeReference: false,
                        source: JSON.stringify(packageJson, null, 2),
                        type: 'asset'
                      })
                      for (const modulePath of EDITOR_API_EXPOSE_MODULES) {
                        // make sure file exists
                        fs.statSync(nodePath.resolve(VSCODE_SRC_DIR, `${modulePath}.js`))
                        this.emitFile({
                          fileName: `esm/${modulePath}.js`,
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
                      this.emitFile({
                        fileName: 'empty.js',
                        needsCodeReference: false,
                        source: 'export {}',
                        type: 'asset'
                      })
                    }
                  }
                ]
              })
              await groupBundle.write({
                minifyInternalExports: false,
                format: 'esm',
                dir: directory,
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                hoistTransitiveImports: false
              })
              await groupBundle.close()
              // remove exclusive files from main bundle to prevent them from being duplicated
              for (const exclusiveModule of group.exclusiveModules) {
                delete bundle[nodePath.relative(DIST_DIR_MAIN, exclusiveModule)]
              }
            } else if (group.isCombination) {
              const [_, category, name] = /^(.*):(.*)$/.exec(group.name)!

              const directory = nodePath.resolve(DIST_DIR, `${category}-${name}`)

              await fs.promises.mkdir(directory, {
                recursive: true
              })

              const packageJson: PackageJson = {
                name: `@codingame/monaco-vscode-${name}-${category}`,
                ...Object.fromEntries(
                  Object.entries(pkg).filter(([key]) =>
                    ['version', 'keywords', 'author', 'license', 'repository', 'type'].includes(key)
                  )
                ),
                private: false,
                description: `${pkg.description} - ${name} ${category}`,
                exports: {
                  '.': {
                    default: './empty.js'
                  },
                  './vscode/*': {
                    default: './src/*.js'
                  }
                }
              }

              const groupBundle = await rollup.rollup({
                input: Array.from(group.exclusiveModules),
                external,
                treeshake: false,
                plugins: [
                  importMetaAssets({
                    include: ['**/*.ts', '**/*.js']
                    // assets are externals and this plugin is not able to ignore external assets
                  }),
                  nodeResolve({
                    extensions: EXTENSIONS
                  }),
                  customResolutionPlugin({
                    customLoad() {
                      return undefined
                    }
                  }),
                  {
                    name: 'bundle-generator',
                    generateBundle() {
                      const externalDependencies = Array.from(this.getModuleIds()).filter(
                        (id) => this.getModuleInfo(id)!.isExternal
                      )

                      const uniqueExternalDependencies = new Set(
                        externalDependencies.flatMap((dep) => {
                          const match = /((?:@[^/]+?\/)?[^/]*)(?:\/.*)?/.exec(dep)
                          if (match == null) {
                            return []
                          }
                          return [match[1]!]
                        })
                      )
                      packageJson.dependencies = {
                        vscode: `npm:${pkg.name}@^${pkg.version}`,
                        ...Object.fromEntries(
                          Object.entries(pkg.dependencies).filter(([key]) =>
                            uniqueExternalDependencies.has(key)
                          )
                        ),
                        ...Object.fromEntries(
                          Array.from(uniqueExternalDependencies)
                            .filter((dep) => dep.startsWith('@codingame/monaco-vscode-'))
                            .map((dep) => {
                              return [dep, pkg.version]
                            })
                        )
                      }

                      this.emitFile({
                        fileName: 'empty.js',
                        needsCodeReference: false,
                        source: 'export {}',
                        type: 'asset'
                      })
                      this.emitFile({
                        fileName: 'package.json',
                        needsCodeReference: false,
                        source: JSON.stringify(packageJson, null, 2),
                        type: 'asset'
                      })
                    }
                  }
                ]
              })
              const output = await groupBundle.write({
                preserveModules: true,
                preserveModulesRoot: nodePath.resolve(DIST_DIR, 'main/vscode'),
                minifyInternalExports: false,
                assetFileNames: 'assets/[name][extname]',
                format: 'esm',
                dir: directory,
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                hoistTransitiveImports: false
              })
              await groupBundle.close()

              // remove exclusive files from main bundle to prevent them from being duplicated
              for (const exclusiveModule of group.exclusiveModules) {
                delete bundle[nodePath.relative(DIST_DIR_MAIN, exclusiveModule)]
              }

              const assets = output.output
                .filter((file): file is rollup.OutputAsset => file.type === 'asset')
                .filter((file) => file.fileName !== 'package.json')
              for (const asset of assets) {
                delete bundle[asset.fileName]
              }
            } else {
              const [_, category, name] = /^(.*):(.*)$/.exec(group.name)!

              const directory = nodePath.resolve(DIST_DIR, `${category}-${name}`)

              await fs.promises.mkdir(directory, {
                recursive: true
              })
              const serviceOverrideEntryPoint = Array.from(group.entrypoints).find((e) =>
                e.includes('/service-override/')
              )!
              const workerEntryPoint = Array.from(group.entrypoints).find((e) =>
                e.includes('/workers/')
              )

              const packageJson: PackageJson = {
                name: `@codingame/monaco-vscode-${name}-${category}`,
                ...Object.fromEntries(
                  Object.entries(pkg).filter(([key]) =>
                    ['version', 'keywords', 'author', 'license', 'repository', 'type'].includes(key)
                  )
                ),
                private: false,
                description: `${pkg.description} - ${name} ${category}`,
                main: 'index.js',
                module: 'index.js',
                types: 'index.d.ts',
                exports: {
                  '.': {
                    default: './index.js'
                  },
                  './vscode/*': {
                    default: './vscode/src/*.js'
                  },
                  ...(workerEntryPoint != null
                    ? {
                        './worker': {
                          default: './worker.js'
                        }
                      }
                    : {})
                }
              }

              const entrypointInfo = this.getModuleInfo(serviceOverrideEntryPoint)!

              const groupBundle = await rollup.rollup({
                input: {
                  index: 'entrypoint',
                  ...(workerEntryPoint != null
                    ? {
                        worker: 'worker'
                      }
                    : {})
                },
                external,
                treeshake: false,
                plugins: [
                  importMetaAssets({
                    include: ['**/*.ts', '**/*.js']
                    // assets are externals and this plugin is not able to ignore external assets
                  }),
                  nodeResolve({
                    extensions: EXTENSIONS
                  }),
                  customResolutionPlugin({
                    customLoad(id) {
                      if (id === 'entrypoint') {
                        const codeLines: string[] = []
                        if ((entrypointInfo.exports ?? []).includes('default')) {
                          codeLines.push(
                            `export { default } from '${serviceOverrideEntryPoint.slice(0, -3)}'`
                          )
                        }
                        if ((entrypointInfo.exports ?? []).some((e) => e !== 'default')) {
                          codeLines.push(
                            `export * from '${serviceOverrideEntryPoint.slice(0, -3)}'`
                          )
                        }
                        if ((entrypointInfo.exports ?? []).length === 0) {
                          codeLines.push(`import '${serviceOverrideEntryPoint.slice(0, -3)}'`)
                        }
                        return codeLines.join('\n')
                      }
                      if (id === 'worker') {
                        return `import '${workerEntryPoint}'`
                      }
                      return undefined
                    }
                  }),
                  {
                    name: 'bundle-generator',
                    generateBundle() {
                      const externalDependencies = Array.from(this.getModuleIds()).filter(
                        (id) => this.getModuleInfo(id)!.isExternal
                      )

                      const uniqueExternalDependencies = new Set(
                        externalDependencies.flatMap((dep) => {
                          const match = /((?:@[^/]+?\/)?[^/]*)(?:\/.*)?/.exec(dep)
                          if (match == null) {
                            return []
                          }
                          return [match[1]!]
                        })
                      )
                      packageJson.dependencies = {
                        vscode: `npm:${pkg.name}@^${pkg.version}`,
                        ...Object.fromEntries(
                          Object.entries(pkg.dependencies).filter(([key]) =>
                            uniqueExternalDependencies.has(key)
                          )
                        ),
                        ...Object.fromEntries(
                          Array.from(uniqueExternalDependencies)
                            .filter((dep) => dep.startsWith('@codingame/monaco-vscode-'))
                            .map((dep) => {
                              return [dep, pkg.version]
                            })
                        )
                      }
                      this.emitFile({
                        fileName: 'package.json',
                        needsCodeReference: false,
                        source: JSON.stringify(packageJson, null, 2),
                        type: 'asset'
                      })
                    }
                  }
                ]
              })
              const output = await groupBundle.write({
                preserveModules: true,
                preserveModulesRoot: nodePath.resolve(DIST_DIR, 'main/service-override'),
                minifyInternalExports: false,
                assetFileNames: 'assets/[name][extname]',
                format: 'esm',
                dir: directory,
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                hoistTransitiveImports: false
              })
              await groupBundle.close()

              // remove exclusive files from main bundle to prevent them from being duplicated
              for (const exclusiveModule of group.exclusiveModules) {
                delete bundle[nodePath.relative(DIST_DIR_MAIN, exclusiveModule)]
              }

              const assets = output.output
                .filter((file): file is rollup.OutputAsset => file.type === 'asset')
                .filter((file) => file.fileName !== 'package.json')
              for (const asset of assets) {
                delete bundle[asset.fileName]
              }
            }
          }
        }),
        {
          name: 'clean-src',
          async generateBundle() {
            // Delete intermediate sources before writing to make sure there is no unused files
            await fs.promises.rm(DIST_DIR_MAIN, {
              recursive: true
            })
          }
        },
        copy({
          hook: 'generateBundle',
          targets: [{ src: ['README.md'], dest: 'dist/main' }]
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
