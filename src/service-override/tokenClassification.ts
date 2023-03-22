import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { TokenClassificationExtensionPoints } from 'vs/workbench/services/themes/common/tokenClassificationExtensionPoint'
import { onServicesInitialized } from './tools'
import { IInstantiationService } from '../services'

// The interfaces are not exported
interface ITokenTypeExtensionPoint {
  id: string
  description: string
  superType?: string
}

interface ITokenModifierExtensionPoint {
  id: string
  description: string
}

interface ITokenStyleDefaultExtensionPoint {
  language?: string
  scopes: { [selector: string]: string[] }
}

function initialize (instantiationService: IInstantiationService) {
  instantiationService.createInstance(TokenClassificationExtensionPoints)
}

export default function getServiceOverride (): IEditorOverrideServices {
  onServicesInitialized(initialize)
  return {}
}

export {
  ITokenTypeExtensionPoint,
  ITokenModifierExtensionPoint,
  ITokenStyleDefaultExtensionPoint
}
