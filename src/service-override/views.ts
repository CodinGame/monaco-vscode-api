import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IViewContainersRegistry, IViewDescriptor, IViewDescriptorService, IViewsRegistry, IViewsService, ViewContainerLocation, Extensions as ViewExtensions } from 'vs/workbench/common/views'
import { ViewsService } from 'vs/workbench/browser/parts/views/viewsService'
import { IInstantiationService, ServicesAccessor } from 'vs/platform/instantiation/common/instantiation'
import { SidebarPart } from 'vs/workbench/browser/parts/sidebar/sidebarPart'
import { ViewDescriptorService } from 'vs/workbench/services/views/browser/viewDescriptorService'
import { IActivityService, IBadge } from 'vs/workbench/services/activity/common/activity'
import { ActivityService } from 'vs/workbench/services/activity/browser/activityService'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite'
import { Event } from 'vs/base/common/event'
import { IPaneComposite } from 'vs/workbench/common/panecomposite'
import { IPaneCompositePart, IPaneCompositeSelectorPart } from 'vs/workbench/browser/parts/paneCompositePart'
import { ActivitybarPart } from 'vs/workbench/browser/parts/activitybar/activitybarPart'
import { DisposableStore, IDisposable, IReference } from 'vs/base/common/lifecycle'
import { IProgressIndicator } from 'vs/platform/progress/common/progress'
import { IHoverService } from 'vs/workbench/services/hover/browser/hover'
import { HoverService } from 'vs/workbench/services/hover/browser/hoverService'
import { ExplorerService } from 'vs/workbench/contrib/files/browser/explorerService'
import { IExplorerService } from 'vs/workbench/contrib/files/browser/files'
import { PanelPart } from 'vs/workbench/browser/parts/panel/panelPart'
import { append, $ } from 'vs/base/browser/dom'
import { ViewPane } from 'vs/workbench/browser/parts/views/viewPane'
import { Registry } from 'vs/platform/registry/common/platform'
import { ViewPaneContainer } from 'vs/workbench/browser/parts/views/viewPaneContainer'
import { URI } from 'vs/base/common/uri'
import { Part } from 'vs/workbench/browser/part'
import { EditorPart } from 'vs/workbench/browser/parts/editor/editorPart'
import 'vs/workbench/contrib/files/browser/fileCommands'
import 'vs/workbench/contrib/files/browser/fileActions.contribution'
import 'vs/workbench/contrib/callHierarchy/browser/callHierarchy.contribution'
import 'vs/workbench/contrib/typeHierarchy/browser/typeHierarchy.contribution'
import 'vs/workbench/contrib/codeEditor/browser/outline/documentSymbolsOutline'
import 'vs/workbench/contrib/outline/browser/outline.contribution'
import 'vs/workbench/browser/actions/listCommands'
import 'vscode/vs/workbench/browser/parts/views/media/views.css'
import 'vs/workbench/api/browser/viewsExtensionPoint'
import 'vs/workbench/browser/parts/editor/editor.contribution'
import 'vs/workbench/browser/workbench.contribution'
import { Codicon } from 'vs/base/common/codicons'
import { IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService'
import { IEditorDropService } from 'vs/workbench/services/editor/browser/editorDropService'
import { EditorService } from 'vs/workbench/services/editor/browser/editorService'
import { IEditorDropTargetDelegate } from 'vs/workbench/browser/parts/editor/editorDropTarget'
import { IEditorService, PreferredGroup } from 'vs/workbench/services/editor/common/editorService'
import { IEditorResolverService } from 'vs/workbench/services/editor/common/editorResolverService'
import { EditorResolverService } from 'vs/workbench/services/editor/browser/editorResolverService'
import { BreadcrumbsService, IBreadcrumbsService } from 'vs/workbench/browser/parts/editor/breadcrumbs'
import { IContextViewService } from 'vs/platform/contextview/browser/contextView'
import { ContextViewService } from 'vs/platform/contextview/browser/contextViewService'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { EditorInput } from 'vs/workbench/common/editor/editorInput'
import { IEditorPane, IResourceDiffEditorInput, ITextDiffEditorPane, IUntitledTextResourceEditorInput, IUntypedEditorInput } from 'vs/workbench/common/editor'
import { IEditorOptions, IResourceEditorInput, ITextResourceEditorInput } from 'vs/platform/editor/common/editor'
import { ITextModelService, IResolvedTextEditorModel } from 'vs/editor/common/services/resolverService'
import { IFileService } from 'vs/platform/files/common/files'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration'
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace'
import { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity'
import { IWorkspaceTrustRequestService } from 'vs/platform/workspace/common/workspaceTrust'
import { IHostService } from 'vs/workbench/services/host/browser/host'
import { ITextEditorService, TextEditorService } from 'vs/workbench/services/textfile/common/textEditorService'
import { CodeEditorService } from 'vs/workbench/services/editor/browser/codeEditorService'
import { IUntitledTextEditorService, UntitledTextEditorService } from 'vs/workbench/services/untitled/common/untitledTextEditorService'
import { StatusbarPart } from 'vs/workbench/browser/parts/statusbar/statusbarPart'
import { IStatusbarService } from 'vs/workbench/services/statusbar/browser/statusbar'
import { ISemanticSimilarityService, SemanticSimilarityService } from 'vs/workbench/services/semanticSimilarity/common/semanticSimilarityService'
import { IHistoryService } from 'vs/workbench/services/history/common/history'
import { HistoryService } from 'vs/workbench/services/history/browser/historyService'
import { Action2, MenuId, registerAction2 } from 'vs/platform/actions/common/actions'
import { Categories } from 'vs/platform/action/common/actionCommonCategories'
import { ContextKeyExpr } from 'vs/platform/contextkey/common/contextkey'
import { IDropdownMenuActionViewItemOptions } from 'vs/base/browser/ui/dropdown/dropdownActionViewItem'
import { IAction } from 'vs/base/common/actions'
import { BaseActionViewItem } from 'vs/base/browser/ui/actionbar/actionViewItems'
import { IOutlineService } from 'vs/workbench/services/outline/browser/outline'
import { OutlineService } from 'vs/workbench/services/outline/browser/outlineService'
import getLayoutServiceOverride from './layout'
import { OpenEditor, wrapOpenEditor } from './tools/editor'
import getBulkEditServiceOverride from './bulkEdit'

const paneCompositeParts = new Map<ViewContainerLocation, IPaneCompositePart>()
const paneCompositeSelectorParts = new Map<ViewContainerLocation, IPaneCompositeSelectorPart>()

class PaneCompositePartService implements IPaneCompositePartService {
  _serviceBrand: undefined
  onDidPaneCompositeOpen = Event.None
  onDidPaneCompositeClose = Event.None
  async openPaneComposite (id: string | undefined, viewContainerLocation: ViewContainerLocation, focus?: boolean): Promise<IPaneComposite | undefined> {
    return this.getPartByLocation(viewContainerLocation)?.openPaneComposite(id, focus)
  }

  getActivePaneComposite (viewContainerLocation: ViewContainerLocation) {
    return this.getPartByLocation(viewContainerLocation)?.getActivePaneComposite()
  }

  getPaneComposite (id: string, viewContainerLocation: ViewContainerLocation) {
    return this.getPartByLocation(viewContainerLocation)?.getPaneComposite(id)
  }

  getPaneComposites (viewContainerLocation: ViewContainerLocation) {
    return this.getPartByLocation(viewContainerLocation)?.getPaneComposites() ?? []
  }

  getPinnedPaneCompositeIds (viewContainerLocation: ViewContainerLocation): string[] {
    return this.getSelectorPartByLocation(viewContainerLocation)?.getPinnedPaneCompositeIds() ?? []
  }

  getVisiblePaneCompositeIds (viewContainerLocation: ViewContainerLocation): string[] {
    return this.getSelectorPartByLocation(viewContainerLocation)?.getVisiblePaneCompositeIds() ?? []
  }

  getProgressIndicator (id: string, viewContainerLocation: ViewContainerLocation): IProgressIndicator | undefined {
    return this.getPartByLocation(viewContainerLocation)?.getProgressIndicator(id)
  }

  hideActivePaneComposite (viewContainerLocation: ViewContainerLocation): void {
    this.getPartByLocation(viewContainerLocation)?.hideActivePaneComposite()
  }

  getLastActivePaneCompositeId (viewContainerLocation: ViewContainerLocation): string {
    return this.getPartByLocation(viewContainerLocation)!.getLastActivePaneCompositeId()
  }

  showActivity (id: string, viewContainerLocation: ViewContainerLocation, badge: IBadge, clazz?: string, priority?: number): IDisposable {
    return this.getSelectorPartByLocation(viewContainerLocation)!.showActivity(id, badge, clazz, priority)
  }

  private getPartByLocation (viewContainerLocation: ViewContainerLocation): IPaneCompositePart | undefined {
    return paneCompositeParts.get(viewContainerLocation)
  }

  private getSelectorPartByLocation (viewContainerLocation: ViewContainerLocation): IPaneCompositeSelectorPart | undefined {
    return paneCompositeSelectorParts.get(viewContainerLocation)
  }
}

function renderPart (part: Part, container: HTMLElement, classNames: string[]): IDisposable {
  const panelEl = document.createElement('div')
  container.append(panelEl)
  panelEl.classList.add(...classNames)
  panelEl.oncontextmenu = () => false
  part.create(panelEl)
  function layout () {
    part.layout(
      Math.max(part.minimumWidth, Math.min(part.maximumWidth, container.offsetWidth)),
      Math.max(part.minimumHeight, Math.min(part.maximumHeight, container.offsetHeight)),
      0, 0
    )
  }
  part.onDidVisibilityChange((visible) => {
    if (visible) {
      layout()
    }
  })
  layout()
  const observer = new ResizeObserver(layout)
  observer.observe(container)

  return {
    dispose () {
      return observer.disconnect()
    }
  }
}

function renderActivitybarPar (container: HTMLElement): IDisposable {
  const activitybarPart = StandaloneServices.get(IInstantiationService).createInstance(ActivitybarPart, paneCompositeParts.get(ViewContainerLocation.Sidebar)!)
  paneCompositeSelectorParts.set(ViewContainerLocation.Sidebar, activitybarPart)

  // eslint-disable-next-line dot-notation
  activitybarPart['_register'](renderPart(activitybarPart, container, ['part', 'activitybar', 'left']))

  return activitybarPart
}

function renderSidebarPart (container: HTMLElement): IDisposable {
  const sidebarPart = StandaloneServices.get(IInstantiationService).createInstance(SidebarPart)
  paneCompositeParts.set(ViewContainerLocation.Sidebar, sidebarPart)

  // eslint-disable-next-line dot-notation
  sidebarPart['_register'](renderPart(sidebarPart, container, ['part', 'sidebar', 'left']))

  if (sidebarPart.getPaneComposites().length > 0) {
    void sidebarPart.openPaneComposite(sidebarPart.getPaneComposites()[0]!.id)
  }

  return sidebarPart
}

function renderPanelPart (container: HTMLElement): IDisposable {
  const panelPart = StandaloneServices.get(IInstantiationService).createInstance(PanelPart)
  paneCompositeSelectorParts.set(ViewContainerLocation.Panel, panelPart)
  paneCompositeParts.set(ViewContainerLocation.Panel, panelPart)

  // eslint-disable-next-line dot-notation
  panelPart['_register'](renderPart(panelPart, container, ['part', 'panel', 'basepanel']))

  if (panelPart.getPaneComposites().length > 0) {
    void panelPart.openPaneComposite(panelPart.getPaneComposites()[0]!.id)
  }

  return panelPart
}

function renderEditorPart (container: HTMLElement): IDisposable {
  const editorPart = StandaloneServices.get(IEditorGroupsService) as EditorPart

  return renderPart(editorPart, container, ['part', 'editor'])
}

function renderStatusBarPart (container: HTMLElement): IDisposable {
  const statusBarPart = StandaloneServices.get(IStatusbarService) as StatusbarPart

  return renderPart(statusBarPart, container, ['part', 'statusbar'])
}

interface CustomViewOption {
  id: string
  name: string
  order?: number
  renderBody (container: HTMLElement): IDisposable
  location: ViewContainerLocation
  icon?: string
  canMoveView?: boolean
  actions?: {
    id: string
    title: string
    tooltip?: string
    order?: number
    run? (accessor: ServicesAccessor): Promise<void>
    icon?: keyof typeof Codicon
    render?(container: HTMLElement): void
  }[]
}

function registerCustomView (options: CustomViewOption): IDisposable {
  const iconUrl = options.icon != null ? URI.parse(options.icon) : undefined

  const VIEW_CONTAINER = Registry.as<IViewContainersRegistry>(ViewExtensions.ViewContainersRegistry).registerViewContainer({
    id: options.id,
    title: options.name,
    order: options.order,
    ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [options.id, { mergeViewWithContainerWhenSingleView: true }]),
    hideIfEmpty: true,
    icon: iconUrl
  }, options.location)

  const views: IViewDescriptor[] = [{
    id: options.id,
    name: options.name,
    canToggleVisibility: false,
    ctorDescriptor: new SyncDescriptor(class extends ViewPane {
      private content?: HTMLElement

      protected override renderBody (container: HTMLElement): void {
        super.renderBody(container)
        this.content = $('.view-pane-content')
        this.content.style.display = 'flex'
        this.content.style.alignItems = 'stretch'
        append(container, this.content)
        this._register(options.renderBody(this.content))
      }

      public override getActionViewItem (action: IAction, actionOptions?: IDropdownMenuActionViewItemOptions) {
        const customAction = (options.actions ?? []).find(customAction => customAction.id === action.id)
        if (customAction?.render != null) {
          return new class extends BaseActionViewItem {
            constructor () { super(null, action) }
            override render = customAction!.render!
          }()
        }
        return super.getActionViewItem(action, actionOptions)
      }

      protected override layoutBody (height: number, width: number): void {
        this.content!.style.height = `${height}px`
        this.content!.style.width = `${width}px`
      }
    }),
    canMoveView: options.canMoveView ?? true,
    containerIcon: iconUrl
  }]

  Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry).registerViews(views, VIEW_CONTAINER)

  const disposableCollection = new DisposableStore()
  disposableCollection.add({
    dispose () {
      Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry).deregisterViews(views, VIEW_CONTAINER)
      Registry.as<IViewContainersRegistry>(ViewExtensions.ViewContainersRegistry).deregisterViewContainer(VIEW_CONTAINER)
    }
  })

  for (const action of options.actions ?? []) {
    disposableCollection.add(registerAction2(class extends Action2 {
      constructor () {
        super({
          id: action.id,
          title: { value: action.title, original: action.title },
          category: Categories.View,
          menu: [{
            id: MenuId.ViewTitle,
            when: ContextKeyExpr.equals('view', options.id),
            group: 'navigation',
            order: action.order
          }, {
            id: MenuId.CommandPalette
          }],
          tooltip: action.tooltip,
          icon: action.icon != null ? Codicon[action.icon] : undefined
        })
      }

      run = action.run ?? (async () => {})
    }))
  }

  return disposableCollection
}

