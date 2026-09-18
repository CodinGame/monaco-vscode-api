import { setFullscreen } from 'vs/base/browser/browser'
import { detectFullscreen } from 'vs/base/browser/dom'
import { mainWindow } from 'vs/base/browser/window'
import { onUnexpectedError, setUnexpectedErrorHandler } from 'vs/base/common/errors'
import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { ServiceCollection } from 'vs/platform/instantiation/common/serviceCollection'
import { ILogService } from 'vs/platform/log/common/log.service'
import { EditorParts } from 'vs/workbench/browser/parts/editor/editorParts'
import { BrowserWindow } from 'vs/workbench/browser/window'
import { type IWorkbenchOptions, Workbench } from 'vs/workbench/browser/workbench'
import { IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService.service'
import { IWorkbenchLayoutService } from 'vs/workbench/services/layout/browser/layoutService.service'
import { WorkspaceFolderLabelService } from 'vs/workbench/services/workspaces/common/workspaceFolderLabelService'
import { IWorkspaceFolderLabelService } from 'vs/workbench/services/workspaces/common/workspaceFolderLabelService.service'
import { onLayout, onRenderWorkbench } from '../../lifecycle'
import { getWorkbenchContainer } from '../../workbench'
import getBannerServiceOverride from '../viewBanner'
import getViewCommonServiceOverride from '../viewCommon/classic'
import getStatusBarServiceOverride from '../viewStatusBar'
import getTitleBarServiceOverride from '../viewTitleBar/classic'
import getCommonServiceOverride from './common'
import 'vs/workbench/browser/parts/titlebar/menubar.contribution'
import 'vs/workbench/browser/workbench.zenMode.contribution'
import 'vs/workbench/contrib/languageStatus/browser/languageStatus.contribution'
export * from '../tools/views'

class CustomWorkbench extends Workbench {
  constructor(
    options: IWorkbenchOptions | undefined,
    @ILogService logService: ILogService,
    @IInstantiationService private instantiationService: IInstantiationService
  ) {
    super(getWorkbenchContainer(), options, new ServiceCollection(), logService)

    this.mainContainer.classList.add('monaco-workbench-part')
  }

  protected override registerErrorHandler(logService: ILogService): void {
    // prevent intercepting global error events
    setUnexpectedErrorHandler((error) => this.handleUnexpectedError(error, logService))
  }

  override createNotificationsHandlers() {
    // nothing, it's done in the notification service override
  }

  protected override initServices(): IInstantiationService {
    return this.instantiationService
  }

  override restore(instantiationService: IInstantiationService): void {
    try {
      this.restoreParts(instantiationService)
    } catch (error) {
      onUnexpectedError(error)
    }

    // prevent managing lifecycle service phase as it's already done in lifecycle.ts
  }
}

onLayout(async (accessor) => {
  ;(accessor.get(IWorkbenchLayoutService) as Workbench).startup()
  const detectedFullScreen = detectFullscreen(mainWindow, getWorkbenchContainer())
  setFullscreen(detectedFullScreen != null && !detectedFullScreen.guess, mainWindow)
})
onRenderWorkbench(async (accessor) => {
  accessor.get(IInstantiationService).createInstance(BrowserWindow)
})

function getServiceOverride(
  options?: IWorkbenchOptions,
  _webviewIframeAlternateDomains?: string
): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride(),
    ...getViewCommonServiceOverride(_webviewIframeAlternateDomains),
    [IWorkbenchLayoutService.toString()]: new SyncDescriptor(CustomWorkbench, [options], false),
    [IEditorGroupsService.toString()]: new SyncDescriptor(EditorParts, [], false),
    [IWorkspaceFolderLabelService.toString()]: new SyncDescriptor(
      WorkspaceFolderLabelService,
      [],
      true
    ),
    ...getTitleBarServiceOverride(),
    ...getStatusBarServiceOverride(),
    ...getBannerServiceOverride()
  }
}

export default getServiceOverride
