import type { IDisposable } from 'vs/base/common/lifecycle'
import {
  MainContext,
  type MainThreadChatAgentsShape2,
  type MainThreadChatContextShape,
  type MainThreadChatDebugShape,
  type MainThreadChatInputNotificationShape,
  type MainThreadChatQuotaShape,
  type MainThreadChatSessionsShape,
  type MainThreadChatStatusShape,
  type MainThreadCodeMapperShape,
  type MainThreadLanguageModelToolsShape,
  type MainThreadLanguageModelsShape,
  type MainThreadMcpShape,
  type MainThreadNotebookDocumentsShape,
  type MainThreadNotebookEditorsShape,
  type MainThreadNotebookKernelsShape,
  type MainThreadNotebookRenderersShape,
  type MainThreadNotebookShape
} from 'vs/workbench/api/common/extHost.protocol'
import {
  extHostCustomer,
  type IExtHostContext
} from 'vs/workbench/services/extensions/common/extHostCustomers'
import type { ProxyIdentifier } from 'vs/workbench/services/extensions/common/proxyIdentifier'
import { noop, Unsupported, unsupported } from '../../tools.js'

// Main thread counterparts of the extension host API of optional features (chat, language models, notebooks, mcp)
// Their actual implementations are only registered by the corresponding service overrides, but the extension host
// requires all of them to be registered, and some of them are called when the extension host starts
// (e.g. `ExtHostLanguageModelTools` calls `$getTools`)

class MissingMainThreadLanguageModels implements MainThreadLanguageModelsShape {
  $registerLanguageModelProvider: MainThreadLanguageModelsShape['$registerLanguageModelProvider'] =
    noop
  $onLMProviderChange: MainThreadLanguageModelsShape['$onLMProviderChange'] = noop
  $unregisterProvider: MainThreadLanguageModelsShape['$unregisterProvider'] = noop
  @Unsupported
  $tryStartChatRequest: MainThreadLanguageModelsShape['$tryStartChatRequest'] = unsupported
  $reportResponsePart: MainThreadLanguageModelsShape['$reportResponsePart'] = async () => {}
  $reportResponseDone: MainThreadLanguageModelsShape['$reportResponseDone'] = async () => {}
  $selectChatModels: MainThreadLanguageModelsShape['$selectChatModels'] = async () => []
  @Unsupported
  $countTokens: MainThreadLanguageModelsShape['$countTokens'] = unsupported
  $cancelLanguageModelChatRequest: MainThreadLanguageModelsShape['$cancelLanguageModelChatRequest'] =
    noop
  $fileIsIgnored: MainThreadLanguageModelsShape['$fileIsIgnored'] = async () => false
  $registerFileIgnoreProvider: MainThreadLanguageModelsShape['$registerFileIgnoreProvider'] = noop
  $unregisterFileIgnoreProvider: MainThreadLanguageModelsShape['$unregisterFileIgnoreProvider'] =
    noop
  dispose(): void {}
}

class MissingMainThreadChatAgents2 implements MainThreadChatAgentsShape2 {
  $handleProgressChunk: MainThreadChatAgentsShape2['$handleProgressChunk'] = async () => {}
  $handleAnchorResolve: MainThreadChatAgentsShape2['$handleAnchorResolve'] = noop
  $registerAgent: MainThreadChatAgentsShape2['$registerAgent'] = noop
  $registerChatParticipantDetectionProvider: MainThreadChatAgentsShape2['$registerChatParticipantDetectionProvider'] =
    noop
  $unregisterChatParticipantDetectionProvider: MainThreadChatAgentsShape2['$unregisterChatParticipantDetectionProvider'] =
    noop
  $registerPromptFileProvider: MainThreadChatAgentsShape2['$registerPromptFileProvider'] = noop
  $unregisterPromptFileProvider: MainThreadChatAgentsShape2['$unregisterPromptFileProvider'] = noop
  $onDidChangePromptFiles: MainThreadChatAgentsShape2['$onDidChangePromptFiles'] = noop
  $registerChatSessionCustomizationProvider: MainThreadChatAgentsShape2['$registerChatSessionCustomizationProvider'] =
    noop
  $unregisterChatSessionCustomizationProvider: MainThreadChatAgentsShape2['$unregisterChatSessionCustomizationProvider'] =
    noop
  $onDidChangeCustomizations: MainThreadChatAgentsShape2['$onDidChangeCustomizations'] = noop
  $registerAgentCompletionsProvider: MainThreadChatAgentsShape2['$registerAgentCompletionsProvider'] =
    noop
  $unregisterAgentCompletionsProvider: MainThreadChatAgentsShape2['$unregisterAgentCompletionsProvider'] =
    noop
  $updateAgent: MainThreadChatAgentsShape2['$updateAgent'] = noop
  $unregisterAgent: MainThreadChatAgentsShape2['$unregisterAgent'] = noop
  @Unsupported
  $transferActiveChatSession: MainThreadChatAgentsShape2['$transferActiveChatSession'] = unsupported
  $provideCustomAgents: MainThreadChatAgentsShape2['$provideCustomAgents'] = async () => []
  $provideInstructions: MainThreadChatAgentsShape2['$provideInstructions'] = async () => []
  $provideSkills: MainThreadChatAgentsShape2['$provideSkills'] = async () => []
  $provideSlashCommands: MainThreadChatAgentsShape2['$provideSlashCommands'] = async () => []
  $provideHooks: MainThreadChatAgentsShape2['$provideHooks'] = async () => []
  $providePlugins: MainThreadChatAgentsShape2['$providePlugins'] = async () => []
  dispose(): void {}
}

