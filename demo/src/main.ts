import './style.css'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import './setup'
import 'monaco-editor/esm/vs/editor/editor.all'
import 'monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp'
import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess'
import 'monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch'
// json contribution should be imported/run AFTER the services are initialized (in setup.ts)
import 'monaco-editor/esm/vs/language/json/monaco.contribution'
import { updateUserConfiguration } from 'vscode/service-override/configuration'
import { updateUserKeybindings } from 'vscode/service-override/keybindings'
import { createConfiguredEditor } from 'vscode/monaco'
import { getJsonSchemas, onDidChangeJsonSchema } from 'vscode/monaco'
import { debounce } from 'throttle-debounce'
import * as vscode from 'vscode'

vscode.window.showInformationMessage('Hello', {
  detail: 'Welcome to the monaco-vscode-api demo',
  modal: true
}).then(() => {
  vscode.window.showInformationMessage('Try to change the settings or the configuration, the changes will be applied to all 3 editors')
})

createConfiguredEditor(document.getElementById('editor')!, {
  language: 'java',
  value:
`// Your First Program

class HelloWorld {
    public static void main(String[] args) {
        System.out.println('Hello, World!'); 
    }
}`
})

const settingsModel = monaco.editor.createModel(
`{
  "workbench.colorTheme": "Default Dark+",
  "editor.autoClosingBrackets": "languageDefined",
  "editor.autoClosingQuotes": "languageDefined",
  "editor.minimap.enabled": false,
  "editor.scrollBeyondLastLine": true,
  "editor.mouseWheelZoom": true,
  "editor.wordBasedSuggestions": false,
  "editor.acceptSuggestionOnEnter": "on",
  "editor.foldingHighlight": false,
  "editor.semanticHighlighting.enabled": true,
  "editor.bracketPairColorization.enabled": false,
  "editor.fontSize": 12
}`, 'json', monaco.Uri.file('/settings.json'))
createConfiguredEditor(document.getElementById('settings-editor')!, {
  model: settingsModel
})
settingsModel.onDidChangeContent(debounce(1000, () => {
  updateUserConfiguration(settingsModel.getValue())
}))
updateUserConfiguration(settingsModel.getValue())

const keybidingsModel = monaco.editor.createModel(
`[
  {
    "key": "ctrl+p",
    "command": "editor.action.quickCommand",
    "when": "editorTextFocus"
  },
  {
    "key": "ctrl+d",
    "command": "editor.action.deleteLines",
    "when": "editorTextFocus"
  }
]`, 'json', monaco.Uri.file('/keybindings.json'))
createConfiguredEditor(document.getElementById('keybindings-editor')!, {
  model: keybidingsModel
})
keybidingsModel.onDidChangeContent(debounce(1000, () => {
  updateUserKeybindings(keybidingsModel.getValue())
}))
updateUserKeybindings(keybidingsModel.getValue())

function updateDiagnosticsOptions () {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    comments: 'ignore',
    validate: true,
    schemas: getJsonSchemas({
      keybindings: ['file:///keybindings.json'],
      'settings/user': ['file:///settings.json']
    })
  })
}

updateDiagnosticsOptions()
onDidChangeJsonSchema(updateDiagnosticsOptions)