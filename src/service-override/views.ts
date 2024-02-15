import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IView, IViewDescriptorService, ViewContainerLocation } from 'vs/workbench/common/views'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { SidebarPart } from 'vs/workbench/browser/parts/sidebar/sidebarPart'
import { ViewDescriptorService } from 'vs/workbench/services/views/browser/viewDescriptorService'
import { IActivityService } from 'vs/workbench/services/activity/common/activity'
import { ActivityService } from 'vs/workbench/services/activity/browser/activityService'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite'
import { ActivitybarPart } from 'vs/workbench/browser/parts/activitybar/activitybarPart'
import { IDisposable, IReference } from 'vs/base/common/lifecycle'
import { ExplorerService } from 'vs/workbench/contrib/files/browser/explorerService'
import { IExplorerService } from 'vs/workbench/contrib/files/browser/files'
import { PanelPart } from 'vs/workbench/browser/parts/panel/panelPart'
import { URI } from 'vs/base/common/uri'
import { Part } from 'vs/workbench/browser/part'
import { EditorPart } from 'vs/workbench/browser/parts/editor/editorPart'
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
import { GroupOrientation, GroupsOrder, IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService'
import { IEditorService } from 'vs/workbench/services/editor/common/editorService'
import { IEditorResolverService } from 'vs/workbench/services/editor/common/editorResolverService'
import { EditorResolverService } from 'vs/workbench/services/editor/browser/editorResolverService'
import { BreadcrumbsService, IBreadcrumbsService } from 'vs/workbench/browser/parts/editor/breadcrumbs'
import { IContextViewService } from 'vs/platform/contextview/browser/contextView'
import { ContextViewService } from 'vs/platform/contextview/browser/contextViewService'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { GroupIdentifier, IUntypedEditorInput, isResourceEditorInput, pathsToEditors } from 'vs/workbench/common/editor'
import { IEditorOptions } from 'vs/platform/editor/common/editor'
import { IResolvedTextEditorModel } from 'vs/editor/common/services/resolverService'
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
import { IWorkbenchLayoutService, Parts, Position, positionToString } from 'vs/workbench/services/layout/browser/layoutService'
import { IStorageService, StorageScope } from 'vs/platform/storage/common/storage'
import { IFileService } from 'vs/platform/files/common/files'
import { ILayoutService } from 'vs/platform/layout/browser/layoutService'
import { IProgressService } from 'vs/platform/progress/common/progress'
import { ProgressService } from 'vs/workbench/services/progress/browser/progressService'
import { ILifecycleService, StartupKind } from 'vs/workbench/services/lifecycle/common/lifecycle'
import { AuxiliaryBarPart } from 'vs/workbench/browser/parts/auxiliarybar/auxiliaryBarPart'
import { ILogService } from 'vs/platform/log/common/log'
import { mark } from 'vs/base/common/performance'
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions'
import { Promises } from 'vs/base/common/async'
import { isWeb } from 'vs/base/common/platform'
import { IEnvironmentService } from 'vs/platform/environment/common/environment'
import { IEditorToOpen, IInitialEditorsState, ILayoutInitializationState } from 'vs/workbench/browser/layout'
import { IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService'
import { IWorkspaceContextService, WorkbenchState, isTemporaryWorkspace } from 'vs/platform/workspace/common/workspace'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration'
import { coalesce } from 'vs/base/common/arrays'
import { IWorkingCopyBackupService } from 'vs/workbench/services/workingCopy/common/workingCopyBackup'
import { PaneCompositePartService } from 'vs/workbench/browser/parts/paneCompositePartService'
import { EditorParts } from 'vs/workbench/browser/parts/editor/editorParts'
import { BrowserAuxiliaryWindowService, IAuxiliaryWindowService } from 'vs/workbench/services/auxiliaryWindow/browser/auxiliaryWindowService'
import { Event } from 'vs/base/common/event'
import { IViewsService } from 'vs/workbench/services/views/common/viewsService'
import { ViewsService } from 'vs/workbench/services/views/browser/viewsService'
import { HoverService } from 'vs/editor/browser/services/hoverService'
import { IHoverService } from 'vs/platform/hover/browser/hover'
import { SplitView } from 'vs/base/browser/ui/splitview/splitview'
import { MonacoDelegateEditorGroupsService, MonacoEditorService, OpenEditor } from './tools/editor'
import getBulkEditServiceOverride from './bulkEdit'
import { LayoutService } from './layout'
import getQuickAccessOverride from './quickaccess'
import getKeybindingsOverride from './keybindings'
import { changeUrlDomain } from './tools/url'
import { onRenderWorkbench } from '../lifecycle'
import { registerAssets } from '../assets'
export * from './tools/views'

function createPart (id: string, role: string, classes: string[]): HTMLElement {
  const part = document.createElement(role === 'status' ? 'footer' /* Use footer element for status bar #98376 */ : 'div')
  part.classList.add('part', 'monaco-workbench-part', ...classes)
  part.id = id
  part.setAttribute('role', role)
  if (role === 'status') {
    part.setAttribute('aria-live', 'off')
  }

  return part
}

function layoutPart (part: Part) {
  const parent = part.getContainer()?.parentNode as HTMLElement | undefined
  if (parent == null) {
    return
  }
  part.layout(
    Math.max(part.minimumWidth, Math.min(part.maximumWidth, parent.offsetWidth)),
    Math.max(part.minimumHeight, Math.min(part.maximumHeight, parent.offsetHeight)),
    parent.offsetTop, parent.offsetLeft
  )
}

function renderPart (partContainer: HTMLElement, part: Part): void {
  partContainer.oncontextmenu = () => false
  function layout () {
    layoutPart(part)
  }
  part.onDidVisibilityChange((visible) => {
    if (visible) {
      layout()
    }
  })
  layout()
}

function getPart (part: Parts): Part | undefined {
  return (StandaloneServices.get(ILayoutService) as LayoutService).getPart(part)
}

function _attachPart (part: Part, container: HTMLElement) {
  container.append(part.getContainer()!)
  const observer = new ResizeObserver(() => layoutPart(part))
  observer.observe(container)

  return {
    dispose () {
      return observer.disconnect()
    }
  }
}

function attachPart (part: Parts, container: HTMLElement): IDisposable {
  const _part = getPart(part)
  if (_part == null) {
    throw new Error('Part not found')
  }
  return _attachPart(_part, container)
}

function onPartVisibilityChange (part: Parts, listener: (visible: boolean) => void): IDisposable {
  const _part = getPart(part)
  if (_part == null) {
    throw new Error('Part not found')
  }
  return _part.onDidVisibilityChange(listener)
}

function isPartVisibile (part: Parts): boolean {
  return StandaloneServices.get(IWorkbenchLayoutService).isVisible(part, window)
}

function setPartVisibility (part: Exclude<Parts, Parts.STATUSBAR_PART | Parts.TITLEBAR_PART>, visible: boolean): void {
  StandaloneServices.get(IWorkbenchLayoutService).setPartHidden(!visible, part, window)
}

const onDidChangePanelPosition: Event<string> = (listener) => {
  return StandaloneServices.get(IWorkbenchLayoutService).onDidChangePanelPosition(listener)
}

function getPanelPosition (): Position {
  return StandaloneServices.get(IWorkbenchLayoutService).getPanelPosition()
}

const onDidChangeSideBarPosition: Event<string> = (listener) => {
  return (StandaloneServices.get(IWorkbenchLayoutService) as LayoutService).onDidChangeSideBarPosition(listener)
}

function getSideBarPosition (): Position {
  return StandaloneServices.get(IWorkbenchLayoutService).getSideBarPosition()
}

function renderActivitybarPar (container: HTMLElement): IDisposable {
  return attachPart(Parts.ACTIVITYBAR_PART, container)
}

function renderSidebarPart (container: HTMLElement): IDisposable {
  return attachPart(Parts.SIDEBAR_PART, container)
}

function renderPanelPart (container: HTMLElement): IDisposable {
  return attachPart(Parts.PANEL_PART, container)
}

function renderAuxiliaryPart (container: HTMLElement): IDisposable {
  return attachPart(Parts.AUXILIARYBAR_PART, container)
}

function renderEditorPart (container: HTMLElement): IDisposable {
  return attachPart(Parts.EDITOR_PART, container)
}

function renderStatusBarPart (container: HTMLElement): IDisposable {
  return attachPart(Parts.STATUSBAR_PART, container)
}

function isElementVisible (el: HTMLElement) {
  if (!el.isConnected) {
    return false
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (el.checkVisibility != null) {
    // not defined in Safari
    return el.checkVisibility({
      checkOpacity: true,
      checkVisibilityCSS: true
    })
  }
  return el.offsetHeight > 0 && el.offsetWidth > 0
}

function isEditorPartVisible (): boolean {
  const container = (StandaloneServices.get(IEditorGroupsService).mainPart as EditorPart).getContainer()
  return container != null && isElementVisible(container)
}

type PublicInterface<T> = Pick<T, keyof T>

class MonacoEditorParts extends MonacoDelegateEditorGroupsService<EditorParts> implements Omit<PublicInterface<EditorParts>, keyof IEditorGroupsService> {
  constructor (@IInstantiationService instantiationService: IInstantiationService) {
    super(
      instantiationService.createInstance(EditorParts),
      instantiationService
    )
  }

  getId (): string {
    return 'standalone'
  }

  updateStyles (): void {
  }

  registerPart (part: EditorPart): IDisposable {
    return this.delegate.registerPart(part)
  }

  restoreGroup: EditorPart['restoreGroup'] = (...args) => {
    return this.delegate.restoreGroup(...args)
  }
}

let webviewIframeAlternateDomains: string | undefined
registerAssets({
  'vs/workbench/contrib/webview/browser/pre/service-worker.js': () => changeUrlDomain(new URL('../../vscode/src/vs/workbench/contrib/webview/browser/pre/service-worker.js', import.meta.url).href, webviewIframeAlternateDomains),
  'vs/workbench/contrib/webview/browser/pre/index.html': () => changeUrlDomain(new URL('../assets/webview/index.html', import.meta.url).href, webviewIframeAlternateDomains),
  'vs/workbench/contrib/webview/browser/pre/index-no-csp.html': () => changeUrlDomain(new URL('../assets/webview/index-no-csp.html', import.meta.url).href, webviewIframeAlternateDomains),
  'vs/workbench/contrib/webview/browser/pre/fake.html': () => changeUrlDomain(new URL('../../vscode/src/vs/workbench/contrib/webview/browser/pre/fake.html', import.meta.url).href, webviewIframeAlternateDomains)
})

type InitializationStateTransformer = (state: ILayoutInitializationState) => ILayoutInitializationState
let transformInitializationState: InitializationStateTransformer = state => state

onRenderWorkbench(async (accessor) => {
  const paneCompositePartService = accessor.get(IPaneCompositePartService)
  const viewDescriptorService = accessor.get(IViewDescriptorService)
  const lifecycleService = accessor.get(ILifecycleService)
  const storageService = accessor.get(IStorageService)
  const editorGroupService = accessor.get(IEditorGroupsService)
  const editorService = accessor.get(IEditorService)
  const logService = accessor.get(ILogService)
  const extensionService = accessor.get(IExtensionService)
  const environmentService = accessor.get(IEnvironmentService) as IBrowserWorkbenchEnvironmentService
  const contextService = accessor.get(IWorkspaceContextService)
  const configurationService = accessor.get(IConfigurationService)
  const fileService = accessor.get(IFileService)
  const workingCopyBackupService = accessor.get(IWorkingCopyBackupService)

  // force service instantiation
  const layoutService = accessor.get(ILayoutService) as LayoutService

  function getInitialEditorsState (): IInitialEditorsState | undefined {
    // Check for editors / editor layout from `defaultLayout` options first
    const defaultLayout = environmentService.options?.defaultLayout
    if (((defaultLayout?.editors != null && defaultLayout.editors.length > 0) || defaultLayout?.layout?.editors != null) && ((defaultLayout.force ?? false) || storageService.isNew(StorageScope.WORKSPACE))) {
      return {
        layout: defaultLayout.layout?.editors,
        filesToOpenOrCreate: defaultLayout.editors?.map(editor => {
          return {
            viewColumn: editor.viewColumn,
            fileUri: URI.revive(editor.uri),
            openOnlyIfExists: editor.openOnlyIfExists,
            options: editor.options
          }
        })
      }
    }

    // Then check for files to open, create or diff/merge from main side
    const { filesToOpenOrCreate, filesToDiff, filesToMerge } = environmentService
    if (filesToOpenOrCreate != null || filesToDiff != null || filesToMerge != null) {
      return { filesToOpenOrCreate, filesToDiff, filesToMerge }
    }

    return undefined
  }

  function getDefaultLayoutViews (environmentService: IBrowserWorkbenchEnvironmentService, storageService: IStorageService): string[] | undefined {
    const defaultLayout = environmentService.options?.defaultLayout
    if (defaultLayout == null) {
      return undefined
    }

    if (!(defaultLayout.force ?? false) && !storageService.isNew(StorageScope.WORKSPACE)) {
      return undefined
    }

    const { views } = defaultLayout
    if (views != null && views.length > 0) {
      return views.map(view => view.id)
    }

    return undefined
  }

  function shouldRestoreEditors (contextService: IWorkspaceContextService, initialEditorsState: IInitialEditorsState | undefined): boolean {
    if (isTemporaryWorkspace(contextService.getWorkspace())) {
      return false
    }

    const forceRestoreEditors = configurationService.getValue<string>('window.restoreWindows') === 'preserve'
    return !!forceRestoreEditors || initialEditorsState === undefined
  }

  async function resolveEditorsToOpen (fileService: IFileService, initialEditorsState: IInitialEditorsState | undefined): Promise<IEditorToOpen[]> {
    if (initialEditorsState != null) {
      // Merge editor (single)
      const filesToMerge = coalesce(await pathsToEditors(initialEditorsState.filesToMerge, fileService, logService))
      if (filesToMerge.length === 4 && isResourceEditorInput(filesToMerge[0]) && isResourceEditorInput(filesToMerge[1]) && isResourceEditorInput(filesToMerge[2]) && isResourceEditorInput(filesToMerge[3])) {
        return [{
          editor: {
            input1: { resource: filesToMerge[0].resource },
            input2: { resource: filesToMerge[1].resource },
            base: { resource: filesToMerge[2].resource },
            result: { resource: filesToMerge[3].resource },
            options: { pinned: true }
          }
        }]
      }

      // Diff editor (single)
      const filesToDiff = coalesce(await pathsToEditors(initialEditorsState.filesToDiff, fileService, logService))
      if (filesToDiff.length === 2) {
        return [{
          editor: {
            original: { resource: filesToDiff[0]!.resource },
            modified: { resource: filesToDiff[1]!.resource },
            options: { pinned: true }
          }
        }]
      }

      // Normal editor (multiple)
      const filesToOpenOrCreate: IEditorToOpen[] = []
      const resolvedFilesToOpenOrCreate = await pathsToEditors(initialEditorsState.filesToOpenOrCreate, fileService, logService)
      for (let i = 0; i < resolvedFilesToOpenOrCreate.length; i++) {
        const resolvedFileToOpenOrCreate = resolvedFilesToOpenOrCreate[i]
        if (resolvedFileToOpenOrCreate != null) {
          filesToOpenOrCreate.push({
            editor: resolvedFileToOpenOrCreate,
            viewColumn: initialEditorsState.filesToOpenOrCreate?.[i]!.viewColumn // take over `viewColumn` from initial state
          })
        }
      }

      return filesToOpenOrCreate
    } else if (contextService.getWorkbenchState() === WorkbenchState.EMPTY && configurationService.getValue('workbench.startupEditor') === 'newUntitledFile') {
      if (editorGroupService.mainPart.hasRestorableState) {
        return [] // do not open any empty untitled file if we restored groups/editors from previous session
      }

      const hasBackups = await workingCopyBackupService.hasBackups()
      if (hasBackups) {
        return [] // do not open any empty untitled file if we have backups to restore
      }

      return [{
        editor: { resource: undefined } // open empty untitled file
      }]
    }

    return []
  }

  const initialEditorsState = getInitialEditorsState()
  if (initialEditorsState != null) {
    logService.info('Initial editor state', initialEditorsState)
  }
  let initialLayoutState: ILayoutInitializationState = {
    layout: {
      editors: initialEditorsState?.layout
    },
    editor: {
      restoreEditors: shouldRestoreEditors(contextService, initialEditorsState),
      editorsToOpen: resolveEditorsToOpen(fileService, initialEditorsState)
    },
    views: {
      defaults: getDefaultLayoutViews(environmentService, storageService),
      containerToRestore: {}
    }
  }

  function getDefaultViewContainer (location: ViewContainerLocation) {
    return viewDescriptorService.getDefaultViewContainer(location) ?? viewDescriptorService.getViewContainersByLocation(location)[0]
  }

  function initLayoutState () {
    if (layoutService.isVisible(Parts.SIDEBAR_PART)) {
      // Only restore last viewlet if window was reloaded or we are in development mode
      let viewContainerToRestore: string | undefined
      if (!environmentService.isBuilt || lifecycleService.startupKind === StartupKind.ReloadedWindow || isWeb) {
        viewContainerToRestore = storageService.get(SidebarPart.activeViewletSettingsKey, StorageScope.WORKSPACE, getDefaultViewContainer(ViewContainerLocation.Sidebar)?.id)
      } else {
        viewContainerToRestore = getDefaultViewContainer(ViewContainerLocation.Sidebar)?.id
      }

      initialLayoutState.views.containerToRestore.sideBar = viewContainerToRestore
    }

    // Panel View Container To Restore
    if (layoutService.isVisible(Parts.PANEL_PART)) {
      const viewContainerToRestore = storageService.get(PanelPart.activePanelSettingsKey, StorageScope.WORKSPACE, getDefaultViewContainer(ViewContainerLocation.Panel)?.id)

      initialLayoutState.views.containerToRestore.panel = viewContainerToRestore
    }

    // Auxiliary Panel to restore
    if (layoutService.isVisible(Parts.AUXILIARYBAR_PART)) {
      const viewContainerToRestore = storageService.get(AuxiliaryBarPart.activePanelSettingsKey, StorageScope.WORKSPACE, getDefaultViewContainer(ViewContainerLocation.AuxiliaryBar)?.id)

      initialLayoutState.views.containerToRestore.auxiliaryBar = viewContainerToRestore
    }
  }

  initLayoutState()

  initialLayoutState = transformInitializationState(initialLayoutState)

  if (initialLayoutState.views.containerToRestore.sideBar == null) {
    layoutService.setPartHidden(true, Parts.SIDEBAR_PART)
  }

  if (initialLayoutState.views.containerToRestore.panel == null) {
    layoutService.setPartHidden(true, Parts.PANEL_PART)
  }

  if (initialLayoutState.views.containerToRestore.auxiliaryBar == null) {
    layoutService.setPartHidden(true, Parts.AUXILIARYBAR_PART)
  }

  const invisibleContainer = document.createElement('div')
  invisibleContainer.style.display = 'none'
  document.body.append(invisibleContainer)

  // Create Parts
  for (const { id, role, classes, options, getPosition, onDidChangePosition } of [
    { id: Parts.TITLEBAR_PART, role: 'none', classes: ['titlebar'] },
    { id: Parts.BANNER_PART, role: 'banner', classes: ['banner'] },
    { id: Parts.ACTIVITYBAR_PART, role: 'none', classes: ['activitybar'], getPosition: () => layoutService.getSideBarPosition(), onDidChangePosition: layoutService.onDidChangeSideBarPosition },
    { id: Parts.SIDEBAR_PART, role: 'none', classes: ['sidebar'], getPosition: () => layoutService.getSideBarPosition(), onDidChangePosition: layoutService.onDidChangeSideBarPosition },
    { id: Parts.EDITOR_PART, role: 'main', classes: ['editor'], options: { restorePreviousState: initialLayoutState.editor.restoreEditors } },
    { id: Parts.PANEL_PART, role: 'none', classes: ['panel', 'basepanel'], getPosition: () => layoutService.getPanelPosition(), onDidChangePosition: layoutService.onDidChangePanelPosition },
    { id: Parts.AUXILIARYBAR_PART, role: 'none', classes: ['auxiliarybar', 'basepanel'], getPosition: () => layoutService.getSideBarPosition() === Position.LEFT ? Position.RIGHT : Position.LEFT, onDidChangePosition: layoutService.onDidChangeSideBarPosition },
    { id: Parts.STATUSBAR_PART, role: 'status', classes: ['statusbar'] }
  ]) {
    const part = layoutService.getPart(id)
    if (part != null) {
      const partContainer = createPart(id, role, classes)
      part.create(partContainer, options)
      renderPart(partContainer, part)
      // we should layout the part otherwise the part dimension wont be set which leads to errors
      // use use values to allow settings setting editor size in workbench construction options (VSCode checks that provided size are smaller than part size)
      part.layout(9999, 9999, 0, 0)

      // We need the container to be attached for some views to work (like xterm)
      invisibleContainer.append(partContainer)

      if (getPosition != null) {
        let position = getPosition()
        part.element.classList.add(positionToString(position))
        onDidChangePosition?.(() => {
          part.element.classList.remove(positionToString(position))
          position = getPosition()
          part.element.classList.add(positionToString(position))
        })
      }
    }
  }

  const layoutReadyPromises: Promise<unknown>[] = []
  const layoutRestoredPromises: Promise<unknown>[] = []

  // Restore editors
  layoutReadyPromises.push((async () => {
    mark('code/willRestoreEditors')

    // first ensure the editor part is ready
    await editorGroupService.mainPart.whenReady
    mark('code/restoreEditors/editorGroupsReady')

    // apply editor layout if any
    if (initialLayoutState.layout?.editors != null) {
      editorGroupService.applyLayout(initialLayoutState.layout.editors)
    }

    // then see for editors to open as instructed
    // it is important that we trigger this from
    // the overall restore flow to reduce possible
    // flicker on startup: we want any editor to
    // open to get a chance to open first before
    // signaling that layout is restored, but we do
    // not need to await the editors from having
    // fully loaded.

    const editors = await initialLayoutState.editor.editorsToOpen
    mark('code/restoreEditors/editorsToOpenResolved')

    let openEditorsPromise: Promise<unknown> | undefined
    if (editors.length > 0) {
      // we have to map editors to their groups as instructed
      // by the input. this is important to ensure that we open
      // the editors in the groups they belong to.

      const editorGroupsInVisualOrder = editorGroupService.getGroups(GroupsOrder.GRID_APPEARANCE)
      const mapEditorsToGroup = new Map<GroupIdentifier, Set<IUntypedEditorInput>>()

      for (const editor of editors) {
        const group = editorGroupsInVisualOrder[(editor.viewColumn ?? 1) - 1]! // viewColumn is index+1 based

        let editorsByGroup = mapEditorsToGroup.get(group.id)
        if (editorsByGroup == null) {
          editorsByGroup = new Set<IUntypedEditorInput>()
          mapEditorsToGroup.set(group.id, editorsByGroup)
        }

        editorsByGroup.add(editor.editor)
      }

      openEditorsPromise = Promise.all(Array.from(mapEditorsToGroup).map(async ([groupId, editors]) => {
        try {
          await editorService.openEditors(Array.from(editors), groupId, { validateTrust: true })
        } catch (error) {
          logService.error(<Error>error)
        }
      }))
    }

    // do not block the overall layout ready flow from potentially
    // slow editors to resolve on startup
    layoutRestoredPromises.push(
      Promise.all([
        openEditorsPromise?.finally(() => mark('code/restoreEditors/editorsOpened')),
        editorGroupService.mainPart.whenRestored.finally(() => mark('code/restoreEditors/editorGroupsRestored'))
      ]).finally(() => {
        // the `code/didRestoreEditors` perf mark is specifically
        // for when visible editors have resolved, so we only mark
        // if when editor group service has restored.
        mark('code/didRestoreEditors')
      })
    )
  })())

  // Restore default views (only when `IDefaultLayout` is provided)
  const restoreDefaultViewsPromise = (async () => {
    if (initialLayoutState.views.defaults != null && initialLayoutState.views.defaults.length > 0) {
      mark('code/willOpenDefaultViews')

      const locationsRestored: { id: string, order: number }[] = []

      const tryOpenView = (view: { id: string, order: number }): boolean => {
        const location = viewDescriptorService.getViewLocationById(view.id)
        if (location !== null) {
          const container = viewDescriptorService.getViewContainerByViewId(view.id)
          if (container != null) {
            if (view.order >= (locationsRestored[location]?.order ?? 0)) {
              locationsRestored[location] = { id: container.id, order: view.order }
            }

            const containerModel = viewDescriptorService.getViewContainerModel(container)
            containerModel.setCollapsed(view.id, false)
            containerModel.setVisible(view.id, true)

            return true
          }
        }

        return false
      }

      const defaultViews = [...initialLayoutState.views.defaults].reverse().map((v, index) => ({ id: v, order: index }))

      let i = defaultViews.length
      while (i > 0) {
        i--
        if (tryOpenView(defaultViews[i]!)) {
          defaultViews.splice(i, 1)
        }
      }

      // If we still have views left over, wait until all extensions have been registered and try again
      if (defaultViews.length > 0) {
        await extensionService.whenInstalledExtensionsRegistered()

        let i = defaultViews.length
        while (i > 0) {
          i--
          if (tryOpenView(defaultViews[i]!)) {
            defaultViews.splice(i, 1)
          }
        }
      }

      mark('code/didOpenDefaultViews')
    }
  })()
  layoutReadyPromises.push(restoreDefaultViewsPromise)

  // Restore Sidebar
  layoutReadyPromises.push((async () => {
    // Restoring views could mean that sidebar already
    // restored, as such we need to test again
    await restoreDefaultViewsPromise
    if (initialLayoutState.views.containerToRestore.sideBar == null) {
      return
    }

    mark('code/willRestoreViewlet')

    const viewlet = await paneCompositePartService.openPaneComposite(initialLayoutState.views.containerToRestore.sideBar, ViewContainerLocation.Sidebar)
    if (viewlet == null) {
      await paneCompositePartService.openPaneComposite(getDefaultViewContainer(ViewContainerLocation.Sidebar)?.id, ViewContainerLocation.Sidebar) // fallback to default viewlet as needed
    }

    mark('code/didRestoreViewlet')
  })())

  // Restore Panel
  layoutReadyPromises.push((async () => {
    // Restoring views could mean that panel already
    // restored, as such we need to test again
    await restoreDefaultViewsPromise
    if (initialLayoutState.views.containerToRestore.panel == null) {
      return
    }

    mark('code/willRestorePanel')

    const panel = await paneCompositePartService.openPaneComposite(initialLayoutState.views.containerToRestore.panel, ViewContainerLocation.Panel)
    if (panel == null) {
      await paneCompositePartService.openPaneComposite(getDefaultViewContainer(ViewContainerLocation.Panel)?.id, ViewContainerLocation.Panel) // fallback to default panel as needed
    }

    mark('code/didRestorePanel')
  })())

  // Restore Auxiliary Bar
  layoutReadyPromises.push((async () => {
    // Restoring views could mean that panel already
    // restored, as such we need to test again
    await restoreDefaultViewsPromise
    if (initialLayoutState.views.containerToRestore.auxiliaryBar == null) {
      return
    }

    mark('code/willRestoreAuxiliaryBar')

    const panel = await paneCompositePartService.openPaneComposite(initialLayoutState.views.containerToRestore.auxiliaryBar, ViewContainerLocation.AuxiliaryBar)
    if (panel == null) {
      await paneCompositePartService.openPaneComposite(getDefaultViewContainer(ViewContainerLocation.AuxiliaryBar)?.id, ViewContainerLocation.AuxiliaryBar) // fallback to default panel as needed
    }

    mark('code/didRestoreAuxiliaryBar')
  })())

  await Promises.settled(layoutReadyPromises)
  await Promises.settled(layoutRestoredPromises)
})

function getServiceOverride (openEditorFallback?: OpenEditor, _webviewIframeAlternateDomains?: string): IEditorOverrideServices
/**
 * @deprecated Provide restoreEditors with the initializationState.editor.restoreEditors params
 */
function getServiceOverride (openEditorFallback?: OpenEditor, _webviewIframeAlternateDomains?: string, restoreEditors?: boolean): IEditorOverrideServices
function getServiceOverride (openEditorFallback?: OpenEditor, _webviewIframeAlternateDomains?: string, initializationState?: InitializationStateTransformer): IEditorOverrideServices
function getServiceOverride (openEditorFallback?: OpenEditor, _webviewIframeAlternateDomains?: string, initializationStateOrRestoreEditors?: boolean | InitializationStateTransformer): IEditorOverrideServices {
  if (_webviewIframeAlternateDomains != null) {
    webviewIframeAlternateDomains = _webviewIframeAlternateDomains
  }

  if (initializationStateOrRestoreEditors != null) {
    transformInitializationState = typeof initializationStateOrRestoreEditors === 'boolean'
      ? (state: ILayoutInitializationState) => ({
          ...state,
          editor: {
            ...state.editor,
            restoreEditors: initializationStateOrRestoreEditors
          }
        })
      : initializationStateOrRestoreEditors
  }

  return {
    ...getBulkEditServiceOverride(),
    ...getQuickAccessOverride({
      isKeybindingConfigurationVisible: isEditorPartVisible,
      shouldUseGlobalPicker: isEditorPartVisible
    }),
    ...getKeybindingsOverride({
      shouldUseGlobalKeybindings: isEditorPartVisible
    }),
    [IViewsService.toString()]: new SyncDescriptor(ViewsService, [], false),
    [IViewDescriptorService.toString()]: new SyncDescriptor(ViewDescriptorService, [], true),
    [IActivityService.toString()]: new SyncDescriptor(ActivityService, [], true),
    [IPaneCompositePartService.toString()]: new SyncDescriptor(PaneCompositePartService, [], true),
    [IHoverService.toString()]: new SyncDescriptor(HoverService, [], true),
    [IExplorerService.toString()]: new SyncDescriptor(ExplorerService, [], true),

    [ICodeEditorService.toString()]: new SyncDescriptor(CodeEditorService, [], true),
    [ITextEditorService.toString()]: new SyncDescriptor(TextEditorService, [], false),
    [IEditorGroupsService.toString()]: new SyncDescriptor(MonacoEditorParts, [], false),
    [IEditorService.toString()]: new SyncDescriptor(MonacoEditorService, [openEditorFallback, isEditorPartVisible], false),
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
    [IAuxiliaryWindowService.toString()]: new SyncDescriptor(BrowserAuxiliaryWindowService, [], true)
  }
}

export default getServiceOverride

export {
  ILayoutInitializationState,
  InitializationStateTransformer,
  GroupOrientation,

  renderPart,
  renderSidebarPart,
  renderActivitybarPar,
  renderAuxiliaryPart,
  renderPanelPart,
  renderEditorPart,
  renderStatusBarPart,
  isEditorPartVisible,
  attachPart,
  onPartVisibilityChange,
  isPartVisibile,
  setPartVisibility,
  onDidChangePanelPosition,
  getPanelPosition,
  onDidChangeSideBarPosition,
  getSideBarPosition,
  Position,

  OpenEditor,
  IEditorOptions,
  IResolvedTextEditorModel,
  IReference,

  HoverService,
  ActivityService,
  SidebarPart,
  ActivitybarPart,
  PanelPart,
  Parts,
  SplitView,
  IView
}
