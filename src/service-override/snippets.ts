import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ISnippetsService } from 'vs/workbench/contrib/snippets/browser/snippets'
import { SnippetsService } from 'vs/workbench/contrib/snippets/browser/snippetsService'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { onServicesInitialized } from './tools'
import getFileServiceOverride from './files'
import getWorkspaceContextServiceOverride from './workspaceContext'

interface ISnippetsExtensionPoint {
  language: string
  path: string
}

function initialize (instantiationService: IInstantiationService) {
  // Force load the service
  instantiationService.invokeFunction((accessor) => accessor.get(ISnippetsService))
}

export default function getServiceOverride (): IEditorOverrideServices {
  onServicesInitialized(initialize)
  return {
    ...getFileServiceOverride(),
    ...getWorkspaceContextServiceOverride(),
    [ISnippetsService.toString()]: new SyncDescriptor(SnippetsService)
  }
}

export {
  ISnippetsExtensionPoint
}
