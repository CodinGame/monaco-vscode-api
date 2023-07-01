import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostTheming } from 'vs/workbench/api/common/extHostTheming'
import { registerExtHostProvider } from '../extHost'
import 'vs/workbench/api/browser/mainThreadTheming'

registerExtHostProvider('theming', {
  dependencies: [],
  provide: (accessor) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostTheming = rpcProtocol.set(ExtHostContext.ExtHostTheming, new ExtHostTheming(rpcProtocol))

    return {
      extHostTheming
    }
  }
})
