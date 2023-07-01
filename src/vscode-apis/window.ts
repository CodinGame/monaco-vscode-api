/// <reference path="../../vscode.proposed.externalUriOpener.d.ts" />

import Severity from 'vs/base/common/severity'
import { URI } from 'vs/base/common/uri'
import type * as vscode from 'vscode'
import { Event } from 'vs/base/common/event'
import * as extHostTypes from 'vs/workbench/api/common/extHostTypes'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IModelService } from 'vs/editor/common/services/model'
import { ITextModel } from 'vs/editor/common/model'
import { IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { checkProposedApiEnabled } from 'vs/workbench/services/extensions/common/extensions'
import { getExtHostServices } from '../extHost'
import { unsupported } from '../tools'

class TextTabInput {
  constructor (readonly uri: URI) { }
}

function getTabFromModel (model: ITextModel, tabGroup: vscode.TabGroup): vscode.Tab {
  return {
    label: model.uri.fsPath,
    group: tabGroup,
    get isActive () { return model.isAttachedToEditor() },
    isDirty: false,
    isPinned: false,
    isPreview: false,
    input: new TextTabInput(model.uri)
  }
}

const tabGroup: vscode.TabGroup = {
  isActive: true,
  activeTab: undefined,
  viewColumn: extHostTypes.ViewColumn.One,
  get tabs () {
    const modelService = StandaloneServices.get(IModelService)
    return modelService.getModels().map(model => getTabFromModel(model, tabGroup))
  }
}

export default function create (getExtension: () => IExtensionDescription, workspace: typeof vscode.workspace): typeof vscode.window {
  return {
    showInformationMessage (message: string, ...rest: Array<vscode.MessageOptions | string | vscode.MessageItem>) {
      const { extHostMessageService } = getExtHostServices()
      return extHostMessageService.showMessage(getExtension(), Severity.Info, message, rest[0], <Array<string | vscode.MessageItem>>rest.slice(1))
    },
    showWarningMessage (message: string, ...rest: Array<vscode.MessageOptions | string | vscode.MessageItem>) {
      const { extHostMessageService } = getExtHostServices()
      return extHostMessageService.showMessage(getExtension(), Severity.Warning, message, rest[0], <Array<string | vscode.MessageItem>>rest.slice(1))
    },
    showErrorMessage (message: string, ...rest: Array<vscode.MessageOptions | string | vscode.MessageItem>) {
      const { extHostMessageService } = getExtHostServices()
      return extHostMessageService.showMessage(getExtension(), Severity.Error, message, rest[0], <Array<string | vscode.MessageItem>>rest.slice(1))
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createOutputChannel (name: string, options: string | { log: true } | undefined): any {
      const { extHostOutputService } = getExtHostServices()
      return extHostOutputService.createOutputChannel(name, options, getExtension())
    },
    withScmProgress<R> (task: (progress: vscode.Progress<number>) => Thenable<R>) {
      const { extHostProgress } = getExtHostServices()
      return extHostProgress.withProgress(getExtension(), { location: extHostTypes.ProgressLocation.SourceControl }, () => task({ report () { } }))
    },
    withProgress<R> (options: vscode.ProgressOptions, task: (progress: vscode.Progress<{ message?: string, worked?: number} >, token: vscode.CancellationToken) => Thenable<R>) {
      const { extHostProgress } = getExtHostServices()
      return extHostProgress.withProgress(getExtension(), options, task)
    },
    showTextDocument: async (documentOrUri: vscode.TextDocument | vscode.Uri, columnOrOptions?: vscode.ViewColumn | vscode.TextDocumentShowOptions, preserveFocus?: boolean) => {
      const { extHostEditors } = getExtHostServices()
      const document = await (URI.isUri(documentOrUri)
        ? Promise.resolve(workspace.openTextDocument(documentOrUri))
        : Promise.resolve(<vscode.TextDocument>documentOrUri))

      return extHostEditors.showTextDocument(document, columnOrOptions, preserveFocus)
    },
    createQuickPick<T extends vscode.QuickPickItem> (): vscode.QuickPick<T> {
      const { extHostQuickOpen } = getExtHostServices()
      return extHostQuickOpen.createQuickPick(getExtension())
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    showQuickPick (items: any, options?: vscode.QuickPickOptions, token?: vscode.CancellationToken): any {
      const { extHostQuickOpen } = getExtHostServices()
      const extension = getExtension()
      return extHostQuickOpen.showQuickPick(extension, items, options, token)
    },
    createInputBox (): vscode.InputBox {
      const { extHostQuickOpen } = getExtHostServices()
      const extension = getExtension()
      return extHostQuickOpen.createInputBox(extension)
    },
    showInputBox (options?: vscode.InputBoxOptions, token?: vscode.CancellationToken) {
      const { extHostQuickOpen } = getExtHostServices()
      return extHostQuickOpen.showInput(options, token)
    },
    createTextEditorDecorationType (options: vscode.DecorationRenderOptions): vscode.TextEditorDecorationType {
      const { extHostEditors } = getExtHostServices()
      const extension = getExtension()
      return extHostEditors.createTextEditorDecorationType(extension, options)
    },
    showWorkspaceFolderPick (options?: vscode.WorkspaceFolderPickOptions) {
      const { extHostQuickOpen } = getExtHostServices()
      return extHostQuickOpen.showWorkspaceFolderPick(options)
    },
    showOpenDialog (options) {
      const extension = getExtension()
      const { extHostDialogs } = getExtHostServices()
      return extHostDialogs.showOpenDialog(extension, options)
    },
    showSaveDialog (options) {
      const { extHostDialogs } = getExtHostServices()
      return extHostDialogs.showSaveDialog(options)
    },
    createWebviewPanel (viewType: string, title: string, showOptions: vscode.ViewColumn | { viewColumn: vscode.ViewColumn, preserveFocus?: boolean }, options?: vscode.WebviewPanelOptions & vscode.WebviewOptions): vscode.WebviewPanel {
      const extension = getExtension()
      const { extHostWebviewPanels } = getExtHostServices()
      return extHostWebviewPanels.createWebviewPanel(extension, viewType, title, showOptions, options)
    },
    createStatusBarItem (alignmentOrId?: vscode.StatusBarAlignment | string, priorityOrAlignment?: number | vscode.StatusBarAlignment, priorityArg?: number): vscode.StatusBarItem {
      const { extHostStatusBar } = getExtHostServices()
      const extension = getExtension()
      let id: string | undefined
      let alignment: number | undefined
      let priority: number | undefined

      if (typeof alignmentOrId === 'string') {
        id = alignmentOrId
        alignment = priorityOrAlignment
        priority = priorityArg
      } else {
        alignment = alignmentOrId
        priority = priorityOrAlignment
      }

      return extHostStatusBar.createStatusBarEntry(extension, id, alignment, priority)
    },
    setStatusBarMessage (text: string, timeoutOrThenable?: number | Thenable<unknown>): vscode.Disposable {
      const { extHostStatusBar } = getExtHostServices()

      return extHostStatusBar.setStatusBarMessage(text, timeoutOrThenable)
    },
    createTerminal (nameOrOptions?: vscode.TerminalOptions | vscode.ExtensionTerminalOptions | string, shellPath?: string, shellArgs?: readonly string[] | string): vscode.Terminal {
      const { extHostTerminalService } = getExtHostServices()
      if (typeof nameOrOptions === 'object') {
        if ('pty' in nameOrOptions) {
          return extHostTerminalService.createExtensionTerminal(nameOrOptions)
        }
        return extHostTerminalService.createTerminalFromOptions(nameOrOptions)
      }
      return extHostTerminalService.createTerminal(nameOrOptions, shellPath, shellArgs)
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerTreeDataProvider (viewId: string, treeDataProvider: vscode.TreeDataProvider<any>): vscode.Disposable {
      const { extHostTreeViews } = getExtHostServices()
      const extension = getExtension()
      return extHostTreeViews.registerTreeDataProvider(viewId, treeDataProvider, extension)
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createTreeView (viewId: string, options: { treeDataProvider: vscode.TreeDataProvider<any> }): vscode.TreeView<any> {
      const { extHostTreeViews } = getExtHostServices()
      const extension = getExtension()
      return extHostTreeViews.createTreeView(viewId, options, extension)
    },
    registerWebviewPanelSerializer: (viewType: string, serializer: vscode.WebviewPanelSerializer) => {
      const extension = getExtension()
      const { extHostWebviewPanels } = getExtHostServices()
      return extHostWebviewPanels.registerWebviewPanelSerializer(extension, viewType, serializer)
    },
    get activeTextEditor () {
      const { extHostEditors } = getExtHostServices()
      return extHostEditors.getActiveTextEditor()
    },
    get visibleTextEditors () {
      const { extHostEditors } = getExtHostServices()
      return extHostEditors.getVisibleTextEditors()
    },
    onDidChangeActiveTextEditor (listener, thisArg?, disposables?) {
      const { extHostEditors } = getExtHostServices()
      return extHostEditors.onDidChangeActiveTextEditor(listener, thisArg, disposables)
    },
    onDidChangeVisibleTextEditors (listener, thisArg, disposables) {
      const { extHostEditors } = getExtHostServices()
      return extHostEditors.onDidChangeVisibleTextEditors(listener, thisArg, disposables)
    },
    onDidChangeTextEditorSelection (listener, thisArgs, disposables) {
      const { extHostEditors } = getExtHostServices()
      return extHostEditors.onDidChangeTextEditorSelection(listener, thisArgs, disposables)
    },
    onDidChangeTextEditorVisibleRanges (listener, thisArgs, disposables) {
      const { extHostEditors } = getExtHostServices()
      return extHostEditors.onDidChangeTextEditorVisibleRanges(listener, thisArgs, disposables)
    },
    onDidChangeTextEditorOptions (listener, thisArgs, disposables) {
      const { extHostEditors } = getExtHostServices()
      return extHostEditors.onDidChangeTextEditorOptions(listener, thisArgs, disposables)
    },
    onDidChangeTextEditorViewColumn (listener, thisArg?, disposables?) {
      const { extHostEditors } = getExtHostServices()
      return extHostEditors.onDidChangeTextEditorViewColumn(listener, thisArg, disposables)
    },
    get activeTerminal () {
      const { extHostTerminalService } = getExtHostServices()
      return extHostTerminalService.activeTerminal
    },
    get terminals () {
      const { extHostTerminalService } = getExtHostServices()
      return extHostTerminalService.terminals
    },
    onDidChangeActiveTerminal (listener, thisArg?, disposables?) {
      const { extHostTerminalService } = getExtHostServices()
      return extHostTerminalService.onDidChangeActiveTerminal(listener, thisArg, disposables)
    },
    onDidCloseTerminal (listener, thisArg?, disposables?) {
      const { extHostTerminalService } = getExtHostServices()
      return extHostTerminalService.onDidCloseTerminal(listener, thisArg, disposables)
    },
    onDidOpenTerminal (listener, thisArg?, disposables?) {
      const { extHostTerminalService } = getExtHostServices()
      return extHostTerminalService.onDidOpenTerminal(listener, thisArg, disposables)
    },
    get state () {
      const { extHostWindow } = getExtHostServices()
      const extension = getExtension()
      return extHostWindow.getState(extension)
    },
    onDidChangeWindowState (listener, thisArg?, disposables?) {
      const { extHostWindow } = getExtHostServices()
      return extHostWindow.onDidChangeWindowState(listener, thisArg, disposables)
    },
    registerUriHandler: unsupported,
    registerWebviewViewProvider (viewId: string, provider: vscode.WebviewViewProvider, options?: {
      webviewOptions?: {
        retainContextWhenHidden?: boolean
      }
    }) {
      const extension = getExtension()
      const { extHostWebviewViews } = getExtHostServices()
      return extHostWebviewViews.registerWebviewViewProvider(extension, viewId, provider, options?.webviewOptions)
    },
    registerCustomEditorProvider: (viewType: string, provider: vscode.CustomTextEditorProvider | vscode.CustomReadonlyEditorProvider, options: { webviewOptions?: vscode.WebviewPanelOptions, supportsMultipleEditorsPerDocument?: boolean } = {}) => {
      const extension = getExtension()
      const { extHostCustomEditors } = getExtHostServices()
      return extHostCustomEditors.registerCustomEditorProvider(extension, viewType, provider, options)
    },
    registerTerminalLinkProvider (provider: vscode.TerminalLinkProvider): vscode.Disposable {
      const { extHostTerminalService } = getExtHostServices()
      return extHostTerminalService.registerLinkProvider(provider)
    },
    get activeColorTheme (): vscode.ColorTheme {
      const { extHostTheming } = getExtHostServices()
      return extHostTheming.activeColorTheme
    },
    onDidChangeActiveColorTheme (listener, thisArg?, disposables?) {
      const { extHostTheming } = getExtHostServices()
      return extHostTheming.onDidChangeActiveColorTheme(listener, thisArg, disposables)
    },
    registerFileDecorationProvider (provider: vscode.FileDecorationProvider) {
      const { extHostDecorations } = getExtHostServices()
      const extension = getExtension()
      return extHostDecorations.registerFileDecorationProvider(provider, extension)
    },
    registerTerminalProfileProvider (id: string, provider: vscode.TerminalProfileProvider): vscode.Disposable {
      const { extHostTerminalService } = getExtHostServices()
      const extension = getExtension()
      return extHostTerminalService.registerProfileProvider(extension, id, provider)
    },
    onDidChangeTerminalState (listener, thisArg?, disposables?) {
      const { extHostTerminalService } = getExtHostServices()
      return extHostTerminalService.onDidChangeTerminalState(listener, thisArg, disposables)
    },
    get tabGroups (): vscode.TabGroups {
      const { extHostEditorTabs } = getExtHostServices()
      return extHostEditorTabs.tabGroups
    },
    showNotebookDocument: unsupported,
    registerExternalUriOpener (id: string, opener: vscode.ExternalUriOpener, metadata: vscode.ExternalUriOpenerMetadata) {
      const extension = getExtension()
      const { extHostUriOpeners } = getExtHostServices()
      checkProposedApiEnabled(extension, 'externalUriOpener')
      return extHostUriOpeners.registerExternalUriOpener(extension.identifier, id, opener, metadata)
    },
    visibleNotebookEditors: [],
    onDidChangeVisibleNotebookEditors: Event.None,
    activeNotebookEditor: undefined,
    onDidChangeActiveNotebookEditor: Event.None,
    onDidChangeNotebookEditorSelection: Event.None,
    onDidChangeNotebookEditorVisibleRanges: Event.None
  }
}

export {
  TextTabInput
}
