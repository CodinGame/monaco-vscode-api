import './style.css'
import * as monaco from 'monaco-editor'
import { createConfiguredEditor, createModelReference } from 'vscode/monaco'
import { registerFileSystemOverlay, HTMLFileSystemProvider } from 'vscode/service-override/files'
import * as vscode from 'vscode'
import { ILogService, StandaloneServices, IPreferencesService, IEditorService, IDialogService } from 'vscode/services'
import { ConfirmResult, Parts, isPartVisibile, setPartVisibility } from 'vscode/service-override/views'
import { clearStorage } from './setup'
import { CustomEditorInput } from './features/customView'
import './features/debugger'
import './features/search'
import { anotherFakeOutputChannel } from './features/output'
import './features/filesystem'
import './features/intellisense'
import './features/notifications'
import './features/terminal'

import 'vscode/default-extensions/clojure'
import 'vscode/default-extensions/coffeescript'
import 'vscode/default-extensions/cpp'
import 'vscode/default-extensions/csharp'
import 'vscode/default-extensions/css'
import 'vscode/default-extensions/diff'
import 'vscode/default-extensions/fsharp'
import 'vscode/default-extensions/go'
import 'vscode/default-extensions/groovy'
import 'vscode/default-extensions/html'
import 'vscode/default-extensions/java'
import 'vscode/default-extensions/javascript'
import 'vscode/default-extensions/json'
import 'vscode/default-extensions/julia'
import 'vscode/default-extensions/lua'
import 'vscode/default-extensions/markdown-basics'
import 'vscode/default-extensions/objective-c'
import 'vscode/default-extensions/perl'
import 'vscode/default-extensions/php'
import 'vscode/default-extensions/powershell'
import 'vscode/default-extensions/python'
import 'vscode/default-extensions/r'
import 'vscode/default-extensions/ruby'
import 'vscode/default-extensions/rust'
import 'vscode/default-extensions/scss'
import 'vscode/default-extensions/shellscript'
import 'vscode/default-extensions/sql'
import 'vscode/default-extensions/swift'
import 'vscode/default-extensions/typescript-basics'
import 'vscode/default-extensions/vb'
import 'vscode/default-extensions/xml'
import 'vscode/default-extensions/yaml'

import 'vscode/default-extensions/theme-defaults'
import 'vscode/default-extensions/theme-seti'
import 'vscode/default-extensions/references-view'
import 'vscode/default-extensions/search-result'
import 'vscode/default-extensions/configuration-editing'
import 'vscode/default-extensions/markdown-math'
import 'vscode/default-extensions/npm'
import 'vscode/default-extensions/media-preview'

const modelRef = await createModelReference(monaco.Uri.file('/tmp/test.js'), `// import anotherfile
let variable = 1
function inc () {
  variable++
}

while (variable < 5000) {
  inc()
  console.log('Hello world', variable);
}`)

const [mainDocument] = await Promise.all([
  vscode.workspace.openTextDocument(modelRef.object.textEditorModel!.uri),
  vscode.workspace.openTextDocument(monaco.Uri.file('/tmp/test_readonly.js')) // open the file so vscode sees it's locked
])
await vscode.window.showTextDocument(mainDocument, {
  preview: false
})

anotherFakeOutputChannel.replace(mainDocument.getText())
vscode.workspace.onDidChangeTextDocument((e) => {
  if (e.document === mainDocument && e.contentChanges.length > 0) {
    anotherFakeOutputChannel.replace(e.document.getText())
  }
})

const diagnostics = vscode.languages.createDiagnosticCollection('demo')
diagnostics.set(modelRef.object.textEditorModel!.uri, [{
  range: new vscode.Range(2, 9, 2, 12),
  severity: vscode.DiagnosticSeverity.Error,
  message: 'This is not a real error, just a demo, don\'t worry',
  source: 'Demo',
  code: 42
}])

