import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostWorkspace, IExtHostWorkspace } from 'vs/workbench/api/common/extHostWorkspace'
import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { registerExtHostProvider, registerExtHostSingleton } from '../extHost'
import 'vs/workbench/api/browser/mainThreadWorkspace'

registerExtHostSingleton(IExtHostWorkspace, ExtHostWorkspace, InstantiationType.Eager)

registerExtHostProvider('workspace', {
  dependencies: [],
  provide: (accessor) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostWorkspace = rpcProtocol.set(ExtHostContext.ExtHostWorkspace, accessor.get(IExtHostWorkspace))

    return {
      extHostWorkspace
    }
  }
})
