import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ITextMateTokenizationService } from 'vs/workbench/services/textMate/browser/textMateTokenizationFeature'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { TextMateTokenizationFeature } from 'vs/workbench/services/textMate/browser/textMateTokenizationFeatureImpl'
import { TokenClassificationExtensionPoints } from 'vs/workbench/services/themes/common/tokenClassificationExtensionPoint'
import { IWorkbenchContribution, IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'vs/workbench/common/contributions'
import { Registry } from 'vs/platform/registry/common/platform'
import { LifecyclePhase } from 'vs/workbench/services/lifecycle/common/lifecycle'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import _onigWasm from 'vscode-oniguruma/release/onig.wasm'
import getFileServiceOverride from './files'
import { registerServiceInitializeParticipant } from '../services'
import { registerAssets } from '../assets'
registerAssets({
  'vscode-oniguruma/../onig.wasm': _onigWasm
})

registerServiceInitializeParticipant(async (accessor) => {
  // Force load the service
  accessor.get(ITextMateTokenizationService)
})

class ExtensionPoints implements IWorkbenchContribution {
  constructor (
    @IInstantiationService private readonly instantiationService: IInstantiationService
  ) {
    this.instantiationService.createInstance(TokenClassificationExtensionPoints)
  }
}
Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).registerWorkbenchContribution(ExtensionPoints, LifecyclePhase.Starting)

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [ITextMateTokenizationService.toString()]: new SyncDescriptor(TextMateTokenizationFeature)
  }
}

export {
  ITextMateTokenizationService
}
