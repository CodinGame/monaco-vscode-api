import { ExtHostContext, MainContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostProgress } from 'vs/workbench/api/common/extHostProgress'
import { registerExtHostProvider } from '../extHost'
import 'vs/workbench/api/browser/mainThreadProgress'

registerExtHostProvider('progress', {
  dependencies: [],
  provide: (accessor) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostProgress = rpcProtocol.set(ExtHostContext.ExtHostProgress, new ExtHostProgress(rpcProtocol.getProxy(MainContext.MainThreadProgress)))

    return {
      extHostProgress
    }
  }
})
