/// <reference path="./types.d.ts" />
import * as extHostTypes from 'vs/workbench/api/common/extHostTypes'
import * as errors from 'vs/base/common/errors'
import * as files from 'vs/platform/files/common/files'
import type * as vscode from 'vscode'
import * as languageConfiguration from 'vs/editor/common/languages/languageConfiguration'
import * as cancellation from 'vs/base/common/cancellation'
import * as extHostProtocol from 'vs/workbench/api/common/extHost.protocol'
import * as debugTypes from 'vs/workbench/contrib/debug/common/debug'
import * as event from 'vs/base/common/event'
import * as model from 'vs/editor/common/model'
import * as extensionHostProtocol from 'vs/workbench/services/extensions/common/extensionHostProtocol'
import * as searchExtTypes from 'vs/workbench/services/search/common/searchExtTypes'
import * as telemetryUtils from 'vs/platform/telemetry/common/telemetryUtils'
import * as log from 'vs/platform/log/common/log'
import * as editSessions from 'vs/platform/workspace/common/editSessions'
import * as editorOptions from 'vs/editor/common/config/editorOptions'
import * as uri from 'vs/base/common/uri'

let defaultApi: typeof vscode | undefined

export function setDefaultApi (api: typeof vscode): void {
  defaultApi = api
}

