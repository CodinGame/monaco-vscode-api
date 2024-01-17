import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import 'vs/workbench/contrib/codeEditor/browser/outline/documentSymbolsOutline'
import 'vs/workbench/contrib/outline/browser/outline.contribution'
import { IOutlineService } from 'vs/workbench/services/outline/browser/outline'
import { OutlineService } from 'vs/workbench/services/outline/browser/outlineService'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IOutlineService.toString()]: new SyncDescriptor(OutlineService, [], true)
  }
}
