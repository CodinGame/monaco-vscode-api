import { NotificationsToasts } from 'vs/workbench/browser/parts/notifications/notificationsToasts'
import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { NotificationService } from 'vs/workbench/services/notification/common/notificationService'
import { INotificationService } from 'vs/platform/notification/common/notification.service'
import * as dom from 'vs/base/browser/dom'
import { registerNotificationCommands } from 'vs/workbench/browser/parts/notifications/notificationsCommands'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { NotificationsCenter } from 'vs/workbench/browser/parts/notifications/notificationsCenter'
import { NotificationsAlerts } from 'vs/workbench/browser/parts/notifications/notificationsAlerts'
import { ILayoutService } from 'vs/platform/layout/browser/layoutService.service'
import { NotificationsStatus } from 'vs/workbench/browser/parts/notifications/notificationsStatus'
import { onRenderWorkbench } from '../lifecycle'

onRenderWorkbench(async (accessor) => {
  const container = accessor.get(ILayoutService).mainContainer
  const model = (accessor.get(INotificationService) as NotificationService).model
  const instantiationService = accessor.get(IInstantiationService)

  // Instantiate Notification components
  setTimeout(() => {
    const notificationsCenter = instantiationService.createInstance(
      NotificationsCenter,
      container,
      model
    )
    const notificationsToasts = instantiationService.createInstance(
      NotificationsToasts,
      container,
      model
    )
    instantiationService.createInstance(NotificationsAlerts, model)
    const notificationsStatus = instantiationService.createInstance(NotificationsStatus, model)

    // Visibility
    notificationsCenter.onDidChangeVisibility(() => {
      notificationsStatus.update(notificationsCenter.isVisible, notificationsToasts.isVisible)
      notificationsToasts.update(notificationsCenter.isVisible)
    })

    notificationsToasts.onDidChangeVisibility(() => {
      notificationsStatus.update(notificationsCenter.isVisible, notificationsToasts.isVisible)
    })
    // Register Commands
    registerNotificationCommands(notificationsCenter, notificationsToasts, model)

    notificationsToasts.layout(dom.getClientArea(container))
  })
})

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [INotificationService.toString()]: new SyncDescriptor(NotificationService, [], true)
  }
}
