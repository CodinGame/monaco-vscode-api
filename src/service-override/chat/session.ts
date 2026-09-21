import type { IDefaultAccount } from 'vs/base/common/defaultAccount'
import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { AgentsWindowRemoteAgentHostService } from 'vs/platform/agentHost/browser/remoteAgentHostServiceImpl'
import { IRemoteAgentHostService } from 'vs/platform/agentHost/common/remoteAgentHostService.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IAgentHostCustomizationService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.service'
import { IAICustomizationWorkspaceService } from 'vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.service'
import { ICustomizationHarnessService } from 'vs/workbench/contrib/chat/common/customizationHarnessService.service'
import { IPromptsService } from 'vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.service'
import { IInlineChatSessionService } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionService.service'
import {
  ChatEntitlement,
  type IChatEntitlementContextState
} from 'vs/workbench/services/chat/common/chatEntitlementService'
export type { ITelemetryData, TelemetryLevel } from 'vs/platform/telemetry/common/telemetry'
import { SessionsAICustomizationWorkspaceService } from 'vs/sessions/contrib/chat/browser/aiCustomizationWorkspaceService'
import { SessionsCustomizationHarnessService } from 'vs/sessions/contrib/chat/browser/customizationHarnessService'
import { NullInlineChatSessionService } from 'vs/sessions/contrib/chat/browser/nullInlineChatSessionService'
import { AgenticPromptsService } from 'vs/sessions/contrib/chat/browser/promptsService'
import { AgentHostCustomizationService } from 'vs/sessions/services/agentHost/browser/agentHostCustomizationService'
import getCommonServiceOverride from './common.js'
import { IChatResponseFileChangesService } from 'vs/workbench/contrib/chat/browser/chatResponseFileChangesService.service.js'
import { SessionsChatResponseFileChangesService } from 'vs/sessions/contrib/chat/browser/sessionTurnChanges.js'

import 'vs/sessions/contrib/chat/browser/btwSlashCommand.contribution'
import 'vs/sessions/contrib/chat/browser/chat.contribution'
import 'vs/sessions/contrib/chat/browser/customizationsDebugLog.contribution'
import 'vs/sessions/contrib/chat/browser/openSessionLinkOpener.contribution'
import 'vs/sessions/contrib/chat/browser/requestOriginProvider.contribution'
import 'vs/sessions/contrib/chat/browser/sideChatProvider.contribution'
import 'vs/sessions/contrib/chat/browser/voiceBridge.contribution'
import 'vs/sessions/contrib/providers/agentHost/browser/agentHostSettings.contribution'
import 'vs/sessions/contrib/providers/agentHost/browser/agentSessionSettings.contribution'
import 'vs/sessions/contrib/providers/copilotChatSessions/browser/copilotChatSessions.contribution'
import 'vs/sessions/contrib/providers/copilotChatSessions/browser/mobilePermissionPicker.contribution'
import 'vs/sessions/contrib/providers/remoteAgentHost/browser/cloudSandboxAgentHost.contribution'
import 'vs/sessions/contrib/providers/remoteAgentHost/browser/hostFilter.contribution'
import 'vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHost.contribution'
import 'vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHostTerminal.contribution'
import 'vs/sessions/contrib/providers/remoteAgentHost/browser/tunnelAgentHost.contribution'
import 'vs/sessions/contrib/providers/remoteAgentHost/browser/webSocketAgentHost.contribution'
import 'vs/sessions/contrib/providers/remoteAgentHost/browser/webTunnelAgentHostService.contribution'
import 'vs/sessions/contrib/providers/remoteAgentHost/browser/wslAgentHost.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride(),
    [IInlineChatSessionService.toString()]: new SyncDescriptor(
      NullInlineChatSessionService,
      [],
      true
    ),
    [IPromptsService.toString()]: new SyncDescriptor(AgenticPromptsService, [], true),
    [IAICustomizationWorkspaceService.toString()]: new SyncDescriptor(
      SessionsAICustomizationWorkspaceService,
      [],
      true
    ),
    [ICustomizationHarnessService.toString()]: new SyncDescriptor(
      SessionsCustomizationHarnessService,
      [],
      true
    ),
    [IRemoteAgentHostService.toString()]: new SyncDescriptor(
      AgentsWindowRemoteAgentHostService,
      [],
      true
    ),
    [IAgentHostCustomizationService.toString()]: new SyncDescriptor(
      AgentHostCustomizationService,
      [],
      true
    ),
    [IChatResponseFileChangesService.toString()]: new SyncDescriptor(
      SessionsChatResponseFileChangesService,
      [],
      true
    )
  }
}

export { ChatEntitlement, type IChatEntitlementContextState, type IDefaultAccount }
