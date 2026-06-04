import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { Registry } from 'vs/platform/registry/common/platform'
import {
  Extensions as ViewContainerExtensions,
  type IViewContainersRegistry,
  ViewContainerLocation
} from 'vs/workbench/common/views'
import { ViewPaneContainer } from 'vs/workbench/browser/parts/views/viewPaneContainer'
import { IViewDescriptorService } from 'vs/workbench/common/views.service'
import { ViewDescriptorService } from 'vs/workbench/services/views/browser/viewDescriptorService'
import { IActivityService } from 'vs/workbench/services/activity/common/activity.service'
import { ActivityService } from 'vs/workbench/services/activity/browser/activityService'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite.service'
import { IEditorResolverService } from 'vs/workbench/services/editor/common/editorResolverService.service'
import { EditorResolverService } from 'vs/workbench/services/editor/browser/editorResolverService'
import { BreadcrumbsService } from 'vs/workbench/browser/parts/editor/breadcrumbs'
import { IBreadcrumbsService } from 'vs/workbench/browser/parts/editor/breadcrumbs.service'
import { IContextViewService } from 'vs/platform/contextview/browser/contextView.service'
import { ContextViewService } from 'vs/platform/contextview/browser/contextViewService'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService.service'
import { TextEditorService } from 'vs/workbench/services/textfile/common/textEditorService'
import { ITextEditorService } from 'vs/workbench/services/textfile/common/textEditorService.service'
import { CodeEditorService } from 'vs/workbench/services/editor/browser/codeEditorService'
import { UntitledTextEditorService } from 'vs/workbench/services/untitled/common/untitledTextEditorService'
import { IUntitledTextEditorService } from 'vs/workbench/services/untitled/common/untitledTextEditorService.service'
import { IHistoryService } from 'vs/workbench/services/history/common/history.service'
import { HistoryService } from 'vs/workbench/services/history/browser/historyService'
import { ICustomEditorService } from 'vs/workbench/contrib/customEditor/common/customEditor.service'
import { CustomEditorService } from 'vs/workbench/contrib/customEditor/browser/customEditors'
import { WebviewService } from 'vs/workbench/contrib/webview/browser/webviewService'
import { WebviewEditorService } from 'vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService'
import { IWebviewWorkbenchService } from 'vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService.service'
import { IWebviewService } from 'vs/workbench/contrib/webview/browser/webview.service'
import { WebviewViewService } from 'vs/workbench/contrib/webviewView/browser/webviewViewService'
import { IWebviewViewService } from 'vs/workbench/contrib/webviewView/browser/webviewViewService.service'
import { IProgressService } from 'vs/platform/progress/common/progress.service'
import { ProgressService } from 'vs/workbench/services/progress/browser/progressService'
import { PaneCompositePartService } from 'vs/workbench/browser/parts/paneCompositePartService'
import { BrowserAuxiliaryWindowService } from 'vs/workbench/services/auxiliaryWindow/browser/auxiliaryWindowService'
import { IAuxiliaryWindowService } from 'vs/workbench/services/auxiliaryWindow/browser/auxiliaryWindowService.service'
import { IViewsService } from 'vs/workbench/services/views/common/viewsService.service'
import { ViewsService } from 'vs/workbench/services/views/browser/viewsService'
import { IEditorPaneService } from 'vs/workbench/services/editor/common/editorPaneService.service'
import { EditorPaneService } from 'vs/workbench/services/editor/browser/editorPaneService'
import { CustomEditorLabelService } from 'vs/workbench/services/editor/common/customEditorLabelService'
import { ICustomEditorLabelService } from 'vs/workbench/services/editor/common/customEditorLabelService.service'
import { ActionViewItemService } from 'vs/platform/actions/browser/actionViewItemService'
import { IActionViewItemService } from 'vs/platform/actions/browser/actionViewItemService.service'
import getBulkEditServiceOverride from './bulkEdit'
import { changeUrlDomain } from './tools/url.js'
import { registerAssets } from '../assets.js'
import { registerServiceInitializePostParticipant } from '../lifecycle.js'
import 'vs/workbench/contrib/callHierarchy/browser/callHierarchy.contribution'
import 'vs/workbench/contrib/typeHierarchy/browser/typeHierarchy.contribution'
import 'vscode/src/vs/workbench/browser/parts/views/media/views.css'
import 'vs/workbench/api/browser/viewsExtensionPoint'
import 'vs/workbench/browser/parts/editor/editor.contribution'
import 'vs/workbench/browser/parts/titlebar/menubar.contribution'
import 'vs/workbench/browser/workbench.contribution'
import 'vs/workbench/browser/workbench.zenMode.contribution'
import 'vs/sessions/common/theme'
import 'vs/workbench/contrib/customEditor/browser/customEditor.contribution'
import 'vs/workbench/contrib/webviewPanel/browser/webviewPanel.contribution'
import 'vs/workbench/contrib/externalUriOpener/common/externalUriOpener.contribution'
import 'vs/workbench/contrib/languageStatus/browser/languageStatus.contribution'
import 'vs/workbench/contrib/mergeEditor/browser/mergeEditor.contribution'
import 'vs/workbench/contrib/webview/browser/webview.contribution'
import 'vs/workbench/contrib/limitIndicator/browser/limitIndicator.contribution'
import 'vs/workbench/contrib/sash/browser/sash.contribution'
import 'vs/workbench/contrib/preferences/browser/keyboardLayoutPicker'
import 'vs/workbench/browser/parts/editor/editor.contribution._autosave.js'
import 'vs/workbench/contrib/files/browser/files.contribution._editorPane.js'
import 'vs/workbench/contrib/files/browser/fileCommands._save.js'
import 'vs/workbench/browser/style'
import 'vs/workbench/contrib/scrollLocking/browser/scrollLocking.contribution'
import 'vs/workbench/browser/actions/textInputActions'
import 'vs/workbench/browser/actions/helpActions'
import 'vs/workbench/browser/actions/layoutActions'
import 'vs/workbench/browser/actions/listCommands'
import 'vs/workbench/browser/actions/navigationActions'
import 'vs/workbench/browser/actions/windowActions'
import 'vs/workbench/browser/actions/workspaceActions'
import 'vs/workbench/browser/actions/workspaceCommands'
import 'vs/workbench/browser/actions/widgetNavigationCommands'
import './tools/editorAssets.js'

