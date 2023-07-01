import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { ExtHostWindow, IExtHostWindow } from 'vs/workbench/api/common/extHostWindow'
import { ExtHostUriOpeners } from 'vs/workbench/api/common/extHostUriOpener'
import { registerExtHostProvider, registerExtHostSingleton } from '../extHost'
import 'vs/workbench/api/browser/mainThreadWindow'
import 'vs/workbench/api/browser/mainThreadUriOpeners'

registerExtHostSingleton(IExtHostWindow, ExtHostWindow, InstantiationType.Eager)

registerExtHostProvider('window', {
  dependencies: [],
  provide: (accessor) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostWindow = rpcProtocol.set(ExtHostContext.ExtHostWindow, accessor.get(IExtHostWindow))
    const extHostUriOpeners = rpcProtocol.set(ExtHostContext.ExtHostUriOpeners, new ExtHostUriOpeners(rpcProtocol))

    return {
      extHostWindow,
      extHostUriOpeners
    }
  }
})
