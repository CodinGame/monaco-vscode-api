import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostConfiguration, IExtHostConfiguration } from 'vs/workbench/api/common/extHostConfiguration'
import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { registerExtHostProvider, registerExtHostSingleton } from '../extHost'
import 'vs/workbench/api/browser/mainThreadConfiguration'

registerExtHostSingleton(IExtHostConfiguration, ExtHostConfiguration, InstantiationType.Eager)

registerExtHostProvider('configuration', {
  dependencies: [],
  provide: (accessor) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostConfiguration = rpcProtocol.set(ExtHostContext.ExtHostConfiguration, accessor.get(IExtHostConfiguration))

    return {
      extHostConfiguration
    }
  }
})