// Import it from here to force the bundler to put it in this service-override package
import 'vs/workbench/browser/parts/editor/editorParts'

let webviewIframeAlternateDomains: string | undefined
registerAssets({
  'vs/workbench/contrib/webview/browser/pre/service-worker.js': () =>
    changeUrlDomain(
      new URL('vs/workbench/contrib/webview/browser/pre/service-worker.js', import.meta.url).href,
      webviewIframeAlternateDomains
    ),
  'vs/workbench/contrib/webview/browser/pre/index.html': () =>
    changeUrlDomain(
      new URL('vs/workbench/contrib/webview/browser/pre/index.html', import.meta.url).href,
      webviewIframeAlternateDomains
    ),
  'vs/workbench/contrib/webview/browser/pre/fake.html': () =>
    changeUrlDomain(
      new URL('vs/workbench/contrib/webview/browser/pre/fake.html', import.meta.url).href,
      webviewIframeAlternateDomains
    )
})

registerServiceInitializePostParticipant(async (accessor) => {
  accessor.get(IHistoryService)
})

const EXPLORER_VIEW_CONTAINER_ID = 'workbench.view.explorer'
/**
 * VS Code's `views` extension-point resolves a contributed view's target as
 * `container ?? getDefaultViewContainer()`, where getDefaultViewContainer() returns
 * `viewContainersRegistry.get('workbench.view.explorer')`. In a partial setup that
 * doesn't include the files explorer, that container is missing and the fallback
 * throws (it reads `.extensionId` off `undefined`) — uncaught, aborting the ENTIRE
 * contributes.views pass so every extension's contributed views fail to register.
 * Register a minimal hidden-when-empty default Sidebar container under that id when
 * none exists, so the fallback resolves and views degrade gracefully. See #804.
 */
function ensureDefaultViewContainer(): void {
  const registry = Registry.as<IViewContainersRegistry>(
    ViewContainerExtensions.ViewContainersRegistry
  )
  if (registry.get(EXPLORER_VIEW_CONTAINER_ID) != null) {
    return
  }
  registry.registerViewContainer(
    {
      id: EXPLORER_VIEW_CONTAINER_ID,
      title: { value: 'Explorer', original: 'Explorer' },
      ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [
        EXPLORER_VIEW_CONTAINER_ID,
        { mergeViewWithContainerWhenSingleView: true }
      ]),
      hideIfEmpty: true,
      order: 0
    },
    ViewContainerLocation.Sidebar,
    { isDefault: true }
  )
}

function getServiceOverride(_webviewIframeAlternateDomains?: string): IEditorOverrideServices {
  ensureDefaultViewContainer()
  if (_webviewIframeAlternateDomains != null) {
    webviewIframeAlternateDomains = _webviewIframeAlternateDomains
  }

  return {
    ...getBulkEditServiceOverride(),
    [IViewsService.toString()]: new SyncDescriptor(ViewsService, [], false),
    [IViewDescriptorService.toString()]: new SyncDescriptor(ViewDescriptorService, [], true),
    [IActivityService.toString()]: new SyncDescriptor(ActivityService, [], true),
    [IPaneCompositePartService.toString()]: new SyncDescriptor(PaneCompositePartService, [], true),

    [ICodeEditorService.toString()]: new SyncDescriptor(CodeEditorService, [], true),
    [ITextEditorService.toString()]: new SyncDescriptor(TextEditorService, [], false),
    [IEditorResolverService.toString()]: new SyncDescriptor(EditorResolverService, [], false),
    [IBreadcrumbsService.toString()]: new SyncDescriptor(BreadcrumbsService, [], true),
    [IContextViewService.toString()]: new SyncDescriptor(ContextViewService, [], true),
    [IUntitledTextEditorService.toString()]: new SyncDescriptor(
      UntitledTextEditorService,
      [],
      true
    ),
    [IHistoryService.toString()]: new SyncDescriptor(HistoryService, [], false),
    [ICustomEditorService.toString()]: new SyncDescriptor(
      CustomEditorService,
      [],
      /** CustomEditorService registers the contribution point, so its instantiation can't be delayed */ false
    ),
    [IWebviewService.toString()]: new SyncDescriptor(WebviewService, [], true),
    [IWebviewViewService.toString()]: new SyncDescriptor(WebviewViewService, [], true),
    [IWebviewWorkbenchService.toString()]: new SyncDescriptor(WebviewEditorService, [], true),
    [IProgressService.toString()]: new SyncDescriptor(ProgressService, [], true),
    [IAuxiliaryWindowService.toString()]: new SyncDescriptor(
      BrowserAuxiliaryWindowService,
      [],
      true
    ),
    [IEditorPaneService.toString()]: new SyncDescriptor(EditorPaneService, [], true),
    [ICustomEditorLabelService.toString()]: new SyncDescriptor(CustomEditorLabelService, [], true),
    [IActionViewItemService.toString()]: new SyncDescriptor(ActionViewItemService, [], true)
  }
}

export default getServiceOverride
