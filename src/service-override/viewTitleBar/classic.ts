import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { BrowserTitleService } from 'vs/workbench/browser/parts/titlebar/titlebarPart'
import { ITitleService } from 'vs/workbench/services/title/browser/titleService.service'
import { registerServiceInitializeParticipant } from '../../lifecycle'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [ITitleService.toString()]: new SyncDescriptor(BrowserTitleService, [], false)
  }
}

registerServiceInitializeParticipant(async (accessor) => {
  accessor.get(ITitleService)
})
