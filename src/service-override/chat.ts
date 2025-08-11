import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import {
  IChatAccessibilityService,
  IChatCodeBlockContextProviderService,
  IChatWidgetService,
  IQuickChatService
} from 'vs/workbench/contrib/chat/browser/chat.service'
import { ChatAccessibilityService } from 'vs/workbench/contrib/chat/browser/chatAccessibilityService'
import { QuickChatService } from 'vs/workbench/contrib/chat/browser/chatQuick'
import { ChatVariablesService } from 'vs/workbench/contrib/chat/browser/chatVariables'
import { ChatWidgetService } from 'vs/workbench/contrib/chat/browser/chatWidget'
import { ChatCodeBlockContextProviderService } from 'vs/workbench/contrib/chat/browser/codeBlockContextProviderService'
import { ChatAgentNameService, ChatAgentService } from 'vs/workbench/contrib/chat/common/chatAgents'
import {
  IChatAgentNameService,
  IChatAgentService
} from 'vs/workbench/contrib/chat/common/chatAgents.service'
import { IChatService } from 'vs/workbench/contrib/chat/common/chatService.service'
import { ChatService } from 'vs/workbench/contrib/chat/common/chatServiceImpl'
import { ChatSlashCommandService } from 'vs/workbench/contrib/chat/common/chatSlashCommands'
import { IChatSlashCommandService } from 'vs/workbench/contrib/chat/common/chatSlashCommands.service'
import { IChatVariablesService } from 'vs/workbench/contrib/chat/common/chatVariables.service'
import { ChatWidgetHistoryService } from 'vs/workbench/contrib/chat/common/chatWidgetHistoryService'
import { IChatWidgetHistoryService } from 'vs/workbench/contrib/chat/common/chatWidgetHistoryService.service'
import { ILanguageModelStatsService } from 'vs/workbench/contrib/chat/common/languageModelStats.service'
import { LanguageModelsService } from 'vs/workbench/contrib/chat/common/languageModels'
import { ILanguageModelsService } from 'vs/workbench/contrib/chat/common/languageModels.service'
import { IInlineChatSessionService } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionService.service'
import { InlineChatSessionServiceImpl } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionServiceImpl'
import { LanguageModelStatsService } from 'vs/workbench/contrib/chat/common/languageModelStats'
import { ILanguageModelToolsService } from 'vs/workbench/contrib/chat/common/languageModelToolsService.service'
import { LanguageModelToolsService } from 'vs/workbench/contrib/chat/browser/languageModelToolsService'
import { ICodeMapperService } from 'vs/workbench/contrib/chat/common/chatCodeMapperService.service'
import { CodeMapperService } from 'vs/workbench/contrib/chat/common/chatCodeMapperService'
import { IChatEditingService } from 'vs/workbench/contrib/chat/common/chatEditingService.service'
import { LanguageModelIgnoredFilesService } from 'vs/workbench/contrib/chat/common/ignoredFiles'
import { ILanguageModelIgnoredFilesService } from 'vs/workbench/contrib/chat/common/ignoredFiles.service'
import { IChatMarkdownAnchorService } from 'vs/workbench/contrib/chat/browser/chatContentParts/chatMarkdownAnchorService.service'
import { ChatMarkdownAnchorService } from 'vs/workbench/contrib/chat/browser/chatContentParts/chatMarkdownAnchorService'
import { ChatEditingService } from 'vs/workbench/contrib/chat/browser/chatEditing/chatEditingServiceImpl'
import { ChatEntitlementService } from 'vs/workbench/contrib/chat/common/chatEntitlementService'
import { PromptsService } from 'vs/workbench/contrib/chat/common/promptSyntax/service/promptsServiceImpl'
import { IChatEntitlementService } from 'vs/workbench/contrib/chat/common/chatEntitlementService.service'
import { IPromptsService } from 'vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.service'
import { IChatTransferService } from 'vs/workbench/contrib/chat/common/chatTransferService.service'
import { ChatTransferService } from 'vs/workbench/contrib/chat/common/chatTransferService'
import { IChatStatusItemService } from 'vs/workbench/contrib/chat/browser/chatStatusItemService.service'
import { ChatStatusItemService } from 'vs/workbench/contrib/chat/browser/chatStatusItemService'
import { IChatContextPickService } from 'vs/workbench/contrib/chat/browser/chatContextPickService.service'
import { ChatContextPickService } from 'vs/workbench/contrib/chat/browser/chatContextPickService'
import { IChatAttachmentResolveService } from 'vs/workbench/contrib/chat/browser/chatAttachmentResolveService.service'
import { ChatAttachmentResolveService } from 'vs/workbench/contrib/chat/browser/chatAttachmentResolveService'
import { IRemoteCodingAgentsService } from 'vs/workbench/contrib/remoteCodingAgents/common/remoteCodingAgentsService.service'
import { RemoteCodingAgentsService } from 'vs/workbench/contrib/remoteCodingAgents/common/remoteCodingAgentsService'
import { IChatSessionsService } from 'vs/workbench/contrib/chat/common/chatSessionsService.service'
import 'vs/workbench/contrib/chat/browser/chat.contribution'
import 'vs/workbench/contrib/terminal/terminal.chat.contribution'
import 'vs/workbench/contrib/inlineChat/browser/inlineChat.contribution'
import 'vs/workbench/contrib/remoteCodingAgents/browser/remoteCodingAgents.contribution'
import { ChatSessionsService } from 'vs/workbench/contrib/chat/browser/chatSessions.contribution'
import { ChatOutputRendererService } from 'vs/workbench/contrib/chat/browser/chatOutputItemRenderer'
import { IChatOutputRendererService } from 'vs/workbench/contrib/chat/browser/chatOutputItemRenderer.service'
import { IChatTodoListService } from 'vs/workbench/contrib/chat/common/chatTodoListService.service'
import { ChatTodoListService } from 'vs/workbench/contrib/chat/common/chatTodoListService'

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
    [IChatTodoListService.toString()]: new SyncDescriptor(ChatTodoListService, [], true)
  }
}
