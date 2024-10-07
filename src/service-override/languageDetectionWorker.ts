import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { LanguageDetectionService } from 'vs/workbench/services/languageDetection/browser/languageDetectionWorkerServiceImpl'
import { ILanguageDetectionService } from 'vs/workbench/services/languageDetection/common/languageDetectionWorkerService.service'
import { registerAssets } from '../assets'
import 'vs/workbench/contrib/languageDetection/browser/languageDetection.contribution'

registerAssets({
  'vs/../../node_modules/@vscode/vscode-languagedetection/model/model.json': new URL(
    '@vscode/vscode-languagedetection/model/model.json',
    import.meta.url
  ).href,
  'vs/../../node_modules/@vscode/vscode-languagedetection/model/group1-shard1of1.bin': new URL(
    '@vscode/vscode-languagedetection/model/group1-shard1of1.bin',
    import.meta.url
  ).href
})

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [ILanguageDetectionService.toString()]: new SyncDescriptor(LanguageDetectionService, [], false)
  }
}
