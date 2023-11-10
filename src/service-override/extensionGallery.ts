import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IExtensionGalleryService, IExtensionManagementService, IExtensionTipsService, IGlobalExtensionEnablementService } from 'vs/platform/extensionManagement/common/extensionManagement'
import { ExtensionGalleryService } from 'vs/platform/extensionManagement/common/extensionGalleryService'
import { GlobalExtensionEnablementService } from 'vs/platform/extensionManagement/common/extensionEnablementService'
import { IExtensionsWorkbenchService } from 'vs/workbench/contrib/extensions/common/extensions'
import { ExtensionsWorkbenchService } from 'vs/workbench/contrib/extensions/browser/extensionsWorkbenchService'
import { IExtensionManagementServerService, IWebExtensionsScannerService, IWorkbenchExtensionEnablementService } from 'vs/workbench/services/extensionManagement/common/extensionManagement'
import { ExtensionManagementServerService } from 'vs/workbench/services/extensionManagement/common/extensionManagementServerService'
import { IExtensionIgnoredRecommendationsService, IExtensionRecommendationsService } from 'vs/workbench/services/extensionRecommendations/common/extensionRecommendations'
import { ExtensionRecommendationsService } from 'vs/workbench/contrib/extensions/browser/extensionRecommendationsService'
import { WebExtensionsScannerService } from 'vs/workbench/services/extensionManagement/browser/webExtensionsScannerService'
import { IExtensionRecommendationNotificationService } from 'vs/platform/extensionRecommendations/common/extensionRecommendations'
import { IIgnoredExtensionsManagementService, IgnoredExtensionsManagementService } from 'vs/platform/userDataSync/common/ignoredExtensions'
import { ExtensionManifestPropertiesService, IExtensionManifestPropertiesService } from 'vs/workbench/services/extensions/common/extensionManifestPropertiesService'
import { IBuiltinExtensionsScannerService } from 'vs/platform/extensions/common/extensions'
import { BuiltinExtensionsScannerService } from 'vs/workbench/services/extensionManagement/browser/builtinExtensionsScannerService'
import { ExtensionIgnoredRecommendationsService } from 'vs/workbench/services/extensionRecommendations/common/extensionIgnoredRecommendationsService'
import { IWorkspaceExtensionsConfigService, WorkspaceExtensionsConfigService } from 'vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig'
import { IRemoteExtensionsScannerService } from 'vs/platform/remote/common/remoteExtensionsScanner'
import { RemoteExtensionsScannerService } from 'vs/workbench/services/remote/common/remoteExtensionsScanner'
import { ExtensionRecommendationNotificationService } from 'vs/workbench/contrib/extensions/browser/extensionRecommendationNotificationService'
import { ExtensionTipsService } from 'vs/platform/extensionManagement/common/extensionTipsService'
import { ExtensionManagementService } from 'vs/workbench/services/extensionManagement/common/extensionManagementService'
import 'vs/workbench/contrib/extensions/browser/extensions.contribution'
import 'vs/workbench/contrib/extensions/browser/extensions.web.contribution'
import 'vs/workbench/contrib/logs/common/logs.contribution'
import { IRemoteUserDataProfilesService, RemoteUserDataProfilesService } from 'vs/workbench/services/userDataProfile/common/remoteUserDataProfiles'
import { ExtensionEnablementService } from 'vs/workbench/services/extensionManagement/browser/extensionEnablementService'
import 'vs/workbench/services/extensionManagement/browser/extensionBisect'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IExtensionGalleryService.toString()]: new SyncDescriptor(ExtensionGalleryService, [], true),
    [IGlobalExtensionEnablementService.toString()]: new SyncDescriptor(GlobalExtensionEnablementService, [], true),
    [IExtensionsWorkbenchService.toString()]: new SyncDescriptor(ExtensionsWorkbenchService, [], true),
    [IExtensionManagementServerService.toString()]: new SyncDescriptor(ExtensionManagementServerService, [], true),
    [IExtensionRecommendationsService.toString()]: new SyncDescriptor(ExtensionRecommendationsService, [], true),
    [IExtensionRecommendationNotificationService.toString()]: new SyncDescriptor(ExtensionRecommendationNotificationService, [], true),
    [IWebExtensionsScannerService.toString()]: new SyncDescriptor(WebExtensionsScannerService, [], true),
    [IExtensionIgnoredRecommendationsService.toString()]: new SyncDescriptor(ExtensionIgnoredRecommendationsService, [], true),
    [IIgnoredExtensionsManagementService.toString()]: new SyncDescriptor(IgnoredExtensionsManagementService, [], true),
    [IExtensionManifestPropertiesService.toString()]: new SyncDescriptor(ExtensionManifestPropertiesService, [], true),
    [IExtensionManagementService.toString()]: new SyncDescriptor(ExtensionManagementService, [], true),
    [IBuiltinExtensionsScannerService.toString()]: new SyncDescriptor(BuiltinExtensionsScannerService, [], true),
    [IWorkspaceExtensionsConfigService.toString()]: new SyncDescriptor(WorkspaceExtensionsConfigService, [], true),
    [IRemoteExtensionsScannerService.toString()]: new SyncDescriptor(RemoteExtensionsScannerService, [], true),
    [IExtensionTipsService.toString()]: new SyncDescriptor(ExtensionTipsService, [], true),
    [IRemoteUserDataProfilesService.toString()]: new SyncDescriptor(RemoteUserDataProfilesService, [], true),
    [IWorkbenchExtensionEnablementService.toString()]: new SyncDescriptor(ExtensionEnablementService, [], true)
  }
}
