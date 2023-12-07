import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { AccessibleViewService, IAccessibleViewService } from 'vs/workbench/contrib/accessibility/browser/accessibleView'
import { IAccessibleNotificationService } from 'vs/platform/accessibility/common/accessibility'
import { AccessibleNotificationService } from 'vs/workbench/contrib/accessibility/browser/accessibleNotificationService'
import 'vs/workbench/contrib/accessibility/browser/accessibility.contribution'
import 'vs/workbench/contrib/codeEditor/browser/accessibility/accessibility'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IAccessibleViewService.toString()]: new SyncDescriptor(AccessibleViewService, [], true),
    [IAccessibleNotificationService.toString()]: new SyncDescriptor(AccessibleNotificationService, [], true)
  }
}
