import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostLanguages } from 'vs/workbench/api/common/extHostLanguages'
import { IURITransformerService } from 'vs/workbench/api/common/extHostUriTransformerService'
import { registerExtHostProvider } from '../extHost'
import 'vs/workbench/api/browser/mainThreadLanguages'

registerExtHostProvider('languages', {
  dependencies: ['documentsAndEditors', 'commands'],
  provide: (accessor, mainContext, { extHostDocuments, extHostCommands }) => {
    const uriTransformerService = accessor.get(IURITransformerService)
    const rpcProtocol = accessor.get(IExtHostRpcService)

    const extHostLanguages = rpcProtocol.set(ExtHostContext.ExtHostLanguages, new ExtHostLanguages(mainContext, extHostDocuments!, extHostCommands?.converter!, uriTransformerService))

    return {
      extHostLanguages
    }
  }
})