function createProxy<T extends keyof typeof vscode> (key: T): typeof vscode[T] {
  return new Proxy({}, {
    get (target, p) {
      if (defaultApi == null) {
        throw new Error('Default api is not ready yet, do not forget to import \'vscode/localExtensionHost\' and wait for services initialization')
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (defaultApi[key] as any)[p]
    }
  }) as typeof vscode[T]
}

const api: typeof vscode = {
  version: VSCODE_VERSION,
  tasks: createProxy('tasks'),
  notebooks: createProxy('notebooks'),
  scm: createProxy('scm'),
  comments: createProxy('comments'),
  authentication: createProxy('authentication'),
  tests: createProxy('tests'),
  extensions: createProxy('extensions'),
  debug: createProxy('debug'),
  env: createProxy('env'),
  commands: createProxy('commands'),
  window: createProxy('window'),
  workspace: createProxy('workspace'),
  languages: createProxy('languages'),
  l10n: createProxy('l10n'),
  interactive: createProxy('interactive'),
  ai: createProxy('ai'),
  chat: createProxy('chat'),
  speech: createProxy('speech'),

  // types
  Breakpoint: extHostTypes.Breakpoint,
  TerminalOutputAnchor: extHostTypes.TerminalOutputAnchor,
  ChatMessage: extHostTypes.ChatMessage,
  ChatMessageRole: extHostTypes.ChatMessageRole,
  ChatVariableLevel: extHostTypes.ChatVariableLevel,
  CallHierarchyIncomingCall: extHostTypes.CallHierarchyIncomingCall,
  CallHierarchyItem: extHostTypes.CallHierarchyItem,
  CallHierarchyOutgoingCall: extHostTypes.CallHierarchyOutgoingCall,
  CancellationError: errors.CancellationError,
  CancellationTokenSource: cancellation.CancellationTokenSource,
  CandidatePortSource: extHostProtocol.CandidatePortSource,
  CodeAction: extHostTypes.CodeAction,
  CodeActionKind: extHostTypes.CodeActionKind,
  CodeActionTriggerKind: extHostTypes.CodeActionTriggerKind,
  CodeLens: extHostTypes.CodeLens,
  Color: extHostTypes.Color,
  ColorInformation: extHostTypes.ColorInformation,
  ColorPresentation: extHostTypes.ColorPresentation,
  ColorThemeKind: extHostTypes.ColorThemeKind,
  CommentMode: extHostTypes.CommentMode,
  CommentState: extHostTypes.CommentState,
  CommentThreadCollapsibleState: extHostTypes.CommentThreadCollapsibleState,
  CommentThreadState: extHostTypes.CommentThreadState,
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
  DebugConfigurationProviderTriggerKind: debugTypes.DebugConfigurationProviderTriggerKind,
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
  InlineCompletionTriggerKind: extHostTypes.InlineCompletionTriggerKind,
  EventEmitter: event.Emitter,
  ExtensionKind: extHostTypes.ExtensionKind,
  ExtensionMode: extHostTypes.ExtensionMode,
  ExternalUriOpenerPriority: extHostTypes.ExternalUriOpenerPriority,
  FileChangeType: extHostTypes.FileChangeType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FileDecoration: <any>extHostTypes.FileDecoration,
  FileDecoration2: extHostTypes.FileDecoration,
  FileSystemError: extHostTypes.FileSystemError,
  FileType: files.FileType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FilePermission: <any>files.FilePermission,
  FoldingRange: extHostTypes.FoldingRange,
  FoldingRangeKind: extHostTypes.FoldingRangeKind,
  FunctionBreakpoint: extHostTypes.FunctionBreakpoint,
  InlineCompletionItem: extHostTypes.InlineSuggestion,
  InlineCompletionList: extHostTypes.InlineSuggestionList,
  Hover: extHostTypes.Hover,
  IndentAction: languageConfiguration.IndentAction,
  Location: extHostTypes.Location,
  MarkdownString: extHostTypes.MarkdownString,
  OverviewRulerLane: model.OverviewRulerLane,
  ParameterInformation: extHostTypes.ParameterInformation,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PortAutoForwardAction: <any>extHostTypes.PortAutoForwardAction,
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
  StandardTokenType: extHostTypes.StandardTokenType,
  StatusBarAlignment: extHostTypes.StatusBarAlignment,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SymbolInformation: <any>extHostTypes.SymbolInformation,
  SymbolKind: extHostTypes.SymbolKind,
  SymbolTag: extHostTypes.SymbolTag,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Task: <any>extHostTypes.Task,
  TaskGroup: extHostTypes.TaskGroup,
  TaskPanelKind: extHostTypes.TaskPanelKind,
  TaskRevealKind: extHostTypes.TaskRevealKind,
  TaskScope: extHostTypes.TaskScope,
  TerminalLink: extHostTypes.TerminalLink,
  TerminalQuickFixOpener: extHostTypes.TerminalQuickFixOpener,
  TerminalLocation: extHostTypes.TerminalLocation,
  TerminalProfile: extHostTypes.TerminalProfile,
  TerminalExitReason: extHostTypes.TerminalExitReason,
  TextDocumentSaveReason: extHostTypes.TextDocumentSaveReason,
  TextEdit: extHostTypes.TextEdit,
  SnippetTextEdit: extHostTypes.SnippetTextEdit,
  TextEditorCursorStyle: editorOptions.TextEditorCursorStyle,
  TextEditorLineNumbersStyle: extHostTypes.TextEditorLineNumbersStyle,
  TextEditorRevealType: extHostTypes.TextEditorRevealType,
  TextEditorSelectionChangeKind: extHostTypes.TextEditorSelectionChangeKind,
  SyntaxTokenType: extHostTypes.SyntaxTokenType,
  TextDocumentChangeReason: extHostTypes.TextDocumentChangeReason,
  ThemeColor: extHostTypes.ThemeColor,
  ThemeIcon: extHostTypes.ThemeIcon,
  TreeItem: extHostTypes.TreeItem,
  TreeItemCheckboxState: extHostTypes.TreeItemCheckboxState,
  TreeItemCollapsibleState: extHostTypes.TreeItemCollapsibleState,
  TypeHierarchyItem: extHostTypes.TypeHierarchyItem,
  UIKind: extensionHostProtocol.UIKind,
  Uri: uri.URI,
  ViewColumn: extHostTypes.ViewColumn,
  WorkspaceEdit: extHostTypes.WorkspaceEdit,
  // proposed api types
  DocumentDropEdit: extHostTypes.DocumentDropEdit,
  DocumentPasteEdit: extHostTypes.DocumentPasteEdit,
  InlayHint: extHostTypes.InlayHint,
  InlayHintLabelPart: extHostTypes.InlayHintLabelPart,
  InlayHintKind: extHostTypes.InlayHintKind,
  RemoteAuthorityResolverError: extHostTypes.RemoteAuthorityResolverError,
  ResolvedAuthority: extHostTypes.ResolvedAuthority,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ManagedResolvedAuthority: <any>extHostTypes.ManagedResolvedAuthority,
  SourceControlInputBoxValidationType: extHostTypes.SourceControlInputBoxValidationType,
  ExtensionRuntime: extHostTypes.ExtensionRuntime,
  TimelineItem: extHostTypes.TimelineItem,
  NotebookRange: extHostTypes.NotebookRange,
  NotebookCellKind: extHostTypes.NotebookCellKind,
  NotebookCellExecutionState: extHostTypes.NotebookCellExecutionState,
  NotebookCellData: extHostTypes.NotebookCellData,
  NotebookData: extHostTypes.NotebookData,
  NotebookRendererScript: extHostTypes.NotebookRendererScript,
  NotebookCellStatusBarAlignment: extHostTypes.NotebookCellStatusBarAlignment,
  NotebookEditorRevealType: extHostTypes.NotebookEditorRevealType,
  NotebookCellOutput: extHostTypes.NotebookCellOutput,
  NotebookCellOutputItem: extHostTypes.NotebookCellOutputItem,
  NotebookCellStatusBarItem: extHostTypes.NotebookCellStatusBarItem,
  NotebookControllerAffinity: extHostTypes.NotebookControllerAffinity,
  NotebookControllerAffinity2: extHostTypes.NotebookControllerAffinity2,
  NotebookEdit: extHostTypes.NotebookEdit,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  NotebookKernelSourceAction: <any>extHostTypes.NotebookKernelSourceAction,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PortAttributes: <any>extHostTypes.PortAttributes,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LinkedEditingRanges: <any>extHostTypes.LinkedEditingRanges,
  TestResultState: extHostTypes.TestResultState,
  TestRunRequest: extHostTypes.TestRunRequest,
  TestMessage: extHostTypes.TestMessage,
  TestTag: extHostTypes.TestTag,
  TestRunProfileKind: extHostTypes.TestRunProfileKind,
  TextSearchCompleteMessageType: searchExtTypes.TextSearchCompleteMessageType,
  DataTransfer: extHostTypes.DataTransfer,
  DataTransferItem: extHostTypes.DataTransferItem,
  CoveredCount: extHostTypes.CoveredCount,
  FileCoverage: extHostTypes.FileCoverage,
  StatementCoverage: extHostTypes.StatementCoverage,
  BranchCoverage: extHostTypes.BranchCoverage,
  FunctionCoverage: extHostTypes.FunctionCoverage,
  LanguageStatusSeverity: extHostTypes.LanguageStatusSeverity,
  QuickPickItemKind: extHostTypes.QuickPickItemKind,
  InputBoxValidationSeverity: extHostTypes.InputBoxValidationSeverity,
  TabInputText: extHostTypes.TextTabInput,
  TabInputTextDiff: extHostTypes.TextDiffTabInput,
  TabInputTextMerge: extHostTypes.TextMergeTabInput,
  TabInputCustom: extHostTypes.CustomEditorTabInput,
  TabInputNotebook: extHostTypes.NotebookEditorTabInput,
  TabInputNotebookDiff: extHostTypes.NotebookDiffEditorTabInput,
  TabInputWebview: extHostTypes.WebviewEditorTabInput,
  TabInputTerminal: extHostTypes.TerminalEditorTabInput,
  TabInputInteractiveWindow: extHostTypes.InteractiveWindowInput,
  TelemetryTrustedValue: telemetryUtils.TelemetryTrustedValue,
  LogLevel: log.LogLevel,
  EditSessionIdentityMatch: editSessions.EditSessionIdentityMatch,
  InteractiveSessionVoteDirection: extHostTypes.InteractiveSessionVoteDirection,
  InteractiveSessionCopyKind: extHostTypes.InteractiveSessionCopyKind,
  InteractiveEditorResponseFeedbackKind: extHostTypes.InteractiveEditorResponseFeedbackKind,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  StackFrameFocus: <any>extHostTypes.StackFrameFocus,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ThreadFocus: <any>extHostTypes.ThreadFocus,
  RelatedInformationType: extHostTypes.RelatedInformationType,
  ChatAgentResultFeedbackKind: extHostTypes.ChatAgentResultFeedbackKind,
  TabInputChat: extHostTypes.ChatEditorTabInput,
  SpeechToTextStatus: extHostTypes.SpeechToTextStatus,
  ChatAgentCompletionItem: extHostTypes.ChatAgentCompletionItem,
  MultiDocumentHighlight: extHostTypes.MultiDocumentHighlight,
  NotebookVariablesRequestKind: extHostTypes.NotebookVariablesRequestKind,
  TerminalQuickFixTerminalCommand: extHostTypes.TerminalQuickFixCommand
}

// @ts-ignore the syntax will be transformed by a typescript transformer in the rollup config
export = api
