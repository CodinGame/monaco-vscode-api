import '../polyfill'
import '../vscode-services/missing-services'
import { NotificationsToasts } from 'vs/workbench/browser/parts/notifications/notificationsToasts'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IWorkbenchLayoutService } from 'vs/workbench/services/layout/browser/layoutService'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { NotificationService } from 'vs/workbench/services/notification/common/notificationService'
import { INotificationService } from 'vs/platform/notification/common/notification'
import { ILayoutService } from 'vs/platform/layout/browser/layoutService'
import { Emitter } from 'vs/base/common/event'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import * as dom from 'vs/base/browser/dom'
import { INotificationsCenterController, registerNotificationCommands } from 'vs/workbench/browser/parts/notifications/notificationsCommands'
import { DialogHandlerContribution } from 'vs/workbench/browser/parts/dialogs/dialog.web.contribution'
import { DialogService } from 'vs/workbench/services/dialogs/common/dialogService'
import { IDialogService } from 'vs/platform/dialogs/common/dialogs'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { unsupported } from '../tools'

class LayoutService implements ILayoutService, Pick<IWorkbenchLayoutService, 'isVisible'> {
  declare readonly _serviceBrand: undefined

  constructor (public container: HTMLElement, private _codeEditorService: ICodeEditorService) {
    window.addEventListener('resize', () => this.layout())
    this.layout()
  }

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
    this._codeEditorService.getFocusedCodeEditor()?.focus()
  }
}

function register (container: HTMLElement) {
  container.classList.add('monaco-workbench')

  const model = (StandaloneServices.get(INotificationService) as NotificationService).model
  const instantiationService = StandaloneServices.get(IInstantiationService)

  const notificationsToasts = instantiationService.createInstance(NotificationsToasts, container, model)
  notificationsToasts.layout(dom.getClientArea(container))

  const notificationsCenter: INotificationsCenterController = {
    isVisible: false,
    show: unsupported,
    hide: unsupported,
    clearAll: function (): void {
      for (const notification of [...model.notifications] /* copy array since we modify it from closing */) {
        if (!notification.hasProgress) {
          notification.close()
        }
      }
    }
  }

  registerNotificationCommands(notificationsCenter, notificationsToasts, model)

  StandaloneServices.get(IInstantiationService).createInstance(DialogHandlerContribution)
}

export default function getServiceOverride (container: HTMLElement): IEditorOverrideServices {
  setTimeout(() => register(container))

  return {
    [IDialogService.toString()]: new SyncDescriptor(DialogService),
    [INotificationService.toString()]: new SyncDescriptor(NotificationService),
    [ILayoutService.toString()]: new SyncDescriptor(LayoutService, [container])
  }
}