class MissingMainThreadCodeMapper implements MainThreadCodeMapperShape {
  $registerCodeMapperProvider: MainThreadCodeMapperShape['$registerCodeMapperProvider'] = noop
  $unregisterCodeMapperProvider: MainThreadCodeMapperShape['$unregisterCodeMapperProvider'] = noop
  $handleProgress: MainThreadCodeMapperShape['$handleProgress'] = async () => {}
  dispose(): void {}
}

class MissingMainThreadLanguageModelTools implements MainThreadLanguageModelToolsShape {
  $getTools: MainThreadLanguageModelToolsShape['$getTools'] = async () => []
  $acceptToolProgress: MainThreadLanguageModelToolsShape['$acceptToolProgress'] = noop
  @Unsupported
  $invokeTool: MainThreadLanguageModelToolsShape['$invokeTool'] = unsupported
  @Unsupported
  $countTokensForInvocation: MainThreadLanguageModelToolsShape['$countTokensForInvocation'] =
    unsupported
  $registerTool: MainThreadLanguageModelToolsShape['$registerTool'] = noop
  $registerToolWithDefinition: MainThreadLanguageModelToolsShape['$registerToolWithDefinition'] =
    noop
  $unregisterTool: MainThreadLanguageModelToolsShape['$unregisterTool'] = noop
  dispose(): void {}
}

class MissingMainThreadChatContext implements MainThreadChatContextShape {
  $registerChatWorkspaceContextProvider: MainThreadChatContextShape['$registerChatWorkspaceContextProvider'] =
    noop
  $registerChatExplicitContextProvider: MainThreadChatContextShape['$registerChatExplicitContextProvider'] =
    noop
  $registerChatResourceContextProvider: MainThreadChatContextShape['$registerChatResourceContextProvider'] =
    noop
  $unregisterChatContextProvider: MainThreadChatContextShape['$unregisterChatContextProvider'] =
    noop
  $updateWorkspaceContextItems: MainThreadChatContextShape['$updateWorkspaceContextItems'] = noop
  @Unsupported
  $executeChatContextItemCommand: MainThreadChatContextShape['$executeChatContextItemCommand'] =
    unsupported
  dispose(): void {}
}

class MissingMainThreadChatDebug implements MainThreadChatDebugShape {
  $registerChatDebugLogProvider: MainThreadChatDebugShape['$registerChatDebugLogProvider'] = noop
  $unregisterChatDebugLogProvider: MainThreadChatDebugShape['$unregisterChatDebugLogProvider'] =
    noop
  $acceptChatDebugEvent: MainThreadChatDebugShape['$acceptChatDebugEvent'] = noop
  $subscribeToCoreDebugEvents: MainThreadChatDebugShape['$subscribeToCoreDebugEvents'] = noop
  $unsubscribeFromCoreDebugEvents: MainThreadChatDebugShape['$unsubscribeFromCoreDebugEvents'] =
    noop
  dispose(): void {}
}

class MissingMainThreadChatStatus implements MainThreadChatStatusShape {
  $setEntry: MainThreadChatStatusShape['$setEntry'] = noop
  $disposeEntry: MainThreadChatStatusShape['$disposeEntry'] = noop
  dispose(): void {}
}

class MissingMainThreadChatQuota implements MainThreadChatQuotaShape {
  $updateQuotas: MainThreadChatQuotaShape['$updateQuotas'] = noop
  dispose(): void {}
}

class MissingMainThreadChatInputNotification implements MainThreadChatInputNotificationShape {
  $setNotification: MainThreadChatInputNotificationShape['$setNotification'] = noop
  $disposeNotification: MainThreadChatInputNotificationShape['$disposeNotification'] = noop
  dispose(): void {}
}

