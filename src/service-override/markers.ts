import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import 'vs/workbench/contrib/markers/browser/markers.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {}
}
