import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { TokenClassificationExtensionPoints } from 'vs/workbench/services/themes/common/tokenClassificationExtensionPoint'
import { onServicesInitialized } from './tools'
import { IInstantiationService } from '../services'

function initialize (instantiationService: IInstantiationService) {
  instantiationService.createInstance(TokenClassificationExtensionPoints)
}

export default function getServiceOverride (): IEditorOverrideServices {
  onServicesInitialized(initialize)
  return {}
}
