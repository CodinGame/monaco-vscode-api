import '../missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { BrowserWorkbenchEnvironmentService, IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService'
import { URI } from 'vs/base/common/uri'
import { IEnvironmentService } from 'vs/platform/environment/common/environment'
import { IProductService } from 'vs/platform/product/common/productService'
import { IWorkbenchConstructionOptions } from 'vs/workbench/browser/web.api'

class InjectedBrowserWorkbenchEnvironmentService extends BrowserWorkbenchEnvironmentService implements IBrowserWorkbenchEnvironmentService {
  constructor (options: IWorkbenchConstructionOptions, @IProductService productService: IProductService) {
    super('default', URI.from({ scheme: 'logs', path: '/' }), options, productService)
  }
}

export default function getServiceOverride (options: IWorkbenchConstructionOptions = {}): IEditorOverrideServices {
  return {
    [IEnvironmentService.toString()]: new SyncDescriptor(InjectedBrowserWorkbenchEnvironmentService, [], true),
    [IBrowserWorkbenchEnvironmentService.toString()]: new SyncDescriptor(InjectedBrowserWorkbenchEnvironmentService, [options], true)
  }
}

export {
  IWorkbenchConstructionOptions
}
