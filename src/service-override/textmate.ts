import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ITextMateTokenizationService } from 'vs/workbench/services/textMate/browser/textMateTokenizationFeature'
import { ExtensionMessageCollector } from 'vs/workbench/services/extensions/common/extensionsRegistry'
import { ITMSyntaxExtensionPoint } from 'vs/workbench/services/textMate/common/TMGrammars'
import { joinPath } from 'vs/base/common/resources'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { TextMateTokenizationFeature } from 'vs/workbench/services/textMate/browser/textMateTokenizationFeatureImpl'
import getFileServiceOverride, { registerExtensionFile } from './files'
import { consoleExtensionMessageHandler, getExtensionPoint, onServicesInitialized } from './tools'
import { Services } from '../services'
import { DEFAULT_EXTENSION } from '../vscode-services/extHost'

type PartialITMSyntaxExtensionPoint = Partial<ITMSyntaxExtensionPoint> & Pick<ITMSyntaxExtensionPoint, 'path' | 'scopeName'>
const extensionPoint = getExtensionPoint<PartialITMSyntaxExtensionPoint[]>('grammars')

export function setGrammars<T extends PartialITMSyntaxExtensionPoint> (grammars: T[], getContent: (grammar: T) => Promise<string>, extension: IExtensionDescription = Services.get().extension ?? DEFAULT_EXTENSION): void {
  extensionPoint.acceptUsers([{
    description: extension,
    value: grammars,
    collector: new ExtensionMessageCollector(consoleExtensionMessageHandler, extension, extensionPoint.name)
  }])

  for (const grammar of grammars) {
    registerExtensionFile(joinPath(extension.extensionLocation, grammar.path), () => getContent(grammar))
  }
}

function initialize (instantiationService: IInstantiationService) {
  // Force load the service
  instantiationService.invokeFunction((accessor) => accessor.get(ITextMateTokenizationService))
}

export default function getServiceOverride (): IEditorOverrideServices {
  onServicesInitialized(initialize)
  return {
    ...getFileServiceOverride(),
    [ITextMateTokenizationService.toString()]: new SyncDescriptor(TextMateTokenizationFeature)
  }
}

export {
  ITextMateTokenizationService,
  PartialITMSyntaxExtensionPoint as ITMSyntaxExtensionPoint
}
