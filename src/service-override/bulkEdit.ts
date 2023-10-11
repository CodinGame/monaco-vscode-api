import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IBulkEditService } from 'vs/editor/browser/services/bulkEditService'
import { BulkEditService } from 'vs/workbench/contrib/bulkEdit/browser/bulkEditService'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IBulkEditService.toString()]: new SyncDescriptor(BulkEditService, [], true)
  }
}
