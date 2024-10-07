import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import 'vs/workbench/contrib/emmet/browser/emmet.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {}
}
