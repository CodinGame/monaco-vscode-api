import { WorkbenchThemeService } from 'vs/workbench/services/themes/browser/workbenchThemeService'
import { IStandaloneTheme, IStandaloneThemeService } from 'vs/editor/standalone/common/standaloneTheme'
import { ConfigurationTarget, IConfigurationService } from 'vs/platform/configuration/common/configuration'
import { StandaloneThemeService } from 'vs/editor/standalone/browser/standaloneThemeService'
import { IThemeExtensionPoint, IWorkbenchColorTheme, IWorkbenchThemeService } from 'vs/workbench/services/themes/common/workbenchThemeService'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IThemeService } from 'vs/platform/theme/common/themeService'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ExtensionMessageCollector, ExtensionPoint, ExtensionsRegistry } from 'vs/workbench/services/extensions/common/extensionsRegistry'
import { ExtensionIdentifier, IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { joinPath } from 'vs/base/common/resources'
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions'
import { IStorageService } from 'vs/platform/storage/common/storage'
import { IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService'
import { IExtensionResourceLoaderService } from 'vs/workbench/services/extensionResourceLoader/common/extensionResourceLoader'
import { IWorkbenchLayoutService } from 'vs/workbench/services/layout/browser/layoutService'
import { ILogService } from 'vs/platform/log/common/log'
import { IHostColorSchemeService } from 'vs/workbench/services/themes/common/hostColorSchemeService'
import { IUserDataInitializationService } from 'vs/workbench/services/userData/browser/userDataInit'
import { TokenTheme } from 'vs/editor/common/languages/supports/tokenization'
import { URI } from 'vs/base/common/uri'
import { consoleExtensionMessageHandler } from './tools'
import getFileServiceOverride, { registerExtensionFile } from './files'
import { IFileService, ILanguageService, ITelemetryService, Services } from '../services'
import { DEFAULT_EXTENSION } from '../vscode-services/extHost'
/**
 * Remaining issues:
 * - setTheme called too soon is ignored
 * - @return in java comment is in purple, why?
 * - When switching to the same language in the escape game, the editor is empty
 */

class DelegateStandaloneThemeService extends StandaloneThemeService {
  private workbenchThemeService?: IWorkbenchThemeService
  constructor (
    @IExtensionService extensionService: IExtensionService,
    @IStorageService storageService: IStorageService,
    @IConfigurationService configurationService: IConfigurationService,
    @ITelemetryService telemetryService: ITelemetryService,
    @IBrowserWorkbenchEnvironmentService readonly environmentService: IBrowserWorkbenchEnvironmentService,
    @IFileService fileService: IFileService,
    @IExtensionResourceLoaderService extensionResourceLoaderService: IExtensionResourceLoaderService,
    @IWorkbenchLayoutService readonly layoutService: IWorkbenchLayoutService,
    @ILogService logService: ILogService,
    @IHostColorSchemeService hostColorService: IHostColorSchemeService,
    @IUserDataInitializationService readonly userDataInitializationService: IUserDataInitializationService,
    @ILanguageService readonly languageService: ILanguageService
  ) {
    super()

    this.workbenchThemeService = new WorkbenchThemeService(extensionService, storageService, configurationService, telemetryService, environmentService, fileService, extensionResourceLoaderService, layoutService, logService, hostColorService, userDataInitializationService, languageService)
  }

  override getColorTheme (): IStandaloneTheme {
    const delegateTheme = this.workbenchThemeService!.getColorTheme()

    return Object.assign(delegateTheme, {
      themeName: delegateTheme.id,
      tokenTheme: <TokenTheme><unknown>undefined
    } as Omit<IStandaloneTheme, keyof IWorkbenchColorTheme>)
  }

  override onDidColorThemeChange: StandaloneThemeService['onDidColorThemeChange'] = (cb) => {
    return this.workbenchThemeService!.onDidColorThemeChange(() => {
      cb(this.getColorTheme())
    })
  }

  override setTheme (themeName: string): void {
    void this.workbenchThemeService?.getColorThemes().then(themes => {
      void this.workbenchThemeService?.setColorTheme(themes.find(theme => theme.settingsId === themeName) ?? themeName, ConfigurationTarget.MEMORY)
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
  }
}

const extensionPoint: ExtensionPoint<IThemeExtensionPoint[]> = ExtensionsRegistry.getExtensionPoints().find(ep => ep.name === 'themes')!

let defaultThemes: IThemeExtensionPoint[] = []
let themes: IThemeExtensionPoint[] = []
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

export function setThemes<T extends IThemeExtensionPoint> (_themes: T[], getContent: (theme: T) => Promise<string>, extension: IExtensionDescription = Services.get().extension ?? DEFAULT_EXTENSION): void {
  themes = _themes
  for (const theme of _themes) {
    registerExtensionFile(joinPath(extension.extensionLocation, theme.path), () => getContent(theme))
  }
  updateThemes()
}

export function setDefaultThemes<T extends IThemeExtensionPoint> (_themes: T[], getContent: (theme: T) => Promise<string>): void {
  defaultThemes = _themes
  for (const theme of _themes) {
    registerExtensionFile(joinPath(DEFAULT_EXTENSION.extensionLocation, theme.path), () => getContent(theme))
  }
  updateThemes()
}

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [IThemeService.toString()]: new SyncDescriptor(WorkbenchThemeService),
    [IStandaloneThemeService.toString()]: new SyncDescriptor(DelegateStandaloneThemeService)
  }
}

export {
  IThemeExtensionPoint
}
