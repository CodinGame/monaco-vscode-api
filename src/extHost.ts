import type { IExtensionRegistries } from 'vs/workbench/api/common/extHost.api.impl'
import type { ExtHostDiagnostics } from 'vs/workbench/api/common/extHostDiagnostics'
import type { IExtHostFileSystemInfo } from 'vs/workbench/api/common/extHostFileSystemInfo'
import type { Proxied, ProxyIdentifier } from 'vs/workbench/services/extensions/common/proxyIdentifier'
import type { ExtHostDocuments } from 'vs/workbench/api/common/extHostDocuments'
import type { ExtHostDocumentContentProvider } from 'vs/workbench/api/common/extHostDocumentContentProviders'
import type { IExtHostDocumentsAndEditors } from 'vs/workbench/api/common/extHostDocumentsAndEditors'
import type { ExtHostEditors } from 'vs/workbench/api/common/extHostTextEditors'
import type { ExtHostBulkEdits } from 'vs/workbench/api/common/extHostBulkEdits'
import type { ExtHostLanguages } from 'vs/workbench/api/common/extHostLanguages'
import type { ExtHostLanguageFeatures } from 'vs/workbench/api/common/extHostLanguageFeatures'
import type { IExtHostDebugService } from 'vs/workbench/api/common/extHostDebugService'
import type { IExtHostEditorTabs } from 'vs/workbench/api/common/extHostEditorTabs'
import type { IExtHostTerminalService } from 'vs/workbench/api/common/extHostTerminalService'
import type { ExtHostFileSystem } from 'vs/workbench/api/common/extHostFileSystem'
import type { ExtHostDocumentSaveParticipant } from 'vs/workbench/api/common/extHostDocumentSaveParticipant'
import type { ExtHostFileSystemEventService } from 'vs/workbench/api/common/extHostFileSystemEventService'
import type { IExtHostOutputService } from 'vs/workbench/api/common/extHostOutput'
import type { ExtHostTreeViews } from 'vs/workbench/api/common/extHostTreeViews'
import type { IExtHostCommands } from 'vs/workbench/api/common/extHostCommands'
import type { IExtensionHostProxy } from 'vs/workbench/services/extensions/common/extensionHostProxy'
import type { ExtHostStatusBar } from 'vs/workbench/api/common/extHostStatusBar'
import type { IExtHostSearch } from 'vs/workbench/api/common/extHostSearch'
import type { ExtHostDialogs } from 'vs/workbench/api/common/extHostDialogs'
import type { ExtHostWebviews } from 'vs/workbench/api/common/extHostWebview'
import type { ExtHostCustomEditors } from 'vs/workbench/api/common/extHostCustomEditors'
import type { ExtHostWebviewPanels } from 'vs/workbench/api/common/extHostWebviewPanels'
import type { ExtHostWebviewViews } from 'vs/workbench/api/common/extHostWebviewView'
import type { ExtHostTheming } from 'vs/workbench/api/common/extHostTheming'
import type { ExtHostUriOpeners } from 'vs/workbench/api/common/extHostUriOpener'
import type { IExtHostStorage } from 'vs/workbench/api/common/extHostStorage'
import type { IExtHostConsumerFileSystem } from 'vs/workbench/api/common/extHostFileSystemConsumer'
import type { IExtHostLocalizationService } from 'vs/workbench/api/common/extHostLocalizationService'
import type { IExtHostWindow } from 'vs/workbench/api/common/extHostWindow'
import type { ExtHostClipboard } from 'vs/workbench/api/common/extHostClipboard'
import type { IExtHostTelemetry } from 'vs/workbench/api/common/extHostTelemetry'
import type { ExtHostQuickOpen } from 'vs/workbench/api/common/extHostQuickOpen'
import type { IExtHostWorkspace } from 'vs/workbench/api/common/extHostWorkspace'
import type { ExtHostProgress } from 'vs/workbench/api/common/extHostProgress'
import { ExtHostExtensionService } from 'vs/workbench/api/worker/extHostExtensionService'
import { ExtHostConfigProvider, IExtHostConfiguration } from 'vs/workbench/api/common/extHostConfiguration'
import { IExtHostManagedSockets } from 'vs/workbench/api/common/extHostManagedSockets'
import { BrandedService, IInstantiationService, ServiceIdentifier, ServicesAccessor } from 'vs/platform/instantiation/common/instantiation'
import { IExtHostInitDataService } from 'vs/workbench/api/common/extHostInitDataService'
import { IEnvironment, UIKind } from 'vs/workbench/services/extensions/common/extensionHostProtocol'
import { ExtHostVariableResolverProviderService, IExtHostVariableResolverProvider } from 'vs/workbench/api/common/extHostVariableResolverService'
import { IExtHostExtensionService, IHostUtils } from 'vs/workbench/api/common/extHostExtensionService'
import { ExtensionStoragePaths, IExtensionStoragePaths } from 'vs/workbench/api/common/extHostStoragePaths'
import { ExtHostTunnelService, IExtHostTunnelService } from 'vs/workbench/api/common/extHostTunnelService'
import { ExtHostMessageService } from 'vs/workbench/api/common/extHostMessageService'
import { ExtHostRpcService, IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ILogService, ILoggerService, LogLevel } from 'vs/platform/log/common/log'
import { ExtHostCustomersRegistry, IInternalExtHostContext } from 'vs/workbench/services/extensions/common/extHostCustomers'
import { ExtensionHostKind } from 'vs/workbench/services/extensions/common/extensionHostKind'
import { ExtHostApiDeprecationService, IExtHostApiDeprecationService } from 'vs/workbench/api/common/extHostApiDeprecationService'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry'
import {
  ExtHostContext, IMainContext
} from 'vs/workbench/api/common/extHost.protocol'
import { URI } from 'vs/base/common/uri'
import { IMessagePassingProtocol } from 'vs/base/parts/ipc/common/ipc'
import { BufferedEmitter } from 'vs/base/parts/ipc/common/ipc.net'
import { VSBuffer } from 'vs/base/common/buffer'
import type { Event } from 'vs/base/common/event'
import { RPCProtocol } from 'vs/workbench/services/extensions/common/rpcProtocol'
import * as errors from 'vs/base/common/errors'
import { Barrier } from 'vs/base/common/async'
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions'
import type { IExtHostDecorations } from 'vs/workbench/api/common/extHostDecorations'
import * as toposort from 'toposort'
import { ServiceCollection } from 'vs/platform/instantiation/common/serviceCollection'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { InstantiationService } from 'vs/platform/instantiation/common/instantiationService'
import { ExtHostLogService } from 'vs/workbench/api/common/extHostLogService'
import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { ExtHostLoggerService } from 'vs/workbench/api/common/extHostLoggerService'
import { IURITransformerService, URITransformerService } from 'vs/workbench/api/common/extHostUriTransformerService'
import { unsupported } from './tools'
import { SimpleExtensionService } from './missing-services'
import 'vs/workbench/api/browser/mainThreadConsole'
import 'vs/workbench/api/browser/mainThreadExtensionService'
import 'vs/workbench/api/browser/mainThreadLogService'

