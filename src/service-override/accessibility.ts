import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { AccessibleViewService, IAccessibleViewService } from 'vs/workbench/contrib/accessibility/browser/accessibleView'
import 'vs/workbench/contrib/accessibility/browser/accessibility.contribution'
import 'vs/workbench/contrib/codeEditor/browser/accessibility/accessibility'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IAccessibleViewService.toString()]: new SyncDescriptor(AccessibleViewService, [], true)
  }
}
