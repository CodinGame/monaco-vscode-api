import { IMessage } from 'vs/workbench/services/extensions/common/extensions'
import { ExtensionPoint, ExtensionsRegistry } from 'vs/workbench/services/extensions/common/extensionsRegistry'
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
