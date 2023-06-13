import * as vscode from 'vscode'
import { onExtHostInitialized } from 'vscode/extensions'

await new Promise<void>(resolve => onExtHostInitialized(resolve))

const fakeOutputChannel = vscode.window.createOutputChannel('Fake output')
const anotherFakeOutputChannel = vscode.window.createOutputChannel('Your code', 'javascript')

fakeOutputChannel.append('Here\'s some fake output\n')
setInterval(() => {
  fakeOutputChannel.append('Hello world\n')
}, 1000)

export { anotherFakeOutputChannel }
