import '../polyfill'
import '../vscode-services/missing-services'
import { NotificationsToasts } from 'vs/workbench/browser/parts/notifications/notificationsToasts'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { NotificationService } from 'vs/workbench/services/notification/common/notificationService'
import { INotificationService } from 'vs/platform/notification/common/notification'
import * as dom from 'vs/base/browser/dom'
import { INotificationsCenterController, registerNotificationCommands } from 'vs/workbench/browser/parts/notifications/notificationsCommands'
import { DialogHandlerContribution } from 'vs/workbench/browser/parts/dialogs/dialog.web.contribution'
import { DialogService } from 'vs/workbench/services/dialogs/common/dialogService'
import { IDialogService } from 'vs/platform/dialogs/common/dialogs'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ILayoutService } from 'vs/platform/layout/browser/layoutService'
import getLayoutServiceOverride from './layout'
import { onServicesInitialized } from './tools'
import { unsupported } from '../tools'

function initialize (instantiationService: IInstantiationService) {
  const container = StandaloneServices.get(ILayoutService).container
  container.classList.add('monaco-workbench')

  const model = (instantiationService.invokeFunction((accessor) => accessor.get(INotificationService)) as NotificationService).model

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

  instantiationService.createInstance(DialogHandlerContribution)
}

export default function getServiceOverride (container?: HTMLElement): IEditorOverrideServices {
  onServicesInitialized(initialize)

  return {
    [IDialogService.toString()]: new SyncDescriptor(DialogService),
    [INotificationService.toString()]: new SyncDescriptor(NotificationService),
    ...getLayoutServiceOverride(container)
  }
}
