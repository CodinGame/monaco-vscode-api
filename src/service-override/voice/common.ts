import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { VoiceModeOnboardingService } from 'vs/workbench/contrib/agentsVoice/browser/voiceModeOnboarding'
import { IVoiceModeOnboardingService } from 'vs/workbench/contrib/agentsVoice/browser/voiceModeOnboarding.service'
import { VoiceTranscriptStore } from 'vs/workbench/contrib/agentsVoice/common/voiceTranscriptStore'
import { IVoiceTranscriptStore } from 'vs/workbench/contrib/agentsVoice/common/voiceTranscriptStore.service'
import { ChatSpeechToTextService } from 'vs/workbench/contrib/chat/browser/speechToText/chatSpeechToTextService'
import { IChatSpeechToTextService } from 'vs/workbench/contrib/chat/browser/speechToText/chatSpeechToTextService.service'
import { VoiceCodeTranscriptionClient } from 'vs/workbench/contrib/chat/browser/speechToText/voiceCodeTranscriptionClient'
import { IVoiceCodeTranscriptionClient } from 'vs/workbench/contrib/chat/browser/speechToText/voiceCodeTranscriptionClient.service'
import { MicCaptureService } from 'vs/workbench/contrib/chat/browser/voiceClient/micCaptureService'
import { IMicCaptureService } from 'vs/workbench/contrib/chat/browser/voiceClient/micCaptureService.service'
import { TtsPlaybackService } from 'vs/workbench/contrib/chat/browser/voiceClient/ttsPlaybackService'
import { ITtsPlaybackService } from 'vs/workbench/contrib/chat/browser/voiceClient/ttsPlaybackService.service'
import { VoiceClientService } from 'vs/workbench/contrib/chat/browser/voiceClient/voiceClientService'
import { VoiceSessionController } from 'vs/workbench/contrib/chat/browser/voiceClient/voiceSessionController'
import { IVoiceSessionController } from 'vs/workbench/contrib/chat/browser/voiceClient/voiceSessionController.service'
import { VoiceToolDispatchService } from 'vs/workbench/contrib/chat/browser/voiceClient/voiceToolDispatchService'
import { IVoiceToolDispatchService } from 'vs/workbench/contrib/chat/browser/voiceClient/voiceToolDispatchService.service'
import { VoiceInputModeService } from 'vs/workbench/contrib/chat/browser/voiceInputMode/voiceInputMode'
import { IVoiceInputModeService } from 'vs/workbench/contrib/chat/browser/voiceInputMode/voiceInputMode.service'
import { IVoiceClientService } from 'vs/workbench/contrib/chat/common/voiceClient/voiceClientService.service'
import { VoicePlaybackService } from 'vs/workbench/contrib/chat/common/voicePlaybackService'
import { IVoicePlaybackService } from 'vs/workbench/contrib/chat/common/voicePlaybackService.service'
import 'vs/workbench/contrib/agentsVoice/browser/agentsVoice.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IMicCaptureService.toString()]: new SyncDescriptor(MicCaptureService, [], true),
    [ITtsPlaybackService.toString()]: new SyncDescriptor(TtsPlaybackService, [], true),
    [IVoiceClientService.toString()]: new SyncDescriptor(VoiceClientService, [], true),
    [IVoiceSessionController.toString()]: new SyncDescriptor(VoiceSessionController, [], true),
    [IVoiceToolDispatchService.toString()]: new SyncDescriptor(VoiceToolDispatchService, [], true),
    [IVoicePlaybackService.toString()]: new SyncDescriptor(VoicePlaybackService, [], true),
    [IVoiceTranscriptStore.toString()]: new SyncDescriptor(VoiceTranscriptStore, [], true),
    [IVoiceCodeTranscriptionClient.toString()]: new SyncDescriptor(
      VoiceCodeTranscriptionClient,
      [],
      true
    ),
    [IVoiceInputModeService.toString()]: new SyncDescriptor(VoiceInputModeService, [], true),
    [IVoiceModeOnboardingService.toString()]: new SyncDescriptor(
      VoiceModeOnboardingService,
      [],
      true
    ),
    [IChatSpeechToTextService.toString()]: new SyncDescriptor(ChatSpeechToTextService, [], true)
  }
}
