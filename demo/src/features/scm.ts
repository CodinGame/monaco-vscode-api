import type { Uri } from 'vscode'
import { ExtensionHostKind, registerExtension } from 'vscode/extensions'
import { remoteAuthority } from '../setup.common'

if (remoteAuthority == null) {
  const { getApi } = registerExtension(
    {
      name: 'scm-demo',
      publisher: 'codingame',
      engines: {
        vscode: '*'
      },
      version: '1.0.0',
      enabledApiProposals: ['scmActionButton']
    },
    ExtensionHostKind.LocalProcess,
    {
      system: true // to be able to use api proposals
    }
  )

  void getApi().then(async (vscode) => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
    if (workspaceFolder == null) {
      return
    }

    vscode.commands.registerCommand('scm-demo.click-file', async (uri: Uri) => {
      await vscode.commands.executeCommand('vscode.open', uri)
      await vscode.window.showInformationMessage(`You pressed a file! (${uri.toString()})`)
    })
    vscode.commands.registerCommand('scm-demo.commit', async () => {
      await vscode.window.showInformationMessage("You've committed!")
    })

    const scm = vscode.scm.createSourceControl(
      'demo-source-control',
      'Demo Source Control',
      workspaceFolder.uri
    )
    scm.inputBox.placeholder = 'Hello, you can write anything here!'
    scm.acceptInputCommand = {
      command: 'scm-demo.commit',
      title: 'Commit'
    }
    scm.actionButton = {
      command: {
        command: 'scm-demo.commit',
        title: 'Commit'
      },
      enabled: true
    }
    scm.count = 2

    const group = scm.createResourceGroup('working-tree', 'Working Tree')
    group.resourceStates = [
      {
        resourceUri: vscode.Uri.file('/workspace/test.js'),
        command: {
          title: 'Commit',
          command: 'scm-demo.click-file',
          arguments: [vscode.Uri.file('/workspace/test.js')]
        }
      },
      {
        resourceUri: vscode.Uri.file('/workspace/test_readonly.js'),
        command: {
          title: 'Commit',
          command: 'scm-demo.click-file',
          arguments: [vscode.Uri.file('/workspace/test_readonly.js')]
        },
        decorations: {
          strikeThrough: true,
          tooltip: 'File is read-only'
        }
      }
    ]
  })
}
