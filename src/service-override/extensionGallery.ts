import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { AllowedExtensionsService } from 'vs/platform/extensionManagement/common/allowedExtensionsService'
import { GlobalExtensionEnablementService } from 'vs/platform/extensionManagement/common/extensionEnablementService'
import { IExtensionGalleryManifestService } from 'vs/platform/extensionManagement/common/extensionGalleryManifest.service.js'
import {
  IAllowedExtensionsService,
  IExtensionGalleryService,
  IExtensionTipsService,
  IGlobalExtensionEnablementService
} from 'vs/platform/extensionManagement/common/extensionManagement.service'
import { IExtensionsProfileScannerService } from 'vs/platform/extensionManagement/common/extensionsProfileScannerService.service'
import { IExtensionsScannerService } from 'vs/platform/extensionManagement/common/extensionsScannerService.service'
import { ExtensionTipsService } from 'vs/platform/extensionManagement/common/extensionTipsService'
import { IExtensionRecommendationNotificationService } from 'vs/platform/extensionRecommendations/common/extensionRecommendations.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { ILabelService } from 'vs/platform/label/common/label.service'
import { getLocale } from 'vs/platform/languagePacks/common/languagePacks'
import { IgnoredExtensionsManagementService } from 'vs/platform/userDataSync/common/ignoredExtensions'
import { IIgnoredExtensionsManagementService } from 'vs/platform/userDataSync/common/ignoredExtensions.service'
import { ExtensionRecommendationNotificationService } from 'vs/workbench/contrib/extensions/browser/extensionRecommendationNotificationService'
import { ExtensionRecommendationsService } from 'vs/workbench/contrib/extensions/browser/extensionRecommendationsService'
import { ExtensionsWorkbenchService } from 'vs/workbench/contrib/extensions/browser/extensionsWorkbenchService'
import type { IExtension as IContribExtension } from 'vs/workbench/contrib/extensions/common/extensions'
import { IExtensionsWorkbenchService } from 'vs/workbench/contrib/extensions/common/extensions.service'
import { ExtensionEnablementService } from 'vs/workbench/services/extensionManagement/browser/extensionEnablementService'
import { WebExtensionGalleryManifestService } from 'vs/workbench/services/extensionManagement/browser/extensionGalleryManifestService'
import { ExtensionsProfileScannerService } from 'vs/workbench/services/extensionManagement/browser/extensionsProfileScannerService'
import { IExtensionFeaturesManagementService } from 'vs/workbench/services/extensionManagement/common/extensionFeatures.service'
import { ExtensionFeaturesManagementService } from 'vs/workbench/services/extensionManagement/common/extensionFeaturesManagemetService'
import { WorkbenchExtensionGalleryService } from 'vs/workbench/services/extensionManagement/common/extensionGalleryService'
import {
  IExtensionManagementServerService,
  IWorkbenchExtensionEnablementService,
  IWorkbenchExtensionManagementService
} from 'vs/workbench/services/extensionManagement/common/extensionManagement.service'
import { ExtensionManagementServerService } from 'vs/workbench/services/extensionManagement/common/extensionManagementServerService'
import { ExtensionManagementService } from 'vs/workbench/services/extensionManagement/common/extensionManagementService'
import { ExtensionIgnoredRecommendationsService } from 'vs/workbench/services/extensionRecommendations/common/extensionIgnoredRecommendationsService'
import {
  IExtensionIgnoredRecommendationsService,
  IExtensionRecommendationsService
} from 'vs/workbench/services/extensionRecommendations/common/extensionRecommendations.service'
import { WorkspaceExtensionsConfigService } from 'vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig'
import { IWorkspaceExtensionsConfigService } from 'vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig.service'
import { ExtensionsScannerService } from 'vs/workbench/services/extensions/browser/extensionsScannerService'
import { ExtensionUrlHandler } from 'vs/workbench/services/extensions/browser/extensionUrlHandler'
import { IExtensionUrlHandler } from 'vs/workbench/services/extensions/browser/extensionUrlHandler.service'
import { ExtensionManifestPropertiesService } from 'vs/workbench/services/extensions/common/extensionManifestPropertiesService'
import { IExtensionManifestPropertiesService } from 'vs/workbench/services/extensions/common/extensionManifestPropertiesService.service'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService.service'
import { RemoteUserDataProfilesService } from 'vs/workbench/services/userDataProfile/common/remoteUserDataProfiles'
import { IRemoteUserDataProfilesService } from 'vs/workbench/services/userDataProfile/common/remoteUserDataProfiles.service'
import { registerAssets } from '../assets.js'
import { isLocaleAvailable } from '../l10n.js'
import { unsupported } from '../tools'
import 'vs/workbench/contrib/extensions/browser/extensions.contribution'
import 'vs/workbench/contrib/extensions/browser/extensions.web.contribution'
import type { IExtensionGalleryManifest } from 'vs/platform/extensionManagement/common/extensionGalleryManifest.js'
import { IProductService } from 'vs/platform/product/common/productService.service.js'

// plugin-import-meta-asset only allows relative paths
registerAssets({
  'vs/workbench/contrib/extensions/browser/media/theme-icon.png': new URL(
    '../../vscode/src/vs/workbench/contrib/extensions/browser/media/theme-icon.png',
    import.meta.url
  ).href,
  'vs/workbench/contrib/extensions/browser/media/language-icon.svg': new URL(
    '../../vscode/src/vs/workbench/contrib/extensions/browser/media/theme-icon.png',
    import.meta.url
  ).href
})

class CustomExtensionGalleryManifestService extends WebExtensionGalleryManifestService {
  constructor(
    private transform: (
      manifest: IExtensionGalleryManifest | null
    ) => IExtensionGalleryManifest | null,
    @IProductService productService: IProductService,
    @IRemoteAgentService remoteAgentService: IRemoteAgentService
  ) {
    super(productService, remoteAgentService)
  }

  override async getExtensionGalleryManifest(): Promise<IExtensionGalleryManifest | null> {
    return this.transform(await super.getExtensionGalleryManifest())!
  }
}

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
  webOnly?: boolean

  transformExtensionGalleryManifest?: (
    manifest: IExtensionGalleryManifest | null
  ) => IExtensionGalleryManifest | null
}

export default function getServiceOverride({
  webOnly = false,
  transformExtensionGalleryManifest = (manifest) => manifest
}: ExtensionGalleryOptions = {}): IEditorOverrideServices {
  return {
    [IExtensionGalleryService.toString()]: new SyncDescriptor(
      WorkbenchExtensionGalleryService,
      [],
      true
    ),
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
      [webOnly],
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
    ),
    [IAllowedExtensionsService.toString()]: new SyncDescriptor(AllowedExtensionsService, [], true),
    [IExtensionGalleryManifestService.toString()]: new SyncDescriptor(
      CustomExtensionGalleryManifestService,
      [transformExtensionGalleryManifest],
      true
    )
  }
}

export type { IExtensionGalleryManifest }
