import * as rollup from 'rollup'
import dts from 'rollup-plugin-dts'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const VSCODE_DIR = path.join(__dirname, '../vscode')

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

export default rollup.defineConfig([
  './dist/types/src/services.d.ts',
  './dist/types/src/extensions.d.ts',
  './dist/types/src/service-override/notifications.d.ts',
  './dist/types/src/service-override/dialogs.d.ts',
  './dist/types/src/service-override/modelEditor.d.ts',
  './dist/types/src/service-override/configuration.d.ts',
  './dist/types/src/service-override/keybindings.d.ts',
  './dist/types/src/service-override/textmate.d.ts',
  './dist/types/src/service-override/languageConfiguration.d.ts',
  './dist/types/src/service-override/theme.d.ts',
  './dist/types/src/service-override/tokenClassification.d.ts',
  './dist/types/src/service-override/snippets.d.ts',
  './dist/types/src/service-override/languages.d.ts',
  './dist/types/src/service-override/audioCue.d.ts',
  './dist/types/src/service-override/debug.d.ts',
  './dist/types/src/monaco.d.ts'
].map((input): rollup.RollupOptions => ({
  input,
  output: {
    format: 'esm',
    dir: 'dist',
    entryFileNames: chunk => `${chunk.name}.ts`
  },
  external: function isExternal (id) {
    return ['vscode', 'monaco-editor', 'vscode-textmate'].includes(id)
  },
  plugins: [
    {
      name: 'ignore-css',
      load (id) {
        if (id.includes('vs/css!')) {
          return 'export default undefined;'
        }
        return undefined
      }
    },
    {
      name: 'change-unsupported-syntax',
      transform (code) {
        return code.replace('export import Severity = BaseSeverity;', 'type Severity = BaseSeverity; export { Severity }')
      }
    },
    {
      name: 'replace-interfaces',
      transform (code, id) {
        interfaceOverride.forEach((value, key) => {
          const [, path, name] = /(?:(.*):)?(.*)/.exec(key)!
          if (path == null || path === id) {
            code = code.replace(`interface ${name} `, `type ${name} = ${value}\ninterface _${name} `)
          }
        })

        return `import * as monaco from 'monaco-editor'\nimport * as vscode from 'vscode'\n${code}`
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
})))
