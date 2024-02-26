import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import 'vs/workbench/contrib/surveys/browser/nps.contribution'
import 'vs/workbench/contrib/surveys/browser/ces.contribution'
import 'vs/workbench/contrib/surveys/browser/languageSurveys.contribution'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
  }
}
