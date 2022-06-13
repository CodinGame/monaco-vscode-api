import { CancellationTokenSource } from 'vs/base/common/cancellation'
import Severity from 'vs/base/common/severity'
import { URI } from 'vs/base/common/uri'
import type * as vscode from 'vscode'
import { Event } from 'vs/base/common/event'
import { Services } from '../services'
import { unsupported } from '../tools'

function showMessage<T extends vscode.MessageOptions | string | vscode.MessageItem> (type: Severity, message: string, ...rest: T[]): Thenable<T | undefined> {
  const { window } = Services.get()
  if (window == null) {
    return Promise.resolve(undefined)
  }
  return window.showMessage(type, message, ...rest)
}

const window: typeof vscode.window = {
  showInformationMessage: showMessage.bind(undefined, Severity.Info),
  showWarningMessage: showMessage.bind(undefined, Severity.Warning),
  showErrorMessage: showMessage.bind(undefined, Severity.Error),
  createOutputChannel (name: string): vscode.OutputChannel {
    const { window } = Services.get()
    const createOutputChannel = (window != null) ? window.createOutputChannel : undefined
    const channel: vscode.OutputChannel | undefined = (createOutputChannel != null) ? createOutputChannel.bind(window)(name) : undefined
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
  withProgress: (options, task) => {
    const { window } = Services.get()
    if ((window != null) && (window.withProgress != null)) {
      return window.withProgress(options, task)
    }
    return task({ report: () => { } }, new CancellationTokenSource().token)
  },
  showTextDocument: async (textDocumentOrUri: vscode.TextDocument | URI, columnOrOptions: vscode.ViewColumn | vscode.TextDocumentShowOptions | undefined, preserveFocus?: boolean) => {
    const { window } = Services.get()
    let options: vscode.TextDocumentShowOptions | undefined
    if (typeof columnOrOptions === 'number') {
      options = {
        viewColumn: columnOrOptions,
        preserveFocus
      }
    } else {
      options = columnOrOptions
    }

    if ((window != null) && (window.showTextDocument != null)) {
      await window.showTextDocument(URI.isUri(textDocumentOrUri) ? textDocumentOrUri : textDocumentOrUri.uri, options)
    }
    // The language client doesn't use the return value of this method
    return undefined as unknown as vscode.TextEditor
  },
  createTextEditorDecorationType: unsupported,
  showQuickPick: unsupported,
  showWorkspaceFolderPick: unsupported,
  showOpenDialog: unsupported,
  showSaveDialog: unsupported,
  showInputBox: unsupported,
  createWebviewPanel: unsupported,
  setStatusBarMessage: unsupported,
  withScmProgress: unsupported,
  createStatusBarItem: unsupported,
  createTerminal: unsupported,
  registerTreeDataProvider: unsupported,
  createTreeView: unsupported,
  registerWebviewPanelSerializer: unsupported,
  get activeTextEditor () {
    return unsupported()
  },
  get visibleTextEditors () {
    return unsupported()
  },
  onDidChangeActiveTextEditor: Event.None,
  onDidChangeVisibleTextEditors: Event.None,
  onDidChangeTextEditorSelection: Event.None,
  onDidChangeTextEditorVisibleRanges: Event.None,
  onDidChangeTextEditorOptions: Event.None,
  onDidChangeTextEditorViewColumn: Event.None,
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
  createQuickPick: unsupported,
  createInputBox: unsupported,
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
