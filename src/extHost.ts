import type { ExtHostDiagnostics } from 'vs/workbench/api/common/extHostDiagnostics'
import type { IExtHostFileSystemInfo } from 'vs/workbench/api/common/extHostFileSystemInfo'
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
import { IExtHostConfiguration } from 'vs/workbench/api/common/extHostConfiguration'
import { IExtHostManagedSockets } from 'vs/workbench/api/common/extHostManagedSockets'
import { BrandedService, IInstantiationService, ServiceIdentifier, ServicesAccessor } from 'vs/platform/instantiation/common/instantiation'
import { IExtHostInitDataService } from 'vs/workbench/api/common/extHostInitDataService'
import { IExtensionHostInitData, UIKind } from 'vs/workbench/services/extensions/common/extensionHostProtocol'
import { ExtHostVariableResolverProviderService, IExtHostVariableResolverProvider } from 'vs/workbench/api/common/extHostVariableResolverService'
import { IExtHostExtensionService, IHostUtils } from 'vs/workbench/api/common/extHostExtensionService'
import { ExtensionStoragePaths, IExtensionStoragePaths } from 'vs/workbench/api/common/extHostStoragePaths'
import { ExtHostTunnelService, IExtHostTunnelService } from 'vs/workbench/api/common/extHostTunnelService'
import { ExtHostMessageService } from 'vs/workbench/api/common/extHostMessageService'
import { ExtHostRpcService, IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ILogService, ILoggerService } from 'vs/platform/log/common/log'
import { ExtHostApiDeprecationService, IExtHostApiDeprecationService } from 'vs/workbench/api/common/extHostApiDeprecationService'
import { ExtHostContext } from 'vs/workbench/api/common/extHost.protocol'
import { IMessagePassingProtocol } from 'vs/base/parts/ipc/common/ipc'
import { BufferedEmitter } from 'vs/base/parts/ipc/common/ipc.net'
import { VSBuffer } from 'vs/base/common/buffer'
import { RPCProtocol } from 'vs/workbench/services/extensions/common/rpcProtocol'
import { DeferredPromise } from 'vs/base/common/async'
import type { IExtHostDecorations } from 'vs/workbench/api/common/extHostDecorations'
import * as toposort from 'toposort'
import { ServiceCollection } from 'vs/platform/instantiation/common/serviceCollection'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { InstantiationService } from 'vs/platform/instantiation/common/instantiationService'
import { ExtHostLogService } from 'vs/workbench/api/common/extHostLogService'
import { InstantiationType } from 'vs/platform/instantiation/common/extensions'
import { ExtHostLoggerService } from 'vs/workbench/api/common/extHostLoggerService'
import { IURITransformerService, URITransformerService } from 'vs/workbench/api/common/extHostUriTransformerService'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IProductService } from 'vs/platform/product/common/productService'
import { IWorkspaceContextService, WorkbenchState } from 'vs/platform/workspace/common/workspace'
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService'
import { ILabelService } from 'vs/platform/label/common/label'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry'
import { joinPath } from 'vs/base/common/resources'
import { isLoggingOnly } from 'vs/platform/telemetry/common/telemetryUtils'
import * as platform from 'vs/base/common/platform'
import { unsupported } from './tools'
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

export const extHostInstantiationService = new InstantiationService(serviceCollection, false)

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

const [mainThreadMessagePassingProtocol, extHostMessagePassingProtocol] = createMessagePassingProtocolPair()

registerExtHostSingleton(ILogService, new SyncDescriptor(ExtHostLogService, [true], true))
registerExtHostSingleton(ILoggerService, ExtHostLoggerService, InstantiationType.Delayed)

registerExtHostSingleton(IExtensionStoragePaths, ExtensionStoragePaths, InstantiationType.Delayed)
registerExtHostSingleton(IExtHostExtensionService, ExtHostExtensionService, InstantiationType.Delayed)
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

type ExtHostProvider = {
  provide: (accessor: ServicesAccessor, services: Partial<ExtHostServices>) => Partial<ExtHostServices>
  dependencies?: string[]
}
const extHostProviders: Map<string, ExtHostProvider> = new Map()
export function registerExtHostProvider (name: string, provider: ExtHostProvider): void {
  extHostProviders.set(name, provider)
}

export interface ExtHostServices {
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
  extHostExtensionService: IExtHostExtensionService
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

export function createExtHostServices (accessor: ServicesAccessor): Partial<ExtHostServices> {
  // services
  const rpcProtocol = accessor.get(IExtHostRpcService)
  const logService = accessor.get(ILogService)
  const extHostApiDeprecationService = accessor.get(IExtHostApiDeprecationService)
  const extHostTunnelService = accessor.get(IExtHostTunnelService)
  const extHostInitData = accessor.get(IExtHostInitDataService)

  rpcProtocol.set(ExtHostContext.ExtHostTunnelService, extHostTunnelService)

  const extHostExtensionService = rpcProtocol.set(ExtHostContext.ExtHostExtensionService, accessor.get(IExtHostExtensionService))

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
    Object.assign(extHostServices, extHostProvider.provide(accessor, extHostServices))
  }

