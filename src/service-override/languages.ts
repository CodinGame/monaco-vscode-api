import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { WorkbenchLanguageService } from 'vs/workbench/services/language/common/languageService'
import { ILanguageService } from 'vs/editor/common/languages/language'
import { LanguageStatusServiceImpl } from 'vs/workbench/services/languageStatus/common/languageStatusService'
import { ILanguageStatusService } from 'vs/workbench/services/languageStatus/common/languageStatusService.service'
import getFileServiceOverride from './files'
import 'vs/workbench/contrib/codeEditor/common/languageConfigurationExtensionPoint'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [ILanguageService.toString()]: new SyncDescriptor(WorkbenchLanguageService, [], false),
    [ILanguageStatusService.toString()]: new SyncDescriptor(LanguageStatusServiceImpl, [], true)
  }
}
