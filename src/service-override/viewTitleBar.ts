import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { BrowserTitleService } from 'vs/workbench/browser/parts/titlebar/titlebarPart'
import { ITitleService } from 'vs/workbench/services/title/browser/titleService'
import { registerServiceInitializePostParticipant } from '../lifecycle'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [ITitleService.toString()]: new SyncDescriptor(BrowserTitleService, [], false)
  }
}

registerServiceInitializePostParticipant(async accessor => {
  accessor.get(ITitleService)
})
