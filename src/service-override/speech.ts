import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ISpeechService } from 'vs/workbench/contrib/speech/common/speechService.service'
import { SpeechService } from 'vs/workbench/contrib/speech/browser/speechService'
import { ILocalTranscriptionService } from 'vs/platform/localTranscription/common/localTranscription.service'
import { NullLocalTranscriptionService } from 'vs/workbench/services/localTranscription/browser/localTranscriptionService'
import 'vs/workbench/contrib/speech/browser/speech.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [ISpeechService.toString()]: new SyncDescriptor(SpeechService, [], true),
    [ILocalTranscriptionService.toString()]: new SyncDescriptor(
      NullLocalTranscriptionService,
      [],
      true
    )
  }
}
