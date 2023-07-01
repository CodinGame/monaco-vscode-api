import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostStatusBar } from 'vs/workbench/api/common/extHostStatusBar'
import { registerExtHostProvider } from '../extHost'
import 'vs/workbench/api/browser/mainThreadStatusBar'

registerExtHostProvider('statusBar', {
  dependencies: ['commands'],
  provide: (accessor, _, { extHostCommands }) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostStatusBar = rpcProtocol.set(ExtHostContext.ExtHostStatusBar, new ExtHostStatusBar(rpcProtocol, extHostCommands?.converter!))

    return {
      extHostStatusBar
    }
  }
})
