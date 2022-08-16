import '../polyfill'
import '../vscode-services/missing-services'
import { WorkbenchThemeService } from 'vs/workbench/services/themes/browser/workbenchThemeService'
import { IThemeExtensionPoint } from 'vs/workbench/services/themes/common/workbenchThemeService'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IThemeService } from 'vs/platform/theme/common/themeService'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ExtensionMessageCollector, ExtensionPoint, ExtensionsRegistry } from 'vs/workbench/services/extensions/common/extensionsRegistry'
import { ExtensionIdentifier, IExtensionDescription, TargetPlatform } from 'vs/platform/extensions/common/extensions'
import { joinPath } from 'vs/base/common/resources'
import { URI } from 'vs/base/common/uri'
import type { StandaloneThemeService } from 'vs/editor/standalone/browser/standaloneThemeService'
import { ConfigurationTarget } from 'vs/platform/configuration/common/configuration'
import { IDisposable } from 'vs/workbench/workbench.web.main'
import { consoleExtensionMessageHandler } from './tools'
import getFileServiceOverride, { registerExtensionFile } from './files'
import { Services } from '../services'
import { DEFAULT_EXTENSION } from '../vscode-services/extHost'

class StandaloneWorkbenchThemeService extends WorkbenchThemeService implements Pick<StandaloneThemeService, 'setTheme' | 'registerEditorContainer'> {
  registerEditorContainer (): IDisposable {
    // do nothing, it's called by `StandaloneEditor` but we don't care about it
    return {
      dispose () {}
    }
  }

  // Let's implement setTheme as it's used by `monaco.editor.setTheme`
  setTheme (themeName: string): void {
    void this.getColorThemes().then(themes => {
      // Run in a timeout so the service is already initialized
      setTimeout(() => {
        void this.setColorTheme(themes.find(theme => theme.settingsId === themeName) ?? themeName, ConfigurationTarget.MEMORY)
      })
    })
  }
}

const DEFAULT_THEME_EXTENSION: IExtensionDescription = {
  identifier: new ExtensionIdentifier('theme-defaults'),
  isBuiltin: true,
  isUserBuiltin: true,
  isUnderDevelopment: false,
  extensionLocation: URI.from({ scheme: 'extension', path: '/' }),
  name: 'theme-defaults',
  publisher: 'vscode',
  version: '1.0.0',
  engines: {
    vscode: VSCODE_VERSION
  },
  targetPlatform: TargetPlatform.WEB
}

type PartialIThemeExtensionPoint = Partial<IThemeExtensionPoint> & Pick<IThemeExtensionPoint, 'id' | 'path'>
const extensionPoint: ExtensionPoint<PartialIThemeExtensionPoint[]> = ExtensionsRegistry.getExtensionPoints().find(ep => ep.name === 'themes')!

let defaultThemes: PartialIThemeExtensionPoint[] = []
let themes: PartialIThemeExtensionPoint[] = []
function updateThemes () {
  extensionPoint.acceptUsers([{
    description: DEFAULT_THEME_EXTENSION,
    value: defaultThemes,
    collector: new ExtensionMessageCollector(consoleExtensionMessageHandler, DEFAULT_THEME_EXTENSION, extensionPoint.name)
  }, {
    description: Services.get().extension ?? DEFAULT_EXTENSION,
    value: themes,
    collector: new ExtensionMessageCollector(consoleExtensionMessageHandler, Services.get().extension ?? DEFAULT_EXTENSION, extensionPoint.name)
  }])
}

export function setThemes<T extends PartialIThemeExtensionPoint> (_themes: T[], getContent: (theme: T) => Promise<string>): void {
  const extension = Services.get().extension ?? DEFAULT_EXTENSION
  themes = _themes
  for (const theme of _themes) {
    registerExtensionFile(joinPath(extension.extensionLocation, theme.path), () => getContent(theme))
  }
  updateThemes()
}

export function setDefaultThemes<T extends PartialIThemeExtensionPoint> (_themes: T[], getContent: (theme: T) => Promise<string>): void {
  defaultThemes = _themes
  for (const theme of _themes) {
    registerExtensionFile(joinPath(DEFAULT_THEME_EXTENSION.extensionLocation, theme.path), () => getContent(theme))
  }
  updateThemes()
}

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [IThemeService.toString()]: new SyncDescriptor(StandaloneWorkbenchThemeService)
  }
}

export {
  PartialIThemeExtensionPoint as IThemeExtensionPoint
}
