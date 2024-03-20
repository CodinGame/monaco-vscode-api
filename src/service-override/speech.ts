import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ISpeechService } from 'vs/workbench/contrib/speech/common/speechService'
import { SpeechService } from 'vs/workbench/contrib/speech/browser/speechService'
import 'vs/workbench/contrib/speech/browser/speech.contribution'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [ISpeechService.toString()]: new SyncDescriptor(SpeechService, [], true)
  }
}
