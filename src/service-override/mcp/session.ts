import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { SessionsMcpWorkspaceInstallTargetService } from 'vs/sessions/services/mcp/browser/mcpWorkspaceInstallTargetService'
import { IMcpWorkspaceInstallTargetService } from 'vs/workbench/services/mcp/common/mcpWorkspaceInstallTargetService.service'
import getCommonServiceOverride from './common'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride(),
    [IMcpWorkspaceInstallTargetService.toString()]: new SyncDescriptor(
      SessionsMcpWorkspaceInstallTargetService,
      [],
      true
    )
  }
}
