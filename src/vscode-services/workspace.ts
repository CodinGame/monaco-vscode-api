import type * as vscode from 'vscode'
import { WorkspaceEdit } from 'vs/workbench/api/common/extHostTypeConverters'
import { reviveWorkspaceEditDto2 } from 'vs/workbench/api/browser/mainThreadBulkEdits'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IBulkEditService } from 'vs/editor/browser/services/bulkEditService'
import { Event } from 'vs/base/common/event'
import { URI } from 'vs/base/common/uri'
import { extHostDocuments } from './extHost'
import { Services } from '../services'
import { unsupported } from '../tools'

class EmptyFileSystem implements vscode.FileSystem {
  isWritableFileSystem (): boolean | undefined {
    return false
  }

  stat = unsupported
  readDirectory (): Thenable<[string, vscode.FileType][]> {
    return Promise.resolve([])
  }

  createDirectory (): Thenable<void> {
    return Promise.resolve()
  }

  readFile (): Thenable<Uint8Array> {
    return Promise.resolve(new Uint8Array(0))
  }

  writeFile (): Thenable<void> {
    return Promise.resolve()
  }

  delete (): Thenable<void> {
    return Promise.resolve()
  }

  rename (): Thenable<void> {
    return Promise.resolve()
  }

  copy (): Thenable<void> {
    return Promise.resolve()
  }
}

const workspace: typeof vscode.workspace = {
  fs: new EmptyFileSystem(),
  workspaceFile: undefined,
  createFileSystemWatcher (globPattern, ignoreCreateEvents, ignoreChangeEvents, ignoreDeleteEvents): vscode.FileSystemWatcher {
    const services = Services.get()
    if (services.workspace?.createFileSystemWatcher != null) {
      return services.workspace.createFileSystemWatcher(globPattern, ignoreCreateEvents, ignoreChangeEvents, ignoreDeleteEvents)
    }
    return {
      ignoreCreateEvents: ignoreCreateEvents ?? false,
      ignoreChangeEvents: ignoreChangeEvents ?? false,
      ignoreDeleteEvents: ignoreDeleteEvents ?? false,
      onDidCreate: Event.None,
      onDidChange: Event.None,
      onDidDelete: Event.None,
      dispose: () => { }
    }
  },
  applyEdit: async (edit: vscode.WorkspaceEdit) => {
    const test = WorkspaceEdit.from(edit)
    const resourceEdits = reviveWorkspaceEditDto2(test)
    await StandaloneServices.get(IBulkEditService).apply(resourceEdits)
    return true
  },
  getConfiguration: (section, scope) => {
    const { workspace } = Services.get()
    if (workspace?.getConfiguration != null) {
      return workspace.getConfiguration(section, scope)
    }
    return {
      get: <T>(section: string, defaultValue?: T): T | undefined => {
        return defaultValue
      },
      has: () => {
        return false
      },
      inspect: unsupported,
      update: unsupported
    }
  },
  get onDidChangeConfiguration (): typeof vscode.workspace.onDidChangeConfiguration {
    const services = Services.get()
    return services.workspace?.onDidChangeConfiguration ?? Event.None
  },
  get rootPath () {
    const services = Services.get()
    return services.workspace?.rootPath
  },
  get workspaceFolders (): typeof vscode.workspace.workspaceFolders {
    const services = Services.get()
    if (services.workspace == null) {
      return undefined
    }
    if ('workspaceFolders' in services.workspace) {
      return services.workspace.workspaceFolders
    }
    const rootPath = services.workspace.rootPath
    if (rootPath == null) {
      return undefined
    }
    const uri = URI.file(rootPath)
    return [{
      uri,
      index: 0,
      name: uri.toString()
    }]
  },
  getWorkspaceFolder (uri: vscode.Uri) {
    return this.workspaceFolders?.find(folder => {
      return uri.path.startsWith(folder.uri.path)
    })
  },
  get onDidChangeWorkspaceFolders (): typeof vscode.workspace.onDidChangeWorkspaceFolders {
    const services = Services.get()
    return services.workspace?.onDidChangeWorkspaceFolders ?? Event.None
  },
  get textDocuments (): typeof vscode.workspace.textDocuments {
    return Array.from(extHostDocuments.getAllDocumentData().map(data => data.document))
  },
  get onDidOpenTextDocument (): typeof vscode.workspace.onDidOpenTextDocument {
    return extHostDocuments.onDidAddDocument
  },
  get onDidCloseTextDocument (): typeof vscode.workspace.onDidCloseTextDocument {
    return extHostDocuments.onDidRemoveDocument
  },
  get onDidChangeTextDocument (): typeof vscode.workspace.onDidChangeTextDocument {
    return extHostDocuments.onDidChangeDocument
  },
  get onWillSaveTextDocument (): typeof vscode.workspace.onWillSaveTextDocument {
    const services = Services.get()
    return services.workspace?.onWillSaveTextDocument ?? Event.None
  },
  get onDidSaveTextDocument (): typeof vscode.workspace.onDidSaveTextDocument {
    const services = Services.get()
    return services.workspace?.onDidSaveTextDocument ?? Event.None
  },
  get onWillCreateFiles (): vscode.Event<vscode.FileWillCreateEvent> {
    return Event.None
  },
  get onDidCreateFiles (): vscode.Event<vscode.FileCreateEvent> {
    return Event.None
  },
  get onWillDeleteFiles (): vscode.Event<vscode.FileWillDeleteEvent> {
    return Event.None
  },
  get onDidDeleteFiles (): vscode.Event<vscode.FileDeleteEvent> {
    return Event.None
  },

  get onWillRenameFiles (): vscode.Event<vscode.FileWillRenameEvent> {
    return Event.None
  },
  get onDidRenameFiles (): vscode.Event<vscode.FileRenameEvent> {
    return Event.None
  },
  get onDidGrantWorkspaceTrust (): vscode.Event<void> {
    return Event.None
  },
  asRelativePath: unsupported,
  updateWorkspaceFolders: unsupported,
  findFiles: unsupported,
  saveAll: unsupported,
  openTextDocument: unsupported,
  registerTextDocumentContentProvider: unsupported,
  registerTaskProvider: unsupported,
  registerFileSystemProvider: unsupported,
  openNotebookDocument: unsupported,
  registerNotebookSerializer: unsupported,
  notebookDocuments: [],
  onDidOpenNotebookDocument: unsupported,
  onDidCloseNotebookDocument: unsupported,
  isTrusted: true,
  name: undefined,
  onDidChangeNotebookDocument: unsupported,
  onDidSaveNotebookDocument: unsupported
}

export default workspace
