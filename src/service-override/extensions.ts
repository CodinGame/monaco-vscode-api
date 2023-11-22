import { IFileService } from 'vs/platform/files/common/files'
import { ILifecycleService } from 'vs/workbench/services/lifecycle/common/lifecycle'
import { ExtensionHostExtensions, ExtensionHostStartup, IExtensionHost, IExtensionService, nullExtensionDescription, toExtensionDescription } from 'vs/workbench/services/extensions/common/extensions'
import { ILogService, ILoggerService } from 'vs/platform/log/common/log'
import { ExtensionIdentifier, ExtensionIdentifierMap, IExtension, IExtensionDescription, IRelaxedExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { IWorkspaceContextService, WorkbenchState } from 'vs/platform/workspace/common/workspace'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { INotificationService } from 'vs/platform/notification/common/notification'
import { DeltaExtensionsQueueItem } from 'vs/workbench/services/extensions/common/abstractExtensionService'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry'
import { Event } from 'vs/base/common/event'
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
import { ExtensionRunningLocation, LocalProcessRunningLocation, LocalWebWorkerRunningLocation } from 'vs/workbench/services/extensions/common/extensionRunningLocation'
import { ExtensionRunningLocationTracker } from 'vs/workbench/services/extensions/common/extensionRunningLocationTracker'
import { IExtHostExtensionService, IHostUtils } from 'vs/workbench/api/common/extHostExtensionService'
import { ExtHostExtensionService } from 'vs/workbench/api/worker/extHostExtensionService'
import type * as vscode from 'vscode'
import { URI } from 'vs/base/common/uri'
import * as platform from 'vs/base/common/platform'
import { InstantiationType, registerSingleton } from 'vs/platform/instantiation/common/extensions'
import { ExtensionStoragePaths, IExtensionStoragePaths } from 'vs/workbench/api/common/extHostStoragePaths'
import { IMessagePassingProtocol } from 'vs/base/parts/ipc/common/ipc'
import { IWebWorkerExtensionHostDataProvider, WebWorkerExtensionHost } from 'vs/workbench/services/extensions/browser/webWorkerExtensionHost'
import { ExtensionHostMain } from 'vs/workbench/api/common/extensionHostMain'
import { BufferedEmitter } from 'vs/base/parts/ipc/common/ipc.net'
import { VSBuffer } from 'vs/base/common/buffer'
import { isLoggingOnly } from 'vs/platform/telemetry/common/telemetryUtils'
import { joinPath } from 'vs/base/common/resources'
import { DeferredPromise } from 'vs/base/common/async'
import { IExtensionHostInitData, UIKind } from 'vs/workbench/services/extensions/common/extensionHostProtocol'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile'
import { ILayoutService } from 'vs/platform/layout/browser/layoutService'
import { IStorageService } from 'vs/platform/storage/common/storage'
import { ILabelService } from 'vs/platform/label/common/label'
import { ExtensionKind } from 'vs/platform/environment/common/environment'
import { IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile'
import { IWorkspaceTrustManagementService } from 'vs/platform/workspace/common/workspaceTrust'
import { IRemoteExplorerService } from 'vs/workbench/services/remote/common/remoteExplorerService'
import { ExtensionDescriptionRegistrySnapshot } from 'vs/workbench/services/extensions/common/extensionDescriptionRegistry'
import { changeUrlDomain } from './tools/url'
import { CustomSchemas } from './files'
import { registerAssets } from '../assets'
import { unsupported } from '../tools'
import 'vs/workbench/api/browser/extensionHost.contribution'
// We need to import missing service here because extHost.common.services registers ILoggerService and we want the implementation from missing-service to win
import '../missing-services'
// We need it for the local extHost
import 'vs/workbench/api/common/extHost.common.services'

function createMessagePassingProtocolPair (): [IMessagePassingProtocol, IMessagePassingProtocol] {
  const emitterA = new BufferedEmitter<VSBuffer>()
  const emitterB = new BufferedEmitter<VSBuffer>()

  class SimpleMessagePassingProtocol implements IMessagePassingProtocol {
    constructor (
      private readonly emitterIn: BufferedEmitter<VSBuffer>,
      private readonly emitterOut: BufferedEmitter<VSBuffer>
    ) {}

    send (buffer: VSBuffer): void {
      this.emitterOut.fire(buffer)
    }

    onMessage = this.emitterIn.event
  }

  return [new SimpleMessagePassingProtocol(emitterA, emitterB), new SimpleMessagePassingProtocol(emitterB, emitterA)]
}

export class LocalExtHostExtensionService extends ExtHostExtensionService {
  private _defaultApiImpl?: typeof vscode

  private readonly _extApiImpl = new ExtensionIdentifierMap<typeof vscode>()

  public async getApi (extensionId?: string): Promise<typeof vscode> {
    const [myRegistry, configProvider] = await Promise.all([
      this.getExtensionRegistry(),
      this._extHostConfiguration.getConfigProvider()
    ])
    const extensionRegistry = { mine: myRegistry, all: this._globalRegistry }

    const ext = extensionId != null ? myRegistry.getExtensionDescription(extensionId) : undefined
    if (ext != null) {
      let apiImpl = this._extApiImpl.get(ext.identifier)
      if (apiImpl == null) {
        apiImpl = this._apiFactory!(ext, extensionRegistry, configProvider)
        this._extApiImpl.set(ext.identifier, apiImpl)
      }
      return apiImpl
    }

    // fall back to a default implementation
    if (this._defaultApiImpl == null) {
      this._defaultApiImpl = this._apiFactory!(nullExtensionDescription, extensionRegistry, configProvider)
    }
    return this._defaultApiImpl
  }
}

registerSingleton(IExtHostExtensionService, LocalExtHostExtensionService, InstantiationType.Eager)
registerSingleton(IExtensionStoragePaths, ExtensionStoragePaths, InstantiationType.Eager)

const hostUtil = new class implements IHostUtils {
  declare readonly _serviceBrand: undefined
  public readonly pid = undefined
  exit = unsupported

  async exists (_path: string): Promise<boolean> {
    return true
  }

  async realpath (path: string): Promise<string> {
    return path
  }
}()

const localExtHostDeferred = new DeferredPromise<LocalExtHostExtensionService>()
const localExtHostPromise = localExtHostDeferred.p

class LocalExtensionHost implements IExtensionHost {
  public readonly remoteAuthority = null
  public extensions: ExtensionHostExtensions | null = null
  private readonly _extensionHostLogsLocation: URI
  private _protocolPromise: Promise<IMessagePassingProtocol> | null

  constructor (
    public readonly runningLocation: LocalProcessRunningLocation,
    public readonly startup: ExtensionHostStartup,
    private readonly _initDataProvider: IWebWorkerExtensionHostDataProvider,
    @ITelemetryService private readonly _telemetryService: ITelemetryService,
    @IWorkspaceContextService private readonly _contextService: IWorkspaceContextService,
    @ILabelService private readonly _labelService: ILabelService,
    @ILogService private readonly _logService: ILogService,
    @ILoggerService private readonly _loggerService: ILoggerService,
    @IBrowserWorkbenchEnvironmentService private readonly _environmentService: IBrowserWorkbenchEnvironmentService,
    @IProductService private readonly _productService: IProductService,
    @IUserDataProfilesService private readonly _userDataProfilesService: IUserDataProfilesService
  ) {
    this._protocolPromise = null
    this._extensionHostLogsLocation = joinPath(this._environmentService.extHostLogsPath, 'local')
  }

  onExit = Event.None
  public async start (): Promise<IMessagePassingProtocol> {
    if (this._protocolPromise == null) {
      this._protocolPromise = this._start()
    }
    return this._protocolPromise
  }

  async _start (): Promise<IMessagePassingProtocol> {
    const [mainThreadMessagePassingProtocol, extHostMessagePassingProtocol] = createMessagePassingProtocolPair()
    const initData = await this._createExtHostInitData()

    // eslint-disable-next-line no-new
    const hostMain = new ExtensionHostMain(
      extHostMessagePassingProtocol,
      initData,
      hostUtil,
      null
    )

    await localExtHostDeferred.complete(hostMain.getExtHostExtensionService() as LocalExtHostExtensionService)

    return mainThreadMessagePassingProtocol
  }

  private async _createExtHostInitData (): Promise<IExtensionHostInitData> {
    const initData = await this._initDataProvider.getInitData()
    this.extensions = initData.extensions
    const workspace = this._contextService.getWorkspace()
    const nlsBaseUrl = this._productService.extensionsGallery?.nlsBaseUrl
    let nlsUrlWithDetails: URI | undefined
    // Only use the nlsBaseUrl if we are using a language other than the default, English.
    if (nlsBaseUrl != null && this._productService.commit != null && !platform.Language.isDefaultVariant()) {
      nlsUrlWithDetails = URI.joinPath(URI.parse(nlsBaseUrl), this._productService.commit, this._productService.version, platform.Language.value())
    }
    return {
      commit: this._productService.commit,
      version: this._productService.version,
      quality: this._productService.quality,
      parentPid: 0,
      environment: {
        isExtensionDevelopmentDebug: this._environmentService.debugRenderer,
        appName: this._productService.nameLong,
        appHost: this._productService.embedderIdentifier ?? (platform.isWeb ? 'web' : 'desktop'),
        appUriScheme: this._productService.urlProtocol,
        appLanguage: platform.language,
        extensionTelemetryLogResource: this._environmentService.extHostTelemetryLogFile,
        isExtensionTelemetryLoggingOnly: isLoggingOnly(this._productService, this._environmentService),
        extensionDevelopmentLocationURI: this._environmentService.extensionDevelopmentLocationURI,
        extensionTestsLocationURI: this._environmentService.extensionTestsLocationURI,
        globalStorageHome: this._userDataProfilesService.defaultProfile.globalStorageHome,
        workspaceStorageHome: this._environmentService.workspaceStorageHome,
        extensionLogLevel: this._environmentService.extensionLogLevel
      },
      workspace: this._contextService.getWorkbenchState() === WorkbenchState.EMPTY
        ? undefined
        : {
            configuration: workspace.configuration ?? undefined,
            id: workspace.id,
            name: this._labelService.getWorkspaceLabel(workspace),
            transient: workspace.transient
          },
      consoleForward: {
        includeStack: false,
        logNative: this._environmentService.debugRenderer
      },
      extensions: initData.extensions.toSnapshot(),
      nlsBaseUrl: nlsUrlWithDetails,
      telemetryInfo: {
        sessionId: this._telemetryService.sessionId,
        machineId: this._telemetryService.machineId,
        firstSessionDate: this._telemetryService.firstSessionDate,
        msftInternal: this._telemetryService.msftInternal
      },
      logLevel: this._logService.getLevel(),
      loggers: [...this._loggerService.getRegisteredLoggers()],
      logsLocation: this._extensionHostLogsLocation,
      autoStart: (this.startup === ExtensionHostStartup.EagerAutoStart),
      remote: {
        authority: this._environmentService.remoteAuthority,
        connectionData: null,
        isRemote: false
      },
      uiKind: platform.isWeb ? UIKind.Web : UIKind.Desktop
    }
  }

  getInspectPort (): number | undefined {
    return undefined
  }

  enableInspectPort (): Promise<boolean> {
    return Promise.resolve(false)
  }

  dispose (): void {
  }
}

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

class LocalBrowserExtensionHostFactory extends BrowserExtensionHostFactory {
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
        return this._instantiationService.createInstance(LocalExtensionHost, runningLocation, ExtensionHostStartup.EagerAutoStart, this._createLocalExtensionHostDataProvider(runningLocations, runningLocation, isInitialStart))
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
    const extensionHostFactory = new LocalBrowserExtensionHostFactory(
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
    [IExtensionManifestPropertiesService.toString()]: new SyncDescriptor(ExtensionManifestPropertiesService, [], true)
  }
}

export function getLocalExtHostExtensionService (): Promise<LocalExtHostExtensionService> {
  return localExtHostPromise
}

export {
  ExtensionHostKind
}
