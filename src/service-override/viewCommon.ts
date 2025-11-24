import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
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
import 'vs/workbench/contrib/limitIndicator/browser/limitIndicator.contribution'
import 'vs/workbench/contrib/sash/browser/sash.contribution'
import 'vs/workbench/contrib/preferences/browser/keyboardLayoutPicker'
import 'vs/workbench/browser/parts/editor/editor.contribution._autosave.js'
import 'vs/workbench/contrib/files/browser/files.contribution._editorPane.js'
import 'vs/workbench/contrib/files/browser/fileCommands._save.js'
import 'vs/workbench/browser/actions/navigationActions'
import 'vs/workbench/browser/style'
import 'vs/workbench/contrib/scrollLocking/browser/scrollLocking.contribution'
import 'vs/workbench/browser/actions/textInputActions'
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

function getServiceOverride(_webviewIframeAlternateDomains?: string): IEditorOverrideServices {
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
    [ICustomEditorService.toString()]: new SyncDescriptor(CustomEditorService, [], true),
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
