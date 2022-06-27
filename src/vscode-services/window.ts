import Severity from 'vs/base/common/severity'
import { URI } from 'vs/base/common/uri'
import type * as vscode from 'vscode'
import { Event } from 'vs/base/common/event'
import * as extHostTypes from 'vs/workbench/api/common/extHostTypes'
import workspace from './workspace'
import { extension, getExtHostServices } from './extHost'
import { Services } from '../services'
import { unsupported } from '../tools'

const window: typeof vscode.window = {
  showInformationMessage (message: string, ...rest: Array<vscode.MessageOptions | string | vscode.MessageItem>) {
    const { extHostMessageService } = getExtHostServices()
    return extHostMessageService.showMessage(extension, Severity.Info, message, rest[0], <Array<string | vscode.MessageItem>>rest.slice(1))
  },
  showWarningMessage (message: string, ...rest: Array<vscode.MessageOptions | string | vscode.MessageItem>) {
    const { extHostMessageService } = getExtHostServices()
    return extHostMessageService.showMessage(extension, Severity.Warning, message, rest[0], <Array<string | vscode.MessageItem>>rest.slice(1))
  },
  showErrorMessage (message: string, ...rest: Array<vscode.MessageOptions | string | vscode.MessageItem>) {
    const { extHostMessageService } = getExtHostServices()
    return extHostMessageService.showMessage(extension, Severity.Error, message, rest[0], <Array<string | vscode.MessageItem>>rest.slice(1))
  },
  createOutputChannel (name: string): vscode.OutputChannel {
    const { window } = Services.get()
    const createOutputChannel = window?.createOutputChannel
    const channel: vscode.OutputChannel | undefined = createOutputChannel?.call(window, name)
    return channel ?? {
      name,
      append: () => { },
      appendLine: () => { },
      clear: unsupported,
      show: () => {},
      hide: unsupported,
      replace: unsupported,
      dispose: () => { }
    }
  },
  withScmProgress<R> (task: (progress: vscode.Progress<number>) => Thenable<R>) {
    const { extHostProgress } = getExtHostServices()
    return extHostProgress.withProgress(extension, { location: extHostTypes.ProgressLocation.SourceControl }, () => task({ report () { /* noop */ } }))
  },
  withProgress<R> (options: vscode.ProgressOptions, task: (progress: vscode.Progress<{ message?: string, worked?: number }>, token: vscode.CancellationToken) => Thenable<R>) {
    const { extHostProgress } = getExtHostServices()
    return extHostProgress.withProgress(extension, options, task)
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
    return extHostQuickOpen.createQuickPick(extension)
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showQuickPick (items: any, options?: vscode.QuickPickOptions, token?: vscode.CancellationToken): any {
    const { extHostQuickOpen } = getExtHostServices()
    return extHostQuickOpen.showQuickPick(items, options, token)
  },
  createInputBox (): vscode.InputBox {
    const { extHostQuickOpen } = getExtHostServices()
    return extHostQuickOpen.createInputBox(extension.identifier)
  },
  showInputBox (options?: vscode.InputBoxOptions, token?: vscode.CancellationToken) {
    const { extHostQuickOpen } = getExtHostServices()
    return extHostQuickOpen.showInput(options, token)
  },
  createTextEditorDecorationType: unsupported,
  showWorkspaceFolderPick: unsupported,
  showOpenDialog: unsupported,
  showSaveDialog: unsupported,
  createWebviewPanel: unsupported,
  setStatusBarMessage: unsupported,
  createStatusBarItem: unsupported,
  createTerminal: unsupported,
  registerTreeDataProvider: unsupported,
  createTreeView: unsupported,
  registerWebviewPanelSerializer: unsupported,
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
  get terminals () {
    return unsupported()
  },
  get activeTerminal () {
    return unsupported()
  },
  onDidChangeActiveTerminal: Event.None,
  onDidOpenTerminal: Event.None,
  onDidCloseTerminal: Event.None,
  get state () {
    return unsupported()
  },
  onDidChangeWindowState: Event.None,
  registerUriHandler: unsupported,
  registerWebviewViewProvider: unsupported,
  registerCustomEditorProvider: unsupported,
  registerTerminalLinkProvider: unsupported,
  get activeColorTheme () {
    return unsupported()
  },
  onDidChangeActiveColorTheme: Event.None,
  registerFileDecorationProvider: unsupported,
  registerTerminalProfileProvider: unsupported,
  onDidChangeTerminalState: Event.None,
  get tabGroups () {
    return unsupported()
  },
  showNotebookDocument: unsupported,
  visibleNotebookEditors: [],
  onDidChangeVisibleNotebookEditors: Event.None,
  activeNotebookEditor: undefined,
  onDidChangeActiveNotebookEditor: Event.None,
  onDidChangeNotebookEditorSelection: Event.None,
  onDidChangeNotebookEditorVisibleRanges: Event.None
}

export default window
