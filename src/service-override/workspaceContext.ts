import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IWorkspace, IWorkspaceContextService, IWorkspaceFolder, WorkbenchState, WorkspaceFolder } from 'vs/platform/workspace/common/workspace'
import { Event, URI } from 'vs/workbench/workbench.web.main'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { Services } from '../services'
import { unsupported } from '../tools'

class SimpleWorkspaceContextService implements IWorkspaceContextService {
  public _serviceBrand: undefined

  public readonly onDidChangeWorkspaceName = Event.None
  public readonly onWillChangeWorkspaceFolders = Event.None
  public readonly onDidChangeWorkspaceFolders = Event.None
  public readonly onDidChangeWorkbenchState = Event.None

  getCompleteWorkspace (): Promise<IWorkspace> {
    return Promise.resolve(this.getWorkspace())
  }

  public getWorkspace (): IWorkspace {
    const workspaceFolders = Services.get().workspace?.workspaceFolders
    return {
      id: '4064f6ec-cb38-4ad0-af64-ee6467e63c82',
      folders: workspaceFolders?.map(folder => new WorkspaceFolder(folder)) ?? []
    }
  }

  public getWorkbenchState (): WorkbenchState {
    const workspaceFoldersCount = Services.get().workspace?.workspaceFolders?.length ?? 1
    if (workspaceFoldersCount === 0) {
      return WorkbenchState.EMPTY
    } else if (workspaceFoldersCount === 1) {
      return WorkbenchState.FOLDER
    } else {
      return WorkbenchState.WORKSPACE
    }
  }

  public getWorkspaceFolder (resource: URI): IWorkspaceFolder | null {
    const workspace = this.getWorkspace()
    return workspace.folders.find(folder => folder.uri.scheme === resource.scheme && resource.path.startsWith(folder.uri.path)) ?? null
  }

  public isInsideWorkspace (resource: URI): boolean {
    return this.getWorkspaceFolder(resource) != null
  }

  public isCurrentWorkspace = unsupported
}

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IWorkspaceContextService.toString()]: new SyncDescriptor(SimpleWorkspaceContextService)
  }
}
