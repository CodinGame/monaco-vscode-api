import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import {
  IWorkspaceTrustEnablementService,
  IWorkspaceTrustManagementService,
  IWorkspaceTrustRequestService
} from 'vs/platform/workspace/common/workspaceTrust.service'
import {
  WorkspaceTrustEnablementService,
  WorkspaceTrustManagementService,
  WorkspaceTrustRequestService
} from 'vs/workbench/services/workspaces/common/workspaceTrust'
import 'vs/workbench/contrib/workspace/browser/workspace.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IWorkspaceTrustEnablementService.toString()]: new SyncDescriptor(
      WorkspaceTrustEnablementService
    ),
    [IWorkspaceTrustManagementService.toString()]: new SyncDescriptor(
      WorkspaceTrustManagementService
    ),
    [IWorkspaceTrustRequestService.toString()]: new SyncDescriptor(WorkspaceTrustRequestService)
  }
}
