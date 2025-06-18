import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IMcpConfigPathsService } from 'vs/workbench/contrib/mcp/common/mcpConfigPathsService.service'
import {
  IMcpSamplingService,
  IMcpService,
  IMcpWorkbenchService
} from 'vs/workbench/contrib/mcp/common/mcpTypes.service'
import { IMcpRegistry } from 'vs/workbench/contrib/mcp/common/mcpRegistryTypes.service'
import { McpConfigPathsService } from 'vs/workbench/contrib/mcp/common/mcpConfigPathsService'
import { McpService } from 'vs/workbench/contrib/mcp/common/mcpService'
import { McpRegistry } from 'vs/workbench/contrib/mcp/common/mcpRegistry'
import 'vs/workbench/contrib/mcp/browser/mcp.contribution'
import { IAuthenticationMcpService } from 'vs/workbench/services/authentication/browser/authenticationMcpService.service'
import { AuthenticationMcpService } from 'vs/workbench/services/authentication/browser/authenticationMcpService'
import { IAuthenticationMcpAccessService } from 'vs/workbench/services/authentication/browser/authenticationMcpAccessService.service'
import { AuthenticationMcpAccessService } from 'vs/workbench/services/authentication/browser/authenticationMcpAccessService'
import { IAuthenticationMcpUsageService } from 'vs/workbench/services/authentication/browser/authenticationMcpUsageService.service'
import { AuthenticationMcpUsageService } from 'vs/workbench/services/authentication/browser/authenticationMcpUsageService'
import { McpWorkbenchService } from 'vs/workbench/contrib/mcp/browser/mcpWorkbenchService'
import {
  IMcpGalleryService,
  IMcpManagementService
} from 'vs/platform/mcp/common/mcpManagement.service'
import { McpGalleryService } from 'vs/platform/mcp/common/mcpGalleryService'
import { McpManagementService } from 'vs/platform/mcp/common/mcpManagementService'
import { McpSamplingService } from 'vs/workbench/contrib/mcp/common/mcpSamplingService'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IMcpConfigPathsService.toString()]: new SyncDescriptor(McpConfigPathsService, [], true),
    [IMcpService.toString()]: new SyncDescriptor(McpService, [], true),
    [IMcpRegistry.toString()]: new SyncDescriptor(McpRegistry, [], true),
    [IAuthenticationMcpService.toString()]: new SyncDescriptor(AuthenticationMcpService, [], true),
    [IAuthenticationMcpAccessService.toString()]: new SyncDescriptor(
      AuthenticationMcpAccessService,
      [],
      true
    ),
    [IAuthenticationMcpUsageService.toString()]: new SyncDescriptor(
      AuthenticationMcpUsageService,
      [],
      true
    ),
    [IMcpWorkbenchService.toString()]: new SyncDescriptor(McpWorkbenchService, [], true),
    [IMcpGalleryService.toString()]: new SyncDescriptor(McpGalleryService, [], true),
    [IMcpManagementService.toString()]: new SyncDescriptor(McpManagementService, [], true),
    [IMcpSamplingService.toString()]: new SyncDescriptor(McpSamplingService, [], true)
  }
}
