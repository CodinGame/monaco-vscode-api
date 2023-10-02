import '../missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { StatusbarPart } from 'vs/workbench/browser/parts/statusbar/statusbarPart'
import { IStatusbarService } from 'vs/workbench/services/statusbar/browser/statusbar'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IStatusbarService.toString()]: new SyncDescriptor(StatusbarPart, [], false)
  }
}

export {
  StatusbarPart
}
