import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostDialogs } from 'vs/workbench/api/common/extHostDialogs'
import { registerExtHostProvider } from '../extHost'
import 'vs/workbench/api/browser/mainThreadDialogs'

registerExtHostProvider('dialogs', {
  dependencies: [],
  provide: (accessor) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostDialogs = new ExtHostDialogs(rpcProtocol)

    return {
      extHostDialogs
    }
  }
})
