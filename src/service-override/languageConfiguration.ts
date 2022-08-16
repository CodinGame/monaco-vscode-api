import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { LanguageConfigurationFileHandler } from 'vs/workbench/contrib/codeEditor/browser/languageConfigurationExtensionPoint'
import { joinPath } from 'vs/base/common/resources'
import getFileServiceOverride, { registerExtensionFile } from './files'
import { onServicesInitialized } from './tools'
import { IInstantiationService, Services } from '../services'
import { DEFAULT_EXTENSION } from '../vscode-services/extHost'

function setLanguageConfiguration (path: string, getConfiguration: () => Promise<string>): void {
  const extension = Services.get().extension ?? DEFAULT_EXTENSION
  registerExtensionFile(joinPath(extension.extensionLocation, path), getConfiguration)
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
