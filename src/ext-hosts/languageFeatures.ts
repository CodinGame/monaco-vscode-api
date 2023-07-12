import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { IURITransformerService } from 'vs/workbench/api/common/extHostUriTransformerService'
import { ExtHostLanguageFeatures } from 'vs/workbench/api/common/extHostLanguageFeatures'
import { ExtHostDiagnostics } from 'vs/workbench/api/common/extHostDiagnostics'
import { registerExtHostProvider } from '../extHost'
import 'vs/workbench/api/browser/mainThreadLanguageFeatures'
import 'vs/workbench/api/browser/mainThreadDiagnostics'

registerExtHostProvider('languageFeatures', {
  dependencies: ['documentsAndEditors', 'commands', 'filesystem'],
  provide: (accessor, { extHostFileSystemInfo, extHostLogService, extHostApiDeprecationService, extHostTelemetry, extHostDocuments, extHostCommands, extHostDocumentsAndEditors }) => {
    const uriTransformerService = accessor.get(IURITransformerService)
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostDiagnostics = rpcProtocol.set(ExtHostContext.ExtHostDiagnostics, new ExtHostDiagnostics(rpcProtocol, extHostLogService!, extHostFileSystemInfo!, extHostDocumentsAndEditors!))
    const extHostLanguageFeatures = rpcProtocol.set(ExtHostContext.ExtHostLanguageFeatures, new ExtHostLanguageFeatures(rpcProtocol, uriTransformerService, extHostDocuments!, extHostCommands!, extHostDiagnostics, extHostLogService!, extHostApiDeprecationService!, extHostTelemetry!))

    return {
      extHostLanguageFeatures,
      extHostDiagnostics
    }
  }
})
