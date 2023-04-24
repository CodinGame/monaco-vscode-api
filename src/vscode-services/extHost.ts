import './missing-services'
import { ExtHostCommands, IExtHostCommands } from 'vs/workbench/api/common/extHostCommands'
import { ExtHostRpcService, IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ILogService, LogLevel } from 'vs/platform/log/common/log'
import { ExtHostCustomersRegistry, IInternalExtHostContext } from 'vs/workbench/services/extensions/common/extHostCustomers'
import { ExtensionHostKind } from 'vs/workbench/services/extensions/common/extensionHostKind'
import { URI } from 'vs/base/common/uri'
import { ExtHostApiDeprecationService, IExtHostApiDeprecationService } from 'vs/workbench/api/common/extHostApiDeprecationService'
import {
  ExtHostContext, IMainContext, MainContext
} from 'vs/workbench/api/common/extHost.protocol'
import { ExtHostDiagnostics } from 'vs/workbench/api/common/extHostDiagnostics'
import { ExtHostFileSystemInfo, IExtHostFileSystemInfo } from 'vs/workbench/api/common/extHostFileSystemInfo'
import { Proxied, ProxyIdentifier } from 'vs/workbench/services/extensions/common/proxyIdentifier'
import { ExtHostDocuments } from 'vs/workbench/api/common/extHostDocuments'
import { createExtHostQuickOpen } from 'vs/workbench/api/common/extHostQuickOpen'
import { ExtHostWorkspace, IExtHostWorkspace, IExtHostWorkspaceProvider } from 'vs/workbench/api/common/extHostWorkspace'
import { ExtHostMessageService } from 'vs/workbench/api/common/extHostMessageService'
import { ExtHostProgress } from 'vs/workbench/api/common/extHostProgress'
import { ExtHostDocumentContentProvider } from 'vs/workbench/api/common/extHostDocumentContentProviders'
import { ExtHostDocumentsAndEditors, IExtHostDocumentsAndEditors } from 'vs/workbench/api/common/extHostDocumentsAndEditors'
import { ExtHostEditors } from 'vs/workbench/api/common/extHostTextEditors'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ExtHostBulkEdits } from 'vs/workbench/api/common/extHostBulkEdits'
import { ExtHostLanguages } from 'vs/workbench/api/common/extHostLanguages'
import { IURITransformerService } from 'vs/workbench/api/common/extHostUriTransformerService'
import { ExtHostWindow, IExtHostWindow } from 'vs/workbench/api/common/extHostWindow'
import { ExtHostClipboard } from 'vs/workbench/api/common/extHostClipboard'
import { ExtHostTelemetry, IExtHostTelemetry } from 'vs/workbench/api/common/extHostTelemetry'
import { ExtHostLanguageFeatures } from 'vs/workbench/api/common/extHostLanguageFeatures'
import { ExtHostConfigProvider, ExtHostConfiguration, IExtHostConfiguration } from 'vs/workbench/api/common/extHostConfiguration'
import { IExtHostDebugService, WorkerExtHostDebugService } from 'vs/workbench/api/common/extHostDebugService'
import { ExtHostVariableResolverProviderService, IExtHostVariableResolverProvider } from 'vs/workbench/api/common/extHostVariableResolverService'
import { AbstractExtHostExtensionService, IExtHostExtensionService, IHostUtils } from 'vs/workbench/api/common/extHostExtensionService'
import { ExtensionStoragePaths, IExtensionStoragePaths } from 'vs/workbench/api/common/extHostStoragePaths'
import { ExtHostTunnelService, IExtHostTunnelService } from 'vs/workbench/api/common/extHostTunnelService'
import { ExtHostLocalizationService, IExtHostLocalizationService } from 'vs/workbench/api/common/extHostLocalizationService'
import { ExtHostEditorTabs, IExtHostEditorTabs } from 'vs/workbench/api/common/extHostEditorTabs'
import { InstantiationType, registerSingleton } from 'vs/platform/instantiation/common/extensions'
import { IMessagePassingProtocol } from 'vs/base/parts/ipc/common/ipc'
import { BufferedEmitter } from 'vs/base/parts/ipc/common/ipc.net'
import { VSBuffer } from 'vs/base/common/buffer'
import { Emitter, Event } from 'vs/base/common/event'
import { RPCProtocol } from 'vs/workbench/services/extensions/common/rpcProtocol'
import { ExtHostConsumerFileSystem, IExtHostConsumerFileSystem } from 'vs/workbench/api/common/extHostFileSystemConsumer'
import { IExtHostInitDataService } from 'vs/workbench/api/common/extHostInitDataService'
import { IEnvironment, UIKind } from 'vs/workbench/services/extensions/common/extensionHostProtocol'
import { IExtHostTerminalService } from 'vs/workbench/api/common/extHostTerminalService'
import { IExtHostDecorations, ExtHostDecorations } from 'vs/workbench/api/common/extHostDecorations'
import { ExtensionRuntime } from 'vs/workbench/api/common/extHostTypes'
import { ExtHostFileSystem } from 'vs/workbench/api/common/extHostFileSystem'
import { IExtensionRegistries } from 'vs/workbench/api/common/extHost.api.impl'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { ExtHostDocumentSaveParticipant } from 'vs/workbench/api/common/extHostDocumentSaveParticipant'
import { ExtHostFileSystemEventService } from 'vs/workbench/api/common/extHostFileSystemEventService'
import { MainThreadMessageService } from 'vs/workbench/api/browser/mainThreadMessageService'
import { ExtHostApiCommands } from 'vs/workbench/api/common/extHostApiCommands'
import { ExtHostOutputService, IExtHostOutputService } from 'vs/workbench/api/common/extHostOutput'
import 'vs/workbench/api/browser/mainThreadCommands'
import 'vs/workbench/api/browser/mainThreadWindow'
import 'vs/workbench/api/browser/mainThreadDiagnostics'
import 'vs/workbench/api/browser/mainThreadQuickOpen'
import 'vs/workbench/api/browser/mainThreadTelemetry'
import 'vs/workbench/api/browser/mainThreadProgress'
import 'vs/workbench/api/browser/mainThreadDocumentContentProviders'
import 'vs/workbench/api/browser/mainThreadBulkEdits'
import 'vs/workbench/api/browser/mainThreadLanguages'
import 'vs/workbench/api/browser/mainThreadClipboard'
import 'vs/workbench/api/browser/mainThreadLanguageFeatures'
import 'vs/workbench/api/browser/mainThreadConfiguration'
import 'vs/workbench/api/browser/mainThreadDebugService'
import 'vs/workbench/api/browser/mainThreadConsole'
import 'vs/workbench/api/browser/mainThreadWorkspace'
import 'vs/workbench/api/browser/mainThreadExtensionService'
import 'vs/workbench/api/browser/mainThreadFileSystem'
import 'vs/workbench/api/browser/mainThreadFileSystemEventService'
import 'vs/workbench/api/browser/mainThreadDocumentsAndEditors'
import 'vs/workbench/api/browser/mainThreadOutputService'
import 'vs/workbench/api/browser/mainThreadSaveParticipant'
import * as errors from 'vs/base/common/errors'
import { unsupported } from '../tools'

