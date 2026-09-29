import type { IDefaultAccount } from 'vs/base/common/defaultAccount'
import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { RemoteAgentHostService } from 'vs/platform/agentHost/browser/remoteAgentHostServiceImpl'
import { IRemoteAgentHostService } from 'vs/platform/agentHost/common/remoteAgentHostService.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { AgentsVoiceWindowService } from 'vs/workbench/contrib/agentsVoice/browser/agentsVoiceWindowService'
import { IAgentsVoiceWindowService } from 'vs/workbench/contrib/agentsVoice/common/agentsVoice.service'
import { NullAgentHostCustomizationService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService'
import { IAgentHostCustomizationService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.service'
import { AICustomizationWorkspaceService } from 'vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationWorkspaceService'
import { CustomizationHarnessService } from 'vs/workbench/contrib/chat/browser/aiCustomization/customizationHarnessService'
import { IAICustomizationWorkspaceService } from 'vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.service'
import { ICustomizationHarnessService } from 'vs/workbench/contrib/chat/common/customizationHarnessService.service'
import { IPromptsService } from 'vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.service'
import { PromptsService } from 'vs/workbench/contrib/chat/common/promptSyntax/service/promptsServiceImpl'
import { InlineChatSessionResolver } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionResolver'
import { IInlineChatSessionResolver } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionResolver.service'
import { IInlineChatSessionService } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionService.service'
import { InlineChatSessionServiceImpl } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionServiceImpl'
import {
  ChatEntitlement,
  type IChatEntitlementContextState
} from 'vs/workbench/services/chat/common/chatEntitlementService'
import getCommonServiceOverride, { type ChatServiceOverrideOptions } from './common.js'
export * from './common.js'
import 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHost.contribution'
import 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSettings.contribution'
import 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentSessionSettings.contribution'
import 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/openSessionLinkOpener.contribution'
import 'vs/workbench/contrib/chat/browser/chat.contribution'
import 'vs/workbench/contrib/chat/browser/chat.view.contribution'
import 'vs/workbench/contrib/inlineChat/browser/inlineChat.contribution'

export default function getServiceOverride({
  defaultAccount
}: ChatServiceOverrideOptions = {}): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride({ defaultAccount }),
    [IInlineChatSessionService.toString()]: new SyncDescriptor(
      InlineChatSessionServiceImpl,
      [],
      true
    ),
    [IPromptsService.toString()]: new SyncDescriptor(PromptsService, [], true),
    [IAICustomizationWorkspaceService.toString()]: new SyncDescriptor(
      AICustomizationWorkspaceService,
      [],
      true
    ),

    [ICustomizationHarnessService.toString()]: new SyncDescriptor(
      CustomizationHarnessService,
      [],
      true
    ),
    [IRemoteAgentHostService.toString()]: new SyncDescriptor(RemoteAgentHostService, [], true),
    [IAgentsVoiceWindowService.toString()]: new SyncDescriptor(AgentsVoiceWindowService, [], true),
    [IAgentHostCustomizationService.toString()]: new SyncDescriptor(
      NullAgentHostCustomizationService,
      [],
      true
    ),
    [IInlineChatSessionResolver.toString()]: new SyncDescriptor(InlineChatSessionResolver, [], true)
  }
}

export { ChatEntitlement, type IChatEntitlementContextState, type IDefaultAccount }
