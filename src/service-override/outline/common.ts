import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IOutlineService } from 'vs/workbench/services/outline/browser/outline.service'
import { OutlineService } from 'vs/workbench/services/outline/browser/outlineService'
import 'vs/workbench/contrib/codeEditor/browser/outline/documentSymbolsOutline'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IOutlineService.toString()]: new SyncDescriptor(OutlineService, [], true)
  }
}
