/// <reference path="./types.d.ts" />
import * as extHostTypes from 'vs/workbench/api/common/extHostTypes'
import * as errors from 'vs/base/common/errors'
import * as commonDebug from 'vs/workbench/contrib/debug/common/debug'
import * as files from 'vs/platform/files/common/files'
import * as extensionHostProtocol from 'vs/workbench/services/extensions/common/extensionHostProtocol'
import type * as vscode from 'vscode'
import * as cancellation from 'vs/base/common/cancellation'
import * as event from 'vs/base/common/event'
import * as languageConfiguration from 'vs/editor/common/languages/languageConfiguration'
import * as model from 'vs/editor/common/model'
import * as editorOptions from 'vs/editor/common/config/editorOptions'
import * as uri from 'vs/base/common/uri'
import * as log from 'vs/platform/log/common/log'
import * as telemetryUtils from 'vs/platform/telemetry/common/telemetryUtils'
import * as searchExtHostTypes from 'vs/workbench/services/search/common/searchExtTypes'
import createL10nApi from './vscode-services/l10n'
import createLanguagesApi from './vscode-services/languages'
import createCommandsApi from './vscode-services/commands'
import createWorkspaceApi from './vscode-services/workspace'
import createWindowApi, { TextTabInput } from './vscode-services/window'
import createEnvApi from './vscode-services/env'
import createDebugApi from './vscode-services/debug'
import createExtensionsApi from './vscode-services/extensions'
import { getDefaultExtension } from './default-extension'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const unsupported = <any>undefined

