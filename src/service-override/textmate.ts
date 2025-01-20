import {
  type IEditorOverrideServices,
  StandaloneServices
} from 'vs/editor/standalone/browser/standaloneServices'
import { ITextMateTokenizationService } from 'vs/workbench/services/textMate/browser/textMateTokenizationFeature.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { TextMateTokenizationFeature } from 'vs/workbench/services/textMate/browser/textMateTokenizationFeatureImpl'
import { LifecyclePhase } from 'vs/workbench/services/lifecycle/common/lifecycle'
import { ILifecycleService } from 'vs/workbench/services/lifecycle/common/lifecycle.service'
import getFileServiceOverride from './files'
import { registerServiceInitializeParticipant } from '../lifecycle'
import { registerAssets } from '../assets'
import 'vs/workbench/services/themes/common/tokenClassificationExtensionPoint'
import 'vs/workbench/contrib/codeEditor/browser/inspectEditorTokens/inspectEditorTokens'

const _onigWasm = new URL('vscode-oniguruma/release/onig.wasm', import.meta.url).href
registerAssets({
  'vscode-oniguruma/../onig.wasm': _onigWasm, // Path used inside service
  'vs/../../node_modules/vscode-oniguruma/release/onig.wasm': _onigWasm // Path used inside worker
})

registerServiceInitializeParticipant(async (accessor) => {
  void accessor
    .get(ILifecycleService)
    .when(LifecyclePhase.Ready)
    .then(() => {
      // Force load the service
      StandaloneServices.get(ITextMateTokenizationService)
    })
})

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [ITextMateTokenizationService.toString()]: new SyncDescriptor(
      TextMateTokenizationFeature,
      [],
      false
    )
  }
}

export { ITextMateTokenizationService }
