import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IDebugService } from 'vs/workbench/contrib/debug/common/debug'
import { DebugService } from 'vs/workbench/contrib/debug/browser/debugService'
import { LanguageFeaturesService } from 'vscode/src/vs/editor/common/services/languageFeaturesService'
import { ILanguageFeaturesService } from 'vs/editor/common/services/languageFeatures'
import { ConfigurationResolverService } from 'vs/workbench/services/configurationResolver/browser/configurationResolverService'
import { IConfigurationResolverService } from 'vs/workbench/services/configurationResolver/common/configurationResolver'
import { IAction } from 'vs/base/common/actions'
import { IExtensionHostDebugService } from 'vs/platform/debug/common/extensionHostDebug'
import { BrowserExtensionHostDebugService } from 'vs/workbench/contrib/debug/browser/extensionHostDebugService'
import getLayoutServiceOverride from './layout'
import 'vs/workbench/contrib/debug/browser/debug.contribution'

// remove "Open 'launch.json'" button
// eslint-disable-next-line dot-notation
const original = DebugService.prototype['showError']
// eslint-disable-next-line dot-notation
DebugService.prototype['showError'] = function (message: string, errorActions?: ReadonlyArray<IAction>) {
  return original.call(this, message, errorActions, false)
}

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getLayoutServiceOverride(),
    [ILanguageFeaturesService.toString()]: new SyncDescriptor(LanguageFeaturesService, [], true), // To restore inlineValuesProvider
    [IDebugService.toString()]: new SyncDescriptor(DebugService, [], true),
    [IConfigurationResolverService.toString()]: new SyncDescriptor(ConfigurationResolverService, [], true),
    [IExtensionHostDebugService.toString()]: new SyncDescriptor(BrowserExtensionHostDebugService, [], true)
  }
}
