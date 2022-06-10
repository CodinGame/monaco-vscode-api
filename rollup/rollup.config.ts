import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import * as recast from 'recast'
import * as babel from '@babel/core'
import * as monaco from 'monaco-editor'
import typescript from '@rollup/plugin-typescript'
import cleanup from 'js-cleanup'
import * as fs from 'fs'
import * as path from 'path'
import * as vm from 'vm'

// Force usage of vscode code for these imports
const IGNORE_MONACO = new Set(['vs/base/common/buffer:VSBuffer'])
const REMOVE_NOT_STATIC_MEMBERS_OF_CLASSES = new Set(['ExtHostLanguageFeatures', 'MainThreadLanguageFeatures'])

const PURE_ANNO = '#__PURE__'
const PURE_FUNCTIONS = new Set([
  '__param',
  '__decorate',
  'createProxyIdentifier',
  'createDecorator',
  'localize',
  'register',
  'CommandsRegistry.registerCommand' // It's not pure but we don't want the additional static vscode commands registered
])
const EXTENSIONS = ['', '.ts', '.js']

const VSCODE_DIR = path.resolve(__dirname, '../vscode')
const NODE_MODULES_DIR = path.resolve(__dirname, '../node_modules')
const MONACO_EDITOR_DIR = path.resolve(NODE_MODULES_DIR, './monaco-editor')

export default rollup.defineConfig({
  cache: false,
  treeshake: {
    annotations: true,
    preset: 'smallest'
  },
  external: (source) => {
    return source.startsWith(MONACO_EDITOR_DIR)
  },
  output: [{
    format: 'esm',
    dir: 'dist',
    entryFileNames: chunk => `${chunk.name}.js`,
    paths: {
      'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api.js'
    }
  }, {
    format: 'commonjs',
    dir: 'dist',
    entryFileNames: chunk => `${chunk.name}.cjs`
  }, {
    format: 'amd',
    dir: 'dist',
    entryFileNames: chunk => `${chunk.name}.amd.js`
  }],
  input: {
    api: './src/api.ts',
    services: './src/services.ts'
  },
  plugins: [
    {
      name: 'resolve-vscode',
      resolveId: async function (importee, importer) {
        if (!importee.startsWith('vs/') && importer != null && importer.startsWith(VSCODE_DIR)) {
          importee = path.relative(VSCODE_DIR, path.resolve(path.dirname(importer), importee))
        }
        if (importee.startsWith('vs/')) {
          if (!fs.existsSync(path.resolve(MONACO_EDITOR_DIR, `esm/${importee}.js`))) {
            return resolve(importee, [VSCODE_DIR])
          }
          return importee
        }
      },
      load: (id) => {
        if (id.startsWith('vs/')) {
          return importMonaco(id)
        }
      }
    },
    nodeResolve({
      extensions: EXTENSIONS
    }),
    {
      name: 'ignore-css',
      load (id) {
        if (id.endsWith('.css')) {
          return 'export default undefined;'
        }
      }
    },
    typescript({
      noEmitOnError: true
    }),
    {
      name: 'transformations',
      transform (code, id) {
        if (id.startsWith(VSCODE_DIR)) {
          const ast = recast.parse(code, {
            parser: require('recast/parsers/babylon')
          })
          let transformed: boolean = false
          function addComment (node: recast.types.namedTypes.Expression) {
            if (!(node.comments ?? []).some(comment => comment.value === PURE_ANNO)) {
              transformed = true
              node.comments = [recast.types.builders.commentBlock(PURE_ANNO, true)]
            }
          }
          function visitClassDeclaration (node: recast.types.namedTypes.ClassExpression | recast.types.namedTypes.ClassDeclaration) {
            if (node.id != null && REMOVE_NOT_STATIC_MEMBERS_OF_CLASSES.has(node.id.name)) {
              node.body.body = node.body.body.filter(member => {
                if (member.type === 'ClassMethod' && !(member.static ?? false) && member.key.type === 'Identifier') {
                  transformed = true
                  return false
                }
                return true
              })
            }
          }
          recast.visit(ast.program.body, {
            visitClassExpression (path) {
              visitClassDeclaration(path.node)
              this.traverse(path)
            },
            visitClassDeclaration (path) {
              addComment(path.node)
              visitClassDeclaration(path.node)
              this.traverse(path)
            },
            visitNewExpression (path) {
              const node = path.node
              if (node.callee.type === 'Identifier') {
                addComment(node)
              }
              this.traverse(path)
            },
            visitCallExpression (path) {
              const node = path.node
              if (node.callee.type === 'Identifier' && node.callee.name === '__decorate') {
                // We don't use the vscode injection mecanism, so remove it to improve treeshaking
                transformed = true
                path.replace(node.arguments[1])
                return false
              }
              if (node.callee.type === 'MemberExpression') {
                if (node.callee.object.type === 'Identifier' && node.callee.property.type === 'Identifier') {
                  const name = `${node.callee.object.name}.${node.callee.property.name}`
                  if (PURE_FUNCTIONS.has(name) || PURE_FUNCTIONS.has(node.callee.property.name)) {
                    addComment(node)
                  }
                }
              } else if (node.callee.type === 'Identifier' && PURE_FUNCTIONS.has(node.callee.name)) {
                addComment(node)
              } else if (node.callee.type === 'FunctionExpression') {
                // Mark IIFE as pure, because typescript compile enums as IIFE
                addComment(node)
              }
              this.traverse(path)
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
      }
    }, {
      name: 'cleanup',
      renderChunk (code) {
        return cleanup(code, null, {
          comments: 'none',
          sourcemap: false
        }).code
      }
    }
  ]
})

function resolve (_path: string, fromPaths: string[]) {
  for (const fromPath of fromPaths) {
    for (const extension of EXTENSIONS) {
      const outputPath = path.resolve(fromPath, `${_path}${extension}`)
      if (fs.existsSync(outputPath) && fs.lstatSync(outputPath).isFile()) {
        return outputPath
      }
    }
  }
}

const cache = new Map<string, Record<string, unknown>>()
function customRequire<T extends Record<string, unknown>> (_path: string, rootPaths: string[] = [], fromPath?: string): T | null {
  const resolvedPath = resolve(_path, fromPath != null ? [...rootPaths, fromPath] : rootPaths)
  if (resolvedPath == null) {
    return null
  }
  if (cache.has(resolvedPath)) {
    return cache.get(resolvedPath) as T
  }

  const code = fs.readFileSync(resolvedPath).toString()

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
          return require('tslib')
        }
        if (_path.endsWith('.css') || _path.includes('!')) {
          return null
        }
        const result = customRequire(_path, rootPaths, path.dirname(resolvedPath))
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
      document: {},
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

  const vscodeExports = customRequire(vscodePath, [VSCODE_DIR])!

  let monacoExports = customRequire(monacoPath, [path.resolve(MONACO_EDITOR_DIR, 'esm')])!
  monacoExports = Object.fromEntries(Object.entries(monacoExports).filter(([key]) => {
    const vscodeValue = vscodeExports[key]
    if (vscodeValue == null) {
      console.warn(`${importee}#${key} is exported from monaco but not from vscode`)
      return true
    }

    return !IGNORE_MONACO.has(`${importee}:${key}`)
  }))

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
