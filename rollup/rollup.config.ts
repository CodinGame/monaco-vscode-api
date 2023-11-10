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
import * as fs from 'fs'
import * as fsPromise from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import metadataPlugin from './rollup-metadata-plugin'
import pkg from '../package.json' assert { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PURE_ANNO = '#__PURE__'
const PURE_FUNCTIONS = new Set([
  '__param',
  'createProxyIdentifier',
  'createDecorator',
  'localize',
  'localizeWithPath',
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

// Function calls to remove when the result is not used
const FUNCTIONS_TO_REMOVE = new Set([
  'registerProxyConfigurations',
  'registerViewWelcomeContent',
  'registerExtensionPoint',
  'registerTouchBarEntry',

  // For ActivityBar, remove unused actions/items
  'fillExtraContextMenuActions',
  'createGlobalActivityActionBar',
  'assertRegistered', // because we implement only partially the api and vscode assert the all extHosts are registered
  'updateEnabledApiProposals' // do not check for extension proposal api declaration
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
  'REMOVE_ROOT_FOLDER_COMMAND_ID',
  'debug.openView'
])

const KEEP_COLORS = new Set([
  'notifications.background',
  'notification.foreground',
  'notificationToast.border'
])

const REMOVE_WORKBENCH_CONTRIBUTIONS = new Set([
  'ResetConfigurationDefaultsOverridesCache',
  'ConfigurationMigrationWorkbenchContribution',
  'ExtensionPoints'
])

const EXTENSIONS = ['', '.ts', '.js']

const BASE_DIR = path.resolve(__dirname, '..')
const TSCONFIG = path.resolve(BASE_DIR, 'tsconfig.rollup.json')
const SRC_DIR = path.resolve(BASE_DIR, 'src')
const DIST_DIR = path.resolve(BASE_DIR, 'dist')
const DIST_DIR_MAIN = path.resolve(DIST_DIR, 'main')
const DIST_SERVICE_OVERRIDE_DIR_MAIN = path.resolve(DIST_DIR_MAIN, 'service-override')
const VSCODE_SRC_DIST_DIR = path.resolve(DIST_DIR_MAIN, 'vscode', 'src')
const VSCODE_DIR = path.resolve(BASE_DIR, 'vscode')
const VSCODE_SRC_DIR = path.resolve(VSCODE_DIR, 'src')
const NODE_MODULES_DIR = path.resolve(BASE_DIR, 'node_modules')
const MONACO_EDITOR_DIR = path.resolve(NODE_MODULES_DIR, './monaco-editor')
const MONACO_EDITOR_ESM_DIR = path.resolve(MONACO_EDITOR_DIR, './esm')
const OVERRIDE_PATH = path.resolve(BASE_DIR, 'src/override')
const KEYBOARD_LAYOUT_DIR = path.resolve(VSCODE_SRC_DIR, 'vs/workbench/services/keybinding/browser/keyboardLayouts')

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
    if (file.includes('fileActions.contribution') || file.includes('workspaceCommands') || file.includes('mainThreadCLICommands')) {
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
        firstParamName.includes('TerminalExtensions') ||
        firstParamName.includes('ConfigurationMigration')
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

    if (file.includes('windowActions') || file.includes('workspaceActions')) {
      return true
    }

    const firstParamCode = recast.print(firstParam).code
    if (firstParamCode.includes('DEBUG_CONFIGURE_COMMAND_ID') ||
      firstParamCode.includes('OpenEditorsView')) {
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

  if (functionName === 'registerSingleton') {
    if (file.includes('vs/workbench/api/')) {
      return false
    }
    return true
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
  if (importee.startsWith(VSCODE_SRC_DIR)) {
    vscodeImportPath = path.relative(VSCODE_SRC_DIR, importee)
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
    return resolve(vscodeImportPath, [VSCODE_SRC_DIR])
  }
  return undefined
}

const input = {
  api: './src/api.ts',
  extensions: './src/extensions.ts',
  services: './src/services.ts',
  l10n: './src/l10n.ts',
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
    fs.readdirSync(path.resolve(SRC_DIR, 'workers'), { withFileTypes: true })
      .filter(f => f.isFile())
      .map(f => f.name)
      .map(name => [
        `workers/${path.basename(name, '.ts')}`,
        `./src/workers/${name}`
      ])
  )
}

const workerGroups: Record<string, string> = {
  languageDetection: 'service-override:language-detection-worker',
  outputLinkComputer: 'service-override:output',
  textmate: 'service-override:textmate'
}

const externals = Object.keys({ ...pkg.dependencies })
const external: rollup.ExternalOption = (source) => {
  if (source === 'semver' || source.startsWith('semver')) return true
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
          path.includes('vs/workbench/contrib/codeEditor/browser/') ||
          path.includes('extHost.common.services') ||
          path.includes('extHost.worker.services') ||
          path.includes('inlayHintsAccessibilty')
      }
    },
    external,
    output: [{
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
    }],
    input,
    plugins: [
      importMetaAssets({
        include: ['**/*.ts', '**/*.js'],
        // assets are externals and this plugin is not able to ignore external assets
        exclude: ['**/service-override/textmate.ts', '**/service-override/languageDetectionWorker.ts']
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
          if (!id.startsWith(VSCODE_SRC_DIR)) {
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
      {
        name: 'resolve-asset-url',
        resolveFileUrl (options) {
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
      (() => {
        const realPaths = new Map<string, string>()
        return <rollup.Plugin>{
          name: 'vscode-asset-glob-meta-url',
          async resolveId (importee) {
            if (!importee.includes('*')) {
              return null
            }

            const fakePath = path.resolve(VSCODE_SRC_DIR, importee.replace(/\*/, 'all'))
            realPaths.set(fakePath, importee)
            return fakePath
          },
          async load (id) {
            const realPath = realPaths.get(id)
            if (realPath == null) {
              return undefined
            }
            const files = await glob(realPath, { cwd: VSCODE_SRC_DIR })

            const fileRefs = await Promise.all(files.map(async file => {
              const filePath = path.resolve(VSCODE_SRC_DIR, file)
              const ref = this.emitFile({
                type: 'asset',
                name: path.basename(file),
                source: await fsPromise.readFile(filePath)
              })
              return { file, ref }
            }))
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
    input: Object.fromEntries(Object.keys(input).map(f => [f, `./dist/main/${f}`])),
    output: [{
      preserveModules: true,
      preserveModulesRoot: 'dist/main',
      minifyInternalExports: false,
      assetFileNames: 'assets/[name][extname]',
      format: 'esm',
      dir: 'dist/main',
      entryFileNames: '[name].js',
      chunkFileNames: '[name].js',
      hoistTransitiveImports: false
    }],
    plugins: [importMetaAssets({
      include: ['**/*.ts', '**/*.js'],
      // assets are externals and this plugin is not able to ignore external assets
      exclude: ['**/service-override/textmate.js', '**/service-override/languageDetectionWorker.js']
    }), {
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
    },
    {
      name: 'externalize-service-overrides',
      resolveId (source, importer) {
        const importerDir = path.dirname(path.resolve(DIST_DIR_MAIN, importer ?? '/'))
        const resolved = path.resolve(importerDir, source)
        if (path.dirname(resolved) === DIST_SERVICE_OVERRIDE_DIR_MAIN && importer != null) {
          const serviceOverride = path.basename(resolved, '.js')
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
      renderChunk (code) {
        return cleanup(code, null, {
          comments: 'none',
          sourcemap: false
        }).code
      }
    },
    copy({
      targets: [
        { src: ['README.md'], dest: 'dist/main' }
      ]
    }),
    metadataPlugin({
      // generate package.json and service-override packages
      getGroup (id: string, options) {
        const serviceOverrideDir = path.resolve(options.dir!, 'service-override')
        const workersDir = path.resolve(options.dir!, 'workers')

        if (id.startsWith(serviceOverrideDir)) {
          return `service-override:${paramCase(path.basename(id, '.js'))}`
        }
        if (id.startsWith(workersDir)) {
          return workerGroups[path.basename(id, '.worker.js')] ?? 'main'
        }
        return 'main'
      },
      async handle (groupName, dependencies, exclusiveModules, entrypoints, options, bundle) {
        if (groupName === 'main') {
          // Generate package.json
          const packageJson: PackageJson = {
            ...Object.fromEntries(Object.entries(pkg).filter(([key]) => ['name', 'description', 'version', 'keywords', 'author', 'license', 'repository', 'type'].includes(key))),
            private: false,
            main: 'api.js',
            module: 'api.js',
            types: 'vscode.proposed.d.ts',
            exports: {
              '.': {
                default: './api.js'
              },
              './services': {
                types: './services.d.ts',
                default: './services.js'
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
              }
            },
            typesVersions: {
              '*': {
                services: [
                  './services.d.ts'
                ],
                extensions: [
                  './extensions.d.ts'
                ],
                'service-override/*': [
                  './service-override/*.d.ts'
                ],
                monaco: [
                  './monaco.d.ts'
                ],
                assets: [
                  './assets.d.ts'
                ],
                lifecycle: [
                  './lifecycle.d.ts'
                ],
                l10n: [
                  './l10n.d.ts'
                ],
                'vscode/*': [
                  './vscode/src/*.d.ts'
                ]
              }
            },
            bin: {
              'monaco-treemending': './monaco-treemending.js'
            },
            dependencies: {
              ...Object.fromEntries(Object.entries(pkg.dependencies).filter(([key]) => dependencies.has(key))),
              ...Object.fromEntries(Array.from(dependencies).filter(dep => dep.startsWith('@codingame/monaco-vscode-')).map(dep => [dep, pkg.version]))
            }
          }
          this.emitFile({
            fileName: 'package.json',
            needsCodeReference: false,
            source: JSON.stringify(packageJson, null, 2),
            type: 'asset'
          })
        } else {
          const [_, category, name] = /^(.*):(.*)$/.exec(groupName)!

          const directory = path.resolve(DIST_DIR, `${category}-${name}`)

          await fsPromise.mkdir(directory, {
            recursive: true
          })
          const serviceOverrideEntryPoint = Array.from(entrypoints).find(e => e.includes('/service-override/'))!
          const workerEntryPoint = Array.from(entrypoints).find(e => e.includes('/workers/'))

          const packageJson: PackageJson = {
            name: `@codingame/monaco-vscode-${name}-${category}`,
            ...Object.fromEntries(Object.entries(pkg).filter(([key]) => ['version', 'keywords', 'author', 'license', 'repository', 'type'].includes(key))),
            private: false,
            description: `${pkg.description} - ${name} ${category}`,
            main: 'index.js',
            module: 'index.js',
            types: 'index.d.ts',
            dependencies: {
              vscode: `npm:${pkg.name}@^${pkg.version}`,
              ...Object.fromEntries(Object.entries(pkg.dependencies).filter(([key]) => dependencies.has(key))),
              ...Object.fromEntries(Array.from(dependencies).filter(dep => dep.startsWith('@codingame/monaco-vscode-')).map(dep => [dep, pkg.version]))
            }
          }
          if (workerEntryPoint != null) {
            packageJson.exports = {
              '.': {
                default: './index.js'
              },
              './worker': {
                default: './worker.js'
              }
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
            plugins: [
              importMetaAssets({
                include: ['**/*.ts', '**/*.js'],
                // assets are externals and this plugin is not able to ignore external assets
                exclude: ['**/service-override/textmate.js', '**/service-override/languageDetectionWorker.js']
              }),
              nodeResolve({
                extensions: EXTENSIONS
              }), {
                name: 'loader',
                resolveId (source, importer) {
                  if (source === 'entrypoint' || source === 'worker') {
                    return source
                  }
                  if (source.startsWith('@codingame/monaco-vscode-')) {
                    return {
                      external: true,
                      id: source
                    }
                  }
                  if (source.startsWith('monaco-editor/')) {
                    return null
                  }
                  const importerDir = path.dirname(path.resolve(DIST_DIR_MAIN, importer ?? '/'))
                  const resolved = path.resolve(importerDir, source)
                  const resolvedWithExtension = resolved.endsWith('.js') ? resolved : `${resolved}.js`

                  const isVscodeFile = resolved.startsWith(VSCODE_SRC_DIST_DIR)
                  const isServiceOverride = path.dirname(resolved) === DIST_SERVICE_OVERRIDE_DIR_MAIN
                  const isNotExclusive = (isVscodeFile || isServiceOverride) && !exclusiveModules.has(resolvedWithExtension)
                  const shouldBeShared = ['assets.js', 'lifecycle.js', 'workbench.js', 'missing-services.js'].includes(path.relative(DIST_DIR_MAIN, resolvedWithExtension))

                  if (isNotExclusive || shouldBeShared) {
                    // Those modules will be imported from external monaco-vscode-api
                    let externalResolved = resolved.startsWith(VSCODE_SRC_DIST_DIR) ? `vscode/vscode/${path.relative(VSCODE_SRC_DIST_DIR, resolved)}` : `vscode/${path.relative(DIST_DIR_MAIN, resolved)}`
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
                load (id) {
                  if (id === 'entrypoint') {
                    const codeLines: string[] = []
                    if ((entrypointInfo.exports ?? []).includes('default')) {
                      codeLines.push(`export { default } from '${serviceOverrideEntryPoint.slice(0, -3)}'`)
                    }
                    if ((entrypointInfo.exports ?? []).some(e => e !== 'default')) {
                      codeLines.push(`export * from '${serviceOverrideEntryPoint.slice(0, -3)}'`)
                    }
                    if ((entrypointInfo.exports ?? []).length === 0) {
                      codeLines.push(`import '${serviceOverrideEntryPoint.slice(0, -3)}'`)
                    }
                    return codeLines.join('\n')
                  }
                  if (id === 'worker') {
                    return `import '${workerEntryPoint}'`
                  }
                  if (id.startsWith('vscode/')) {
                    return (bundle[path.relative('vscode', id)] as rollup.OutputChunk | undefined)?.code
                  }
                  return (bundle[path.relative(DIST_DIR_MAIN, id)] as rollup.OutputChunk | undefined)?.code
                },
                resolveFileUrl (options) {
                  let relativePath = options.relativePath
                  if (!relativePath.startsWith('.')) {
                    relativePath = `./${options.relativePath}`
                  }
                  return `'${relativePath}'`
                },
                generateBundle () {
                  this.emitFile({
                    fileName: 'package.json',
                    needsCodeReference: false,
                    source: JSON.stringify(packageJson, null, 2),
                    type: 'asset'
                  })
                }
              }]
          })
          await groupBundle.write({
            preserveModules: true,
            preserveModulesRoot: path.resolve(DIST_DIR, 'main/service-override'),
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
          for (const exclusiveModule of exclusiveModules) {
            delete bundle[path.relative(DIST_DIR_MAIN, exclusiveModule)]
          }
        }
      }
    }), {
      name: 'clean-src',
      async generateBundle () {
        // Delete intermediate sources before writing to make sur there is no unused files
        await fsPromise.rm(DIST_DIR_MAIN, {
          recursive: true
        })
      }
    }
    ]
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
