import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IViewContainersRegistry, IViewDescriptor, IViewDescriptorService, IViewsRegistry, IViewsService, ViewContainerLocation, Extensions as ViewExtensions } from 'vs/workbench/common/views'
import { ViewsService } from 'vs/workbench/browser/parts/views/viewsService'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { SidebarPart } from 'vs/workbench/browser/parts/sidebar/sidebarPart'
import { ViewDescriptorService } from 'vs/workbench/services/views/browser/viewDescriptorService'
import { IActivityService, IBadge } from 'vs/workbench/services/activity/common/activity'
import { ActivityService } from 'vs/workbench/services/activity/browser/activityService'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite'
import { Event } from 'vs/base/common/event'
import { IPaneComposite } from 'vs/workbench/common/panecomposite'
import { IPaneCompositePart, IPaneCompositeSelectorPart } from 'vs/workbench/browser/parts/paneCompositePart'
import { ActivitybarPart } from 'vs/workbench/browser/parts/activitybar/activitybarPart'
import { IDisposable } from 'vs/base/common/lifecycle'
import { IProgressIndicator } from 'vs/platform/progress/common/progress'
import { IHoverService } from 'vs/workbench/services/hover/browser/hover'
import { HoverService } from 'vs/workbench/services/hover/browser/hoverService'
import { ExplorerService } from 'vs/workbench/contrib/files/browser/explorerService'
import { IExplorerService } from 'vs/workbench/contrib/files/browser/files'
import { IBulkEditService } from 'vs/editor/browser/services/bulkEditService'
import { BulkEditService } from 'vs/workbench/contrib/bulkEdit/browser/bulkEditService'
import { PanelPart } from 'vs/workbench/browser/parts/panel/panelPart'
import { append, $ } from 'vs/base/browser/dom'
import { ViewPane } from 'vs/workbench/browser/parts/views/viewPane'
import { Registry } from 'vs/platform/registry/common/platform'
import { ViewPaneContainer } from 'vs/workbench/browser/parts/views/viewPaneContainer'
import { URI } from 'vs/base/common/uri'
import { Part } from 'vs/workbench/browser/part'
import getLayoutServiceOverride from './layout'
import 'vs/workbench/contrib/files/browser/fileCommands'
import 'vs/workbench/contrib/files/browser/fileActions.contribution'
import 'vs/workbench/contrib/callHierarchy/browser/callHierarchy.contribution'
import 'vs/workbench/contrib/typeHierarchy/browser/typeHierarchy.contribution'
import 'vs/workbench/browser/actions/listCommands'
import 'vscode/vs/workbench/browser/parts/views/media/views.css'
import 'vs/workbench/api/browser/viewsExtensionPoint'

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
    return this.getPartByLocation(viewContainerLocation)!.getPaneComposites()
  }

  getPinnedPaneCompositeIds (viewContainerLocation: ViewContainerLocation): string[] {
    return this.getSelectorPartByLocation(viewContainerLocation)!.getPinnedPaneCompositeIds()
  }

  getVisiblePaneCompositeIds (viewContainerLocation: ViewContainerLocation): string[] {
    return this.getSelectorPartByLocation(viewContainerLocation)!.getVisiblePaneCompositeIds()
  }

  getProgressIndicator (id: string, viewContainerLocation: ViewContainerLocation): IProgressIndicator | undefined {
    return this.getPartByLocation(viewContainerLocation)!.getProgressIndicator(id)
  }

  hideActivePaneComposite (viewContainerLocation: ViewContainerLocation): void {
    this.getPartByLocation(viewContainerLocation)!.hideActivePaneComposite()
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

function createActivitybarPar (container: HTMLElement): ActivitybarPart {
  const activitybarPart = StandaloneServices.get(IInstantiationService).createInstance(ActivitybarPart, paneCompositeParts.get(ViewContainerLocation.Sidebar)!)
  paneCompositeSelectorParts.set(ViewContainerLocation.Sidebar, activitybarPart)

  // eslint-disable-next-line dot-notation
  activitybarPart['_register'](renderPart(activitybarPart, container, ['part', 'activitybar', 'left']))

  return activitybarPart
}

function createSidebarPart (container: HTMLElement): SidebarPart {
  const sidebarPart = StandaloneServices.get(IInstantiationService).createInstance(SidebarPart)
  paneCompositeParts.set(ViewContainerLocation.Sidebar, sidebarPart)

  // eslint-disable-next-line dot-notation
  sidebarPart['_register'](renderPart(sidebarPart, container, ['part', 'sidebar', 'left']))

  if (sidebarPart.getPaneComposites().length > 0) {
    void sidebarPart.openPaneComposite(sidebarPart.getPaneComposites()[0]!.id)
  }

  return sidebarPart
}

function createPanelPart (container: HTMLElement): PanelPart {
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

interface CustomViewOption {
  id: string
  name: string
  renderBody (container: HTMLElement): IDisposable
  location: ViewContainerLocation
  icon?: string
  canMoveView?: boolean
}

function registerCustomView (options: CustomViewOption): IDisposable {
  const iconUrl = options.icon != null ? URI.parse(options.icon) : undefined

  const VIEW_CONTAINER = Registry.as<IViewContainersRegistry>(ViewExtensions.ViewContainersRegistry).registerViewContainer({
    id: options.id,
    title: options.name,
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

      protected override layoutBody (height: number, width: number): void {
        this.content!.style.height = `${height}px`
        this.content!.style.width = `${width}px`
      }
    }),
    canMoveView: options.canMoveView ?? true,
    containerIcon: iconUrl
  }]

  Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry).registerViews(views, VIEW_CONTAINER)

  return {
    dispose () {
      Registry.as<IViewsRegistry>(ViewExtensions.ViewsRegistry).deregisterViews(views, VIEW_CONTAINER)
      Registry.as<IViewContainersRegistry>(ViewExtensions.ViewContainersRegistry).deregisterViewContainer(VIEW_CONTAINER)
    }
  }
}

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getLayoutServiceOverride(),
    [IViewsService.toString()]: new SyncDescriptor(ViewsService),
    [IViewDescriptorService.toString()]: new SyncDescriptor(ViewDescriptorService),
    [IActivityService.toString()]: new SyncDescriptor(ActivityService),
    [IPaneCompositePartService.toString()]: new SyncDescriptor(PaneCompositePartService),
    [IHoverService.toString()]: new SyncDescriptor(HoverService),
    [IExplorerService.toString()]: new SyncDescriptor(ExplorerService),
    [IBulkEditService.toString()]: new SyncDescriptor(BulkEditService)
  }
}

export {
  ViewContainerLocation,
  CustomViewOption,
  registerCustomView,
  createSidebarPart,
  createActivitybarPar,
  createPanelPart
}
