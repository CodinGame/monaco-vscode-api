import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IBulkEditService } from 'vs/editor/browser/services/bulkEditService'
import { BulkEditService } from 'vs/workbench/contrib/bulkEdit/browser/bulkEditService'
import 'vs/workbench/contrib/bulkEdit/browser/preview/bulkEdit.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IBulkEditService.toString()]: new SyncDescriptor(BulkEditService, [], true)
  }
}
