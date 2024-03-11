import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { EditSessionsLogService } from 'vs/workbench/contrib/editSessions/common/editSessionsLogService'
import { IEditSessionsLogService, IEditSessionsStorageService } from 'vs/workbench/contrib/editSessions/common/editSessions'
import { EditSessionsWorkbenchService } from 'vs/workbench/contrib/editSessions/browser/editSessionsStorageService'
import { IWorkspaceIdentityService, WorkspaceIdentityService } from 'vs/workbench/services/workspaces/common/workspaceIdentityService'
import 'vs/workbench/contrib/editSessions/browser/editSessions.contribution'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IEditSessionsLogService.toString()]: new SyncDescriptor(EditSessionsLogService, [], false),
    [IEditSessionsStorageService.toString()]: new SyncDescriptor(EditSessionsWorkbenchService, [], false),
    [IWorkspaceIdentityService.toString()]: new SyncDescriptor(WorkspaceIdentityService, [], false)
  }
}
