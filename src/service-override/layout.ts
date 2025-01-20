import {
  type IEditorOverrideServices,
  StandaloneServices
} from 'vs/editor/standalone/browser/standaloneServices'
import {
  ActivityBarPosition,
  LayoutSettings,
  type PanelAlignment,
  Parts,
  Position,
  positionFromString,
  positionToString
} from 'vs/workbench/services/layout/browser/layoutService'
import { IWorkbenchLayoutService } from 'vs/workbench/services/layout/browser/layoutService.service'
import type { ILayoutOffsetInfo } from 'vs/platform/layout/browser/layoutService'
import { ILayoutService } from 'vs/platform/layout/browser/layoutService.service'
import { Emitter, Event } from 'vs/base/common/event'
import * as dom from 'vs/base/browser/dom'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { Part } from 'vs/workbench/browser/part'
import { isAncestorUsingFlowTo } from 'vs/base/browser/dom'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite.service'
import { type IViewContainerModel, ViewContainerLocation } from 'vs/workbench/common/views'
import { IViewDescriptorService } from 'vs/workbench/common/views.service'
import { isChrome, isFirefox, isLinux, isSafari, isWindows } from 'vs/base/common/platform'
import { coalesce } from 'vs/base/common/arrays'
import { ActivitybarPart } from 'vs/workbench/browser/parts/activitybar/activitybarPart'
import { IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService.service'
import { IStatusbarService } from 'vs/workbench/services/statusbar/browser/statusbar.service'
import type { ServicesAccessor } from 'vs/platform/instantiation/common/instantiation'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration.service'
import { Disposable, DisposableStore, toDisposable } from 'vs/base/common/lifecycle'
import { IAuxiliaryWindowService } from 'vs/workbench/services/auxiliaryWindow/browser/auxiliaryWindowService.service'
import { StandaloneCodeEditor } from 'vs/editor/standalone/browser/standaloneCodeEditor'
import { IHostService } from 'vs/workbench/services/host/browser/host.service'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { getMenuBarVisibility, getTitleBarStyle } from 'vs/platform/window/common/window'
import type { IDisposable } from '@xterm/headless'
import type { IViewSize } from 'vs/base/browser/ui/grid/gridview'
import { onRenderWorkbench } from '../lifecycle'
import { getWorkbenchContainer } from '../workbench'
import { unsupported } from '../tools'

export class LayoutService extends Disposable implements ILayoutService, IWorkbenchLayoutService {
  declare readonly _serviceBrand: undefined

  private paneCompositeService!: IPaneCompositePartService
  private editorGroupService!: IEditorGroupsService
  private statusBarService!: IStatusbarService
  private viewDescriptorService!: IViewDescriptorService
  private configurationService!: IConfigurationService
  private auxiliaryWindowService!: IAuxiliaryWindowService
  private hostService!: IHostService

  private activeContainerId: number | undefined
  private sideBarPosition!: Position
  private panelPosition!: Position

  constructor(public mainContainer: HTMLElement = getWorkbenchContainer()) {
    super()
    window.addEventListener('resize', () => this.layout())
    this.layout()

    const platformClass = isWindows ? 'windows' : isLinux ? 'linux' : 'mac'
    const workbenchClasses = coalesce([
      'monaco-workbench',
      platformClass,
      'web',
      isChrome ? 'chromium' : isFirefox ? 'firefox' : isSafari ? 'safari' : undefined
    ])

    mainContainer.classList.add(...workbenchClasses)
    document.body.classList.add(platformClass)
    document.body.classList.add('web')
  }

  getSize(part: Parts): IViewSize {
    return (
      this.getPart(part)?.dimension ?? {
        height: 0,
        width: 0
      }
    )
  }

  setSize = unsupported

  whenContainerStylesLoaded(): undefined {
    return undefined
  }

  onDidChangeMainEditorCenteredLayout = Event.None

  whenActiveContainerStylesLoaded = Promise.resolve()

  hasMainWindowBorder(): boolean {
    return false
  }

  getMainWindowBorderRadius(): string | undefined {
    return undefined
  }

  isMainEditorLayoutCentered(): boolean {
    return false
  }

  centerMainEditorLayout(): void {}

  private readonly _onDidLayoutContainer = this._register(
    new Emitter<{ readonly container: HTMLElement; readonly dimension: dom.IDimension }>()
  )

  readonly onDidLayoutContainer = this._onDidLayoutContainer.event

  private readonly _onDidAddContainer = this._register(
    new Emitter<{ readonly container: HTMLElement; readonly disposables: DisposableStore }>()
  )

  readonly onDidAddContainer = this._onDidAddContainer.event

  private readonly _onDidRemoveContainer = this._register(new Emitter<HTMLElement>())
  readonly onDidRemoveContainer = this._onDidRemoveContainer.event

  private readonly _onDidLayoutMainContainer = this._register(new Emitter<dom.IDimension>())
  readonly onDidLayoutMainContainer = this._onDidLayoutMainContainer.event

  private readonly _onDidLayoutActiveContainer = this._register(new Emitter<dom.IDimension>())
  readonly onDidLayoutActiveContainer = this._onDidLayoutActiveContainer.event
  private readonly _onDidChangeActiveContainer = this._register(new Emitter<void>())
  readonly onDidChangeActiveContainer = this._onDidChangeActiveContainer.event

  get activeContainer(): HTMLElement {
    return this.getContainerFromDocument(dom.getActiveDocument())
  }

  get containers(): Iterable<HTMLElement> {
    const containers: HTMLElement[] = []
    for (const { window } of dom.getWindows()) {
      containers.push(this.getContainerFromDocument(window.document))
    }

    return containers
  }

  private getContainerFromDocument(document: Document): HTMLElement {
    if (document === this.mainContainer.ownerDocument) {
      // main window
      return this.mainContainer
    } else {
      // auxiliary window
      return document.body.getElementsByClassName('monaco-workbench')[0] as HTMLElement
    }
  }

  mainContainerOffset = { top: 0, quickPickTop: 0 }
  activeContainerOffset = { top: 0, quickPickTop: 0 }

  onDidChangeFullscreen = Event.None
  onDidChangeZenMode = Event.None
  onDidChangeWindowMaximized = Event.None
  onDidChangeCenteredLayout = Event.None
  private readonly _onDidChangePanelPosition = this._register(new Emitter<string>())
  readonly onDidChangePanelPosition = this._onDidChangePanelPosition.event
  private readonly _onDidChangeSideBarPosition = this._register(new Emitter<string>())
  readonly onDidChangeSideBarPosition = this._onDidChangeSideBarPosition.event
  onDidChangePanelAlignment = Event.None
  onDidChangeNotificationsVisibility = Event.None
  openedDefaultEditors = false
  whenRestored = Promise.resolve()

  public init(accessor: ServicesAccessor): void {
    this.editorGroupService = accessor.get(IEditorGroupsService)
    this.paneCompositeService = accessor.get(IPaneCompositePartService)
    this.statusBarService = accessor.get(IStatusbarService)
    this.viewDescriptorService = accessor.get(IViewDescriptorService)
    this.configurationService = accessor.get(IConfigurationService)
    this.auxiliaryWindowService = accessor.get(IAuxiliaryWindowService)
    this.hostService = accessor.get(IHostService)

    this._register(
      this.configurationService.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(LayoutSettings.ACTIVITY_BAR_LOCATION)) {
          this.setPartHidden(this.isActivityBarHidden(), Parts.ACTIVITYBAR_PART)
        }

        if (e.affectsConfiguration('workbench.statusBar.visible')) {
          this.setPartHidden(
            !this.configurationService.getValue<boolean>('workbench.statusBar.visible'),
            Parts.STATUSBAR_PART
          )
        }

        if (e.affectsConfiguration('workbench.sideBar.location')) {
          this.setSideBarPosition(
            positionFromString(
              this.configurationService.getValue<string | undefined>(
                'workbench.sideBar.location'
              ) ?? 'left'
            )
          )
        }

        if (e.affectsConfiguration('workbench.panel.defaultLocation')) {
          this.setPanelPosition(
            positionFromString(
              this.configurationService.getValue<string | undefined>(
                'workbench.panel.defaultLocation'
              ) ?? 'bottom'
            )
          )
        }
      })
    )
    this.setPartHidden(this.isActivityBarHidden(), Parts.ACTIVITYBAR_PART)
    this.setPartHidden(
      !this.configurationService.getValue<boolean>('workbench.statusBar.visible'),
      Parts.STATUSBAR_PART
    )
    this.sideBarPosition = positionFromString(
      this.configurationService.getValue<string | undefined>('workbench.sideBar.location') ?? 'left'
    )
    this.panelPosition = positionFromString(
      this.configurationService.getValue<string | undefined>('workbench.panel.defaultLocation') ??
        'bottom'
    )

    // Window active / focus changes
    this._register(this.hostService.onDidChangeActiveWindow(() => this.onActiveWindowChanged()))

    // Auxiliary windows
    this._register(
      this.auxiliaryWindowService.onDidOpenAuxiliaryWindow(({ window, disposables }) => {
        this._onDidAddContainer.fire({
          container: window.container,
          disposables: new DisposableStore()
        })

        disposables.add(
          window.onDidLayout((dimension) =>
            this.handleContainerDidLayout(window.container, dimension)
          )
        )
        disposables.add(toDisposable(() => this._onDidRemoveContainer.fire(window.container)))
      })
    )
  }

  private handleContainerDidLayout(container: HTMLElement, dimension: dom.IDimension): void {
    if (container === this.mainContainer) {
      this._onDidLayoutMainContainer.fire(dimension)
    }

    if (dom.isActiveDocument(container)) {
      this._onDidLayoutActiveContainer.fire(dimension)
    }
  }

  private getActiveContainerId(): number {
    const activeContainer = this.activeContainer

    return dom.getWindow(activeContainer).vscodeWindowId
  }

  private onActiveWindowChanged(): void {
    const activeContainerId = this.getActiveContainerId()
    if (this.activeContainerId !== activeContainerId) {
      this.activeContainerId = activeContainerId
      this._onDidChangeActiveContainer.fire()
    }
  }

  private isActivityBarHidden(): boolean {
    const oldValue = this.configurationService.getValue<boolean | undefined>(
      'workbench.activityBar.visible'
    )
    if (oldValue !== undefined) {
      return !oldValue
    }
    return (
      this.configurationService.getValue(LayoutSettings.ACTIVITY_BAR_LOCATION) !==
      ActivityBarPosition.DEFAULT
    )
  }

  focusPart(part: Parts): void {
    switch (part) {
      case Parts.EDITOR_PART:
        this.editorGroupService.activeGroup.focus()
        break
      case Parts.PANEL_PART: {
        const activePanel = this.paneCompositeService.getActivePaneComposite(
          ViewContainerLocation.Panel
        )
        activePanel?.focus()
        break
      }
      case Parts.SIDEBAR_PART: {
        const activeViewlet = this.paneCompositeService.getActivePaneComposite(
          ViewContainerLocation.Sidebar
        )
        activeViewlet?.focus()
        break
      }
      case Parts.ACTIVITYBAR_PART:
        ;(this.getPart(Parts.ACTIVITYBAR_PART) as ActivitybarPart).focus()
        break
      case Parts.STATUSBAR_PART:
        this.statusBarService.focus()
        break
      default: {
        // Title Bar & Banner simply pass focus to container
        const container = this.getContainer(part)
        container?.focus()
      }
    }
  }

  getDimension(part: Parts): dom.Dimension | undefined {
    return this.getPart(part)?.dimension
  }

  toggleMaximizedPanel(): void {}

  toggleMenuBar(): void {
    let currentVisibilityValue = getMenuBarVisibility(this.configurationService)
    if (typeof currentVisibilityValue !== 'string') {
      currentVisibilityValue = 'classic'
    }

    let newVisibilityValue: string
    if (currentVisibilityValue === 'visible' || currentVisibilityValue === 'classic') {
      newVisibilityValue =
        getTitleBarStyle(this.configurationService) === 'native' ? 'toggle' : 'compact'
    } else {
      newVisibilityValue = 'classic'
    }

    void this.configurationService.updateValue('window.menuBarVisibility', newVisibilityValue)
  }

  setPanelPosition(position: Position): void {
    this.panelPosition = position

    const panelPart = this.getPart(Parts.PANEL_PART)

    panelPart?.updateStyles()

    this._onDidChangePanelPosition.fire(positionToString(position))
  }

  getPanelAlignment(): PanelAlignment {
    return 'left'
  }

  setPanelAlignment(): void {}

  toggleZenMode(): void {}

  isEditorLayoutCentered(): boolean {
    return false
  }

  centerEditorLayout(): void {}

  resizePart(): void {}

  isWindowMaximized(): boolean {
    return false
  }

  updateWindowMaximizedState(): void {}

  getVisibleNeighborPart(): Parts | undefined {
    return undefined
  }

  getMaximumEditorDimensions(): dom.Dimension {
    return new dom.Dimension(Infinity, Infinity)
  }

  isPanelMaximized(): boolean {
    return false
  }

  getPanelPosition(): Position {
    return this.panelPosition
  }

  private readonly parts = new Map<string, Part>()
  hasFocus(part: Parts): boolean {
    const activeElement = document.activeElement
    if (activeElement == null) {
      return false
    }

    const container = this.getContainer(part)

    return !(container == null) && isAncestorUsingFlowTo(activeElement, container)
  }

  getContainer(window: Window): HTMLElement
  getContainer(part: Parts): HTMLElement | undefined
  getContainer(windowOrPart: Parts | Window): HTMLElement | undefined {
    if (typeof windowOrPart === 'string') {
      if (this.parts.get(windowOrPart) == null) {
        return undefined
      }

      return this.getPart(windowOrPart)?.getContainer()
    } else {
      if (windowOrPart.document === this.mainContainer.ownerDocument) {
        // main window
        return this.mainContainer
      } else {
        // auxiliary window
        return windowOrPart.document.body.getElementsByClassName(
          'monaco-workbench'
        )[0] as HTMLElement
      }
    }
  }

  public getPart(key: Parts): Part | undefined {
    return this.parts.get(key)
  }

  private hiddenParts = new Set<Parts>()

  private hasViews(id: string): boolean {
    const viewContainer = this.viewDescriptorService.getViewContainerById(id)
    if (viewContainer == null) {
      return false
    }

    const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer) as
      | IViewContainerModel
      | undefined
    if (viewContainerModel == null) {
      return false
    }

    return viewContainerModel.activeViewDescriptors.length >= 1
  }

  setPartHidden(hidden: boolean, part: Parts): void {
    if (hidden) {
      this.hiddenParts.add(part)
    } else {
      this.hiddenParts.delete(part)
    }
    this._onDidChangePartVisibility.fire()

    const location = (<Partial<Record<Parts, ViewContainerLocation>>>{
      [Parts.SIDEBAR_PART]: ViewContainerLocation.Sidebar,
      [Parts.AUXILIARYBAR_PART]: ViewContainerLocation.AuxiliaryBar,
      [Parts.PANEL_PART]: ViewContainerLocation.Panel
    })[part]

    if (location != null) {
      const paneComposite = this.paneCompositeService.getActivePaneComposite(location)
      if (paneComposite != null && hidden) {
        this.paneCompositeService.hideActivePaneComposite(location)
      } else if (paneComposite == null && !hidden) {
        // If panel part becomes visible, show last active panel or default panel
        let panelToOpen = this.paneCompositeService.getLastActivePaneCompositeId(location) as
          | string
          | undefined

        // verify that the panel we try to open has views before we default to it
        // otherwise fall back to any view that has views still refs #111463
        if (panelToOpen == null || !this.hasViews(panelToOpen)) {
          panelToOpen = this.viewDescriptorService
            .getViewContainersByLocation(location)
            .find((viewContainer) => this.hasViews(viewContainer.id))?.id
        }

        if (panelToOpen != null) {
          void this.paneCompositeService.openPaneComposite(panelToOpen, location, true)
        }
      }
    }

    // The code that show or hide parts in vscode is not pulled by this library, so let's do it by hands here
    this.getPart(part)?.setVisible(!hidden)
  }

  isVisible(part: Parts): boolean {
    return !this.hiddenParts.has(part)
  }

  getSideBarPosition(): Position {
    return this.sideBarPosition
  }

  setSideBarPosition(position: Position): void {
    this.sideBarPosition = position

    const activityBar = this.getPart(Parts.ACTIVITYBAR_PART)
    const sideBar = this.getPart(Parts.SIDEBAR_PART)
    const auxiliaryBar = this.getPart(Parts.AUXILIARYBAR_PART)

    // Update Styles
    activityBar?.updateStyles()
    sideBar?.updateStyles()
    auxiliaryBar?.updateStyles()

    this._onDidChangeSideBarPosition.fire(positionToString(position))
  }

  registerPart(part: Part): IDisposable {
    const id = part.getId()
    this.parts.set(id, part)

    return toDisposable(() => this.parts.delete(id))
  }

  isRestored(): boolean {
    return true
  }

  private _onDidChangePartVisibility = new Emitter<void>()
  onDidChangePartVisibility = this._onDidChangePartVisibility.event

  readonly offset: ILayoutOffsetInfo = { top: 0, quickPickTop: 0 }

  private readonly _onDidLayout = new Emitter<dom.IDimension>()
  readonly onDidLayout = this._onDidLayout.event

  private _mainContainerDimension!: dom.IDimension
  get mainContainerDimension(): dom.IDimension {
    return this._mainContainerDimension
  }

  get activeContainerDimension(): dom.IDimension {
    const activeContainer = this.activeContainer
    if (activeContainer === this.mainContainer) {
      // main window
      return this.mainContainerDimension
    } else {
      // auxiliary window
      return dom.getClientArea(activeContainer)
    }
  }

  layout(): void {
    this._mainContainerDimension = dom.getClientArea(window.document.body)

    this._onDidLayout.fire(this._mainContainerDimension)
  }

  get hasContainer(): boolean {
    return true
  }

  focus(): void {
    const activeContainer = this.activeContainer
    if (activeContainer === this.mainContainer) {
      // main window

      // Break cyclic dependency by getting it only when needed
      const focusedCodeEditor = StandaloneServices.get(ICodeEditorService).getFocusedCodeEditor()
      if (focusedCodeEditor instanceof StandaloneCodeEditor) {
        focusedCodeEditor.focus()
      } else {
        this.focusPart(Parts.EDITOR_PART)
      }
    } else {
      // auxiliary window
      this.editorGroupService.getPart(activeContainer).activeGroup.focus()
    }
  }
}

onRenderWorkbench((accessor) => {
  const layoutService = accessor.get(ILayoutService)
  if (layoutService instanceof LayoutService) {
    layoutService.init(accessor)
  }
})

function getServiceOverride(): IEditorOverrideServices
/**
 * @deprecated Provide container via the services `initialize` function
 */
function getServiceOverride(container?: HTMLElement): IEditorOverrideServices

function getServiceOverride(container?: HTMLElement): IEditorOverrideServices {
  return {
    [ILayoutService.toString()]: new SyncDescriptor(LayoutService, [container], true)
  }
}

export default getServiceOverride
