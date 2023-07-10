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
import externalAssets from 'rollup-plugin-external-assets'
import globImport from 'rollup-plugin-glob-import'
import terser from '@rollup/plugin-terser'
import styles from 'rollup-plugin-styles'
import inject from '@rollup/plugin-inject'
import * as fs from 'fs'
import * as fsPromise from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import extensionDirectoryPlugin from '../dist/rollup-extension-directory-plugin.js'
import pkg from '../package.json' assert { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PURE_ANNO = '#__PURE__'
const PURE_FUNCTIONS = new Set([
  '__param',
  'createProxyIdentifier',
  'createDecorator',
  'localize',
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

// Function calls to remove when the result is not used
const FUNCTIONS_TO_REMOVE = new Set([
  'registerSingleton', // Remove calls to registerSingleton from vscode code, we just want to import things, not registering services
  'registerProxyConfigurations',
  'registerViewWelcomeContent',
  'registerExtensionPoint',
  'registerTouchBarEntry',
  'registerEditorSerializer',

  // For ActivityBar, remove unused actions/items
  'fillExtraContextMenuActions',
  'createGlobalActivityActionBar'
])

const PURE_OR_TO_REMOVE_FUNCTIONS = new Set([
  ...PURE_FUNCTIONS,
  ...FUNCTIONS_TO_REMOVE
])

const REMOVE_COMMANDS = new Set([
  'DEBUG_START_COMMAND_ID',
  'DEBUG_RUN_COMMAND_ID',
  'SELECT_DEBUG_CONSOLE_ID',
  'SELECT_AND_START_ID',
  'debug.startFromConfig',
  'debug.installAdditionalDebuggers',
  'REMOVE_ROOT_FOLDER_COMMAND_ID'
])

const KEEP_COLORS = new Set([
  'notifications.background',
  'notification.foreground',
  'notificationToast.border'
])

const REMOVE_WORKBENCH_CONTRIBUTIONS = new Set([
  'DebugTitleContribution',
  'ResetConfigurationDefaultsOverridesCache',
  'ConfigurationMigrationWorkbenchContribution',
  'RegisterSearchViewContribution',
  'RemoteTerminalBackendContribution',
  'DebugStatusContribution'
])

const EXTENSIONS = ['', '.ts', '.js']

const BASE_DIR = path.resolve(__dirname, '..')
const TSCONFIG = path.resolve(BASE_DIR, 'tsconfig.rollup.json')
const SRC_DIR = path.resolve(BASE_DIR, 'src')
const DIST_DIR = path.resolve(BASE_DIR, 'dist')
const VSCODE_DIR = path.resolve(BASE_DIR, 'vscode')
const NODE_MODULES_DIR = path.resolve(BASE_DIR, 'node_modules')
const MONACO_EDITOR_DIR = path.resolve(NODE_MODULES_DIR, './monaco-editor')
const MONACO_EDITOR_ESM_DIR = path.resolve(MONACO_EDITOR_DIR, './esm')
const OVERRIDE_PATH = path.resolve(BASE_DIR, 'src/override')
const DEFAULT_EXTENSIONS_PATH = path.resolve(BASE_DIR, 'vscode-default-extensions')
const KEYBOARD_LAYOUT_DIR = path.resolve(VSCODE_DIR, 'vs/workbench/services/keybinding/browser/keyboardLayouts')

function getMemberExpressionPath (node: recast.types.namedTypes.MemberExpression | recast.types.namedTypes.Identifier): string | null {
  if (node.type === 'MemberExpression') {
    if (node.property.type === 'Identifier' && (node.object.type === 'Identifier' || node.object.type === 'MemberExpression')) {
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

function isCallPure (file: string, functionName: string, node: recast.types.namedTypes.CallExpression): boolean {
  const args = node.arguments
  if (functionName === '__decorate') {
    const code = recast.print(node).code
    if (code.includes('extHostNamedCustomer') || code.includes('extHostCustomer')) {
      return false
    }
    return true
  }

  if (functionName === 'createInstance') {
    const firstParam = args[0]!
    if (firstParam.type === 'Identifier' && firstParam.name === 'ExtHostConsoleForwarder') {
      return true
    }
  }

  if (functionName === 'KeybindingsRegistry.registerCommandAndKeybindingRule') {
    const firstParam = args[0]!
    if (firstParam.type === 'ObjectExpression') {
      for (const prop of firstParam.properties) {
        if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier' && prop.key.name === 'id') {
          const id = prop.value.type === 'StringLiteral' ? prop.value.value : (prop.value.type === 'Identifier' ? prop.value.name : null)
          return id != null && REMOVE_COMMANDS.has(id)
        }
      }
    }
  }

  if (functionName === 'CommandsRegistry.registerCommand') {
    if (file.includes('fileActions.contribution') || file.includes('workspaceCommands')) {
      return true
    }
  }

  // Remove Registry.add calls
  if (functionName.endsWith('Registry.add')) {
    const firstParam = args[0]!
    const firstParamName = firstParam.type === 'MemberExpression' ? getMemberExpressionPath(firstParam) : undefined
    if (firstParamName != null) {
      const allowed = firstParamName.includes('ExtensionsRegistry') ||
        firstParamName.includes('EditorFactory') ||
        firstParamName.includes('Workbench') ||
        firstParamName.includes('OutputChannels') ||
        firstParamName.includes('ViewsRegistry') ||
        firstParamName.includes('ViewContainersRegistry') ||
        firstParamName.includes('Viewlets') ||
        firstParamName.includes('Panels') ||
        firstParamName.includes('Auxiliary') ||
        firstParamName.includes('EditorPane') ||
        firstParamName.includes('TerminalExtensions')
      return !allowed
    }
  }

  if (functionName.endsWith('registerAction2')) {
    const firstParam = args[0]!

    const className = firstParam.type === 'Identifier' ? firstParam.name : firstParam.type === 'ClassExpression' ? firstParam.id?.name as string : undefined
    if (className != null) {
      if (['AddConfigurationAction', 'AskInInteractiveAction'].includes(className)) {
        return true
      }
      if (['ToggleTabsVisibilityAction'].includes(className)) {
        return false
      }
    }

    if (file.includes('layoutActions') || file.includes('fileActions.contribution') || file.includes('windowActions') || file.includes('workspaceActions')) {
      return true
    }

    const firstParamCode = recast.print(firstParam).code
    if (firstParamCode.includes('DEBUG_CONFIGURE_COMMAND_ID') ||
      firstParamCode.includes('workbench.action.closePanel') ||
      firstParamCode.includes('workbench.action.toggleMaximizedPanel') ||
      firstParamCode.includes('OpenEditorsView') ||
      firstParamCode.includes('openWorkspaceSettings') ||
      firstParamCode.includes('openRemoteSettings') ||
      firstParamCode.includes('openApplicationSettings')) {
      return true
    }
  }

  if (functionName === 'MenuRegistry.appendMenuItems') {
    if (file.includes('layoutActions')) {
      return true
    }
  }
  if (functionName === 'MenuRegistry.appendMenuItem') {
    const firstParamCode = recast.print(args[0]!).code
    if (
      firstParamCode.startsWith('MenuId.MenubarDebugMenu') ||
      firstParamCode.startsWith('MenuId.MenubarFileMenu') ||
      firstParamCode.startsWith('MenuId.TouchBarContext')
    ) {
      return true
    }
  }

  if (functionName.endsWith('registerColor')) {
    const firstParam = args[0]!
    if (firstParam.type === 'StringLiteral') {
      if (KEEP_COLORS.has(firstParam.value)) {
        return false
      }
    }
  }

  if (functionName === 'registerWorkbenchContribution') {
    const firstParam = args[0]!
    if (firstParam.type === 'Identifier') {
      if (REMOVE_WORKBENCH_CONTRIBUTIONS.has(firstParam.name)) {
        return true
      }
      return false
    }
    return true
  }

  if (functionName === 'MenuRegistry.appendMenuItem') {
    if (file.includes('debugViewlet')) {
      // Remove DEBUG_START_COMMAND_ID and SELECT_AND_START_ID
      return true
    }
    if (file.includes('layoutActions')) {
      return true
    }
    return false
  }

  if (functionName === 'registerDebugCommandPaletteItem') {
    const firstParamCode = recast.print(args[0]!).code
    if (['RESTART_SESSION_ID', 'DISCONNECT_ID', 'DISCONNECT_AND_SUSPEND_ID', 'DEBUG_START_COMMAND_ID', 'DEBUG_RUN_COMMAND_ID'].includes(firstParamCode)) {
      return true
    }
    return false
  }

  if (functionName === 'registerViews') {
    const firstParamCode = recast.print(args[0]!).code
    if (firstParamCode.includes('WelcomeView.ID')) {
      return true
    }
    return false
  }

  if (functionName === 'viewDescriptorsToRegister.push') {
    const firstParamName = args[0]!.type === 'Identifier' ? getMemberExpressionPath(args[0]) : null
    if (firstParamName === 'openEditorsViewDescriptor') {
      return true
    }
  }

  return PURE_OR_TO_REMOVE_FUNCTIONS.has(functionName)
}

interface TreeShakeOptions {
  include: string[]
  exclude: string[]
}

function transformVSCodeCode (id: string, code: string, options: TreeShakeOptions) {
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

  let patchedCode = code.replace(/(^__decorate\(\[\n.*\n\], (.*).prototype)/gm, '$2.__decorator = $1')

  const ast = recast.parse(patchedCode, {
    parser: babylonParser
  })
  let transformed: boolean = false
  function addComment (node: recast.types.namedTypes.NewExpression | recast.types.namedTypes.CallExpression) {
    if (!(node.comments ?? []).some(comment => comment.value === PURE_ANNO)) {
      transformed = true
      node.comments ??= []
      node.comments.unshift(recast.types.builders.commentBlock(PURE_ANNO, true))
      return recast.types.builders.parenthesizedExpression(node)
    }
    return node
  }
  recast.visit(ast.program.body, {
    visitExportNamedDeclaration (path) {
      if (path.node.specifiers != null && path.node.specifiers.some(specifier => specifier.exported.name === 'LayoutPriority')) {
        // For some reasons, this re-export is not used but rollup is not able to treeshake it
        // It's an issue because it's a const enum imported from monaco (so it doesn't exist in the js code)
        path.node.specifiers = path.node.specifiers.filter(specifier => specifier.exported.name !== 'LayoutPriority')
        transformed = true
      }
      this.traverse(path)
    },
    visitNewExpression (path) {
      const node = path.node
      if (node.callee.type === 'Identifier') {
        path.replace(addComment(node))
      }
      this.traverse(path)
    },
    visitCallExpression (path) {
      const node = path.node
      const name = node.callee.type === 'MemberExpression' || node.callee.type === 'Identifier' ? getMemberExpressionPath(node.callee) : null

      if (node.callee.type === 'MemberExpression') {
        if (node.callee.property.type === 'Identifier') {
          const names: string[] = [node.callee.property.name]
          if (name != null) {
            names.unshift(name)
          }
          if (options.include.length > 0 ? !names.some(name => options.include.includes(name)) : (names.some(name => isCallPure(id, name, node) || options.exclude.includes(name)))) {
            path.replace(addComment(node))
          }
        }
      } else if (node.callee.type === 'Identifier' && (options.include.length > 0 ? !options.include.includes(node.callee.name) : (isCallPure(id, node.callee.name, node) || options.exclude.includes(node.callee.name)))) {
        path.replace(addComment(node))
      } else if (node.callee.type === 'FunctionExpression') {
        const lastInstruction = node.callee.body.body[node.callee.body.body.length - 1]
        const lastInstructionIsReturn = lastInstruction?.type === 'ReturnStatement' && lastInstruction.argument != null
        if (node.arguments.length > 0 || lastInstructionIsReturn) {
          // heuristic: mark IIFE with parameters or with a return as pure, because typescript compile enums as IIFE
          path.replace(addComment(node))
        }
      }
      this.traverse(path)
      return undefined
    },
    visitThrowStatement () {
      return false
    },
    visitClassDeclaration (path) {
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
        function isExpressionStatement (node: recast.types.namedTypes.Node): node is recast.types.namedTypes.ExpressionStatement {
          return node.type === 'ExpressionStatement'
        }
        function isLiteral (node: recast.types.namedTypes.Node): node is recast.types.namedTypes.NumericLiteral | recast.types.namedTypes.Literal | recast.types.namedTypes.BooleanLiteral | recast.types.namedTypes.DecimalLiteral {
          return ['NumericLiteral', 'Literal', 'StringLiteral', 'BooleanLiteral', 'DecimalLiteral'].includes(node.type)
        }
        if (isExpressionStatement(node) &&
          node.expression.type === 'AssignmentExpression' &&
          node.expression.left.type === 'MemberExpression' &&
          node.expression.left.object.type === 'Identifier' &&
          node.expression.left.object.name === path.node.id.name &&
          node.expression.left.property.type === 'Identifier' &&
          isLiteral(node.expression.right)
        ) {
          const fieldName = node.expression.left.property.name
          path.node.body.body.push(recast.types.builders.classProperty(recast.types.builders.identifier(fieldName), node.expression.right, null, true))
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
  return patchedCode
}

function resolveVscode (importee: string, importer?: string) {
  if (importee === '@vscode/iconv-lite-umd') {
    return path.resolve(OVERRIDE_PATH, 'iconv.ts')
  }
  if (importee === 'jschardet') {
    return path.resolve(OVERRIDE_PATH, 'jschardet.ts')
  }
  if (importer != null && importee.startsWith('.')) {
    importee = path.resolve(path.dirname(importer), importee)
  }

  // import weak so that AbstractTextEditor is not imported just to do an instanceof on it
  if (importer != null && importer.includes('vs/workbench/api/browser/mainThreadDocumentsAndEditors') && importee.includes('browser/parts/editor/textEditor')) {
    importee = importee.replace('textEditor', 'textEditor.weak')
  }

  if (importee.startsWith('vscode/')) {
    return resolve(path.relative('vscode', importee), [VSCODE_DIR])
  }
  let vscodeImportPath = importee
  if (importee.startsWith(VSCODE_DIR)) {
    vscodeImportPath = path.relative(VSCODE_DIR, importee)
  }
  const overridePath = resolve(vscodeImportPath, [OVERRIDE_PATH])
  if (overridePath != null) {
    return overridePath
  }

  if (vscodeImportPath.startsWith('vs/')) {
    if (resolve(vscodeImportPath, [MONACO_EDITOR_ESM_DIR]) != null) {
      // File exists on monaco, import from monaco esm
      return path.relative(NODE_MODULES_DIR, path.resolve(MONACO_EDITOR_ESM_DIR, vscodeImportPath)) + '.js'
    }
    return resolve(vscodeImportPath, [VSCODE_DIR])
  }
  return undefined
}

const input = {
  api: './src/api.ts',
  extensions: './src/extensions.ts',
  services: './src/services.ts',
  monaco: './src/monaco.ts',
  ...Object.fromEntries(
    fs.readdirSync(path.resolve(SRC_DIR, 'service-override'), { withFileTypes: true })
      .filter(f => f.isFile())
      .map(f => f.name)
      .map(name => [
        `service-override/${path.basename(name, '.ts')}`,
        `./src/service-override/${name}`
      ])
  ),
  ...Object.fromEntries(
    fs.readdirSync(path.resolve(SRC_DIR, 'ext-hosts'), { withFileTypes: true })
      .filter(f => f.isFile())
      .map(f => f.name)
      .map(name => [
        `ext-hosts/${path.basename(name, '.ts')}`,
        `./src/ext-hosts/${name}`
      ])
  ),
  'workers/textMate.worker': './src/workers/textMate.worker.ts',
  'workers/outputLinkComputer.worker': './src/workers/outputLinkComputer.worker.ts'
}

const externals = Object.keys({ ...pkg.peerDependencies })
const external: rollup.ExternalOption = (source) => {
  // mark semver as external so it's ignored (the code that imports it will be treeshaked out)
  if (source.includes('semver')) return true
  if (source.includes('tas-client-umd')) return true
  if (source.startsWith(MONACO_EDITOR_DIR) || source.startsWith('monaco-editor/')) {
    return true
  }
  return externals.some(external => source === external || source.startsWith(`${external}/`))
}

export default (args: Record<string, string>): rollup.RollupOptions[] => {
  const vscodeVersion = args['vscode-version']
  delete args['vscode-version']
  const vscodeRef = args['vscode-ref']
  delete args['vscode-ref']
  if (vscodeVersion == null) {
    throw new Error('Vscode version is mandatory')
  }
  return rollup.defineConfig([{
    cache: false,
    treeshake: {
      annotations: true,
      preset: 'smallest',
      moduleSideEffects (id) {
        const path = new URL(id, 'file:/').pathname
        if (path.endsWith('vs/workbench/browser/media/style.css')) {
          // Remove global vscode css rules
          return false
        }
        return path.startsWith(SRC_DIR) ||
          path.endsWith('.css') ||
          path.startsWith(KEYBOARD_LAYOUT_DIR) ||
          path.endsWith('.contribution.js') ||
          path.endsWith('xtensionPoint.js') ||
          path.includes('vs/workbench/api/browser/') ||
          path.endsWith('/fileCommands.js') ||
          path.endsWith('/explorerViewlet.js') ||
          path.endsWith('/listCommands.js') ||
          path.endsWith('/quickAccessActions.js') ||
          path.endsWith('/gotoLineQuickAccess.js') ||
          path.endsWith('/workbenchReferenceSearch.js') ||
          path.includes('/searchActions') ||
          path.endsWith('documentSymbolsOutline.js') ||
          path.includes('vs/workbench/contrib/codeEditor/browser/')
      }
    },
    external,
    output: [{
      preserveModules: true,
      preserveModulesRoot: 'src',
      minifyInternalExports: false,
      assetFileNames: 'assets/[name][extname]',
      format: 'esm',
      dir: 'dist',
      entryFileNames: '[name].js',
      chunkFileNames: '[name].js',
      hoistTransitiveImports: false,
      paths: {
        'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api.js'
      }
    }],
    input,
    plugins: [
      inject({
        fetch: path.resolve('src/custom-fetch.ts'),
        include: [/extHostExtensionService/]
      }),
      commonjs(),
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
        async load (id) {
          if (!id.startsWith(VSCODE_DIR)) {
            return undefined
          }
          const [, path, query] = /^(.*?)(\?.*?)?$/.exec(id)!
          if (!path!.endsWith('.js')) {
            return undefined
          }

          const searchParams = new URLSearchParams(query)
          const options: TreeShakeOptions = {
            include: searchParams.getAll('include'),
            exclude: searchParams.getAll('exclude')
          }
          const content = (await fsPromise.readFile(path!)).toString('utf-8')
          return transformVSCodeCode(path!, content, options)
        },
        transform (code) {
          return code.replaceAll("'./keyboardLayouts/layout.contribution.' + platform", "'./keyboardLayouts/layout.contribution.' + platform + '.js'")
        }
      },
      nodeResolve({
        extensions: EXTENSIONS
      }),
      typescript({
        noEmitOnError: true,
        tsconfig: TSCONFIG,
        transformers: {
          before: [{
            type: 'program',
            factory: function factory (program) {
              return function transformerFactory (context) {
                return function transformer (sourceFile) {
                  if (sourceFile.fileName.endsWith('api.ts')) {
                    let exportEqualsFound = false
                    function visitor (node: ts.Node): ts.Node {
                      // Transform `export = api` to `export { field1, field2, ... } = api` as the first syntax is not supported when generating ESM
                      if (ts.isExportAssignment(node) && (node.isExportEquals ?? false)) {
                        if (ts.isIdentifier(node.expression)) {
                          const declaration = program.getTypeChecker().getSymbolAtLocation(node.expression)!.declarations![0]!
                          if (ts.isVariableDeclaration(declaration) && declaration.initializer != null && ts.isObjectLiteralExpression(declaration.initializer)) {
                            const propertyNames = declaration.initializer.properties.map(prop => (prop.name as ts.Identifier).text)
                            exportEqualsFound = true
                            return context.factory.createVariableStatement([
                              context.factory.createModifier(ts.SyntaxKind.ExportKeyword)
                            ], context.factory.createVariableDeclarationList([
                              context.factory.createVariableDeclaration(
                                context.factory.createObjectBindingPattern(
                                  propertyNames.map(name => context.factory.createBindingElement(undefined, undefined, context.factory.createIdentifier(name)))
                                ),
                                undefined,
                                undefined,
                                node.expression
                              )
                            ], ts.NodeFlags.Const))
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
          }]
        }
      }), replace({
        VSCODE_VERSION: JSON.stringify(vscodeVersion),
        VSCODE_REF: JSON.stringify(vscodeRef),
        preventAssignment: true
      }),
      globImport({
        format: 'default',
        rename (name, id) {
          return path.relative(VSCODE_DIR, id).replace(/[/.]/g, '_')
        }
      }),
      externalAssets(['**/*.mp3', '**/*.wasm']),
      styles({
        mode: 'inject',
        minimize: true
      }),
      {
        name: 'dynamic-import-polyfill',
        renderDynamicImport (): { left: string, right: string } {
          // dynamic imports of vscode-oniguruma and vscode-textmate aren't working without it on vite
          return {
            left: 'import(',
            right: ').then(module => module.default ?? module)'
          }
        }
      },
      dynamicImportVars()
    ]
  }, {
    // 2nd pass to improve treeshaking
    cache: false,
    treeshake: {
      annotations: true,
      preset: 'smallest',
      propertyReadSideEffects: false,
      moduleSideEffects (id) {
        return id.startsWith(DIST_DIR) || id.endsWith('.css')
      }
    },
    external,
    input: Object.fromEntries(Object.keys(input).map(f => [f, `./dist/${f}`])),
    output: [{
      preserveModules: true,
      preserveModulesRoot: 'dist',
      minifyInternalExports: false,
      assetFileNames: 'assets/[name][extname]',
      format: 'esm',
      dir: 'dist',
      entryFileNames: '[name].js',
      chunkFileNames: '[name].js',
      hoistTransitiveImports: false
    }],
    plugins: [{
      name: 'improve-treeshaking',
      transform (code) {
        const ast = recast.parse(code, {
          parser: babylonParser
        })
        let transformed: boolean = false
        function addComment (node: recast.types.namedTypes.NewExpression | recast.types.namedTypes.CallExpression) {
          if (!(node.comments ?? []).some(comment => comment.value === PURE_ANNO)) {
            transformed = true
            node.comments ??= []
            node.comments.unshift(recast.types.builders.commentBlock(PURE_ANNO, true))
            return recast.types.builders.parenthesizedExpression(node)
          }
          return node
        }
        recast.visit(ast.program.body, {
          visitCallExpression (path) {
            const node = path.node
            if (node.callee.type === 'MemberExpression') {
              if (node.callee.property.type === 'Identifier') {
                const name = getMemberExpressionPath(node.callee)
                if ((name != null && PURE_FUNCTIONS.has(name)) || PURE_FUNCTIONS.has(node.callee.property.name)) {
                  path.replace(addComment(node))
                }
              }
            } else if (node.callee.type === 'Identifier' && PURE_FUNCTIONS.has(node.callee.name)) {
              path.replace(addComment(node))
            } else if (node.callee.type === 'FunctionExpression') {
              const lastInstruction = node.callee.body.body[node.callee.body.body.length - 1]
              const lastInstructionIsReturn = lastInstruction?.type === 'ReturnStatement' && lastInstruction.argument != null
              if (node.arguments.length > 0 || lastInstructionIsReturn) {
                // heuristic: mark IIFE with parameters or with a return as pure, because typescript compile enums as IIFE
                path.replace(addComment(node))
              }
            }
            this.traverse(path)
            return undefined
          },
          visitThrowStatement () {
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
    }, nodeResolve({
      extensions: EXTENSIONS
    }),
    externalAssets(['**/*.mp3', '**/*.wasm']),
    {
      name: 'cleanup',
      renderChunk (code) {
        return cleanup(code, null, {
          comments: 'none',
          sourcemap: false
        }).code
      }
    }]
  }, {
    input: {
      ...Object.fromEntries(
        fs.readdirSync(DEFAULT_EXTENSIONS_PATH, { withFileTypes: true })
          .filter(f => f.isDirectory() && fs.existsSync(path.resolve(DEFAULT_EXTENSIONS_PATH, f.name, 'package.json')))
          .map(f => f.name)
          .map(name => [
            `default-extensions/${name}`,
            path.resolve(DEFAULT_EXTENSIONS_PATH, name)
          ])
      )
    },
    external,
    output: [{
      preserveModules: true,
      preserveModulesRoot: 'src',
      minifyInternalExports: false,
      assetFileNames: 'assets/[name][extname]',
      format: 'esm',
      dir: 'dist',
      entryFileNames: '[name].js',
      chunkFileNames: '[name].js',
      hoistTransitiveImports: false
    }],
    plugins: [
      {
        name: 'resolve',
        resolveId (importee) {
          if (importee === 'vscode/extensions') {
            return {
              id: path.resolve(DIST_DIR, 'extensions.js'),
              external: true
            }
          }
          return undefined
        }
      },
      nodeResolve({
        extensions: EXTENSIONS
      }),
      {
        name: 'dynamic-import-polyfill',
        renderDynamicImport (): { left: string, right: string } {
          return {
            left: 'import(',
            right: ').then(module => module.default ?? module)'
          }
        }
      },
      extensionDirectoryPlugin({
        include: `${DEFAULT_EXTENSIONS_PATH}/**/*`,
        rollupPlugins: [
          terser()
        ],
        transformManifest (manifest) {
          if (manifest.name === 'configuration-editing') {
            return {
              ...manifest,
              contributes: {
                ...manifest.contributes,
                jsonValidation: manifest.contributes!.jsonValidation!.map(validation => {
                  return {
                    fileMatch: (validation.fileMatch as string).replaceAll('%APP_SETTINGS_HOME%', 'user:'),
                    url: validation.url
                  }
                })
              }
            }
          }
          return manifest
        },
        async getAdditionalResources (manifest, directory) {
          if (manifest.name === 'typescript-language-features') {
            const files = (await fsPromise.readdir(path.resolve(directory, 'dist/browser/typescript'), {
              withFileTypes: true
            })).filter(f => f.isFile()).map(f => f.name)
            return files.map(file => path.join('./dist/browser/typescript', file))
          }
          return []
        }
      })]
  }])
}

function resolve (_path: string, fromPaths: string[]) {
  for (const fromPath of fromPaths) {
    for (const extension of EXTENSIONS) {
      const outputPath = path.resolve(fromPath, `${_path}${extension}`)
      if (fs.existsSync(outputPath) && fs.lstatSync(outputPath).isFile()) {
        return outputPath
      }
    }
  }
  return undefined
}
