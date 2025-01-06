import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { BannerPart } from 'vs/workbench/browser/parts/banner/bannerPart'
import { IBannerService } from 'vs/workbench/services/banner/browser/bannerService.service'
import { registerServiceInitializePostParticipant } from '../lifecycle'
import 'vs/workbench/contrib/welcomeBanner/browser/welcomeBanner.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IBannerService.toString()]: new SyncDescriptor(BannerPart, [], false)
  }
}

registerServiceInitializePostParticipant(async (accessor) => {
  accessor.get(IBannerService)
})

export { BannerPart }
