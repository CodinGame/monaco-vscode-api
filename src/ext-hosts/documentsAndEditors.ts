import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { ExtHostContext, MainContext } from 'vs/workbench/api/common/extHost.protocol'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ExtHostDocumentsAndEditors, IExtHostDocumentsAndEditors } from 'vs/workbench/api/common/extHostDocumentsAndEditors'
import { ExtHostDocuments } from 'vs/workbench/api/common/extHostDocuments'
import { ExtHostEditors } from 'vs/workbench/api/common/extHostTextEditors'
import { ExtHostDocumentContentProvider } from 'vs/workbench/api/common/extHostDocumentContentProviders'
import { ExtHostBulkEdits } from 'vs/workbench/api/common/extHostBulkEdits'
import { ExtHostDocumentSaveParticipant } from 'vs/workbench/api/common/extHostDocumentSaveParticipant'
import { registerExtHostProvider, registerExtHostSingleton } from '../extHost'
import 'vs/workbench/api/browser/mainThreadDocumentContentProviders'
import 'vs/workbench/api/browser/mainThreadDocumentsAndEditors'
import 'vs/workbench/api/browser/mainThreadBulkEdits'
import 'vs/workbench/api/browser/mainThreadSaveParticipant'

registerExtHostSingleton(IExtHostDocumentsAndEditors, ExtHostDocumentsAndEditors, InstantiationType.Eager)

registerExtHostProvider('documentsAndEditors', {
  dependencies: [],
  provide: (accessor, mainContext, { extHostLogService }) => {
    const rpcProtocol = accessor.get(IExtHostRpcService)
    const extHostDocumentsAndEditors = rpcProtocol.set(ExtHostContext.ExtHostDocumentsAndEditors, accessor.get(IExtHostDocumentsAndEditors))
    const extHostDocuments = rpcProtocol.set(ExtHostContext.ExtHostDocuments, new ExtHostDocuments(mainContext, extHostDocumentsAndEditors))
    const extHostEditors = rpcProtocol.set(ExtHostContext.ExtHostEditors, new ExtHostEditors(mainContext, extHostDocumentsAndEditors))
    const extHostDocumentContentProvider = rpcProtocol.set(ExtHostContext.ExtHostDocumentContentProviders, new ExtHostDocumentContentProvider(mainContext, extHostDocumentsAndEditors, extHostLogService!))
    const extHostBulkEdits = new ExtHostBulkEdits(rpcProtocol, extHostDocumentsAndEditors)
    const extHostDocumentSaveParticipant = rpcProtocol.set(ExtHostContext.ExtHostDocumentSaveParticipant, new ExtHostDocumentSaveParticipant(extHostLogService!, extHostDocuments, rpcProtocol.getProxy(MainContext.MainThreadBulkEdits)))

    return {
      extHostDocuments,
      extHostDocumentsAndEditors,
      extHostEditors,
      extHostDocumentContentProvider,
      extHostBulkEdits,
      extHostDocumentSaveParticipant
    }
  }
})
