import { ExtensionIdentifier, IExtensionDescription, TargetPlatform } from 'vs/platform/extensions/common/extensions'
import { URI } from 'vs/base/common/uri'

let DEFAULT_EXTENSION: IExtensionDescription = {
  identifier: new ExtensionIdentifier('monaco'),
  isBuiltin: true,
  isUserBuiltin: true,
  isUnderDevelopment: false,
  extensionLocation: URI.from({ scheme: 'extension', path: '/' }),
  name: 'monaco',
  publisher: 'microsoft',
  version: '1.0.0',
  engines: {
    vscode: VSCODE_VERSION
  },
  targetPlatform: TargetPlatform.WEB
}

export function setDefaultExtension (extension: IExtensionDescription): void {
  DEFAULT_EXTENSION = extension
}

export function getDefaultExtension (): IExtensionDescription {
  return DEFAULT_EXTENSION
}