class EditorDropService implements IEditorDropService {
  declare readonly _serviceBrand: undefined

  constructor (@IEditorGroupsService private readonly editorPart: EditorPart) { }

  createEditorDropTarget (container: HTMLElement, delegate: IEditorDropTargetDelegate): IDisposable {
    return this.editorPart.createEditorDropTarget(container, delegate)
  }
}

class CustomEditorService extends EditorService {
  constructor (
    _openEditorFallback: OpenEditor | undefined,
    @IEditorGroupsService private _editorGroupService: IEditorGroupsService,
    @IInstantiationService instantiationService: IInstantiationService,
    @IFileService fileService: IFileService,
    @IConfigurationService configurationService: IConfigurationService,
    @IWorkspaceContextService contextService: IWorkspaceContextService,
    @IUriIdentityService uriIdentityService: IUriIdentityService,
    @IEditorResolverService editorResolverService: IEditorResolverService,
    @IWorkspaceTrustRequestService workspaceTrustRequestService: IWorkspaceTrustRequestService,
    @IHostService hostService: IHostService,
    @ITextEditorService textEditorService: ITextEditorService,
    @ITextModelService textModelService: ITextModelService
  ) {
    super(
      _editorGroupService,
      instantiationService,
      fileService,
      configurationService,
      contextService,
      uriIdentityService,
      editorResolverService,
      workspaceTrustRequestService,
      hostService,
      textEditorService
    )

    this.openEditor = wrapOpenEditor(textModelService, this.openEditor.bind(this), _openEditorFallback)
  }