const original = MainThreadMessageService.prototype.$showMessage
MainThreadMessageService.prototype.$showMessage = function (severity, message, options, commands) {
  // Remove the source from the message so there is no "Extension Settings" button on notifications
  const _options = {
    ...options,
    source: undefined
  }
  return original.call(this, severity, message, _options, commands)
}

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

class InjectedExtHostRpcService extends ExtHostRpcService {
  constructor () {
    super(rpcProtocol)
  }
}

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

registerSingleton(IExtHostInitDataService, class ExtHostInitDataService implements IExtHostInitDataService {
  _serviceBrand: undefined
  version = '1.0.0'
  parentPid = 0
  environment = environment
  allExtensions = []
  myExtensions = []
  consoleForward = {
    includeStack: false,
    logNative: false
  }

  get telemetryInfo () { return unsupported() }
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
}, InstantiationType.Eager)

registerSingleton(IHostUtils, class HostUtils implements IHostUtils {
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
}, InstantiationType.Eager)
registerSingleton(IExtHostRpcService, InjectedExtHostRpcService, InstantiationType.Eager)
registerSingleton(IExtHostFileSystemInfo, ExtHostFileSystemInfo, InstantiationType.Eager)
registerSingleton(IExtHostConsumerFileSystem, ExtHostConsumerFileSystem, InstantiationType.Eager)
registerSingleton(IExtensionStoragePaths, ExtensionStoragePaths, InstantiationType.Eager)
registerSingleton(IExtHostLocalizationService, ExtHostLocalizationService, InstantiationType.Delayed)
registerSingleton(IExtHostDocumentsAndEditors, ExtHostDocumentsAndEditors, InstantiationType.Eager)
class ExtHostExtensionService extends AbstractExtHostExtensionService {
  extensionRuntime = ExtensionRuntime.Webworker
  _getEntryPoint = () => undefined
  _loadCommonJSModule = unsupported
  $setRemoteEnvironment = unsupported
  override async _beforeAlmostReadyToRunExtensions () {}

