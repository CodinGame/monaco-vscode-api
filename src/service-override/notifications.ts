import '../polyfill'
import '../vscode-services/missing-services'
import { NotificationsToasts } from 'vs/workbench/browser/parts/notifications/notificationsToasts'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { NotificationService } from 'vs/workbench/services/notification/common/notificationService'
import { INotificationService } from 'vs/platform/notification/common/notification'
import * as dom from 'vs/base/browser/dom'
import { registerNotificationCommands } from 'vs/workbench/browser/parts/notifications/notificationsCommands'
import { DialogHandlerContribution } from 'vs/workbench/browser/parts/dialogs/dialog.web.contribution'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { NotificationsCenter } from 'vs/workbench/browser/parts/notifications/notificationsCenter'
import { NotificationsAlerts } from 'vs/workbench/browser/parts/notifications/notificationsAlerts'
import { NotificationsTelemetry } from 'vs/workbench/browser/parts/notifications/notificationsTelemetry'
import { ILayoutService } from 'vs/platform/layout/browser/layoutService'
import getLayoutServiceOverride from './layout'
import { onServicesInitialized } from './tools'

function initialize (instantiationService: IInstantiationService) {
  const container = instantiationService.invokeFunction((accessor) => accessor.get(ILayoutService)).container

  const model = (instantiationService.invokeFunction((accessor) => accessor.get(INotificationService)) as NotificationService).model

  // Instantiate Notification components
  const notificationsCenter = instantiationService.createInstance(NotificationsCenter, container, model)
  const notificationsToasts = instantiationService.createInstance(NotificationsToasts, container, model)
  instantiationService.createInstance(NotificationsAlerts, model)
  instantiationService.createInstance(NotificationsTelemetry)

  // Register Commands
  registerNotificationCommands(notificationsCenter, notificationsToasts, model)

  notificationsToasts.layout(dom.getClientArea(container))

  instantiationService.createInstance(DialogHandlerContribution)
}

export default function getServiceOverride (container?: HTMLElement): IEditorOverrideServices {
  onServicesInitialized(initialize)

  return {
    [INotificationService.toString()]: new SyncDescriptor(NotificationService),
    ...getLayoutServiceOverride(container)
  }
}
