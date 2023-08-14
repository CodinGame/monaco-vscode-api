import { ExtensionHostKind, onExtHostInitialized, registerExtension } from 'vscode/extensions'

await new Promise<void>(resolve => onExtHostInitialized(resolve))

const { getApi } = registerExtension({
  name: 'outputDemo',
  publisher: 'codingame',
  version: '1.0.0',
  engines: {
    vscode: '*'
  }
}, ExtensionHostKind.LocalProcess)

const vscode = await getApi()
const fakeOutputChannel = vscode.window.createOutputChannel('Fake output')
const anotherFakeOutputChannel = vscode.window.createOutputChannel('Your code', 'javascript')

fakeOutputChannel.append('Here\'s some fake output\n')
setInterval(() => {
  fakeOutputChannel.append('Hello world\n')
}, 1000)

export { anotherFakeOutputChannel }
