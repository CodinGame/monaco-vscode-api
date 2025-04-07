import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IMcpConfigPathsService } from 'vs/workbench/contrib/mcp/common/mcpConfigPathsService.service'
import { IMcpService } from 'vs/workbench/contrib/mcp/common/mcpTypes.service'
import { IMcpRegistry } from 'vs/workbench/contrib/mcp/common/mcpRegistryTypes.service'
import { McpConfigPathsService } from 'vs/workbench/contrib/mcp/common/mcpConfigPathsService'
import { McpService } from 'vs/workbench/contrib/mcp/common/mcpService'
import { McpRegistry } from 'vs/workbench/contrib/mcp/common/mcpRegistry'
import 'vs/workbench/contrib/mcp/browser/mcp.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IMcpConfigPathsService.toString()]: new SyncDescriptor(McpConfigPathsService, [], true),
    [IMcpService.toString()]: new SyncDescriptor(McpService, [], true),
    [IMcpRegistry.toString()]: new SyncDescriptor(McpRegistry, [], true)
  }
}
