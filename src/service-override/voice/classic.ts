import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { AgentsVoiceWindowService } from 'vs/workbench/contrib/agentsVoice/browser/agentsVoiceWindowService'
import { IAgentsVoiceWindowService } from 'vs/workbench/contrib/agentsVoice/common/agentsVoice.service'
import getCommonServiceOverride from './common.js'
export * from './common.js'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride(),
    [IAgentsVoiceWindowService.toString()]: new SyncDescriptor(AgentsVoiceWindowService, [], true)
  }
}
