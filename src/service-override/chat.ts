import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IChatAccessibilityService, IChatCodeBlockContextProviderService, IChatWidgetService, IQuickChatService } from 'vs/workbench/contrib/chat/browser/chat.service'
import { ChatAccessibilityService } from 'vs/workbench/contrib/chat/browser/chatAccessibilityService'
import { QuickChatService } from 'vs/workbench/contrib/chat/browser/chatQuick'
import { ChatVariablesService } from 'vs/workbench/contrib/chat/browser/chatVariables'
import { ChatWidgetService } from 'vs/workbench/contrib/chat/browser/chatWidget'
import { ChatCodeBlockContextProviderService } from 'vs/workbench/contrib/chat/browser/codeBlockContextProviderService'
import { ChatAgentService } from 'vs/workbench/contrib/chat/common/chatAgents'
import { IChatAgentService } from 'vs/workbench/contrib/chat/common/chatAgents.service'
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
import { IInlineChatSavingService } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSavingService.service'
import { InlineChatSavingServiceImpl } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSavingServiceImpl'
import { IInlineChatSessionService } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionService.service'
import { InlineChatSessionServiceImpl } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionServiceImpl'
import { IInlineChatService } from 'vs/workbench/contrib/inlineChat/common/inlineChat.service'
import { InlineChatServiceImpl } from 'vs/workbench/contrib/inlineChat/common/inlineChatServiceImpl'
import { LanguageModelStatsService } from 'vs/workbench/contrib/chat/common/languageModelStats'
import 'vs/workbench/contrib/chat/browser/chat.contribution'
import 'vs/workbench/contrib/inlineChat/browser/inlineChat.contribution'

export default function getServiceOverride (): IEditorOverrideServices {
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
    [IInlineChatService.toString()]: new SyncDescriptor(InlineChatServiceImpl, [], true),
    [IInlineChatSessionService.toString()]: new SyncDescriptor(InlineChatSessionServiceImpl, [], true),
    [IInlineChatSavingService.toString()]: new SyncDescriptor(InlineChatSavingServiceImpl, [], true),
    [IChatCodeBlockContextProviderService.toString()]: new SyncDescriptor(ChatCodeBlockContextProviderService, [], true),
    [ILanguageModelStatsService.toString()]: new SyncDescriptor(LanguageModelStatsService, [], true)
  }
}
