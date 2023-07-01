import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { IExtHostTerminalService } from 'vs/workbench/api/common/extHostTerminalService'
import { ExtHostTerminalService } from 'vs/workbench/api/node/extHostTerminalService'
import { registerExtHostProvider, registerExtHostSingleton } from '../extHost'
import 'vs/workbench/api/browser/mainThreadTerminalService'

registerExtHostSingleton(IExtHostTerminalService, ExtHostTerminalService, InstantiationType.Eager)

registerExtHostProvider('terminal', {
  dependencies: [],
  provide: (accessor) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostTerminalService = rpcProtocol.set(ExtHostContext.ExtHostTerminalService, accessor.get(IExtHostTerminalService))

    return {
      extHostTerminalService
    }
  }
})