const serviceCollection = new ServiceCollection()
export function registerExtHostSingleton<T, Services extends BrandedService[]>(id: ServiceIdentifier<T>, ctor: new (...services: Services) => T, supportsDelayedInstantiation: InstantiationType): void
export function registerExtHostSingleton<T>(id: ServiceIdentifier<T>, descriptor: SyncDescriptor<unknown>): void
export function registerExtHostSingleton<T, Services extends BrandedService[]> (id: ServiceIdentifier<T>, ctorOrDescriptor: { new(...services: Services): T } | SyncDescriptor<unknown>, supportsDelayedInstantiation?: boolean | InstantiationType): void {
  if (!(ctorOrDescriptor instanceof SyncDescriptor)) {
    ctorOrDescriptor = new SyncDescriptor<T>(ctorOrDescriptor as new (...args: any[]) => T, [], Boolean(supportsDelayedInstantiation))
  }

  serviceCollection.set(id, ctorOrDescriptor)
}

serviceCollection.set(IURITransformerService, new URITransformerService(null))
export const extHostInstantiationService = new InstantiationService(serviceCollection, false)
serviceCollection.set(IInstantiationService, extHostInstantiationService)

class SimpleMessagePassingProtocol implements IMessagePassingProtocol {
  private readonly _onMessage = new BufferedEmitter<VSBuffer>()
  readonly onMessage: Event<VSBuffer> = this._onMessage.event
  send (buffer: VSBuffer): void {
    setTimeout(() => {
      this._onMessage.fire(buffer)
    })
  }
}

