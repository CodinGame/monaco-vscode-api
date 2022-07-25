import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { Severity } from 'vs/platform/notification/common/notification'
import { IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { ExtensionMessageCollector, ExtensionsRegistry } from 'vs/workbench/services/extensions/common/extensionsRegistry'

export function registerExtension (extension: IExtensionDescription): void {
  const extensionPoints = ExtensionsRegistry.getExtensionPoints()
  for (const extensionPoint of extensionPoints) {
    if (extension.contributes != null && Object.hasOwnProperty.call(extension.contributes, extensionPoint.name)) {
      extensionPoint.acceptUsers([{
        description: extension,
        value: extension.contributes[extensionPoint.name as keyof typeof extension.contributes],
        collector: new ExtensionMessageCollector(msg => {
          if (msg.type === Severity.Error) {
            console.error(msg)
          } else if (msg.type === Severity.Warning) {
            console.warn(msg)
          } else {
            // eslint-disable-next-line no-console
            console.log(msg)
          }
        }, extension, extensionPoint.name)
      }])
    }
  }
}

export default function getServiceOverride (): IEditorOverrideServices {
  return {
  }
}
