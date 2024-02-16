import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IViewContainersRegistry, IViewDescriptor, IViewsRegistry, ViewContainer, ViewContainerLocation, Extensions as ViewExtensions } from 'vs/workbench/common/views'
import { BrandedService, ServicesAccessor } from 'vs/platform/instantiation/common/instantiation'
import { DisposableStore, IDisposable, MutableDisposable } from 'vs/base/common/lifecycle'
import { append, $, Dimension, size } from 'vs/base/browser/dom'
import { ViewPane } from 'vs/workbench/browser/parts/views/viewPane'
import { Registry } from 'vs/platform/registry/common/platform'
import { ViewPaneContainer } from 'vs/workbench/browser/parts/views/viewPaneContainer'
import { URI } from 'vs/base/common/uri'
import { Codicon } from 'vs/base/common/codicons'
import { EditorInputFactoryObject, IEditorResolverService, RegisteredEditorInfo, RegisteredEditorOptions, RegisteredEditorPriority } from 'vs/workbench/services/editor/common/editorResolverService'
import { EditorInput, IEditorCloseHandler } from 'vs/workbench/common/editor/editorInput'
import { EditorExtensions, EditorInputCapabilities, IEditorFactoryRegistry, IEditorOpenContext, IEditorSerializer, Verbosity } from 'vs/workbench/common/editor'
import { IEditorOptions } from 'vs/platform/editor/common/editor'
import { Action2, MenuId, registerAction2 } from 'vs/platform/actions/common/actions'
import { Categories } from 'vs/platform/action/common/actionCommonCategories'
import { ContextKeyExpr } from 'vs/platform/contextkey/common/contextkey'
import { IDropdownMenuActionViewItemOptions } from 'vs/base/browser/ui/dropdown/dropdownActionViewItem'
import { IAction } from 'vs/base/common/actions'
import { BaseActionViewItem } from 'vs/base/browser/ui/actionbar/actionViewItems'
import { EditorPaneDescriptor, IEditorPaneRegistry } from 'vs/workbench/browser/editor'
import { EditorPane } from 'vs/workbench/browser/parts/editor/editorPane'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry'
import { IStorageService } from 'vs/platform/storage/common/storage'
import { IThemeService } from 'vs/platform/theme/common/themeService'
import { CancellationToken } from 'vs/base/common/cancellation'
import { DomScrollableElement } from 'vs/base/browser/ui/scrollbar/scrollableElement'
import { assertAllDefined, assertIsDefined } from 'vs/base/common/types'
import { ScrollbarVisibility } from 'vs/base/common/scrollable'
import { ConfirmResult } from 'vs/platform/dialogs/common/dialogs'
import { AbstractResourceEditorInput } from 'vs/workbench/common/editor/resourceEditorInput'
import { AbstractTextResourceEditorInput } from 'vs/workbench/common/editor/textResourceEditorInput'
import { IWorkbenchLayoutService, Parts, Position } from 'vs/workbench/services/layout/browser/layoutService'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { Event } from 'vs/base/common/event'
import { IView, SplitView } from 'vs/base/browser/ui/splitview/splitview'
import type { LayoutService } from '../layout'
import { withReadyServices } from '../../services'

type Label = string | {
  short: string
  medium: string
  long: string
}

abstract class SimpleEditorPane extends EditorPane {
  protected container!: HTMLElement
  private scrollbar: DomScrollableElement | undefined
  private inputDisposable = this._register(new MutableDisposable())
  constructor (
    id: string,
    @ITelemetryService telemetryService: ITelemetryService,
    @IThemeService themeService: IThemeService,
    @IStorageService storageService: IStorageService
  ) {
    super(id, telemetryService, themeService, storageService)
  }

  protected override createEditor (parent: HTMLElement): void {
    this.container = this.initialize()

    // Custom Scrollbars
    this.scrollbar = this._register(new DomScrollableElement(this.container, { horizontal: ScrollbarVisibility.Auto, vertical: ScrollbarVisibility.Auto }))
    parent.appendChild(this.scrollbar.getDomNode())
  }

  override async setInput (input: EditorInput, editorOptions: IEditorOptions | undefined, context: IEditorOpenContext, token: CancellationToken): Promise<void> {
    await super.setInput(input, editorOptions, context, token)

    // Check for cancellation
    if (token.isCancellationRequested) {
      return
    }

    this.inputDisposable.value = await this.renderInput?.(input, editorOptions, context, token)
  }

  override layout (dimension: Dimension): void {
    const [container, scrollbar] = assertAllDefined(this.container, this.scrollbar)

    // Pass on to Container
    size(container, dimension.width, dimension.height)

    // Adjust scrollbar
    scrollbar.scanDomNode()
  }

  override focus (): void {
    const container = assertIsDefined(this.container)

    container.focus()
  }

  override clearInput (): void {
    this.inputDisposable.clear()

    super.clearInput()
  }

  abstract initialize (): HTMLElement
  abstract renderInput? (input: EditorInput, options: IEditorOptions | undefined, context: IEditorOpenContext, token: CancellationToken): Promise<IDisposable>
}

abstract class SimpleEditorInput extends EditorInput {
  private dirty: boolean = false
  private _capabilities: EditorInputCapabilities = 0
  private name: string | undefined
  private title: Label | undefined
  private description: Label | undefined
  public override resource: URI | undefined

  constructor (resource?: URI, public override closeHandler?: IEditorCloseHandler) {
    super()
    this.resource = resource
  }

  public override get capabilities (): EditorInputCapabilities {
    return this._capabilities
  }

