import * as vscode from 'vscode'
import '../setup' // import setup file to wait for services initialization

void vscode.window.showInformationMessage('Hello', {
  detail: 'Welcome to the monaco-vscode-api demo',
  modal: true
}).then(() => {
  void vscode.window.showInformationMessage('Try to change the settings or the configuration, the changes will be applied to all 3 editors')
})

setTimeout(() => {
  vscode.workspace.onDidChangeConfiguration(() => {
    void vscode.window.showInformationMessage('The configuration was changed')
  })
}, 1000)
