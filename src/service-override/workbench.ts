import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IWorkbenchOptions, Workbench } from 'vs/workbench/browser/workbench'
import { ILogService } from 'vs/platform/log/common/log'
import { ServiceCollection } from 'vs/platform/instantiation/common/serviceCollection'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { IWorkbenchLayoutService } from 'vs/workbench/services/layout/browser/layoutService'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IViewsService } from 'vs/workbench/services/views/common/viewsService'
import { IViewDescriptorService } from 'vs/workbench/common/views'
import { ViewDescriptorService } from 'vs/workbench/services/views/browser/viewDescriptorService'
import { IActivityService } from 'vs/workbench/services/activity/common/activity'
import { ActivityService } from 'vs/workbench/services/activity/browser/activityService'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite'
import { ExplorerService } from 'vs/workbench/contrib/files/browser/explorerService'
import { IExplorerService } from 'vs/workbench/contrib/files/browser/files'
import { IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService'
import { IEditorService } from 'vs/workbench/services/editor/common/editorService'
import { IEditorResolverService } from 'vs/workbench/services/editor/common/editorResolverService'
import { EditorResolverService } from 'vs/workbench/services/editor/browser/editorResolverService'
import { BreadcrumbsService, IBreadcrumbsService } from 'vs/workbench/browser/parts/editor/breadcrumbs'
import { IContextViewService } from 'vs/platform/contextview/browser/contextView'
import { ContextViewService } from 'vs/platform/contextview/browser/contextViewService'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { ITextEditorService, TextEditorService } from 'vs/workbench/services/textfile/common/textEditorService'
import { CodeEditorService } from 'vs/workbench/services/editor/browser/codeEditorService'
import { IUntitledTextEditorService, UntitledTextEditorService } from 'vs/workbench/services/untitled/common/untitledTextEditorService'
import { IHistoryService } from 'vs/workbench/services/history/common/history'
import { HistoryService } from 'vs/workbench/services/history/browser/historyService'
import { ICustomEditorService } from 'vs/workbench/contrib/customEditor/common/customEditor'
import { CustomEditorService } from 'vs/workbench/contrib/customEditor/browser/customEditors'
import { WebviewService } from 'vs/workbench/contrib/webview/browser/webviewService'
import { IWebviewWorkbenchService, WebviewEditorService } from 'vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService'
import { IWebviewService } from 'vs/workbench/contrib/webview/browser/webview'
import { IWebviewViewService, WebviewViewService } from 'vs/workbench/contrib/webviewView/browser/webviewViewService'
import { IProgressService } from 'vs/platform/progress/common/progress'
import { ProgressService } from 'vs/workbench/services/progress/browser/progressService'
import { PaneCompositePartService } from 'vs/workbench/browser/parts/paneCompositePartService'
import { BrowserAuxiliaryWindowService, IAuxiliaryWindowService } from 'vs/workbench/services/auxiliaryWindow/browser/auxiliaryWindowService'
import { ViewsService } from 'vs/workbench/services/views/browser/viewsService'
import { HoverService } from 'vs/editor/browser/services/hoverService'
import { IHoverService } from 'vs/platform/hover/browser/hover'
import { EditorService } from 'vs/workbench/services/editor/browser/editorService'
import { EditorParts } from 'vs/workbench/browser/parts/editor/editorParts'
import { onUnexpectedError } from 'vs/base/common/errors'
import { BrowserWindow } from 'vs/workbench/browser/window'
import { detectFullscreen } from 'vs/base/browser/dom'
import { mainWindow } from 'vs/base/browser/window'
import { setFullscreen } from 'vs/base/browser/browser'
import { EditorPaneService } from 'vs/workbench/services/editor/browser/editorPaneService'
import { IEditorPaneService } from 'vs/workbench/services/editor/common/editorPaneService'
import getKeybindingsOverride from './keybindings'
import getQuickAccessOverride from './quickaccess'
import getBulkEditServiceOverride from './bulkEdit'
import { changeUrlDomain } from './tools/url'
import getTitleBarServiceOverride from './viewTitleBar'
import getStatusBarServiceOverride from './viewStatusBar'
import getBannerServiceOverride from './viewBanner'
import { getWorkbenchContainer } from '../workbench'
import { onLayout, onRenderWorkbench } from '../lifecycle'
import { registerAssets } from '../assets'
import 'vs/workbench/contrib/files/browser/fileCommands'
import 'vs/workbench/contrib/files/browser/fileActions.contribution'
import 'vs/workbench/contrib/callHierarchy/browser/callHierarchy.contribution'
import 'vs/workbench/contrib/typeHierarchy/browser/typeHierarchy.contribution'
import 'vs/workbench/browser/actions/listCommands'
import 'vscode/src/vs/workbench/browser/parts/views/media/views.css'
import 'vs/workbench/api/browser/viewsExtensionPoint'
import 'vs/workbench/browser/parts/editor/editor.contribution'
import 'vs/workbench/browser/workbench.contribution'
import 'vs/workbench/contrib/customEditor/browser/customEditor.contribution'
import 'vs/workbench/contrib/webviewPanel/browser/webviewPanel.contribution'
import 'vs/workbench/contrib/externalUriOpener/common/externalUriOpener.contribution'
import 'vs/workbench/contrib/languageStatus/browser/languageStatus.contribution'
import 'vs/workbench/contrib/mergeEditor/browser/mergeEditor.contribution'
import 'vs/workbench/contrib/webview/browser/webview.contribution'
import 'vs/workbench/contrib/files/browser/files.contribution'
import 'vs/workbench/contrib/limitIndicator/browser/limitIndicator.contribution'
import 'vs/workbench/contrib/sash/browser/sash.contribution'
import 'vs/workbench/contrib/preferences/browser/keyboardLayoutPicker'
export * from './tools/views'

let webviewIframeAlternateDomains: string | undefined
registerAssets({
  'vs/workbench/contrib/webview/browser/pre/service-worker.js': () => changeUrlDomain(new URL('../../vscode/src/vs/workbench/contrib/webview/browser/pre/service-worker.js', import.meta.url).href, webviewIframeAlternateDomains),
  'vs/workbench/contrib/webview/browser/pre/index.html': () => changeUrlDomain(new URL('../assets/webview/index.html', import.meta.url).href, webviewIframeAlternateDomains),
  'vs/workbench/contrib/webview/browser/pre/index-no-csp.html': () => changeUrlDomain(new URL('../assets/webview/index-no-csp.html', import.meta.url).href, webviewIframeAlternateDomains),
  'vs/workbench/contrib/webview/browser/pre/fake.html': () => changeUrlDomain(new URL('../../vscode/src/vs/workbench/contrib/webview/browser/pre/fake.html', import.meta.url).href, webviewIframeAlternateDomains)
})

class CustomWorkbench extends Workbench {
  constructor (
    options: IWorkbenchOptions | undefined,
    @ILogService logService: ILogService,
    @IInstantiationService private instantiationService: IInstantiationService
  ) {
    super(getWorkbenchContainer(), options, new ServiceCollection(), logService)

    this.mainContainer.classList.add('monaco-workbench-part')
  }

  protected override registerErrorHandler (): void {
    // prevent intercepting global error events
  }

  override createNotificationsHandlers () {
    // nothing, it's done in the notification service override
  }

  protected override initServices (): IInstantiationService {
    return this.instantiationService
  }

  override restore (): void {
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
onLayout(async accessor => {
  (accessor.get(IWorkbenchLayoutService) as Workbench).startup()
})
onRenderWorkbench(async accessor => {
  accessor.get(IInstantiationService).createInstance(BrowserWindow)
})

function getServiceOverride (options?: IWorkbenchOptions, _webviewIframeAlternateDomains?: string): IEditorOverrideServices {
  if (webviewIframeAlternateDomains != null) {
    webviewIframeAlternateDomains = _webviewIframeAlternateDomains
  }

  return {
    ...getBulkEditServiceOverride(),
    ...getQuickAccessOverride({
      isKeybindingConfigurationVisible: () => true,
      shouldUseGlobalPicker: () => true
    }),
    ...getKeybindingsOverride({
      shouldUseGlobalKeybindings: () => true
    }),
    [IWorkbenchLayoutService.toString()]: new SyncDescriptor(CustomWorkbench, [options], false),
    [IViewsService.toString()]: new SyncDescriptor(ViewsService, [], false),
    [IViewDescriptorService.toString()]: new SyncDescriptor(ViewDescriptorService, [], true),
    [IActivityService.toString()]: new SyncDescriptor(ActivityService, [], true),
    [IPaneCompositePartService.toString()]: new SyncDescriptor(PaneCompositePartService, [], false),
    [IHoverService.toString()]: new SyncDescriptor(HoverService, [], true),
    [IExplorerService.toString()]: new SyncDescriptor(ExplorerService, [], true),
    [ICodeEditorService.toString()]: new SyncDescriptor(CodeEditorService, [], true),
    [ITextEditorService.toString()]: new SyncDescriptor(TextEditorService, [], false),
    [IEditorGroupsService.toString()]: new SyncDescriptor(EditorParts, [], false),
    [IEditorService.toString()]: new SyncDescriptor(EditorService, [undefined], false),
    [IEditorResolverService.toString()]: new SyncDescriptor(EditorResolverService, [], false),
    [IBreadcrumbsService.toString()]: new SyncDescriptor(BreadcrumbsService, [], true),
    [IContextViewService.toString()]: new SyncDescriptor(ContextViewService, [], true),
    [IUntitledTextEditorService.toString()]: new SyncDescriptor(UntitledTextEditorService, [], true),
    [IHistoryService.toString()]: new SyncDescriptor(HistoryService, [], false),
    [ICustomEditorService.toString()]: new SyncDescriptor(CustomEditorService, [], true),
    [IWebviewService.toString()]: new SyncDescriptor(WebviewService, [], true),
    [IWebviewViewService.toString()]: new SyncDescriptor(WebviewViewService, [], true),
    [IWebviewWorkbenchService.toString()]: new SyncDescriptor(WebviewEditorService, [], true),
    [IProgressService.toString()]: new SyncDescriptor(ProgressService, [], true),
    [IAuxiliaryWindowService.toString()]: new SyncDescriptor(BrowserAuxiliaryWindowService, [], true),
    [IEditorPaneService.toString()]: new SyncDescriptor(EditorPaneService, [], true),
    ...getTitleBarServiceOverride(),
    ...getStatusBarServiceOverride(),
    ...getBannerServiceOverride()
  }
}

export default getServiceOverride
