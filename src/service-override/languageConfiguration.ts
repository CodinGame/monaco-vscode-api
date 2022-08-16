import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { LanguageConfigurationFileHandler } from 'vs/workbench/contrib/codeEditor/browser/languageConfigurationExtensionPoint'
import { URI } from 'vs/base/common/uri'
import getFileServiceOverride, { registerExtensionFile } from './files'
import { onServicesInitialized } from './tools'
import { IInstantiationService, Services } from '../services'
import { DEFAULT_EXTENSION } from '../vscode-services/extHost'

function setLanguageConfiguration (resource: URI, getConfiguration: () => Promise<string>): void {
  const extension = Services.get().extension ?? DEFAULT_EXTENSION
  if (resource.scheme !== extension.extensionLocation.scheme) {
    throw new Error(`The provided resource url should have the ${extension.extensionLocation.scheme} scheme`)
  }

function initialize (instantiationService: IInstantiationService) {
  instantiationService.createInstance(LanguageConfigurationFileHandler)
}

export default function getServiceOverride (): IEditorOverrideServices {
  onServicesInitialized(initialize)
  return {
    ...getFileServiceOverride()
  }
}

export {
  setLanguageConfiguration
}