  return extHostServices
}

async function createExtHostInitData (accessor: ServicesAccessor): Promise<IExtensionHostInitData> {
  const contextService = accessor.get(IWorkspaceContextService)
  const environmentService = accessor.get(IWorkbenchEnvironmentService)
  const productService = accessor.get(IProductService)
  const labelService = accessor.get(ILabelService)
  const userDataProfilesService = accessor.get(IUserDataProfilesService)
  const telemetryService = accessor.get(ITelemetryService)
  const logService = accessor.get(ILogService)
  const loggerService = accessor.get(ILoggerService)

  const extensionHostLogsLocation = joinPath(environmentService.extHostLogsPath, 'local')

  const workspace = contextService.getWorkspace()
  return {
    commit: productService.commit,
    version: productService.version,
    quality: productService.quality,
    parentPid: 0,
    environment: {
      isExtensionDevelopmentDebug: environmentService.debugRenderer,
      appName: productService.nameLong,
      appHost: productService.embedderIdentifier ?? (platform.isWeb ? 'web' : 'desktop'),
      appUriScheme: productService.urlProtocol,
      appLanguage: platform.language,
      extensionTelemetryLogResource: environmentService.extHostTelemetryLogFile,
      isExtensionTelemetryLoggingOnly: isLoggingOnly(productService, environmentService),
      extensionDevelopmentLocationURI: environmentService.extensionDevelopmentLocationURI,
      extensionTestsLocationURI: environmentService.extensionTestsLocationURI,
      globalStorageHome: userDataProfilesService.defaultProfile.globalStorageHome,
      workspaceStorageHome: environmentService.workspaceStorageHome,
      extensionLogLevel: environmentService.extensionLogLevel
    },
    workspace: contextService.getWorkbenchState() === WorkbenchState.EMPTY
      ? undefined
      : {
          configuration: workspace.configuration ?? undefined,
          id: workspace.id,
          name: labelService.getWorkspaceLabel(workspace),
          transient: workspace.transient
        },
    consoleForward: {
      includeStack: false,
      logNative: environmentService.debugRenderer
    },
    allExtensions: [],
    activationEvents: {},
    myExtensions: [],
    telemetryInfo: {
      sessionId: telemetryService.sessionId,
      machineId: telemetryService.machineId,
      firstSessionDate: telemetryService.firstSessionDate,
      msftInternal: telemetryService.msftInternal
    },
    logLevel: logService.getLevel(),
    loggers: [...loggerService.getRegisteredLoggers()],
    logsLocation: extensionHostLogsLocation,
    autoStart: true,
    remote: {
      authority: environmentService.remoteAuthority,
      connectionData: null,
      isRemote: false
    },
    uiKind: UIKind.Web
  }
}

const extHostExtensionServicePromise = new DeferredPromise<IExtHostExtensionService>()

const hostUtil = new class implements IHostUtils {
  declare readonly _serviceBrand: undefined
  public readonly pid = undefined
  exit (_code?: number | undefined): void {
    window.close()
  }

  async exists (_path: string): Promise<boolean> {
    return true
  }

  async realpath (path: string): Promise<string> {
    return path
  }
}()

async function initExtHost (accessor: ServicesAccessor, initData: IExtensionHostInitData) {
  const rpcProtocol = new RPCProtocol(mainThreadMessagePassingProtocol)

  serviceCollection.set(IExtHostInitDataService, { _serviceBrand: undefined, ...initData })
  serviceCollection.set(IExtHostRpcService, new ExtHostRpcService(rpcProtocol))
  serviceCollection.set(IURITransformerService, new URITransformerService(null))
  serviceCollection.set(IHostUtils, hostUtil)

  const extensionService = accessor.get(IExtHostExtensionService)
  await extensionService.initialize()

  void extHostExtensionServicePromise.complete(extensionService)
}

export function onExtHostInitialized (fct: () => void): void {
  void extHostExtensionServicePromise.p.then(fct)
}

export function getExtHostExtensionService (): Promise<IExtHostExtensionService> {
  return extHostExtensionServicePromise.p
}

async function _initialize (): Promise<void> {
  const initData = await StandaloneServices.get(IInstantiationService).invokeFunction(createExtHostInitData)
  await extHostInstantiationService.invokeFunction(initExtHost, initData)
}

let initializePromise: Promise<void> | undefined
export async function initialize (): Promise<void> {
  if (initializePromise == null) {
    initializePromise = _initialize()
  }
  await initializePromise
}

export {
  extHostMessagePassingProtocol
}
