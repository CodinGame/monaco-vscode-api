import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostEditorTabs, IExtHostEditorTabs } from 'vs/workbench/api/common/extHostEditorTabs'
import { registerExtHostProvider, registerExtHostSingleton } from '../extHost'
import 'vs/workbench/api/browser/mainThreadEditorTabs'

registerExtHostSingleton(IExtHostEditorTabs, ExtHostEditorTabs, InstantiationType.Eager)

registerExtHostProvider('editorTabs', {
  dependencies: ['commands', 'documentsAndEditors', 'workspace'],
  provide: (accessor) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)
    const extHostEditorTabs = accessor.get(IExtHostEditorTabs)

    rpcProtocol.set(ExtHostContext.ExtHostEditorTabs, extHostEditorTabs)

    return {
      extHostEditorTabs
    }
  }
})
