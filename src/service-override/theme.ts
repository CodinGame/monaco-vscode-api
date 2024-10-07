import { WorkbenchThemeService } from 'vs/workbench/services/themes/browser/workbenchThemeService'
import { IThemeExtensionPoint } from 'vs/workbench/services/themes/common/workbenchThemeService'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IThemeService } from 'vs/platform/theme/common/themeService.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import type { StandaloneThemeService } from 'vs/editor/standalone/browser/standaloneThemeService'
import { ConfigurationTarget } from 'vs/platform/configuration/common/configuration'
import { IDisposable } from 'vs/base/common/lifecycle'
import getFileServiceOverride from './files'
import 'vs/workbench/contrib/themes/browser/themes.contribution'

class StandaloneWorkbenchThemeService
  extends WorkbenchThemeService
  implements Pick<StandaloneThemeService, 'setTheme' | 'registerEditorContainer'>
{
  registerEditorContainer(): IDisposable {
    // do nothing, it's called by `StandaloneEditor` but we don't care about it
    return {
      dispose() {}
    }
  }

  // Let's implement setTheme as it's used by `monaco.editor.setTheme`
  setTheme(themeName: string): void {
    void this.getColorThemes().then((themes) => {
      // Run in a timeout so the service is already initialized
      setTimeout(() => {
        void this.setColorTheme(
          themes.find((theme) => theme.settingsId === themeName) ?? themeName,
          ConfigurationTarget.MEMORY
        )
      })
    })
  }
}

type PartialIThemeExtensionPoint = Partial<IThemeExtensionPoint> &
  Pick<IThemeExtensionPoint, 'id' | 'path'>

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [IThemeService.toString()]: new SyncDescriptor(StandaloneWorkbenchThemeService, [], false)
  }
}

export { PartialIThemeExtensionPoint as IThemeExtensionPoint }
