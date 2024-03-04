import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ITextMateTokenizationService } from 'vs/workbench/services/textMate/browser/textMateTokenizationFeature'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { TextMateTokenizationFeature } from 'vs/workbench/services/textMate/browser/textMateTokenizationFeatureImpl'
import { TokenClassificationExtensionPoints } from 'vs/workbench/services/themes/common/tokenClassificationExtensionPoint'
import { IWorkbenchContribution, WorkbenchPhase, registerWorkbenchContribution2 } from 'vs/workbench/common/contributions'
import { ILifecycleService, LifecyclePhase } from 'vs/workbench/services/lifecycle/common/lifecycle'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import getFileServiceOverride from './files'
import { registerServiceInitializeParticipant } from '../lifecycle'
import { registerAssets } from '../assets'

const _onigWasm = new URL('vscode-oniguruma/release/onig.wasm', import.meta.url).href
registerAssets({
  'vscode-oniguruma/../onig.wasm': _onigWasm, // Path used inside service
  'vs/../../node_modules/vscode-oniguruma/release/onig.wasm': _onigWasm // Path used inside worker
})

registerServiceInitializeParticipant(async (accessor) => {
  void accessor.get(ILifecycleService).when(LifecyclePhase.Ready).then(() => {
    // Force load the service
    StandaloneServices.get(ITextMateTokenizationService)
  })
})

class ExtensionPoints implements IWorkbenchContribution {
  static readonly ID = 'workbench.contrib.extensionPoints.textmate'

  constructor (
    @IInstantiationService private readonly instantiationService: IInstantiationService
  ) {
    this.instantiationService.createInstance(TokenClassificationExtensionPoints)
  }
}
registerWorkbenchContribution2(ExtensionPoints.ID, ExtensionPoints, WorkbenchPhase.BlockStartup)

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [ITextMateTokenizationService.toString()]: new SyncDescriptor(TextMateTokenizationFeature, [], false)
  }
}

export {
  ITextMateTokenizationService
}
