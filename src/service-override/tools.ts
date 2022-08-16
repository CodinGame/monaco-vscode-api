import { IMessage } from 'vs/workbench/services/extensions/common/extensions'
import { ExtensionPoint, ExtensionsRegistry } from 'vs/workbench/services/extensions/common/extensionsRegistry'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { EventEmitter } from 'vscode'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { Severity } from '../services'

export function consoleExtensionMessageHandler (msg: IMessage): void {
  if (msg.type === Severity.Error) {
    console.error(msg)
  } else if (msg.type === Severity.Warning) {
    console.warn(msg)
  } else {
    // eslint-disable-next-line no-console
    console.log(msg)
  }
}

export function getExtensionPoint<T> (extensionPoint: string): ExtensionPoint<T> {
  return ExtensionsRegistry.getExtensionPoints().find(ep => ep.name === extensionPoint) as ExtensionPoint<T>
}

const emitter = new EventEmitter<IInstantiationService>()
export const onServicesInitialized = emitter.event

// Hook StandaloneServices.initialize to instantiate required classes right after
let initialized = false
const original = StandaloneServices.initialize
StandaloneServices.initialize = (overrides) => {
  const instantiationService = original.call(StandaloneServices, overrides)
  if (!initialized) {
    initialized = true
    emitter.fire(instantiationService)
  }
  return instantiationService
}
