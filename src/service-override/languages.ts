import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IRawLanguageExtensionPoint, WorkbenchLanguageService } from 'vs/workbench/services/language/common/languageService'
import { ILanguageService } from '../services'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [ILanguageService.toString()]: new SyncDescriptor(WorkbenchLanguageService)
  }
}

export {
  IRawLanguageExtensionPoint
}
