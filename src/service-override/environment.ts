import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { BrowserWorkbenchEnvironmentService, IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService'
import { IEnvironmentService } from 'vs/platform/environment/common/environment'
import { IProductService } from 'vs/platform/product/common/productService'
import { IWorkbenchConstructionOptions } from 'vs/workbench/browser/web.api'
import { getWorkbenchConstructionOptions, getWorkspaceIdentifier, logsPath } from '../workbench'

class InjectedBrowserWorkbenchEnvironmentService extends BrowserWorkbenchEnvironmentService implements IBrowserWorkbenchEnvironmentService {
  constructor (workspaceId: string = getWorkspaceIdentifier().id, options: IWorkbenchConstructionOptions = getWorkbenchConstructionOptions(), @IProductService productService: IProductService) {
    super(workspaceId, logsPath, options, productService)
  }
}

/**
 * @deprecated Provide construction option via the services `initialize` function `configuration` parameter
 */
function getServiceOverride (options: IWorkbenchConstructionOptions): IEditorOverrideServices
function getServiceOverride (): IEditorOverrideServices

function getServiceOverride (options?: IWorkbenchConstructionOptions): IEditorOverrideServices {
  return {
    [IEnvironmentService.toString()]: new SyncDescriptor(InjectedBrowserWorkbenchEnvironmentService, [undefined, options], true)
  }
}

export default getServiceOverride

export {
  IWorkbenchConstructionOptions
}