class MissingMainThreadChatSessions implements MainThreadChatSessionsShape {
  $registerChatSessionItemController: MainThreadChatSessionsShape['$registerChatSessionItemController'] =
    noop
  $updateChatSessionItemControllerCapabilities: MainThreadChatSessionsShape['$updateChatSessionItemControllerCapabilities'] =
    noop
  $unregisterChatSessionItemController: MainThreadChatSessionsShape['$unregisterChatSessionItemController'] =
    noop
  $updateChatSessionItems: MainThreadChatSessionsShape['$updateChatSessionItems'] = async () => {}
  $addOrUpdateChatSessionItem: MainThreadChatSessionsShape['$addOrUpdateChatSessionItem'] =
    async () => {}
  $onDidCommitChatSessionItem: MainThreadChatSessionsShape['$onDidCommitChatSessionItem'] = noop
  $registerChatSessionContentProvider: MainThreadChatSessionsShape['$registerChatSessionContentProvider'] =
    noop
  $unregisterChatSessionContentProvider: MainThreadChatSessionsShape['$unregisterChatSessionContentProvider'] =
    noop
  $onDidChangeChatSessionOptions: MainThreadChatSessionsShape['$onDidChangeChatSessionOptions'] =
    noop
  $onDidChangeChatSessionProviderOptions: MainThreadChatSessionsShape['$onDidChangeChatSessionProviderOptions'] =
    noop
  $updateChatSessionInputState: MainThreadChatSessionsShape['$updateChatSessionInputState'] = noop
  $handleProgressChunk: MainThreadChatSessionsShape['$handleProgressChunk'] = async () => {}
  $handleAnchorResolve: MainThreadChatSessionsShape['$handleAnchorResolve'] = noop
  $handleProgressComplete: MainThreadChatSessionsShape['$handleProgressComplete'] = noop
  dispose(): void {}
}

class MissingMainThreadNotebook implements MainThreadNotebookShape {
  $registerNotebookSerializer: MainThreadNotebookShape['$registerNotebookSerializer'] = noop
  $unregisterNotebookSerializer: MainThreadNotebookShape['$unregisterNotebookSerializer'] = noop
  $registerNotebookCellStatusBarItemProvider: MainThreadNotebookShape['$registerNotebookCellStatusBarItemProvider'] =
    async () => {}
  $unregisterNotebookCellStatusBarItemProvider: MainThreadNotebookShape['$unregisterNotebookCellStatusBarItemProvider'] =
    async () => {}
  $emitCellStatusBarEvent: MainThreadNotebookShape['$emitCellStatusBarEvent'] = noop
  dispose(): void {}
}

class MissingMainThreadNotebookKernels implements MainThreadNotebookKernelsShape {
  $postMessage: MainThreadNotebookKernelsShape['$postMessage'] = async () => false
  $addKernel: MainThreadNotebookKernelsShape['$addKernel'] = async () => {}
  $updateKernel: MainThreadNotebookKernelsShape['$updateKernel'] = noop
  $removeKernel: MainThreadNotebookKernelsShape['$removeKernel'] = noop
  $updateNotebookPriority: MainThreadNotebookKernelsShape['$updateNotebookPriority'] = noop
  $createExecution: MainThreadNotebookKernelsShape['$createExecution'] = noop
  $updateExecution: MainThreadNotebookKernelsShape['$updateExecution'] = noop
  $completeExecution: MainThreadNotebookKernelsShape['$completeExecution'] = noop
  $createNotebookExecution: MainThreadNotebookKernelsShape['$createNotebookExecution'] = noop
  $beginNotebookExecution: MainThreadNotebookKernelsShape['$beginNotebookExecution'] = noop
  $completeNotebookExecution: MainThreadNotebookKernelsShape['$completeNotebookExecution'] = noop
  $addKernelDetectionTask: MainThreadNotebookKernelsShape['$addKernelDetectionTask'] =
    async () => {}
  $removeKernelDetectionTask: MainThreadNotebookKernelsShape['$removeKernelDetectionTask'] = noop
  $addKernelSourceActionProvider: MainThreadNotebookKernelsShape['$addKernelSourceActionProvider'] =
    async () => {}
  $removeKernelSourceActionProvider: MainThreadNotebookKernelsShape['$removeKernelSourceActionProvider'] =
    noop
  $emitNotebookKernelSourceActionsChangeEvent: MainThreadNotebookKernelsShape['$emitNotebookKernelSourceActionsChangeEvent'] =
    noop
  $receiveVariable: MainThreadNotebookKernelsShape['$receiveVariable'] = noop
  $variablesUpdated: MainThreadNotebookKernelsShape['$variablesUpdated'] = noop
  dispose(): void {}
}

