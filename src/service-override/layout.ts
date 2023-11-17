import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IWorkbenchLayoutService, PanelAlignment, Parts, Position } from 'vs/workbench/services/layout/browser/layoutService'
import { ILayoutOffsetInfo, ILayoutService } from 'vs/platform/layout/browser/layoutService'
import { Emitter, Event } from 'vs/base/common/event'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import * as dom from 'vs/base/browser/dom'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { Part } from 'vs/workbench/browser/part'
import { isAncestorUsingFlowTo } from 'vs/base/browser/dom'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite'
import { IViewContainerModel, IViewDescriptorService, ViewContainerLocation } from 'vs/workbench/common/views'
import { isChrome, isFirefox, isLinux, isSafari, isWindows } from 'vs/base/common/platform'
import { coalesce } from 'vs/base/common/arrays'
import { ActivitybarPart } from 'vs/workbench/browser/parts/activitybar/activitybarPart'
import { IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService'
import { IStatusbarService } from 'vs/workbench/services/statusbar/browser/statusbar'
import { ServicesAccessor } from 'vs/platform/instantiation/common/instantiation'
import { onRenderWorkbench } from '../lifecycle'
import { getWorkbenchContainer } from '../workbench'

export class LayoutService implements ILayoutService, IWorkbenchLayoutService {
  declare readonly _serviceBrand: undefined

  private paneCompositeService!: IPaneCompositePartService
  private editorGroupService!: IEditorGroupsService
  private statusBarService!: IStatusbarService
  private viewDescriptorService!: IViewDescriptorService

  constructor (
    public container: HTMLElement = getWorkbenchContainer()
  ) {
    window.addEventListener('resize', () => this.layout())
    this.layout()
  }

  onDidChangeFullscreen = Event.None
  onDidChangeZenMode = Event.None
  onDidChangeWindowMaximized = Event.None
  onDidChangeCenteredLayout = Event.None
  onDidChangePanelPosition = Event.None
  onDidChangePanelAlignment = Event.None
  onDidChangeNotificationsVisibility = Event.None
  openedDefaultEditors = false
  whenRestored = Promise.resolve()

  public init (accessor: ServicesAccessor): void {
    this.editorGroupService = accessor.get(IEditorGroupsService)
    this.paneCompositeService = accessor.get(IPaneCompositePartService)
    this.statusBarService = accessor.get(IStatusbarService)
    this.viewDescriptorService = accessor.get(IViewDescriptorService)
  }

  focusPart (part: Parts): void {
    switch (part) {
      case Parts.EDITOR_PART:
        this.editorGroupService.activeGroup.focus()
        break
      case Parts.PANEL_PART: {
        const activePanel = this.paneCompositeService.getActivePaneComposite(ViewContainerLocation.Panel)
        activePanel?.focus()
        break
      }
      case Parts.SIDEBAR_PART: {
        const activeViewlet = this.paneCompositeService.getActivePaneComposite(ViewContainerLocation.Sidebar)
        activeViewlet?.focus()
        break
      }
      case Parts.ACTIVITYBAR_PART:
        (this.getPart(Parts.ACTIVITYBAR_PART) as ActivitybarPart).focus()
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

  getDimension (part: Parts): dom.Dimension | undefined {
    return this.getPart(part).dimension
  }

  toggleMaximizedPanel (): void {
  }

  hasWindowBorder (): boolean {
    return false
  }

  getWindowBorderWidth (): number {
    return 0
  }

  getWindowBorderRadius (): string | undefined {
    return undefined
  }

  toggleMenuBar (): void {
  }

  setPanelPosition (): void {
    // not supported
  }

  getPanelAlignment (): PanelAlignment {
    return 'left'
  }

  setPanelAlignment (): void {
  }

  toggleZenMode (): void {
  }

  isEditorLayoutCentered (): boolean {
    return false
  }

  centerEditorLayout (): void {
  }

  resizePart (): void {
  }

  isWindowMaximized (): boolean {
    return false
  }

  updateWindowMaximizedState (): void {
  }

  getVisibleNeighborPart (): Parts | undefined {
    return undefined
  }

  getMaximumEditorDimensions (): dom.Dimension {
    return new dom.Dimension(Infinity, Infinity)
  }

  isPanelMaximized (): boolean {
    return false
  }

  getPanelPosition (): Position {
    return Position.BOTTOM
  }

  private readonly parts = new Map<string, Part>()
  hasFocus (part: Parts): boolean {
    const activeElement = document.activeElement
    if (activeElement == null) {
      return false
    }

    const container = this.getContainer(part)

    return !(container == null) && isAncestorUsingFlowTo(activeElement, container)
  }

  getContainer (part: Parts): HTMLElement | undefined {
    if (this.parts.get(part) == null) {
      return undefined
    }

    return this.getPart(part).getContainer()
  }

  public getPart (key: Parts): Part {
    const part = this.parts.get(key)
    if (part == null) {
      throw new Error(`Unknown part ${key}`)
    }

    return part
  }

  private hiddenParts = new Set<Parts>()

  private hasViews (id: string): boolean {
    const viewContainer = this.viewDescriptorService.getViewContainerById(id)
    if (viewContainer == null) {
      return false
    }

    const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer) as IViewContainerModel | undefined
    if (viewContainerModel == null) {
      return false
    }

    return viewContainerModel.activeViewDescriptors.length >= 1
  }

  setPartHidden (hidden: boolean, part: Parts): void {
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
        let panelToOpen = this.paneCompositeService.getLastActivePaneCompositeId(location) as string | undefined

        // verify that the panel we try to open has views before we default to it
        // otherwise fall back to any view that has views still refs #111463
        if (panelToOpen == null || !this.hasViews(panelToOpen)) {
          panelToOpen = this.viewDescriptorService
            .getViewContainersByLocation(location)
            .find(viewContainer => this.hasViews(viewContainer.id))?.id
        }

        if (panelToOpen != null) {
          void this.paneCompositeService.openPaneComposite(panelToOpen, location, true)
        }
      }
    }

    // The code that show or hide parts in vscode is not pulled by this library, so let's do it by hands here
    this.getPart(part).setVisible(!hidden)
  }

  isVisible (part: Parts): boolean {
    return !this.hiddenParts.has(part)
  }

  getSideBarPosition (): Position {
    return Position.LEFT
  }

  registerPart (part: Part): void {
    this.parts.set(part.getId(), part)
  }

  isRestored (): boolean {
    return true
  }

  private _onDidChangePartVisibility = new Emitter<void>()
  onDidChangePartVisibility = this._onDidChangePartVisibility.event

  readonly offset: ILayoutOffsetInfo = { top: 0, quickPickTop: 0 }

  private readonly _onDidLayout = new Emitter<dom.IDimension>()
  readonly onDidLayout = this._onDidLayout.event

  private _dimension!: dom.IDimension
  get dimension (): dom.IDimension { return this._dimension }

  layout (): void {
    this._dimension = dom.getClientArea(window.document.body)

    this._onDidLayout.fire(this._dimension)
  }

  get hasContainer (): boolean {
    return true
  }

  focus (): void {
    // Break cyclic dependency but getting it only when needed
    StandaloneServices.get(ICodeEditorService).getFocusedCodeEditor()?.focus()
  }
}

onRenderWorkbench((accessor) => {
  const layoutService = accessor.get(ILayoutService)
  if (layoutService instanceof LayoutService) {
    layoutService.init(accessor)
  }

  const platformClass = isWindows ? 'windows' : isLinux ? 'linux' : 'mac'
  const workbenchClasses = coalesce([
    'monaco-workbench',
    platformClass,
    'web',
    isChrome ? 'chromium' : isFirefox ? 'firefox' : isSafari ? 'safari' : undefined
  ])

  layoutService.container.classList.add(...workbenchClasses)
  document.body.classList.add(platformClass)
  document.body.classList.add('web')
})

function getServiceOverride (): IEditorOverrideServices
/**
 * @deprecated Provide container via the services `initialize` function
 */
function getServiceOverride (container?: HTMLElement): IEditorOverrideServices

function getServiceOverride (container?: HTMLElement): IEditorOverrideServices {
  return {
    [ILayoutService.toString()]: new SyncDescriptor(LayoutService, [container], true)
  }
}

export default getServiceOverride
