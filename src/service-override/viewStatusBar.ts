import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { StatusbarService } from 'vs/workbench/browser/parts/statusbar/statusbarPart'
import { IStatusbarService } from 'vs/workbench/services/statusbar/browser/statusbar'
import { IWorkbenchContribution, WorkbenchPhase, registerWorkbenchContribution2 } from 'vs/workbench/common/contributions'
import { ExtensionStatusBarItemService, IExtensionStatusBarItemService, StatusBarItemsExtensionPoint } from 'vs/workbench/api/browser/statusBarExtensionPoint'

class ExtensionPoints implements IWorkbenchContribution {
  static readonly ID = 'workbench.contrib.extensionPoints.statusBar'

  constructor (
    @IInstantiationService private readonly instantiationService: IInstantiationService
  ) {
    this.instantiationService.createInstance(StatusBarItemsExtensionPoint)
  }
}
registerWorkbenchContribution2(ExtensionPoints.ID, ExtensionPoints, WorkbenchPhase.BlockStartup)

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IStatusbarService.toString()]: new SyncDescriptor(StatusbarService, [], false),
    [IExtensionStatusBarItemService.toString()]: new SyncDescriptor(ExtensionStatusBarItemService, [], false)
  }
}
