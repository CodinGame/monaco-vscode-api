import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { StatusbarPart } from 'vs/workbench/browser/parts/statusbar/statusbarPart'
import { IStatusbarService } from 'vs/workbench/services/statusbar/browser/statusbar'
import { IWorkbenchContribution, IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'vs/workbench/common/contributions'
import { LifecyclePhase } from 'vs/workbench/services/lifecycle/common/lifecycle'
import { ExtensionStatusBarItemService, IExtensionStatusBarItemService, StatusBarItemsExtensionPoint } from 'vs/workbench/api/browser/statusBarExtensionPoint'
import { Registry } from 'vs/platform/registry/common/platform'

class ExtensionPoints implements IWorkbenchContribution {
  constructor (
    @IInstantiationService private readonly instantiationService: IInstantiationService
  ) {
    this.instantiationService.createInstance(StatusBarItemsExtensionPoint)
  }
}
Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).registerWorkbenchContribution(ExtensionPoints, LifecyclePhase.Starting)

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IStatusbarService.toString()]: new SyncDescriptor(StatusbarPart, [], false),
    [IExtensionStatusBarItemService.toString()]: new SyncDescriptor(ExtensionStatusBarItemService, [], false)
  }
}

export {
  StatusbarPart
}
