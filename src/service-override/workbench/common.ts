import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import getQuickAccessOverride from '../quickaccess'
import getKeybindingsOverride from '../keybindings'
export * from '../tools/views'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    ...getQuickAccessOverride({
      isKeybindingConfigurationVisible: () => true,
      shouldUseGlobalPicker: () => true
    }),
    ...getKeybindingsOverride({
      shouldUseGlobalKeybindings: () => true
    })
  }
}
