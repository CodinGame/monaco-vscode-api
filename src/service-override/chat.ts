import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import {
  IChatAccessibilityService,
  IChatCodeBlockContextProviderService,
  IChatWidgetService,
  IQuickChatService
} from 'vs/workbench/contrib/chat/browser/chat.service'
import { ChatAccessibilityService } from 'vs/workbench/contrib/chat/browser/accessibility/chatAccessibilityService'
import { QuickChatService } from 'vs/workbench/contrib/chat/browser/widgetHosts/chatQuick'
import { ChatVariablesService } from 'vs/workbench/contrib/chat/browser/attachments/chatVariables'
import { ChatCodeBlockContextProviderService } from 'vs/workbench/contrib/chat/browser/codeBlockContextProviderService'
import {
  ChatAgentNameService,
  ChatAgentService
} from 'vs/workbench/contrib/chat/common/participants/chatAgents'
import {
  IChatAgentNameService,
  IChatAgentService
} from 'vs/workbench/contrib/chat/common/participants/chatAgents.service'
import { IChatService } from 'vs/workbench/contrib/chat/common/chatService/chatService.service'
import { ChatService } from 'vs/workbench/contrib/chat/common/chatService/chatServiceImpl'
import { ChatSlashCommandService } from 'vs/workbench/contrib/chat/common/participants/chatSlashCommands'
import { IChatSlashCommandService } from 'vs/workbench/contrib/chat/common/participants/chatSlashCommands.service'
import { IChatVariablesService } from 'vs/workbench/contrib/chat/common/attachments/chatVariables.service'
import { ChatWidgetHistoryService } from 'vs/workbench/contrib/chat/common/widget/chatWidgetHistoryService'
import { IChatWidgetHistoryService } from 'vs/workbench/contrib/chat/common/widget/chatWidgetHistoryService.service'
import { ILanguageModelStatsService } from 'vs/workbench/contrib/chat/common/languageModelStats.service'
import { LanguageModelsService } from 'vs/workbench/contrib/chat/common/languageModels'
import { ILanguageModelsService } from 'vs/workbench/contrib/chat/common/languageModels.service'
import { IInlineChatSessionService } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionService.service'
import { InlineChatSessionServiceImpl } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionServiceImpl'
import { LanguageModelStatsService } from 'vs/workbench/contrib/chat/common/languageModelStats'
import { ILanguageModelToolsService } from 'vs/workbench/contrib/chat/common/tools/languageModelToolsService.service'
import { LanguageModelToolsService } from 'vs/workbench/contrib/chat/browser/tools/languageModelToolsService'
import { ICodeMapperService } from 'vs/workbench/contrib/chat/common/editing/chatCodeMapperService.service'
import { CodeMapperService } from 'vs/workbench/contrib/chat/common/editing/chatCodeMapperService'
import { IChatEditingService } from 'vs/workbench/contrib/chat/common/editing/chatEditingService.service'
import { LanguageModelIgnoredFilesService } from 'vs/workbench/contrib/chat/common/ignoredFiles'
import { ILanguageModelIgnoredFilesService } from 'vs/workbench/contrib/chat/common/ignoredFiles.service'
import { IChatMarkdownAnchorService } from 'vs/workbench/contrib/chat/browser/widget/chatContentParts/chatMarkdownAnchorService.service'
import { ChatMarkdownAnchorService } from 'vs/workbench/contrib/chat/browser/widget/chatContentParts/chatMarkdownAnchorService'
import { ChatEditingService } from 'vs/workbench/contrib/chat/browser/chatEditing/chatEditingServiceImpl'
import { ChatEntitlementService } from 'vs/workbench/services/chat/common/chatEntitlementService'
import { PromptsService } from 'vs/workbench/contrib/chat/common/promptSyntax/service/promptsServiceImpl'
import { IChatEntitlementService } from 'vs/workbench/services/chat/common/chatEntitlementService.service'
import { IPromptsService } from 'vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.service'
import { IChatTransferService } from 'vs/workbench/contrib/chat/common/model/chatTransferService.service'
import { ChatTransferService } from 'vs/workbench/contrib/chat/common/model/chatTransferService'
import { IChatContextPickService } from 'vs/workbench/contrib/chat/browser/attachments/chatContextPickService.service'
import { ChatContextPickService } from 'vs/workbench/contrib/chat/browser/attachments/chatContextPickService'
import { IChatAttachmentResolveService } from 'vs/workbench/contrib/chat/browser/attachments/chatAttachmentResolveService.service'
import { ChatAttachmentResolveService } from 'vs/workbench/contrib/chat/browser/attachments/chatAttachmentResolveService'
import { IRemoteCodingAgentsService } from 'vs/workbench/contrib/remoteCodingAgents/common/remoteCodingAgentsService.service'
import { RemoteCodingAgentsService } from 'vs/workbench/contrib/remoteCodingAgents/common/remoteCodingAgentsService'
import { IChatSessionsService } from 'vs/workbench/contrib/chat/common/chatSessionsService.service'
import { ChatSessionsService } from 'vs/workbench/contrib/chat/browser/chatSessions/chatSessions.contribution'
import { ChatOutputRendererService } from 'vs/workbench/contrib/chat/browser/chatOutputItemRenderer'
import { IChatOutputRendererService } from 'vs/workbench/contrib/chat/browser/chatOutputItemRenderer.service'
import { IChatTodoListService } from 'vs/workbench/contrib/chat/common/tools/chatTodoListService.service'
import { ChatTodoListService } from 'vs/workbench/contrib/chat/common/tools/chatTodoListService'
import { IChatLayoutService } from 'vs/workbench/contrib/chat/common/widget/chatLayoutService.service'
import { ChatLayoutService } from 'vs/workbench/contrib/chat/browser/widget/chatLayoutService'
import { IAiEditTelemetryService } from 'vs/workbench/contrib/editTelemetry/browser/telemetry/aiEditTelemetry/aiEditTelemetryService.service'
import { AiEditTelemetryServiceImpl } from 'vs/workbench/contrib/editTelemetry/browser/telemetry/aiEditTelemetry/aiEditTelemetryServiceImpl'
import { IChatModeService } from 'vs/workbench/contrib/chat/common/chatModes.service'
import { ChatModeService } from 'vs/workbench/contrib/chat/common/chatModes'
import { ILanguageModelToolsConfirmationService } from 'vs/workbench/contrib/chat/common/tools/languageModelToolsConfirmationService.service'
import { LanguageModelToolsConfirmationService } from 'vs/workbench/contrib/chat/browser/tools/languageModelToolsConfirmationService'
import { IChatContextService } from 'vs/workbench/contrib/chat/browser/contextContrib/chatContextService.service'
import { ChatContextService } from 'vs/workbench/contrib/chat/browser/contextContrib/chatContextService'
import { ITerminalChatService } from 'vs/workbench/contrib/terminal/browser/terminal.service'
import { TerminalChatService } from 'vs/workbench/contrib/terminalContrib/chat/browser/terminalChatService'
import { ChatStatusItemService } from 'vs/workbench/contrib/chat/browser/chatStatus/chatStatusItemService'
import { IChatStatusItemService } from 'vs/workbench/contrib/chat/browser/chatStatus/chatStatusItemService.service'
import { IAgentSessionsService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.service'
import { AgentSessionsService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService'
import { ChatWidgetService } from 'vs/workbench/contrib/chat/browser/widget/chatWidgetService'
import { ICodeCompareModelService } from 'vs/workbench/contrib/chat/browser/widget/chatContentParts/chatTextEditContentPart.service'
import { CodeCompareModelService } from 'vs/workbench/contrib/chat/browser/widget/chatContentParts/chatTextEditContentPart'
import { IAgentSessionProjectionService } from 'vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionProjectionService.service'
import { IAgentTitleBarStatusService } from 'vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusService.service'
import { ILanguageModelsConfigurationService } from 'vs/workbench/contrib/chat/common/languageModelsConfiguration.service'
import { IChatTipService } from 'vs/workbench/contrib/chat/browser/chatTipService.service'
import { IChatEditingExplanationModelManager } from 'vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationModelManager.service'
import { IChatToolOutputStateCache } from 'vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolOutputStateCache.service'
import { AgentSessionProjectionService } from 'vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionProjectionService'
import { AgentTitleBarStatusService } from 'vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusService'
import { LanguageModelsConfigurationService } from 'vs/workbench/contrib/chat/browser/languageModelsConfigurationService'
import { ChatTipService } from 'vs/workbench/contrib/chat/browser/chatTipService'
import { ChatEditingExplanationModelManager } from 'vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationModelManager'
import { ChatToolOutputStateCache } from 'vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolOutputStateCache'
import { ITerminalSandboxService } from 'vs/workbench/contrib/terminalContrib/chatAgentTools/common/terminalSandboxService.service'
import { TerminalSandboxService } from 'vs/workbench/contrib/terminalContrib/chatAgentTools/common/terminalSandboxService'
import { IAgentFeedbackService } from 'vs/sessions/contrib/agentFeedback/browser/agentFeedbackService.service'
import { AgentFeedbackService } from 'vs/sessions/contrib/agentFeedback/browser/agentFeedbackService'
import { ISessionsConfigurationService } from 'vs/sessions/contrib/chat/browser/sessionsConfigurationService.service'
import { SessionsConfigurationService } from 'vs/sessions/contrib/chat/browser/sessionsConfigurationService'
import { IAICustomizationWorkspaceService } from 'vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.service'
import { SessionsAICustomizationWorkspaceService } from 'vs/sessions/contrib/chat/browser/aiCustomizationWorkspaceService'
import { ISessionsManagementService } from 'vs/sessions/contrib/sessions/browser/sessionsManagementService.service'
import { SessionsManagementService } from 'vs/sessions/contrib/sessions/browser/sessionsManagementService'
import { IAgentPluginService } from 'vs/workbench/contrib/chat/common/plugins/agentPluginService.service'
import { AgentPluginService } from 'vs/workbench/contrib/chat/common/plugins/agentPluginServiceImpl'
import { PluginMarketplaceService } from 'vs/workbench/contrib/chat/common/plugins/pluginMarketplaceService'
import { IPluginMarketplaceService } from 'vs/workbench/contrib/chat/common/plugins/pluginMarketplaceService.service'
import { IAgentPluginRepositoryService } from 'vs/workbench/contrib/chat/common/plugins/agentPluginRepositoryService.service'
import { AgentPluginRepositoryService } from 'vs/workbench/contrib/chat/browser/agentPluginRepositoryService'
import { IPluginInstallService } from 'vs/workbench/contrib/chat/common/plugins/pluginInstallService.service'
import { PluginInstallService } from 'vs/workbench/contrib/chat/browser/pluginInstallService'
import { IChatAttachmentWidgetRegistry } from 'vs/workbench/contrib/chat/browser/attachments/chatAttachmentWidgetRegistry.service'
import { ChatAttachmentWidgetRegistry } from 'vs/workbench/contrib/chat/browser/attachments/chatAttachmentWidgetRegistry'
import { IChatDebugService } from 'vs/workbench/contrib/chat/common/chatDebugService.service'
import { ChatDebugServiceImpl } from 'vs/workbench/contrib/chat/common/chatDebugServiceImpl'
import { IChatResponseResourceFileSystemProvider } from 'vs/workbench/contrib/chat/common/widget/chatResponseResourceFileSystemProvider.service'
import { ChatResponseResourceFileSystemProvider } from 'vs/workbench/contrib/chat/common/widget/chatResponseResourceFileSystemProvider'
import 'vs/workbench/contrib/chat/browser/chat.contribution'
import 'vs/workbench/contrib/terminal/terminal.chat.contribution'
import 'vs/workbench/contrib/inlineChat/browser/inlineChat.contribution'
import 'vs/workbench/contrib/remoteCodingAgents/browser/remoteCodingAgents.contribution'


export interface ChatServiceOverrideOptions {
}

export default function getServiceOverride({}: ChatServiceOverrideOptions = {}): IEditorOverrideServices {
  return {
    [IChatService.toString()]: new SyncDescriptor(ChatService, [], true),
    [IChatWidgetService.toString()]: new SyncDescriptor(ChatWidgetService, [], true),
    [IQuickChatService.toString()]: new SyncDescriptor(QuickChatService, [], true),
    [IChatAccessibilityService.toString()]: new SyncDescriptor(ChatAccessibilityService, [], true),
    [IChatWidgetHistoryService.toString()]: new SyncDescriptor(ChatWidgetHistoryService, [], true),
    [ILanguageModelsService.toString()]: new SyncDescriptor(LanguageModelsService, [], true),
    [IChatSlashCommandService.toString()]: new SyncDescriptor(ChatSlashCommandService, [], true),
    [IChatAgentService.toString()]: new SyncDescriptor(ChatAgentService, [], true),
    [IChatVariablesService.toString()]: new SyncDescriptor(ChatVariablesService, [], true),
    [IInlineChatSessionService.toString()]: new SyncDescriptor(
      InlineChatSessionServiceImpl,
      [],
      true
    ),
    [IChatCodeBlockContextProviderService.toString()]: new SyncDescriptor(
      ChatCodeBlockContextProviderService,
      [],
      true
    ),
    [ILanguageModelStatsService.toString()]: new SyncDescriptor(
      LanguageModelStatsService,
      [],
      true
    ),
    [ILanguageModelIgnoredFilesService.toString()]: new SyncDescriptor(
      LanguageModelIgnoredFilesService,
      [],
      true
    ),
    [IChatAgentNameService.toString()]: new SyncDescriptor(ChatAgentNameService, [], true),
    [ILanguageModelToolsService.toString()]: new SyncDescriptor(
      LanguageModelToolsService,
      [],
      true
    ),
    [ICodeMapperService.toString()]: new SyncDescriptor(CodeMapperService, [], true),
    [IChatEditingService.toString()]: new SyncDescriptor(ChatEditingService, [], true),
    [IChatTransferService.toString()]: new SyncDescriptor(ChatTransferService, [], true),
    [IChatMarkdownAnchorService.toString()]: new SyncDescriptor(
      ChatMarkdownAnchorService,
      [],
      true
    ),
    [IChatEntitlementService.toString()]: new SyncDescriptor(ChatEntitlementService, [], true),
    [IPromptsService.toString()]: new SyncDescriptor(PromptsService, [], true),
    [IChatStatusItemService.toString()]: new SyncDescriptor(ChatStatusItemService, [], true),
    [IChatContextPickService.toString()]: new SyncDescriptor(ChatContextPickService, [], true),
    [IChatAttachmentResolveService.toString()]: new SyncDescriptor(
      ChatAttachmentResolveService,
      [],
      true
    ),
    [IRemoteCodingAgentsService.toString()]: new SyncDescriptor(
      RemoteCodingAgentsService,
      [],
      true
    ),
    [IChatSessionsService.toString()]: new SyncDescriptor(ChatSessionsService, [], true),
    [IChatOutputRendererService.toString()]: new SyncDescriptor(
      ChatOutputRendererService,
      [],
      true
    ),
    [IChatTodoListService.toString()]: new SyncDescriptor(ChatTodoListService, [], true),
    [IChatLayoutService.toString()]: new SyncDescriptor(ChatLayoutService, [], true),
    [IAiEditTelemetryService.toString()]: new SyncDescriptor(AiEditTelemetryServiceImpl, [], true),
    [IChatModeService.toString()]: new SyncDescriptor(ChatModeService, [], true),
    [ILanguageModelToolsConfirmationService.toString()]: new SyncDescriptor(
      LanguageModelToolsConfirmationService,
      [],
      true
    ),
    [IChatContextService.toString()]: new SyncDescriptor(ChatContextService, [], true),
    [ITerminalChatService.toString()]: new SyncDescriptor(TerminalChatService, [], true),
    [IAgentSessionsService.toString()]: new SyncDescriptor(AgentSessionsService, [], true),
    [ICodeCompareModelService.toString()]: new SyncDescriptor(CodeCompareModelService, [], true),
    [IAgentSessionProjectionService.toString()]: new SyncDescriptor(
      AgentSessionProjectionService,
      [],
      true
    ),
    [IAgentTitleBarStatusService.toString()]: new SyncDescriptor(
      AgentTitleBarStatusService,
      [],
      true
    ),
    [ILanguageModelsConfigurationService.toString()]: new SyncDescriptor(
      LanguageModelsConfigurationService,
      [],
      true
    ),
    [IChatTipService.toString()]: new SyncDescriptor(ChatTipService, [], true),
    [IChatEditingExplanationModelManager.toString()]: new SyncDescriptor(
      ChatEditingExplanationModelManager,
      [],
      true
    ),
    [IChatToolOutputStateCache.toString()]: new SyncDescriptor(ChatToolOutputStateCache, [], true),
    [ITerminalSandboxService.toString()]: new SyncDescriptor(TerminalSandboxService, [], true),
    [IAgentFeedbackService.toString()]: new SyncDescriptor(AgentFeedbackService, [], true),
    [ISessionsConfigurationService.toString()]: new SyncDescriptor(
      SessionsConfigurationService,
      [],
      true
    ),
    [IAICustomizationWorkspaceService.toString()]: new SyncDescriptor(
      SessionsAICustomizationWorkspaceService,
      [],
      true
    ),
    [ISessionsManagementService.toString()]: new SyncDescriptor(
      SessionsManagementService,
      [],
      true
    ),
    [IAgentPluginService.toString()]: new SyncDescriptor(AgentPluginService, [], true),
    [IPluginMarketplaceService.toString()]: new SyncDescriptor(PluginMarketplaceService, [], true),
    [IAgentPluginRepositoryService.toString()]: new SyncDescriptor(
      AgentPluginRepositoryService,
      [],
      true
    ),
    [IPluginInstallService.toString()]: new SyncDescriptor(PluginInstallService, [], true),
    [IChatAttachmentWidgetRegistry.toString()]: new SyncDescriptor(
      ChatAttachmentWidgetRegistry,
      [],
      true
    ),
    [IChatDebugService.toString()]: new SyncDescriptor(ChatDebugServiceImpl, [], true),
    [IChatResponseResourceFileSystemProvider.toString()]: new SyncDescriptor(
      ChatResponseResourceFileSystemProvider,
      [],
      true
    )
  }
}

export { ChatEntitlement }
export type { IChatSentiment, IQuotas }
