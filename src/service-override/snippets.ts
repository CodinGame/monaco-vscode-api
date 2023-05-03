import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ISnippetsService } from 'vs/workbench/contrib/snippets/browser/snippets'
import { SnippetsService } from 'vs/workbench/contrib/snippets/browser/snippetsService'
import getFileServiceOverride from './files'
import { registerServiceInitializeParticipant } from '../services'

interface ISnippetsExtensionPoint {
  language: string
  path: string
}

registerServiceInitializeParticipant(async (accessor) => {
  // Force load the service
  accessor.get(ISnippetsService)
})

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [ISnippetsService.toString()]: new SyncDescriptor(SnippetsService)
  }
}

export {
  ISnippetsExtensionPoint
}
