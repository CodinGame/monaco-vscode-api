import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IInlineChatSessionService } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionService.service'
import { InlineChatSessionServiceImpl } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionServiceImpl'
import {
  ChatEntitlement,
  type IChatEntitlementContextState
} from 'vs/workbench/services/chat/common/chatEntitlementService'
import { PromptsService } from 'vs/workbench/contrib/chat/common/promptSyntax/service/promptsServiceImpl'
import { IPromptsService } from 'vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.service'
import { IAICustomizationWorkspaceService } from 'vs/workbench/contrib/chat/common/aiCustomizationWorkspaceService.service'
import { Event } from 'vs/base/common/event'
import type { IDefaultAccount } from 'vs/base/common/defaultAccount'
import { IDefaultAccountService } from 'vs/platform/defaultAccount/common/defaultAccount.service'
import { MANAGED_SETTINGS_FRESHNESS_NOT_REQUIRED } from 'vs/platform/defaultAccount/common/defaultAccount'
import { ICustomizationHarnessService } from 'vs/workbench/contrib/chat/common/customizationHarnessService.service'
import { CustomizationHarnessService } from 'vs/workbench/contrib/chat/browser/aiCustomization/customizationHarnessService'
import { AICustomizationWorkspaceService } from 'vs/workbench/contrib/chat/browser/aiCustomization/aiCustomizationWorkspaceService'
import { IRemoteAgentHostService } from 'vs/platform/agentHost/common/remoteAgentHostService.service'
import { RemoteAgentHostService } from 'vs/platform/agentHost/browser/remoteAgentHostServiceImpl'
import { IAgentHostCustomizationService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService.service'
import { NullAgentHostCustomizationService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostCustomizationService'
import { IInlineChatSessionResolver } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionResolver.service'
import { InlineChatSessionResolver } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionResolver'
import { IAgentsVoiceWindowService } from 'vs/workbench/contrib/agentsVoice/common/agentsVoice.service'
import { AgentsVoiceWindowService } from 'vs/workbench/contrib/agentsVoice/browser/agentsVoiceWindowService'
export type { ITelemetryData, TelemetryLevel } from 'vs/platform/telemetry/common/telemetry'
import getCommonServiceOverride from './common.js'
import 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHost.contribution'
import 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostSettings.contribution'
import 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentSessionSettings.contribution'
import 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/openSessionLinkOpener.contribution'
import 'vs/workbench/contrib/chat/browser/chat.contribution'
import 'vs/workbench/contrib/chat/browser/chat.view.contribution'
import 'vs/workbench/contrib/inlineChat/browser/inlineChat.contribution'

class DefaultAccountService implements IDefaultAccountService {
  declare _serviceBrand: undefined
  constructor(private defaultAccount: IDefaultAccount | null) {}

  resolveGitHubUrl: IDefaultAccountService['resolveGitHubUrl'] = (path) => path
  currentDefaultAccount: IDefaultAccountService['currentDefaultAccount'] = null

  onDidChangePolicyData: IDefaultAccountService['onDidChangePolicyData'] = Event.None
  policyData: IDefaultAccountService['policyData'] = null
  managedSettingsFetchStatus: IDefaultAccountService['managedSettingsFetchStatus'] = null
  managedSettingsFetchedAt: IDefaultAccountService['managedSettingsFetchedAt'] = null
  managedSettingsRawResponse: IDefaultAccountService['managedSettingsRawResponse'] = undefined
  managedSettingsCompatibilityError: IDefaultAccountService['managedSettingsCompatibilityError'] =
    null
  onDidChangeManagedSettingsCompatibilityError: IDefaultAccountService['onDidChangeManagedSettingsCompatibilityError'] =
    Event.None
  managedSettingsFreshness: IDefaultAccountService['managedSettingsFreshness'] =
    MANAGED_SETTINGS_FRESHNESS_NOT_REQUIRED
  onDidChangeManagedSettingsFreshness: IDefaultAccountService['onDidChangeManagedSettingsFreshness'] =
    Event.None

  getDefaultAccountAuthenticationProvider: IDefaultAccountService['getDefaultAccountAuthenticationProvider'] =
    () => ({ id: 'default', name: 'Default', enterprise: false })
  setDefaultAccountProvider: IDefaultAccountService['setDefaultAccountProvider'] = () => {}
  refresh: IDefaultAccountService['refresh'] = async () => null
  signIn: IDefaultAccountService['signIn'] = async () => null

  readonly onDidChangeDefaultAccount: IDefaultAccountService['onDidChangeDefaultAccount'] =
    Event.None

  getDefaultAccount: IDefaultAccountService['getDefaultAccount'] = async () => this.defaultAccount

  copilotTokenInfo: IDefaultAccountService['copilotTokenInfo'] = null
  onDidChangeCopilotTokenInfo: IDefaultAccountService['onDidChangeCopilotTokenInfo'] = Event.None
  signOut: IDefaultAccountService['signOut'] = async () => {}
}

export interface ChatServiceOverrideOptions {
  defaultAccount?: IDefaultAccount
}

export default function getServiceOverride({
  defaultAccount
}: ChatServiceOverrideOptions = {}): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride(),
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
    [IDefaultAccountService.toString()]: new SyncDescriptor(
      DefaultAccountService,
      [defaultAccount],
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

export { type IDefaultAccount, ChatEntitlement, type IChatEntitlementContextState }
