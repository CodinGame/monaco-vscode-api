import '../missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { BannerPart } from 'vs/workbench/browser/parts/banner/bannerPart'
import { IBannerService } from 'vs/workbench/services/banner/browser/bannerService'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IBannerService.toString()]: new SyncDescriptor(BannerPart, [], false)
  }
}

export {
  BannerPart
}
