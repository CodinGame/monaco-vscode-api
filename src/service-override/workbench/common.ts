import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import getQuickAccessOverride from '../quickaccess'
import getKeybindingsOverride from '../keybindings'
import { disableWorkbenchHooks } from '../../lifecycle'
export * from '../tools/views'

disableWorkbenchHooks()

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
