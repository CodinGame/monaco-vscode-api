import Severity from 'vs/base/common/severity'
import type { EvaluatableExpressionProvider } from 'vs/editor/common/languages'
import type { CallHierarchyProvider } from 'vs/workbench/contrib/callHierarchy/common/callHierarchy'
import type { TypeHierarchyProvider } from 'vs/workbench/contrib/typeHierarchy/common/typeHierarchy'
import type { IWorkspaceSymbolProvider } from 'vs/workbench/contrib/search/common/search'
import type * as vscode from 'vscode'

// Need to rename it because vscode already exports those name with different types
export {
  EvaluatableExpressionProvider,
  CallHierarchyProvider,
  TypeHierarchyProvider,
  IWorkspaceSymbolProvider,
  Severity
}

export interface Languages {
  registerTypeHierarchyProvider?(documentSelector: vscode.DocumentSelector, provider: TypeHierarchyProvider): vscode.Disposable
  registerCallHierarchyProvider?(documentSelector: vscode.DocumentSelector, provider: CallHierarchyProvider): vscode.Disposable
  registerEvaluatableExpressionProvider?(documentSelector: vscode.DocumentSelector, provider: EvaluatableExpressionProvider): vscode.Disposable
  registerNavigateTypeSupport?(provider: IWorkspaceSymbolProvider): vscode.Disposable
}

export interface Window {
  showMessage<T extends vscode.MessageOptions | string | vscode.MessageItem>(type: Severity, message: string, ...rest: T[]): PromiseLike<T | undefined>
  createOutputChannel?(name: string): vscode.OutputChannel
  withProgress?: typeof vscode.window.withProgress
  showTextDocument?(document: vscode.Uri, options?: vscode.TextDocumentShowOptions): PromiseLike<void>
}

export interface Workspace {
  rootPath?: string
  workspaceFolders?: typeof vscode.workspace.workspaceFolders
  onDidChangeWorkspaceFolders?: typeof vscode.workspace.onDidChangeWorkspaceFolders
  getConfiguration?: typeof vscode.workspace.getConfiguration
  onDidChangeConfiguration?: vscode.Event<vscode.ConfigurationChangeEvent>
  onWillSaveTextDocument?: vscode.Event<vscode.TextDocumentWillSaveEvent>
  onDidSaveTextDocument?: vscode.Event<vscode.TextDocument>
  createFileSystemWatcher?: typeof vscode.workspace.createFileSystemWatcher
}

export interface Env {
  openExternal?(document: vscode.Uri): PromiseLike<boolean>
}

export interface Services {
  workspace?: Workspace
  window?: Window
  env?: Env
  languages?: Languages
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
