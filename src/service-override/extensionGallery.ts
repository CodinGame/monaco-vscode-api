import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import {
  IExtensionGalleryService,
  IExtensionTipsService,
  IGlobalExtensionEnablementService
} from 'vs/platform/extensionManagement/common/extensionManagement.service'
import { ExtensionGalleryService } from 'vs/platform/extensionManagement/common/extensionGalleryService'
import { GlobalExtensionEnablementService } from 'vs/platform/extensionManagement/common/extensionEnablementService'
import type { IExtension as IContribExtension } from 'vs/workbench/contrib/extensions/common/extensions'
import { IExtensionsWorkbenchService } from 'vs/workbench/contrib/extensions/common/extensions.service'
import { getLocale } from 'vs/platform/languagePacks/common/languagePacks'
import { ExtensionsWorkbenchService } from 'vs/workbench/contrib/extensions/browser/extensionsWorkbenchService'
import {
  IExtensionManagementServerService,
  IWebExtensionsScannerService,
  IWorkbenchExtensionEnablementService,
  IWorkbenchExtensionManagementService
} from 'vs/workbench/services/extensionManagement/common/extensionManagement.service'
import { ExtensionManagementServerService } from 'vs/workbench/services/extensionManagement/common/extensionManagementServerService'
import {
  IExtensionIgnoredRecommendationsService,
  IExtensionRecommendationsService
} from 'vs/workbench/services/extensionRecommendations/common/extensionRecommendations.service'
import { ExtensionRecommendationsService } from 'vs/workbench/contrib/extensions/browser/extensionRecommendationsService'
import { WebExtensionsScannerService } from 'vs/workbench/services/extensionManagement/browser/webExtensionsScannerService'
import { IExtensionRecommendationNotificationService } from 'vs/platform/extensionRecommendations/common/extensionRecommendations.service'
import { IgnoredExtensionsManagementService } from 'vs/platform/userDataSync/common/ignoredExtensions'
import { IIgnoredExtensionsManagementService } from 'vs/platform/userDataSync/common/ignoredExtensions.service'
import { ExtensionManifestPropertiesService } from 'vs/workbench/services/extensions/common/extensionManifestPropertiesService'
import { IExtensionManifestPropertiesService } from 'vs/workbench/services/extensions/common/extensionManifestPropertiesService.service'
import type { IExtension } from 'vs/platform/extensions/common/extensions'
import { IBuiltinExtensionsScannerService } from 'vs/platform/extensions/common/extensions.service'
import { ExtensionIgnoredRecommendationsService } from 'vs/workbench/services/extensionRecommendations/common/extensionIgnoredRecommendationsService'
import { WorkspaceExtensionsConfigService } from 'vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig'
import { IWorkspaceExtensionsConfigService } from 'vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig.service'
import { ExtensionRecommendationNotificationService } from 'vs/workbench/contrib/extensions/browser/extensionRecommendationNotificationService'
import { ExtensionTipsService } from 'vs/platform/extensionManagement/common/extensionTipsService'
import { ExtensionManagementService } from 'vs/workbench/services/extensionManagement/common/extensionManagementService'
import { RemoteUserDataProfilesService } from 'vs/workbench/services/userDataProfile/common/remoteUserDataProfiles'
import { IRemoteUserDataProfilesService } from 'vs/workbench/services/userDataProfile/common/remoteUserDataProfiles.service'
import { ExtensionEnablementService } from 'vs/workbench/services/extensionManagement/browser/extensionEnablementService'
import { ExtensionUrlHandler } from 'vs/workbench/services/extensions/browser/extensionUrlHandler'
import { IExtensionUrlHandler } from 'vs/workbench/services/extensions/browser/extensionUrlHandler.service'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService.service'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { IExtensionsScannerService } from 'vs/platform/extensionManagement/common/extensionsScannerService.service'
import { ExtensionsScannerService } from 'vs/workbench/services/extensions/browser/extensionsScannerService'
import { ExtensionsProfileScannerService } from 'vs/workbench/services/extensionManagement/browser/extensionsProfileScannerService'
import { IExtensionsProfileScannerService } from 'vs/platform/extensionManagement/common/extensionsProfileScannerService.service'
import { ILabelService } from 'vs/platform/label/common/label.service'
import { IExtensionFeaturesManagementService } from 'vs/workbench/services/extensionManagement/common/extensionFeatures.service'
import { ExtensionFeaturesManagementService } from 'vs/workbench/services/extensionManagement/common/extensionFeaturesManagemetService'
import { registerAssets } from '../assets'
import { getExtensionManifests } from '../extensions'
import { isLocaleAvailable } from '../l10n'
import 'vs/workbench/contrib/extensions/browser/extensions.contribution'
import 'vs/workbench/contrib/extensions/browser/extensions.web.contribution'
import { unsupported } from '../tools'

// plugin-import-meta-asset only allows relative paths
registerAssets({
  'vs/workbench/services/extensionManagement/common/media/defaultIcon.png': new URL(
    '../../vscode/src/vs/workbench/services/extensionManagement/common/media/defaultIcon.png',
    import.meta.url
  ).toString(),
  'vs/workbench/contrib/extensions/browser/media/theme-icon.png': new URL(
    '../../vscode/src/vs/workbench/contrib/extensions/browser/media/theme-icon.png',
    import.meta.url
  ).href,
  'vs/workbench/contrib/extensions/browser/media/language-icon.svg': new URL(
    '../../vscode/src/vs/workbench/contrib/extensions/browser/media/theme-icon.png',
    import.meta.url
  ).href
})

