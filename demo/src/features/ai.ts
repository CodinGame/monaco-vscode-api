import { ExtensionHostKind, registerExtension } from 'vscode/extensions'

const { getApi } = registerExtension({
  name: 'aiDemo',
  publisher: 'codingame',
  version: '1.0.0',
  engines: {
    vscode: '*'
  },
  contributes: {
    commands: [{
      command: 'aiSuggestedCommand',
      title: 'This is a command suggested by the AI'
    }]
  },
  enabledApiProposals: ['aiRelatedInformation']
}, ExtensionHostKind.LocalProcess)

const vscode = await getApi()
vscode.commands.registerCommand('aiSuggestedCommand', () => {
  void vscode.window.showInformationMessage('Hello', {
    detail: 'You just run the AI suggested command',
    modal: true
  })
})
vscode.ai.registerRelatedInformationProvider(vscode.RelatedInformationType.CommandInformation, {
  provideRelatedInformation () {
    return [{
      type: vscode.RelatedInformationType.CommandInformation,
      command: 'aiSuggestedCommand',
      weight: 9999
    }]
  }
})
