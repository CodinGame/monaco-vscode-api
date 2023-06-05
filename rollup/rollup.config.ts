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
import * as fs from 'fs'
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
  '_setExtensionHostProxy',
  '_setAllMainProxyIdentifiers',
  'registerTouchBarEntry',
  'registerEditorSerializer',

  'appendSaveConflictEditorTitleAction',
  'appendToCommandPalette',
  // For ActivityBar, remove unused actions/items
  'fillExtraContextMenuActions',
  'createGlobalActivityActionBar',

  'searchWidgetContributions',
  'replaceContributions'
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

const ALLOWED_WORKBENCH_CONTRIBUTIONS = new Set([
  'AudioCueLineFeatureContribution',
  'AudioCueLineDebuggerContribution',
  'RegisterConfigurationSchemasContribution',
  'EditorAutoSave',
  'EditorStatus',
  'DebugToolBar',
  'DebugContentProvider',
  'DialogHandlerContribution',
  'ExplorerViewletViewsContribution',
  'ViewsExtensionHandler',
  'OutputContribution'
])

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
    if (file.includes('fileActions.contribution') || file.includes('workspaceCommands') || file.includes('search.contribution')) {
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
        firstParamName.includes('EditorPane')
      return !allowed
    }
  }

  if (functionName.endsWith('registerAction2')) {
    if (file.includes('layoutActions') || file.includes('fileActions.contribution') || file.includes('windowActions') || file.includes('workspaceActions')) {
      return true
    }

    const firstParam = args[0]!

    const className = firstParam.type === 'Identifier' ? firstParam.name : firstParam.type === 'ClassExpression' ? firstParam.id?.name as string : undefined
    if (className != null && ['OpenDisassemblyViewAction', 'AddConfigurationAction', 'ToggleDisassemblyViewSourceCodeAction'].includes(className)) {
      return true
    }
    const firstParamCode = recast.print(firstParam).code
    if (firstParamCode.includes('DEBUG_CONFIGURE_COMMAND_ID') ||
      firstParamCode.includes('workbench.action.closePanel') ||
      firstParamCode.includes('workbench.action.toggleMaximizedPanel') ||
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
    if (firstParam.type === 'Identifier' && ALLOWED_WORKBENCH_CONTRIBUTIONS.has(firstParam.name)) {
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

  if (functionName === 'registerViewContainer') {
    if (file.includes('search.contribution')) {
      return true
    }
  }
  if (functionName === 'registerViews') {
    if (file.includes('search.contribution')) {
      return true
    }
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

const USE_DEFAULT_EXTENSIONS = new Set([
  'bat',
  'clojure',
  'coffeescript',
  'cpp',
  'csharp',
  'css',
  'dart',
  'diff',
  'docker',
  'fsharp',
  'go',
  'groovy',
  'handlebars',
  'hlsl',
  'html',
  'ini',
  'java',
  'javascript',
  'json',
  'julia',
  'latex',
  'less',
  'log',
  'lua',
  'make',
  'markdown-basics',
  'objective-c',
  'perl',
  'php',
  'powershell',
  'pug',
  'python',
  'r',
  'razor',
  'references-view',
  'ruby',
  'rust',
  'scss',
  'shaderlab',
  'shellscript',
  'sql',
  'swift',
  'theme-abyss',
  'theme-defaults',
  'theme-kimbie-dark',
  'theme-monokai-dimmed',
  'theme-monokai',
  'theme-quietlight',
  'theme-red',
  'theme-seti',
  'theme-solarized-dark',
  'theme-solarized-light',
  'theme-tomorrow-night-blue',
  'vs-seti',
  'typescript-basics',
  'vb',
  'xml',
  'yaml'
])

const input = {
  api: './src/api.ts',
  extensions: './src/extensions.ts',
  services: './src/services.ts',
  'service-override/notifications': './src/service-override/notifications.ts',
  'service-override/dialogs': './src/service-override/dialogs.ts',
  'service-override/model': './src/service-override/model.ts',
  'service-override/editor': './src/service-override/editor.ts',
  'service-override/files': './src/service-override/files.ts',
  'service-override/configuration': './src/service-override/configuration.ts',
  'service-override/keybindings': './src/service-override/keybindings.ts',
  'service-override/textmate': './src/service-override/textmate.ts',
  'service-override/theme': './src/service-override/theme.ts',
  'service-override/snippets': './src/service-override/snippets.ts',
  'service-override/languages': './src/service-override/languages.ts',
  'service-override/audioCue': './src/service-override/audioCue.ts',
  'service-override/debug': './src/service-override/debug.ts',
  'service-override/preferences': './src/service-override/preferences.ts',
  'service-override/views': './src/service-override/views.ts',
  'service-override/quickaccess': './src/service-override/quickaccess.ts',
  'service-override/output': './src/service-override/output.ts',
  'workers/textMate.worker': './src/workers/textMate.worker.ts',
  'workers/outputLinkComputer.worker': './src/workers/outputLinkComputer.worker.ts',
  monaco: './src/monaco.ts',
  ...Object.fromEntries(
    fs.readdirSync(DEFAULT_EXTENSIONS_PATH, { withFileTypes: true })
      .filter(f => USE_DEFAULT_EXTENSIONS.has(f.name))
      .filter(f => f.isDirectory() && fs.existsSync(path.resolve(DEFAULT_EXTENSIONS_PATH, f.name, 'package.json')))
      .map(f => f.name)
      .map(name => [
        `default-extensions/${name}`,
        path.resolve(DEFAULT_EXTENSIONS_PATH, name)
      ])
  )
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
  if (vscodeVersion == null) {
    throw new Error('Vscode version is mandatory')
  }
  return rollup.defineConfig([{
    cache: false,
    treeshake: {
      annotations: true,
      preset: 'smallest',
      moduleSideEffects (id) {
        if (id.endsWith('vs/workbench/browser/media/style.css')) {
          // Remove global vscode css rules
          return false
        }
        return id.startsWith(SRC_DIR) ||
          id.endsWith('.css') ||
          id.startsWith(KEYBOARD_LAYOUT_DIR) ||
          id.endsWith('.contribution.js') ||
          id.endsWith('ExtensionPoint.js') ||
          id.includes('vs/workbench/api/browser/') ||
          id.endsWith('/fileCommands.js') ||
          id.endsWith('/explorerViewlet.js') ||
          id.endsWith('/listCommands.js') ||
          id.endsWith('/quickAccessActions.js') ||
          id.endsWith('/gotoLineQuickAccess.js') ||
          id.endsWith('/workbenchReferenceSearch.js')
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
      commonjs(),
      extensionDirectoryPlugin({
        include: `${DEFAULT_EXTENSIONS_PATH}/**/*`,
        isDefaultExtension: true,
        rollupPlugins: [
          commonjs(),
          terser()
        ]
      }),
      {
        name: 'resolve-vscode',
        resolveId: async function (importee, importer) {
          if (importee === '@vscode/iconv-lite-umd') {
            return path.resolve(OVERRIDE_PATH, 'iconv.ts')
          }
          if (importee === 'jschardet') {
            return path.resolve(OVERRIDE_PATH, 'jschardet.ts')
          }
          if (importer != null && importee.startsWith('.')) {
            importee = path.resolve(path.dirname(importer), importee)
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
      }),
      {
        name: 'improve-vscode-treeshaking',
        transform (code, id) {
          if (id.startsWith(VSCODE_DIR) && id.endsWith('.js')) {
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

            const patchedCode = code.replace(/(^__decorate\(\[\n.*\n\], (.*).prototype)/gm, '$2.__decorator = $1')

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
                    if ((name != null && isCallPure(id, name, node)) || isCallPure(id, node.callee.property.name, node)) {
                      path.replace(addComment(node))
                    }
                  }
                } else if (node.callee.type === 'Identifier' && isCallPure(id, node.callee.name, node)) {
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
          return undefined
        }
      }, replace({
        VSCODE_VERSION: JSON.stringify(vscodeVersion),
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
