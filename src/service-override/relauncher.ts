import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import 'vs/workbench/contrib/relauncher/browser/relauncher.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {}
}
