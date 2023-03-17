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
import { getUserConfiguration, onUserConfigurationChange, updateUserConfiguration } from 'vscode/service-override/configuration'
import { updateUserKeybindings } from 'vscode/service-override/keybindings'
import { createConfiguredEditor, getJsonSchemas, onDidChangeJsonSchema } from 'vscode/monaco'
import { debounce } from 'throttle-debounce'
import * as vscode from 'vscode'

vscode.languages.registerHoverProvider('java', {
  async provideHover (document, position) {
    return {
      contents: [
        '# Hello',
        `This is a hover on ${document.uri.toString()} at position ${position.line}:${position.character}`
      ]
    }
  }
})

vscode.languages.registerCompletionItemProvider('java', {
  provideCompletionItems () {
    return [{
      label: 'Demo completion',
      detail: 'This is a demo completion registered via the vscode api',
      insertText: 'hello world'
    }]
  }
})

monaco.languages.json.jsonDefaults.setModeConfiguration({
  ...monaco.languages.json.jsonDefaults.modeConfiguration,
  tokens: false // Disable monarch tokenizer as we use TextMate here
})

void vscode.window.showInformationMessage('Hello', {
  detail: 'Welcome to the monaco-vscode-api demo',
  modal: true
}).then(() => {
  void vscode.window.showInformationMessage('Try to change the settings or the configuration, the changes will be applied to all 3 editors')
})

const model = monaco.editor.createModel(
  `// Your First Program

class HelloWorld {
    public static void main(String[] args) {
        System.out.println('Hello, World!');
    }
}`,
  'java',
  monaco.Uri.file('HelloWorld.java')
)

createConfiguredEditor(document.getElementById('editor')!, {
  model
})

const diagnostics = vscode.languages.createDiagnosticCollection('demo')
diagnostics.set(model.uri, [{
  range: new vscode.Range(2, 6, 2, 16),
  severity: vscode.DiagnosticSeverity.Error,
  message: 'This is not a real error, just a demo, don\'t worry',
  source: 'Demo',
  code: 42
}])

const settingsModel = monaco.editor.createModel(
`{
  "workbench.colorTheme": "Default Dark+",
  "editor.autoClosingBrackets": "languageDefined",
  "editor.autoClosingQuotes": "languageDefined",
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
settingsModel.onDidChangeContent(debounce(1000, async () => {
  const currentConfig = await getUserConfiguration()
  if (currentConfig !== settingsModel.getValue()) {
    await updateUserConfiguration(settingsModel.getValue())
  }
}))
void updateUserConfiguration(settingsModel.getValue())
onUserConfigurationChange(async () => {
  const newConfiguration = await getUserConfiguration()
  if (newConfiguration !== settingsModel.getValue()) {
    settingsModel.setValue(newConfiguration)
  }
})

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
keybidingsModel.onDidChangeContent(debounce(1000, async () => {
  await updateUserKeybindings(keybidingsModel.getValue())
}))
void updateUserKeybindings(keybidingsModel.getValue())

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

setTimeout(() => {
  vscode.workspace.onDidChangeConfiguration(() => {
    void vscode.window.showInformationMessage('The configuration was changed')
  })
}, 1000)
