import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { LanguageConfigurationFileHandler } from 'vs/workbench/contrib/codeEditor/browser/languageConfigurationExtensionPoint'
import { URI } from 'vs/base/common/uri'
import getFileServiceOverride, { registerExtensionFile } from './files'
import { IInstantiationService, Services } from '../services'
import { DEFAULT_EXTENSION } from '../vscode-services/extHost'

function setLanguageConfiguration (resource: URI, getConfiguration: () => Promise<string>): void {
  const extension = Services.get().extension ?? DEFAULT_EXTENSION
  if (resource.scheme !== extension.extensionLocation.scheme) {
    throw new Error(`The provided resource url should have the ${extension.extensionLocation.scheme} scheme`)
  }

  registerExtensionFile(resource, getConfiguration)
}

function initialize () {
  const instantiationService = StandaloneServices.get(IInstantiationService)
  instantiationService.createInstance(LanguageConfigurationFileHandler)
}

export default function getServiceOverride (): IEditorOverrideServices {
  setTimeout(initialize)
  return {
    ...getFileServiceOverride()
  }
}

export {
  setLanguageConfiguration
}
