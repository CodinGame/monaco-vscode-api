import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { InteractiveHistoryService } from 'vs/workbench/contrib/interactive/browser/interactiveHistoryService'
import { IInteractiveHistoryService } from 'vs/workbench/contrib/interactive/browser/interactiveHistoryService.service'
import { InteractiveDocumentService } from 'vs/workbench/contrib/interactive/browser/interactiveDocumentService'
import { IInteractiveDocumentService } from 'vs/workbench/contrib/interactive/browser/interactiveDocumentService.service'
import 'vs/workbench/contrib/interactive/browser/interactive.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IInteractiveHistoryService.toString()]: new SyncDescriptor(
      InteractiveHistoryService,
      [],
      true
    ),
    [IInteractiveDocumentService.toString()]: new SyncDescriptor(
      InteractiveDocumentService,
      [],
      true
    )
  }
}
