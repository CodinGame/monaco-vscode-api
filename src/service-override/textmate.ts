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
import 'vs/workbench/services/themes/common/tokenClassificationExtensionPoint'
import 'vs/workbench/contrib/codeEditor/browser/inspectEditorTokens/inspectEditorTokens'

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
