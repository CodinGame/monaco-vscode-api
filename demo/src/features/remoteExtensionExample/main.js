const vscode = require('vscode')
const os = require('os')

vscode.commands.registerCommand('prompt-hello', () => {
  void vscode.window.showInformationMessage('Hello', {
    detail: vscode.l10n.t('Hello from remote extension running from {0}!', os.hostname()),
    modal: true
  })
})

vscode.commands.executeCommand('prompt-hello')
