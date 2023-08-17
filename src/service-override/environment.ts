import '../missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { BrowserWorkbenchEnvironmentService, IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService'
import { URI } from 'vs/base/common/uri'
import { IEnvironmentService } from 'vs/platform/environment/common/environment'
import { IProductService } from 'vs/platform/product/common/productService'

class InjectedBrowserWorkbenchEnvironmentService extends BrowserWorkbenchEnvironmentService implements IBrowserWorkbenchEnvironmentService {
  constructor (@IProductService productService: IProductService) {
    super('default', URI.from({ scheme: 'logs', path: '/' }), {}, productService)
  }
}

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IEnvironmentService.toString()]: new SyncDescriptor(InjectedBrowserWorkbenchEnvironmentService, [], true),
    [IBrowserWorkbenchEnvironmentService.toString()]: new SyncDescriptor(InjectedBrowserWorkbenchEnvironmentService, [], true)
  }
}