class MissingMainThreadNotebookDocuments implements MainThreadNotebookDocumentsShape {
  @Unsupported
  $tryCreateNotebook: MainThreadNotebookDocumentsShape['$tryCreateNotebook'] = unsupported
  @Unsupported
  $tryOpenNotebook: MainThreadNotebookDocumentsShape['$tryOpenNotebook'] = unsupported
  @Unsupported
  $trySaveNotebook: MainThreadNotebookDocumentsShape['$trySaveNotebook'] = unsupported
  dispose(): void {}
}

class MissingMainThreadNotebookEditors implements MainThreadNotebookEditorsShape {
  @Unsupported
  $tryShowNotebookDocument: MainThreadNotebookEditorsShape['$tryShowNotebookDocument'] = unsupported
  @Unsupported
  $tryRevealRange: MainThreadNotebookEditorsShape['$tryRevealRange'] = unsupported
  $trySetSelections: MainThreadNotebookEditorsShape['$trySetSelections'] = noop
  dispose(): void {}
}

class MissingMainThreadNotebookRenderers implements MainThreadNotebookRenderersShape {
  $postMessage: MainThreadNotebookRenderersShape['$postMessage'] = async () => false
  dispose(): void {}
}

class MissingMainThreadMcp implements MainThreadMcpShape {
  $onDidChangeState: MainThreadMcpShape['$onDidChangeState'] = noop
  $onDidPublishLog: MainThreadMcpShape['$onDidPublishLog'] = noop
  $onDidReceiveMessage: MainThreadMcpShape['$onDidReceiveMessage'] = noop
  $upsertMcpCollection: MainThreadMcpShape['$upsertMcpCollection'] = noop
  $deleteMcpCollection: MainThreadMcpShape['$deleteMcpCollection'] = noop
  @Unsupported
  $getTokenFromServerMetadata: MainThreadMcpShape['$getTokenFromServerMetadata'] = unsupported
  @Unsupported
  $getTokenForProviderId: MainThreadMcpShape['$getTokenForProviderId'] = unsupported
  $logMcpAuthSetup: MainThreadMcpShape['$logMcpAuthSetup'] = noop
  @Unsupported
  $startMcpGateway: MainThreadMcpShape['$startMcpGateway'] = unsupported
  $disposeMcpGateway: MainThreadMcpShape['$disposeMcpGateway'] = noop
  dispose(): void {}
}

const missingMainThreadCustomers: [ProxyIdentifier<unknown>, new () => IDisposable][] = [
  [MainContext.MainThreadLanguageModels, MissingMainThreadLanguageModels],
  [MainContext.MainThreadChatAgents2, MissingMainThreadChatAgents2],
  [MainContext.MainThreadCodeMapper, MissingMainThreadCodeMapper],
  [MainContext.MainThreadLanguageModelTools, MissingMainThreadLanguageModelTools],
  [MainContext.MainThreadChatContext, MissingMainThreadChatContext],
  [MainContext.MainThreadChatDebug, MissingMainThreadChatDebug],
  [MainContext.MainThreadChatStatus, MissingMainThreadChatStatus],
  [MainContext.MainThreadChatQuota, MissingMainThreadChatQuota],
  [MainContext.MainThreadChatInputNotification, MissingMainThreadChatInputNotification],
  [MainContext.MainThreadChatSessions, MissingMainThreadChatSessions],
  [MainContext.MainThreadNotebook, MissingMainThreadNotebook],
  [MainContext.MainThreadNotebookKernels, MissingMainThreadNotebookKernels],
  [MainContext.MainThreadNotebookDocuments, MissingMainThreadNotebookDocuments],
  [MainContext.MainThreadNotebookEditors, MissingMainThreadNotebookEditors],
  [MainContext.MainThreadNotebookRenderers, MissingMainThreadNotebookRenderers],
  [MainContext.MainThreadMcp, MissingMainThreadMcp]
]

// Unnamed customers are instantiated after the named ones, and a real implementation set later replaces the missing one,
// so it only registers the missing implementations whatever the import order is
class MissingMainThreadCustomers implements IDisposable {
  constructor(extHostContext: IExtHostContext) {
    for (const [id, ctor] of missingMainThreadCustomers) {
      try {
        extHostContext.assertRegistered([id])
      } catch {
        extHostContext.set(id, new ctor())
      }
    }
  }

  dispose(): void {}
}
extHostCustomer(MissingMainThreadCustomers)
