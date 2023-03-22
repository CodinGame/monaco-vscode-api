import type * as vscode from 'vscode'
import { Event } from 'vs/base/common/event'
import { URI } from 'vs/base/common/uri'
import { combinedDisposable } from 'vs/base/common/lifecycle'
import { IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { getExtHostServices } from './extHost'
import { unsupported } from '../tools'
import { Services } from '../services'

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

export default function create (getExtension: () => IExtensionDescription): typeof vscode.workspace {
  return {
    fs: new EmptyFileSystem(),
    workspaceFile: undefined,
    createFileSystemWatcher (globPattern, ignoreCreateEvents, ignoreChangeEvents, ignoreDeleteEvents): vscode.FileSystemWatcher {
      const { workspace } = Services.get()
      if (workspace?.createFileSystemWatcher != null) {
        return workspace.createFileSystemWatcher(globPattern, ignoreCreateEvents, ignoreChangeEvents, ignoreDeleteEvents)
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
    applyEdit: async (edit: vscode.WorkspaceEdit, metadata?: vscode.WorkspaceEditMetadata) => {
      const { extHostBulkEdits } = getExtHostServices()

      return extHostBulkEdits.applyWorkspaceEdit(edit, getExtension(), metadata)
    },
    getConfiguration: (section, scope) => {
      const { extHostConfiguration } = getExtHostServices()

      const configProvider = extHostConfiguration.getConfigProviderSync()
      return configProvider.getConfiguration(section, scope, getExtension())
    },
    onDidChangeConfiguration (listener, thisArgs, disposables) {
      const { extHostConfiguration } = getExtHostServices()

      const configProvider = extHostConfiguration.getConfigProviderSync()
      return configProvider.onDidChangeConfiguration(listener, thisArgs, disposables)
    },
    get rootPath () {
      const { workspace } = Services.get()
      return workspace?.rootPath
    },
    get workspaceFolders (): typeof vscode.workspace.workspaceFolders {
      const { workspace } = Services.get()
      if (workspace == null) {
        return undefined
      }
      if ('workspaceFolders' in workspace) {
        return workspace.workspaceFolders
      }
      const rootPath = workspace.rootPath
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
      const { workspace } = Services.get()
      return workspace?.onDidChangeWorkspaceFolders ?? Event.None
    },
    get textDocuments (): typeof vscode.workspace.textDocuments {
      const { extHostDocuments } = getExtHostServices()
      return Array.from(extHostDocuments.getAllDocumentData().map(data => data.document))
    },
    get onDidOpenTextDocument (): typeof vscode.workspace.onDidOpenTextDocument {
      const { extHostDocuments } = getExtHostServices()
      return extHostDocuments.onDidAddDocument
    },
    get onDidCloseTextDocument (): typeof vscode.workspace.onDidCloseTextDocument {
      const { extHostDocuments } = getExtHostServices()
      return extHostDocuments.onDidRemoveDocument
    },
    get onDidChangeTextDocument (): typeof vscode.workspace.onDidChangeTextDocument {
      const { extHostDocuments } = getExtHostServices()
      return extHostDocuments.onDidChangeDocument
    },
    get onWillSaveTextDocument (): typeof vscode.workspace.onWillSaveTextDocument {
      const { workspace } = Services.get()
      return workspace?.onWillSaveTextDocument ?? Event.None
    },
    get onDidSaveTextDocument (): typeof vscode.workspace.onDidSaveTextDocument {
      const { workspace } = Services.get()
      return workspace?.onDidSaveTextDocument ?? Event.None
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
    updateWorkspaceFolders (start: number, deleteCount: number | undefined | null, ...workspaceFoldersToAdd: { readonly uri: vscode.Uri, readonly name?: string }[]): boolean {
      const { workspace } = Services.get()
      if (workspace?.updateWorkspaceFolders != null) {
        return workspace.updateWorkspaceFolders(start, deleteCount, ...workspaceFoldersToAdd)
      }
      return false
    },
    findFiles: unsupported,
    saveAll: unsupported,
    openTextDocument (uriOrFileNameOrOptions?: vscode.Uri | string | { language?: string, content?: string }) {
      const { extHostDocuments } = getExtHostServices()
      let uriPromise: Thenable<URI>

      const options = uriOrFileNameOrOptions as { language?: string, content?: string }
      if (typeof uriOrFileNameOrOptions === 'string') {
        uriPromise = Promise.resolve(URI.file(uriOrFileNameOrOptions))
      } else if (URI.isUri(uriOrFileNameOrOptions)) {
        uriPromise = Promise.resolve(uriOrFileNameOrOptions)
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } else if (options == null || typeof options === 'object') {
        uriPromise = extHostDocuments.createDocumentData(options)
      } else {
        throw new Error('illegal argument - uriOrFileNameOrOptions')
      }

      return uriPromise.then(uri => {
        return extHostDocuments.ensureDocumentData(uri).then(documentData => {
          return documentData.document
        })
      })
    },
    registerTextDocumentContentProvider (scheme: string, provider: vscode.TextDocumentContentProvider) {
      const { extHostDocumentContentProviders } = getExtHostServices()
      return extHostDocumentContentProviders.registerTextDocumentContentProvider(scheme, provider)
    },
    registerTaskProvider: unsupported,
    registerFileSystemProvider (scheme, provider, options) {
      const { extHostFileSystem, extHostConsumerFileSystem } = getExtHostServices()
      const extension = getExtension()

      return combinedDisposable(
        extHostFileSystem.registerFileSystemProvider(extension, scheme, provider, options),
        extHostConsumerFileSystem.addFileSystemProvider(scheme, provider)
      )
    },
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
}
