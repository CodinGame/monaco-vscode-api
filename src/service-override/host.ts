import { mainWindow } from 'vs/base/browser/window'
import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration.service'
import { IDialogService } from 'vs/platform/dialogs/common/dialogs.service'
import { IFileService } from 'vs/platform/files/common/files.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { ILabelService } from 'vs/platform/label/common/label.service'
import { ILayoutService } from 'vs/platform/layout/browser/layoutService.service'
import { ILogService } from 'vs/platform/log/common/log.service'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile.service'
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace.service'
import { IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService.service'
import { BrowserHostService } from 'vs/workbench/services/host/browser/browserHostService'
import { IHostService } from 'vs/workbench/services/host/browser/host.service'
import type { BrowserLifecycleService } from 'vs/workbench/services/lifecycle/browser/lifecycleService'
import { ILifecycleService } from 'vs/workbench/services/lifecycle/common/lifecycle.service'
import { BrowserHostColorSchemeService } from 'vs/workbench/services/themes/browser/browserHostColorSchemeService'
import { IHostColorSchemeService } from 'vs/workbench/services/themes/common/hostColorSchemeService.service'
import { Emitter, Event } from 'vs/base/common/event'
import { getWindowId } from 'vs/base/browser/dom'

class CustomBrowserHostService extends BrowserHostService {
  private _onDidChangeFullScreen: Event<{ windowId: number; fullscreen: boolean }>
  constructor(
    private _toggleFullScreen: () => Promise<void> | undefined,
    _onDidChangeFullScreen: Event<boolean> | undefined,
    @ILayoutService layoutService: ILayoutService,
    @IConfigurationService configurationService: IConfigurationService,
    @IFileService fileService: IFileService,
    @ILabelService labelService: ILabelService,
    @IBrowserWorkbenchEnvironmentService environmentService: IBrowserWorkbenchEnvironmentService,
    @IInstantiationService instantiationService: IInstantiationService,
    @ILifecycleService lifecycleService: BrowserLifecycleService,
    @ILogService logService: ILogService,
    @IDialogService dialogService: IDialogService,
    @IWorkspaceContextService contextService: IWorkspaceContextService,
    @IUserDataProfilesService userDataProfilesService: IUserDataProfilesService
  ) {
    super(
      layoutService,
      configurationService,
      fileService,
      labelService,
      environmentService,
      instantiationService,
      lifecycleService,
      logService,
      dialogService,
      contextService,
      userDataProfilesService
    )

    this._onDidChangeFullScreen = (() => {
      const mainWindowId = getWindowId(mainWindow)

      const emitter = new Emitter<{ windowId: number; fullscreen: boolean }>()
      _onDidChangeFullScreen?.((fullscreen) => {
        emitter.fire({
          windowId: mainWindowId,
          fullscreen
        })
      })

      super.onDidChangeFullScreen((event) => {
        // Forward the original fullscreen event only when there is no custom handler
        // or when the event is for a window other than the main one.
        // This prevents double-handling of fullscreen changes for the main window
        // when a custom handler is already managing it.
        if (_onDidChangeFullScreen == null || event.windowId !== mainWindowId) {
          emitter.fire(event)
        }
      })
      return emitter.event
    })()
  }

  override async toggleFullScreen(targetWindow: Window): Promise<void> {
    if (this._toggleFullScreen != null && targetWindow === mainWindow) {
      await this._toggleFullScreen()
    } else {
      await super.toggleFullScreen(targetWindow)
    }
  }

  override get onDidChangeFullScreen() {
    return this._onDidChangeFullScreen
  }
}

interface BrowserHostServiceOverrideParams {
  toggleFullScreen?: () => Promise<void>
  onDidChangeFullScreen?: Event<boolean>
}

export default function getServiceOverride({
  toggleFullScreen,
  onDidChangeFullScreen
}: BrowserHostServiceOverrideParams = {}): IEditorOverrideServices {
  return {
    [IHostService.toString()]: new SyncDescriptor(
      CustomBrowserHostService,
      [toggleFullScreen, onDidChangeFullScreen],
      true
    ),
    [IHostColorSchemeService.toString()]: new SyncDescriptor(
      BrowserHostColorSchemeService,
      [],
      true
    )
  }
}
