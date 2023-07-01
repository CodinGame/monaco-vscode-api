import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { ExtHostStorage, IExtHostStorage } from 'vs/workbench/api/common/extHostStorage'
import { ILogService } from 'vs/platform/log/common/log'
import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { registerExtHostProvider, registerExtHostSingleton } from '../extHost'
import 'vs/workbench/api/browser/mainThreadStorage'

class _ExtHostStorage extends ExtHostStorage {
  constructor (
    @IExtHostRpcService extHostRpc: IExtHostRpcService, // annotation is missing on the original class
    @ILogService _logService: ILogService
  ) {
    super(extHostRpc, _logService)
  }
}
registerExtHostSingleton(IExtHostStorage, _ExtHostStorage, InstantiationType.Eager)

registerExtHostProvider('storage', {
  dependencies: [],
  provide: (accessor) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)
    const extHostStorage = accessor.get(IExtHostStorage)

    rpcProtocol.set(ExtHostContext.ExtHostStorage, extHostStorage)

    return {
      extHostStorage
    }
  }
})
