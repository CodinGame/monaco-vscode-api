import '../missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { LanguageDetectionService } from 'vs/workbench/services/languageDetection/browser/languageDetectionWorkerServiceImpl'
import { ILanguageDetectionService } from 'vs/workbench/services/languageDetection/common/languageDetectionWorkerService'
import { registerAssets } from '../assets'

registerAssets({
  'vs/../../node_modules/@vscode/vscode-languagedetection/model/model.json': new URL('@vscode/vscode-languagedetection/model/model.json', import.meta.url).href,
  'vs/../../node_modules/@vscode/vscode-languagedetection/model/group1-shard1of1.bin': new URL('@vscode/vscode-languagedetection/model/group1-shard1of1.bin', import.meta.url).href
})

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [ILanguageDetectionService.toString()]: new SyncDescriptor(LanguageDetectionService, [], false)
  }
}