const imessagePassingProtocol = new SimpleMessagePassingProtocol()
const rpcProtocol = new RPCProtocol(imessagePassingProtocol)

const environment: IEnvironment = {
  isExtensionDevelopmentDebug: false,
  appName: 'Monaco',
  appHost: 'web',
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  appLanguage: window.navigator.language ?? 'en-US',
  extensionTelemetryLogResource: URI.from({ scheme: 'user', path: '/extensionTelemetryLogResource.log' }),
  isExtensionTelemetryLoggingOnly: false,
  get appUriScheme () { return unsupported() },
  get globalStorageHome () { return unsupported() },
  get workspaceStorageHome () { return unsupported() }
}

registerExtHostSingleton(ILogService, new SyncDescriptor(ExtHostLogService, [true], true))
registerExtHostSingleton(ILoggerService, ExtHostLoggerService, InstantiationType.Delayed)

class ExtHostInitDataService implements IExtHostInitDataService {
  constructor (
    private _telemetryService: ITelemetryService
  ) {
  }

  _serviceBrand: undefined
  quality = undefined
  version = '1.0.0'
  parentPid = 0
  environment = environment
  allExtensions = []
  myExtensions = []
  consoleForward = {
    includeStack: false,
    logNative: false
  }

  get telemetryInfo () {
    return this._telemetryService
  }

  logLevel = LogLevel.Off
  logsLocation = URI.from({ scheme: 'logs', path: '/' })
  logFile = URI.from({ scheme: 'logs', path: '/logs.log' })
  autoStart = true
  remote = {
    isRemote: false,
    authority: undefined,
    connectionData: null
  }

  uiKind = UIKind.Web
  loggers = []
  logName = 'browser'
  activationEvents = {}
}

registerExtHostSingleton(IHostUtils, class HostUtils implements IHostUtils {
  declare readonly _serviceBrand: undefined
  public readonly pid = undefined
  exit (): void {
    window.close()
  }

  async exists (): Promise<boolean> {
    return true
  }

  async realpath (path: string): Promise<string> {
    return path
  }
}, InstantiationType.Delayed)

registerExtHostSingleton(IExtHostRpcService, new SyncDescriptor(ExtHostRpcService, [rpcProtocol], true))
registerExtHostSingleton(IExtensionStoragePaths, ExtensionStoragePaths, InstantiationType.Delayed)
class _ExtHostExtensionService extends ExtHostExtensionService {
  public getExtensionRegistries (): IExtensionRegistries {
    return { mine: this._myRegistry, all: this._globalRegistry }
  }
}
registerExtHostSingleton(IExtHostExtensionService, _ExtHostExtensionService, InstantiationType.Delayed)
registerExtHostSingleton(IExtHostTunnelService, ExtHostTunnelService, InstantiationType.Delayed)
registerExtHostSingleton(IExtHostApiDeprecationService, ExtHostApiDeprecationService, InstantiationType.Delayed)
registerExtHostSingleton(IExtHostVariableResolverProvider, ExtHostVariableResolverProviderService, InstantiationType.Delayed)
registerExtHostSingleton(IExtHostManagedSockets, class ExtHostManagedSockets implements IExtHostManagedSockets {
  _serviceBrand: undefined
  setFactory = () => {
    // ignore
  }

  $openRemoteSocket = unsupported
  $remoteSocketWrite = unsupported
  $remoteSocketEnd = unsupported
  $remoteSocketDrain = unsupported
}, InstantiationType.Delayed)

