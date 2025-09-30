import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ITextMateTokenizationService } from 'vs/workbench/services/textMate/browser/textMateTokenizationFeature.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { TextMateTokenizationFeature } from 'vs/workbench/services/textMate/browser/textMateTokenizationFeatureImpl'
import getFileServiceOverride from './files'
import 'vs/workbench/services/themes/common/tokenClassificationExtensionPoint'
import 'vs/workbench/contrib/codeEditor/browser/inspectEditorTokens/inspectEditorTokens'
import 'vs/workbench/services/textMate/browser/textMateTokenizationFeature.contribution'

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
