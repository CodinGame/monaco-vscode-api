import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { ExtHostApiCommands } from 'vs/workbench/api/common/extHostApiCommands'
import { ExtHostCommands, IExtHostCommands } from 'vs/workbench/api/common/extHostCommands'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { registerExtHostProvider, registerExtHostSingleton } from '../extHost'
import 'vs/workbench/api/browser/mainThreadCommands'

registerExtHostSingleton(IExtHostCommands, ExtHostCommands, InstantiationType.Eager)

registerExtHostProvider('commands', {
  dependencies: [],
  provide: (accessor) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)
    const extHostCommands = rpcProtocol.set(ExtHostContext.ExtHostCommands, accessor.get(IExtHostCommands))

    // Register API-ish commands
    ExtHostApiCommands.register(extHostCommands)

    return {
      extHostCommands
    }
  }
})
