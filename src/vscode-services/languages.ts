import type * as vscode from 'vscode'
import { score } from 'vs/editor/common/languageSelector'
import * as typeConvert from 'vs/workbench/api/common/extHostTypeConverters'
import * as monaco from 'monaco-editor'
import { ISuggestResultDtoField, reviveWorkspaceEditDto, ICodeActionDto, ISignatureHelpProviderMetadataDto, ILinkDto, IInlayHintDto } from 'vs/workbench/api/common/extHost.protocol'
import * as adapters from 'vs/workbench/api/common/extHostLanguageFeatures'
import { MainThreadLanguageFeatures } from 'vs/workbench/api/browser/mainThreadLanguageFeatures'
import * as languages from 'vs/editor/common/languages'
import { mixin } from 'vs/base/common/objects'
import { decodeSemanticTokensDto } from 'vs/editor/common/services/semanticTokensDto'
import { revive } from 'vs/base/common/marshalling'
import { CancellationError } from 'vs/base/common/errors'
import { SnippetParser } from 'vs/editor/contrib/snippet/browser/snippetParser'
import { extensionDescription, extHostApiDeprecationService, extHostCommands, extHostDiagnostics, extHostDocuments, extHostLogService } from './extHost'
import { Services } from '../services'
import { unsupported } from '../tools'

