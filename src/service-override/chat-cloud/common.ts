import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { CloudSandboxAgentHostService } from 'vs/workbench/contrib/chat/browser/remoteAgentHost/cloudSandboxAgentHostService'
import { CloudSandboxApiService } from 'vs/workbench/contrib/chat/browser/remoteAgentHost/cloudSandboxApiService'
import { CloudSandboxModelCatalogService } from 'vs/workbench/contrib/chat/browser/remoteAgentHost/cloudSandboxModels'
import { ICloudSandboxModelCatalogService } from 'vs/workbench/contrib/chat/browser/remoteAgentHost/cloudSandboxModels.service'
import { MissionControlEnvironmentService } from 'vs/workbench/contrib/chat/browser/remoteAgentHost/missionControlEnvironmentService'
import { MissionControlSharingService } from 'vs/workbench/contrib/chat/browser/remoteAgentHost/missionControlSharingService'
import {
  ICloudSandboxAgentHostService,
  ICloudSandboxApiService
} from 'vs/platform/agentHost/common/cloudSandboxAgentHost.service'
import {
  IMissionControlEnvironmentService,
  IMissionControlSharingService
} from 'vs/platform/agentHost/common/missionControlEnvironment.service'
import { ChatMicrosoftSignInProbeService } from 'vs/workbench/contrib/chat/browser/chatSetup/chatSetupMicrosoftProbe'
import { IChatMicrosoftSignInProbeService } from 'vs/workbench/contrib/chat/browser/chatSetup/chatSetupMicrosoftProbe.service'
import { CloudSandboxTelemetryService } from 'vs/workbench/contrib/chat/browser/remoteAgentHost/cloudSandboxTelemetry'
import { ICloudSandboxTelemetryService } from 'vs/workbench/contrib/chat/browser/remoteAgentHost/cloudSandboxTelemetry.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [ICloudSandboxApiService.toString()]: new SyncDescriptor(CloudSandboxApiService, [], true),
    [ICloudSandboxModelCatalogService.toString()]: new SyncDescriptor(
      CloudSandboxModelCatalogService,
      [],
      true
    ),
    [ICloudSandboxAgentHostService.toString()]: new SyncDescriptor(
      CloudSandboxAgentHostService,
      [],
      true
    ),
    [IMissionControlEnvironmentService.toString()]: new SyncDescriptor(
      MissionControlEnvironmentService,
      [],
      true
    ),
    [IMissionControlSharingService.toString()]: new SyncDescriptor(
      MissionControlSharingService,
      [],
      true
    ),
    [ICloudSandboxTelemetryService.toString()]: new SyncDescriptor(
      CloudSandboxTelemetryService,
      [],
      true
    ),
    [IChatMicrosoftSignInProbeService.toString()]: new SyncDescriptor(
      ChatMicrosoftSignInProbeService,
      [],
      true
    )
  }
}