const _workspace = createWorkspaceApi(getDefaultExtension)
const api: typeof vscode = {
  version: VSCODE_VERSION,

  tasks: unsupported,
  notebooks: unsupported,
  scm: unsupported,
  comments: unsupported,
  authentication: unsupported,
  tests: unsupported,

  extensions: createExtensionsApi(getDefaultExtension),
  debug: createDebugApi(getDefaultExtension),
  env: createEnvApi(getDefaultExtension),
  commands: createCommandsApi(getDefaultExtension),
  window: createWindowApi(getDefaultExtension, _workspace),
  workspace: _workspace,
  languages: createLanguagesApi(getDefaultExtension),
  l10n: createL10nApi(getDefaultExtension),

  Breakpoint: extHostTypes.Breakpoint,
  CallHierarchyIncomingCall: extHostTypes.CallHierarchyIncomingCall,
  CallHierarchyItem: extHostTypes.CallHierarchyItem,
  CallHierarchyOutgoingCall: extHostTypes.CallHierarchyOutgoingCall,
  CancellationError: errors.CancellationError,
  CancellationTokenSource: cancellation.CancellationTokenSource,
  CodeAction: extHostTypes.CodeAction,
  CodeActionKind: extHostTypes.CodeActionKind,
  CodeActionTriggerKind: extHostTypes.CodeActionTriggerKind,
  CodeLens: extHostTypes.CodeLens,
  Color: extHostTypes.Color,
  ColorInformation: extHostTypes.ColorInformation,
  ColorPresentation: extHostTypes.ColorPresentation,
  ColorThemeKind: unsupported,
  CommentMode: extHostTypes.CommentMode,
  CommentThreadCollapsibleState: extHostTypes.CommentThreadCollapsibleState,
  CompletionItem: extHostTypes.CompletionItem,
  CompletionItemKind: extHostTypes.CompletionItemKind,
  CompletionItemTag: extHostTypes.CompletionItemTag,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CompletionList: <any>extHostTypes.CompletionList,
  CompletionTriggerKind: extHostTypes.CompletionTriggerKind,
  ConfigurationTarget: extHostTypes.ConfigurationTarget,
  CustomExecution: extHostTypes.CustomExecution,
  DebugAdapterExecutable: extHostTypes.DebugAdapterExecutable,
  DebugAdapterInlineImplementation: extHostTypes.DebugAdapterInlineImplementation,
  DebugAdapterNamedPipeServer: extHostTypes.DebugAdapterNamedPipeServer,
  DebugAdapterServer: extHostTypes.DebugAdapterServer,
  DebugConfigurationProviderTriggerKind: commonDebug.DebugConfigurationProviderTriggerKind,
  DebugConsoleMode: extHostTypes.DebugConsoleMode,
  DecorationRangeBehavior: extHostTypes.DecorationRangeBehavior,
  Diagnostic: extHostTypes.Diagnostic,
  DiagnosticRelatedInformation: extHostTypes.DiagnosticRelatedInformation,
  DiagnosticSeverity: extHostTypes.DiagnosticSeverity,
  DiagnosticTag: extHostTypes.DiagnosticTag,
  Disposable: extHostTypes.Disposable,
  DocumentHighlight: extHostTypes.DocumentHighlight,
  DocumentHighlightKind: extHostTypes.DocumentHighlightKind,
  DocumentLink: extHostTypes.DocumentLink,
  DocumentSymbol: extHostTypes.DocumentSymbol,
  EndOfLine: extHostTypes.EndOfLine,
  EnvironmentVariableMutatorType: extHostTypes.EnvironmentVariableMutatorType,
  EvaluatableExpression: extHostTypes.EvaluatableExpression,
  InlineValueText: extHostTypes.InlineValueText,
  InlineValueVariableLookup: extHostTypes.InlineValueVariableLookup,
  InlineValueEvaluatableExpression: extHostTypes.InlineValueEvaluatableExpression,
  EventEmitter: event.Emitter,
  ExtensionKind: extHostTypes.ExtensionKind,
  ExtensionMode: extHostTypes.ExtensionMode,
  FileChangeType: extHostTypes.FileChangeType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FileDecoration: <any>extHostTypes.FileDecoration,
  FileSystemError: extHostTypes.FileSystemError,
  FileType: files.FileType,
  FilePermission: files.FilePermission,
  FoldingRange: extHostTypes.FoldingRange,
  FoldingRangeKind: extHostTypes.FoldingRangeKind,
  FunctionBreakpoint: extHostTypes.FunctionBreakpoint,
  Hover: extHostTypes.Hover,
  IndentAction: languageConfiguration.IndentAction,
  Location: extHostTypes.Location,
  MarkdownString: extHostTypes.MarkdownString,
  OverviewRulerLane: model.OverviewRulerLane,
  ParameterInformation: extHostTypes.ParameterInformation,
  Position: extHostTypes.Position,
  ProcessExecution: extHostTypes.ProcessExecution,
  ProgressLocation: extHostTypes.ProgressLocation,
  QuickInputButtons: extHostTypes.QuickInputButtons,
  Range: extHostTypes.Range,
  RelativePattern: extHostTypes.RelativePattern,
  Selection: extHostTypes.Selection,
  SelectionRange: extHostTypes.SelectionRange,
  SemanticTokens: extHostTypes.SemanticTokens,
  SemanticTokensBuilder: extHostTypes.SemanticTokensBuilder,
  SemanticTokensEdit: extHostTypes.SemanticTokensEdit,
  SemanticTokensEdits: extHostTypes.SemanticTokensEdits,
  SemanticTokensLegend: extHostTypes.SemanticTokensLegend,
  ShellExecution: extHostTypes.ShellExecution,
  ShellQuoting: extHostTypes.ShellQuoting,
  SignatureHelp: extHostTypes.SignatureHelp,
  SignatureHelpTriggerKind: extHostTypes.SignatureHelpTriggerKind,
  SignatureInformation: extHostTypes.SignatureInformation,
  SnippetString: extHostTypes.SnippetString,
  SourceBreakpoint: extHostTypes.SourceBreakpoint,
  StatusBarAlignment: extHostTypes.StatusBarAlignment,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SymbolInformation: <any>extHostTypes.SymbolInformation,
  SymbolKind: extHostTypes.SymbolKind,
  SymbolTag: extHostTypes.SymbolTag,
  Task: unsupported,
  TaskGroup: unsupported,
  TaskPanelKind: unsupported,
  TaskRevealKind: unsupported,
  TaskScope: unsupported,
  TerminalLink: extHostTypes.TerminalLink,
  TerminalLocation: extHostTypes.TerminalLocation,
  TerminalProfile: extHostTypes.TerminalProfile,
  TextDocumentSaveReason: extHostTypes.TextDocumentSaveReason,
  TextEdit: extHostTypes.TextEdit,
  TextEditorCursorStyle: editorOptions.TextEditorCursorStyle,
  TextEditorLineNumbersStyle: extHostTypes.TextEditorLineNumbersStyle,
  TextEditorRevealType: extHostTypes.TextEditorRevealType,
  TextEditorSelectionChangeKind: extHostTypes.TextEditorSelectionChangeKind,
  TextDocumentChangeReason: extHostTypes.TextDocumentChangeReason,
  ThemeColor: extHostTypes.ThemeColor,
  ThemeIcon: extHostTypes.ThemeIcon,
  TreeItem: extHostTypes.TreeItem,
  TreeItemCollapsibleState: extHostTypes.TreeItemCollapsibleState,
  TypeHierarchyItem: extHostTypes.TypeHierarchyItem,
  UIKind: extensionHostProtocol.UIKind,
  Uri: uri.URI,
  ViewColumn: extHostTypes.ViewColumn,
  WorkspaceEdit: extHostTypes.WorkspaceEdit,
  InlayHint: extHostTypes.InlayHint,
  InlayHintLabelPart: extHostTypes.InlayHintLabelPart,
  InlayHintKind: extHostTypes.InlayHintKind,
  NotebookRange: unsupported,
  NotebookCellKind: unsupported,
  NotebookCellData: unsupported,
  NotebookData: unsupported,
  NotebookCellStatusBarAlignment: unsupported,
  NotebookCellOutput: unsupported,
  NotebookCellOutputItem: unsupported,
  NotebookCellStatusBarItem: unsupported,
  NotebookControllerAffinity: unsupported,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LinkedEditingRanges: <any>extHostTypes.LinkedEditingRanges,
  TestRunRequest: extHostTypes.TestRunRequest,
  TestMessage: extHostTypes.TestMessage,
  TestTag: extHostTypes.TestTag,
  TestRunProfileKind: extHostTypes.TestRunProfileKind,
  DataTransfer: unsupported,
  DataTransferItem: unsupported,
  LanguageStatusSeverity: extHostTypes.LanguageStatusSeverity,
  QuickPickItemKind: extHostTypes.QuickPickItemKind,
  TabInputText: TextTabInput,
  TabInputTextDiff: extHostTypes.TextDiffTabInput,
  TabInputCustom: extHostTypes.CustomEditorTabInput,
  TabInputNotebook: extHostTypes.NotebookEditorTabInput,
  TabInputNotebookDiff: extHostTypes.NotebookDiffEditorTabInput,
  TabInputWebview: extHostTypes.WebviewEditorTabInput,
  TabInputTerminal: extHostTypes.TerminalEditorTabInput,
  InputBoxValidationSeverity: extHostTypes.InputBoxValidationSeverity,
  InlineCompletionList: extHostTypes.InlineSuggestionList,
  InlineCompletionTriggerKind: extHostTypes.InlineCompletionTriggerKind,
  InlineCompletionItem: extHostTypes.InlineSuggestion,
  DocumentDropEdit: extHostTypes.DocumentDropEdit,
  NotebookEditorRevealType: unsupported,
  SnippetTextEdit: extHostTypes.SnippetTextEdit,
  NotebookEdit: unsupported,
  LogLevel: log.LogLevel,
  TerminalExitReason: extHostTypes.TerminalExitReason,
  CommentThreadState: unsupported,
  TelemetryTrustedValue: telemetryUtils.TelemetryTrustedValue,
  TextSearchCompleteMessageType: searchExtHostTypes.TextSearchCompleteMessageType
}

// @ts-ignore the syntax will be transformed by a typescript transformer in the rollup config
export = api