const workspace: typeof vscode.languages = {
  match (selector, document): number {
    return score(typeConvert.LanguageSelector.from(selector), document.uri, document.languageId, true, undefined, undefined)
  },
  createDiagnosticCollection (name?: string): vscode.DiagnosticCollection {
    return extHostDiagnostics.createDiagnosticCollection(extensionDescription.identifier, name)
  },
  get onDidChangeDiagnostics () {
    return extHostDiagnostics.onDidChangeDiagnostics
  },
  getDiagnostics: (resource?: vscode.Uri) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <any>extHostDiagnostics.getDiagnostics(resource)
  },
  registerCompletionItemProvider (documentSelector, provider, ...triggerCharacters) {
    const adapter = new adapters.CompletionsAdapter(
      extHostDocuments,
      extHostCommands.converter,
      provider,
      extHostApiDeprecationService,
      extensionDescription
    )

    return monaco.languages.registerCompletionItemProvider(typeConvert.DocumentSelector.from(documentSelector), {
      triggerCharacters,
      async provideCompletionItems (model, position, context, token) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await adapter.provideCompletionItems(model.uri, position, <any>context, token)
        if (result == null) {
          return result
        }
        return {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          suggestions: <any>result[ISuggestResultDtoField.completions].map(d => MainThreadLanguageFeatures._inflateSuggestDto(result[ISuggestResultDtoField.defaultRanges], d)),
          incomplete: result[ISuggestResultDtoField.isIncomplete] || false,
          dispose: () => {
            if (typeof result.x === 'number') {
              adapter.releaseCompletionItems(result.x)
            }
          }
        }
      },
      resolveCompletionItem: adapters.CompletionsAdapter.supportsResolving(provider)
        ? async (_suggestion, token) => {
          const suggestion = _suggestion as unknown as languages.CompletionItem
          const result = await adapter.resolveCompletionItem(suggestion._id!, token)
          if (result == null) {
            return suggestion
          }

          const newSuggestion = MainThreadLanguageFeatures._inflateSuggestDto(suggestion.range, result)
          return mixin(suggestion, newSuggestion, true)
        }
        : undefined
    })
  },
  registerCodeActionsProvider (documentSelector, provider, metadata) {
    const adapter = new adapters.CodeActionAdapter(
      extHostDocuments,
      extHostCommands.converter,
      extHostDiagnostics,
      provider,
      extHostLogService,
      extensionDescription,
      extHostApiDeprecationService
    )

    return monaco.languages.registerCodeActionProvider(documentSelector, {
      async provideCodeActions (model, range, context, token) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const listDto = await adapter.provideCodeActions(model.uri, range, {
          ...context,
          trigger: languages.CodeActionTriggerType.Invoke // FIXME (https://github.com/microsoft/vscode/pull/149937)
        }, token)
        if (listDto == null) {
          return undefined
        }
        return <monaco.languages.CodeActionList>{
          actions: MainThreadLanguageFeatures._reviveCodeActionDto(listDto.actions),
          dispose: () => {
            if (typeof listDto.cacheId === 'number') {
              adapter.releaseCodeActions(listDto.cacheId)
            }
          }
        }
      },
      resolveCodeAction: provider.resolveCodeAction != null
        ? async (_codeAction, token) => {
          const codeAction = _codeAction as unknown as languages.CodeAction
          const data = await adapter.resolveCodeAction((<ICodeActionDto>codeAction).cacheId!, token)
          codeAction.edit = reviveWorkspaceEditDto(data)
          return _codeAction
        }
        : undefined
    }, {
      // FIXME add documentation (https://github.com/microsoft/vscode/pull/149937)
      providedCodeActionKinds: metadata?.providedCodeActionKinds?.map(kind => kind.value)
    })
  },
  registerCodeLensProvider (documentSelector, provider) {
    const adapter = new adapters.CodeLensAdapter(
      extHostDocuments,
      extHostCommands.converter,
      provider
    )

    return monaco.languages.registerCodeLensProvider(documentSelector, {
      provideCodeLenses: async (model, token): Promise<languages.CodeLensList | undefined> => {
        const listDto = await adapter.provideCodeLenses(model.uri, token)
        if (listDto == null) {
          return undefined
        }
        return {
          lenses: listDto.lenses,
          dispose: () => listDto.cacheId != null && adapter.releaseCodeLenses(listDto.cacheId)
        }
      },
      resolveCodeLens: (_model, codeLens, token): Promise<languages.CodeLens | undefined> => {
        return adapter.resolveCodeLens(codeLens, token)
      }
    })
  },
  registerDefinitionProvider (documentSelector, provider) {
    const adapter = new adapters.DefinitionAdapter(
      extHostDocuments,
      provider
    )

    return monaco.languages.registerDefinitionProvider(documentSelector, {
      provideDefinition: (model, position, token): Promise<languages.LocationLink[]> => {
        return adapter.provideDefinition(model.uri, position, token).then(MainThreadLanguageFeatures._reviveLocationLinkDto)
      }
    })
  },
  registerImplementationProvider (documentSelector, provider) {
    const adapter = new adapters.ImplementationAdapter(
      extHostDocuments,
      provider
    )
    return monaco.languages.registerImplementationProvider(documentSelector, {
      provideImplementation: (model, position, token): Promise<languages.LocationLink[]> => {
        return adapter.provideImplementation(model.uri, position, token).then(MainThreadLanguageFeatures._reviveLocationLinkDto)
      }
    })
  },
  registerTypeDefinitionProvider (documentSelector, provider) {
    const adapter = new adapters.TypeDefinitionAdapter(
      extHostDocuments,
      provider
    )
    return monaco.languages.registerTypeDefinitionProvider(documentSelector, {
      provideTypeDefinition: (model, position, token): Promise<languages.LocationLink[]> => {
        return adapter.provideTypeDefinition(model.uri, position, token).then(MainThreadLanguageFeatures._reviveLocationLinkDto)
      }
    })
  },
  registerDeclarationProvider (documentSelector, provider) {
    const adapter = new adapters.DeclarationAdapter(
      extHostDocuments,
      provider
    )
    return monaco.languages.registerDeclarationProvider(documentSelector, {
      provideDeclaration: (model, position, token) => {
        return adapter.provideDeclaration(model.uri, position, token).then(MainThreadLanguageFeatures._reviveLocationLinkDto)
      }
    })
  },
  registerHoverProvider (documentSelector, provider) {
    const adapter = new adapters.HoverAdapter(
      extHostDocuments,
      provider
    )
    return monaco.languages.registerHoverProvider(documentSelector, {
      provideHover: (model, position, token) => {
        return adapter.provideHover(model.uri, position, token)
      }
    })
  },
  registerDocumentHighlightProvider (documentSelector, provider) {
    const adapter = new adapters.DocumentHighlightAdapter(
      extHostDocuments,
      provider
    )
    return monaco.languages.registerDocumentHighlightProvider(documentSelector, {
      provideDocumentHighlights: (model, position, token) => {
        return adapter.provideDocumentHighlights(model.uri, position, token)
      }
    })
  },
  registerDocumentSymbolProvider (documentSelector, provider, metadata) {
    const adapter = new adapters.DocumentSymbolAdapter(
      extHostDocuments,
      provider
    )
    const displayName = metadata?.label ?? adapters.ExtHostLanguageFeatures._extLabel(extensionDescription)
    return monaco.languages.registerDocumentSymbolProvider(documentSelector, {
      displayName,
      provideDocumentSymbols: (model, token) => {
        return adapter.provideDocumentSymbols(model.uri, token) as unknown as monaco.languages.DocumentSymbol[]
      }
    })
  },
  registerReferenceProvider (documentSelector, provider) {
    const adapter = new adapters.ReferenceAdapter(
      extHostDocuments,
      provider
    )
    return monaco.languages.registerReferenceProvider(documentSelector, {
      provideReferences: (model, position, context, token): Promise<languages.Location[]> => {
        return adapter.provideReferences(model.uri, position, context, token).then(MainThreadLanguageFeatures._reviveLocationDto)
      }
    })
  },
  registerRenameProvider (documentSelector, provider) {
    const adapter = new adapters.RenameAdapter(
      extHostDocuments,
      provider,
      extHostLogService
    )
    return monaco.languages.registerRenameProvider(documentSelector, {
      provideRenameEdits: (model, position, newName, token) => {
        return adapter.provideRenameEdits(model.uri, position, newName, token).then(reviveWorkspaceEditDto)
      },
      resolveRenameLocation: adapters.RenameAdapter.supportsResolving(provider)
        ? (model, position, token): Promise<languages.RenameLocation | undefined> => adapter.resolveRenameLocation(model.uri, position, token)
        : undefined
    })
  },
  registerDocumentFormattingEditProvider (documentSelector, provider) {
    const adapter = new adapters.DocumentFormattingAdapter(
      extHostDocuments,
      provider
    )
    return monaco.languages.registerDocumentFormattingEditProvider(documentSelector, {
      displayName: extensionDescription.displayName ?? extensionDescription.name,
      provideDocumentFormattingEdits: (model, options, token) => {
        return adapter.provideDocumentFormattingEdits(model.uri, options, token) as unknown as monaco.languages.TextEdit[]
      }
    })
  },
  registerDocumentRangeFormattingEditProvider (documentSelector, provider) {
    const adapter = new adapters.RangeFormattingAdapter(
      extHostDocuments,
      provider
    )
    return monaco.languages.registerDocumentRangeFormattingEditProvider(documentSelector, {
      displayName: extensionDescription.displayName ?? extensionDescription.name,
      provideDocumentRangeFormattingEdits: (model, range, options, token) => {
        return adapter.provideDocumentRangeFormattingEdits(model.uri, range, options, token) as unknown as monaco.languages.TextEdit[]
      }
    })
  },
  registerOnTypeFormattingEditProvider (documentSelector, provider, firstTriggerCharacter, ...moreTriggerCharacter) {
    const adapter = new adapters.OnTypeFormattingAdapter(
      extHostDocuments,
      provider
    )
    return monaco.languages.registerOnTypeFormattingEditProvider(documentSelector, {
      autoFormatTriggerCharacters: [firstTriggerCharacter].concat(moreTriggerCharacter),
      provideOnTypeFormattingEdits: (model, position, ch: string, options, token) => {
        return adapter.provideOnTypeFormattingEdits(model.uri, position, ch, options, token) as unknown as monaco.languages.TextEdit[]
      }
    })
  },
  registerSignatureHelpProvider (selector: vscode.DocumentSelector, provider: vscode.SignatureHelpProvider, firstItem?: string | vscode.SignatureHelpProviderMetadata, ...remaining: string[]) {
    const adapter = new adapters.SignatureHelpAdapter(
      extHostDocuments,
      provider
    )
    let metadataOrTriggerChars: vscode.SignatureHelpProviderMetadata | string[]
    if (typeof firstItem === 'object') {
      metadataOrTriggerChars = firstItem
    } else {
      metadataOrTriggerChars = typeof firstItem === 'undefined' ? [] : [firstItem, ...remaining]
    }
    const metadata: ISignatureHelpProviderMetadataDto | undefined = Array.isArray(metadataOrTriggerChars)
      ? { triggerCharacters: metadataOrTriggerChars, retriggerCharacters: [] }
      : metadataOrTriggerChars

    return monaco.languages.registerSignatureHelpProvider(selector, {
      signatureHelpTriggerCharacters: metadata.triggerCharacters,
      signatureHelpRetriggerCharacters: metadata.retriggerCharacters,

      provideSignatureHelp: async (model, position, token, context) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await adapter.provideSignatureHelp(model.uri, position, <any>context, token)
        if (result == null) {
          return undefined
        }
        return {
          value: result,
          dispose: () => {
            adapter.releaseSignatureHelp(result.id)
          }
        }
      }
    })
  },
  registerDocumentLinkProvider (documentSelector, provider) {
    const adapter = new adapters.LinkProviderAdapter(
      extHostDocuments,
      provider
    )
    return monaco.languages.registerLinkProvider(documentSelector, {
      provideLinks: (model, token) => {
        return adapter.provideLinks(model.uri, token).then(dto => {
          if (dto == null) {
            return undefined
          }
          return {
            links: dto.links.map(MainThreadLanguageFeatures._reviveLinkDTO),
            dispose: () => {
              if (typeof dto.cacheId === 'number') {
                adapter.releaseLinks(dto.cacheId)
              }
            }
          }
        })
      },
      resolveLink: provider.resolveDocumentLink != null
        ? (link, token) => {
            const dto: ILinkDto = link
            if (dto.cacheId == null) {
              return link
            }
            return adapter.resolveLink(dto.cacheId, token).then(obj => {
              return obj != null ? MainThreadLanguageFeatures._reviveLinkDTO(obj) : undefined
            })
          }
        : undefined
    })
  },
  registerColorProvider (documentSelector, provider) {
    const adapter = new adapters.ColorProviderAdapter(
      extHostDocuments,
      provider
    )
    return monaco.languages.registerColorProvider(documentSelector, {
      provideDocumentColors: (model, token) => {
        return adapter.provideColors(model.uri, token)
          .then(documentColors => {
            return documentColors.map(documentColor => {
              const [red, green, blue, alpha] = documentColor.color
              const color = {
                red,
                green,
                blue,
                alpha
              }

              return {
                color,
                range: documentColor.range
              }
            })
          })
      },

      provideColorPresentations: (model, colorInfo, token) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <any>adapter.provideColorPresentations(model.uri, {
          color: [colorInfo.color.red, colorInfo.color.green, colorInfo.color.blue, colorInfo.color.alpha],
          range: colorInfo.range
        }, token)
      }
    })
  },
  registerFoldingRangeProvider (documentSelector, provider) {
    const adapter = new adapters.FoldingProviderAdapter(
      extHostDocuments,
      provider
    )
    return monaco.languages.registerFoldingRangeProvider(documentSelector, {
      provideFoldingRanges: (model, context, token) => {
        return adapter.provideFoldingRanges(model.uri, context, token)
      }
    })
  },
  registerSelectionRangeProvider (documentSelector, provider) {
    const adapter = new adapters.SelectionRangeAdapter(
      extHostDocuments,
      provider,
      extHostLogService
    )
    return monaco.languages.registerSelectionRangeProvider(documentSelector, {
      provideSelectionRanges: (model, positions, token) => {
        return adapter.provideSelectionRanges(model.uri, positions, token)
      }
    })
  },
  registerDocumentSemanticTokensProvider (documentSelector: vscode.DocumentSelector, provider: vscode.DocumentSemanticTokensProvider, legend: vscode.SemanticTokensLegend) {
    const adapter = new adapters.DocumentSemanticTokensAdapter(
      extHostDocuments,
      provider
    )

    return monaco.languages.registerDocumentSemanticTokensProvider(documentSelector, {
      getLegend: () => legend,
      provideDocumentSemanticTokens: async (model, lastResultId, token) => {
        const nLastResultId = lastResultId != null ? parseInt(lastResultId, 10) : 0
        const encodedDto = await adapter.provideDocumentSemanticTokens(model.uri, nLastResultId, token)
        if (encodedDto == null) {
          return null
        }
        if (token.isCancellationRequested) {
          return null
        }
        const dto = decodeSemanticTokensDto(encodedDto)
        if (dto.type === 'full') {
          return {
            resultId: String(dto.id),
            data: dto.data
          }
        }
        return {
          resultId: String(dto.id),
          edits: dto.deltas
        }
      },
      releaseDocumentSemanticTokens: (resultId) => {
        if (resultId != null) {
          void adapter.releaseDocumentSemanticColoring(parseInt(resultId, 10))
        }
      }
    })
  },
  registerDocumentRangeSemanticTokensProvider (documentSelector: vscode.DocumentSelector, provider: vscode.DocumentRangeSemanticTokensProvider, legend: vscode.SemanticTokensLegend) {
    const adapter = new adapters.DocumentRangeSemanticTokensAdapter(
      extHostDocuments,
      provider
    )
    return monaco.languages.registerDocumentRangeSemanticTokensProvider(documentSelector, {
      getLegend: () => legend,
      provideDocumentRangeSemanticTokens: async (model, range, token) => {
        const encodedDto = await adapter.provideDocumentRangeSemanticTokens(model.uri, range, token)
        if (encodedDto == null) {
          return null
        }
        if (token.isCancellationRequested) {
          return null
        }
        const dto = decodeSemanticTokensDto(encodedDto)
        if (dto.type === 'full') {
          return {
            resultId: String(dto.id),
            data: dto.data
          }
        }
        throw new Error('Unexpected')
      }
    })
  },
  registerInlayHintsProvider (documentSelector: vscode.DocumentSelector, provider: vscode.InlayHintsProvider) {
    const adapter = new adapters.InlayHintsAdapter(
      extHostDocuments,
      extHostCommands.converter,
      provider,
      extHostLogService,
      extensionDescription
    )

    return monaco.languages.registerInlayHintsProvider(documentSelector, {
      displayName: adapters.ExtHostLanguageFeatures._extLabel(extensionDescription),
      provideInlayHints: async (model, range, token): Promise<languages.InlayHintList | undefined> => {
        const result = await adapter.provideInlayHints(model.uri, range, token)
        if (result == null) {
          return
        }
        return {
          hints: revive(result.hints),
          dispose: () => {
            if (result.cacheId != null) {
              adapter.releaseHints(result.cacheId)
            }
          }
        }
      },
      resolveInlayHint: provider.resolveInlayHint != null
        ? async (hint, token) => {
          const dto: IInlayHintDto = hint
          if (dto.cacheId == null) {
            return hint
          }
          const result = await adapter.resolveInlayHint(dto.cacheId, token)
          if (token.isCancellationRequested) {
            throw new CancellationError()
          }
          if (result == null) {
            return hint
          }
          return {
            ...hint,
            tooltip: result.tooltip,
            label: revive<string | languages.InlayHintLabelPart[]>(result.label)
          }
        }
        : undefined
    })
  },
  async getLanguages () {
    return monaco.languages.getLanguages().map(language => language.id)
  },
  async setTextDocumentLanguage (document, languageId) {
    const model = monaco.editor.getModel(document.uri)
    if (model == null) {
      throw new Error(`document '${document.uri.toString()}' NOT found`)
    }
    monaco.editor.setModelLanguage(model, languageId)
    return extHostDocuments.getDocument(document.uri)
  },
  setLanguageConfiguration: monaco.languages.setLanguageConfiguration,

  registerEvaluatableExpressionProvider: (documentSelector: vscode.DocumentSelector, provider: vscode.EvaluatableExpressionProvider) => {
    const adapter = new adapters.EvaluatableExpressionAdapter(
      extHostDocuments,
      provider
    )

    return Services.get().languages?.registerEvaluatableExpressionProvider?.(documentSelector, {
      provideEvaluatableExpression: (model, position, token) => {
        return adapter.provideEvaluatableExpression(model.uri, position, token)
      }
    }) ?? {
      dispose: () => {}
    }
  },
  registerLinkedEditingRangeProvider: (documentSelector: vscode.DocumentSelector, provider: vscode.LinkedEditingRangeProvider) => {
    const adapter = new adapters.LinkedEditingRangeAdapter(
      extHostDocuments,
      provider
    )
    return monaco.languages.registerLinkedEditingRangeProvider(documentSelector, {
      provideLinkedEditingRanges: async (model, position, token) => {
        const res = await adapter.provideLinkedEditingRanges(model.uri, position, token)
        if (res != null) {
          return {
            ranges: res.ranges,
            wordPattern: res.wordPattern
          }
        }
        return undefined
      }
    })
  },
  registerInlineCompletionItemProvider: (documentSelector: vscode.DocumentSelector, provider: vscode.InlineCompletionItemProvider) => {
    const adapter = new adapters.InlineCompletionAdapter(extensionDescription, extHostDocuments, provider, extHostCommands.converter)

    // FIXME remove those types and use official ones when monaco@0.34 is out
    interface IdentifiableInlineCompletion extends monaco.languages.InlineCompletion {
      idx: number
    }
    interface IdentifiableInlineCompletions extends monaco.languages.InlineCompletions<IdentifiableInlineCompletion> {
      pid: number
    }

    const _provider: monaco.languages.InlineCompletionsProvider<IdentifiableInlineCompletions> = {
      provideInlineCompletions: async (model, position, context, token): Promise<IdentifiableInlineCompletions | undefined> => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await adapter.provideInlineCompletions(model.uri, position, <any>context, token)
        if (result == null) {
          return undefined
        }

        return {
          ...result,
          items: result.items.map(({ insertText, ...item }) => ({
            ...item,
            text: typeof insertText === 'string' ? insertText : new SnippetParser().parse(insertText.snippet).toString()
          }))
        }
      },
      handleItemDidShow: async (completions: IdentifiableInlineCompletions, item: IdentifiableInlineCompletion) => {
        if (adapter.supportsHandleDidShowCompletionItem) {
          adapter.handleDidShowCompletionItem(completions.pid, item.idx)
        }
      },
      freeInlineCompletions: function (completions: IdentifiableInlineCompletions): void {
        adapter.disposeCompletions(completions.pid)
      }
    }

    return monaco.languages.registerInlineCompletionsProvider(documentSelector, _provider)
  },
  registerTypeHierarchyProvider: (documentSelector: vscode.DocumentSelector, provider: vscode.TypeHierarchyProvider) => {
    const adapter = new adapters.TypeHierarchyAdapter(
      extHostDocuments,
      provider
    )

    return Services.get().languages?.registerTypeHierarchyProvider?.(documentSelector, {
      prepareTypeHierarchy: async (model, position, token) => {
        const items = await adapter.prepareSession(model.uri, position, token)
        if (items == null) {
          return undefined
        }
        return {
          dispose: () => {
            for (const item of items) {
              adapter.releaseSession(item._sessionId)
            }
          },

          roots: items.map(MainThreadLanguageFeatures._reviveTypeHierarchyItemDto)
        }
      },

      provideSupertypes: async (item, token) => {
        const supertypes = await adapter.provideSupertypes(item._sessionId, item._itemId, token)
        if (supertypes == null) {
          return supertypes
        }

        return supertypes.map(MainThreadLanguageFeatures._reviveTypeHierarchyItemDto)
      },
      provideSubtypes: async (item, token) => {
        const subtypes = await adapter.provideSubtypes(item._sessionId, item._itemId, token)
        if (subtypes == null) {
          return subtypes
        }

        return subtypes.map(MainThreadLanguageFeatures._reviveTypeHierarchyItemDto)
      }
    }) ?? {
      dispose: () => {}
    }
  },
  registerCallHierarchyProvider: (documentSelector: vscode.DocumentSelector, provider: vscode.CallHierarchyProvider) => {
    const adapter = new adapters.CallHierarchyAdapter(
      extHostDocuments,
      provider
    )

    return Services.get().languages?.registerCallHierarchyProvider?.(documentSelector, {
      prepareCallHierarchy: async (model, position, token) => {
        const items = await adapter.prepareSession(model.uri, position, token)
        if ((items == null) || items.length === 0) {
          return undefined
        }
        return {
          dispose: () => {
            for (const item of items) {
              adapter.releaseSession(item._sessionId)
            }
          },

          roots: items.map(MainThreadLanguageFeatures._reviveCallHierarchyItemDto)
        }
      },

      provideOutgoingCalls: async (item, token) => {
        const outgoing = await adapter.provideCallsFrom(item._sessionId, item._itemId, token)
        if (outgoing == null) {
          return outgoing
        }
        outgoing.forEach(value => {
          value.to = MainThreadLanguageFeatures._reviveCallHierarchyItemDto(value.to)
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <any>outgoing
      },
      provideIncomingCalls: async (item, token) => {
        const incoming = await adapter.provideCallsTo(item._sessionId, item._itemId, token)
        if (incoming == null) {
          return incoming
        }
        incoming.forEach(value => {
          value.from = MainThreadLanguageFeatures._reviveCallHierarchyItemDto(value.from)
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <any>incoming
      }
    }) ?? {
      dispose: () => {}
    }
  },
  registerWorkspaceSymbolProvider: (provider: vscode.WorkspaceSymbolProvider) => {
    const adapter = new adapters.NavigateTypeAdapter(
      provider,
      extHostLogService
    )

    let lastResultId: number | undefined
    return Services.get().languages?.registerNavigateTypeSupport?.({
      provideWorkspaceSymbols: async (search, token) => {
        const result = await adapter.provideWorkspaceSymbols(search, token)
        if (lastResultId !== undefined) {
          adapter.releaseWorkspaceSymbols(lastResultId)
        }
        lastResultId = result.cacheId

        return MainThreadLanguageFeatures._reviveWorkspaceSymbolDto(result.symbols)
      },

      resolveWorkspaceSymbol: provider.resolveWorkspaceSymbol != null
        ? async (item, token) => {
          const resolvedItem = await adapter.resolveWorkspaceSymbol(item, token)

          return resolvedItem != null ? MainThreadLanguageFeatures._reviveWorkspaceSymbolDto(resolvedItem) : undefined
        }
        : undefined
    }) ?? {
      dispose: () => {}
    }
  },

  registerInlineValuesProvider: unsupported, // FIXME: Isn't implemented in monaco for the moment
  createLanguageStatusItem: unsupported
}

export default workspace
