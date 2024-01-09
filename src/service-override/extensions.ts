import { IFileService } from 'vs/platform/files/common/files'
import { ILifecycleService } from 'vs/workbench/services/lifecycle/common/lifecycle'
import { ExtensionHostStartup, IExtensionHost, IExtensionService, toExtensionDescription } from 'vs/workbench/services/extensions/common/extensions'
import { ILogService, ILoggerService } from 'vs/platform/log/common/log'
import { ExtensionIdentifier, IExtension, IExtensionDescription, IRelaxedExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { INotificationService } from 'vs/platform/notification/common/notification'
import { DeltaExtensionsQueueItem } from 'vs/workbench/services/extensions/common/abstractExtensionService'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry'
import { IDialogService } from 'vs/platform/dialogs/common/dialogs'
import { IRemoteAuthorityResolverService } from 'vs/platform/remote/common/remoteAuthorityResolver'
import { IRemoteExtensionsScannerService } from 'vs/platform/remote/common/remoteExtensionsScanner'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService'
import { IWebExtensionsScannerService, IWorkbenchExtensionEnablementService, IWorkbenchExtensionManagementService } from 'vs/workbench/services/extensionManagement/common/extensionManagement'
import { ExtensionManifestPropertiesService, IExtensionManifestPropertiesService } from 'vs/workbench/services/extensions/common/extensionManifestPropertiesService'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration'
import { IProductService } from 'vs/platform/product/common/productService'
import { IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IUserDataInitializationService } from 'vs/workbench/services/userData/browser/userDataInit'
import { ExtensionsProposedApi } from 'vs/workbench/services/extensions/common/extensionsProposedApi'
import { BrowserExtensionHostFactory, BrowserExtensionHostKindPicker, ExtensionService } from 'vs/workbench/services/extensions/browser/extensionService'
import { ExtensionHostKind, ExtensionRunningPreference } from 'vs/workbench/services/extensions/common/extensionHostKind'
import { ExtensionRunningLocation, LocalWebWorkerRunningLocation } from 'vs/workbench/services/extensions/common/extensionRunningLocation'
import { ExtensionRunningLocationTracker } from 'vs/workbench/services/extensions/common/extensionRunningLocationTracker'
import { URI } from 'vs/base/common/uri'
import { IWebWorkerExtensionHostDataProvider, WebWorkerExtensionHost } from 'vs/workbench/services/extensions/browser/webWorkerExtensionHost'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile'
import { ILayoutService } from 'vs/platform/layout/browser/layoutService'
import { IStorageService } from 'vs/platform/storage/common/storage'
import { ILabelService } from 'vs/platform/label/common/label'
import { ExtensionKind } from 'vs/platform/environment/common/environment'
import { IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile'
import { IWorkspaceTrustManagementService } from 'vs/platform/workspace/common/workspaceTrust'
import { IRemoteExplorerService } from 'vs/workbench/services/remote/common/remoteExplorerService'
import { ExtensionDescriptionRegistrySnapshot } from 'vs/workbench/services/extensions/common/extensionDescriptionRegistry'
import { ExtensionResourceLoaderService } from 'vs/platform/extensionResourceLoader/browser/extensionResourceLoaderService'
import { IExtensionResourceLoaderService } from 'vs/platform/extensionResourceLoader/common/extensionResourceLoader'
import { ExtensionBisectService, IExtensionBisectService } from 'vs/workbench/services/extensionManagement/browser/extensionBisect'
import { changeUrlDomain } from './tools/url'
import { CustomSchemas } from './files'
import type { LocalExtensionHost } from '../localExtensionHost'
import { registerAssets } from '../assets'
import 'vs/workbench/api/browser/extensionHost.contribution'

export interface WorkerConfig {
  url: string
  options?: WorkerOptions
}

class EsmWebWorkerExtensionHost extends WebWorkerExtensionHost {
  constructor (
    private workerConfig: WorkerConfig,
    runningLocation: LocalWebWorkerRunningLocation,
    startup: ExtensionHostStartup,
    _initDataProvider: IWebWorkerExtensionHostDataProvider,
    @ITelemetryService _telemetryService: ITelemetryService,
    @IWorkspaceContextService _contextService: IWorkspaceContextService,
    @ILabelService _labelService: ILabelService,
    @ILogService _logService: ILogService,
    @ILoggerService _loggerService: ILoggerService,
    @IBrowserWorkbenchEnvironmentService _environmentService: IBrowserWorkbenchEnvironmentService,
    @IUserDataProfilesService _userDataProfilesService: IUserDataProfilesService,
    @IProductService _productService: IProductService,
    @ILayoutService _layoutService: ILayoutService,
    @IStorageService _storageService: IStorageService

  ) {
    super(runningLocation, startup, _initDataProvider, _telemetryService, _contextService, _labelService, _logService, _loggerService, _environmentService, _userDataProfilesService, _productService, _layoutService, _storageService)
  }

  protected override async _getWebWorkerExtensionHostIframeSrc (): Promise<string> {
    const url = new URL(await super._getWebWorkerExtensionHostIframeSrc(), window.location.href)
    url.searchParams.set('vscodeExtHostWorkerSrc', this.workerConfig.url)
    if (this.workerConfig.options != null) {
      url.searchParams.set('vscodeExtHostWorkerOptions', JSON.stringify(this.workerConfig.options))
    }
    url.searchParams.set('parentOrigin', window.origin)
    return url.toString()
  }
}

let localExtensionHost: (typeof LocalExtensionHost) | undefined
function setLocalExtensionHost (_localExtensionHost: typeof LocalExtensionHost): void {
  localExtensionHost = _localExtensionHost
}

class BrowserExtensionHostFactoryOverride extends BrowserExtensionHostFactory {
  constructor (
    private readonly workerConfig: WorkerConfig | undefined,
    _extensionsProposedApi: ExtensionsProposedApi,
    _scanWebExtensions: () => Promise<IExtensionDescription[]>,
    _getExtensionRegistrySnapshotWhenReady: () => Promise<ExtensionDescriptionRegistrySnapshot>,
    @IInstantiationService _instantiationService: IInstantiationService,
    @IRemoteAgentService _remoteAgentService: IRemoteAgentService,
    @IRemoteAuthorityResolverService _remoteAuthorityResolverService: IRemoteAuthorityResolverService,
    @IWorkbenchExtensionEnablementService _extensionEnablementService: IWorkbenchExtensionEnablementService,
    @ILogService _logService: ILogService
  ) {
    super(_extensionsProposedApi, _scanWebExtensions, _getExtensionRegistrySnapshotWhenReady, _instantiationService, _remoteAgentService, _remoteAuthorityResolverService, _extensionEnablementService, _logService)
  }

  override createExtensionHost (runningLocations: ExtensionRunningLocationTracker, runningLocation: ExtensionRunningLocation, isInitialStart: boolean): IExtensionHost | null {
    switch (runningLocation.kind) {
      case ExtensionHostKind.LocalProcess: {
        if (localExtensionHost == null) {
          return null
        }
        return this._instantiationService.createInstance(localExtensionHost, runningLocation, ExtensionHostStartup.EagerAutoStart, this._createLocalExtensionHostDataProvider(runningLocations, runningLocation, isInitialStart))
      }
      case ExtensionHostKind.LocalWebWorker: {
        if (this.workerConfig == null) {
          return null
        }
        const startup = (
          isInitialStart
            ? ExtensionHostStartup.EagerManualStart
            : ExtensionHostStartup.EagerAutoStart
        )
        return this._instantiationService.createInstance(EsmWebWorkerExtensionHost, this.workerConfig, runningLocation, startup, this._createLocalExtensionHostDataProvider(runningLocations, runningLocation, isInitialStart))
      }
      case ExtensionHostKind.Remote: {
        return super.createExtensionHost(runningLocations, runningLocation, isInitialStart)
      }
    }
  }
}

class LocalBrowserExtensionHostKindPicker extends BrowserExtensionHostKindPicker {
  private extensionHostKinds = new Map<string, ExtensionHostKind>()
  constructor (
    private readonly allowedExtHostKinds: ExtensionHostKind[],
    @ILogService _logService: ILogService
  ) {
    super(_logService)
  }

  public override pickExtensionHostKind (extensionId: ExtensionIdentifier, extensionKinds: ExtensionKind[], isInstalledLocally: boolean, isInstalledRemotely: boolean, preference: ExtensionRunningPreference): ExtensionHostKind | null {
    const forcedKind = this.extensionHostKinds.get(extensionId.value)
    if (forcedKind != null) {
      return forcedKind
    }
    const detectedKind = super.pickExtensionHostKind(extensionId, extensionKinds, isInstalledLocally, isInstalledRemotely, preference)
    if (detectedKind != null && !this.allowedExtHostKinds.includes(detectedKind)) {
      return this.allowedExtHostKinds[0] ?? null
    }
    return detectedKind
  }

  public setForcedExtensionHostKind (id: string, kind: ExtensionHostKind): void {
    this.extensionHostKinds.set(id, kind)
  }

  public removeForcedExtensionHostKind (id: string): void {
    this.extensionHostKinds.delete(id)
  }
}

export interface IExtensionWithExtHostKind extends IExtension {
  extHostKind?: ExtensionHostKind
}

export class ExtensionServiceOverride extends ExtensionService implements IExtensionService {
  constructor (
    workerConfig: WorkerConfig | undefined,
    @IInstantiationService instantiationService: IInstantiationService,
    @INotificationService notificationService: INotificationService,
    @IBrowserWorkbenchEnvironmentService browserEnvironmentService: IBrowserWorkbenchEnvironmentService,
    @ITelemetryService telemetryService: ITelemetryService,
    @IWorkbenchExtensionEnablementService extensionEnablementService: IWorkbenchExtensionEnablementService,
    @IFileService fileService: IFileService,
    @IProductService productService: IProductService,
    @IWorkbenchExtensionManagementService extensionManagementService: IWorkbenchExtensionManagementService,
    @IWorkspaceContextService contextService: IWorkspaceContextService,
    @IConfigurationService configurationService: IConfigurationService,
    @IExtensionManifestPropertiesService extensionManifestPropertiesService: IExtensionManifestPropertiesService,
    @IWebExtensionsScannerService webExtensionsScannerService: IWebExtensionsScannerService,
    @ILogService logService: ILogService,
    @IRemoteAgentService remoteAgentService: IRemoteAgentService,
    @IRemoteExtensionsScannerService remoteExtensionsScannerService: IRemoteExtensionsScannerService,
    @ILifecycleService lifecycleService: ILifecycleService,
    @IRemoteAuthorityResolverService remoteAuthorityResolverService: IRemoteAuthorityResolverService,
    @IUserDataInitializationService userDataInitializationService: IUserDataInitializationService,
    @IUserDataProfileService userDataProfileService: IUserDataProfileService,
    @IWorkspaceTrustManagementService workspaceTrustManagementService: IWorkspaceTrustManagementService,
    @IRemoteExplorerService remoteExplorerService: IRemoteExplorerService,
    @IDialogService dialogService: IDialogService
  ) {
    const extensionsProposedApi = instantiationService.createInstance(ExtensionsProposedApi)
    const extensionHostFactory = new BrowserExtensionHostFactoryOverride(
      workerConfig,
      extensionsProposedApi,
      async () => this._scanWebExtensions(),
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
      new LocalBrowserExtensionHostKindPicker(workerConfig != null ? [ExtensionHostKind.LocalWebWorker, ExtensionHostKind.LocalProcess, ExtensionHostKind.Remote] : [ExtensionHostKind.LocalProcess, ExtensionHostKind.Remote], logService),
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

  public async deltaExtensions (toAdd: IExtensionWithExtHostKind[], toRemove: IExtension[]): Promise<void> {
    const extHostPicker = (this._extensionHostKindPicker as LocalBrowserExtensionHostKindPicker)
    for (const extension of toRemove) {
      extHostPicker.removeForcedExtensionHostKind(extension.identifier.id)
    }
    for (const extension of toAdd) {
      if (extension.extHostKind != null) {
        extHostPicker.setForcedExtensionHostKind(extension.identifier.id, extension.extHostKind)
      }
    }

    await this._handleDeltaExtensions(new DeltaExtensionsQueueItem(toAdd, toRemove))
  }

  protected override async _scanSingleExtension (extension: IExtension): Promise<Readonly<IRelaxedExtensionDescription> | null> {
    if (extension.location.scheme === CustomSchemas.extensionFile) {
      return toExtensionDescription(extension)
    }
    return super._scanSingleExtension(extension)
  }
}

class ExtensionResourceLoaderServiceOverride extends ExtensionResourceLoaderService {
  override async readExtensionResource (uri: URI): Promise<string> {
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
    return super.readExtensionResource(uri)
  }
}

let iframeAlternateDomains: string | undefined
registerAssets({
  'vs/workbench/services/extensions/worker/webWorkerExtensionHostIframe.html': () => changeUrlDomain(new URL('../assets/webWorkerExtensionHostIframe.html', import.meta.url).href, iframeAlternateDomains)
})

export default function getServiceOverride (workerConfig?: WorkerConfig, _iframeAlternateDomains?: string): IEditorOverrideServices {
  if (_iframeAlternateDomains != null) {
    iframeAlternateDomains = _iframeAlternateDomains
  }
  const _workerConfig = workerConfig != null
    ? {
        ...workerConfig,
        url: changeUrlDomain(workerConfig.url, iframeAlternateDomains)
      }
    : undefined

  return {
    [IExtensionService.toString()]: new SyncDescriptor(ExtensionServiceOverride, [_workerConfig], false),
    [IExtensionManifestPropertiesService.toString()]: new SyncDescriptor(ExtensionManifestPropertiesService, [], true),
    [IExtensionResourceLoaderService.toString()]: new SyncDescriptor(ExtensionResourceLoaderServiceOverride, [], true),
    [IExtensionBisectService.toString()]: new SyncDescriptor(ExtensionBisectService, [], true)
  }
}

export {
  ExtensionHostKind,
  setLocalExtensionHost
}
