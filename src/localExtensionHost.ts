// We need to import missing service here because extHost.common.services registers ILoggerService and we want the implementation from missing-service to win
import './missing-services'
// We need it for the local extHost
import 'vs/workbench/api/common/extHost.common.services'
import type * as vscode from 'vscode'
import { ExtensionHostMain } from 'vs/workbench/api/common/extensionHostMain'
import { BufferedEmitter } from 'vs/base/parts/ipc/common/ipc.net'
import { VSBuffer } from 'vs/base/common/buffer'
import { isLoggingOnly } from 'vs/platform/telemetry/common/telemetryUtils'
import { joinPath } from 'vs/base/common/resources'
import {
  type IExtensionHostInitData,
  UIKind
} from 'vs/workbench/services/extensions/common/extensionHostProtocol'
import * as platform from 'vs/base/common/platform'
import type { IMessagePassingProtocol } from 'vs/base/parts/ipc/common/ipc'
import { LocalProcessRunningLocation } from 'vs/workbench/services/extensions/common/extensionRunningLocation'
import {
  IExtHostExtensionService,
  IHostUtils
} from 'vs/workbench/api/common/extHostExtensionService'
import {
  ExtensionHostExtensions,
  ExtensionHostStartup,
  type IExtensionHost,
  nullExtensionDescription
} from 'vs/workbench/services/extensions/common/extensions'
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions.service'
import type { IWebWorkerExtensionHostDataProvider } from 'vs/workbench/services/extensions/browser/webWorkerExtensionHost'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry.service'
import { WorkbenchState } from 'vs/platform/workspace/common/workspace'
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace.service'
import { ILabelService } from 'vs/platform/label/common/label.service'
import { ILogService, ILoggerService } from 'vs/platform/log/common/log.service'
import { IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService.service'
import { IProductService } from 'vs/platform/product/common/productService.service'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile.service'
import { URI } from 'vs/base/common/uri'
import { Event } from 'vs/base/common/event'
import { InstantiationType, registerSingleton } from 'vs/platform/instantiation/common/extensions'
import {
  ExtensionStoragePaths,
  IExtensionStoragePaths
} from 'vs/workbench/api/common/extHostStoragePaths'
import { ExtHostExtensionService } from 'vs/workbench/api/worker/extHostExtensionService'
import { ExtensionIdentifierMap } from 'vs/platform/extensions/common/extensions'
import { DeferredPromise } from 'vs/base/common/async'
import { setLocalExtensionHost } from './service-override/extensions'
import { unsupported } from './tools'
import { type ApiFactory, registerDefaultApiHandler, registerLocalApiFactory } from './extensions'
import { registerServiceInitializePostParticipant } from './lifecycle'
import { ExtHostTelemetry, IExtHostTelemetry } from 'vs/workbench/api/common/extHostTelemetry'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'

const apiFactoryDeferred = new DeferredPromise<ApiFactory>()

class LocalExtHostExtensionService extends ExtHostExtensionService {
  private _defaultApiImpl?: typeof vscode

  private readonly _extApiImpl = new ExtensionIdentifierMap<typeof vscode>()

  public async getApi(extensionId?: string): Promise<typeof vscode> {
    const [myRegistry, configProvider] = await Promise.all([
      this.getExtensionRegistry(),
      this._extHostConfiguration.getConfigProvider()
    ])
    const extensionRegistry = { mine: myRegistry, all: this._globalRegistry }

    if (extensionId == null) {
      if (this._defaultApiImpl == null) {
        this._defaultApiImpl = this._apiFactory!(
          nullExtensionDescription,
          extensionRegistry,
          configProvider
        )
      }
      return this._defaultApiImpl
    }

    const ext = myRegistry.getExtensionDescription(extensionId)
    if (ext == null) {
      throw new Error(`Extension ${extensionId} does not exist or is disabled`)
    }
    let apiImpl = this._extApiImpl.get(ext.identifier)
    if (apiImpl == null) {
      apiImpl = this._apiFactory!(ext, extensionRegistry, configProvider)
      this._extApiImpl.set(ext.identifier, apiImpl)
    }
    return apiImpl
  }
}

registerSingleton(IExtHostExtensionService, LocalExtHostExtensionService, InstantiationType.Eager)
registerSingleton(IExtensionStoragePaths, ExtensionStoragePaths, InstantiationType.Eager)
registerSingleton(IExtHostTelemetry, new SyncDescriptor(ExtHostTelemetry, [true], true))

function createMessagePassingProtocolPair(): [IMessagePassingProtocol, IMessagePassingProtocol] {
  const emitterA = new BufferedEmitter<VSBuffer>()
  const emitterB = new BufferedEmitter<VSBuffer>()

  class SimpleMessagePassingProtocol implements IMessagePassingProtocol {
    constructor(
      private readonly emitterIn: BufferedEmitter<VSBuffer>,
      private readonly emitterOut: BufferedEmitter<VSBuffer>
    ) {}

    send(buffer: VSBuffer): void {
      this.emitterOut.fire(buffer)
    }

    onMessage = this.emitterIn.event
  }

  return [
    new SimpleMessagePassingProtocol(emitterA, emitterB),
    new SimpleMessagePassingProtocol(emitterB, emitterA)
  ]
}

const hostUtil = new (class implements IHostUtils {
  declare readonly _serviceBrand: undefined
  public readonly pid = undefined
  exit = unsupported

  async exists(): Promise<boolean> {
    return true
  }

  async realpath(path: string): Promise<string> {
    return path
  }
})()

class LocalExtensionHost implements IExtensionHost {
  public readonly remoteAuthority = null
  public extensions: ExtensionHostExtensions | null = null
  private readonly _extensionHostLogsLocation: URI
  private _protocolPromise: Promise<IMessagePassingProtocol> | null
  public pid = null

  constructor(
    public readonly runningLocation: LocalProcessRunningLocation,
    public readonly startup: ExtensionHostStartup,
    private readonly _initDataProvider: IWebWorkerExtensionHostDataProvider,
    @ITelemetryService private readonly _telemetryService: ITelemetryService,
    @IWorkspaceContextService private readonly _contextService: IWorkspaceContextService,
    @ILabelService private readonly _labelService: ILabelService,
    @ILogService private readonly _logService: ILogService,
    @ILoggerService private readonly _loggerService: ILoggerService,
    @IBrowserWorkbenchEnvironmentService
    private readonly _environmentService: IBrowserWorkbenchEnvironmentService,
    @IProductService private readonly _productService: IProductService,
    @IUserDataProfilesService private readonly _userDataProfilesService: IUserDataProfilesService
  ) {
    this._protocolPromise = null
    this._extensionHostLogsLocation = joinPath(this._environmentService.extHostLogsPath, 'local')
  }

  onExit = Event.None
  public async start(): Promise<IMessagePassingProtocol> {
    if (this._protocolPromise == null) {
      this._protocolPromise = this._start()
    }
    return await this._protocolPromise
  }

  async _start(): Promise<IMessagePassingProtocol> {
    const [mainThreadMessagePassingProtocol, extHostMessagePassingProtocol] =
      createMessagePassingProtocolPair()
    const initData = await this._createExtHostInitData()

    const hostMain = new ExtensionHostMain(extHostMessagePassingProtocol, initData, hostUtil, null)

    const localExtHostExtensionService =
      hostMain.getExtHostExtensionService() as LocalExtHostExtensionService

    await apiFactoryDeferred.complete((extensionId?: string) =>
      localExtHostExtensionService.getApi(extensionId)
    )

    return mainThreadMessagePassingProtocol
  }

  private async _createExtHostInitData(): Promise<IExtensionHostInitData> {
    const initData = await this._initDataProvider.getInitData()
    this.extensions = initData.extensions
    const workspace = this._contextService.getWorkspace()
    const nlsBaseUrl = this._productService.extensionsGallery?.nlsBaseUrl
    let nlsUrlWithDetails: URI | undefined
    // Only use the nlsBaseUrl if we are using a language other than the default, English.
    if (
      nlsBaseUrl != null &&
      this._productService.commit != null &&
      !platform.Language.isDefaultVariant()
    ) {
      nlsUrlWithDetails = URI.joinPath(
        URI.parse(nlsBaseUrl),
        this._productService.commit,
        this._productService.version,
        platform.Language.value()
      )
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
        isExtensionTelemetryLoggingOnly: isLoggingOnly(
          this._productService,
          this._environmentService
        ),
        extensionDevelopmentLocationURI: this._environmentService.extensionDevelopmentLocationURI,
        extensionTestsLocationURI: this._environmentService.extensionTestsLocationURI,
        globalStorageHome: this._userDataProfilesService.defaultProfile.globalStorageHome,
        workspaceStorageHome: this._environmentService.workspaceStorageHome,
        extensionLogLevel: this._environmentService.extensionLogLevel
      },
      workspace:
        this._contextService.getWorkbenchState() === WorkbenchState.EMPTY
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
        msftInternal: this._telemetryService.msftInternal,
        sqmId: this._telemetryService.sqmId,
        devDeviceId: this._telemetryService.devDeviceId
      },
      logLevel: this._logService.getLevel(),
      loggers: [...this._loggerService.getRegisteredLoggers()],
      logsLocation: this._extensionHostLogsLocation,
      autoStart: this.startup === ExtensionHostStartup.EagerAutoStart,
      remote: {
        authority: this._environmentService.remoteAuthority,
        connectionData: null,
        isRemote: false
      },
      uiKind: platform.isWeb ? UIKind.Web : UIKind.Desktop
    }
  }

  getInspectPort(): { port: number; host: string } | undefined {
    return undefined
  }

  enableInspectPort(): Promise<boolean> {
    return Promise.resolve(false)
  }

  dispose(): void {}
}

export type { LocalExtensionHost }

async function createLocalApi(extensionId?: string): Promise<typeof vscode> {
  const apiFactory = await apiFactoryDeferred.p
  return await apiFactory(extensionId)
}

setLocalExtensionHost(LocalExtensionHost)
registerLocalApiFactory(createLocalApi)

export let defaultApi: typeof vscode | undefined
registerDefaultApiHandler((api) => {
  defaultApi = api
})

registerServiceInitializePostParticipant(async (accessor) => {
  // Make sure the extension service is loaded
  accessor.get(IExtensionService)
  defaultApi = await createLocalApi()
})
