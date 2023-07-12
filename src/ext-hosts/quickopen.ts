import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { createExtHostQuickOpen } from 'vs/workbench/api/common/extHostQuickOpen'
import { IExtHostWorkspaceProvider } from 'vs/workbench/api/common/extHostWorkspace'
import { registerExtHostProvider } from '../extHost'
import 'vs/workbench/api/browser/mainThreadQuickOpen'

registerExtHostProvider('quickopen', {
  dependencies: ['commands'],
  provide: (accessor, { extHostCommands }) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostQuickOpen = rpcProtocol.set(ExtHostContext.ExtHostQuickOpen, createExtHostQuickOpen(rpcProtocol, <IExtHostWorkspaceProvider><unknown>null, extHostCommands!))

    return {
      extHostQuickOpen
    }
  }
})
