/// <reference path="../../vscode.proposed.fileSearchProvider.d.ts" />
/// <reference path="../../vscode.proposed.textSearchProvider.d.ts" />
import type * as vscode from 'vscode'
import { URI } from 'vs/base/common/uri'
import { combinedDisposable } from 'vs/base/common/lifecycle'
import { IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { Event } from 'vs/base/common/event'
import { checkProposedApiEnabled } from 'vs/workbench/services/extensions/common/extensions'
import { getConfigProvider, getExtHostServices } from '../ext-host/extHost'
import { unsupported } from '../tools'

export default function create (getExtension: () => IExtensionDescription): typeof vscode.workspace {
  return {
    get fs () {
      const { extHostConsumerFileSystem } = getExtHostServices()
      return extHostConsumerFileSystem.value
    },
    registerFileSearchProvider: (scheme: string, provider: vscode.FileSearchProvider) => {
      const { extHostSearch } = getExtHostServices()
      const extension = getExtension()
      checkProposedApiEnabled(extension, 'fileSearchProvider')
      return extHostSearch.registerFileSearchProvider(scheme, provider)
    },
    registerTextSearchProvider: (scheme: string, provider: vscode.TextSearchProvider) => {
      const { extHostSearch } = getExtHostServices()
      const extension = getExtension()
      checkProposedApiEnabled(extension, 'textSearchProvider')
      return extHostSearch.registerTextSearchProvider(scheme, provider)
    },
    get workspaceFile () {
      const { extHostWorkspace } = getExtHostServices()
      return extHostWorkspace.workspaceFile
    },
    createFileSystemWatcher (pattern, ignoreCreate, ignoreChange, ignoreDelete): vscode.FileSystemWatcher {
      const { extHostFileSystemEvent, extHostWorkspace } = getExtHostServices()
      return extHostFileSystemEvent.createFileSystemWatcher(extHostWorkspace, getExtension(), pattern, ignoreCreate, ignoreChange, ignoreDelete)
    },
    applyEdit: async (edit: vscode.WorkspaceEdit, metadata?: vscode.WorkspaceEditMetadata) => {
      const { extHostBulkEdits } = getExtHostServices()

      return extHostBulkEdits.applyWorkspaceEdit(edit, getExtension(), metadata)
    },
    getConfiguration: (section, scope) => {
      const configProvider = getConfigProvider()

      return configProvider.getConfiguration(section, scope, getExtension())
    },
    onDidChangeConfiguration (listener, thisArgs, disposables) {
      const configProvider = getConfigProvider()

      return configProvider.onDidChangeConfiguration(listener, thisArgs, disposables)
    },
    get rootPath () {
      const { extHostWorkspace } = getExtHostServices()

      return extHostWorkspace.getPath()
    },
    get workspaceFolders (): typeof vscode.workspace.workspaceFolders {
      const { extHostWorkspace } = getExtHostServices()

      return extHostWorkspace.getWorkspaceFolders()
    },
    getWorkspaceFolder (resource: vscode.Uri) {
      const { extHostWorkspace } = getExtHostServices()

      return extHostWorkspace.getWorkspaceFolder(resource)
    },
    onDidChangeWorkspaceFolders: function (listener, thisArgs?, disposables?) {
      const { extHostWorkspace } = getExtHostServices()

      return extHostWorkspace.onDidChangeWorkspace(listener, thisArgs, disposables)
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
    onDidSaveTextDocument: (listener, thisArgs?, disposables?) => {
      const { extHostDocuments } = getExtHostServices()
      return extHostDocuments.onDidSaveDocument(listener, thisArgs, disposables)
    },
    onWillSaveTextDocument: (listener, thisArgs?, disposables?) => {
      const { extHostDocumentSaveParticipant } = getExtHostServices()
      return extHostDocumentSaveParticipant.getOnWillSaveTextDocumentEvent(getExtension())(listener, thisArgs, disposables)
    },
    onDidCreateFiles: (listener, thisArg, disposables) => {
      const { extHostFileSystemEvent } = getExtHostServices()
      return extHostFileSystemEvent.onDidCreateFile(listener, thisArg, disposables)
    },
    onDidDeleteFiles: (listener, thisArg, disposables) => {
      const { extHostFileSystemEvent } = getExtHostServices()
      return extHostFileSystemEvent.onDidDeleteFile(listener, thisArg, disposables)
    },
    onDidRenameFiles: (listener, thisArg, disposables) => {
      const { extHostFileSystemEvent } = getExtHostServices()
      return extHostFileSystemEvent.onDidRenameFile(listener, thisArg, disposables)
    },
    onWillCreateFiles: (listener: (e: vscode.FileWillCreateEvent) => unknown, thisArg?: unknown, disposables?: vscode.Disposable[]) => {
      const { extHostFileSystemEvent } = getExtHostServices()
      return extHostFileSystemEvent.getOnWillCreateFileEvent(getExtension())(listener, thisArg, disposables)
    },
    onWillDeleteFiles: (listener: (e: vscode.FileWillDeleteEvent) => unknown, thisArg?: unknown, disposables?: vscode.Disposable[]) => {
      const { extHostFileSystemEvent } = getExtHostServices()
      return extHostFileSystemEvent.getOnWillDeleteFileEvent(getExtension())(listener, thisArg, disposables)
    },
    onWillRenameFiles: (listener: (e: vscode.FileWillRenameEvent) => unknown, thisArg?: unknown, disposables?: vscode.Disposable[]) => {
      const { extHostFileSystemEvent } = getExtHostServices()
      return extHostFileSystemEvent.getOnWillRenameFileEvent(getExtension())(listener, thisArg, disposables)
    },
    onDidGrantWorkspaceTrust: (listener, thisArgs?, disposables?) => {
      const { extHostWorkspace } = getExtHostServices()
      return extHostWorkspace.onDidGrantWorkspaceTrust(listener, thisArgs, disposables)
    },
    asRelativePath: (pathOrUri, includeWorkspace?) => {
      const { extHostWorkspace } = getExtHostServices()
      return extHostWorkspace.getRelativePath(pathOrUri, includeWorkspace)
    },
    findFiles: (include, exclude, maxResults?, token?) => {
      const { extHostWorkspace } = getExtHostServices()
      return extHostWorkspace.findFiles(include, exclude, maxResults, getExtension().identifier, token)
    },
    saveAll: (includeUntitled?) => {
      const { extHostWorkspace } = getExtHostServices()
      return extHostWorkspace.saveAll(includeUntitled)
    },
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
    get textDocuments (): typeof vscode.workspace.textDocuments {
      const { extHostDocuments } = getExtHostServices()
      return Array.from(extHostDocuments.getAllDocumentData().map(data => data.document))
    },
    updateWorkspaceFolders (index, deleteCount, ...workspaceFoldersToAdd): boolean {
      const { extHostWorkspace } = getExtHostServices()
      return extHostWorkspace.updateWorkspaceFolders(getExtension(), index, deleteCount ?? 0, ...workspaceFoldersToAdd)
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
    onDidOpenNotebookDocument: Event.None,
    onDidCloseNotebookDocument: Event.None,
    get isTrusted () {
      const { extHostWorkspace } = getExtHostServices()
      return extHostWorkspace.trusted
    },
    get name () {
      const { extHostWorkspace } = getExtHostServices()
      return extHostWorkspace.name
    },
    onDidChangeNotebookDocument: Event.None,
    onDidSaveNotebookDocument: Event.None,
    onWillSaveNotebookDocument: Event.None
  }
}
