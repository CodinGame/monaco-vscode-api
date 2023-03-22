import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { LanguageConfigurationFileHandler } from 'vs/workbench/contrib/codeEditor/browser/languageConfigurationExtensionPoint'
import getFileServiceOverride from './files'
import { onServicesInitialized } from './tools'
import { IInstantiationService } from '../services'

function initialize (instantiationService: IInstantiationService) {
  instantiationService.createInstance(LanguageConfigurationFileHandler)
}

export default function getServiceOverride (): IEditorOverrideServices {
  onServicesInitialized(initialize)
  return {
    ...getFileServiceOverride()
  }
}