const mainContext: IMainContext & IInternalExtHostContext = {
  remoteAuthority: null,
  extensionHostKind: ExtensionHostKind.LocalProcess,
  internalExtensionService: {
    _activateById (): Promise<void> {
      // Do nothing
      return Promise.resolve()
    },
    _onWillActivateExtension (): void {
      // Do nothing
    },
    _onDidActivateExtension (): void {
      // Do nothing
    },
    _onDidActivateExtensionError (): void {
      // Do nothing
    },
    _onExtensionRuntimeError (): void {
      // Do nothing
    }
  },
  getProxy: function <T> (identifier: ProxyIdentifier<T>): Proxied<T> {
    return rpcProtocol.getProxy(identifier)
  },
  set: function <T, R extends T> (identifier: ProxyIdentifier<T>, instance: R): R {
    return rpcProtocol.set(identifier, instance)
  },
  assertRegistered: function (identifiers: ProxyIdentifier<unknown>[]): void {
    rpcProtocol.assertRegistered(identifiers)
  },
  drain: function (): Promise<void> {
    return rpcProtocol.drain()
  },
  dispose () {
    rpcProtocol.dispose()
  },
  _setExtensionHostProxy (proxy: IExtensionHostProxy) {
    (StandaloneServices.get(IExtensionService) as SimpleExtensionService).setExtensionHostProxy(proxy)
  },
  _setAllMainProxyIdentifiers () {}
}

type ExtHostProvider = {
  provide: (accessor: ServicesAccessor, mainContext: IMainContext & IInternalExtHostContext, services: Partial<ExtHostServices>) => Partial<ExtHostServices>
  dependencies?: string[]
}
const extHostProviders: Map<string, ExtHostProvider> = new Map()
export function registerExtHostProvider (name: string, provider: ExtHostProvider): void {
  extHostProviders.set(name, provider)
}

interface ExtHostServices {
  extHostInitData: IExtHostInitDataService
  extHostLogService: ILogService
  extHostApiDeprecationService: IExtHostApiDeprecationService
  extHostMessageService: ExtHostMessageService
  extHostDocumentsAndEditors: IExtHostDocumentsAndEditors
  extHostBulkEdits: ExtHostBulkEdits
  extHostDocuments: ExtHostDocuments
  extHostDocumentContentProvider: ExtHostDocumentContentProvider
  extHostQuickOpen: ExtHostQuickOpen
  extHostProgress: ExtHostProgress
  extHostDiagnostics: ExtHostDiagnostics
  extHostEditors: ExtHostEditors
  extHostCommands: IExtHostCommands
  extHostLanguages: ExtHostLanguages
  extHostWindow: IExtHostWindow
  extHostClipboard: ExtHostClipboard
  extHostLanguageFeatures: ExtHostLanguageFeatures
  extHostWorkspace: IExtHostWorkspace
  extHostConfiguration: IExtHostConfiguration
  extHostTelemetry: IExtHostTelemetry
  extHostDebugService: IExtHostDebugService
  extHostFileSystem: ExtHostFileSystem
  extHostConsumerFileSystem: IExtHostConsumerFileSystem
  extHostExtensionService: _ExtHostExtensionService
  extHostDocumentSaveParticipant: ExtHostDocumentSaveParticipant
  extHostFileSystemEvent: ExtHostFileSystemEventService
  extHostOutputService: IExtHostOutputService
  extHostTreeViews: ExtHostTreeViews
  extHostStorage: IExtHostStorage
  extHostLocalization: IExtHostLocalizationService
  extHostStatusBar: ExtHostStatusBar
  extHostTerminalService: IExtHostTerminalService
  extHostEditorTabs: IExtHostEditorTabs
  extHostDecorations: IExtHostDecorations
  extHostTheming: ExtHostTheming
  extHostSearch: IExtHostSearch
  extHostDialogs: ExtHostDialogs
  extHostWebviews: ExtHostWebviews
  extHostWebviewPanels: ExtHostWebviewPanels
  extHostCustomEditors: ExtHostCustomEditors
  extHostWebviewViews: ExtHostWebviewViews
  extHostUriOpeners: ExtHostUriOpeners
  extHostFileSystemInfo: IExtHostFileSystemInfo
}

