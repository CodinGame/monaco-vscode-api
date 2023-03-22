import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IRawLanguageExtensionPoint } from 'vs/workbench/services/language/common/languageService'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { IDebugService } from 'vs/workbench/contrib/debug/common/debug'
import { DebugService } from 'vs/workbench/contrib/debug/browser/debugService'
import { LanguageFeaturesService } from 'vscode/vs/editor/common/services/languageFeaturesService'
import { ILanguageFeaturesService } from 'vs/editor/common/services/languageFeatures'
import { ConfigurationResolverService } from 'vs/workbench/services/configurationResolver/browser/configurationResolverService'
import { IConfigurationResolverService } from 'vs/workbench/services/configurationResolver/common/configurationResolver'
import { DebugToolBar } from 'vs/workbench/contrib/debug/browser/debugToolBar'
import { DebugContentProvider } from 'vs/workbench/contrib/debug/common/debugContentProvider'
import getLayoutServiceOverride from './layout'
import { onServicesInitialized } from './tools'
import 'vs/workbench/contrib/debug/browser/debug.contribution'

function initialize (instantiationService: IInstantiationService) {
  setTimeout(() => {
    instantiationService.createInstance(DebugToolBar)
    instantiationService.createInstance(DebugContentProvider)
  })
}

export default function getServiceOverride (): IEditorOverrideServices {
  onServicesInitialized(initialize)

  return {
    ...getLayoutServiceOverride(),
    [ILanguageFeaturesService.toString()]: new SyncDescriptor(LanguageFeaturesService), // To restore inlineValuesProvider
    [IDebugService.toString()]: new SyncDescriptor(DebugService),
    [IConfigurationResolverService.toString()]: new SyncDescriptor(ConfigurationResolverService)
  }
}

export {
  IRawLanguageExtensionPoint
}