  override get activeTextEditorControl () {
    // By default, only the editor inside the EditorPart can be "active" here, hack it so the active editor is now the focused editor if it exists
    // It is required for the editor.addAction to be able to add an entry in the editor action menu
    return super.activeTextEditorControl ?? StandaloneServices.get(ICodeEditorService).getFocusedCodeEditor() ?? undefined
  }

  // Override openEditor to fallback on user function is the EditorPart is not visible
  override openEditor(editor: EditorInput, options?: IEditorOptions, group?: PreferredGroup): Promise<IEditorPane | undefined>
  override openEditor(editor: IUntypedEditorInput, group?: PreferredGroup): Promise<IEditorPane | undefined>
  override openEditor(editor: IResourceEditorInput, group?: PreferredGroup): Promise<IEditorPane | undefined>
  override openEditor(editor: ITextResourceEditorInput | IUntitledTextResourceEditorInput, group?: PreferredGroup): Promise<IEditorPane | undefined>
  override openEditor(editor: IResourceDiffEditorInput, group?: PreferredGroup): Promise<ITextDiffEditorPane | undefined>
  override openEditor(editor: EditorInput | IUntypedEditorInput, optionsOrPreferredGroup?: IEditorOptions | PreferredGroup, preferredGroup?: PreferredGroup): Promise<IEditorPane | undefined>
  override async openEditor (editor: EditorInput | IUntypedEditorInput, optionsOrPreferredGroup?: IEditorOptions | PreferredGroup, preferredGroup?: PreferredGroup): Promise<IEditorPane | undefined> {
    // Do not try to open the file if the editor part is not displayed, let the fallback happen
    const editorPart = this._editorGroupService as EditorPart
    if (!(editorPart.getContainer()?.isConnected ?? false)) {
      return undefined
    }

    return super.openEditor(editor, optionsOrPreferredGroup, preferredGroup)
  }
}

