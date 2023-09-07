const vscode = require('vscode')
const os = require("os")

void vscode.window.showInformationMessage('Hello', {
  detail: `Hello from remote extension running from ${os.hostname()}`,
  modal: true
})

