import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IInteractiveHistoryService, InteractiveHistoryService } from 'vs/workbench/contrib/interactive/browser/interactiveHistoryService'
import { IInteractiveDocumentService, InteractiveDocumentService } from 'vs/workbench/contrib/interactive/browser/interactiveDocumentService'
import 'vs/workbench/contrib/interactive/browser/interactive.contribution'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IInteractiveHistoryService.toString()]: new SyncDescriptor(InteractiveHistoryService, [], true),
    [IInteractiveDocumentService.toString()]: new SyncDescriptor(InteractiveDocumentService, [], true)
  }
}
