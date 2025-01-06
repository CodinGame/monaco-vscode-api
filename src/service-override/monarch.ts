import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import 'vs/editor/standalone/browser/inspectTokens/inspectTokens'
import 'vs/editor/standalone/browser/toggleHighContrast/toggleHighContrast'

export default function getServiceOverride(): IEditorOverrideServices {
  return {}
}
