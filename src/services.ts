import Severity from 'vs/base/common/severity'
import type * as vscode from 'vscode'
import type { IProgressService } from 'vs/platform/progress/common/progress'

export {
  Severity
}

export interface Window {
  createOutputChannel?(name: string): vscode.OutputChannel
  withProgress?: IProgressService['withProgress']
}

export interface Workspace {
  rootPath?: string
  workspaceFolders?: typeof vscode.workspace.workspaceFolders
  updateWorkspaceFolders?: typeof vscode.workspace.updateWorkspaceFolders
  onDidChangeWorkspaceFolders?: typeof vscode.workspace.onDidChangeWorkspaceFolders
  getConfiguration?: typeof vscode.workspace.getConfiguration
  onDidChangeConfiguration?: vscode.Event<vscode.ConfigurationChangeEvent>
  onWillSaveTextDocument?: vscode.Event<vscode.TextDocumentWillSaveEvent>
  onDidSaveTextDocument?: vscode.Event<vscode.TextDocument>
  createFileSystemWatcher?: typeof vscode.workspace.createFileSystemWatcher
}

export interface Services {
  workspace?: Workspace
  window?: Window
}

let services: Services | undefined
export namespace Services {
  export type Provider = () => Services
  export const get: Provider = () => {
    if (services == null) {
      throw new Error('Services has not been installed')
    }
    return services
  }
  export function install (_services: Services): vscode.Disposable {
    if (services != null) {
      console.warn('Services have been overridden')
    }
    services = _services

    return {
      dispose: () => {
        if (services === _services) {
          services = undefined
        }
      }
    }
  }
}
