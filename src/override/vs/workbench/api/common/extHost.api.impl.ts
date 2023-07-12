/// <reference path="../../../../../../vscode.proposed.extensionsAny.d.ts" />
/// <reference path="../../../../../../vscode.proposed.documentPaste.d.ts" />
/// <reference path="../../../../../../vscode.proposed.externalUriOpener.d.ts" />
/// <reference path="../../../../../../vscode.proposed.fileSearchProvider.d.ts" />
/// <reference path="../../../../../../vscode.proposed.textSearchProvider.d.ts" />
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { IExtensionDescription, ExtensionIdentifierSet } from 'vs/platform/extensions/common/extensions'
import { ServicesAccessor } from 'vs/platform/instantiation/common/instantiation'
import { IExtensionRegistries } from 'vs/workbench/api/common/extHost.api.impl'
import { ExtHostConfigProvider } from 'vs/workbench/api/common/extHostConfiguration'
import { CancellationTokenSource } from 'vs/base/common/cancellation'
import * as errors from 'vs/base/common/errors'
import { Emitter, Event } from 'vs/base/common/event'
import Severity from 'vs/base/common/severity'
import { URI } from 'vs/base/common/uri'
import { TextEditorCursorStyle } from 'vs/editor/common/config/editorOptions'
import { OverviewRulerLane } from 'vs/editor/common/model'
import * as languageConfiguration from 'vs/editor/common/languages/languageConfiguration'
import { score } from 'vs/editor/common/languageSelector'
import * as files from 'vs/platform/files/common/files'
import { UIKind } from 'vs/workbench/services/extensions/common/extensionHostProtocol'
import { Extension } from 'vs/workbench/api/common/extHostExtensionService'
import * as typeConverters from 'vs/workbench/api/common/extHostTypeConverters'
import * as extHostTypes from 'vs/workbench/api/common/extHostTypes'
import { TelemetryTrustedValue } from 'vs/platform/telemetry/common/telemetryUtils'
import type * as vscode from 'vscode'
import { getRemoteName } from 'vs/platform/remote/common/remoteHosts'
import { LogLevel } from 'vs/platform/log/common/log'
import { ExtHostTelemetryLogger, isNewAppInstall } from 'vs/workbench/api/common/extHostTelemetry'
import { TextSearchCompleteMessageType } from 'vs/workbench/services/search/common/searchExtTypes'
import { Schemas } from 'vs/base/common/network'
import { matchesScheme } from 'vs/platform/opener/common/opener'
import { combinedDisposable } from 'vs/base/common/lifecycle'
import { checkProposedApiEnabled, isProposedApiEnabled } from 'vs/workbench/services/extensions/common/extensions'
import { DebugConfigurationProviderTriggerKind } from 'vs/workbench/contrib/debug/common/debug'
import { ExtHostServices, createExtHostServices } from '../../../../../extHost'
import { unsupported } from '../../../../../tools'

