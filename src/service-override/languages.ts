import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { WorkbenchLanguageService } from 'vs/workbench/services/language/common/languageService'
import { LanguageConfigurationFileHandler } from 'vs/workbench/contrib/codeEditor/browser/languageConfigurationExtensionPoint'
import { IWorkbenchContribution, WorkbenchPhase, registerWorkbenchContribution2 } from 'vs/workbench/common/contributions'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { ILanguageService } from 'vs/editor/common/languages/language'
import { ILanguageStatusService, LanguageStatusServiceImpl } from 'vs/workbench/services/languageStatus/common/languageStatusService'
import getFileServiceOverride from './files'

export class ExtensionPoints implements IWorkbenchContribution {
  static readonly ID = 'workbench.contrib.extensionPoints.languageConfiguration'

  constructor (
    @IInstantiationService private readonly instantiationService: IInstantiationService
  ) {
    this.instantiationService.createInstance(LanguageConfigurationFileHandler)
  }
}

registerWorkbenchContribution2(ExtensionPoints.ID, ExtensionPoints, WorkbenchPhase.BlockStartup)

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [ILanguageService.toString()]: new SyncDescriptor(WorkbenchLanguageService, [], false),
    [ILanguageStatusService.toString()]: new SyncDescriptor(LanguageStatusServiceImpl, [], true)
  }
}
