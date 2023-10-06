import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { AudioCueService, IAudioCueService } from 'vs/platform/audioCues/browser/audioCueService'
// @ts-ignore
import audioAssets from 'vs/platform/audioCues/browser/media/*.mp3'
import { registerAssets } from '../assets'
import 'vs/workbench/contrib/audioCues/browser/audioCues.contribution'

registerAssets(audioAssets)

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IAudioCueService.toString()]: new SyncDescriptor(AudioCueService, [], true)
  }
}
