import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IChatService } from 'vs/workbench/contrib/chat/common/chatService'
import { IChatContributionService } from 'vs/workbench/contrib/chat/common/chatContributionService'
import { IChatWidgetService, IChatAccessibilityService, IQuickChatService, IChatCodeBlockContextProviderService } from 'vs/workbench/contrib/chat/browser/chat'
import { ChatContributionService } from 'vs/workbench/contrib/chat/browser/chatContributionServiceImpl'
import { ChatWidgetService } from 'vs/workbench/contrib/chat/browser/chatWidget'
import { ChatService } from 'vs/workbench/contrib/chat/common/chatServiceImpl'
import { ChatWidgetHistoryService, IChatWidgetHistoryService } from 'vs/workbench/contrib/chat/common/chatWidgetHistoryService'
import { ChatAccessibilityService } from 'vs/workbench/contrib/chat/browser/chatAccessibilityService'
import { ChatSlashCommandService, IChatSlashCommandService } from 'vs/workbench/contrib/chat/common/chatSlashCommands'
import { IChatVariablesService } from 'vs/workbench/contrib/chat/common/chatVariables'
import { ChatVariablesService } from 'vs/workbench/contrib/chat/browser/chatVariables'
import { QuickChatService } from 'vs/workbench/contrib/chat/browser/chatQuick'
import { ChatAgentService, IChatAgentService } from 'vs/workbench/contrib/chat/common/chatAgents'
import { InlineChatServiceImpl } from 'vs/workbench/contrib/inlineChat/common/inlineChatServiceImpl'
import { IInlineChatService } from 'vs/workbench/contrib/inlineChat/common/inlineChat'
import { IInlineChatSessionService } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionService'
import { InlineChatSessionServiceImpl } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionServiceImpl'
import { IInlineChatSavingService } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSavingService'
import { InlineChatSavingServiceImpl } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSavingServiceImpl'
import { ILanguageModelsService, LanguageModelsService } from 'vs/workbench/contrib/chat/common/languageModels'
import { ChatCodeBlockContextProviderService } from 'vs/workbench/contrib/chat/browser/codeBlockContextProviderService'
import 'vs/workbench/contrib/chat/browser/chat.contribution'
import 'vs/workbench/contrib/inlineChat/browser/inlineChat.contribution'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IChatService.toString()]: new SyncDescriptor(ChatService, [], true),
    [IChatContributionService.toString()]: new SyncDescriptor(ChatContributionService, [], true),
    [IChatWidgetService.toString()]: new SyncDescriptor(ChatWidgetService, [], true),
    [IQuickChatService.toString()]: new SyncDescriptor(QuickChatService, [], true),
    [IChatAccessibilityService.toString()]: new SyncDescriptor(ChatAccessibilityService, [], true),
    [IChatWidgetHistoryService.toString()]: new SyncDescriptor(ChatWidgetHistoryService, [], true),
    [ILanguageModelsService.toString()]: new SyncDescriptor(LanguageModelsService, [], true),
    [IChatSlashCommandService.toString()]: new SyncDescriptor(ChatSlashCommandService, [], true),
    [IChatAgentService.toString()]: new SyncDescriptor(ChatAgentService, [], true),
    [IChatVariablesService.toString()]: new SyncDescriptor(ChatVariablesService, [], true),
    [IInlineChatService.toString()]: new SyncDescriptor(InlineChatServiceImpl, [], true),
    [IInlineChatSessionService.toString()]: new SyncDescriptor(InlineChatSessionServiceImpl, [], true),
    [IInlineChatSavingService.toString()]: new SyncDescriptor(InlineChatSavingServiceImpl, [], true),
    [IChatCodeBlockContextProviderService.toString()]: new SyncDescriptor(ChatCodeBlockContextProviderService, [], true)
  }
}
