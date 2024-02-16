import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ShareService } from 'vs/workbench/contrib/share/browser/shareService'
import { IShareService } from 'vs/workbench/contrib/share/common/share'
import 'vs/workbench/contrib/share/browser/share.contribution'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IShareService.toString()]: new SyncDescriptor(ShareService, [], true)
  }
}
