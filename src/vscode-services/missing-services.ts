import '../polyfill'
import { Event } from 'vs/base/common/event'
import { DomEmitter } from 'vs/base/browser/event'
import { URI } from 'vs/base/common/uri'
import { trackFocus } from 'vs/base/browser/dom'
import { IEditorService } from 'vs/workbench/services/editor/common/editorService'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite'
import { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity'
import { ITextFileService } from 'vs/workbench/services/textfile/common/textfiles'
import { IFileService } from 'vs/platform/files/common/files'
import { GroupOrientation, IEditorGroup, IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService'
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService'
import { IWorkingCopyFileService, WorkingCopyFileService } from 'vs/workbench/services/workingCopy/common/workingCopyFileService'
import { IPathService } from 'vs/workbench/services/path/common/pathService'
import { InstantiationType, registerSingleton } from 'vs/platform/instantiation/common/extensions'
import { IProductService } from 'vs/platform/product/common/productService'
import { ILanguageStatus, ILanguageStatusService } from 'vs/workbench/services/languageStatus/common/languageStatusService'
import { ITextModel } from 'vs/editor/common/model'
import { LanguageFeatureRegistry } from 'vs/editor/common/languageFeatureRegistry'
import { compare } from 'vs/base/common/strings'
import { IHostService } from 'vs/workbench/services/host/browser/host'
import { ILifecycleService } from 'vs/workbench/services/lifecycle/common/lifecycle'
import { ILanguageDetectionService } from 'vs/workbench/services/languageDetection/common/languageDetectionWorkerService'
import { IExtensionService, NullExtensionService } from 'vs/workbench/services/extensions/common/extensions'
import { IKeyboardLayoutService } from 'vs/platform/keyboardLayout/common/keyboardLayout'
import { OS } from 'vs/base/common/platform'
import { IEnvironmentService } from 'vs/platform/environment/common/environment'
import { IUserDataInitializationService } from 'vs/workbench/services/userData/browser/userDataInit'
import { IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService'
import { BrowserHostColorSchemeService } from 'vs/workbench/services/themes/browser/browserHostColorSchemeService'
import { IHostColorSchemeService } from 'vs/workbench/services/themes/common/hostColorSchemeService'
import { IPreferencesService } from 'vs/workbench/services/preferences/common/preferences'
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { IUserDataProfile, IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile'
import { IPolicyService } from 'vs/platform/policy/common/policy'
import { IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile'
import { UserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfileService'
import { ISnippetsService } from 'vs/workbench/contrib/snippets/browser/snippets'
import { AbstractLoggerService, ILogger, ILoggerService, LogLevel, NullLogger } from 'vs/platform/log/common/log'
import { IDisposable } from 'vs/base/common/lifecycle'
import { FallbackKeyboardMapper } from 'vs/workbench/services/keybinding/common/fallbackKeyboardMapper'
import { ITextMateTokenizationService } from 'vs/workbench/services/textMate/browser/textMateTokenizationFeature'
import { IDebugService, IDebugModel, IViewModel, IAdapterManager } from 'vs/workbench/contrib/debug/common/debug'
import { IWorkspaceTrustRequestService } from 'vs/platform/workspace/common/workspaceTrust'
import { IActivityService } from 'vs/workbench/services/activity/common/activity'
import { IExtensionHostDebugService } from 'vs/platform/debug/common/extensionHostDebug'
import { IViewDescriptorService, IViewsService } from 'vs/workbench/common/views'
import { IHistoryService } from 'vs/workbench/services/history/common/history'
import { ITaskService } from 'vs/workbench/contrib/tasks/common/taskService'
import { IURITransformerService, URITransformerService } from 'vs/workbench/api/common/extHostUriTransformerService'
import { IConfigurationResolverService } from 'vs/workbench/services/configurationResolver/common/configurationResolver'
import { BrowserPathService } from 'vs/workbench/services/path/browser/pathService'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService'
import { ISocketFactory } from 'vs/platform/remote/common/remoteAgentConnection'
import { ICustomEndpointTelemetryService } from 'vs/platform/telemetry/common/telemetry'
import { NullEndpointTelemetryService } from 'vs/platform/telemetry/common/telemetryUtils'
import { SearchService } from 'vs/workbench/services/search/common/searchService'
import { ISearchService } from 'vs/workbench/services/search/common/search'
import { IRequestService } from 'vs/platform/request/common/request'
import { IEditSessionIdentityService } from 'vs/platform/workspace/common/editSessions'
import { IWorkspaceEditingService } from 'vs/workbench/services/workspaces/common/workspaceEditing'
import { ITimerService } from 'vs/workbench/services/timer/browser/timerService'
import { IExtensionsWorkbenchService } from 'vs/workbench/contrib/extensions/common/extensions'
import { IWorkbenchExtensionEnablementService } from 'vs/workbench/services/extensionManagement/common/extensionManagement'
import { ITunnelService } from 'vs/platform/tunnel/common/tunnel'
import { IWorkingCopyBackupService } from 'vs/workbench/services/workingCopy/common/workingCopyBackup'
import { IWorkingCopyService, WorkingCopyService } from 'vs/workbench/services/workingCopy/common/workingCopyService'
import { FilesConfigurationService, IFilesConfigurationService } from 'vs/workbench/services/filesConfiguration/common/filesConfigurationService'
import { IUntitledTextEditorService } from 'vs/workbench/services/untitled/common/untitledTextEditorService'
import { IFileDialogService } from 'vs/platform/dialogs/common/dialogs'
import { IElevatedFileService } from 'vs/workbench/services/files/common/elevatedFileService'
import { BrowserElevatedFileService } from 'vs/workbench/services/files/browser/elevatedFileService'
import { IDecorationsService } from 'vs/workbench/services/decorations/common/decorations'
import { Disposable } from 'vs/workbench/api/common/extHostTypes'
import { RequestService } from 'vs/platform/request/browser/requestService'
import { InMemoryWorkingCopyBackupService } from 'vs/workbench/services/workingCopy/common/workingCopyBackupService'
import { BrowserTextFileService } from 'vs/workbench/services/textfile/browser/browserTextFileService'
import { DecorationsService } from 'vs/workbench/services/decorations/browser/decorationsService'
import { UriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentityService'
import { IJSONEditingService } from 'vs/workbench/services/configuration/common/jsonEditing'
import { JSONEditingService } from 'vs/workbench/services/configuration/common/jsonEditingService'
import { IWorkspacesService } from 'vs/platform/workspaces/common/workspaces'
import { ITextEditorService } from 'vs/workbench/services/textfile/common/textEditorService'
import { IEditorResolverService } from 'vs/workbench/services/editor/common/editorResolverService'
import { AbstractLifecycleService } from 'vs/workbench/services/lifecycle/common/lifecycleService'
import { IOutputService } from 'vs/workbench/services/output/common/output'
import { OutputService } from 'vs/workbench/contrib/output/browser/outputServices'
import { IOutputChannelModelService, OutputChannelModelService } from 'vs/workbench/contrib/output/common/outputChannelModelService'
import { AbstractExtensionResourceLoaderService, IExtensionResourceLoaderService } from 'vs/platform/extensionResourceLoader/common/extensionResourceLoader'
import { IStorageService } from 'vs/platform/storage/common/storage'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration'
import { unsupported } from '../tools'

class NullLoggerService extends AbstractLoggerService {
  constructor () {
    super(LogLevel.Info, URI.file('logs.log'))
  }

  protected doCreateLogger (): ILogger { return new NullLogger() }
}
registerSingleton(ILoggerService, NullLoggerService, InstantiationType.Eager)

registerSingleton(IEditorService, class EditorService implements IEditorService {
  readonly _serviceBrand = undefined

  onDidActiveEditorChange = Event.None
  onDidVisibleEditorsChange = Event.None
  onDidEditorsChange = Event.None
  onDidCloseEditor = Event.None
  activeEditorPane = undefined
  activeEditor = undefined
  get activeTextEditorControl () { return StandaloneServices.get(ICodeEditorService).getFocusedCodeEditor() ?? undefined }
  activeTextEditorLanguageId = undefined
  visibleEditorPanes = []
  visibleEditors = []
  visibleTextEditorControls = []
  editors = []
  count = 0
  getEditors = () => []
  openEditor = unsupported
  openEditors = unsupported
  replaceEditors = async () => {}
  isOpened = () => false
  isVisible = () => false
  closeEditor = async () => {}
  closeEditors = async () => {}
  findEditors = () => []
  save = async () => false
  saveAll = async () => false
  revert = async () => false
  revertAll = async () => false
}, InstantiationType.Eager)

registerSingleton(IPaneCompositePartService, class PaneCompositePartService implements IPaneCompositePartService {
  readonly _serviceBrand = undefined
  onDidPaneCompositeOpen = Event.None
  onDidPaneCompositeClose = Event.None
  openPaneComposite = async () => undefined
  getActivePaneComposite = () => undefined
  getPaneComposite = () => undefined
  getPaneComposites = () => []
  getPinnedPaneCompositeIds = () => []
  getVisiblePaneCompositeIds = () => []
  getProgressIndicator = () => undefined
  hideActivePaneComposite = () => {}
  getLastActivePaneCompositeId = unsupported
  showActivity = unsupported
}, InstantiationType.Eager)

registerSingleton(IUriIdentityService, UriIdentityService, InstantiationType.Delayed)

registerSingleton(ITextFileService, BrowserTextFileService, InstantiationType.Eager)

registerSingleton(IFileService, class FileService implements IFileService {
  readonly _serviceBrand = undefined
  onDidChangeFileSystemProviderRegistrations = Event.None
  onDidChangeFileSystemProviderCapabilities = Event.None
  onWillActivateFileSystemProvider = Event.None
  registerProvider = unsupported
  getProvider = function () {
    return undefined
  }

  activateProvider = async () => {}
  canHandleResource = async () => false
  hasProvider = () => false
  hasCapability = () => false
  listCapabilities = () => []
  onDidFilesChange = Event.None
  onDidRunOperation = Event.None
  resolve = unsupported
  resolveAll = unsupported
  stat = unsupported
  exists = async () => false
  readFile = unsupported
  readFileStream = unsupported
  writeFile = unsupported
  move = unsupported
  canMove = unsupported
  copy = unsupported
  canCopy = unsupported
  cloneFile = unsupported
  createFile = unsupported
  canCreateFile = unsupported
  createFolder = unsupported
  del = unsupported
  canDelete = unsupported
  onDidWatchError = Event.None
  watch = unsupported
  dispose () {
    // ignore
  }
}, InstantiationType.Eager)

class EmptyEditorGroup implements IEditorGroup {
  onDidModelChange = Event.None
  onWillDispose = Event.None
  onDidActiveEditorChange = Event.None
  onWillCloseEditor = Event.None
  onDidCloseEditor = Event.None
  onWillMoveEditor = Event.None
  onWillOpenEditor = Event.None
  id = 0
  index = 0
  label = 'main'
  ariaLabel = 'main'
  activeEditorPane = undefined
  activeEditor = null
  previewEditor = null
  count = 0
  isEmpty = false
  isLocked = false
  stickyCount = 0
  editors = []
  get scopedContextKeyService () { return StandaloneServices.get(IContextKeyService) }
  getEditors = unsupported
  findEditors = unsupported
  getEditorByIndex = unsupported
  getIndexOfEditor = unsupported
  openEditor = unsupported
  openEditors = unsupported
  isPinned = unsupported
  isSticky = unsupported
  isActive = unsupported
  contains = unsupported
  moveEditor = unsupported
  moveEditors = unsupported
  copyEditor = unsupported
  copyEditors = unsupported
  closeEditor = unsupported
  closeEditors = unsupported
  closeAllEditors = unsupported
  replaceEditors = unsupported
  pinEditor = unsupported
  stickEditor = unsupported
  unstickEditor = unsupported
  lock = unsupported
  focus (): void {
    // ignore
  }

  isFirst = () => true
  isLast = () => true
}

registerSingleton(IEditorGroupsService, class EditorGroupsService implements IEditorGroupsService {
  readonly _serviceBrand = undefined
  getLayout = unsupported
  onDidChangeActiveGroup = Event.None
  onDidAddGroup = Event.None
  onDidRemoveGroup = Event.None
  onDidMoveGroup = Event.None
  onDidActivateGroup = Event.None
  onDidLayout = Event.None
  onDidScroll = Event.None
  onDidChangeGroupIndex = Event.None
  onDidChangeGroupLocked = Event.None
  get contentDimension () { return unsupported() }
  activeGroup = new EmptyEditorGroup()
  get sideGroup () { return unsupported() }
  groups = []
  count = 0
  orientation = GroupOrientation.HORIZONTAL
  isReady = false
  whenReady = Promise.resolve()
  whenRestored = Promise.resolve()
  hasRestorableState = false
  getGroups = () => []
  getGroup = () => undefined
  activateGroup = unsupported
  getSize = unsupported
  setSize = unsupported
  arrangeGroups = unsupported
  applyLayout = unsupported
  centerLayout = unsupported
  isLayoutCentered = () => false
  setGroupOrientation = unsupported
  findGroup = () => undefined
  addGroup = unsupported
  removeGroup = unsupported
  moveGroup = unsupported
  mergeGroup = unsupported
  mergeAllGroups = unsupported
  copyGroup = unsupported
  get partOptions () { return unsupported() }
  onDidChangeEditorPartOptions = Event.None
  enforcePartOptions = unsupported
}, InstantiationType.Eager)

class WorkbenchEnvironmentService implements IBrowserWorkbenchEnvironmentService {
  logsHome = URI.from({ scheme: 'logs', path: '/' })
  windowLogsPath = URI.from({ scheme: 'logs', path: '/window.log' })
  get extHostTelemetryLogFile () { return unsupported() }
  readonly _serviceBrand = undefined
  get logFile () { return unsupported() }
  get extHostLogsPath () { return unsupported() }
  skipReleaseNotes = true
  skipWelcome = true
  disableWorkspaceTrust = true
  get webviewExternalEndpoint () { return unsupported() }
  debugRenderer = false
  userRoamingDataHome = URI.from({ scheme: 'user', path: '/userRoamingDataHome' })
  keyboardLayoutResource = URI.from({ scheme: 'user', path: '/keyboardLayout.json' })
  get argvResource () { return unsupported() }
  snippetsHome = URI.from({ scheme: 'user', path: '/snippets' })
  untitledWorkspacesHome = URI.from({ scheme: 'user', path: '/untitledWorkspacesHome' })
  get globalStorageHome () { return unsupported() }
  get workspaceStorageHome () { return unsupported() }
  get localHistoryHome () { return unsupported() }
  cacheHome = URI.from({ scheme: 'cache', path: '/' })
  get userDataSyncHome () { return unsupported() }
  get userDataSyncLogResource () { return unsupported() }
  sync = undefined
  debugExtensionHost = {
    port: null,
    break: false
  }

  isExtensionDevelopment = false
  disableExtensions = false
  logsPath = ''
  verbose = false
  isBuilt = true // Required to suppress warnings
  disableTelemetry = false
  get telemetryLogResource () { return unsupported() }
  get serviceMachineIdResource () { return unsupported() }
  get stateResource () { return unsupported() }
  get editSessionsLogResource () { return unsupported() }
}
registerSingleton(IWorkbenchEnvironmentService, WorkbenchEnvironmentService, InstantiationType.Eager)
registerSingleton(IEnvironmentService, WorkbenchEnvironmentService, InstantiationType.Eager)
registerSingleton(IBrowserWorkbenchEnvironmentService, WorkbenchEnvironmentService, InstantiationType.Eager)
registerSingleton(IWorkingCopyFileService, WorkingCopyFileService, InstantiationType.Eager)
registerSingleton(IPathService, BrowserPathService, InstantiationType.Delayed)

registerSingleton(IProductService, class ProductService implements IProductService {
  readonly _serviceBrand = undefined

  version = VSCODE_VERSION
  nameShort = 'Code - OSS Dev'
  nameLong = 'Code - OSS Dev'
  applicationName = 'code-oss'
  dataFolderName = '.vscode-oss'
  urlProtocol = 'code-oss'
  reportIssueUrl = 'https://github.com/microsoft/vscode/issues/new'
  licenseName = 'MIT'
  licenseUrl = 'https://github.com/microsoft/vscode/blob/main/LICENSE.txt'
  serverApplicationName = 'code-server-oss'
}, InstantiationType.Eager)

registerSingleton(ILanguageStatusService, class LanguageStatusServiceImpl implements ILanguageStatusService {
  declare _serviceBrand: undefined

  private readonly _provider = new LanguageFeatureRegistry<ILanguageStatus>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly onDidChange: Event<any> = this._provider.onDidChange

  addStatus (status: ILanguageStatus): IDisposable {
    return this._provider.register(status.selector, status)
  }

  getLanguageStatus (model: ITextModel): ILanguageStatus[] {
    return this._provider.ordered(model).sort((a, b) => {
      let res = b.severity - a.severity
      if (res === 0) {
        res = compare(a.source, b.source)
      }
      if (res === 0) {
        res = compare(a.id, b.id)
      }
      return res
    })
  }
}, InstantiationType.Eager)

const focusTracker = trackFocus(window)
const onVisibilityChange = new DomEmitter(window.document, 'visibilitychange')

const onDidChangeFocus = Event.latch(Event.any(
  Event.map(focusTracker.onDidFocus, () => document.hasFocus()),
  Event.map(focusTracker.onDidBlur, () => document.hasFocus()),
  Event.map(onVisibilityChange.event, () => document.hasFocus())
))

registerSingleton(IHostService, class HostService implements IHostService {
  _serviceBrand: undefined

  onDidChangeFocus = onDidChangeFocus

  get hasFocus (): boolean {
    return document.hasFocus()
  }

  async hadLastFocus (): Promise<boolean> {
    return true
  }

  async focus (): Promise<void> {
    window.focus()
  }

  openWindow = unsupported

  async toggleFullScreen (): Promise<void> {
    // This is a false positive
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (document.fullscreenEnabled) {
      await document.body.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  restart = unsupported
  reload = unsupported
  close = unsupported
}, InstantiationType.Eager)

registerSingleton(ILifecycleService, class LifecycleService extends AbstractLifecycleService {
  shutdown = unsupported
}, InstantiationType.Eager)

registerSingleton(ILanguageDetectionService, class LanguageDetectionService implements ILanguageDetectionService {
  _serviceBrand: undefined
  isEnabledForLanguage (): boolean {
    return false
  }

  async detectLanguage (): Promise<string | undefined> {
    return undefined
  }
}, InstantiationType.Eager)

registerSingleton(IExtensionService, NullExtensionService, InstantiationType.Eager)

registerSingleton(IKeyboardLayoutService, class KeyboardLayoutService implements IKeyboardLayoutService {
  _serviceBrand: undefined
  onDidChangeKeyboardLayout = Event.None
  getRawKeyboardMapping = () => null
  getCurrentKeyboardLayout = () => null
  getAllKeyboardLayouts = () => []
  getKeyboardMapper = () => new FallbackKeyboardMapper(false, OS)
  validateCurrentKeyboardMapping = () => {}
}, InstantiationType.Delayed)

registerSingleton(IUserDataInitializationService, class NullUserDataInitializationService implements IUserDataInitializationService {
  _serviceBrand: undefined
  async requiresInitialization (): Promise<boolean> {
    return false
  }

  async whenInitializationFinished (): Promise<void> {}
  async initializeRequiredResources (): Promise<void> {}
  async initializeInstalledExtensions (): Promise<void> {}
  async initializeOtherResources (): Promise<void> {}
}, InstantiationType.Eager)

registerSingleton(IHostColorSchemeService, BrowserHostColorSchemeService, InstantiationType.Eager)

registerSingleton(IPreferencesService, class PreferencesService implements IPreferencesService {
  _serviceBrand: undefined
  userSettingsResource = profile.settingsResource
  workspaceSettingsResource = null
  getFolderSettingsResource = unsupported
  createPreferencesEditorModel = unsupported
  resolveModel = unsupported
  createSettings2EditorModel = unsupported
  openRawDefaultSettings = unsupported
  openSettings = unsupported
  openUserSettings = unsupported
  openRemoteSettings = unsupported
  openWorkspaceSettings = unsupported
  openFolderSettings = unsupported
  openGlobalKeybindingSettings = unsupported
  openDefaultKeybindingsFile = unsupported
  getEditableSettingsURI = unsupported
  createSplitJsonEditorInput = unsupported
  openApplicationSettings = unsupported
  openLanguageSpecificSettings = unsupported
}, InstantiationType.Eager)

registerSingleton(ITextMateTokenizationService, class NullTextMateService implements ITextMateTokenizationService {
  _serviceBrand: undefined
  onDidEncounterLanguage = Event.None
  createGrammar = unsupported
  startDebugMode = unsupported
}, InstantiationType.Eager)

const profile: IUserDataProfile = {
  id: 'default',
  isDefault: true,
  name: 'default',
  location: URI.from({ scheme: 'user', path: '/profile.json' }),
  get globalStorageHome () { return unsupported() },
  settingsResource: URI.from({ scheme: 'user', path: '/settings.json' }),
  keybindingsResource: URI.from({ scheme: 'user', path: '/keybindings.json' }),
  tasksResource: URI.from({ scheme: 'user', path: '/tasks.json' }),
  snippetsHome: URI.from({ scheme: 'user', path: '/snippets' }),
  get extensionsResource () { return unsupported() },
  cacheHome: URI.from({ scheme: 'cache', path: '/' })
}

registerSingleton(IUserDataProfilesService, class UserDataProfilesService implements IUserDataProfilesService {
  _serviceBrand: undefined
  onDidResetWorkspaces = Event.None
  isEnabled = () => false
  createNamedProfile = unsupported
  createTransientProfile = unsupported
  resetWorkspaces = unsupported
  cleanUp = unsupported
  cleanUpTransientProfiles = unsupported
  get profilesHome () { return unsupported() }
  defaultProfile = profile
  onDidChangeProfiles = Event.None
  profiles = [profile]
  createProfile = unsupported
  updateProfile = unsupported
  setProfileForWorkspace = unsupported
  getProfile = () => profile
  removeProfile = unsupported
}, InstantiationType.Eager)
class InjectedUserDataProfileService extends UserDataProfileService {
  constructor (@IUserDataProfilesService userDataProfilesService: IUserDataProfilesService) {
    super(profile, userDataProfilesService)
  }
}
registerSingleton(IUserDataProfileService, InjectedUserDataProfileService, InstantiationType.Eager)

registerSingleton(IPolicyService, class PolicyService implements IPolicyService {
  _serviceBrand: undefined
  updatePolicyDefinitions = unsupported
  onDidChange = Event.None
  registerPolicyDefinitions = unsupported
  getPolicyValue = () => undefined
  serialize = () => undefined
}, InstantiationType.Eager)

registerSingleton(ISnippetsService, class SnippetsService implements ISnippetsService {
  _serviceBrand: undefined
  getSnippetFiles = unsupported
  isEnabled = unsupported
  updateEnablement = unsupported
  updateUsageTimestamp = unsupported
  getSnippets = async () => []
  getSnippetsSync = unsupported
}, InstantiationType.Eager)

const debugModel: IDebugModel = {
  getSession: () => undefined,
  getSessions: () => [],
  getBreakpoints: () => [],
  areBreakpointsActivated: () => false,
  getFunctionBreakpoints: () => [],
  getDataBreakpoints: () => [],
  getExceptionBreakpoints: () => [],
  getExceptionBreakpointsForSession: () => [],
  getInstructionBreakpoints: () => [],
  getWatchExpressions: () => [],
  onDidChangeBreakpoints: Event.None,
  onDidChangeCallStack: Event.None,
  onDidChangeWatchExpressions: Event.None,
  fetchCallstack: unsupported,
  getId: unsupported
}

class FakeViewModel implements IViewModel {
  getId = unsupported
  readonly focusedSession = undefined
  readonly focusedThread = undefined
  readonly focusedStackFrame = undefined
  getSelectedExpression = unsupported
  setSelectedExpression = unsupported
  updateViews = unsupported
  isMultiSessionView = unsupported
  onDidFocusSession = Event.None
  onDidFocusStackFrame = Event.None
  onDidSelectExpression = Event.None
  onDidEvaluateLazyExpression = Event.None
  onWillUpdateViews = Event.None
  evaluateLazyExpression = unsupported
}

class FakeAdapterManager implements IAdapterManager {
  onDidRegisterDebugger = Event.None
  hasEnabledDebuggers = () => false
  getDebugAdapterDescriptor = unsupported
  getDebuggerLabel = unsupported
  someDebuggerInterestedInLanguage = () => false
  getDebugger = () => undefined
  activateDebuggers = unsupported
  registerDebugAdapterFactory = () => new Disposable(() => {})
  createDebugAdapter = unsupported
  registerDebugAdapterDescriptorFactory = unsupported
  unregisterDebugAdapterDescriptorFactory = unsupported
  substituteVariables = unsupported
  runInTerminal = unsupported
  getEnabledDebugger = unsupported
  guessDebugger = unsupported
  onDidDebuggersExtPointRead = Event.None
}
registerSingleton(IDebugService, class DebugService implements IDebugService {
  _serviceBrand: undefined
  get state () { return unsupported() }
  onDidChangeState = Event.None
  onDidNewSession = Event.None
  onWillNewSession = Event.None
  onDidEndSession = Event.None
  getConfigurationManager = unsupported
  getAdapterManager = () => new FakeAdapterManager()
  focusStackFrame = unsupported
  canSetBreakpointsIn = unsupported
  addBreakpoints = unsupported
  updateBreakpoints = unsupported
  enableOrDisableBreakpoints = unsupported
  setBreakpointsActivated = unsupported
  removeBreakpoints = unsupported
  addFunctionBreakpoint = unsupported
  updateFunctionBreakpoint = unsupported
  removeFunctionBreakpoints = unsupported
  addDataBreakpoint = unsupported
  removeDataBreakpoints = unsupported
  addInstructionBreakpoint = unsupported
  removeInstructionBreakpoints = unsupported
  setExceptionBreakpointCondition = unsupported
  setExceptionBreakpointsForSession = unsupported
  sendAllBreakpoints = unsupported
  addWatchExpression = unsupported
  renameWatchExpression = unsupported
  moveWatchExpression = unsupported
  removeWatchExpressions = unsupported
  startDebugging = unsupported
  restartSession = unsupported
  stopSession = unsupported
  sourceIsNotAvailable = unsupported
  getModel = () => debugModel
  getViewModel = () => new FakeViewModel()
  runTo = unsupported
}, InstantiationType.Eager)

registerSingleton(IRequestService, RequestService, InstantiationType.Eager)

registerSingleton(IWorkspaceTrustRequestService, class WorkspaceTrustRequestService implements IWorkspaceTrustRequestService {
  _serviceBrand: undefined
  onDidInitiateOpenFilesTrustRequest = Event.None
  onDidInitiateWorkspaceTrustRequest = Event.None
  onDidInitiateWorkspaceTrustRequestOnStartup = Event.None
  completeOpenFilesTrustRequest = unsupported
  requestOpenFilesTrust = unsupported
  cancelWorkspaceTrustRequest = unsupported
  completeWorkspaceTrustRequest = unsupported
  requestWorkspaceTrust = async () => true
  requestWorkspaceTrustOnStartup = () => null
}, InstantiationType.Eager)

registerSingleton(IActivityService, class ActivityService implements IActivityService {
  _serviceBrand: undefined
  showViewContainerActivity = unsupported
  showViewActivity = unsupported
  showAccountsActivity = unsupported
  showGlobalActivity = unsupported
}, InstantiationType.Eager)

registerSingleton(IExtensionHostDebugService, class ExtensionHostDebugService implements IExtensionHostDebugService {
  _serviceBrand: undefined
  reload = unsupported
  onReload = Event.None
  close = unsupported
  onClose = Event.None
  attachSession = unsupported
  onAttachSession = Event.None
  terminateSession = unsupported
  onTerminateSession = Event.None
  openExtensionDevelopmentHostWindow = unsupported
}, InstantiationType.Eager)

registerSingleton(IViewsService, class ViewsService implements IViewsService {
  _serviceBrand: undefined
  onDidChangeViewContainerVisibility = Event.None
  isViewContainerVisible = () => false
  openViewContainer = unsupported
  closeViewContainer = unsupported
  getVisibleViewContainer = unsupported
  getActiveViewPaneContainerWithId = () => null
  onDidChangeViewVisibility = Event.None
  isViewVisible = () => false
  openView = async () => null
  closeView = unsupported
  getActiveViewWithId = () => null
  getViewWithId = () => null
  getViewProgressIndicator = () => undefined
}, InstantiationType.Eager)

registerSingleton(IViewDescriptorService, class ViewDescriptorService implements IViewDescriptorService {
  _serviceBrand: undefined
  viewContainers = []
  onDidChangeViewContainers = Event.None
  getDefaultViewContainer = () => undefined
  getViewContainerById = () => null
  isViewContainerRemovedPermanently = unsupported
  getDefaultViewContainerLocation = () => null
  getViewContainerLocation = () => null
  getViewContainersByLocation = unsupported
  getViewContainerModel = unsupported
  onDidChangeContainerLocation = Event.None
  moveViewContainerToLocation = unsupported
  getViewContainerBadgeEnablementState = unsupported
  setViewContainerBadgeEnablementState = unsupported
  getViewDescriptorById = () => null
  getViewContainerByViewId = () => null
  getDefaultContainerById = () => null
  getViewLocationById = () => null
  onDidChangeContainer = Event.None
  moveViewsToContainer = unsupported
  onDidChangeLocation = Event.None
  moveViewToLocation = () => null
  reset = () => null
}, InstantiationType.Eager)

registerSingleton(IHistoryService, class HistoryService implements IHistoryService {
  _serviceBrand: undefined
  goForward = unsupported
  goBack = unsupported
  goPrevious = unsupported
  goLast = unsupported
  reopenLastClosedEditor = unsupported
  getHistory = unsupported
  removeFromHistory = unsupported
  getLastActiveWorkspaceRoot = () => undefined
  getLastActiveFile = () => undefined
  openNextRecentlyUsedEditor = unsupported
  openPreviouslyUsedEditor = unsupported
  clear = unsupported
  clearRecentlyOpened = unsupported
}, InstantiationType.Eager)

registerSingleton(ITaskService, class TaskService implements ITaskService {
  _serviceBrand: undefined
  onDidStateChange = Event.None
  supportsMultipleTaskExecutions = false
  configureAction = unsupported
  run = unsupported
  inTerminal = () => false
  getActiveTasks = async () => []
  getBusyTasks = unsupported
  terminate = unsupported
  tasks = unsupported
  taskTypes = unsupported
  getWorkspaceTasks = unsupported
  getSavedTasks = unsupported
  removeRecentlyUsedTask = unsupported
  getTask = unsupported
  tryResolveTask = unsupported
  createSorter = unsupported
  getTaskDescription = unsupported
  customize = unsupported
  openConfig = unsupported
  registerTaskProvider = unsupported
  registerTaskSystem = unsupported
  onDidChangeTaskSystemInfo = Event.None
  hasTaskSystemInfo = false
  registerSupportedExecutions = unsupported
  extensionCallbackTaskComplete = unsupported
}, InstantiationType.Eager)

registerSingleton(IURITransformerService, class InjectedURITransformerService extends URITransformerService {
  constructor () {
    super(null)
  }
}, InstantiationType.Eager)

registerSingleton(IConfigurationResolverService, class ConfigurationResolverService implements IConfigurationResolverService {
  _serviceBrand: undefined
  resolveWithEnvironment = unsupported
  resolveAsync = unsupported
  resolveAnyAsync = unsupported
  resolveAnyMap = unsupported
  resolveWithInteractionReplace = unsupported
  resolveWithInteraction = unsupported
  contributeVariable = unsupported
}, InstantiationType.Eager)

class SocketFactory implements ISocketFactory {
  connect = unsupported
}
registerSingleton(IRemoteAgentService, class RemoteAgentService implements IRemoteAgentService {
  _serviceBrand: undefined
  socketFactory = new SocketFactory()
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
}, InstantiationType.Eager)

registerSingleton(ICustomEndpointTelemetryService, NullEndpointTelemetryService, InstantiationType.Eager)

registerSingleton(ISearchService, SearchService, InstantiationType.Eager)

registerSingleton(IEditSessionIdentityService, class EditSessionIdentityService implements IEditSessionIdentityService {
  _serviceBrand: undefined
  registerEditSessionIdentityProvider = unsupported
  getEditSessionIdentifier = unsupported
  provideEditSessionIdentityMatch = unsupported
  addEditSessionIdentityCreateParticipant = unsupported
  onWillCreateEditSessionIdentity = unsupported
}, InstantiationType.Eager)

registerSingleton(IWorkspaceEditingService, class WorkspaceEditingService implements IWorkspaceEditingService {
  _serviceBrand: undefined
  addFolders = unsupported
  removeFolders = unsupported
  updateFolders = unsupported
  enterWorkspace = unsupported
  createAndEnterWorkspace = unsupported
  saveAndEnterWorkspace = unsupported
  copyWorkspaceSettings = unsupported
  pickNewWorkspacePath = unsupported
}, InstantiationType.Eager)

registerSingleton(ITimerService, class TimerService implements ITimerService {
  _serviceBrand: undefined
  whenReady = unsupported
  get perfBaseline () { return unsupported() }
  get startupMetrics () { return unsupported() }
  setPerformanceMarks = () => {}
  getPerformanceMarks = unsupported
  getDuration = unsupported
}, InstantiationType.Eager)

registerSingleton(IExtensionsWorkbenchService, class ExtensionsWorkbenchService implements IExtensionsWorkbenchService {
  whenInitialized = Promise.resolve()
  _serviceBrand: undefined
  onChange = Event.None
  onReset = Event.None
  preferPreReleases = false
  local = []
  installed = []
  outdated = []
  queryLocal = unsupported
  queryGallery = unsupported
  getExtensions = unsupported
  canInstall = unsupported
  install = unsupported
  installInServer = unsupported
  uninstall = unsupported
  installVersion = unsupported
  reinstall = unsupported
  canSetLanguage = unsupported
  setLanguage = unsupported
  setEnablement = unsupported
  pinExtension = unsupported
  open = unsupported
  checkForUpdates = unsupported
  getExtensionStatus = unsupported
  isExtensionIgnoredToSync = unsupported
  toggleExtensionIgnoredToSync = unsupported
}, InstantiationType.Eager)

registerSingleton(IWorkbenchExtensionEnablementService, class WorkbenchExtensionEnablementService implements IWorkbenchExtensionEnablementService {
  _serviceBrand: undefined
  onEnablementChanged = Event.None
  getEnablementState = unsupported
  getEnablementStates = unsupported
  getDependenciesEnablementStates = unsupported
  canChangeEnablement = unsupported
  canChangeWorkspaceEnablement = unsupported
  isEnabled = unsupported
  isEnabledEnablementState = unsupported
  isDisabledGlobally = unsupported
  setEnablement = unsupported
  updateExtensionsEnablementsWhenWorkspaceTrustChanges = unsupported
}, InstantiationType.Eager)

registerSingleton(ITunnelService, class TunnelService implements ITunnelService {
  _serviceBrand: undefined
  tunnels = Promise.resolve([])
  canChangePrivacy = false
  privacyOptions = []
  onTunnelOpened = Event.None
  onTunnelClosed = Event.None
  canElevate = false
  hasTunnelProvider = false
  onAddedTunnelProvider = Event.None
  canTunnel = () => false
  openTunnel = unsupported
  getExistingTunnel = async () => undefined
  setEnvironmentTunnel = unsupported
  closeTunnel = unsupported
  setTunnelProvider = unsupported
  setTunnelFeatures = unsupported
  isPortPrivileged = () => false
}, InstantiationType.Eager)

registerSingleton(IFilesConfigurationService, FilesConfigurationService, InstantiationType.Eager)

registerSingleton(IUntitledTextEditorService, class UntitledTextEditorService implements IUntitledTextEditorService {
  _serviceBrand: undefined
  onDidChangeDirty = Event.None
  onDidChangeEncoding = Event.None
  onDidChangeLabel = Event.None
  onWillDispose = Event.None
  create = unsupported
  get = () => undefined
  getValue = () => undefined
  resolve = unsupported
}, InstantiationType.Eager)

registerSingleton(IWorkingCopyBackupService, InMemoryWorkingCopyBackupService, InstantiationType.Eager)
registerSingleton(IWorkingCopyService, WorkingCopyService, InstantiationType.Eager)
registerSingleton(IDecorationsService, DecorationsService, InstantiationType.Eager)
registerSingleton(IElevatedFileService, BrowserElevatedFileService, InstantiationType.Eager)
registerSingleton(IFileDialogService, class FileDialogService implements IFileDialogService {
  _serviceBrand: undefined
  defaultFilePath = unsupported
  defaultFolderPath = unsupported
  defaultWorkspacePath = unsupported
  pickFileFolderAndOpen = unsupported
  pickFileAndOpen = unsupported
  pickFolderAndOpen = unsupported
  pickWorkspaceAndOpen = unsupported
  pickFileToSave = unsupported
  showSaveDialog = unsupported
  showSaveConfirm = unsupported
  showOpenDialog = unsupported
}, InstantiationType.Eager)

registerSingleton(IJSONEditingService, JSONEditingService, InstantiationType.Delayed)

registerSingleton(IWorkspacesService, class WorkspacesService implements IWorkspacesService {
  _serviceBrand: undefined
  enterWorkspace = unsupported
  createUntitledWorkspace = unsupported
  deleteUntitledWorkspace = unsupported
  getWorkspaceIdentifier = unsupported
  onDidChangeRecentlyOpened = Event.None
  addRecentlyOpened = unsupported
  removeRecentlyOpened = unsupported
  clearRecentlyOpened = unsupported
  getRecentlyOpened = unsupported
  getDirtyWorkspaces = unsupported
}, InstantiationType.Delayed)

registerSingleton(ITextEditorService, class TextEditorService implements ITextEditorService {
  _serviceBrand: undefined
  createTextEditor = unsupported
  resolveTextEditor = unsupported
}, InstantiationType.Eager)

registerSingleton(IEditorResolverService, class EditorResolverService implements IEditorResolverService {
  _serviceBrand: undefined
  getAssociationsForResource = unsupported
  updateUserAssociations = unsupported
  onDidChangeEditorRegistrations = Event.None
  bufferChangeEvents = unsupported
  registerEditor () {
    // do nothing
    return {
      dispose: () => {}
    }
  }

  resolveEditor = unsupported
  getEditors = unsupported
}, InstantiationType.Eager)

registerSingleton(IOutputService, OutputService, InstantiationType.Delayed)
registerSingleton(IOutputChannelModelService, OutputChannelModelService, InstantiationType.Delayed)
class SimpleExtensionResourceLoaderService extends AbstractExtensionResourceLoaderService {
  // required for injection
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor (
    @IFileService fileService: IFileService,
    @IStorageService storageService: IStorageService,
    @IProductService productService: IProductService,
    @IEnvironmentService environmentService: IEnvironmentService,
    @IConfigurationService configurationService: IConfigurationService
  ) {
    super(fileService, storageService, productService, environmentService, configurationService)
  }

  async readExtensionResource (uri: URI): Promise<string> {
    const result = await this._fileService.readFile(uri)
    return result.value.toString()
  }
}
registerSingleton(IExtensionResourceLoaderService, SimpleExtensionResourceLoaderService, InstantiationType.Eager)
