import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ITitleService } from 'vs/workbench/services/title/browser/titleService.service'
import { registerServiceInitializeParticipant } from '../../lifecycle'
import { TitleService } from 'vs/sessions/browser/parts/titlebarPart'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [ITitleService.toString()]: new SyncDescriptor(TitleService, [], false)
  }
}

registerServiceInitializeParticipant(async (accessor) => {
  accessor.get(ITitleService)
})
