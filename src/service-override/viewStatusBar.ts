import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { StatusbarService } from 'vs/workbench/browser/parts/statusbar/statusbarPart'
import { IStatusbarService } from 'vs/workbench/services/statusbar/browser/statusbar.service'
import { ExtensionStatusBarItemService, IExtensionStatusBarItemService } from 'vs/workbench/api/browser/statusBarService'
import 'vs/workbench/api/browser/statusBarExtensionPoint'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IStatusbarService.toString()]: new SyncDescriptor(StatusbarService, [], false),
    [IExtensionStatusBarItemService.toString()]: new SyncDescriptor(ExtensionStatusBarItemService, [], false)
  }
}