  public getExtensionRegistries (): IExtensionRegistries {
    return { mine: this._myRegistry, all: this._globalRegistry }
  }
}
registerSingleton(IExtHostExtensionService, ExtHostExtensionService, InstantiationType.Eager)
registerSingleton(IExtHostConfiguration, ExtHostConfiguration, InstantiationType.Eager)
registerSingleton(IExtHostTunnelService, ExtHostTunnelService, InstantiationType.Eager)
registerSingleton(IExtHostFileSystemInfo, ExtHostFileSystemInfo, InstantiationType.Eager)
registerSingleton(IExtHostTelemetry, ExtHostTelemetry, InstantiationType.Eager)
registerSingleton(IExtHostCommands, ExtHostCommands, InstantiationType.Eager)
registerSingleton(IExtHostDocumentsAndEditors, ExtHostDocumentsAndEditors, InstantiationType.Eager)
registerSingleton(IExtHostWindow, ExtHostWindow, InstantiationType.Eager)
registerSingleton(IExtHostWorkspace, ExtHostWorkspace, InstantiationType.Eager)
registerSingleton(IExtHostEditorTabs, ExtHostEditorTabs, InstantiationType.Eager)
registerSingleton(IExtHostApiDeprecationService, ExtHostApiDeprecationService, InstantiationType.Eager)
registerSingleton(IExtHostDecorations, ExtHostDecorations, InstantiationType.Eager)
registerSingleton(IExtHostDebugService, WorkerExtHostDebugService, InstantiationType.Eager)
registerSingleton(IExtHostVariableResolverProvider, ExtHostVariableResolverProviderService, InstantiationType.Eager)
registerSingleton(IExtHostOutputService, ExtHostOutputService, InstantiationType.Delayed)
registerSingleton(IExtHostTerminalService, class ExtHostTerminalService implements IExtHostTerminalService {
  _serviceBrand: undefined
  activeTerminal = undefined
  terminals = []
  onDidCloseTerminal = Event.None
  onDidOpenTerminal = Event.None
  onDidChangeActiveTerminal = Event.None
  onDidChangeTerminalDimensions = Event.None
  onDidChangeTerminalState = Event.None
  onDidWriteTerminalData = Event.None
  onDidChangeShell = Event.None
  createTerminal = unsupported
  createTerminalFromOptions = unsupported
  createExtensionTerminal = unsupported
  attachPtyToTerminal = unsupported
  getDefaultShell = unsupported
  getDefaultShellArgs = unsupported
  registerLinkProvider = unsupported
  registerProfileProvider = unsupported
  registerTerminalQuickFixProvider = unsupported
  getEnvironmentVariableCollection = unsupported
  $acceptTerminalClosed = unsupported
  $acceptTerminalOpened = unsupported
  $acceptActiveTerminalChanged = unsupported
  $acceptTerminalProcessId = unsupported
  $acceptTerminalProcessData = unsupported
  $acceptTerminalTitleChange = unsupported
  $acceptTerminalDimensions = unsupported
  $acceptTerminalMaximumDimensions = unsupported
  $acceptTerminalInteraction = unsupported
  $startExtensionTerminal = unsupported
  $acceptProcessAckDataEvent = unsupported
  $acceptProcessInput = unsupported
  $acceptProcessResize = unsupported
  $acceptProcessShutdown = unsupported
  $acceptProcessRequestInitialCwd = unsupported
  $acceptProcessRequestCwd = unsupported
  $acceptProcessRequestLatency = unsupported
  $provideLinks = unsupported
  $activateLink = unsupported
  $initEnvironmentVariableCollections = unsupported
  $acceptDefaultProfile = unsupported
  $createContributedProfileTerminal = unsupported
  $provideTerminalQuickFixes = unsupported
  dispose = unsupported
}, InstantiationType.Eager)

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
  _setExtensionHostProxy () {},
  _setAllMainProxyIdentifiers () {}
}