const settingsModelReference = await createModelReference(monaco.Uri.from({ scheme: 'user', path: '/settings.json' }), `{
  "workbench.colorTheme": "Default Dark+",
  "workbench.iconTheme": "vs-seti",
  "editor.autoClosingBrackets": "languageDefined",
  "editor.autoClosingQuotes": "languageDefined",
  "editor.scrollBeyondLastLine": true,
  "editor.mouseWheelZoom": true,
  "editor.wordBasedSuggestions": false,
  "editor.acceptSuggestionOnEnter": "on",
  "editor.foldingHighlight": false,
  "editor.semanticHighlighting.enabled": true,
  "editor.bracketPairColorization.enabled": false,
  "editor.fontSize": 12,
  "audioCues.lineHasError": "on",
  "audioCues.onDebugBreak": "on",
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "debug.toolBarLocation": "docked",
  "editor.experimental.asyncTokenization": true,
  "terminal.integrated.tabs.title": "\${sequence}",
  "typescript.tsserver.log": "normal"
}`)
createConfiguredEditor(document.getElementById('settings-editor')!, {
  model: settingsModelReference.object.textEditorModel,
  automaticLayout: true
})

const keybindingsModelReference = await createModelReference(monaco.Uri.from({ scheme: 'user', path: '/keybindings.json' }), `[
  {
    "key": "ctrl+d",
    "command": "editor.action.deleteLines",
    "when": "editorTextFocus"
  }
]`)
createConfiguredEditor(document.getElementById('keybindings-editor')!, {
  model: keybindingsModelReference.object.textEditorModel,
  automaticLayout: true
})

document.querySelector('#filesystem')!.addEventListener('click', async () => {
  const dirHandle = await window.showDirectoryPicker()

  const htmlFileSystemProvider = new HTMLFileSystemProvider(undefined, 'unused', StandaloneServices.get(ILogService))
  await htmlFileSystemProvider.registerDirectoryHandle(dirHandle)
  registerFileSystemOverlay(1, htmlFileSystemProvider)

  vscode.workspace.updateWorkspaceFolders(0, 0, {
    uri: vscode.Uri.file(dirHandle.name)
  })
})

document.querySelector('#run')!.addEventListener('click', () => {
  void vscode.debug.startDebugging(undefined, {
    name: 'Test',
    request: 'attach',
    type: 'javascript'
  })
})

document.querySelector('#settingsui')!.addEventListener('click', async () => {
  await StandaloneServices.get(IPreferencesService).openUserSettings()
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

document.querySelector('#keybindingsui')!.addEventListener('click', async () => {
  await StandaloneServices.get(IPreferencesService).openGlobalKeybindingSettings(false)
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

document.querySelector('#customEditorPanel')!.addEventListener('click', async () => {
  const input = new CustomEditorInput({
    async confirm () {
      const { confirmed } = await StandaloneServices.get(IDialogService).confirm({
        message: 'Are you sure you want to close this INCREDIBLE editor pane?'
      })
      return confirmed ? ConfirmResult.DONT_SAVE : ConfirmResult.CANCEL
    },
    showConfirm () {
      return true
    }
  })
  let toggle = false
  const interval = window.setInterval(() => {
    const title = toggle ? 'Awesome editor pane' : 'Incredible editor pane'
    input.setTitle(title)
    input.setName(title)
    input.setDescription(title)
    toggle = !toggle
  }, 1000)
  input.onWillDispose(() => {
    window.clearInterval(interval)
  })

  await StandaloneServices.get(IEditorService).openEditor(input, {
    pinned: true
  })
})

document.querySelector('#clearStorage')!.addEventListener('click', async () => {
  await clearStorage()
})

document.querySelector('#togglePanel')!.addEventListener('click', async () => {
  setPartVisibility(Parts.PANEL_PART, !isPartVisibile(Parts.PANEL_PART))
})

document.querySelector('#toggleAuxiliary')!.addEventListener('click', async () => {
  setPartVisibility(Parts.AUXILIARYBAR_PART, !isPartVisibile(Parts.AUXILIARYBAR_PART))
})
