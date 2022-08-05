import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { TokenClassificationExtensionPoints } from 'vs/workbench/services/themes/common/tokenClassificationExtensionPoint'
import { ExtensionMessageCollector } from 'vs/workbench/services/extensions/common/extensionsRegistry'
import { IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { consoleExtensionMessageHandler, getExtensionPoint } from './tools'
import { IInstantiationService, Services } from '../services'
import { DEFAULT_EXTENSION } from '../vscode-services/extHost'

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

const tokenTypeExtPoint = getExtensionPoint<ITokenTypeExtensionPoint[]>('semanticTokenTypes')
const tokenModifierExtPoint = getExtensionPoint<ITokenModifierExtensionPoint[]>('semanticTokenModifiers')
const tokenStyleDefaultsExtPoint = getExtensionPoint<ITokenStyleDefaultExtensionPoint[]>('semanticTokenScopes')

function setTokenTypes (tokenTypes: ITokenTypeExtensionPoint[], extension: IExtensionDescription = Services.get().extension ?? DEFAULT_EXTENSION): void {
  tokenTypeExtPoint.acceptUsers([{
    description: extension,
    value: tokenTypes,
    collector: new ExtensionMessageCollector(consoleExtensionMessageHandler, extension, tokenTypeExtPoint.name)
  }])
}

function setTokenModifiers (tokenModifiers: ITokenModifierExtensionPoint[], extension: IExtensionDescription = Services.get().extension ?? DEFAULT_EXTENSION): void {
  tokenModifierExtPoint.acceptUsers([{
    description: extension,
    value: tokenModifiers,
    collector: new ExtensionMessageCollector(consoleExtensionMessageHandler, extension, tokenModifierExtPoint.name)
  }])
}

function setTokenStyleDefaults (tokenStyleDefaults: ITokenStyleDefaultExtensionPoint[], extension: IExtensionDescription = Services.get().extension ?? DEFAULT_EXTENSION): void {
  tokenStyleDefaultsExtPoint.acceptUsers([{
    description: extension,
    value: tokenStyleDefaults,
    collector: new ExtensionMessageCollector(consoleExtensionMessageHandler, extension, tokenModifierExtPoint.name)
  }])
}

function register () {
  StandaloneServices.get(IInstantiationService).createInstance(TokenClassificationExtensionPoints)
}

export default function getServiceOverride (): IEditorOverrideServices {
  setTimeout(register)
  return {}
}

export {
  setTokenTypes,
  setTokenModifiers,
  setTokenStyleDefaults,
  ITokenTypeExtensionPoint,
  ITokenModifierExtensionPoint,
  ITokenStyleDefaultExtensionPoint
}