export default function getServiceOverride (openEditorFallback?: OpenEditor): IEditorOverrideServices {
  return {
    ...getLayoutServiceOverride(),
    ...getBulkEditServiceOverride(),
    [IViewsService.toString()]: new SyncDescriptor(ViewsService),
    [IViewDescriptorService.toString()]: new SyncDescriptor(ViewDescriptorService),
    [IActivityService.toString()]: new SyncDescriptor(ActivityService),
    [IPaneCompositePartService.toString()]: new SyncDescriptor(PaneCompositePartService),
    [IHoverService.toString()]: new SyncDescriptor(HoverService),
    [IExplorerService.toString()]: new SyncDescriptor(ExplorerService),

    [ICodeEditorService.toString()]: new SyncDescriptor(CodeEditorService),
    [ITextEditorService.toString()]: new SyncDescriptor(TextEditorService),
    [IEditorGroupsService.toString()]: new SyncDescriptor(EditorPart),
    [IStatusbarService.toString()]: new SyncDescriptor(StatusbarPart),
    [IEditorDropService.toString()]: new SyncDescriptor(EditorDropService),
    [IEditorService.toString()]: new SyncDescriptor(CustomEditorService, [openEditorFallback]),
    [IEditorResolverService.toString()]: new SyncDescriptor(EditorResolverService),
    [IBreadcrumbsService.toString()]: new SyncDescriptor(BreadcrumbsService),
    [IContextViewService.toString()]: new SyncDescriptor(ContextViewService),
    [IUntitledTextEditorService.toString()]: new SyncDescriptor(UntitledTextEditorService),
    [ISemanticSimilarityService.toString()]: new SyncDescriptor(SemanticSimilarityService),
    [IHistoryService.toString()]: new SyncDescriptor(HistoryService),
    [IOutlineService.toString()]: new SyncDescriptor(OutlineService)
  }
}

export {
  ViewContainerLocation,
  CustomViewOption,
  registerCustomView,
  renderSidebarPart,
  renderActivitybarPar,
  renderPanelPart,
  renderEditorPart,
  renderStatusBarPart,

  OpenEditor,
  IEditorOptions,
  IResolvedTextEditorModel,
  IReference,

  HoverService,
  ActivityService,
  StatusbarPart,
  SidebarPart,
  ActivitybarPart,
  PanelPart
}
