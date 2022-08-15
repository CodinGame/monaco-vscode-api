import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ISnippetsService } from 'vs/workbench/contrib/snippets/browser/snippets'
import { SnippetsService } from 'vs/workbench/contrib/snippets/browser/snippetsService'
import { IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { ExtensionMessageCollector } from 'vs/workbench/services/extensions/common/extensionsRegistry'
import { joinPath } from 'vs/base/common/resources'
import { consoleExtensionMessageHandler, getExtensionPoint } from './tools'
import { registerExtensionFile } from './files'
import getWorkspaceContextServiceOverride from './workspaceContext'
import { DEFAULT_EXTENSION } from '../vscode-services/extHost'
import { Services } from '../services'
interface ISnippetsExtensionPoint {
  language: string
  path: string
}

const snippetExtensionPoint = getExtensionPoint<ISnippetsExtensionPoint[]>('snippets')

function setSnippets (snippets: ISnippetsExtensionPoint[], getContent: (snippet: ISnippetsExtensionPoint) => Promise<string>, extension: IExtensionDescription = Services.get().extension ?? DEFAULT_EXTENSION): void {
  snippetExtensionPoint.acceptUsers([{
    description: extension,
    value: snippets,
    collector: new ExtensionMessageCollector(consoleExtensionMessageHandler, extension, snippetExtensionPoint.name)
  }])

  for (const snippet of snippets) {
    registerExtensionFile(joinPath(extension.extensionLocation, snippet.path), () => getContent(snippet))
  }
}

function initialize () {
  // Force load the service
  StandaloneServices.get(ISnippetsService)
}

export default function getServiceOverride (): IEditorOverrideServices {
  setTimeout(initialize)
  return {
    ...getWorkspaceContextServiceOverride(),
    [ISnippetsService.toString()]: new SyncDescriptor(SnippetsService)
  }
}

export {
  setSnippets,
  ISnippetsExtensionPoint
}
