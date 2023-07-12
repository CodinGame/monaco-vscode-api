import { ExtHostClipboard } from 'vs/workbench/api/common/extHostClipboard'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { registerExtHostProvider } from '../extHost'
import 'vs/workbench/api/browser/mainThreadClipboard'

registerExtHostProvider('clipboard', {
  dependencies: [],
  provide: (accessor) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostClipboard = new ExtHostClipboard(rpcProtocol)

    return {
      extHostClipboard
    }
  }
})