export function createApiFactoryAndRegisterActors (accessor: ServicesAccessor): unknown {
  const {
    extHostInitData,
    extHostLogService,
    extHostApiDeprecationService,
    extHostMessageService,
    extHostBulkEdits,
    extHostDocuments,
    extHostDocumentContentProvider,
    extHostQuickOpen,
    extHostProgress,
    extHostDiagnostics,
    extHostEditors,
    extHostCommands,
    extHostLanguages,
    extHostWindow,
    extHostClipboard,
    extHostLanguageFeatures,
    extHostWorkspace,
    extHostTelemetry,
    extHostDebugService,
    extHostFileSystem,
    extHostConsumerFileSystem,
    extHostExtensionService,
    extHostDocumentSaveParticipant,
    extHostFileSystemEvent,
    extHostOutputService,
    extHostTreeViews,
    extHostLocalization,
    extHostStatusBar,
    extHostTerminalService,
    extHostEditorTabs,
    extHostDecorations,
    extHostTheming,
    extHostSearch,
    extHostDialogs,
    extHostWebviewPanels,
    extHostCustomEditors,
    extHostWebviewViews,
    extHostUriOpeners
  } = createExtHostServices(accessor) as ExtHostServices

  const initData = extHostInitData
  const extensionService = extHostExtensionService
  const extHostApiDeprecation = extHostApiDeprecationService
  const extHostDocumentContentProviders = extHostDocumentContentProvider

  return function (extension: IExtensionDescription, extensionInfo: IExtensionRegistries, configProvider: ExtHostConfigProvider): typeof vscode {
    // Check document selectors for being overly generic. Technically this isn't a problem but
    // in practice many extensions say they support `fooLang` but need fs-access to do so. Those
    // extension should specify then the `file`-scheme, e.g. `{ scheme: 'fooLang', language: 'fooLang' }`
    // We only inform once, it is not a warning because we just want to raise awareness and because
    // we cannot say if the extension is doing it right or wrong...
    const checkSelector = (function () {
      let done = !extension.isUnderDevelopment
      function informOnce () {
        if (!done) {
          extHostLogService.info(`Extension '${extension.identifier.value}' uses a document selector without scheme. Learn more about this: https://go.microsoft.com/fwlink/?linkid=872305`)
          done = true
        }
      }
      return function perform (selector: vscode.DocumentSelector): vscode.DocumentSelector {
        if (Array.isArray(selector)) {
          selector.forEach(perform)
        } else if (typeof selector === 'string') {
          informOnce()
        } else {
          const filter = selector as vscode.DocumentFilter // TODO: microsoft/TypeScript#42768
          if (typeof filter.scheme === 'undefined') {
            informOnce()
          }
        }
        return selector
      }
    })()

    // namespace: commands
    const commands: typeof vscode.commands = {
      registerCommand (id: string, command: <T>(...args: any[]) => T | Thenable<T>, thisArgs?: any): vscode.Disposable {
        return extHostCommands.registerCommand(true, id, command, thisArgs, undefined, extension)
      },
      registerTextEditorCommand (id: string, callback: (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, ...args: any[]) => void, thisArg?: any): vscode.Disposable {
        return extHostCommands.registerCommand(true, id, (...args: any[]): any => {
          const activeTextEditor = extHostEditors.getActiveTextEditor()
          if (activeTextEditor == null) {
            extHostLogService.warn('Cannot execute ' + id + ' because there is no active text editor.')
            return undefined
          }

          return activeTextEditor.edit((edit: vscode.TextEditorEdit) => {
            callback.apply(thisArg, [activeTextEditor, edit, ...args])
          }).then((result) => {
            if (!result) {
              extHostLogService.warn('Edits from command ' + id + ' were not applied.')
            }
          }, (err) => {
            extHostLogService.warn('An error occurred while running command ' + id, err)
          })
        }, undefined, undefined, extension)
      },
      executeCommand<T> (id: string, ...args: any[]): Thenable<T> {
        return extHostCommands.executeCommand<T>(id, ...args)
      },
      getCommands (filterInternal: boolean = false): Thenable<string[]> {
        return extHostCommands.getCommands(filterInternal)
      }
    }

    // namespace: env
    const env: typeof vscode.env = {
      get machineId () { return initData.telemetryInfo.machineId },
      get sessionId () { return initData.telemetryInfo.sessionId },
      get language () { return initData.environment.appLanguage },
      get appName () { return initData.environment.appName },
      get appRoot () { return initData.environment.appRoot?.fsPath ?? '' },
      get appHost () { return initData.environment.appHost },
      get uriScheme () { return initData.environment.appUriScheme },
      get clipboard (): vscode.Clipboard { return extHostClipboard.value },
      get shell () {
        return extHostTerminalService.getDefaultShell(false)
      },
      get isTelemetryEnabled () {
        return extHostTelemetry.getTelemetryConfiguration()
      },
      get onDidChangeTelemetryEnabled (): Event<boolean> {
        return extHostTelemetry.onDidChangeTelemetryEnabled
      },
      get isNewAppInstall () {
        return isNewAppInstall(initData.telemetryInfo.firstSessionDate)
      },
      createTelemetryLogger (sender: vscode.TelemetrySender, options?: vscode.TelemetryLoggerOptions): vscode.TelemetryLogger {
        ExtHostTelemetryLogger.validateSender(sender)
        return extHostTelemetry.instantiateLogger(extension, sender, options)
      },
      openExternal (uri: URI, options?: { allowContributedOpeners?: boolean | string }) {
        return extHostWindow.openUri(uri, {
          allowTunneling: !!initData.remote.authority,
          allowContributedOpeners: options?.allowContributedOpeners
        })
      },
      async asExternalUri (uri: URI) {
        try {
          return await extHostWindow.asExternalUri(uri, { allowTunneling: !!initData.remote.authority })
        } catch (err) {
          if (matchesScheme(uri, Schemas.http) || matchesScheme(uri, Schemas.https)) {
            return uri
          }

          throw err
        }
      },
      get remoteName () {
        return getRemoteName(initData.remote.authority)
      },
      get uiKind () {
        return initData.uiKind
      },
      get logLevel () {
        return extHostLogService.getLevel()
      },
      get onDidChangeLogLevel () {
        return extHostLogService.onDidChangeLogLevel
      }
    }
    if (initData.environment.extensionTestsLocationURI == null) {
      // allow to patch env-function when running tests
      Object.freeze(env)
    }

    // namespace: extensions
    const extensionKind = initData.remote.isRemote
      ? extHostTypes.ExtensionKind.Workspace
      : extHostTypes.ExtensionKind.UI

    const extensions: typeof vscode.extensions = {
      getExtension (extensionId: string, includeFromDifferentExtensionHosts?: boolean): vscode.Extension<any> | undefined {
        if (!isProposedApiEnabled(extension, 'extensionsAny')) {
          includeFromDifferentExtensionHosts = false
        }
        const mine = extensionInfo.mine.getExtensionDescription(extensionId)
        if (mine != null) {
          return new Extension(extensionService, extension.identifier, mine, extensionKind, false)
        }
        if (includeFromDifferentExtensionHosts) {
          const foreign = extensionInfo.all.getExtensionDescription(extensionId)
          if (foreign != null) {
            return new Extension(extensionService, extension.identifier, foreign, extensionKind /* TODO@alexdima THIS IS WRONG */, true)
          }
        }
        return undefined
      },
      get all (): vscode.Extension<any>[] {
        const result: vscode.Extension<any>[] = []
        for (const desc of extensionInfo.mine.getAllExtensionDescriptions()) {
          result.push(new Extension(extensionService, extension.identifier, desc, extensionKind, false))
        }
        return result
      },
      get allAcrossExtensionHosts (): vscode.Extension<any>[] {
        checkProposedApiEnabled(extension, 'extensionsAny')
        const local = new ExtensionIdentifierSet(extensionInfo.mine.getAllExtensionDescriptions().map(desc => desc.identifier))
        const result: vscode.Extension<any>[] = []
        for (const desc of extensionInfo.all.getAllExtensionDescriptions()) {
          const isFromDifferentExtensionHost = !local.has(desc.identifier)
          result.push(new Extension(extensionService, extension.identifier, desc, extensionKind /* TODO@alexdima THIS IS WRONG */, isFromDifferentExtensionHost))
        }
        return result
      },
      get onDidChange () {
        if (isProposedApiEnabled(extension, 'extensionsAny')) {
          return Event.any(extensionInfo.mine.onDidChange, extensionInfo.all.onDidChange)
        }
        return extensionInfo.mine.onDidChange
      }
    }

    // namespace: languages
    const languages: typeof vscode.languages = {
      createDiagnosticCollection (name?: string): vscode.DiagnosticCollection {
        return extHostDiagnostics.createDiagnosticCollection(extension.identifier, name)
      },
      get onDidChangeDiagnostics () {
        return extHostDiagnostics.onDidChangeDiagnostics
      },
      getDiagnostics: (resource?: vscode.Uri) => {
        return <any>extHostDiagnostics.getDiagnostics(resource)
      },
      getLanguages (): Thenable<string[]> {
        return extHostLanguages.getLanguages()
      },
      setTextDocumentLanguage (document: vscode.TextDocument, languageId: string): Thenable<vscode.TextDocument> {
        return extHostLanguages.changeLanguage(document.uri, languageId)
      },
      match (selector: vscode.DocumentSelector, document: vscode.TextDocument): number {
        const notebook = extHostDocuments.getDocumentData(document.uri)?.notebook
        return score(typeConverters.LanguageSelector.from(selector), document.uri, document.languageId, true, notebook?.uri, notebook?.notebookType)
      },
      registerCodeActionsProvider (selector: vscode.DocumentSelector, provider: vscode.CodeActionProvider, metadata?: vscode.CodeActionProviderMetadata): vscode.Disposable {
        return extHostLanguageFeatures.registerCodeActionProvider(extension, checkSelector(selector), provider, metadata)
      },
      registerDocumentPasteEditProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentPasteEditProvider, metadata: vscode.DocumentPasteProviderMetadata): vscode.Disposable {
        checkProposedApiEnabled(extension, 'documentPaste')
        return extHostLanguageFeatures.registerDocumentPasteEditProvider(extension, checkSelector(selector), provider, metadata)
      },
      registerCodeLensProvider (selector: vscode.DocumentSelector, provider: vscode.CodeLensProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerCodeLensProvider(extension, checkSelector(selector), provider)
      },
      registerDefinitionProvider (selector: vscode.DocumentSelector, provider: vscode.DefinitionProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerDefinitionProvider(extension, checkSelector(selector), provider)
      },
      registerDeclarationProvider (selector: vscode.DocumentSelector, provider: vscode.DeclarationProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerDeclarationProvider(extension, checkSelector(selector), provider)
      },
      registerImplementationProvider (selector: vscode.DocumentSelector, provider: vscode.ImplementationProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerImplementationProvider(extension, checkSelector(selector), provider)
      },
      registerTypeDefinitionProvider (selector: vscode.DocumentSelector, provider: vscode.TypeDefinitionProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerTypeDefinitionProvider(extension, checkSelector(selector), provider)
      },
      registerHoverProvider (selector: vscode.DocumentSelector, provider: vscode.HoverProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerHoverProvider(extension, checkSelector(selector), provider, extension.identifier)
      },
      registerEvaluatableExpressionProvider (selector: vscode.DocumentSelector, provider: vscode.EvaluatableExpressionProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerEvaluatableExpressionProvider(extension, checkSelector(selector), provider, extension.identifier)
      },
      registerInlineValuesProvider (selector: vscode.DocumentSelector, provider: vscode.InlineValuesProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerInlineValuesProvider(extension, checkSelector(selector), provider, extension.identifier)
      },
      registerDocumentHighlightProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentHighlightProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerDocumentHighlightProvider(extension, checkSelector(selector), provider)
      },
      registerLinkedEditingRangeProvider (selector: vscode.DocumentSelector, provider: vscode.LinkedEditingRangeProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerLinkedEditingRangeProvider(extension, checkSelector(selector), provider)
      },
      registerReferenceProvider (selector: vscode.DocumentSelector, provider: vscode.ReferenceProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerReferenceProvider(extension, checkSelector(selector), provider)
      },
      registerRenameProvider (selector: vscode.DocumentSelector, provider: vscode.RenameProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerRenameProvider(extension, checkSelector(selector), provider)
      },
      registerDocumentSymbolProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentSymbolProvider, metadata?: vscode.DocumentSymbolProviderMetadata): vscode.Disposable {
        return extHostLanguageFeatures.registerDocumentSymbolProvider(extension, checkSelector(selector), provider, metadata)
      },
      registerWorkspaceSymbolProvider (provider: vscode.WorkspaceSymbolProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerWorkspaceSymbolProvider(extension, provider)
      },
      registerDocumentFormattingEditProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentFormattingEditProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerDocumentFormattingEditProvider(extension, checkSelector(selector), provider)
      },
      registerDocumentRangeFormattingEditProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentRangeFormattingEditProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerDocumentRangeFormattingEditProvider(extension, checkSelector(selector), provider)
      },
      registerOnTypeFormattingEditProvider (selector: vscode.DocumentSelector, provider: vscode.OnTypeFormattingEditProvider, firstTriggerCharacter: string, ...moreTriggerCharacters: string[]): vscode.Disposable {
        return extHostLanguageFeatures.registerOnTypeFormattingEditProvider(extension, checkSelector(selector), provider, [firstTriggerCharacter].concat(moreTriggerCharacters))
      },
      registerDocumentSemanticTokensProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentSemanticTokensProvider, legend: vscode.SemanticTokensLegend): vscode.Disposable {
        return extHostLanguageFeatures.registerDocumentSemanticTokensProvider(extension, checkSelector(selector), provider, legend)
      },
      registerDocumentRangeSemanticTokensProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentRangeSemanticTokensProvider, legend: vscode.SemanticTokensLegend): vscode.Disposable {
        return extHostLanguageFeatures.registerDocumentRangeSemanticTokensProvider(extension, checkSelector(selector), provider, legend)
      },
      registerSignatureHelpProvider (selector: vscode.DocumentSelector, provider: vscode.SignatureHelpProvider, firstItem?: string | vscode.SignatureHelpProviderMetadata, ...remaining: string[]): vscode.Disposable {
        if (typeof firstItem === 'object') {
          return extHostLanguageFeatures.registerSignatureHelpProvider(extension, checkSelector(selector), provider, firstItem)
        }
        return extHostLanguageFeatures.registerSignatureHelpProvider(extension, checkSelector(selector), provider, typeof firstItem === 'undefined' ? [] : [firstItem, ...remaining])
      },
      registerCompletionItemProvider (selector: vscode.DocumentSelector, provider: vscode.CompletionItemProvider, ...triggerCharacters: string[]): vscode.Disposable {
        return extHostLanguageFeatures.registerCompletionItemProvider(extension, checkSelector(selector), provider, triggerCharacters)
      },
      registerInlineCompletionItemProvider (selector: vscode.DocumentSelector, provider: vscode.InlineCompletionItemProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerInlineCompletionsProvider(extension, checkSelector(selector), provider)
      },
      registerDocumentLinkProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentLinkProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerDocumentLinkProvider(extension, checkSelector(selector), provider)
      },
      registerColorProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentColorProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerColorProvider(extension, checkSelector(selector), provider)
      },
      registerFoldingRangeProvider (selector: vscode.DocumentSelector, provider: vscode.FoldingRangeProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerFoldingRangeProvider(extension, checkSelector(selector), provider)
      },
      registerSelectionRangeProvider (selector: vscode.DocumentSelector, provider: vscode.SelectionRangeProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerSelectionRangeProvider(extension, selector, provider)
      },
      registerCallHierarchyProvider (selector: vscode.DocumentSelector, provider: vscode.CallHierarchyProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerCallHierarchyProvider(extension, selector, provider)
      },
      registerTypeHierarchyProvider (selector: vscode.DocumentSelector, provider: vscode.TypeHierarchyProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerTypeHierarchyProvider(extension, selector, provider)
      },
      setLanguageConfiguration: (language: string, configuration: vscode.LanguageConfiguration): vscode.Disposable => {
        return extHostLanguageFeatures.setLanguageConfiguration(extension, language, configuration)
      },
      registerInlayHintsProvider (selector: vscode.DocumentSelector, provider: vscode.InlayHintsProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerInlayHintsProvider(extension, selector, provider)
      },
      createLanguageStatusItem (id: string, selector: vscode.DocumentSelector): vscode.LanguageStatusItem {
        return extHostLanguages.createLanguageStatusItem(extension, id, selector)
      },
      registerDocumentDropEditProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentDropEditProvider): vscode.Disposable {
        return extHostLanguageFeatures.registerDocumentOnDropEditProvider(extension, selector, provider)
      }
    }

    // namespace: window
    const window: typeof vscode.window = {
      get activeTextEditor () {
        return extHostEditors.getActiveTextEditor()
      },
      get visibleTextEditors () {
        return extHostEditors.getVisibleTextEditors()
      },
      get activeTerminal () {
        return extHostTerminalService.activeTerminal
      },
      get terminals () {
        return extHostTerminalService.terminals
      },
      async showTextDocument (documentOrUri: vscode.TextDocument | vscode.Uri, columnOrOptions?: vscode.ViewColumn | vscode.TextDocumentShowOptions, preserveFocus?: boolean): Promise<vscode.TextEditor> {
        const document = await (URI.isUri(documentOrUri)
          ? Promise.resolve(workspace.openTextDocument(documentOrUri))
          : Promise.resolve(<vscode.TextDocument>documentOrUri))

        return extHostEditors.showTextDocument(document, columnOrOptions, preserveFocus)
      },
      createTextEditorDecorationType (options: vscode.DecorationRenderOptions): vscode.TextEditorDecorationType {
        return extHostEditors.createTextEditorDecorationType(extension, options)
      },
      onDidChangeActiveTextEditor (listener, thisArg?, disposables?) {
        return extHostEditors.onDidChangeActiveTextEditor(listener, thisArg, disposables)
      },
      onDidChangeVisibleTextEditors (listener, thisArg, disposables) {
        return extHostEditors.onDidChangeVisibleTextEditors(listener, thisArg, disposables)
      },
      onDidChangeTextEditorSelection (listener: (e: vscode.TextEditorSelectionChangeEvent) => any, thisArgs?: any, disposables?: vscode.Disposable[]) {
        return extHostEditors.onDidChangeTextEditorSelection(listener, thisArgs, disposables)
      },
      onDidChangeTextEditorOptions (listener: (e: vscode.TextEditorOptionsChangeEvent) => any, thisArgs?: any, disposables?: vscode.Disposable[]) {
        return extHostEditors.onDidChangeTextEditorOptions(listener, thisArgs, disposables)
      },
      onDidChangeTextEditorVisibleRanges (listener: (e: vscode.TextEditorVisibleRangesChangeEvent) => any, thisArgs?: any, disposables?: vscode.Disposable[]) {
        return extHostEditors.onDidChangeTextEditorVisibleRanges(listener, thisArgs, disposables)
      },
      onDidChangeTextEditorViewColumn (listener, thisArg?, disposables?) {
        return extHostEditors.onDidChangeTextEditorViewColumn(listener, thisArg, disposables)
      },
      onDidCloseTerminal (listener, thisArg?, disposables?) {
        return extHostTerminalService.onDidCloseTerminal(listener, thisArg, disposables)
      },
      onDidOpenTerminal (listener, thisArg?, disposables?) {
        return extHostTerminalService.onDidOpenTerminal(listener, thisArg, disposables)
      },
      onDidChangeActiveTerminal (listener, thisArg?, disposables?) {
        return extHostTerminalService.onDidChangeActiveTerminal(listener, thisArg, disposables)
      },
      onDidChangeTerminalState (listener, thisArg?, disposables?) {
        return extHostTerminalService.onDidChangeTerminalState(listener, thisArg, disposables)
      },
      get state () {
        return extHostWindow.getState(extension)
      },
      onDidChangeWindowState (listener, thisArg?, disposables?) {
        return extHostWindow.onDidChangeWindowState(listener, thisArg, disposables)
      },
      showInformationMessage (message: string, ...rest: Array<vscode.MessageOptions | string | vscode.MessageItem>) {
        return <Thenable<any>>extHostMessageService.showMessage(extension, Severity.Info, message, rest[0], <Array<string | vscode.MessageItem>>rest.slice(1))
      },
      showWarningMessage (message: string, ...rest: Array<vscode.MessageOptions | string | vscode.MessageItem>) {
        return <Thenable<any>>extHostMessageService.showMessage(extension, Severity.Warning, message, rest[0], <Array<string | vscode.MessageItem>>rest.slice(1))
      },
      showErrorMessage (message: string, ...rest: Array<vscode.MessageOptions | string | vscode.MessageItem>) {
        return <Thenable<any>>extHostMessageService.showMessage(extension, Severity.Error, message, rest[0], <Array<string | vscode.MessageItem>>rest.slice(1))
      },
      showQuickPick (items: any, options?: vscode.QuickPickOptions, token?: vscode.CancellationToken): any {
        return extHostQuickOpen.showQuickPick(extension, items, options, token)
      },
      showWorkspaceFolderPick (options?: vscode.WorkspaceFolderPickOptions) {
        return extHostQuickOpen.showWorkspaceFolderPick(options)
      },
      showInputBox (options?: vscode.InputBoxOptions, token?: vscode.CancellationToken) {
        return extHostQuickOpen.showInput(options, token)
      },
      showOpenDialog (options) {
        return extHostDialogs.showOpenDialog(extension, options)
      },
      showSaveDialog (options) {
        return extHostDialogs.showSaveDialog(options)
      },
      createStatusBarItem (alignmentOrId?: vscode.StatusBarAlignment | string, priorityOrAlignment?: number | vscode.StatusBarAlignment, priorityArg?: number): vscode.StatusBarItem {
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
      setStatusBarMessage (text: string, timeoutOrThenable?: number | Thenable<any>): vscode.Disposable {
        return extHostStatusBar.setStatusBarMessage(text, timeoutOrThenable)
      },
      withScmProgress<R> (task: (progress: vscode.Progress<number>) => Thenable<R>) {
        extHostApiDeprecation.report('window.withScmProgress', extension,
          'Use \'withProgress\' instead.')

        return extHostProgress.withProgress(extension, { location: extHostTypes.ProgressLocation.SourceControl }, () => task({ report (_n: number) { /* noop */ } }))
      },
      withProgress<R> (options: vscode.ProgressOptions, task: (progress: vscode.Progress<{ message?: string, worked?: number }>, token: vscode.CancellationToken) => Thenable<R>) {
        return extHostProgress.withProgress(extension, options, task)
      },
      createOutputChannel (name: string, options: string | { log: true } | undefined): any {
        return extHostOutputService.createOutputChannel(name, options, extension)
      },
      createWebviewPanel (viewType: string, title: string, showOptions: vscode.ViewColumn | { viewColumn: vscode.ViewColumn, preserveFocus?: boolean }, options?: vscode.WebviewPanelOptions & vscode.WebviewOptions): vscode.WebviewPanel {
        return extHostWebviewPanels.createWebviewPanel(extension, viewType, title, showOptions, options)
      },
      createTerminal (nameOrOptions?: vscode.TerminalOptions | vscode.ExtensionTerminalOptions | string, shellPath?: string, shellArgs?: readonly string[] | string): vscode.Terminal {
        if (typeof nameOrOptions === 'object') {
          if ('pty' in nameOrOptions) {
            return extHostTerminalService.createExtensionTerminal(nameOrOptions)
          }
          return extHostTerminalService.createTerminalFromOptions(nameOrOptions)
        }
        return extHostTerminalService.createTerminal(nameOrOptions, shellPath, shellArgs)
      },
      registerTerminalLinkProvider (provider: vscode.TerminalLinkProvider): vscode.Disposable {
        return extHostTerminalService.registerLinkProvider(provider)
      },
      registerTerminalProfileProvider (id: string, provider: vscode.TerminalProfileProvider): vscode.Disposable {
        return extHostTerminalService.registerProfileProvider(extension, id, provider)
      },
      registerTreeDataProvider (viewId: string, treeDataProvider: vscode.TreeDataProvider<any>): vscode.Disposable {
        return extHostTreeViews.registerTreeDataProvider(viewId, treeDataProvider, extension)
      },
      createTreeView (viewId: string, options: { treeDataProvider: vscode.TreeDataProvider<any> }): vscode.TreeView<any> {
        return extHostTreeViews.createTreeView(viewId, options, extension)
      },
      registerWebviewPanelSerializer: (viewType: string, serializer: vscode.WebviewPanelSerializer) => {
        return extHostWebviewPanels.registerWebviewPanelSerializer(extension, viewType, serializer)
      },
      registerCustomEditorProvider: (viewType: string, provider: vscode.CustomTextEditorProvider | vscode.CustomReadonlyEditorProvider, options: { webviewOptions?: vscode.WebviewPanelOptions, supportsMultipleEditorsPerDocument?: boolean } = {}) => {
        return extHostCustomEditors.registerCustomEditorProvider(extension, viewType, provider, options)
      },
      registerFileDecorationProvider (provider: vscode.FileDecorationProvider) {
        return extHostDecorations.registerFileDecorationProvider(provider, extension)
      },
      registerUriHandler: unsupported,
      createQuickPick<T extends vscode.QuickPickItem> (): vscode.QuickPick<T> {
        return extHostQuickOpen.createQuickPick(extension)
      },
      createInputBox (): vscode.InputBox {
        return extHostQuickOpen.createInputBox(extension)
      },
      get activeColorTheme (): vscode.ColorTheme {
        return extHostTheming.activeColorTheme
      },
      onDidChangeActiveColorTheme (listener, thisArg?, disposables?) {
        return extHostTheming.onDidChangeActiveColorTheme(listener, thisArg, disposables)
      },
      registerWebviewViewProvider (viewId: string, provider: vscode.WebviewViewProvider, options?: {
        webviewOptions?: {
          retainContextWhenHidden?: boolean
        }
      }) {
        return extHostWebviewViews.registerWebviewViewProvider(extension, viewId, provider, options?.webviewOptions)
      },
      activeNotebookEditor: undefined,
      onDidChangeActiveNotebookEditor: Event.None,
      visibleNotebookEditors: [],
      onDidChangeVisibleNotebookEditors: Event.None,
      onDidChangeNotebookEditorSelection: Event.None,
      onDidChangeNotebookEditorVisibleRanges: Event.None,
      showNotebookDocument: unsupported,
      registerExternalUriOpener (id: string, opener: vscode.ExternalUriOpener, metadata: vscode.ExternalUriOpenerMetadata) {
        checkProposedApiEnabled(extension, 'externalUriOpener')
        return extHostUriOpeners.registerExternalUriOpener(extension.identifier, id, opener, metadata)
      },
      get tabGroups (): vscode.TabGroups {
        return extHostEditorTabs.tabGroups
      }
    }

    // namespace: workspace

    const workspace: typeof vscode.workspace = {
      get rootPath () {
        extHostApiDeprecation.report('workspace.rootPath', extension,
          'Please use \'workspace.workspaceFolders\' instead. More details: https://aka.ms/vscode-eliminating-rootpath')

        return extHostWorkspace.getPath()
      },
      set rootPath (value) {
        throw errors.readonly()
      },
      getWorkspaceFolder (resource) {
        return extHostWorkspace.getWorkspaceFolder(resource)
      },
      get workspaceFolders () {
        return extHostWorkspace.getWorkspaceFolders()
      },
      get name () {
        return extHostWorkspace.name
      },
      set name (value) {
        throw errors.readonly()
      },
      get workspaceFile () {
        return extHostWorkspace.workspaceFile
      },
      set workspaceFile (value) {
        throw errors.readonly()
      },
      updateWorkspaceFolders: (index, deleteCount, ...workspaceFoldersToAdd) => {
        return extHostWorkspace.updateWorkspaceFolders(extension, index, deleteCount || 0, ...workspaceFoldersToAdd)
      },
      onDidChangeWorkspaceFolders: function (listener, thisArgs?, disposables?) {
        return extHostWorkspace.onDidChangeWorkspace(listener, thisArgs, disposables)
      },
      asRelativePath: (pathOrUri, includeWorkspace?) => {
        return extHostWorkspace.getRelativePath(pathOrUri, includeWorkspace)
      },
      findFiles: (include, exclude, maxResults?, token?) => {
        // Note, undefined/null have different meanings on "exclude"
        return extHostWorkspace.findFiles(include, exclude, maxResults, extension.identifier, token)
      },
      saveAll: (includeUntitled?) => {
        return extHostWorkspace.saveAll(includeUntitled)
      },
      applyEdit (edit: vscode.WorkspaceEdit, metadata?: vscode.WorkspaceEditMetadata): Thenable<boolean> {
        return extHostBulkEdits.applyWorkspaceEdit(edit, extension, metadata)
      },
      createFileSystemWatcher: (pattern, ignoreCreate, ignoreChange, ignoreDelete): vscode.FileSystemWatcher => {
        return extHostFileSystemEvent.createFileSystemWatcher(extHostWorkspace, extension, pattern, ignoreCreate, ignoreChange, ignoreDelete)
      },
      get textDocuments () {
        return extHostDocuments.getAllDocumentData().map(data => data.document)
      },
      set textDocuments (value) {
        throw errors.readonly()
      },
      openTextDocument (uriOrFileNameOrOptions?: vscode.Uri | string | { language?: string, content?: string }) {
        let uriPromise: Thenable<URI>

        const options = uriOrFileNameOrOptions as { language?: string, content?: string }
        if (typeof uriOrFileNameOrOptions === 'string') {
          uriPromise = Promise.resolve(URI.file(uriOrFileNameOrOptions))
        } else if (URI.isUri(uriOrFileNameOrOptions)) {
          uriPromise = Promise.resolve(uriOrFileNameOrOptions)
        } else if (!options || typeof options === 'object') {
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
      onDidOpenTextDocument: (listener, thisArgs?, disposables?) => {
        return extHostDocuments.onDidAddDocument(listener, thisArgs, disposables)
      },
      onDidCloseTextDocument: (listener, thisArgs?, disposables?) => {
        return extHostDocuments.onDidRemoveDocument(listener, thisArgs, disposables)
      },
      onDidChangeTextDocument: (listener, thisArgs?, disposables?) => {
        return extHostDocuments.onDidChangeDocument(listener, thisArgs, disposables)
      },
      onDidSaveTextDocument: (listener, thisArgs?, disposables?) => {
        return extHostDocuments.onDidSaveDocument(listener, thisArgs, disposables)
      },
      onWillSaveTextDocument: (listener, thisArgs?, disposables?) => {
        return extHostDocumentSaveParticipant.getOnWillSaveTextDocumentEvent(extension)(listener, thisArgs, disposables)
      },
      notebookDocuments: [],
      openNotebookDocument: unsupported,
      onDidSaveNotebookDocument: Event.None,
      onDidChangeNotebookDocument: Event.None,
      onWillSaveNotebookDocument: Event.None,
      onDidOpenNotebookDocument: Event.None,
      onDidCloseNotebookDocument: Event.None,
      registerNotebookSerializer: unsupported,
      onDidChangeConfiguration: (listener: (_: any) => any, thisArgs?: any, disposables?: vscode.Disposable[]) => {
        return configProvider.onDidChangeConfiguration(listener, thisArgs, disposables)
      },
      getConfiguration (section?: string, scope?: vscode.ConfigurationScope | null): vscode.WorkspaceConfiguration {
        scope = arguments.length === 1 ? undefined : scope
        return configProvider.getConfiguration(section, scope, extension)
      },
      registerTextDocumentContentProvider (scheme: string, provider: vscode.TextDocumentContentProvider) {
        return extHostDocumentContentProviders.registerTextDocumentContentProvider(scheme, provider)
      },
      registerTaskProvider: unsupported,
      registerFileSystemProvider (scheme, provider, options) {
        return combinedDisposable(
          extHostFileSystem.registerFileSystemProvider(extension, scheme, provider, options),
          extHostConsumerFileSystem.addFileSystemProvider(scheme, provider, options)
        )
      },
      get fs () {
        return extHostConsumerFileSystem.value
      },
      registerFileSearchProvider: (scheme: string, provider: vscode.FileSearchProvider) => {
        checkProposedApiEnabled(extension, 'fileSearchProvider')
        return extHostSearch.registerFileSearchProvider(scheme, provider)
      },
      registerTextSearchProvider: (scheme: string, provider: vscode.TextSearchProvider) => {
        checkProposedApiEnabled(extension, 'textSearchProvider')
        return extHostSearch.registerTextSearchProvider(scheme, provider)
      },
      onDidCreateFiles: (listener, thisArg, disposables) => {
        return extHostFileSystemEvent.onDidCreateFile(listener, thisArg, disposables)
      },
      onDidDeleteFiles: (listener, thisArg, disposables) => {
        return extHostFileSystemEvent.onDidDeleteFile(listener, thisArg, disposables)
      },
      onDidRenameFiles: (listener, thisArg, disposables) => {
        return extHostFileSystemEvent.onDidRenameFile(listener, thisArg, disposables)
      },
      onWillCreateFiles: (listener: (e: vscode.FileWillCreateEvent) => any, thisArg?: any, disposables?: vscode.Disposable[]) => {
        return extHostFileSystemEvent.getOnWillCreateFileEvent(extension)(listener, thisArg, disposables)
      },
      onWillDeleteFiles: (listener: (e: vscode.FileWillDeleteEvent) => any, thisArg?: any, disposables?: vscode.Disposable[]) => {
        return extHostFileSystemEvent.getOnWillDeleteFileEvent(extension)(listener, thisArg, disposables)
      },
      onWillRenameFiles: (listener: (e: vscode.FileWillRenameEvent) => any, thisArg?: any, disposables?: vscode.Disposable[]) => {
        return extHostFileSystemEvent.getOnWillRenameFileEvent(extension)(listener, thisArg, disposables)
      },
      get isTrusted () {
        return extHostWorkspace.trusted
      },
      onDidGrantWorkspaceTrust: (listener, thisArgs?, disposables?) => {
        return extHostWorkspace.onDidGrantWorkspaceTrust(listener, thisArgs, disposables)
      }
    }

    // namespace: debug
    const debug: typeof vscode.debug = {
      get activeDebugSession () {
        return extHostDebugService.activeDebugSession
      },
      get activeDebugConsole () {
        return extHostDebugService.activeDebugConsole
      },
      get breakpoints () {
        return extHostDebugService.breakpoints
      },
      onDidStartDebugSession (listener, thisArg?, disposables?) {
        return extHostDebugService.onDidStartDebugSession(listener, thisArg, disposables)
      },
      onDidTerminateDebugSession (listener, thisArg?, disposables?) {
        return extHostDebugService.onDidTerminateDebugSession(listener, thisArg, disposables)
      },
      onDidChangeActiveDebugSession (listener, thisArg?, disposables?) {
        return extHostDebugService.onDidChangeActiveDebugSession(listener, thisArg, disposables)
      },
      onDidReceiveDebugSessionCustomEvent (listener, thisArg?, disposables?) {
        return extHostDebugService.onDidReceiveDebugSessionCustomEvent(listener, thisArg, disposables)
      },
      onDidChangeBreakpoints (listener, thisArgs?, disposables?) {
        return extHostDebugService.onDidChangeBreakpoints(listener, thisArgs, disposables)
      },
      registerDebugConfigurationProvider (debugType: string, provider: vscode.DebugConfigurationProvider, triggerKind?: vscode.DebugConfigurationProviderTriggerKind) {
        return extHostDebugService.registerDebugConfigurationProvider(debugType, provider, triggerKind || DebugConfigurationProviderTriggerKind.Initial)
      },
      registerDebugAdapterDescriptorFactory (debugType: string, factory: vscode.DebugAdapterDescriptorFactory) {
        return extHostDebugService.registerDebugAdapterDescriptorFactory(extension, debugType, factory)
      },
      registerDebugAdapterTrackerFactory (debugType: string, factory: vscode.DebugAdapterTrackerFactory) {
        return extHostDebugService.registerDebugAdapterTrackerFactory(debugType, factory)
      },
      startDebugging (folder: vscode.WorkspaceFolder | undefined, nameOrConfig: string | vscode.DebugConfiguration, parentSessionOrOptions?: vscode.DebugSession | vscode.DebugSessionOptions) {
        if ((parentSessionOrOptions == null) || (typeof parentSessionOrOptions === 'object' && 'configuration' in parentSessionOrOptions)) {
          return extHostDebugService.startDebugging(folder, nameOrConfig, { parentSession: parentSessionOrOptions })
        }
        return extHostDebugService.startDebugging(folder, nameOrConfig, parentSessionOrOptions || {})
      },
      stopDebugging (session?: vscode.DebugSession) {
        return extHostDebugService.stopDebugging(session)
      },
      addBreakpoints (breakpoints: readonly vscode.Breakpoint[]) {
        return extHostDebugService.addBreakpoints(breakpoints)
      },
      removeBreakpoints (breakpoints: readonly vscode.Breakpoint[]) {
        return extHostDebugService.removeBreakpoints(breakpoints)
      },
      asDebugSourceUri (source: vscode.DebugProtocolSource, session?: vscode.DebugSession): vscode.Uri {
        return extHostDebugService.asDebugSourceUri(source, session)
      }
    }

    // namespace: l10n
    const l10n: typeof vscode.l10n = {
      t (...params: [message: string, ...args: Array<string | number | boolean>] | [message: string, args: Record<string, any>] | [{ message: string, args?: Array<string | number | boolean> | Record<string, any>, comment: string | string[] }]): string {
        if (typeof params[0] === 'string') {
          const key = params.shift() as string

          // We have either rest args which are Array<string | number | boolean> or an array with a single Record<string, any>.
          // This ensures we get a Record<string | number, any> which will be formatted correctly.
          const argsFormatted = !params || typeof params[0] !== 'object' ? params : params[0]
          return extHostLocalization.getMessage(extension.identifier.value, { message: key, args: argsFormatted as Record<string | number, any> | undefined })
        }

        return extHostLocalization.getMessage(extension.identifier.value, params[0])
      },
      get bundle () {
        return extHostLocalization.getBundle(extension.identifier.value)
      },
      get uri () {
        return extHostLocalization.getBundleUri(extension.identifier.value)
      }
    }

    const api: typeof vscode = {
      version: initData.version,
      // namespaces
      authentication: <any>undefined,
      commands,
      comments: <any>undefined,
      debug,
      env,
      extensions,
      l10n,
      languages,
      notebooks: <any>undefined,
      scm: <any>undefined,
      tasks: <any>undefined,
      tests: <any>undefined,
      window,
      workspace,
      // types
      Breakpoint: extHostTypes.Breakpoint,
      CallHierarchyIncomingCall: extHostTypes.CallHierarchyIncomingCall,
      CallHierarchyItem: extHostTypes.CallHierarchyItem,
      CallHierarchyOutgoingCall: extHostTypes.CallHierarchyOutgoingCall,
      CancellationError: errors.CancellationError,
      CancellationTokenSource,
      CodeAction: extHostTypes.CodeAction,
      CodeActionKind: extHostTypes.CodeActionKind,
      CodeActionTriggerKind: extHostTypes.CodeActionTriggerKind,
      CodeLens: extHostTypes.CodeLens,
      Color: extHostTypes.Color,
      ColorInformation: extHostTypes.ColorInformation,
      ColorPresentation: extHostTypes.ColorPresentation,
      ColorThemeKind: extHostTypes.ColorThemeKind,
      CommentMode: extHostTypes.CommentMode,
      CommentThreadCollapsibleState: extHostTypes.CommentThreadCollapsibleState,
      CommentThreadState: extHostTypes.CommentThreadState,
      CompletionItem: extHostTypes.CompletionItem,
      CompletionItemKind: extHostTypes.CompletionItemKind,
      CompletionItemTag: extHostTypes.CompletionItemTag,
      CompletionList: <any>extHostTypes.CompletionList,
      CompletionTriggerKind: extHostTypes.CompletionTriggerKind,
      ConfigurationTarget: extHostTypes.ConfigurationTarget,
      CustomExecution: extHostTypes.CustomExecution,
      DebugAdapterExecutable: extHostTypes.DebugAdapterExecutable,
      DebugAdapterInlineImplementation: extHostTypes.DebugAdapterInlineImplementation,
      DebugAdapterNamedPipeServer: extHostTypes.DebugAdapterNamedPipeServer,
      DebugAdapterServer: extHostTypes.DebugAdapterServer,
      DebugConfigurationProviderTriggerKind,
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
      EventEmitter: Emitter,
      ExtensionKind: extHostTypes.ExtensionKind,
      ExtensionMode: extHostTypes.ExtensionMode,
      ExternalUriOpenerPriority: extHostTypes.ExternalUriOpenerPriority,
      FileChangeType: extHostTypes.FileChangeType,
      FileDecoration: <any>extHostTypes.FileDecoration,
      FileSystemError: extHostTypes.FileSystemError,
      FileType: files.FileType,
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
      OverviewRulerLane,
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
      SymbolInformation: <any>extHostTypes.SymbolInformation,
      SymbolKind: extHostTypes.SymbolKind,
      SymbolTag: extHostTypes.SymbolTag,
      Task: <any>extHostTypes.Task,
      TaskGroup: extHostTypes.TaskGroup,
      TaskPanelKind: extHostTypes.TaskPanelKind,
      TaskRevealKind: extHostTypes.TaskRevealKind,
      TaskScope: extHostTypes.TaskScope,
      TerminalLink: extHostTypes.TerminalLink,
      TerminalLocation: extHostTypes.TerminalLocation,
      TerminalProfile: extHostTypes.TerminalProfile,
      TerminalExitReason: extHostTypes.TerminalExitReason,
      TextDocumentSaveReason: extHostTypes.TextDocumentSaveReason,
      TextEdit: extHostTypes.TextEdit,
      SnippetTextEdit: extHostTypes.SnippetTextEdit,
      TextEditorCursorStyle,
      TextEditorLineNumbersStyle: extHostTypes.TextEditorLineNumbersStyle,
      TextEditorRevealType: extHostTypes.TextEditorRevealType,
      TextEditorSelectionChangeKind: extHostTypes.TextEditorSelectionChangeKind,
      TextDocumentChangeReason: extHostTypes.TextDocumentChangeReason,
      ThemeColor: extHostTypes.ThemeColor,
      ThemeIcon: extHostTypes.ThemeIcon,
      TreeItem: extHostTypes.TreeItem,
      TreeItemCheckboxState: extHostTypes.TreeItemCheckboxState,
      TreeItemCollapsibleState: extHostTypes.TreeItemCollapsibleState,
      TypeHierarchyItem: extHostTypes.TypeHierarchyItem,
      UIKind,
      Uri: URI,
      ViewColumn: extHostTypes.ViewColumn,
      WorkspaceEdit: extHostTypes.WorkspaceEdit,
      // proposed api types
      DocumentDropEdit: extHostTypes.DocumentDropEdit,
      DocumentPasteEdit: extHostTypes.DocumentPasteEdit,
      InlayHint: extHostTypes.InlayHint,
      InlayHintLabelPart: extHostTypes.InlayHintLabelPart,
      InlayHintKind: extHostTypes.InlayHintKind,
      NotebookRange: extHostTypes.NotebookRange,
      NotebookCellKind: extHostTypes.NotebookCellKind,
      NotebookCellData: extHostTypes.NotebookCellData,
      NotebookData: extHostTypes.NotebookData,
      NotebookCellStatusBarAlignment: extHostTypes.NotebookCellStatusBarAlignment,
      NotebookEditorRevealType: extHostTypes.NotebookEditorRevealType,
      NotebookCellOutput: extHostTypes.NotebookCellOutput,
      NotebookCellOutputItem: extHostTypes.NotebookCellOutputItem,
      NotebookCellStatusBarItem: extHostTypes.NotebookCellStatusBarItem,
      NotebookControllerAffinity: extHostTypes.NotebookControllerAffinity,
      NotebookEdit: extHostTypes.NotebookEdit,
      LinkedEditingRanges: <any>extHostTypes.LinkedEditingRanges,
      TestRunRequest: extHostTypes.TestRunRequest,
      TestMessage: extHostTypes.TestMessage,
      TestTag: extHostTypes.TestTag,
      TestRunProfileKind: extHostTypes.TestRunProfileKind,
      TextSearchCompleteMessageType,
      DataTransfer: extHostTypes.DataTransfer,
      DataTransferItem: extHostTypes.DataTransferItem,
      LanguageStatusSeverity: extHostTypes.LanguageStatusSeverity,
      QuickPickItemKind: extHostTypes.QuickPickItemKind,
      InputBoxValidationSeverity: extHostTypes.InputBoxValidationSeverity,
      TabInputText: extHostTypes.TextTabInput,
      TabInputTextDiff: extHostTypes.TextDiffTabInput,
      TabInputCustom: extHostTypes.CustomEditorTabInput,
      TabInputNotebook: extHostTypes.NotebookEditorTabInput,
      TabInputNotebookDiff: extHostTypes.NotebookDiffEditorTabInput,
      TabInputWebview: extHostTypes.WebviewEditorTabInput,
      TabInputTerminal: extHostTypes.TerminalEditorTabInput,
      TelemetryTrustedValue,
      LogLevel
    }

    return api
  }
}
