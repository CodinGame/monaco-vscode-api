import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ITextMateTokenizationService } from 'vs/workbench/services/textMate/browser/textMateTokenizationFeature'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { TextMateTokenizationFeature } from 'vs/workbench/services/textMate/browser/textMateTokenizationFeatureImpl'
import _onigWasm from 'vscode-oniguruma/release/onig.wasm'
import getFileServiceOverride from './files'
import { onServicesInitialized } from './tools'
import { registerAssets } from '../assets'
registerAssets({
  'vscode-oniguruma/../onig.wasm': _onigWasm
})

function initialize (instantiationService: IInstantiationService) {
  // Force load the service
  instantiationService.invokeFunction((accessor) => accessor.get(ITextMateTokenizationService))
}

export default function getServiceOverride (): IEditorOverrideServices {
  onServicesInitialized(initialize)
  return {
    ...getFileServiceOverride(),
    [ITextMateTokenizationService.toString()]: new SyncDescriptor(TextMateTokenizationFeature)
  }
}

export {
  ITextMateTokenizationService
}
