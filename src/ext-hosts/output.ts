import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostOutputService, IExtHostOutputService } from 'vs/workbench/api/common/extHostOutput'
import { registerExtHostProvider, registerExtHostSingleton } from '../extHost'
import 'vs/workbench/api/browser/mainThreadOutputService'

registerExtHostSingleton(IExtHostOutputService, ExtHostOutputService, InstantiationType.Delayed)

registerExtHostProvider('output', {
  dependencies: [],
  provide: (accessor) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostOutputService = rpcProtocol.set(ExtHostContext.ExtHostOutputService, accessor.get(IExtHostOutputService))

    return {
      extHostOutputService
    }
  }
})
