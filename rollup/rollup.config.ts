import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import * as recast from 'recast'
import * as babel from '@babel/core'
import * as monaco from 'monaco-editor'
import typescript from '@rollup/plugin-typescript'
import cleanup from 'js-cleanup'
import ts from 'typescript'
import replace from '@rollup/plugin-replace'
import styles from 'rollup-plugin-styles'
import * as tslib from 'tslib'
import * as babylonParser from 'recast/parsers/babylon.js'
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars'
import * as fs from 'fs'
import * as path from 'path'
import * as vm from 'vm'
import { fileURLToPath } from 'url'
import pkg from '../package.json' assert { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PURE_ANNO = '#__PURE__'
const PURE_FUNCTIONS = new Set([
  '__param',
  '__decorate',
  'createProxyIdentifier',
  'createDecorator',
  'localize',
  'Registry.as',
  'registerWorkbenchContribution',
  'Object.freeze',
  'URI.parse',
  'URI.from',
  'registerColor',
  'transparent',
  'darken',
  'lighten',
  'Color.fromHex',
  'registerExtensionPoint',
  'asBroswerUri',
  'values',
  'keys',
  'toString',
  'ContextKeyExpr.and',
  'ContextKeyNotExpr.create',
  'ContextKeyDefinedExpr.create',
  'ProductQualityContext.notEqualsTo'
])

const EXTENSIONS = ['', '.ts', '.js']

const BASE_DIR = path.resolve(__dirname, '..')
const TSCONFIG = path.resolve(BASE_DIR, 'tsconfig.build.json')
const SRC_DIR = path.resolve(BASE_DIR, 'src')
const DIST_DIR = path.resolve(BASE_DIR, 'dist')
const VSCODE_DIR = path.resolve(BASE_DIR, 'vscode')
const NODE_MODULES_DIR = path.resolve(BASE_DIR, 'node_modules')
const MONACO_EDITOR_DIR = path.resolve(NODE_MODULES_DIR, './monaco-editor')
const OVERRIDE_PATH = path.resolve(BASE_DIR, 'src/override')
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

const input = {
  api: './src/api.ts',
  services: './src/services.ts',
  messages: './src/service-override/messages.ts',
  notifications: './src/service-override/notifications.ts',
  dialogs: './src/service-override/dialogs.ts',
  modelEditor: './src/service-override/modelEditor.ts',
  configuration: './src/service-override/configuration.ts',
  keybindings: './src/service-override/keybindings.ts',
  textmate: './src/service-override/textmate.ts',
  languageConfiguration: './src/service-override/languageConfiguration.ts',
  theme: './src/service-override/theme.ts',
  tokenClassification: './src/service-override/tokenClassification.ts',
  snippets: './src/service-override/snippets.ts',
  languages: './src/service-override/languages.ts',
  monaco: './src/monaco'
}

const externals = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies })
const external: rollup.ExternalOption = (source) => {
  // mark semver as external so it's ignored (the code that imports it will be treeshaked out)
  if (source.includes('semver')) return true
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
        return id.startsWith(SRC_DIR) || id.endsWith('.css') || id.startsWith(KEYBOARD_LAYOUT_DIR)
      }
    },
    external,
    output: [{
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
      {
        name: 'resolve-vscode',
        resolveId: async function (importee, importer) {
          if (importee.startsWith('vs/css!')) {
            return path.resolve(path.dirname(importer!), importee.slice('vs/css!'.length) + '.css')
          }
          if (importee.startsWith('vscode/')) {
            return resolve(path.relative('vscode', importee), [VSCODE_DIR])
          }
          if (!importee.startsWith('vs/') && importer != null && importer.startsWith(VSCODE_DIR)) {
            importee = path.relative(VSCODE_DIR, path.resolve(path.dirname(importer), importee))
          }
          const overridePath = path.resolve(OVERRIDE_PATH, `${importee}.js`)
          if (fs.existsSync(overridePath)) {
            return overridePath
          }
          if (importee.startsWith('vs/')) {
            const monacoFileExists = fs.existsSync(path.resolve(MONACO_EDITOR_DIR, `esm/${importee}.js`))
            if (!monacoFileExists) {
              return resolve(importee, [VSCODE_DIR])
            }
            return importee
          }
          return undefined
        },
        transform (code) {
          return toggleEsmComments(code).replaceAll("'vs/workbench/services/keybinding/browser/keyboardLayouts/layout.contribution.' + platform", "'./keyboardLayouts/layout.contribution.' + platform + '.js'")
        },
        load (id) {
          if (id.startsWith(VSCODE_DIR) && id.endsWith('.css')) {
            const monacoCssPath = path.resolve(MONACO_EDITOR_DIR, 'esm', path.relative(VSCODE_DIR, id))
            if (fs.existsSync(monacoCssPath)) {
              return ''
            }
          }
          if (id.startsWith('vs/')) {
            return importMonaco(id)
          }
          return undefined
        }
      },
      styles(),
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
          if (id.startsWith(VSCODE_DIR)) {
            const ast = recast.parse(code, {
              parser: babylonParser
            })
            let transformed: boolean = false
            function addComment (node: recast.types.namedTypes.NewExpression | recast.types.namedTypes.CallExpression) {
              if (!(node.comments ?? []).some(comment => comment.value === PURE_ANNO)) {
                transformed = true
                node.comments = [recast.types.builders.commentBlock(PURE_ANNO, true)]
                return recast.types.builders.parenthesizedExpression(node)
              }
              return node
            }
            recast.visit(ast.program.body, {
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

                if (name != null && new Set([
                  'colorRegistry.onDidChangeSchema',
                  'registerSingleton', // Remove calls to registerSingleton from vscode code, we just want to import things, not registering services
                  'registerProxyConfigurations'
                ]).has(name)) {
                  transformed = true
                  return null
                }

                if (node.callee.type === 'MemberExpression') {
                  if (node.callee.property.type === 'Identifier') {
                    if ((name != null && PURE_FUNCTIONS.has(name)) || PURE_FUNCTIONS.has(node.callee.property.name)) {
                      path.replace(addComment(node))
                    }

                    if (name != null && name === 'CommandsRegistry.registerCommand') {
                      if (!id.includes('/snippetCompletionProvider')) {
                        path.replace(addComment(node))
                      }
                    }
                    // Remove Registry.add calls
                    if (name != null && name.endsWith('Registry.add')) {
                      const firstParam = node.arguments[0]!
                      const firstParamName = firstParam.type === 'MemberExpression' ? getMemberExpressionPath(firstParam) : undefined
                      const allowed = firstParamName != null && firstParamName.includes('ExtensionsRegistry')
                      if (!allowed) {
                        return null
                      }
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
          return undefined
        }
      }, replace({
        VSCODE_VERSION: JSON.stringify(vscodeVersion),
        preventAssignment: true
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
    input: Object.values(input).map(f => `./dist/${path.basename(f, '.ts')}`),
    output: [{
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
            node.comments = [recast.types.builders.commentBlock(PURE_ANNO, true)]
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
    }), {
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

// Comes from vscode (standalone.ts)
function toggleEsmComments (fileContents: string): string {
  const lines = fileContents.split(/\r\n|\r|\n/)
  let mode = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (mode === 0) {
      if (/\/\/ ESM-comment-begin/.test(line)) {
        mode = 1
        continue
      }
      if (/\/\/ ESM-uncomment-begin/.test(line)) {
        mode = 2
        continue
      }
      continue
    }

    if (mode === 1) {
      if (/\/\/ ESM-comment-end/.test(line)) {
        mode = 0
        continue
      }
      lines[i] = '// ' + line
      continue
    }

    if (mode === 2) {
      if (/\/\/ ESM-uncomment-end/.test(line)) {
        mode = 0
        continue
      }
      lines[i] = line.replace(/^(\s*)\/\/ ?/, function (_, indent) {
        return indent
      })
    }
  }

  return lines.join('\n')
}

const cache = new Map<string, Record<string, unknown>>()
function customRequire<T extends Record<string, unknown>> (_path: string, rootPaths: string[] = [], fromPath?: string, transform?: (code: string) => string): T | null {
  const resolvedPath = resolve(_path, fromPath != null ? [...rootPaths, fromPath] : rootPaths)
  if (resolvedPath == null) {
    return null
  }
  if (cache.has(resolvedPath)) {
    return cache.get(resolvedPath) as T
  }

  let code = fs.readFileSync(resolvedPath).toString()
  if (transform != null) {
    code = transform(code)
  }

  const transformedCode = babel.transform(code.replace(/@\w+/g, '') /* Remove annotations */, {
    filename: resolvedPath,
    presets: [
      ['@babel/preset-env', {
        targets: {
          node: 'current'
        }
      }],
      () => ({ plugins: [['@babel/plugin-proposal-class-properties', { loose: true }]] }),
      ['@babel/preset-typescript', { allowDeclareFields: true }]
    ]
  })?.code!

  const exports: T = {} as T
  cache.set(resolvedPath, exports)
  try {
    vm.runInNewContext(transformedCode, {
      require: (_path: string) => {
        if (_path === 'tslib') {
          return tslib
        }
        if (_path.endsWith('.css') || _path.includes('!')) {
          return null
        }
        const result = customRequire(_path, rootPaths, path.dirname(resolvedPath), transform)
        if (result == null) {
          throw new Error('Module not found: ' + _path + ' from ' + resolvedPath)
        }
        return result
      },
      define: (path: string, value: Record<string, unknown>) => {
        Object.assign(exports, value)
      },
      self: {},
      queueMicrotask: () => {},
      navigator: {
        userAgent: '',
        language: 'en'
      },
      window: {
        location: {
          href: ''
        }
      },
      document: {
        queryCommandSupported () {
          return false
        }
      },
      setTimeout: () => {},
      exports
    })
  } catch (err) {
    throw new Error(`Unable to run ${resolvedPath} code`)
  }

  return exports
}

const monacoApi = customRequire(path.resolve(MONACO_EDITOR_DIR, 'esm/vs/editor/editor.api'), [__dirname]) as typeof monaco
interface Extractor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get (exportKey: string): any
  expr (exportKey: string): string
}
const monacoApiExtractors: Extractor[] = [{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: (exportKey) => (monacoApi as any)[exportKey],
  expr: (exportKey) => `monaco.${exportKey}`
}, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: (exportKey) => (monacoApi.languages as any)[exportKey],
  expr: (exportKey) => `monaco.languages.${exportKey}`
}, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: (exportKey) => (monacoApi.editor as any)[exportKey],
  expr: (exportKey) => `monaco.editor.${exportKey}`
}]

function importMonaco (importee: string) {
  const monacoPath = path.resolve(MONACO_EDITOR_DIR, 'esm', importee)
  const vscodePath = path.resolve(VSCODE_DIR, importee)

  const vscodeExports = customRequire(vscodePath, [VSCODE_DIR], undefined, toggleEsmComments)!

  const monacoExports = customRequire(monacoPath, [path.resolve(MONACO_EDITOR_DIR, 'esm')])!
  for (const monacoExport in monacoExports) {
    if (!(monacoExport in vscodeExports)) {
      console.warn(`${importee}#${monacoExport} is exported from monaco but not from vscode`)
    }
  }

  const monacoExportKeys = new Set(Object.keys(monacoExports))
  const missingMonacoExport = Object.keys(vscodeExports).filter(e => !monacoExportKeys.has(e))

  const monacoImportPath = path.relative(NODE_MODULES_DIR, path.resolve(MONACO_EDITOR_DIR, `esm/${importee}.js`))

  // hack for marked (see ESM-uncomment-begin comments)
  if (importee === 'vs/base/common/marked/marked') {
    return (`
import { marked as _marked } from '${monacoImportPath}'

export const marked = _marked.marked
    `)
  }

  const monacoApiExports = new Map<string, string>()
  for (const exportKey in monacoExports) {
    for (const extractor of monacoApiExtractors) {
      const monacoApiExport = extractor.get(exportKey)
      if (monacoApiExport != null && monacoApiExport === monacoExports[exportKey]) {
        monacoApiExports.set(exportKey, extractor.expr(exportKey))
        monacoExportKeys.delete(exportKey)
        break
      }
    }
  }

  const lines: string[] = []

  if (monacoApiExports.size > 0) {
    lines.push('import * as monaco from \'monaco-editor\'')
    for (const [name, ref] of monacoApiExports.entries()) {
      lines.push(`export const ${name} = ${ref}`)
    }
  }

  if (monacoExportKeys.size > 0) {
    lines.push(`export { ${Array.from(monacoExportKeys).join(', ')} } from '${monacoImportPath}'`)
  }
  if (missingMonacoExport.length > 0) {
    lines.push(`export { ${missingMonacoExport.join(', ')} } from '${vscodePath}'`)
  }

  return lines.join('\n')
}
