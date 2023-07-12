import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostFileSystemEventService } from 'vs/workbench/api/common/extHostFileSystemEventService'
import { ExtHostConsumerFileSystem, IExtHostConsumerFileSystem } from 'vs/workbench/api/common/extHostFileSystemConsumer'
import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { registerExtHostProvider, registerExtHostSingleton } from '../extHost'
import 'vs/workbench/api/browser/mainThreadFileSystemEventService'

registerExtHostSingleton(IExtHostConsumerFileSystem, ExtHostConsumerFileSystem, InstantiationType.Eager)

registerExtHostProvider('filesystemEvent', {
  dependencies: ['documentsAndEditors'],
  provide: (accessor, { extHostLogService, extHostDocumentsAndEditors }) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostFileSystemEvent = rpcProtocol.set(ExtHostContext.ExtHostFileSystemEventService, new ExtHostFileSystemEventService(rpcProtocol, extHostLogService!, extHostDocumentsAndEditors!))

    return {
      extHostFileSystemEvent
    }
  }
})
