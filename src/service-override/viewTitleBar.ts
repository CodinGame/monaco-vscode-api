import '../missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ITitleService } from 'vs/workbench/services/title/common/titleService'
import { TitlebarPart } from 'vs/workbench/browser/parts/titlebar/titlebarPart'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [ITitleService.toString()]: new SyncDescriptor(TitlebarPart, [], false)
  }
}

export {
  TitlebarPart
}
