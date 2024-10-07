import { IFileService } from 'vs/platform/files/common/files.service'
import { ILifecycleService } from 'vs/workbench/services/lifecycle/common/lifecycle.service'
import {
  ExtensionHostStartup,
  IExtensionHost
} from 'vs/workbench/services/extensions/common/extensions'
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions.service'
import { ILogService } from 'vs/platform/log/common/log.service'
import {
  ExtensionIdentifier,
  IExtension,
  IExtensionDescription
} from 'vs/platform/extensions/common/extensions'
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace.service'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { INotificationService } from 'vs/platform/notification/common/notification.service'
import { DeltaExtensionsQueueItem } from 'vs/workbench/services/extensions/common/abstractExtensionService'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry.service'
import { IDialogService } from 'vs/platform/dialogs/common/dialogs.service'
import { IRemoteAuthorityResolverService } from 'vs/platform/remote/common/remoteAuthorityResolver.service'
import { IRemoteExtensionsScannerService } from 'vs/platform/remote/common/remoteExtensionsScanner.service'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService.service'
import {
  IWebExtensionsScannerService,
  IWorkbenchExtensionEnablementService,
  IWorkbenchExtensionManagementService
} from 'vs/workbench/services/extensionManagement/common/extensionManagement.service'
import { ExtensionManifestPropertiesService } from 'vs/workbench/services/extensions/common/extensionManifestPropertiesService'
import { IExtensionManifestPropertiesService } from 'vs/workbench/services/extensions/common/extensionManifestPropertiesService.service'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration.service'
import { IProductService } from 'vs/platform/product/common/productService.service'
import { IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService.service'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IUserDataInitializationService } from 'vs/workbench/services/userData/browser/userDataInit.service'
import { ExtensionsProposedApi } from 'vs/workbench/services/extensions/common/extensionsProposedApi'
import {
  BrowserExtensionHostFactory,
  BrowserExtensionHostKindPicker,
  ExtensionService
} from 'vs/workbench/services/extensions/browser/extensionService'
import {
  ExtensionHostKind,
  ExtensionRunningPreference
} from 'vs/workbench/services/extensions/common/extensionHostKind'
import { ExtensionRunningLocation } from 'vs/workbench/services/extensions/common/extensionRunningLocation'
import { ExtensionRunningLocationTracker } from 'vs/workbench/services/extensions/common/extensionRunningLocationTracker'
import { URI } from 'vs/base/common/uri'
import { WebWorkerExtensionHost } from 'vs/workbench/services/extensions/browser/webWorkerExtensionHost'
import { ExtensionKind } from 'vs/platform/environment/common/environment'
import { IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile.service'
import { IWorkspaceTrustManagementService } from 'vs/platform/workspace/common/workspaceTrust.service'
import { IRemoteExplorerService } from 'vs/workbench/services/remote/common/remoteExplorerService.service'
import { ExtensionDescriptionRegistrySnapshot } from 'vs/workbench/services/extensions/common/extensionDescriptionRegistry'
import { ExtensionResourceLoaderService } from 'vs/platform/extensionResourceLoader/browser/extensionResourceLoaderService'
import { IExtensionResourceLoaderService } from 'vs/platform/extensionResourceLoader/common/extensionResourceLoader.service'
import { ExtensionBisectService } from 'vs/workbench/services/extensionManagement/browser/extensionBisect'
import { IExtensionBisectService } from 'vs/workbench/services/extensionManagement/browser/extensionBisect.service'
import { changeUrlDomain } from './tools/url'
import { CustomSchemas } from './files'
import type { LocalExtensionHost } from '../localExtensionHost'
import { registerAssets } from '../assets'
import { getForcedExtensionHostKind } from '../extensions'
import 'vs/workbench/api/browser/extensionHost.contribution'

export interface WorkerConfig {
  url: string
  options?: WorkerOptions
}

let localExtensionHost: typeof LocalExtensionHost | undefined
function setLocalExtensionHost(_localExtensionHost: typeof LocalExtensionHost): void {
  localExtensionHost = _localExtensionHost
}

class BrowserExtensionHostFactoryOverride extends BrowserExtensionHostFactory {
  constructor(
    private readonly workerExtHostEnabled: boolean,
    _extensionsProposedApi: ExtensionsProposedApi,
    _scanWebExtensions: () => Promise<IExtensionDescription[]>,
    _getExtensionRegistrySnapshotWhenReady: () => Promise<ExtensionDescriptionRegistrySnapshot>,
    @IInstantiationService _instantiationService: IInstantiationService,
    @IRemoteAgentService _remoteAgentService: IRemoteAgentService,
    @IRemoteAuthorityResolverService
    _remoteAuthorityResolverService: IRemoteAuthorityResolverService,
    @IWorkbenchExtensionEnablementService
    _extensionEnablementService: IWorkbenchExtensionEnablementService,
    @ILogService _logService: ILogService
  ) {
    super(
      _extensionsProposedApi,
      _scanWebExtensions,
      _getExtensionRegistrySnapshotWhenReady,
      _instantiationService,
      _remoteAgentService,
      _remoteAuthorityResolverService,
      _extensionEnablementService,
      _logService
    )
  }

  override createExtensionHost(
    runningLocations: ExtensionRunningLocationTracker,
    runningLocation: ExtensionRunningLocation,
    isInitialStart: boolean
  ): IExtensionHost | null {
    switch (runningLocation.kind) {
      case ExtensionHostKind.LocalProcess: {
        if (localExtensionHost == null) {
          return null
        }
        return this._instantiationService.createInstance(
          localExtensionHost,
          runningLocation,
          ExtensionHostStartup.EagerAutoStart,
          this._createLocalExtensionHostDataProvider(
            runningLocations,
            runningLocation,
            isInitialStart
          )
        )
      }
      case ExtensionHostKind.LocalWebWorker: {
        if (!this.workerExtHostEnabled) {
          return null
        }
        const startup = isInitialStart
          ? ExtensionHostStartup.EagerManualStart
          : ExtensionHostStartup.EagerAutoStart
        return this._instantiationService.createInstance(
          WebWorkerExtensionHost,
          runningLocation,
          startup,
          this._createLocalExtensionHostDataProvider(
            runningLocations,
            runningLocation,
            isInitialStart
          )
        )
      }
      case ExtensionHostKind.Remote: {
        return super.createExtensionHost(runningLocations, runningLocation, isInitialStart)
      }
    }
  }
}

class LocalBrowserExtensionHostKindPicker extends BrowserExtensionHostKindPicker {
  constructor(
    private readonly allowedExtHostKinds: ExtensionHostKind[],
    @ILogService _logService: ILogService
  ) {
    super(_logService)
  }

  public override pickExtensionHostKind(
    extensionId: ExtensionIdentifier,
    extensionKinds: ExtensionKind[],
    isInstalledLocally: boolean,
    isInstalledRemotely: boolean,
    preference: ExtensionRunningPreference
  ): ExtensionHostKind | null {
    const forcedKind = getForcedExtensionHostKind(extensionId.value)
    if (forcedKind != null) {
      return forcedKind
    }
    const detectedKind = super.pickExtensionHostKind(
      extensionId,
      extensionKinds,
      isInstalledLocally,
      isInstalledRemotely,
      preference
    )
    if (detectedKind != null && !this.allowedExtHostKinds.includes(detectedKind)) {
      return this.allowedExtHostKinds[0] ?? null
    }
    return detectedKind
  }
}

export interface IExtensionWithExtHostKind extends IExtension {
  extHostKind?: ExtensionHostKind
}

export class ExtensionServiceOverride extends ExtensionService implements IExtensionService {
  constructor(
    workerExtHostEnabled: boolean,
    @IInstantiationService instantiationService: IInstantiationService,
    @INotificationService notificationService: INotificationService,
    @IBrowserWorkbenchEnvironmentService
    browserEnvironmentService: IBrowserWorkbenchEnvironmentService,
    @ITelemetryService telemetryService: ITelemetryService,
    @IWorkbenchExtensionEnablementService
    extensionEnablementService: IWorkbenchExtensionEnablementService,
    @IFileService fileService: IFileService,
    @IProductService productService: IProductService,
    @IWorkbenchExtensionManagementService
    extensionManagementService: IWorkbenchExtensionManagementService,
    @IWorkspaceContextService contextService: IWorkspaceContextService,
    @IConfigurationService configurationService: IConfigurationService,
    @IExtensionManifestPropertiesService
    extensionManifestPropertiesService: IExtensionManifestPropertiesService,
    @IWebExtensionsScannerService webExtensionsScannerService: IWebExtensionsScannerService,
    @ILogService logService: ILogService,
    @IRemoteAgentService remoteAgentService: IRemoteAgentService,
    @IRemoteExtensionsScannerService
    remoteExtensionsScannerService: IRemoteExtensionsScannerService,
    @ILifecycleService lifecycleService: ILifecycleService,
    @IRemoteAuthorityResolverService
    remoteAuthorityResolverService: IRemoteAuthorityResolverService,
    @IUserDataInitializationService userDataInitializationService: IUserDataInitializationService,
    @IUserDataProfileService userDataProfileService: IUserDataProfileService,
    @IWorkspaceTrustManagementService
    workspaceTrustManagementService: IWorkspaceTrustManagementService,
    @IRemoteExplorerService remoteExplorerService: IRemoteExplorerService,
    @IDialogService dialogService: IDialogService
  ) {
    const extensionsProposedApi = instantiationService.createInstance(ExtensionsProposedApi)
    const extensionHostFactory = new BrowserExtensionHostFactoryOverride(
      workerExtHostEnabled,
      extensionsProposedApi,
      async () => await this._scanWebExtensions(),
      () => this._getExtensionRegistrySnapshotWhenReady(),
      instantiationService,
      remoteAgentService,
      remoteAuthorityResolverService,
      extensionEnablementService,
      logService
    )
    super(
      extensionsProposedApi,
      extensionHostFactory,
      new LocalBrowserExtensionHostKindPicker(
        workerExtHostEnabled
          ? [
              ExtensionHostKind.LocalWebWorker,
              ExtensionHostKind.LocalProcess,
              ExtensionHostKind.Remote
            ]
          : [ExtensionHostKind.LocalProcess, ExtensionHostKind.Remote],
        logService
      ),
      instantiationService,
      notificationService,
      browserEnvironmentService,
      telemetryService,
      extensionEnablementService,
      fileService,
      productService,
      extensionManagementService,
      contextService,
      configurationService,
      extensionManifestPropertiesService,
      webExtensionsScannerService,
      logService,
      remoteAgentService,
      remoteExtensionsScannerService,
      lifecycleService,
      remoteAuthorityResolverService,
      userDataInitializationService,
      userDataProfileService,
      workspaceTrustManagementService,
      remoteExplorerService,
      dialogService
    )
  }

  public async deltaExtensions(
    toAdd: IExtensionWithExtHostKind[],
    toRemove: IExtension[]
  ): Promise<void> {
    await this._handleDeltaExtensions(new DeltaExtensionsQueueItem(toAdd, toRemove))
  }
}

class ExtensionResourceLoaderServiceOverride extends ExtensionResourceLoaderService {
  override async readExtensionResource(uri: URI): Promise<string> {
    /**
     * Small hack to make it work in jest environment
     * The default implementation transforms the uri to a browser uri and then loads it using the file service
     * inside jest which runs in a node environment, the browser uri for web extensions will be a file uri and the file service will be unable to load it
     * so try to directly load the non-browser uri using the file service for web extensions
     */
    if (uri.scheme === CustomSchemas.extensionFile) {
      const result = await this._fileService.readFile(uri)
      return result.value.toString()
    }
    return await super.readExtensionResource(uri)
  }
}

let iframeAlternateDomains: string | undefined
registerAssets({
  'vs/workbench/services/extensions/worker/webWorkerExtensionHostIframe.esm.html': () =>
    changeUrlDomain(
      new URL(
        '../../vscode/src/vs/workbench/services/extensions/worker/webWorkerExtensionHostIframe.esm.html',
        import.meta.url
      ).href,
      iframeAlternateDomains
    )
})

export default function getServiceOverride(
  workerConfig?: WorkerConfig,
  _iframeAlternateDomains?: string
): IEditorOverrideServices {
  if (_iframeAlternateDomains != null) {
    iframeAlternateDomains = _iframeAlternateDomains
  }
  const _workerConfig =
    workerConfig != null
      ? {
          ...workerConfig,
          url: changeUrlDomain(workerConfig.url, iframeAlternateDomains)
        }
      : undefined

  if (workerConfig != null) {
    registerAssets({
      'vs/workbench/api/worker/extensionHostWorker.esm.js': () => workerConfig.url
    })
  }

  return {
    [IExtensionService.toString()]: new SyncDescriptor(
      ExtensionServiceOverride,
      [_workerConfig],
      false
    ),
    [IExtensionManifestPropertiesService.toString()]: new SyncDescriptor(
      ExtensionManifestPropertiesService,
      [],
      true
    ),
    [IExtensionResourceLoaderService.toString()]: new SyncDescriptor(
      ExtensionResourceLoaderServiceOverride,
      [],
      true
    ),
    [IExtensionBisectService.toString()]: new SyncDescriptor(ExtensionBisectService, [], true)
  }
}

export { ExtensionHostKind, setLocalExtensionHost }
