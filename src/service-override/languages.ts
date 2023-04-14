import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IRawLanguageExtensionPoint, WorkbenchLanguageService } from 'vs/workbench/services/language/common/languageService'
import { LanguageConfigurationFileHandler } from 'vs/workbench/contrib/codeEditor/browser/languageConfigurationExtensionPoint'
import { IWorkbenchContribution, IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'vs/workbench/common/contributions'
import { Registry } from 'vs/platform/registry/common/platform'
import { LifecyclePhase } from 'vs/workbench/services/lifecycle/common/lifecycle'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { ILanguageService } from 'vs/editor/common/languages/language'
import getFileServiceOverride from './files'

export class ExtensionPoints implements IWorkbenchContribution {
  constructor (
    @IInstantiationService private readonly instantiationService: IInstantiationService
  ) {
    this.instantiationService.createInstance(LanguageConfigurationFileHandler)
  }
}

Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).registerWorkbenchContribution(ExtensionPoints, LifecyclePhase.Starting)

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [ILanguageService.toString()]: new SyncDescriptor(WorkbenchLanguageService)
  }
}

export {
  IRawLanguageExtensionPoint
}
