import { ExtHostCommands, IExtHostCommands } from 'vs/workbench/api/common/extHostCommands'
import { ExtHostRpcService, IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ILogService, LogLevel } from 'vs/platform/log/common/log'
import { MainThreadCommands } from 'vs/workbench/api/browser/mainThreadCommands'
import { IExtHostContext } from 'vs/workbench/services/extensions/common/extHostCustomers'
import { ExtensionHostKind, IExtensionService } from 'vs/workbench/services/extensions/common/extensions'
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
import { MainThreadQuickOpen } from 'vs/workbench/api/browser/mainThreadQuickOpen'
import { ExtHostMessageService } from 'vs/workbench/api/common/extHostMessageService'
import { MainThreadMessageService } from 'vs/workbench/api/browser/mainThreadMessageService'
import { ExtHostProgress } from 'vs/workbench/api/common/extHostProgress'
import { MainThreadProgress } from 'vs/workbench/api/browser/mainThreadProgress'
import { MainThreadDocumentContentProviders } from 'vs/workbench/api/browser/mainThreadDocumentContentProviders'
import { ExtHostDocumentContentProvider } from 'vs/workbench/api/common/extHostDocumentContentProviders'
import { ExtHostDocumentsAndEditors, IExtHostDocumentsAndEditors } from 'vs/workbench/api/common/extHostDocumentsAndEditors'
import { ExtHostEditors } from 'vs/workbench/api/common/extHostTextEditors'
import { MainThreadDocumentsAndEditors } from 'vs/workbench/api/browser/mainThreadDocumentsAndEditors'
import { MainThreadDiagnostics } from 'vs/workbench/api/browser/mainThreadDiagnostics'
import { MainThreadTelemetry } from 'vs/workbench/api/browser/mainThreadTelemetry'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ICommandService } from 'vs/platform/commands/common/commands'
import { INotificationService } from 'vs/platform/notification/common/notification'
import { IDialogService } from 'vs/platform/dialogs/common/dialogs'
import { ITextModelService } from 'vs/editor/common/services/resolverService'
import { IModelService } from 'vs/editor/common/services/model'
import { ILanguageService } from 'vs/editor/common/languages/language'
import { IQuickInputService } from 'vs/platform/quickinput/common/quickInput'
import { IEditorWorkerService } from 'vs/editor/common/services/editorWorker'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { IMarkerService } from 'vs/platform/markers/common/markers'
import { IClipboardService } from 'vs/platform/clipboard/common/clipboardService'
import { IEditorService } from 'vs/workbench/services/editor/common/editorService'
import { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite'
import { ITextFileService } from 'vs/workbench/services/textfile/common/textfiles'
import { IFileService } from 'vs/platform/files/common/files'
import { IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService'
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService'
import { IWorkingCopyFileService } from 'vs/workbench/services/workingCopy/common/workingCopyFileService'
import { IPathService } from 'vs/workbench/services/path/common/pathService'
import { IProgressService } from 'vs/platform/progress/common/progress'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry'
import { IProductService } from 'vs/platform/product/common/productService'
import { ExtHostBulkEdits } from 'vs/workbench/api/common/extHostBulkEdits'
import { MainThreadBulkEdits } from 'vs/workbench/api/browser/mainThreadBulkEdits'
import { IBulkEditService } from 'vs/editor/browser/services/bulkEditService'
import { ExtHostLanguages } from 'vs/workbench/api/common/extHostLanguages'
import { MainThreadLanguages } from 'vs/workbench/api/browser/mainThreadLanguages'
import { ILanguageStatusService } from 'vs/workbench/services/languageStatus/common/languageStatusService'
import { URITransformerService } from 'vs/workbench/api/common/extHostUriTransformerService'
import { ExtHostWindow, IExtHostWindow } from 'vs/workbench/api/common/extHostWindow'
import { MainThreadWindow } from 'vs/workbench/api/browser/mainThreadWindow'
import { IOpenerService } from 'vs/platform/opener/common/opener'
import { IHostService } from 'vs/workbench/services/host/browser/host'
import './missing-services'
import { MainThreadClipboard } from 'vs/workbench/api/browser/mainThreadClipboard'
import { ExtHostClipboard } from 'vs/workbench/api/common/extHostClipboard'
import { ExtHostTelemetry, IExtHostTelemetry } from 'vs/workbench/api/common/extHostTelemetry'
import { ExtHostLanguageFeatures } from 'vs/workbench/api/common/extHostLanguageFeatures'
import { MainThreadLanguageFeatures } from 'vs/workbench/api/browser/mainThreadLanguageFeatures'
import { ILanguageConfigurationService } from 'vs/editor/common/languages/languageConfigurationRegistry'
import { ILanguageFeaturesService } from 'vs/editor/common/services/languageFeatures'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration'
import { ExtHostConfigProvider, ExtHostConfiguration, IExtHostConfiguration } from 'vs/workbench/api/common/extHostConfiguration'
import { MainThreadConfiguration } from 'vs/workbench/api/browser/mainThreadConfiguration'
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace'
import { AbstractExtHostExtensionService, IExtHostExtensionService, IHostUtils } from 'vs/workbench/api/common/extHostExtensionService'
import { ExtensionStoragePaths, IExtensionStoragePaths } from 'vs/workbench/api/common/extHostStoragePaths'
import { IExtHostTunnelService } from 'vs/workbench/api/common/extHostTunnelService'
import { ExtHostLocalizationService, IExtHostLocalizationService } from 'vs/workbench/api/common/extHostLocalizationService'
import { ExtHostEditorTabs, IExtHostEditorTabs } from 'vs/workbench/api/common/extHostEditorTabs'
import { InstantiationType, registerSingleton } from 'vs/platform/instantiation/common/extensions'
import { IMessagePassingProtocol } from 'vs/base/parts/ipc/common/ipc'
import { BufferedEmitter } from 'vs/base/parts/ipc/common/ipc.net'
import { VSBuffer } from 'vs/base/common/buffer'
import { Event } from 'vs/base/common/event'
import { RPCProtocol } from 'vs/workbench/services/extensions/common/rpcProtocol'
import { ExtHostConsumerFileSystem, IExtHostConsumerFileSystem } from 'vs/workbench/api/common/extHostFileSystemConsumer'
import { IExtHostInitDataService } from 'vs/workbench/api/common/extHostInitDataService'
import { IEnvironment, UIKind } from 'vs/workbench/services/extensions/common/extensionHostProtocol'
import { ExtensionRuntime } from 'vs/workbench/api/common/extHostTypes'
import { IExtensionRegistries } from 'vs/workbench/api/common/extHost.api.impl'
import { unsupported } from '../tools'

class MainThreadMessageServiceWithoutSource extends MainThreadMessageService {
  override $showMessage: MainThreadMessageService['$showMessage'] = (severity, message, options, commands) => {
    // Remove the source from the message so there is no "Extension Settings" button on notifications
    const _options = {
      ...options,
      source: undefined
    }
    return super.$showMessage(severity, message, _options, commands)
  }
}

/**
 * The vscode ExtHostConfiguration use a barrier and its getConfigProvider returns a promise, let's use a simpler version
 */
export class SyncExtHostConfiguration extends ExtHostConfiguration {
  constructor (
    @IExtHostRpcService extHostRpc: IExtHostRpcService,
    @IExtHostWorkspace extHostWorkspace: IExtHostWorkspace,
    @ILogService logService: ILogService
  ) {
    super(extHostRpc, extHostWorkspace, logService)
  }

  public getConfigProviderSync (): ExtHostConfigProvider {
    // eslint-disable-next-line dot-notation
    return this['_actual']
  }
}

class SimpleMessagePassingProtocol implements IMessagePassingProtocol {
  private readonly _onMessage = new BufferedEmitter<VSBuffer>()
  readonly onMessage: Event<VSBuffer> = this._onMessage.event
  send (buffer: VSBuffer): void {
    this._onMessage.fire(buffer)
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
  logLevel = LogLevel.Trace
  get logsLocation () { return unsupported() }
  get logFile () { return unsupported() }
  autoStart = true
  remote = {
    isRemote: false,
    authority: undefined,
    connectionData: null
  }

  uiKind = UIKind.Web
  loggers = []
  logName = 'browser'
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
  _getEntryPoint = unsupported
  _loadCommonJSModule = unsupported
  $setRemoteEnvironment = unsupported
  override async _beforeAlmostReadyToRunExtensions () {}

  public getExtensionRegistries (): IExtensionRegistries {
    return { mine: this._myRegistry, all: this._globalRegistry }
  }
}
registerSingleton(IExtHostExtensionService, ExtHostExtensionService, InstantiationType.Eager)
registerSingleton(IExtHostConfiguration, SyncExtHostConfiguration, InstantiationType.Eager)
registerSingleton(IExtHostFileSystemInfo, ExtHostFileSystemInfo, InstantiationType.Eager)
registerSingleton(IExtHostTelemetry, ExtHostTelemetry, InstantiationType.Eager)
registerSingleton(IExtHostCommands, ExtHostCommands, InstantiationType.Eager)
registerSingleton(IExtHostDocumentsAndEditors, ExtHostDocumentsAndEditors, InstantiationType.Eager)
registerSingleton(IExtHostWindow, ExtHostWindow, InstantiationType.Eager)
registerSingleton(IExtHostWorkspace, ExtHostWorkspace, InstantiationType.Eager)
registerSingleton(IExtHostEditorTabs, ExtHostEditorTabs, InstantiationType.Eager)
registerSingleton(IExtHostApiDeprecationService, ExtHostApiDeprecationService, InstantiationType.Eager)

function createExtHostServices () {
  const commandsService = StandaloneServices.get(ICommandService)
  const notificationService = StandaloneServices.get(INotificationService)
  const dialogService = StandaloneServices.get(IDialogService)
  const textModelService = StandaloneServices.get(ITextModelService)
  const modelService = StandaloneServices.get(IModelService)
  const languageService = StandaloneServices.get(ILanguageService)
  const editorWorkerService = StandaloneServices.get(IEditorWorkerService)
  const quickInputService = StandaloneServices.get(IQuickInputService)
  const codeEditorService = StandaloneServices.get(ICodeEditorService)
  const markerService = StandaloneServices.get(IMarkerService)
  const clipboardService = StandaloneServices.get(IClipboardService)
  const editorService = StandaloneServices.get(IEditorService)
  const uriIdentityService = StandaloneServices.get(IUriIdentityService)
  const paneCompositePartService = StandaloneServices.get(IPaneCompositePartService)
  const textFileService = StandaloneServices.get(ITextFileService)
  const fileService = StandaloneServices.get(IFileService)
  const editorGroupsService = StandaloneServices.get(IEditorGroupsService)
  const workbenchEnvironmentService = StandaloneServices.get(IWorkbenchEnvironmentService)
  const workingCopyFileService = StandaloneServices.get(IWorkingCopyFileService)
  const pathService = StandaloneServices.get(IPathService)
  const progressService = StandaloneServices.get(IProgressService)
  const telemetryService = StandaloneServices.get(ITelemetryService)
  const productService = StandaloneServices.get(IProductService)
  const bulkEditService = StandaloneServices.get(IBulkEditService)
  const languageStatusService = StandaloneServices.get(ILanguageStatusService)
  const openerService = StandaloneServices.get(IOpenerService)
  const hostService = StandaloneServices.get(IHostService)
  const languageConfigurationService = StandaloneServices.get(ILanguageConfigurationService)
  const languageFeaturesService = StandaloneServices.get(ILanguageFeaturesService)
  const configurationService = StandaloneServices.get(IConfigurationService)
  const workspaceContextService = StandaloneServices.get(IWorkspaceContextService)
  const extensionService = StandaloneServices.get(IExtensionService)
  const logService = StandaloneServices.get(ILogService)
  const rpcProtocol = StandaloneServices.get(IExtHostRpcService)

  const mainContext: IMainContext & IExtHostContext = {
    remoteAuthority: null,
    extensionHostKind: ExtensionHostKind.LocalProcess,
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
    }
  }

  const extHostApiDeprecationService = StandaloneServices.get(IExtHostApiDeprecationService)
  const extHostMessageService = new ExtHostMessageService(rpcProtocol, logService)
  const uriTransformerService = new URITransformerService(null)

  // They must be defined BEFORE ExtHostCommands
  rpcProtocol.set(MainContext.MainThreadWindow, new MainThreadWindow(mainContext, hostService, openerService))
  rpcProtocol.set(MainContext.MainThreadCommands, new MainThreadCommands(mainContext, commandsService, extensionService))

  const extHostFileSystemInfo = rpcProtocol.set(ExtHostContext.ExtHostFileSystemInfo, StandaloneServices.get(IExtHostFileSystemInfo))
  rpcProtocol.set(ExtHostContext.ExtHostTunnelService, StandaloneServices.get(IExtHostTunnelService))
  const extHostTelemetry = rpcProtocol.set(ExtHostContext.ExtHostTelemetry, StandaloneServices.get(IExtHostTelemetry))
  const extHostCommands = rpcProtocol.set(ExtHostContext.ExtHostCommands, StandaloneServices.get(IExtHostCommands))
  const extHostDocumentsAndEditors = rpcProtocol.set(ExtHostContext.ExtHostDocumentsAndEditors, StandaloneServices.get(IExtHostDocumentsAndEditors))

  const extHostQuickOpen = rpcProtocol.set(ExtHostContext.ExtHostQuickOpen, createExtHostQuickOpen(mainContext, <IExtHostWorkspaceProvider><unknown>null, extHostCommands))
  const extHostDocuments = rpcProtocol.set(ExtHostContext.ExtHostDocuments, new ExtHostDocuments(mainContext, extHostDocumentsAndEditors))
  const extHostLanguages = rpcProtocol.set(ExtHostContext.ExtHostLanguages, new ExtHostLanguages(mainContext, extHostDocuments, extHostCommands.converter, uriTransformerService))
  const extHostDiagnostics = rpcProtocol.set(ExtHostContext.ExtHostDiagnostics, new ExtHostDiagnostics(mainContext, logService, extHostFileSystemInfo, extHostDocumentsAndEditors))
  const extHostProgress = rpcProtocol.set(ExtHostContext.ExtHostProgress, new ExtHostProgress(rpcProtocol.getProxy(MainContext.MainThreadProgress)))
  const extHostDocumentContentProviders = rpcProtocol.set(ExtHostContext.ExtHostDocumentContentProviders, new ExtHostDocumentContentProvider(mainContext, extHostDocumentsAndEditors, logService))
  const extHostEditors = rpcProtocol.set(ExtHostContext.ExtHostEditors, new ExtHostEditors(mainContext, extHostDocumentsAndEditors))
  const extHostLanguageFeatures = rpcProtocol.set(ExtHostContext.ExtHostLanguageFeatures, new ExtHostLanguageFeatures(rpcProtocol, uriTransformerService, extHostDocuments, extHostCommands, extHostDiagnostics, logService, extHostApiDeprecationService, extHostTelemetry))
  const extHostClipboard = new ExtHostClipboard(mainContext)

  const extHostWindow = rpcProtocol.set(ExtHostContext.ExtHostWindow, StandaloneServices.get(IExtHostWindow))
  const extHostWorkspace = rpcProtocol.set(ExtHostContext.ExtHostWorkspace, StandaloneServices.get(IExtHostWorkspace))
  const extHostConfiguration = rpcProtocol.set(ExtHostContext.ExtHostConfiguration, StandaloneServices.get(IExtHostConfiguration)) as SyncExtHostConfiguration
  const extHostExtensionService = rpcProtocol.set(ExtHostContext.ExtHostExtensionService, StandaloneServices.get(IExtHostExtensionService)) as ExtHostExtensionService

  rpcProtocol.set(MainContext.MainThreadMessageService, new MainThreadMessageServiceWithoutSource(mainContext, notificationService, commandsService, dialogService))
  rpcProtocol.set(MainContext.MainThreadDiagnostics, new MainThreadDiagnostics(mainContext, markerService, uriIdentityService))
  rpcProtocol.set(MainContext.MainThreadQuickOpen, new MainThreadQuickOpen(mainContext, quickInputService))
  rpcProtocol.set(MainContext.MainThreadTelemetry, new MainThreadTelemetry(mainContext, telemetryService, configurationService, workbenchEnvironmentService, productService))
  rpcProtocol.set(MainContext.MainThreadProgress, new MainThreadProgress(mainContext, progressService, commandsService))
  rpcProtocol.set(MainContext.MainThreadDocumentContentProviders, new MainThreadDocumentContentProviders(mainContext, textModelService, languageService, modelService, editorWorkerService))
  rpcProtocol.set(MainContext.MainThreadBulkEdits, new MainThreadBulkEdits(mainContext, bulkEditService, logService, uriIdentityService))
  rpcProtocol.set(MainContext.MainThreadLanguages, new MainThreadLanguages(mainContext, languageService, modelService, textModelService, languageStatusService))
  rpcProtocol.set(MainContext.MainThreadClipboard, new MainThreadClipboard(mainContext, clipboardService))
  rpcProtocol.set(MainContext.MainThreadLanguageFeatures, new MainThreadLanguageFeatures(mainContext, languageService, languageConfigurationService, languageFeaturesService, uriIdentityService))
  rpcProtocol.set(MainContext.MainThreadConfiguration, new MainThreadConfiguration(mainContext, workspaceContextService, configurationService, workbenchEnvironmentService))

  void new MainThreadDocumentsAndEditors(
    mainContext,
    modelService,
    textFileService,
    editorService,
    codeEditorService,
    fileService,
    textModelService,
    editorGroupsService,
    paneCompositePartService,
    workbenchEnvironmentService,
    workingCopyFileService,
    uriIdentityService,
    clipboardService,
    pathService,
    configurationService
  )

  const extHostBulkEdits = new ExtHostBulkEdits(rpcProtocol, extHostDocumentsAndEditors)

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
    extHostExtensionService
  }
}

type ExtHostServices = ReturnType<typeof createExtHostServices>
let extHostServices: ExtHostServices | undefined

export function getExtHostServices (): ExtHostServices {
  if (extHostServices == null) {
    extHostServices = createExtHostServices()
  }
  return extHostServices
}
