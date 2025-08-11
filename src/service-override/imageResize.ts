import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ImageResizeService } from 'vs/platform/imageResize/browser/imageResizeService'
import { IImageResizeService } from 'vs/platform/imageResize/common/imageResizeService.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IImageResizeService.toString()]: new SyncDescriptor(ImageResizeService, [], true)
  }
}
