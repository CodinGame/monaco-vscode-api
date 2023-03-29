import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IWorkbenchLayoutService } from 'vs/workbench/services/layout/browser/layoutService'
import { ILayoutOffsetInfo, ILayoutService } from 'vs/platform/layout/browser/layoutService'
import { Emitter, Event } from 'vs/base/common/event'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import * as dom from 'vs/base/browser/dom'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { onServicesInitialized } from './tools'

class LayoutService implements ILayoutService, Pick<IWorkbenchLayoutService, 'isVisible' | 'onDidChangePartVisibility'> {
  declare readonly _serviceBrand: undefined

  constructor (public container: HTMLElement) {
    window.addEventListener('resize', () => this.layout())
    this.layout()
  }

  onDidChangePartVisibility = Event.None

  readonly offset: ILayoutOffsetInfo = { top: 0, quickPickTop: 0 }

  isVisible (): boolean {
    return false
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
    StandaloneServices.get(ICodeEditorService).getFocusedCodeEditor()?.focus()
  }
}

function initialize (instantiationService: IInstantiationService) {
  const container = instantiationService.invokeFunction((accessor) => accessor.get(ILayoutService)).container
  container.classList.add('monaco-workbench')
}

export default function getServiceOverride (container: HTMLElement = document.body): IEditorOverrideServices {
  onServicesInitialized(initialize)

  return {
    [ILayoutService.toString()]: new SyncDescriptor(LayoutService, [container]),
    [IWorkbenchLayoutService.toString()]: new SyncDescriptor(LayoutService, [container])
  }
}
