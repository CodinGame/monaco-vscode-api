import * as rollup from 'rollup'
import dts from 'rollup-plugin-dts'
import * as tsMorph from 'ts-morph'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const project = new tsMorph.Project({
  tsConfigFilePath: path.resolve(__dirname, '../tsconfig.types.json'),
  manipulationSettings: {
    quoteKind: tsMorph.QuoteKind.Single
  }
})

const VSCODE_DIR = path.join(__dirname, '../vscode')
const DIST_DIR = path.join(__dirname, '../dist')

const interfaceOverride = new Map<string, string>()
interfaceOverride.set('Event<T>', 'vscode.Event<T>')
interfaceOverride.set('ICodeEditor', 'monaco.editor.ICodeEditor')
interfaceOverride.set('URI', 'monaco.Uri')
interfaceOverride.set('ITextModel', 'monaco.editor.ITextModel')
interfaceOverride.set('vs/editor/common/config/editorOptions:IEditorOptions', 'monaco.editor.IEditorOptions')
interfaceOverride.set('IEditorOverrideServices', 'monaco.editor.IEditorOverrideServices')
interfaceOverride.set('IStandaloneCodeEditor', 'monaco.editor.IStandaloneCodeEditor')
interfaceOverride.set('IStandaloneDiffEditor', 'monaco.editor.IStandaloneDiffEditor')
interfaceOverride.set('IStandaloneEditorConstructionOptions', 'monaco.editor.IStandaloneEditorConstructionOptions')
interfaceOverride.set('IStandaloneDiffEditorConstructionOptions', 'monaco.editor.IStandaloneDiffEditorConstructionOptions')

export default rollup.defineConfig({
  input: Object.fromEntries([
    './dist/types/src/services.d.ts',
    './dist/types/src/extensions.d.ts',
    './dist/types/src/service-override/notifications.d.ts',
    './dist/types/src/service-override/dialogs.d.ts',
    './dist/types/src/service-override/model.d.ts',
    './dist/types/src/service-override/editor.d.ts',
    './dist/types/src/service-override/files.d.ts',
    './dist/types/src/service-override/configuration.d.ts',
    './dist/types/src/service-override/keybindings.d.ts',
    './dist/types/src/service-override/textmate.d.ts',
    './dist/types/src/service-override/theme.d.ts',
    './dist/types/src/service-override/snippets.d.ts',
    './dist/types/src/service-override/languages.d.ts',
    './dist/types/src/service-override/audioCue.d.ts',
    './dist/types/src/service-override/debug.d.ts',
    './dist/types/src/service-override/preferences.d.ts',
    './dist/types/src/service-override/views.d.ts',
    './dist/types/src/service-override/quickaccess.d.ts',
    './dist/types/src/workers/textMate.worker.d.ts',
    './dist/types/src/monaco.d.ts',
    './dist/types/src/rollup-vsix-plugin.d.ts',
    './dist/types/src/rollup-extension-directory-plugin.d.ts'
  ].map(input => ([
    path.relative(path.resolve(DIST_DIR, 'types/src'), path.resolve(__dirname, '..', input)).slice(0, -3),
    input
  ]))),
  output: {
    format: 'esm',
    dir: 'dist',
    entryFileNames: chunk => `${chunk.name}.ts`,
    chunkFileNames: chunk => `${chunk.name}.ts`,
    assetFileNames: chunk => `${chunk.name}.ts`
  },
  external: function isExternal (id) {
    if (id.endsWith('.css')) {
      return true
    }
    return ['vscode', 'monaco-editor', 'vscode-textmate', 'rollup', '@rollup/pluginutils', 'xterm', 'tas-client-umd', 'xterm-addon-canvas', 'xterm-addon-search', 'xterm-addon-unicode11', 'xterm-addon-webgl', 'xterm-addon-serialize'].includes(id)
  },
  plugins: [
    {
      name: 'change-unsupported-syntax',
      transform (code) {
        return code.replace('export import Severity = BaseSeverity;', 'type Severity = BaseSeverity; export { Severity }')
      }
    },
    {
      name: 'replace-interfaces',
      load (id) {
        const [sourceFile] = project.addSourceFilesAtPaths(id)

        sourceFile!.addImportDeclaration({
          moduleSpecifier: 'monaco-editor',
          namespaceImport: 'monaco'
        })
        sourceFile!.addImportDeclaration({
          moduleSpecifier: 'vscode',
          namespaceImport: 'vscode'
        })
        return sourceFile!.getFullText()
      },
      transform (code, id) {
        interfaceOverride.forEach((value, key) => {
          const [, path, name] = /(?:(.*):)?(.*)/.exec(key)!
          if (path == null || path === id) {
            code = code.replace(`interface ${name} `, `type ${name} = ${value}\ninterface _${name} `)
          }
        })

        return code
      },
      renderChunk (code, chunk) {
        const chunkParentPath = path.resolve(DIST_DIR, path.dirname(chunk.fileName))
        if (code.includes('DebugProtocol')) {
          const importPath = path.relative(chunkParentPath, path.resolve(DIST_DIR, 'debugProtocol.d.ts'))
          return `/// <reference path="./${importPath}" />\n\n${code}`
        }
        return undefined
      }
    },
    {
      name: 'resolve-vscode',
      resolveId: async function (importee, importer) {
        if (importee.startsWith('vscode/')) {
          return path.resolve(VSCODE_DIR, path.relative('vscode', `${importee}.d.ts`))
        }
        if (!importee.startsWith('vs/') && importer != null && importer.startsWith(VSCODE_DIR)) {
          importee = path.relative(VSCODE_DIR, path.resolve(path.dirname(importer), importee))
        }
        if (importee.startsWith('vs/')) {
          return path.join(VSCODE_DIR, `${importee}.d.ts`)
        }
        return undefined
      }
    },
    dts({
      respectExternal: true
    })
  ]
})
