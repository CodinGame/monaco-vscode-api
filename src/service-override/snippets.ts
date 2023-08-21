import '../missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ISnippetsService } from 'vs/workbench/contrib/snippets/browser/snippets'
import { SnippetsService } from 'vs/workbench/contrib/snippets/browser/snippetsService'
import { ILifecycleService, LifecyclePhase } from 'vs/workbench/services/lifecycle/common/lifecycle'
import getFileServiceOverride from './files'
import { registerServiceInitializeParticipant } from '../lifecycle'
import 'vs/workbench/contrib/snippets/browser/snippets.contribution'

interface ISnippetsExtensionPoint {
  language: string
  path: string
}

registerServiceInitializeParticipant(async (accessor) => {
  void accessor.get(ILifecycleService).when(LifecyclePhase.Ready).then(() => {
    // Force load the service
    StandaloneServices.get(ISnippetsService)
  })
})

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [ISnippetsService.toString()]: new SyncDescriptor(SnippetsService, [], true)
  }
}

export {
  ISnippetsExtensionPoint
}
