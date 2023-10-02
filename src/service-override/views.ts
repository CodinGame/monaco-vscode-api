import '../missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IViewContainersRegistry, IViewDescriptor, IViewDescriptorService, IViewsRegistry, IViewsService, ViewContainerLocation, Extensions as ViewExtensions } from 'vs/workbench/common/views'
import { ViewsService } from 'vs/workbench/browser/parts/views/viewsService'
import { IInstantiationService, ServicesAccessor } from 'vs/platform/instantiation/common/instantiation'
import { SidebarPart } from 'vs/workbench/browser/parts/sidebar/sidebarPart'
import { ViewDescriptorService } from 'vs/workbench/services/views/browser/viewDescriptorService'
import { IActivityService } from 'vs/workbench/services/activity/common/activity'
import { ActivityService } from 'vs/workbench/services/activity/browser/activityService'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite'
import { PaneCompositeParts } from 'vs/workbench/browser/parts/paneCompositePart'
import { ActivitybarPart } from 'vs/workbench/browser/parts/activitybar/activitybarPart'
import { DisposableStore, IDisposable, IReference } from 'vs/base/common/lifecycle'
import { IHoverService } from 'vs/workbench/services/hover/browser/hover'
import { HoverService } from 'vs/workbench/services/hover/browser/hoverService'
import { ExplorerService } from 'vs/workbench/contrib/files/browser/explorerService'
import { IExplorerService } from 'vs/workbench/contrib/files/browser/files'
import { PanelPart } from 'vs/workbench/browser/parts/panel/panelPart'
import { append, $, Dimension } from 'vs/base/browser/dom'
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
import 'vscode/src/vs/workbench/browser/parts/views/media/views.css'
import 'vs/workbench/api/browser/viewsExtensionPoint'
import 'vs/workbench/browser/parts/editor/editor.contribution'
import 'vs/workbench/browser/workbench.contribution'
import 'vs/workbench/contrib/customEditor/browser/customEditor.contribution'
import 'vs/workbench/contrib/webviewPanel/browser/webviewPanel.contribution'
import 'vs/workbench/contrib/externalUriOpener/common/externalUriOpener.contribution'
import 'vs/workbench/contrib/languageStatus/browser/languageStatus.contribution'
import 'vs/workbench/contrib/languageDetection/browser/languageDetection.contribution'
// import to 2 times with filter to not duplicate the import from files.ts
import 'vs/workbench/contrib/files/browser/files.contribution.js?include=registerConfiguration'
import 'vs/workbench/contrib/files/browser/files.contribution.js?exclude=registerConfiguration'
import { Codicon } from 'vs/base/common/codicons'
import { IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService'
import { IEditorDropService } from 'vs/workbench/services/editor/browser/editorDropService'
import { IEditorDropTargetDelegate } from 'vs/workbench/browser/parts/editor/editorDropTarget'
import { IEditorService } from 'vs/workbench/services/editor/common/editorService'
import { IEditorResolverService } from 'vs/workbench/services/editor/common/editorResolverService'
import { EditorResolverService } from 'vs/workbench/services/editor/browser/editorResolverService'
import { BreadcrumbsService, IBreadcrumbsService } from 'vs/workbench/browser/parts/editor/breadcrumbs'
import { IContextViewService } from 'vs/platform/contextview/browser/contextView'
import { ContextViewService } from 'vs/platform/contextview/browser/contextViewService'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { EditorInput, IEditorCloseHandler } from 'vs/workbench/common/editor/editorInput'
import { EditorExtensions, Verbosity } from 'vs/workbench/common/editor'
import { IEditorOptions } from 'vs/platform/editor/common/editor'
import { IResolvedTextEditorModel } from 'vs/editor/common/services/resolverService'
import { ITextEditorService, TextEditorService } from 'vs/workbench/services/textfile/common/textEditorService'
import { CodeEditorService } from 'vs/workbench/services/editor/browser/codeEditorService'
import { IUntitledTextEditorService, UntitledTextEditorService } from 'vs/workbench/services/untitled/common/untitledTextEditorService'
import { StatusbarPart } from 'vs/workbench/browser/parts/statusbar/statusbarPart'
import { IStatusbarService } from 'vs/workbench/services/statusbar/browser/statusbar'
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
import { ICustomEditorService } from 'vs/workbench/contrib/customEditor/common/customEditor'
import { CustomEditorService } from 'vs/workbench/contrib/customEditor/browser/customEditors'
import { WebviewService } from 'vs/workbench/contrib/webview/browser/webviewService'
import { IWebviewWorkbenchService, WebviewEditorService } from 'vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService'
import { IWebviewService } from 'vs/workbench/contrib/webview/browser/webview'
import { IWebviewViewService, WebviewViewService } from 'vs/workbench/contrib/webviewView/browser/webviewViewService'
import { ILifecycleService, LifecyclePhase } from 'vs/workbench/services/lifecycle/common/lifecycle'
import { IWorkbenchLayoutService, Parts, Position, positionToString } from 'vs/workbench/services/layout/browser/layoutService'
import { EditorPaneDescriptor, IEditorPaneRegistry } from 'vs/workbench/browser/editor'
import { EditorPane } from 'vs/workbench/browser/parts/editor/editorPane'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry'
import { IStorageService } from 'vs/platform/storage/common/storage'
import { IThemeService } from 'vs/platform/theme/common/themeService'
import { ConfirmResult } from 'vs/platform/dialogs/common/dialogs'
import { ILayoutService } from 'vs/platform/layout/browser/layoutService'
import { BannerPart } from 'vs/workbench/browser/parts/banner/bannerPart'
import { IBannerService } from 'vs/workbench/services/banner/browser/bannerService'
import { ITitleService } from 'vs/workbench/services/title/common/titleService'
import { TitlebarPart } from 'vs/workbench/browser/parts/titlebar/titlebarPart'
import { MonacoDelegateEditorGroupsService, MonacoEditorService, OpenEditor } from './tools/editor'
import getBulkEditServiceOverride from './bulkEdit'
import getLayoutServiceOverride, { LayoutService } from './layout'
import getQuickAccessOverride from './quickaccess'
import getKeybindingsOverride from './keybindings'
import { changeUrlDomain } from './tools/url'
import { registerAssets } from '../assets'
import { registerServiceInitializePostParticipant } from '../lifecycle'

function createPart (id: string, role: string, classes: string[]): HTMLElement {
  const part = document.createElement(role === 'status' ? 'footer' /* Use footer element for status bar #98376 */ : 'div')
  part.classList.add('part', ...classes)
  part.id = id
  part.setAttribute('role', role)
  if (role === 'status') {
    part.setAttribute('aria-live', 'off')
  }

  return part
}

function layoutPart (part: Part) {
  const parent = part.getContainer()?.parentNode
  if (parent == null) {
    return
  }
  part.layout(
    Math.max(part.minimumWidth, Math.min(part.maximumWidth, (parent as HTMLElement).offsetWidth)),
    Math.max(part.minimumHeight, Math.min(part.maximumHeight, (parent as HTMLElement).offsetHeight)),
    0, 0
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

function getPart (part: Parts): Part {
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
  return _attachPart(getPart(part), container)
}

function onPartVisibilityChange (part: Parts, listener: (visible: boolean) => void): IDisposable {
  return getPart(part).onDidVisibilityChange(listener)
}

function isPartVisibile (part: Parts): boolean {
  return StandaloneServices.get(IWorkbenchLayoutService).isVisible(part)
}

function setPartVisibility (part: Exclude<Parts, Parts.STATUSBAR_PART | Parts.TITLEBAR_PART>, visible: boolean): void {
  StandaloneServices.get(IWorkbenchLayoutService).setPartHidden(!visible, part)
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

type Label = string | {
  short: string
  medium: string
  long: string
}
interface EditorPanelOption {
  readonly id: string
  name: string
  renderBody (container: HTMLElement): IDisposable
}

interface SimpleEditorInput extends EditorInput {
  setName (name: Label): void
  setTitle (title: Label): void
  setDescription (description: Label): void
  setDirty (dirty: boolean): void
}

function registerEditorPane (options: EditorPanelOption): { disposable: IDisposable, CustomEditorInput: new (closeHandler?: IEditorCloseHandler) => SimpleEditorInput } {
  class CustomEditorPane extends EditorPane {
    private content?: HTMLElement
    constructor (
      @ITelemetryService telemetryService: ITelemetryService,
      @IThemeService themeService: IThemeService,
      @IStorageService storageService: IStorageService
    ) {
      super(options.id, telemetryService, themeService, storageService)
    }

    protected override createEditor (parent: HTMLElement): void {
      this.content = $('.editor-pane-content')
      this.content.style.display = 'flex'
      this.content.style.alignItems = 'stretch'
      append(parent, this.content)
      this._register(options.renderBody(this.content))
    }

    override layout (dimension: Dimension): void {
      this.content!.style.height = `${dimension.height}px`
      this.content!.style.width = `${dimension.width}px`
    }
  }

  class CustomEditorInput extends EditorInput implements SimpleEditorInput {
    static readonly ID: string = `workbench.editors.${options.id}Input`

    private name: string = options.name
    private title: Label = options.name
    private description: Label = options.name
    private dirty: boolean = false

    constructor (public override readonly closeHandler?: IEditorCloseHandler) {
      super()
    }

    override get typeId (): string {
      return CustomEditorInput.ID
    }

    override get resource (): URI | undefined {
      return undefined
    }

    public setName (name: string) {
      this.name = name
      this._onDidChangeLabel.fire()
    }

    public setTitle (title: string) {
      this.title = title
      this._onDidChangeLabel.fire()
    }

    public setDescription (description: string) {
      this.description = description
      this._onDidChangeLabel.fire()
    }

    private getLabelValue (label: Label, verbosity?: Verbosity) {
      if (typeof label === 'string') {
        return label
      }
      switch (verbosity) {
        case Verbosity.SHORT:
          return label.short
        case Verbosity.LONG:
          return label.long
        case Verbosity.MEDIUM:
        default:
          return label.medium
      }
    }

    override getName (): string {
      return this.name
    }

    override getTitle (verbosity?: Verbosity) {
      return this.getLabelValue(this.title, verbosity)
    }

    override getDescription (verbosity?: Verbosity): string {
      return this.getLabelValue(this.description, verbosity)
    }

    override isDirty () {
      return this.dirty
    }

    public setDirty (dirty: boolean) {
      this.dirty = dirty
      this._onDidChangeDirty.fire()
    }
  }

  const disposable = Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
    EditorPaneDescriptor.create(
      CustomEditorPane,
      options.id,
      options.name
    ),
    [new SyncDescriptor(CustomEditorInput)])

  return {
    disposable,
    CustomEditorInput
  }
}

interface CustomViewOption {
  readonly id: string
  name: string
  order?: number
  renderBody (container: HTMLElement): IDisposable
  location: ViewContainerLocation
  icon?: string
  canMoveView?: boolean
  default?: boolean
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

  if (options.default ?? false) {
    void StandaloneServices.get(ILifecycleService).when(LifecyclePhase.Eventually).then(() => {
      void StandaloneServices.get(IViewsService).openViewContainer(options.id)
    })
  }

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
  const container = (StandaloneServices.get(IEditorGroupsService) as EditorPart).getContainer()
  return container != null && isElementVisible(container)
}

type PublicInterface<T> = Pick<T, keyof T>

class MonacoEditorPart extends MonacoDelegateEditorGroupsService<EditorPart> implements Omit<PublicInterface<EditorPart>, keyof IEditorGroupsService> {
  constructor (@IInstantiationService instantiationService: IInstantiationService) {
    super(
      instantiationService.createInstance(EditorPart),
      instantiationService
    )
  }

  onDidChangeSizeConstraints = this.delegate.onDidChangeSizeConstraints

  restoreGroup: EditorPart['restoreGroup'] = (...args) => {
    return this.delegate.restoreGroup(...args)
  }

  isGroupMaximized: EditorPart['isGroupMaximized'] = (...args) => {
    return this.delegate.isGroupMaximized(...args)
  }

  createEditorDropTarget: EditorPart['createEditorDropTarget'] = (...args) => {
    return this.delegate.createEditorDropTarget(...args)
  }

  get minimumWidth (): number {
    return this.delegate.minimumWidth
  }

  get maximumWidth (): number {
    return this.delegate.maximumWidth
  }

  get minimumHeight (): number {
    return this.delegate.minimumHeight
  }

  get maximumHeight (): number {
    return this.delegate.maximumHeight
  }

  get snap (): boolean {
    return this.delegate.snap
  }

  get onDidChange () {
    return this.delegate.onDidChange
  }

  get priority () {
    return this.delegate.priority
  }

  updateStyles: EditorPart['updateStyles'] = (...args) => {
    return this.delegate.updateStyles(...args)
  }

  setBoundarySashes: EditorPart['setBoundarySashes'] = (...args) => {
    return this.delegate.setBoundarySashes(...args)
  }

  layout: EditorPart['layout'] = (...args) => {
    return this.delegate.layout(...args)
  }

  toJSON: EditorPart['toJSON'] = (...args) => {
    return this.delegate.toJSON(...args)
  }

  get dimension () {
    return this.delegate.dimension
  }

  onDidVisibilityChange = this.delegate.onDidVisibilityChange

  create: EditorPart['create'] = (...args) => {
    return this.delegate.create(...args)
  }

  getContainer: EditorPart['getContainer'] = (...args) => {
    return this.delegate.getContainer(...args)
  }

  setVisible: EditorPart['setVisible'] = (...args) => {
    return this.delegate.setVisible(...args)
  }

  getId: EditorPart['getId'] = (...args) => {
    return this.delegate.getId(...args)
  }

  get element () {
    return this.delegate.element
  }
}

let webviewIframeAlternateDomains: string | undefined
registerAssets({
  'vs/workbench/contrib/webview/browser/pre/service-worker.js': () => changeUrlDomain(new URL('../../vscode/src/vs/workbench/contrib/webview/browser/pre/service-worker.js', import.meta.url).href, webviewIframeAlternateDomains),
  'vs/workbench/contrib/webview/browser/pre/index.html': () => changeUrlDomain(new URL('../assets/webview/index.html', import.meta.url).href, webviewIframeAlternateDomains),
  'vs/workbench/contrib/webview/browser/pre/index-no-csp.html': () => changeUrlDomain(new URL('../assets/webview/index-no-csp.html', import.meta.url).href, webviewIframeAlternateDomains),
  'vs/workbench/contrib/webview/browser/pre/fake.html': () => changeUrlDomain(new URL('../../vscode/src/vs/workbench/contrib/webview/browser/pre/fake.html', import.meta.url).href, webviewIframeAlternateDomains)
})

registerServiceInitializePostParticipant(async (accessor) => {
  const paneCompositePartService = accessor.get(IPaneCompositePartService)
  const viewDescriptorService = accessor.get(IViewDescriptorService)

  // force service instantiation
  accessor.get(IStatusbarService)
  accessor.get(IBannerService)
  accessor.get(ITitleService)
  paneCompositePartService.getPaneComposites(ViewContainerLocation.Panel)

  const layoutService = accessor.get(ILayoutService) as LayoutService

  const invisibleContainer = document.createElement('div')
  invisibleContainer.style.display = 'none'
  document.body.append(invisibleContainer)

  // Create Parts
  for (const { id, role, classes, options } of [
    { id: Parts.TITLEBAR_PART, role: 'none', classes: ['titlebar'] },
    { id: Parts.BANNER_PART, role: 'banner', classes: ['banner'] },
    { id: Parts.ACTIVITYBAR_PART, role: 'none', classes: ['activitybar', 'left'] },
    { id: Parts.SIDEBAR_PART, role: 'none', classes: ['sidebar', 'left'] },
    { id: Parts.EDITOR_PART, role: 'main', classes: ['editor'], options: { restorePreviousState: false } },
    { id: Parts.PANEL_PART, role: 'none', classes: ['panel', 'basepanel', positionToString(Position.BOTTOM)] },
    { id: Parts.AUXILIARYBAR_PART, role: 'none', classes: ['auxiliarybar', 'basepanel', 'right'] },
    { id: Parts.STATUSBAR_PART, role: 'status', classes: ['statusbar'] }
  ]) {
    const partContainer = createPart(id, role, classes)

    const part = layoutService.getPart(id)
    part.create(partContainer, options)
    renderPart(partContainer, part)

    // We need the container to be attached for some views to work (like xterm)
    invisibleContainer.append(partContainer)
  }

  await paneCompositePartService.openPaneComposite(viewDescriptorService.getDefaultViewContainer(ViewContainerLocation.Sidebar)?.id, ViewContainerLocation.Sidebar)
  await paneCompositePartService.openPaneComposite(viewDescriptorService.getDefaultViewContainer(ViewContainerLocation.Panel)?.id, ViewContainerLocation.Panel)
  await paneCompositePartService.openPaneComposite(viewDescriptorService.getDefaultViewContainer(ViewContainerLocation.AuxiliaryBar)?.id, ViewContainerLocation.AuxiliaryBar)
})

export default function getServiceOverride (openEditorFallback?: OpenEditor, _webviewIframeAlternateDomains?: string): IEditorOverrideServices {
  if (_webviewIframeAlternateDomains != null) {
    webviewIframeAlternateDomains = _webviewIframeAlternateDomains
  }
  return {
    ...getLayoutServiceOverride(),
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
    [IPaneCompositePartService.toString()]: new SyncDescriptor(PaneCompositeParts, [], true),
    [IHoverService.toString()]: new SyncDescriptor(HoverService, [], true),
    [IExplorerService.toString()]: new SyncDescriptor(ExplorerService, [], true),

    [ICodeEditorService.toString()]: new SyncDescriptor(CodeEditorService, [], true),
    [ITextEditorService.toString()]: new SyncDescriptor(TextEditorService, [], false),
    [IEditorGroupsService.toString()]: new SyncDescriptor(MonacoEditorPart, [], false),
    [ITitleService.toString()]: new SyncDescriptor(TitlebarPart, [], false),
    [IBannerService.toString()]: new SyncDescriptor(BannerPart, [], false),
    [IStatusbarService.toString()]: new SyncDescriptor(StatusbarPart, [], false),
    [IEditorDropService.toString()]: new SyncDescriptor(EditorDropService, [], true),
    [IEditorService.toString()]: new SyncDescriptor(MonacoEditorService, [openEditorFallback, isEditorPartVisible], false),
    [IEditorResolverService.toString()]: new SyncDescriptor(EditorResolverService, [], false),
    [IBreadcrumbsService.toString()]: new SyncDescriptor(BreadcrumbsService, [], true),
    [IContextViewService.toString()]: new SyncDescriptor(ContextViewService, [], true),
    [IUntitledTextEditorService.toString()]: new SyncDescriptor(UntitledTextEditorService, [], true),
    [IHistoryService.toString()]: new SyncDescriptor(HistoryService, [], false),
    [IOutlineService.toString()]: new SyncDescriptor(OutlineService, [], true),
    [ICustomEditorService.toString()]: new SyncDescriptor(CustomEditorService, [], true),
    [IWebviewService.toString()]: new SyncDescriptor(WebviewService, [], true),
    [IWebviewViewService.toString()]: new SyncDescriptor(WebviewViewService, [], true),
    [IWebviewWorkbenchService.toString()]: new SyncDescriptor(WebviewEditorService, [], true)
  }
}

export {
  ViewContainerLocation,
  CustomViewOption,
  registerCustomView,
  EditorPanelOption,
  IEditorCloseHandler,
  ConfirmResult,
  registerEditorPane,

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

  OpenEditor,
  IEditorOptions,
  IResolvedTextEditorModel,
  IReference,

  HoverService,
  ActivityService,
  StatusbarPart,
  SidebarPart,
  ActivitybarPart,
  PanelPart,
  Parts
}
