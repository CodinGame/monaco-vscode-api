import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import 'vs/workbench/contrib/surveys/browser/survey.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {}
}
