import { ExtensionHostKind, registerExtension } from 'vscode/extensions'

const { getApi } = registerExtension(
  {
    name: 'welcome-notifications',
    publisher: 'codingame',
    version: '1.0.0',
    engines: {
      vscode: '*'
    }
  },
  ExtensionHostKind.LocalProcess
)

void getApi().then(async (api) => {
  void api.window
    .showInformationMessage('Hello', {
      detail: 'Welcome to the monaco-vscode-api demo',
      modal: true
    })
    .then(() => {
      void api.window.showInformationMessage(
        'Try to change the settings or the configuration, the changes will be applied to all 3 editors'
      )
    })

  setTimeout(() => {
    api.workspace.onDidChangeConfiguration(() => {
      void api.window.showInformationMessage('The configuration was changed')
    })
  }, 1000)
})
