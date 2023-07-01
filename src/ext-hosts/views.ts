import { ExtHostContext, MainContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostWebviews } from 'vs/workbench/api/common/extHostWebview'
import { ExtHostWebviewPanels } from 'vs/workbench/api/common/extHostWebviewPanels'
import { ExtHostCustomEditors } from 'vs/workbench/api/common/extHostCustomEditors'
import { ExtHostWebviewViews } from 'vs/workbench/api/common/extHostWebviewView'
import { IExtensionStoragePaths } from 'vs/workbench/api/common/extHostStoragePaths'
import { ExtHostTreeViews } from 'vs/workbench/api/common/extHostTreeViews'
import { registerExtHostProvider } from '../extHost'
import 'vs/workbench/api/browser/mainThreadWebviewManager'
import 'vs/workbench/api/browser/mainThreadTreeViews'

registerExtHostProvider('views', {
  dependencies: ['commands', 'documentsAndEditors', 'workspace'],
  provide: (accessor, _, { extHostApiDeprecationService, extHostLogService, extHostCommands, extHostInitData, extHostDocuments, extHostWorkspace }) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)
    const extensionStoragePaths = accessor.get(IExtensionStoragePaths)

    const extHostWebviews = rpcProtocol.set(ExtHostContext.ExtHostWebviews, new ExtHostWebviews(rpcProtocol, extHostInitData!.remote, extHostWorkspace, extHostLogService!, extHostApiDeprecationService!))
    const extHostWebviewPanels = rpcProtocol.set(ExtHostContext.ExtHostWebviewPanels, new ExtHostWebviewPanels(rpcProtocol, extHostWebviews, extHostWorkspace))
    const extHostCustomEditors = rpcProtocol.set(ExtHostContext.ExtHostCustomEditors, new ExtHostCustomEditors(rpcProtocol, extHostDocuments!, extensionStoragePaths, extHostWebviews, extHostWebviewPanels))
    const extHostWebviewViews = rpcProtocol.set(ExtHostContext.ExtHostWebviewViews, new ExtHostWebviewViews(rpcProtocol, extHostWebviews))
    const extHostTreeViews = rpcProtocol.set(ExtHostContext.ExtHostTreeViews, new ExtHostTreeViews(rpcProtocol.getProxy(MainContext.MainThreadTreeViews), extHostCommands!, extHostLogService!))

    return {
      extHostWebviews,
      extHostWebviewPanels,
      extHostCustomEditors,
      extHostWebviewViews,
      extHostTreeViews
    }
  }
})
