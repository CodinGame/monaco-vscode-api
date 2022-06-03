import type * as vscode from 'vscode'
import { extensionDescription, extHostCommands } from './extHost'
import { unsupported } from '../tools'

const commands: typeof vscode.commands = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerCommand (id: string, command: <T>(...args: any[]) => T | Thenable<T>, thisArgs?: any): vscode.Disposable {
    return extHostCommands.registerCommand(true, id, command, thisArgs, undefined, extensionDescription)
  },
  registerTextEditorCommand: unsupported,
  executeCommand<T> (id: string, ...args: any[]): Thenable<T> {
    return extHostCommands.executeCommand<T>(id, ...args)
  },
  getCommands (filterInternal: boolean = false): Thenable<string[]> {
    return extHostCommands.getCommands(filterInternal)
  }
}

export default commands
