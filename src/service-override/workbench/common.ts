import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import getQuickAccessOverride from '../quickaccess'
import getKeybindingsOverride from '../keybindings'

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
