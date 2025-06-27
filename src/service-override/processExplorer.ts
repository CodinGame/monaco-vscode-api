import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import 'vs/workbench/contrib/processExplorer/browser/processExplorer.contribution'
import 'vs/workbench/contrib/processExplorer/browser/processExplorer.web.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {}
}
