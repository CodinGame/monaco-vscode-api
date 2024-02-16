import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import 'vs/workbench/contrib/performance/browser/performance.contribution'
import 'vs/workbench/contrib/performance/browser/performance.web.contribution'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
  }
}