class EmptyRemoteAgentService implements IRemoteAgentService {
  _serviceBrand: undefined
  endConnection = unsupported
  getConnection = () => null
  getEnvironment = async () => null
  getRawEnvironment = async () => null
  getExtensionHostExitInfo = async () => null
  getRoundTripTime = async () => undefined
  whenExtensionsReady = async () => undefined
  scanExtensions = async () => []
  scanSingleExtension = async () => null
  getDiagnosticInfo = async () => undefined
  updateTelemetryLevel = async () => undefined
  logTelemetry = async () => undefined
  flushTelemetry = async () => undefined
}

class ExtensionManagementServerServiceOverride extends ExtensionManagementServerService {
  constructor(
    isWebOnly: boolean,
    @IRemoteAgentService readonly remoteAgentService: IRemoteAgentService,
    @ILabelService readonly labelService: ILabelService,
    @IInstantiationService readonly instantiationService: IInstantiationService
  ) {
    super(
      isWebOnly ? new EmptyRemoteAgentService() : remoteAgentService,
      labelService,
      instantiationService
    )
  }
}

class CustomBuiltinExtensionsScannerService implements IBuiltinExtensionsScannerService {
  _serviceBrand: undefined

  async scanBuiltinExtensions(): Promise<IExtension[]> {
    return getExtensionManifests()
  }
}

class ExtensionsWorkbenchServiceOverride extends ExtensionsWorkbenchService {
  override canSetLanguage(extension: IContribExtension): boolean {
    if (super.canSetLanguage(extension)) {
      const locale = getLocale(extension.gallery!)!
      return isLocaleAvailable(locale)
    }
    return false
  }
}

export interface ExtensionGalleryOptions {
  /**
   * Whether we should only allow for web extensions to be installed, this is generally
   * true if there is no server part.
   */
  webOnly: boolean
}

export default function getServiceOverride(
  options: ExtensionGalleryOptions = { webOnly: false }
): IEditorOverrideServices {
  return {
    [IExtensionGalleryService.toString()]: new SyncDescriptor(ExtensionGalleryService, [], true),
    [IGlobalExtensionEnablementService.toString()]: new SyncDescriptor(
      GlobalExtensionEnablementService,
      [],
      true
    ),
    [IExtensionsWorkbenchService.toString()]: new SyncDescriptor(
      ExtensionsWorkbenchServiceOverride,
      [],
      true
    ),
    [IExtensionManagementServerService.toString()]: new SyncDescriptor(
      ExtensionManagementServerServiceOverride,
      [options.webOnly],
      true
    ),
    [IExtensionRecommendationsService.toString()]: new SyncDescriptor(
      ExtensionRecommendationsService,
      [],
      true
    ),
    [IExtensionRecommendationNotificationService.toString()]: new SyncDescriptor(
      ExtensionRecommendationNotificationService,
      [],
      true
    ),
    [IWebExtensionsScannerService.toString()]: new SyncDescriptor(
      WebExtensionsScannerService,
      [],
      true
    ),
    [IExtensionIgnoredRecommendationsService.toString()]: new SyncDescriptor(
      ExtensionIgnoredRecommendationsService,
      [],
      true
    ),
    [IIgnoredExtensionsManagementService.toString()]: new SyncDescriptor(
      IgnoredExtensionsManagementService,
      [],
      true
    ),
    [IExtensionManifestPropertiesService.toString()]: new SyncDescriptor(
      ExtensionManifestPropertiesService,
      [],
      true
    ),
    [IWorkbenchExtensionManagementService.toString()]: new SyncDescriptor(
      ExtensionManagementService,
      [],
      true
    ),
    [IBuiltinExtensionsScannerService.toString()]: new SyncDescriptor(
      CustomBuiltinExtensionsScannerService,
      [],
      true
    ),
    [IWorkspaceExtensionsConfigService.toString()]: new SyncDescriptor(
      WorkspaceExtensionsConfigService,
      [],
      true
    ),
    [IExtensionTipsService.toString()]: new SyncDescriptor(ExtensionTipsService, [], true),
    [IRemoteUserDataProfilesService.toString()]: new SyncDescriptor(
      RemoteUserDataProfilesService,
      [],
      true
    ),
    [IWorkbenchExtensionEnablementService.toString()]: new SyncDescriptor(
      ExtensionEnablementService,
      [],
      true
    ),
    [IExtensionUrlHandler.toString()]: new SyncDescriptor(ExtensionUrlHandler, [], true),
    [IExtensionFeaturesManagementService.toString()]: new SyncDescriptor(
      ExtensionFeaturesManagementService,
      [],
      true
    ),
    [IExtensionsScannerService.toString()]: new SyncDescriptor(ExtensionsScannerService, [], true),
    [IExtensionsProfileScannerService.toString()]: new SyncDescriptor(
      ExtensionsProfileScannerService,
      [],
      true
    )
  }
}
