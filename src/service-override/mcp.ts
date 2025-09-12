import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import {
  IMcpElicitationService,
  IMcpSamplingService,
  IMcpService,
  IMcpWorkbenchService
} from 'vs/workbench/contrib/mcp/common/mcpTypes.service'
import { IMcpRegistry } from 'vs/workbench/contrib/mcp/common/mcpRegistryTypes.service'
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
  IAllowedMcpServersService,
  IMcpGalleryService
} from 'vs/platform/mcp/common/mcpManagement.service'
import { McpGalleryService } from 'vs/platform/mcp/common/mcpGalleryService'
import { McpSamplingService } from 'vs/workbench/contrib/mcp/common/mcpSamplingService'
import { IMcpResourceScannerService } from 'vs/platform/mcp/common/mcpResourceScannerService.service'
import { McpResourceScannerService } from 'vs/platform/mcp/common/mcpResourceScannerService'
import { McpElicitationService } from 'vs/workbench/contrib/mcp/browser/mcpElicitationService'
import { IWorkbenchMcpManagementService } from 'vs/workbench/services/mcp/common/mcpWorkbenchManagementService.service'
import { WorkbenchMcpManagementService } from 'vs/workbench/services/mcp/browser/mcpWorkbenchManagementService'
import { AllowedMcpServersService } from 'vs/platform/mcp/common/allowedMcpServersService'
import { IMcpGalleryManifestService } from 'vs/platform/mcp/common/mcpGalleryManifest.service'
import { WebMcpGalleryManifestService } from 'vs/workbench/services/mcp/browser/mcpGalleryManifestService'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IMcpResourceScannerService.toString()]: new SyncDescriptor(
      McpResourceScannerService,
      [],
      true
    ),
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
    [IMcpSamplingService.toString()]: new SyncDescriptor(McpSamplingService, [], true),
    [IMcpElicitationService.toString()]: new SyncDescriptor(McpElicitationService, [], true),
    [IWorkbenchMcpManagementService.toString()]: new SyncDescriptor(
      WorkbenchMcpManagementService,
      [],
      true
    ),
    [IAllowedMcpServersService.toString()]: new SyncDescriptor(AllowedMcpServersService, [], true),
    [IMcpGalleryManifestService.toString()]: new SyncDescriptor(
      WebMcpGalleryManifestService,
      [],
      true
    )
  }
}
