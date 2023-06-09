import './style.css'
import 'monaco-editor/esm/vs/editor/editor.all.js'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js'
import './setup'
import { createConfiguredEditor, createModelReference } from 'vscode/monaco'
import { registerFileSystemOverlay, HTMLFileSystemProvider } from 'vscode/service-override/files'
import * as vscode from 'vscode'
import { ILogService, StandaloneServices, IPreferencesService } from 'vscode/services'
import './features/customView'
import './features/debugger'
import './features/search'
import { anotherFakeOutputChannel } from './features/output'
import './features/filesystem'
import './features/intellisense'
import './features/notifications'
import './features/terminal'

import 'vscode/default-extensions/theme-defaults'
import 'vscode/default-extensions/javascript'
import 'vscode/default-extensions/typescript-basics'
import 'vscode/default-extensions/json'
import 'vscode/default-extensions/theme-seti'
import 'vscode/default-extensions/references-view'

const modelRef = await createModelReference(monaco.Uri.file('/tmp/test.js'), `// import anotherfile
let variable = 1
function inc () {
  variable++
}

while (variable < 5000) {
  inc()
  console.log('Hello world', variable);
}`)

const mainDocument = await vscode.workspace.openTextDocument(modelRef.object.textEditorModel!.uri)
await vscode.window.showTextDocument(mainDocument, {
  preview: false
})

anotherFakeOutputChannel.replace(mainDocument.getText())
vscode.workspace.onDidChangeTextDocument((e) => {
  if (e.document === mainDocument) {
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
  "terminal.integrated.tabs.title": "\${sequence}"
}`)
createConfiguredEditor(document.getElementById('settings-editor')!, {
  model: settingsModelReference.object.textEditorModel
})

const keybindingsModelReference = await createModelReference(monaco.Uri.from({ scheme: 'user', path: '/keybindings.json' }), `[
{
  "key": "ctrl+d",
  "command": "editor.action.deleteLines",
  "when": "editorTextFocus"
}
]`)
createConfiguredEditor(document.getElementById('keybindings-editor')!, {
  model: keybindingsModelReference.object.textEditorModel
})

document.querySelector('#filesystem')!.addEventListener('click', async () => {
  const dirHandle = await window.showDirectoryPicker()

  const htmlFileSystemProvider = new HTMLFileSystemProvider(undefined, 'unused', StandaloneServices.get(ILogService))
  await htmlFileSystemProvider.registerDirectoryHandle(dirHandle)
  registerFileSystemOverlay(htmlFileSystemProvider)

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
