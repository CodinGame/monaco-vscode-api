import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import 'vs/workbench/contrib/welcomeViews/common/viewsWelcome.contribution'
import 'vs/workbench/contrib/welcomeViews/common/newFile.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {}
}