async function createExtHostServices () {
  // services
  const rpcProtocol = StandaloneServices.get(IExtHostRpcService)
  const instantiationService = StandaloneServices.get(IInstantiationService)
  const logService = StandaloneServices.get(ILogService)
  const extHostConsumerFileSystem = StandaloneServices.get(IExtHostConsumerFileSystem)
  const extHostApiDeprecationService = StandaloneServices.get(IExtHostApiDeprecationService)
  const uriTransformerService = StandaloneServices.get(IURITransformerService)
  const extHostFileSystemInfo = StandaloneServices.get(IExtHostFileSystemInfo)
  const extHostTunnelService = StandaloneServices.get(IExtHostTunnelService)
  const extHostTelemetry = StandaloneServices.get(IExtHostTelemetry)

  // register addressable instances
  rpcProtocol.set(ExtHostContext.ExtHostFileSystemInfo, extHostFileSystemInfo)
  rpcProtocol.set(ExtHostContext.ExtHostTunnelService, extHostTunnelService)
  rpcProtocol.set(ExtHostContext.ExtHostTelemetry, extHostTelemetry)

  // automatically create and register addressable instances
  const extHostCommands = rpcProtocol.set(ExtHostContext.ExtHostCommands, StandaloneServices.get(IExtHostCommands))
  const extHostDocumentsAndEditors = rpcProtocol.set(ExtHostContext.ExtHostDocumentsAndEditors, StandaloneServices.get(IExtHostDocumentsAndEditors))

  // manually create and register addressable instances
  const extHostQuickOpen = rpcProtocol.set(ExtHostContext.ExtHostQuickOpen, createExtHostQuickOpen(mainContext, <IExtHostWorkspaceProvider><unknown>null, extHostCommands))
  const extHostDocuments = rpcProtocol.set(ExtHostContext.ExtHostDocuments, new ExtHostDocuments(mainContext, extHostDocumentsAndEditors))
  const extHostLanguages = rpcProtocol.set(ExtHostContext.ExtHostLanguages, new ExtHostLanguages(mainContext, extHostDocuments, extHostCommands.converter, uriTransformerService))
  const extHostDiagnostics = rpcProtocol.set(ExtHostContext.ExtHostDiagnostics, new ExtHostDiagnostics(mainContext, logService, extHostFileSystemInfo, extHostDocumentsAndEditors))
  const extHostProgress = rpcProtocol.set(ExtHostContext.ExtHostProgress, new ExtHostProgress(rpcProtocol.getProxy(MainContext.MainThreadProgress)))
  const extHostDocumentContentProviders = rpcProtocol.set(ExtHostContext.ExtHostDocumentContentProviders, new ExtHostDocumentContentProvider(mainContext, extHostDocumentsAndEditors, logService))
  const extHostEditors = rpcProtocol.set(ExtHostContext.ExtHostEditors, new ExtHostEditors(mainContext, extHostDocumentsAndEditors))
  const extHostLanguageFeatures = rpcProtocol.set(ExtHostContext.ExtHostLanguageFeatures, new ExtHostLanguageFeatures(rpcProtocol, uriTransformerService, extHostDocuments, extHostCommands, extHostDiagnostics, logService, extHostApiDeprecationService, extHostTelemetry))
  const extHostDebugService: IExtHostDebugService = rpcProtocol.set(ExtHostContext.ExtHostDebugService, StandaloneServices.get(IExtHostDebugService))
  const extHostWindow = rpcProtocol.set(ExtHostContext.ExtHostWindow, StandaloneServices.get(IExtHostWindow))
  const extHostWorkspace = rpcProtocol.set(ExtHostContext.ExtHostWorkspace, StandaloneServices.get(IExtHostWorkspace))
  const extHostConfiguration = rpcProtocol.set(ExtHostContext.ExtHostConfiguration, StandaloneServices.get(IExtHostConfiguration))
  const extHostExtensionService = rpcProtocol.set(ExtHostContext.ExtHostExtensionService, StandaloneServices.get(IExtHostExtensionService)) as ExtHostExtensionService
  const extHostOutputService = rpcProtocol.set(ExtHostContext.ExtHostOutputService, StandaloneServices.get(IExtHostOutputService))
  const extHostFileSystem = rpcProtocol.set(ExtHostContext.ExtHostFileSystem, new ExtHostFileSystem(rpcProtocol, extHostLanguageFeatures))
  const extHostDocumentSaveParticipant = rpcProtocol.set(ExtHostContext.ExtHostDocumentSaveParticipant, new ExtHostDocumentSaveParticipant(logService, extHostDocuments, rpcProtocol.getProxy(MainContext.MainThreadBulkEdits)))
  const extHostFileSystemEvent = rpcProtocol.set(ExtHostContext.ExtHostFileSystemEventService, new ExtHostFileSystemEventService(rpcProtocol, logService, extHostDocumentsAndEditors))

  // Other instances
  const extHostBulkEdits = new ExtHostBulkEdits(rpcProtocol, extHostDocumentsAndEditors)
  const extHostClipboard = new ExtHostClipboard(mainContext)
  const extHostMessageService = new ExtHostMessageService(rpcProtocol, logService)

  // Register API-ish commands
  ExtHostApiCommands.register(extHostCommands)

  // Named customers
  const namedCustomers = ExtHostCustomersRegistry.getNamedCustomers()
  for (let i = 0, len = namedCustomers.length; i < len; i++) {
    const [id, ctor] = namedCustomers[i]!
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

  await extHostExtensionService.initialize()

  return {
    extHostLogService: logService,
    extHostApiDeprecationService,
    extHostMessageService,
    extHostDocumentsAndEditors,
    extHostBulkEdits,
    extHostDocuments,
    extHostDocumentContentProviders,
    extHostQuickOpen,
    extHostProgress,
    extHostDiagnostics,
    extHostEditors,
    extHostCommands,
    extHostLanguages,
    extHostWindow,
    extHostClipboard,
    extHostLanguageFeatures,
    extHostWorkspace,
    extHostConfiguration,
    extHostTelemetry,
    extHostDebugService,
    extHostFileSystem,
    extHostConsumerFileSystem,
    extHostExtensionService,
    extHostDocumentSaveParticipant,
    extHostFileSystemEvent,
    extHostOutputService
  }
}

type ExtHostServices = Awaited<ReturnType<typeof createExtHostServices>>
let extHostServices: ExtHostServices | undefined
let configProvider: ExtHostConfigProvider | undefined

let initializePromise: Promise<void> | undefined

const extHostInitializedEmitter = new Emitter<void>()
export const onExtHostInitialized: Event<void> = extHostInitializedEmitter.event

async function _initialize (): Promise<void> {
  extHostServices = await createExtHostServices()
  configProvider = await extHostServices.extHostConfiguration.getConfigProvider()
  extHostInitializedEmitter.fire()
}

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
    throw new Error('Extension api not initialized')
  }
  return configProvider
}
