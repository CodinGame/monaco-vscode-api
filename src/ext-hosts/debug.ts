import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { IExtHostDebugService, WorkerExtHostDebugService } from 'vs/workbench/api/common/extHostDebugService'
import { registerExtHostProvider, registerExtHostSingleton } from '../extHost'
import 'vs/workbench/api/browser/mainThreadDebugService'

registerExtHostSingleton(IExtHostDebugService, WorkerExtHostDebugService, InstantiationType.Eager)

registerExtHostProvider('debug', {
  dependencies: [],
  provide: (accessor) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostDebugService = rpcProtocol.set(ExtHostContext.ExtHostDebugService, accessor.get(IExtHostDebugService))

    return {
      extHostDebugService
    }
  }
})
