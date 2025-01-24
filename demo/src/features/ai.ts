import { ExtensionHostKind, registerExtension } from '@codingame/monaco-vscode-api/extensions'

const { getApi } = registerExtension(
  {
    name: 'aiDemo',
    publisher: 'codingame',
    version: '1.0.0',
    engines: {
      vscode: '*'
    },
    contributes: {
      commands: [
        {
          command: 'aiSuggestedCommand',
          title: 'This is a command suggested by the AI'
        }
      ]
    },
    enabledApiProposals: ['aiRelatedInformation']
  },
  ExtensionHostKind.LocalProcess,
  {
    system: true // to be able to use api proposals
  }
)

void getApi().then(async (vscode) => {
  vscode.commands.registerCommand('aiSuggestedCommand', () => {
    void vscode.window.showInformationMessage('Hello', {
      detail: 'You just run the AI suggested command',
      modal: true
    })
  })
  vscode.ai.registerRelatedInformationProvider(vscode.RelatedInformationType.CommandInformation, {
    provideRelatedInformation() {
      return [
        {
          type: vscode.RelatedInformationType.CommandInformation,
          command: 'aiSuggestedCommand',
          weight: 9999
        }
      ]
    }
  })
})
