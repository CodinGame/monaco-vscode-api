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

class LayoutService implements ILayoutService, Pick<IWorkbenchLayoutService, 'isVisible' | 'onDidChangePartVisibility' | 'isRestored' | 'registerPart' | 'getSideBarPosition' | 'setPartHidden' | 'hasFocus'> {
  declare readonly _serviceBrand: undefined

  constructor (public container: HTMLElement) {
    window.addEventListener('resize', () => this.layout())
    this.layout()
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

  setPartHidden (): void {
    // ignore
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

  onDidChangePartVisibility = Event.None

  readonly offset: ILayoutOffsetInfo = { top: 0, quickPickTop: 0 }

  isVisible (): boolean {
    return true
  }

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
