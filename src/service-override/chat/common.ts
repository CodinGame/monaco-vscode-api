import type { IDefaultAccount } from 'vs/base/common/defaultAccount'
import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { AgentHostConnectionsService } from 'vs/platform/agentHost/browser/agentHostConnectionsService'
import { IAgentHostConnectionsService } from 'vs/platform/agentHost/common/agentHostConnectionsService.service'
import { IAgentHostEnablementService } from 'vs/platform/agentHost/common/agentHostEnablementService.service'
import { IAgentHostResourceService } from 'vs/platform/agentHost/common/agentHostResourceService.service'
import { IAgentHostService } from 'vs/platform/agentHost/common/agentService.service'
import { ILinkPresentationService } from 'vs/platform/dataChannel/common/dataChannel.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { AgentNetworkFilterService } from 'vs/platform/networkFilter/common/networkFilterService'
import { IAgentNetworkFilterService } from 'vs/platform/networkFilter/common/networkFilterService.service'
import { NullSandboxHelperService } from 'vs/platform/sandbox/browser/sandboxHelperService'
import { ISandboxHelperService } from 'vs/platform/sandbox/common/sandboxHelperService.service'
import { VoiceModeOnboardingService } from 'vs/workbench/contrib/agentsVoice/browser/voiceModeOnboarding'
import { IVoiceModeOnboardingService } from 'vs/workbench/contrib/agentsVoice/browser/voiceModeOnboarding.service'
import { VoiceTranscriptStore } from 'vs/workbench/contrib/agentsVoice/common/voiceTranscriptStore'
import { IVoiceTranscriptStore } from 'vs/workbench/contrib/agentsVoice/common/voiceTranscriptStore.service'
import { ChatAccessibilityService } from 'vs/workbench/contrib/chat/browser/accessibility/chatAccessibilityService'
import { BrowserAgentHostDebugLogsExportService } from 'vs/workbench/contrib/chat/browser/actions/exportAgentHostDebugLogsAction'
import { IAgentHostDebugLogsExportService } from 'vs/workbench/contrib/chat/browser/actions/exportAgentHostDebugLogsAction.service'
import { AgentPluginRepositoryService } from 'vs/workbench/contrib/chat/browser/agentPluginRepositoryService'
import { AgentHostActiveClientService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService'
import { IAgentHostActiveClientService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostActiveClientService.service'
import { AgentHostImportConversationStore } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostImportConversationStore'
import { IAgentHostImportConversationStore } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostImportConversationStore.service'
import { AgentHostNewSessionFolderService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostNewSessionFolderService'
import { IAgentHostNewSessionFolderService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostNewSessionFolderService.service'
import { AgentHostProtectedResourcesService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostProtectedResourcesService'
import { IAgentHostProtectedResourcesService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostProtectedResourcesService.service'
import { AgentHostSessionWorkingDirectoryResolver } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionWorkingDirectoryResolver'
import { IAgentHostSessionWorkingDirectoryResolver } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionWorkingDirectoryResolver.service'
import { AgentHostSessionWorkingDirectorySynchronizer } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionWorkingDirectorySynchronizer'
import { IAgentHostSessionWorkingDirectorySynchronizer } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSessionWorkingDirectorySynchronizer.service'
import { AgentHostShellInitSynchronizer } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostShellInitSynchronizer'
import { IAgentHostShellInitSynchronizer } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostShellInitSynchronizer.service'
import { AgentHostToolSetEnablementService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostToolSetEnablementService'
import { IAgentHostToolSetEnablementService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostToolSetEnablementService.service'
import { AgentHostUntitledProvisionalSessionService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostUntitledProvisionalSessionService'
import { IAgentHostUntitledProvisionalSessionService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostUntitledProvisionalSessionService.service'
import { AgentSessionsService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService'
import { IAgentSessionsService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.service'
import { AgentSessionProjectionService } from 'vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionProjectionService'
import { IAgentSessionProjectionService } from 'vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionProjectionService.service'
import { AgentTitleBarStatusService } from 'vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusService'
import { IAgentTitleBarStatusService } from 'vs/workbench/contrib/chat/browser/agentSessions/experiments/agentTitleBarStatusService.service'
import { SessionSummaryHoverService } from 'vs/workbench/contrib/chat/browser/agentSessions/sessionSummaryHoverService'
import { ISessionSummaryHoverService } from 'vs/workbench/contrib/chat/browser/agentSessions/sessionSummaryHoverService.service'
import { CustomizationMigrationService } from 'vs/workbench/contrib/chat/browser/aiCustomization/customizationMigrationServiceImpl'
import { ChatAttachmentResolveService } from 'vs/workbench/contrib/chat/browser/attachments/chatAttachmentResolveService'
import { IChatAttachmentResolveService } from 'vs/workbench/contrib/chat/browser/attachments/chatAttachmentResolveService.service'
import { ChatAttachmentWidgetRegistry } from 'vs/workbench/contrib/chat/browser/attachments/chatAttachmentWidgetRegistry'
import { IChatAttachmentWidgetRegistry } from 'vs/workbench/contrib/chat/browser/attachments/chatAttachmentWidgetRegistry.service'
import { ChatContextPickService } from 'vs/workbench/contrib/chat/browser/attachments/chatContextPickService'
import { IChatContextPickService } from 'vs/workbench/contrib/chat/browser/attachments/chatContextPickService.service'
import { ChatPasteTargetService } from 'vs/workbench/contrib/chat/browser/attachments/chatPasteTargetService'
import { ChatVariablesService } from 'vs/workbench/contrib/chat/browser/attachments/chatVariables'
import {
  IChatAccessibilityService,
  IChatCodeBlockContextProviderService,
  IChatPasteTargetService,
  IChatWidgetService,
  IQuickChatService
} from 'vs/workbench/contrib/chat/browser/chat.service'
import 'vs/workbench/contrib/chat/browser/chat.shared.contribution'
import { ChatEditingExplanationModelManager } from 'vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationModelManager'
import { IChatEditingExplanationModelManager } from 'vs/workbench/contrib/chat/browser/chatEditing/chatEditingExplanationModelManager.service'
import { ChatEditingService } from 'vs/workbench/contrib/chat/browser/chatEditing/chatEditingServiceImpl'
import { ChatGoalSummaryService } from 'vs/workbench/contrib/chat/browser/chatGoalSummaryService'
import { IChatGoalSummaryService } from 'vs/workbench/contrib/chat/browser/chatGoalSummaryService.service'
import { ChatImageCarouselService } from 'vs/workbench/contrib/chat/browser/chatImageCarouselService'
import { IChatImageCarouselService } from 'vs/workbench/contrib/chat/browser/chatImageCarouselService.service'
import { ChatOutputRendererService } from 'vs/workbench/contrib/chat/browser/chatOutputItemRenderer'
import { IChatOutputRendererService } from 'vs/workbench/contrib/chat/browser/chatOutputItemRenderer.service'
import { ChatPetService } from 'vs/workbench/contrib/chat/browser/chatPetService'
import { IChatPetService } from 'vs/workbench/contrib/chat/browser/chatPetService.service'
import { IChatResponseFileChangesService } from 'vs/workbench/contrib/chat/browser/chatResponseFileChangesService.service'
import { ChatSessionsService } from 'vs/workbench/contrib/chat/browser/chatSessions/chatSessions.contribution'
import { ChatStatusItemService } from 'vs/workbench/contrib/chat/browser/chatStatus/chatStatusItemService'
import { IChatStatusItemService } from 'vs/workbench/contrib/chat/browser/chatStatus/chatStatusItemService.service'
import { ChatSubmitRequestHandlerService } from 'vs/workbench/contrib/chat/browser/chatSubmitRequestHandlerService'
import { IChatSubmitRequestHandlerService } from 'vs/workbench/contrib/chat/browser/chatSubmitRequestHandlerService.service'
import { ChatTipService } from 'vs/workbench/contrib/chat/browser/chatTipService'
import { IChatTipService } from 'vs/workbench/contrib/chat/browser/chatTipService.service'
import { ChatCodeBlockContextProviderService } from 'vs/workbench/contrib/chat/browser/codeBlockContextProviderService'
import { ChatContextService } from 'vs/workbench/contrib/chat/browser/contextContrib/chatContextService'
import { IChatContextService } from 'vs/workbench/contrib/chat/browser/contextContrib/chatContextService.service'
import { EditorChatResponseFileChangesService } from 'vs/workbench/contrib/chat/browser/editorChatResponseFileChangesService'
import { ChatModelFeedbackSurveyService } from 'vs/workbench/contrib/chat/browser/feedbackSurvey/chatModelFeedbackSurveyService'
import { IChatModelFeedbackSurveyService } from 'vs/workbench/contrib/chat/browser/feedbackSurvey/chatModelFeedbackSurveyService.service'
import { LanguageModelsConfigurationService } from 'vs/workbench/contrib/chat/browser/languageModelsConfigurationService'
import { PlanReviewFeedbackService } from 'vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackService'
import { IPlanReviewFeedbackService } from 'vs/workbench/contrib/chat/browser/planReviewFeedback/planReviewFeedbackService.service'
import { BrowserPluginGitCommandService } from 'vs/workbench/contrib/chat/browser/pluginGitCommandService'
import { PluginInstallService } from 'vs/workbench/contrib/chat/browser/pluginInstallService'
import { ChatSpeechToTextService } from 'vs/workbench/contrib/chat/browser/speechToText/chatSpeechToTextService'
import { IChatSpeechToTextService } from 'vs/workbench/contrib/chat/browser/speechToText/chatSpeechToTextService.service'
import { DictationOnboardingService } from 'vs/workbench/contrib/chat/browser/speechToText/dictationOnboarding'
import { IDictationOnboardingService } from 'vs/workbench/contrib/chat/browser/speechToText/dictationOnboarding.service'
import { VoiceCodeTranscriptionClient } from 'vs/workbench/contrib/chat/browser/speechToText/voiceCodeTranscriptionClient'
import { IVoiceCodeTranscriptionClient } from 'vs/workbench/contrib/chat/browser/speechToText/voiceCodeTranscriptionClient.service'
import { ChatToolRiskAssessmentService } from 'vs/workbench/contrib/chat/browser/tools/chatToolRiskAssessmentService'
import { IChatToolRiskAssessmentService } from 'vs/workbench/contrib/chat/browser/tools/chatToolRiskAssessmentService.service'
import { LanguageModelToolsConfirmationService } from 'vs/workbench/contrib/chat/browser/tools/languageModelToolsConfirmationService'
import { LanguageModelToolsService } from 'vs/workbench/contrib/chat/browser/tools/languageModelToolsService'
import { ToolResultCompressorService } from 'vs/workbench/contrib/chat/browser/tools/toolResultCompressorService'
import { MicCaptureService } from 'vs/workbench/contrib/chat/browser/voiceClient/micCaptureService'
import { IMicCaptureService } from 'vs/workbench/contrib/chat/browser/voiceClient/micCaptureService.service'
import { TtsPlaybackService } from 'vs/workbench/contrib/chat/browser/voiceClient/ttsPlaybackService'
import { ITtsPlaybackService } from 'vs/workbench/contrib/chat/browser/voiceClient/ttsPlaybackService.service'
import { VoiceClientService } from 'vs/workbench/contrib/chat/browser/voiceClient/voiceClientService'
import { VoiceSessionController } from 'vs/workbench/contrib/chat/browser/voiceClient/voiceSessionController'
import { IVoiceSessionController } from 'vs/workbench/contrib/chat/browser/voiceClient/voiceSessionController.service'
import { VoiceToolDispatchService } from 'vs/workbench/contrib/chat/browser/voiceClient/voiceToolDispatchService'
import { IVoiceToolDispatchService } from 'vs/workbench/contrib/chat/browser/voiceClient/voiceToolDispatchService.service'
import { VoiceInputModeService } from 'vs/workbench/contrib/chat/browser/voiceInputMode/voiceInputMode'
import { IVoiceInputModeService } from 'vs/workbench/contrib/chat/browser/voiceInputMode/voiceInputMode.service'
import { ChatMarkdownAnchorService } from 'vs/workbench/contrib/chat/browser/widget/chatContentParts/chatMarkdownAnchorService'
import { IChatMarkdownAnchorService } from 'vs/workbench/contrib/chat/browser/widget/chatContentParts/chatMarkdownAnchorService.service'
import { ChatOutputPartStateCache } from 'vs/workbench/contrib/chat/browser/widget/chatContentParts/chatOutputPartStateCache'
import { IChatOutputPartStateCache } from 'vs/workbench/contrib/chat/browser/widget/chatContentParts/chatOutputPartStateCache.service'
import { CodeCompareModelService } from 'vs/workbench/contrib/chat/browser/widget/chatContentParts/chatTextEditContentPart'
import { ICodeCompareModelService } from 'vs/workbench/contrib/chat/browser/widget/chatContentParts/chatTextEditContentPart.service'
import { ChatLayoutService } from 'vs/workbench/contrib/chat/browser/widget/chatLayoutService'
import { ChatPetWidgetService } from 'vs/workbench/contrib/chat/browser/widget/chatPetWidgetService'
import { IChatPetWidgetService } from 'vs/workbench/contrib/chat/browser/widget/chatPetWidgetService.service'
import { ChatWidgetService } from 'vs/workbench/contrib/chat/browser/widget/chatWidgetService'
import { ChatInputNoticeHubService } from 'vs/workbench/contrib/chat/browser/widget/input/chatInputNoticeHub'
import { IChatInputNoticeHubService } from 'vs/workbench/contrib/chat/browser/widget/input/chatInputNoticeHub.service'
import { ChatInputNotificationService } from 'vs/workbench/contrib/chat/browser/widget/input/chatInputNotificationService'
import { IChatInputNotificationService } from 'vs/workbench/contrib/chat/browser/widget/input/chatInputNotificationService.service'
import { ChatPhoneInputPresenterService } from 'vs/workbench/contrib/chat/browser/widget/input/chatPhoneInputPresenter'
import { IChatPhoneInputPresenter } from 'vs/workbench/contrib/chat/browser/widget/input/chatPhoneInputPresenter.service'
import { QuickChatService } from 'vs/workbench/contrib/chat/browser/widgetHosts/chatQuick'
import { IChatVariablesService } from 'vs/workbench/contrib/chat/common/attachments/chatVariables.service'
import { IChatDebugService } from 'vs/workbench/contrib/chat/common/chatDebugService.service'
import { ChatDebugServiceImpl } from 'vs/workbench/contrib/chat/common/chatDebugServiceImpl'
import { ChatModeService } from 'vs/workbench/contrib/chat/common/chatModes'
import { IChatModeService } from 'vs/workbench/contrib/chat/common/chatModes.service'
import { ChatRequestOriginService } from 'vs/workbench/contrib/chat/common/chatRequestOrigin'
import { IChatRequestOriginService } from 'vs/workbench/contrib/chat/common/chatRequestOrigin.service'
import { IChatService } from 'vs/workbench/contrib/chat/common/chatService/chatService.service'
import { ChatService } from 'vs/workbench/contrib/chat/common/chatService/chatServiceImpl'
import { IChatSessionsService } from 'vs/workbench/contrib/chat/common/chatSessionsService.service'
import { ChatSideChatService } from 'vs/workbench/contrib/chat/common/chatSideChatService'
import { IChatSideChatService } from 'vs/workbench/contrib/chat/common/chatSideChatService.service'
import { CodeMapperService } from 'vs/workbench/contrib/chat/common/editing/chatCodeMapperService'
import { ICodeMapperService } from 'vs/workbench/contrib/chat/common/editing/chatCodeMapperService.service'
import { IChatEditingService } from 'vs/workbench/contrib/chat/common/editing/chatEditingService.service'
import { LanguageModelIgnoredFilesService } from 'vs/workbench/contrib/chat/common/ignoredFiles'
import { ILanguageModelIgnoredFilesService } from 'vs/workbench/contrib/chat/common/ignoredFiles.service'
import { LanguageModelStatsService } from 'vs/workbench/contrib/chat/common/languageModelStats'
import { ILanguageModelStatsService } from 'vs/workbench/contrib/chat/common/languageModelStats.service'
import { LanguageModelsService } from 'vs/workbench/contrib/chat/common/languageModels'
import { ILanguageModelsService } from 'vs/workbench/contrib/chat/common/languageModels.service'
import { ILanguageModelsConfigurationService } from 'vs/workbench/contrib/chat/common/languageModelsConfiguration.service'
import { ChatTransferService } from 'vs/workbench/contrib/chat/common/model/chatTransferService'
import { IChatTransferService } from 'vs/workbench/contrib/chat/common/model/chatTransferService.service'
import {
  ChatAgentNameService,
  ChatAgentService
} from 'vs/workbench/contrib/chat/common/participants/chatAgents'
import {
  IChatAgentNameService,
  IChatAgentService
} from 'vs/workbench/contrib/chat/common/participants/chatAgents.service'
import { ChatSlashCommandService } from 'vs/workbench/contrib/chat/common/participants/chatSlashCommands'
import { IChatSlashCommandService } from 'vs/workbench/contrib/chat/common/participants/chatSlashCommands.service'
import { IAgentPluginRepositoryService } from 'vs/workbench/contrib/chat/common/plugins/agentPluginRepositoryService.service'
import { IAgentPluginService } from 'vs/workbench/contrib/chat/common/plugins/agentPluginService.service'
import { AgentPluginService } from 'vs/workbench/contrib/chat/common/plugins/agentPluginServiceImpl'
import { IPluginGitService } from 'vs/workbench/contrib/chat/common/plugins/pluginGitService.service'
import { IPluginInstallService } from 'vs/workbench/contrib/chat/common/plugins/pluginInstallService.service'
import { PluginMarketplaceService } from 'vs/workbench/contrib/chat/common/plugins/pluginMarketplaceService'
import { IPluginMarketplaceService } from 'vs/workbench/contrib/chat/common/plugins/pluginMarketplaceService.service'
import { WorkspacePluginSettingsService } from 'vs/workbench/contrib/chat/common/plugins/workspacePluginSettingsService'
import { IWorkspacePluginSettingsService } from 'vs/workbench/contrib/chat/common/plugins/workspacePluginSettingsService.service'
import { ICustomizationMigrationService } from 'vs/workbench/contrib/chat/common/promptSyntax/service/customizationMigrationService.service'
import { SessionChatPillVisibility } from 'vs/workbench/contrib/chat/common/sessionChatPills'
import { ISessionChatPillVisibilityService } from 'vs/workbench/contrib/chat/common/sessionChatPills.service'
import { ChatArtifactsService } from 'vs/workbench/contrib/chat/common/tools/chatArtifactsService'
import { IChatArtifactsService } from 'vs/workbench/contrib/chat/common/tools/chatArtifactsService.service'
import { ChatTodoListService } from 'vs/workbench/contrib/chat/common/tools/chatTodoListService'
import { IChatTodoListService } from 'vs/workbench/contrib/chat/common/tools/chatTodoListService.service'
import { ILanguageModelToolsConfirmationService } from 'vs/workbench/contrib/chat/common/tools/languageModelToolsConfirmationService.service'
import { ILanguageModelToolsService } from 'vs/workbench/contrib/chat/common/tools/languageModelToolsService.service'
import { IToolResultCompressor } from 'vs/workbench/contrib/chat/common/tools/toolResultCompressor.service'
import { IVoiceClientService } from 'vs/workbench/contrib/chat/common/voiceClient/voiceClientService.service'
import { VoicePlaybackService } from 'vs/workbench/contrib/chat/common/voicePlaybackService'
import { IVoicePlaybackService } from 'vs/workbench/contrib/chat/common/voicePlaybackService.service'
import { IChatLayoutService } from 'vs/workbench/contrib/chat/common/widget/chatLayoutService.service'
import { ChatResponseResourceFileSystemProvider } from 'vs/workbench/contrib/chat/common/widget/chatResponseResourceFileSystemProvider'
import { IChatResponseResourceFileSystemProvider } from 'vs/workbench/contrib/chat/common/widget/chatResponseResourceFileSystemProvider.service'
import { ChatWidgetHistoryService } from 'vs/workbench/contrib/chat/common/widget/chatWidgetHistoryService'
import { IChatWidgetHistoryService } from 'vs/workbench/contrib/chat/common/widget/chatWidgetHistoryService.service'
import { IAiEditTelemetryService } from 'vs/workbench/contrib/editTelemetry/browser/telemetry/aiEditTelemetry/aiEditTelemetryService.service'
import { AiEditTelemetryServiceImpl } from 'vs/workbench/contrib/editTelemetry/browser/telemetry/aiEditTelemetry/aiEditTelemetryServiceImpl'
import { RemoteCodingAgentsService } from 'vs/workbench/contrib/remoteCodingAgents/common/remoteCodingAgentsService'
import { IRemoteCodingAgentsService } from 'vs/workbench/contrib/remoteCodingAgents/common/remoteCodingAgentsService.service'
import { AgentHostTerminalService } from 'vs/workbench/contrib/terminal/browser/agentHostTerminalService'
import { IAgentHostTerminalService } from 'vs/workbench/contrib/terminal/browser/agentHostTerminalService.service'
import { ITerminalChatService } from 'vs/workbench/contrib/terminal/browser/terminal.service'
import { TerminalChatService } from 'vs/workbench/contrib/terminalContrib/chat/browser/terminalChatService'
import { TerminalChatSessionResolver } from 'vs/workbench/contrib/terminalContrib/chat/browser/terminalChatSessionResolver'
import { ITerminalChatSessionResolver } from 'vs/workbench/contrib/terminalContrib/chat/browser/terminalChatSessionResolver.service'
import {
  ITerminalSandboxService,
  TerminalSandboxService
} from 'vs/workbench/contrib/terminalContrib/chatAgentTools/common/terminalSandboxService'
import { AgentSdkSetupService } from 'vs/workbench/services/agentHost/browser/agentSdkSetupService'
import { IAgentSdkSetupService } from 'vs/workbench/services/agentHost/browser/agentSdkSetupService.service'
import { CodexAccountService } from 'vs/workbench/services/agentHost/browser/codexAccountService'
import { ICodexAccountService } from 'vs/workbench/services/agentHost/browser/codexAccountService.service'
import { EditorRemoteAgentHostServiceClient } from 'vs/workbench/services/agentHost/browser/editorRemoteAgentHostServiceClient'
import { WebAgentHostEnablementService } from 'vs/workbench/services/agentHost/browser/webAgentHostEnablementService'
import { AgentHostFileSystemService } from 'vs/workbench/services/agentHost/common/agentHostFileSystemService'
import { IAgentHostFileSystemService } from 'vs/workbench/services/agentHost/common/agentHostFileSystemService.service'
import { AgentHostResourceService } from 'vs/workbench/services/agentHost/common/agentHostResourceService'
import {
  ChatEntitlement,
  ChatEntitlementService,
  type IChatEntitlementContextState
} from 'vs/workbench/services/chat/common/chatEntitlementService'
import { IChatEntitlementService } from 'vs/workbench/services/chat/common/chatEntitlementService.service'
import { LinkPresentationService } from 'vs/workbench/services/dataChannel/browser/dataChannelService'
import 'vs/platform/agentHost/common/agentHostStarter.config.contribution'
import 'vs/workbench/contrib/agentsVoice/browser/agentsVoice.contribution'
import 'vs/workbench/contrib/imageCarousel/browser/imageCarousel.contribution'
import 'vs/workbench/contrib/remoteCodingAgents/browser/remoteCodingAgents.contribution'
import 'vs/workbench/contrib/terminal/terminal.chat.contribution'
import 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostChatInputPicker.contribution'
import 'vs/workbench/contrib/chat/browser/agentSessions/agentSessions.contribution'
import 'vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationManagement.contribution'
import 'vs/workbench/contrib/chat/browser/contextContrib/chatContext.contribution'
import 'vs/workbench/contrib/chat/browser/attachments/chatReferenceAttachmentWidget.contribution'
import 'vs/workbench/contrib/chat/browser/attachments/transcriptContextAttachmentWidget.contribution'
import 'vs/workbench/contrib/chat/browser/agentSessions/experiments/agentSessionsExperiments.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
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
    [IChatOutputPartStateCache.toString()]: new SyncDescriptor(ChatOutputPartStateCache, [], true),
    [ITerminalSandboxService.toString()]: new SyncDescriptor(TerminalSandboxService, [], true),
    [ISandboxHelperService.toString()]: new SyncDescriptor(NullSandboxHelperService, [], true),
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
    ),
    [IChatArtifactsService.toString()]: new SyncDescriptor(ChatArtifactsService, [], true),
    [IWorkspacePluginSettingsService.toString()]: new SyncDescriptor(
      WorkspacePluginSettingsService,
      [],
      true
    ),
    [IChatImageCarouselService.toString()]: new SyncDescriptor(ChatImageCarouselService, [], true),
    [IPluginGitService.toString()]: new SyncDescriptor(BrowserPluginGitCommandService, [], true),
    [IAgentNetworkFilterService.toString()]: new SyncDescriptor(
      AgentNetworkFilterService,
      [],
      true
    ),
    [IAgentHostFileSystemService.toString()]: new SyncDescriptor(
      AgentHostFileSystemService,
      [],
      true
    ),
    [IAgentHostSessionWorkingDirectoryResolver.toString()]: new SyncDescriptor(
      AgentHostSessionWorkingDirectoryResolver,
      [],
      true
    ),
    [IAgentHostNewSessionFolderService.toString()]: new SyncDescriptor(
      AgentHostNewSessionFolderService,
      [],
      true
    ),
    [IAgentHostToolSetEnablementService.toString()]: new SyncDescriptor(
      AgentHostToolSetEnablementService,
      [],
      true
    ),
    [IAgentHostTerminalService.toString()]: new SyncDescriptor(AgentHostTerminalService, [], true),
    [IAgentHostConnectionsService.toString()]: new SyncDescriptor(
      AgentHostConnectionsService,
      [],
      true
    ),
    [IMicCaptureService.toString()]: new SyncDescriptor(MicCaptureService, [], true),
    [ITtsPlaybackService.toString()]: new SyncDescriptor(TtsPlaybackService, [], true),
    [IVoiceClientService.toString()]: new SyncDescriptor(VoiceClientService, [], true),
    [IVoiceSessionController.toString()]: new SyncDescriptor(VoiceSessionController, [], true),
    [IVoiceToolDispatchService.toString()]: new SyncDescriptor(VoiceToolDispatchService, [], true),
    [IVoicePlaybackService.toString()]: new SyncDescriptor(VoicePlaybackService, [], true),
    [IVoiceTranscriptStore.toString()]: new SyncDescriptor(VoiceTranscriptStore, [], true),
    [IAgentHostActiveClientService.toString()]: new SyncDescriptor(
      AgentHostActiveClientService,
      [],
      true
    ),
    [IToolResultCompressor.toString()]: new SyncDescriptor(ToolResultCompressorService, [], true),
    [IChatGoalSummaryService.toString()]: new SyncDescriptor(ChatGoalSummaryService, [], true),
    [IChatResponseFileChangesService.toString()]: new SyncDescriptor(
      EditorChatResponseFileChangesService,
      [],
      true
    ),
    [IChatToolRiskAssessmentService.toString()]: new SyncDescriptor(
      ChatToolRiskAssessmentService,
      [],
      true
    ),
    [IPlanReviewFeedbackService.toString()]: new SyncDescriptor(
      PlanReviewFeedbackService,
      [],
      true
    ),
    [IChatInputNotificationService.toString()]: new SyncDescriptor(
      ChatInputNotificationService,
      [],
      true
    ),
    [IChatPhoneInputPresenter.toString()]: new SyncDescriptor(
      ChatPhoneInputPresenterService,
      [],
      true
    ),
    [IAgentHostResourceService.toString()]: new SyncDescriptor(AgentHostResourceService, [], true),
    [IAgentHostUntitledProvisionalSessionService.toString()]: new SyncDescriptor(
      AgentHostUntitledProvisionalSessionService,
      [],
      true
    ),
    [IAgentHostDebugLogsExportService.toString()]: new SyncDescriptor(
      BrowserAgentHostDebugLogsExportService,
      [],
      true
    ),
    [IAgentHostImportConversationStore.toString()]: new SyncDescriptor(
      AgentHostImportConversationStore,
      [],
      true
    ),
    [IAgentHostProtectedResourcesService.toString()]: new SyncDescriptor(
      AgentHostProtectedResourcesService,
      [],
      true
    ),
    [IAgentHostSessionWorkingDirectorySynchronizer.toString()]: new SyncDescriptor(
      AgentHostSessionWorkingDirectorySynchronizer,
      [],
      true
    ),
    [IAgentHostShellInitSynchronizer.toString()]: new SyncDescriptor(
      AgentHostShellInitSynchronizer,
      [],
      true
    ),
    [IAgentSdkSetupService.toString()]: new SyncDescriptor(AgentSdkSetupService, [], true),
    [ICodexAccountService.toString()]: new SyncDescriptor(CodexAccountService, [], true),
    [IChatInputNoticeHubService.toString()]: new SyncDescriptor(
      ChatInputNoticeHubService,
      [],
      true
    ),
    [IChatModelFeedbackSurveyService.toString()]: new SyncDescriptor(
      ChatModelFeedbackSurveyService,
      [],
      true
    ),
    [IChatPasteTargetService.toString()]: new SyncDescriptor(ChatPasteTargetService, [], true),
    [IChatPetService.toString()]: new SyncDescriptor(ChatPetService, [], true),
    [IChatPetWidgetService.toString()]: new SyncDescriptor(ChatPetWidgetService, [], true),
    [IChatRequestOriginService.toString()]: new SyncDescriptor(ChatRequestOriginService, [], true),
    [IChatSideChatService.toString()]: new SyncDescriptor(ChatSideChatService, [], true),
    [IChatSpeechToTextService.toString()]: new SyncDescriptor(ChatSpeechToTextService, [], true),
    [IChatSubmitRequestHandlerService.toString()]: new SyncDescriptor(
      ChatSubmitRequestHandlerService,
      [],
      true
    ),
    [ICustomizationMigrationService.toString()]: new SyncDescriptor(
      CustomizationMigrationService,
      [],
      true
    ),
    [IDictationOnboardingService.toString()]: new SyncDescriptor(
      DictationOnboardingService,
      [],
      true
    ),
    [ISessionChatPillVisibilityService.toString()]: new SyncDescriptor(
      SessionChatPillVisibility,
      [],
      true
    ),
    [ISessionSummaryHoverService.toString()]: new SyncDescriptor(
      SessionSummaryHoverService,
      [],
      true
    ),
    [ITerminalChatSessionResolver.toString()]: new SyncDescriptor(
      TerminalChatSessionResolver,
      [],
      true
    ),
    [IVoiceCodeTranscriptionClient.toString()]: new SyncDescriptor(
      VoiceCodeTranscriptionClient,
      [],
      true
    ),
    [IVoiceInputModeService.toString()]: new SyncDescriptor(VoiceInputModeService, [], true),
    [IVoiceModeOnboardingService.toString()]: new SyncDescriptor(
      VoiceModeOnboardingService,
      [],
      true
    ),
    [IAgentHostEnablementService.toString()]: new SyncDescriptor(
      WebAgentHostEnablementService,
      [],
      false
    ),
    [IAgentHostService.toString()]: new SyncDescriptor(
      EditorRemoteAgentHostServiceClient,
      [],
      true
    ),
    [ILinkPresentationService.toString()]: new SyncDescriptor(LinkPresentationService, [], true)
  }
}

export type { ITelemetryData, TelemetryLevel } from 'vs/platform/telemetry/common/telemetry'
export { ChatEntitlement, type IChatEntitlementContextState, type IDefaultAccount }
