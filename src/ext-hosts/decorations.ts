import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostDecorations, IExtHostDecorations } from 'vs/workbench/api/common/extHostDecorations'
import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { registerExtHostProvider, registerExtHostSingleton } from '../extHost'
import 'vs/workbench/api/browser/mainThreadDecorations'

registerExtHostSingleton(IExtHostDecorations, ExtHostDecorations, InstantiationType.Eager)

registerExtHostProvider('decorations', {
  dependencies: [],
  provide: (accessor) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostDecorations = rpcProtocol.set(ExtHostContext.ExtHostDecorations, accessor.get(IExtHostDecorations))

    return {
      extHostDecorations
    }
  }
})
