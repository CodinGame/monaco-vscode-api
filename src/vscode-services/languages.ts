/// <reference path="../../vscode.proposed.documentPaste.d.ts" />
import type * as vscode from 'vscode'
import { score } from 'vs/editor/common/languageSelector'
import * as typeConverters from 'vs/workbench/api/common/extHostTypeConverters'
import { IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { checkProposedApiEnabled } from 'vs/workbench/services/extensions/common/extensions'
import { getExtHostServices } from './extHost'

function checkSelector (selector: vscode.DocumentSelector) {
  return selector
}

export default function create (getExtension: () => IExtensionDescription): typeof vscode.languages {
  return {
    createDiagnosticCollection (name?: string): vscode.DiagnosticCollection {
      const { extHostDiagnostics } = getExtHostServices()

      const extension = getExtension()
      return extHostDiagnostics.createDiagnosticCollection(extension.identifier, name)
    },
    get onDidChangeDiagnostics () {
      const { extHostDiagnostics } = getExtHostServices()
      return extHostDiagnostics.onDidChangeDiagnostics
    },
    getDiagnostics: (resource?: vscode.Uri) => {
      const { extHostDiagnostics } = getExtHostServices()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <any>extHostDiagnostics.getDiagnostics(resource)
    },
    getLanguages (): Thenable<string[]> {
      const { extHostLanguages } = getExtHostServices()

      return extHostLanguages.getLanguages()
    },
    setTextDocumentLanguage (document: vscode.TextDocument, languageId: string): Thenable<vscode.TextDocument> {
      const { extHostLanguages } = getExtHostServices()

      return extHostLanguages.changeLanguage(document.uri, languageId)
    },
    match (selector: vscode.DocumentSelector, document: vscode.TextDocument): number {
      return score(typeConverters.LanguageSelector.from(selector), document.uri, document.languageId, true, undefined, undefined)
    },
    registerCodeActionsProvider (selector: vscode.DocumentSelector, provider: vscode.CodeActionProvider, metadata?: vscode.CodeActionProviderMetadata): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerCodeActionProvider(extension, checkSelector(selector), provider, metadata)
    },
    registerDocumentPasteEditProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentPasteEditProvider, metadata: vscode.DocumentPasteProviderMetadata): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      checkProposedApiEnabled(extension, 'documentPaste')
      return extHostLanguageFeatures.registerDocumentPasteEditProvider(extension, checkSelector(selector), provider, metadata)
    },
    registerCodeLensProvider (selector: vscode.DocumentSelector, provider: vscode.CodeLensProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerCodeLensProvider(extension, checkSelector(selector), provider)
    },
    registerDefinitionProvider (selector: vscode.DocumentSelector, provider: vscode.DefinitionProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerDefinitionProvider(extension, checkSelector(selector), provider)
    },
    registerDeclarationProvider (selector: vscode.DocumentSelector, provider: vscode.DeclarationProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerDeclarationProvider(extension, checkSelector(selector), provider)
    },
    registerImplementationProvider (selector: vscode.DocumentSelector, provider: vscode.ImplementationProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerImplementationProvider(extension, checkSelector(selector), provider)
    },
    registerTypeDefinitionProvider (selector: vscode.DocumentSelector, provider: vscode.TypeDefinitionProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerTypeDefinitionProvider(extension, checkSelector(selector), provider)
    },
    registerHoverProvider (selector: vscode.DocumentSelector, provider: vscode.HoverProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerHoverProvider(extension, checkSelector(selector), provider, extension.identifier)
    },
    registerEvaluatableExpressionProvider (selector: vscode.DocumentSelector, provider: vscode.EvaluatableExpressionProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerEvaluatableExpressionProvider(extension, checkSelector(selector), provider, extension.identifier)
    },
    registerInlineValuesProvider (selector: vscode.DocumentSelector, provider: vscode.InlineValuesProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerInlineValuesProvider(extension, checkSelector(selector), provider, extension.identifier)
    },
    registerDocumentHighlightProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentHighlightProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerDocumentHighlightProvider(extension, checkSelector(selector), provider)
    },
    registerLinkedEditingRangeProvider (selector: vscode.DocumentSelector, provider: vscode.LinkedEditingRangeProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerLinkedEditingRangeProvider(extension, checkSelector(selector), provider)
    },
    registerReferenceProvider (selector: vscode.DocumentSelector, provider: vscode.ReferenceProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerReferenceProvider(extension, checkSelector(selector), provider)
    },
    registerRenameProvider (selector: vscode.DocumentSelector, provider: vscode.RenameProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerRenameProvider(extension, checkSelector(selector), provider)
    },
    registerDocumentSymbolProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentSymbolProvider, metadata?: vscode.DocumentSymbolProviderMetadata): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerDocumentSymbolProvider(extension, checkSelector(selector), provider, metadata)
    },
    registerWorkspaceSymbolProvider (provider: vscode.WorkspaceSymbolProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerWorkspaceSymbolProvider(extension, provider)
    },
    registerDocumentFormattingEditProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentFormattingEditProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerDocumentFormattingEditProvider(extension, checkSelector(selector), provider)
    },
    registerDocumentRangeFormattingEditProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentRangeFormattingEditProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerDocumentRangeFormattingEditProvider(extension, checkSelector(selector), provider)
    },
    registerOnTypeFormattingEditProvider (selector: vscode.DocumentSelector, provider: vscode.OnTypeFormattingEditProvider, firstTriggerCharacter: string, ...moreTriggerCharacters: string[]): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerOnTypeFormattingEditProvider(extension, checkSelector(selector), provider, [firstTriggerCharacter].concat(moreTriggerCharacters))
    },
    registerDocumentSemanticTokensProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentSemanticTokensProvider, legend: vscode.SemanticTokensLegend): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerDocumentSemanticTokensProvider(extension, checkSelector(selector), provider, legend)
    },
    registerDocumentRangeSemanticTokensProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentRangeSemanticTokensProvider, legend: vscode.SemanticTokensLegend): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerDocumentRangeSemanticTokensProvider(extension, checkSelector(selector), provider, legend)
    },
    registerSignatureHelpProvider (selector: vscode.DocumentSelector, provider: vscode.SignatureHelpProvider, firstItem?: string | vscode.SignatureHelpProviderMetadata, ...remaining: string[]): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      if (typeof firstItem === 'object') {
        return extHostLanguageFeatures.registerSignatureHelpProvider(extension, checkSelector(selector), provider, firstItem)
      }
      return extHostLanguageFeatures.registerSignatureHelpProvider(extension, checkSelector(selector), provider, typeof firstItem === 'undefined' ? [] : [firstItem, ...remaining])
    },
    registerCompletionItemProvider (selector: vscode.DocumentSelector, provider: vscode.CompletionItemProvider, ...triggerCharacters: string[]): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerCompletionItemProvider(extension, checkSelector(selector), provider, triggerCharacters)
    },
    registerDocumentLinkProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentLinkProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerDocumentLinkProvider(extension, checkSelector(selector), provider)
    },
    registerColorProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentColorProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerColorProvider(extension, checkSelector(selector), provider)
    },
    registerFoldingRangeProvider (selector: vscode.DocumentSelector, provider: vscode.FoldingRangeProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerFoldingRangeProvider(extension, checkSelector(selector), provider)
    },
    registerSelectionRangeProvider (selector: vscode.DocumentSelector, provider: vscode.SelectionRangeProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerSelectionRangeProvider(extension, selector, provider)
    },
    registerCallHierarchyProvider (selector: vscode.DocumentSelector, provider: vscode.CallHierarchyProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerCallHierarchyProvider(extension, selector, provider)
    },
    registerTypeHierarchyProvider (selector: vscode.DocumentSelector, provider: vscode.TypeHierarchyProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerTypeHierarchyProvider(extension, selector, provider)
    },
    setLanguageConfiguration: (language: string, configuration: vscode.LanguageConfiguration): vscode.Disposable => {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.setLanguageConfiguration(extension, language, configuration)
    },
    registerInlayHintsProvider (selector: vscode.DocumentSelector, provider: vscode.InlayHintsProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerInlayHintsProvider(extension, selector, provider)
    },
    createLanguageStatusItem (id: string, selector: vscode.DocumentSelector): vscode.LanguageStatusItem {
      const { extHostLanguages } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguages.createLanguageStatusItem(extension, id, selector)
    },
    registerInlineCompletionItemProvider (selector: vscode.DocumentSelector, provider: vscode.InlineCompletionItemProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerInlineCompletionsProvider(extension, checkSelector(selector), provider)
    },
    registerDocumentDropEditProvider (selector: vscode.DocumentSelector, provider: vscode.DocumentDropEditProvider): vscode.Disposable {
      const { extHostLanguageFeatures } = getExtHostServices()
      const extension = getExtension()

      return extHostLanguageFeatures.registerDocumentOnDropEditProvider(extension, selector, provider)
    }
  }
}