function createExtHostServices (accessor: ServicesAccessor): Partial<ExtHostServices> {
  registerExtHostSingleton(IExtHostInitDataService, new SyncDescriptor(ExtHostInitDataService, [StandaloneServices.get(ITelemetryService)], true))

  // services
  const rpcProtocol = accessor.get(IExtHostRpcService)
  const logService = accessor.get(ILogService)
  const extHostApiDeprecationService = accessor.get(IExtHostApiDeprecationService)
  const extHostTunnelService = accessor.get(IExtHostTunnelService)
  const extHostInitData = accessor.get(IExtHostInitDataService)

  rpcProtocol.set(ExtHostContext.ExtHostTunnelService, extHostTunnelService)

  const extHostExtensionService = rpcProtocol.set(ExtHostContext.ExtHostExtensionService, accessor.get(IExtHostExtensionService)) as _ExtHostExtensionService

  const extHostServices: Partial<ExtHostServices> = {
    extHostInitData,
    extHostLogService: logService,
    extHostApiDeprecationService,
    extHostExtensionService
  }

  const sortedProviders = toposort.array(
    Array.from(extHostProviders.values()),
    Array.from(extHostProviders.entries()).flatMap(([name, provider]) => provider.dependencies?.map(dependency => {
      const dependencyImpl = extHostProviders.get(dependency)
      if (dependencyImpl == null) {
        logService.warn(`ExtHost ${name} depends on not registered ${dependency}`)
        return null
      }
      return <[ExtHostProvider, ExtHostProvider]>[dependencyImpl, provider]
    }).filter((a): a is [ExtHostProvider, ExtHostProvider] => a != null) ?? [])
  )

  for (const extHostProvider of sortedProviders) {
    Object.assign(extHostServices, extHostProvider.provide(accessor, mainContext, extHostServices))
  }

  return extHostServices
}

function runExtHostCustomers (accessor: ServicesAccessor) {
  const instantiationService = accessor.get(IInstantiationService)
  const logService = accessor.get(ILogService)
  // Named customers
  const namedCustomers = ExtHostCustomersRegistry.getNamedCustomers()
  for (const [id, ctor] of namedCustomers) {
    try {
      const instance = instantiationService.createInstance(ctor, mainContext)
      rpcProtocol.set(id, instance)
    } catch (err) {
      logService.error(`Cannot instantiate named customer: '${id.sid}'`)
      logService.error(err as Error)
      errors.onUnexpectedError(err)
    }
  }

  // Customers
  const customers = ExtHostCustomersRegistry.getCustomers()
  for (const ctor of customers) {
    try {
      instantiationService.createInstance(ctor, mainContext)
    } catch (err) {
      logService.error(err as Error)
      errors.onUnexpectedError(err)
    }
  }
}

let extHostServices: ExtHostServices | undefined
let configProvider: ExtHostConfigProvider | undefined

const extHostInitializedBarrier = new Barrier()
export function onExtHostInitialized (fct: () => void): void {
  void extHostInitializedBarrier.wait().then(fct)
}

async function _initialize (): Promise<void> {
  const partialExtHostServices = extHostInstantiationService.invokeFunction(createExtHostServices)
  StandaloneServices.get(IInstantiationService).invokeFunction(runExtHostCustomers)
  configProvider = await partialExtHostServices.extHostConfiguration?.getConfigProvider()

  await partialExtHostServices.extHostExtensionService!.initialize()

  extHostServices = new Proxy(partialExtHostServices, {
    get (target, p) {
      const v = target[p as keyof ExtHostServices]
      if (v == null) {
        StandaloneServices.get(ILogService).warn(`ExtHost ${p as string} not registered`)
      }
      return v
    }
  }) as ExtHostServices
  extHostInitializedBarrier.open()
}

let initializePromise: Promise<void> | undefined
export async function initialize (): Promise<void> {
  if (initializePromise == null) {
    initializePromise = _initialize()
  }
  await initializePromise
}

export function getExtHostServices (): ExtHostServices {
  if (extHostServices == null) {
    throw new Error('Extension api not initialized')
  }
  return extHostServices
}

export function getConfigProvider (): ExtHostConfigProvider {
  if (configProvider == null) {
    throw new Error('Config provider not available')
  }
  return configProvider
}
