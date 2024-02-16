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
import { IBuiltinExtensionsScannerService, IExtension } from 'vs/platform/extensions/common/extensions'
import { ExtensionIgnoredRecommendationsService } from 'vs/workbench/services/extensionRecommendations/common/extensionIgnoredRecommendationsService'
import { IWorkspaceExtensionsConfigService, WorkspaceExtensionsConfigService } from 'vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig'
import { ExtensionRecommendationNotificationService } from 'vs/workbench/contrib/extensions/browser/extensionRecommendationNotificationService'
import { ExtensionTipsService } from 'vs/platform/extensionManagement/common/extensionTipsService'
import { ExtensionManagementService } from 'vs/workbench/services/extensionManagement/common/extensionManagementService'
import { IRemoteUserDataProfilesService, RemoteUserDataProfilesService } from 'vs/workbench/services/userDataProfile/common/remoteUserDataProfiles'
import { ExtensionEnablementService } from 'vs/workbench/services/extensionManagement/browser/extensionEnablementService'
import 'vs/workbench/contrib/extensions/browser/extensions.contribution'
import 'vs/workbench/contrib/extensions/browser/extensions.web.contribution'
import { ExtensionUrlHandler, IExtensionUrlHandler } from 'vs/workbench/services/extensions/browser/extensionUrlHandler'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { ILabelService } from 'vs/platform/label/common/label'
import { registerAssets } from '../assets'
import { getExtensionManifests } from '../extensions'

// plugin-import-meta-asset only allows relative paths
registerAssets({
  'vs/workbench/services/extensionManagement/common/media/defaultIcon.png': new URL('../../vscode/src/vs/workbench/services/extensionManagement/common/media/defaultIcon.png', import.meta.url).toString()
})

class ExtensionManagementServerServiceOverride extends ExtensionManagementServerService {
  constructor (
    private isWebOnly: boolean,
    @IRemoteAgentService readonly remoteAgentService: IRemoteAgentService,
    @ILabelService readonly labelService: ILabelService,
    @IInstantiationService readonly instantiationService: IInstantiationService
  ) {
    super(remoteAgentService, labelService, instantiationService)

    if (this.isWebOnly) {
      /**
      * If `isWebOnly` is set to true, we explicitly set the remote extension management server to `null`, even if
      * we're connected to a remote server.
      */
      // Cannot override read-only property, but this is the only way we can override it to be null,
      // overriding the field doesn't work and setting a getter is not allowed.
      // @ts-ignore
      this.remoteExtensionManagementServer = null
    }
  }
}

class CustomBuiltinExtensionsScannerService implements IBuiltinExtensionsScannerService {
  _serviceBrand: undefined

  async scanBuiltinExtensions (): Promise<IExtension[]> {
    return getExtensionManifests()
  }
}

export interface ExtensionGalleryOptions {
  /**
   * Whether we should only allow for web extensions to be installed, this is generally
   * true if there is no server part.
   */
  webOnly: boolean
}

export default function getServiceOverride (options: ExtensionGalleryOptions = { webOnly: false }): IEditorOverrideServices {
  return {
    [IExtensionGalleryService.toString()]: new SyncDescriptor(ExtensionGalleryService, [], true),
    [IGlobalExtensionEnablementService.toString()]: new SyncDescriptor(GlobalExtensionEnablementService, [], true),
    [IExtensionsWorkbenchService.toString()]: new SyncDescriptor(ExtensionsWorkbenchService, [], true),
    [IExtensionManagementServerService.toString()]: new SyncDescriptor(ExtensionManagementServerServiceOverride, [options.webOnly], true),
    [IExtensionRecommendationsService.toString()]: new SyncDescriptor(ExtensionRecommendationsService, [], true),
    [IExtensionRecommendationNotificationService.toString()]: new SyncDescriptor(ExtensionRecommendationNotificationService, [], true),
    [IWebExtensionsScannerService.toString()]: new SyncDescriptor(WebExtensionsScannerService, [], true),
    [IExtensionIgnoredRecommendationsService.toString()]: new SyncDescriptor(ExtensionIgnoredRecommendationsService, [], true),
    [IIgnoredExtensionsManagementService.toString()]: new SyncDescriptor(IgnoredExtensionsManagementService, [], true),
    [IExtensionManifestPropertiesService.toString()]: new SyncDescriptor(ExtensionManifestPropertiesService, [], true),
    [IExtensionManagementService.toString()]: new SyncDescriptor(ExtensionManagementService, [], true),
    [IBuiltinExtensionsScannerService.toString()]: new SyncDescriptor(CustomBuiltinExtensionsScannerService, [], true),
    [IWorkspaceExtensionsConfigService.toString()]: new SyncDescriptor(WorkspaceExtensionsConfigService, [], true),
    [IExtensionTipsService.toString()]: new SyncDescriptor(ExtensionTipsService, [], true),
    [IRemoteUserDataProfilesService.toString()]: new SyncDescriptor(RemoteUserDataProfilesService, [], true),
    [IWorkbenchExtensionEnablementService.toString()]: new SyncDescriptor(ExtensionEnablementService, [], true),
    [IExtensionUrlHandler.toString()]: new SyncDescriptor(ExtensionUrlHandler, [], true)
  }
}