  public addCapability (capability: EditorInputCapabilities): void {
    this._capabilities |= capability
    this._onDidChangeCapabilities.fire()
  }

  public removeCapability (capability: EditorInputCapabilities): void {
    this._capabilities &= ~capability
    this._onDidChangeCapabilities.fire()
  }

  override get editorId (): string | undefined {
    return this.typeId
  }

  public setName (name: string): void {
    this.name = name
    this._onDidChangeLabel.fire()
  }

  public setTitle (title: Label): void {
    this.title = title
    this._onDidChangeLabel.fire()
  }

  public setDescription (description: string): void {
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
    return this.name ?? 'Unnamed'
  }

  override getTitle (verbosity?: Verbosity): string {
    return this.getLabelValue(this.title ?? this.getName(), verbosity)
  }

  override getDescription (verbosity?: Verbosity): string {
    return this.getLabelValue(this.description ?? this.getName(), verbosity)
  }

  override isDirty (): boolean {
    return this.dirty
  }

  public setDirty (dirty: boolean): void {
    this.dirty = dirty
    this._onDidChangeDirty.fire()
  }
}

function registerEditorPane<Services extends BrandedService[]> (
  typeId: string,
  name: string,
  ctor: new (...services: Services) => EditorPane,
  inputCtors: (new (...args: any[]) => EditorInput)[]
): IDisposable {
  return Registry.as<IEditorPaneRegistry>(EditorExtensions.EditorPane).registerEditorPane(
    EditorPaneDescriptor.create(
      ctor,
      typeId,
      name
    ),
    inputCtors.map(ctor => new SyncDescriptor(ctor)))
}

function registerEditor (globPattern: string, editorInfo: RegisteredEditorInfo, editorOptions: RegisteredEditorOptions, factory: EditorInputFactoryObject): IDisposable {
  return withReadyServices((servicesAccessor) => {
    const resolverService = servicesAccessor.get(IEditorResolverService)
    return resolverService.registerEditor(
      globPattern,
      editorInfo,
      editorOptions,
      factory
    )
  })
}

function registerEditorSerializer<Services extends BrandedService[]> (editorTypeId: string, ctor: {
  new (...Services: Services): IEditorSerializer
}): IDisposable {
  return Registry.as<IEditorFactoryRegistry>(EditorExtensions.EditorFactory).registerEditorSerializer(editorTypeId, ctor)
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
  viewContainer?: ViewContainer
  canToggleVisibility?: boolean
  hideByDefault?: boolean
  collapsed?: boolean
}

function registerCustomView (options: CustomViewOption): IDisposable {
  const iconUrl = options.icon != null ? URI.parse(options.icon) : undefined

  const viewContainer = options.viewContainer ?? Registry.as<IViewContainersRegistry>(ViewExtensions.ViewContainersRegistry).registerViewContainer({
    id: options.id,
    title: { value: options.name, original: options.name },
    order: options.order,
    ctorDescriptor: new SyncDescriptor(ViewPaneContainer, [options.id, { mergeViewWithContainerWhenSingleView: true }]),
    hideIfEmpty: true,
    icon: iconUrl
  }, options.location, {
    isDefault: options.default
  })

  const views: IViewDescriptor[] = [{
    id: options.id,
    name: {
      value: options.name,
      original: options.name
    },
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
    canToggleVisibility: options.canToggleVisibility ?? false,
    hideByDefault: options.hideByDefault ?? false,
    collapsed: options.collapsed ?? false,
    order: options.order,
    containerIcon: iconUrl
  }]

  Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry).registerViews(views, viewContainer)

  const disposableCollection = new DisposableStore()
  disposableCollection.add({
    dispose () {
      Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry).deregisterViews(views, viewContainer)
      if (options.viewContainer == null) {
        // Only deregister if it's newly created
        Registry.as<IViewContainersRegistry>(ViewExtensions.ViewContainersRegistry).deregisterViewContainer(viewContainer)
      }
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

export function isPartVisibile (part: Parts): boolean {
  return StandaloneServices.get(IWorkbenchLayoutService).isVisible(part, window)
}

export function setPartVisibility (part: Exclude<Parts, Parts.STATUSBAR_PART | Parts.TITLEBAR_PART>, visible: boolean): void {
  StandaloneServices.get(IWorkbenchLayoutService).setPartHidden(!visible, part, window)
}

export const onDidChangePanelPosition: Event<string> = (listener) => {
  return StandaloneServices.get(IWorkbenchLayoutService).onDidChangePanelPosition(listener)
}

export function getPanelPosition (): Position {
  return StandaloneServices.get(IWorkbenchLayoutService).getPanelPosition()
}

export const onDidChangeSideBarPosition: Event<string> = (listener) => {
  return (StandaloneServices.get(IWorkbenchLayoutService) as LayoutService).onDidChangeSideBarPosition(listener)
}

export function getSideBarPosition (): Position {
  return StandaloneServices.get(IWorkbenchLayoutService).getSideBarPosition()
}

export {
  ViewContainerLocation,
  CustomViewOption,
  registerCustomView,
  IEditorCloseHandler,
  ConfirmResult,
  registerEditorPane,
  RegisteredEditorPriority,
  EditorPane,
  SimpleEditorPane,
  SimpleEditorInput,
  AbstractResourceEditorInput,
  AbstractTextResourceEditorInput,
  EditorInput,
  registerEditor,
  IEditorSerializer,
  registerEditorSerializer,
  RegisteredEditorInfo,
  RegisteredEditorOptions,
  EditorInputFactoryObject,
  EditorInputCapabilities,
  Parts,
  SplitView,
  IView
}
