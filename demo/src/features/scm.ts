import { onExtHostInitialized, registerExtension } from 'vscode/extensions'

onExtHostInitialized(async () => {
  const { getApi } = registerExtension({
    name: 'scm-demo',
    publisher: 'codingame',
    engines: {
      vscode: '*'
    },
    version: '1.0.0',
    enabledApiProposals: ['scmActionButton']
  }, 1)

  const vscode = await getApi()

  const workspaceFolder = vscode.workspace.workspaceFolders![0]
  if (workspaceFolder == null) {
    throw new Error('No workspace folder')
  }

  vscode.commands.registerCommand('scm-demo.click-file', async () => {
    await vscode.window.showInformationMessage('You pressed a file!')
  })
  vscode.commands.registerCommand('scm-demo.commit', async () => {
    await vscode.window.showInformationMessage("You've committed!")
  })

  const scm = vscode.scm.createSourceControl('demo-source-control', 'Demo Source Control', workspaceFolder.uri)
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
  group.resourceStates = [{
    resourceUri: vscode.Uri.file('/tmp/test.js'),
    command: {
      title: 'Commit',
      command: 'scm-demo.click-file'
    }
  }, {
    resourceUri: vscode.Uri.file('/tmp/test_readonly.js'),
    command: {
      title: 'Commit',
      command: 'scm-demo.click-file'
    },
    decorations: {
      strikeThrough: true,
      tooltip: 'File is read-only'
    }
  }]
})
