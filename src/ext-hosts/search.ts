import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostSearch, IExtHostSearch } from 'vs/workbench/api/common/extHostSearch'
import { registerExtHostProvider, registerExtHostSingleton } from '../extHost'
import 'vs/workbench/api/browser/mainThreadSearch'

registerExtHostSingleton(IExtHostSearch, ExtHostSearch, InstantiationType.Eager)

registerExtHostProvider('search', {
  dependencies: [],
  provide: (accessor) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)
    const extHostSearch = accessor.get(IExtHostSearch)

    rpcProtocol.set(ExtHostContext.ExtHostSearch, extHostSearch)

    return {
      extHostSearch
    }
  }
})
