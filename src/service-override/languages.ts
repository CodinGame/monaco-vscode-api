import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { ExtensionMessageCollector } from 'vs/workbench/services/extensions/common/extensionsRegistry'
import { IRawLanguageExtensionPoint, WorkbenchLanguageService } from 'vs/workbench/services/language/common/languageService'
import { consoleExtensionMessageHandler, getExtensionPoint } from './tools'
import { DEFAULT_EXTENSION } from '../vscode-services/extHost'
import { ILanguageService, Services } from '../services'

const languageExtensionPoint = getExtensionPoint<Partial<IRawLanguageExtensionPoint>[]>('languages')

function setLanguages (language: Partial<IRawLanguageExtensionPoint>[], extension: IExtensionDescription = Services.get().extension ?? DEFAULT_EXTENSION): void {
  languageExtensionPoint.acceptUsers([{
    description: extension,
    value: language,
    collector: new ExtensionMessageCollector(consoleExtensionMessageHandler, extension, languageExtensionPoint.name)
  }])
}

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [ILanguageService.toString()]: new SyncDescriptor(WorkbenchLanguageService)
  }
}

export {
  setLanguages,
  IRawLanguageExtensionPoint
}
