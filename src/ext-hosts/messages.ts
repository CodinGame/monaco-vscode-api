import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { ExtHostCommands, IExtHostCommands } from 'vs/workbench/api/common/extHostCommands'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostMessageService } from 'vs/workbench/api/common/extHostMessageService'
import { MainThreadMessageService } from 'vs/workbench/api/browser/mainThreadMessageService'
import { registerExtHostProvider, registerExtHostSingleton } from '../extHost'

const original = MainThreadMessageService.prototype.$showMessage
MainThreadMessageService.prototype.$showMessage = function (severity, message, options, commands) {
  // Remove the source from the message so there is no "Extension Settings" button on notifications
  const _options = {
    ...options,
    source: undefined
  }
  return original.call(this, severity, message, _options, commands)
}

registerExtHostSingleton(IExtHostCommands, ExtHostCommands, InstantiationType.Eager)

registerExtHostProvider('messages', {
  dependencies: [],
  provide: (accessor, { extHostLogService }) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostMessageService = new ExtHostMessageService(rpcProtocol, extHostLogService!)

    return {
      extHostMessageService
    }
  }
})
