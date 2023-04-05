import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IRawLanguageExtensionPoint } from 'vs/workbench/services/language/common/languageService'
import { AudioCueService, IAudioCueService } from 'vs/platform/audioCues/browser/audioCueService'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { AudioCueLineFeatureContribution } from 'vs/workbench/contrib/audioCues/browser/audioCueLineFeatureContribution'
import { AudioCueLineDebuggerContribution } from 'vs/workbench/contrib/audioCues/browser/audioCueDebuggerContribution'
import { onServicesInitialized } from './tools'
// @ts-ignore
import * as audioAssets from '../../vscode/vs/platform/audioCues/browser/media/*.mp3'
import { registerAssets } from '../assets'
import 'vs/workbench/contrib/audioCues/browser/audioCues.contribution'
registerAssets(audioAssets)

function initialize (instantiationService: IInstantiationService) {
  setTimeout(() => {
    instantiationService.createInstance(AudioCueLineFeatureContribution)
    instantiationService.createInstance(AudioCueLineDebuggerContribution)
  })
}

export default function getServiceOverride (): IEditorOverrideServices {
  onServicesInitialized(initialize)

  return {
    [IAudioCueService.toString()]: new SyncDescriptor(AudioCueService)
  }
}

export {
  IRawLanguageExtensionPoint
}
