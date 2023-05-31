import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IWorkbenchLayoutService, Parts, Position } from 'vs/workbench/services/layout/browser/layoutService'
import { ILayoutOffsetInfo, ILayoutService } from 'vs/platform/layout/browser/layoutService'
import { Emitter, Event } from 'vs/base/common/event'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import * as dom from 'vs/base/browser/dom'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { Part } from 'vs/workbench/browser/part'
import { isAncestorUsingFlowTo } from 'vs/base/browser/dom'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite'
import { ViewContainerLocation } from 'vs/workbench/common/views'

export class LayoutService implements ILayoutService, Pick<IWorkbenchLayoutService, 'isVisible' | 'onDidChangePartVisibility' | 'isRestored' | 'registerPart' | 'getSideBarPosition' | 'setPartHidden' | 'hasFocus' | 'getPanelPosition' | 'isPanelMaximized' | 'getMaximumEditorDimensions' | 'onDidChangeFullscreen'> {
  declare readonly _serviceBrand: undefined

  constructor (
    public container: HTMLElement,
    @IPaneCompositePartService private paneCompositeService: IPaneCompositePartService
  ) {
    window.addEventListener('resize', () => this.layout())
    this.layout()
  }

  onDidChangeFullscreen = Event.None

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

  protected getPart (key: Parts): Part {
    const part = this.parts.get(key)
    if (part == null) {
      throw new Error(`Unknown part ${key}`)
    }

    return part
  }

  private hiddenParts = new Set<Parts>()

  setPartHidden (hidden: boolean, part: Exclude<Parts, Parts.STATUSBAR_PART | Parts.TITLEBAR_PART>): void {
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
      // This code comes from the vscode implementation of IWorkbenchLayoutService
      const paneComposite = this.paneCompositeService.getActivePaneComposite(location)
      if (paneComposite != null) {
        if (hidden) {
          // vscode doesn't hide a pane composite if it's the last one from the part
          // because at this moment, in vscode, the part is hidden
          this.paneCompositeService.hideActivePaneComposite(location)
        }
      }

      // The code that show or hide parts in vscode is not pulled by this library, so let's do it by hands here
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((this.paneCompositeService as any).getPartByLocation != null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.paneCompositeService as any).getPartByLocation(location).setVisible(!hidden)
      }
    }

    // vscode hide parts when they are empty, but we don't have any way to make it visible back
    // so let's make it visible again right away
    setTimeout(() => {
      this.setPartHidden(false, part)
    })
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

export default function getServiceOverride (container: HTMLElement = document.body): IEditorOverrideServices {
  container.classList.add('monaco-workbench')
  return {
    [ILayoutService.toString()]: new SyncDescriptor(LayoutService, [container]),
    [IWorkbenchLayoutService.toString()]: new SyncDescriptor(LayoutService, [container])
  }
}
