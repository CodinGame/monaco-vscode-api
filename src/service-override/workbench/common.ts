import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import getQuickAccessOverride from '../quickaccess'
import getKeybindingsOverride from '../keybindings'
import { IEditorService } from 'vs/workbench/services/editor/common/editorService.service'
import { EditorService } from 'vs/workbench/services/editor/browser/editorService'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    ...getQuickAccessOverride({
      isKeybindingConfigurationVisible: () => true,
      shouldUseGlobalPicker: () => true
    }),
    ...getKeybindingsOverride({
      shouldUseGlobalKeybindings: () => true
    }),
    [IEditorService.toString()]: new SyncDescriptor(EditorService, [undefined], false)
  }
}
