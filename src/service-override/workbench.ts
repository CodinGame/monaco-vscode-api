import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IWorkbenchOptions, Workbench } from 'vs/workbench/browser/workbench'
import { ILogService } from 'vs/platform/log/common/log.service'
import { ServiceCollection } from 'vs/platform/instantiation/common/serviceCollection'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { IWorkbenchLayoutService } from 'vs/workbench/services/layout/browser/layoutService.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService.service'
import { IEditorService } from 'vs/workbench/services/editor/common/editorService.service'
import { EditorService } from 'vs/workbench/services/editor/browser/editorService'
import { EditorParts } from 'vs/workbench/browser/parts/editor/editorParts'
import { onUnexpectedError } from 'vs/base/common/errors'
import { BrowserWindow } from 'vs/workbench/browser/window'
import { detectFullscreen } from 'vs/base/browser/dom'
import { mainWindow } from 'vs/base/browser/window'
import { setFullscreen } from 'vs/base/browser/browser'
import getKeybindingsOverride from './keybindings'
import getQuickAccessOverride from './quickaccess'
import getTitleBarServiceOverride from './viewTitleBar'
import getStatusBarServiceOverride from './viewStatusBar'
import getBannerServiceOverride from './viewBanner'
import getViewCommonServiceOverride from './viewCommon'
import { getWorkbenchContainer } from '../workbench'
import { onLayout, onRenderWorkbench } from '../lifecycle'
export * from './tools/views'

class CustomWorkbench extends Workbench {
  constructor(
    options: IWorkbenchOptions | undefined,
    @ILogService logService: ILogService,
    @IInstantiationService private instantiationService: IInstantiationService
  ) {
    super(getWorkbenchContainer(), options, new ServiceCollection(), logService)

    this.mainContainer.classList.add('monaco-workbench-part')
  }

  protected override registerErrorHandler(): void {
    // prevent intercepting global error events
  }

  override createNotificationsHandlers() {
    // nothing, it's done in the notification service override
  }

  protected override initServices(): IInstantiationService {
    return this.instantiationService
  }

  override restore(): void {
    try {
      this.restoreParts()
    } catch (error) {
      onUnexpectedError(error)
    }

    // prevent managing lifecycle service phase as it's already done in lifecycle.ts
  }
}

const detectedFullScreen = detectFullscreen(mainWindow)
setFullscreen(detectedFullScreen != null && !detectedFullScreen.guess, mainWindow)
onLayout(async (accessor) => {
  ;(accessor.get(IWorkbenchLayoutService) as Workbench).startup()
})
onRenderWorkbench(async (accessor) => {
  accessor.get(IInstantiationService).createInstance(BrowserWindow)
})

function getServiceOverride(
  options?: IWorkbenchOptions,
  _webviewIframeAlternateDomains?: string
): IEditorOverrideServices {
  return {
    ...getViewCommonServiceOverride(_webviewIframeAlternateDomains),
    ...getQuickAccessOverride({
      isKeybindingConfigurationVisible: () => true,
      shouldUseGlobalPicker: () => true
    }),
    ...getKeybindingsOverride({
      shouldUseGlobalKeybindings: () => true
    }),
    [IWorkbenchLayoutService.toString()]: new SyncDescriptor(CustomWorkbench, [options], false),
    [IEditorGroupsService.toString()]: new SyncDescriptor(EditorParts, [], false),
    [IEditorService.toString()]: new SyncDescriptor(EditorService, [undefined], false),
    ...getTitleBarServiceOverride(),
    ...getStatusBarServiceOverride(),
    ...getBannerServiceOverride()
  }
}

export default getServiceOverride
