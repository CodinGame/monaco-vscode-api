import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostFileSystem } from 'vs/workbench/api/common/extHostFileSystem'
import { ExtHostConsumerFileSystem, IExtHostConsumerFileSystem } from 'vs/workbench/api/common/extHostFileSystemConsumer'
import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { ExtHostFileSystemInfo, IExtHostFileSystemInfo } from 'vs/workbench/api/common/extHostFileSystemInfo'
import { registerExtHostProvider, registerExtHostSingleton } from '../extHost'
import 'vs/workbench/api/browser/mainThreadFileSystem'

registerExtHostSingleton(IExtHostConsumerFileSystem, ExtHostConsumerFileSystem, InstantiationType.Eager)
registerExtHostSingleton(IExtHostFileSystemInfo, ExtHostFileSystemInfo, InstantiationType.Eager)

registerExtHostProvider('filesystem', {
  dependencies: ['languages'],
  provide: (accessor, { extHostLanguageFeatures }) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostConsumerFileSystem = accessor.get(IExtHostConsumerFileSystem)
    const extHostFileSystemInfo = accessor.get(IExtHostFileSystemInfo)

    rpcProtocol.set(ExtHostContext.ExtHostFileSystemInfo, extHostFileSystemInfo)

    const extHostFileSystem = rpcProtocol.set(ExtHostContext.ExtHostFileSystem, new ExtHostFileSystem(rpcProtocol, extHostLanguageFeatures!))

    return {
      extHostFileSystem,
      extHostConsumerFileSystem,
      extHostFileSystemInfo
    }
  }
})
