import { Event } from 'vs/base/common/event'
import { URI } from 'vs/base/common/uri'
import { IEditorService } from 'vs/workbench/services/editor/common/editorService'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite'
import { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity'
import { ITextFileService } from 'vs/workbench/services/textfile/common/textfiles'
import { IFileService } from 'vs/platform/files/common/files'
import { GroupOrientation, IEditorGroup, IEditorGroupsService, IEditorPart } from 'vs/workbench/services/editor/common/editorGroupsService'
import { IWorkingCopyFileService, WorkingCopyFileService } from 'vs/workbench/services/workingCopy/common/workingCopyFileService'
import { IPathService } from 'vs/workbench/services/path/common/pathService'
import { InstantiationType, registerSingleton } from 'vs/platform/instantiation/common/extensions'
import { IProductService } from 'vs/platform/product/common/productService'
import { ILanguageStatusService } from 'vs/workbench/services/languageStatus/common/languageStatusService'
import { IHostService } from 'vs/workbench/services/host/browser/host'
import { ILifecycleService } from 'vs/workbench/services/lifecycle/common/lifecycle'
import { ILanguageDetectionService } from 'vs/workbench/services/languageDetection/common/languageDetectionWorkerService'
import { IExtensionService, NullExtensionService } from 'vs/workbench/services/extensions/common/extensions'
import { IKeyboardLayoutService } from 'vs/platform/keyboardLayout/common/keyboardLayout'
import { OS } from 'vs/base/common/platform'
import { IEnvironmentService } from 'vs/platform/environment/common/environment'
import { IUserDataInitializationService } from 'vs/workbench/services/userData/browser/userDataInit'
import { IHostColorSchemeService } from 'vs/workbench/services/themes/common/hostColorSchemeService'
import { IPreferencesService } from 'vs/workbench/services/preferences/common/preferences'
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { IUserDataProfilesService, toUserDataProfile } from 'vs/platform/userDataProfile/common/userDataProfile'
import { IPolicyService, NullPolicyService } from 'vs/platform/policy/common/policy'
import { IUserDataProfileImportExportService, IUserDataProfileManagementService, IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile'
import { UserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfileService'
import { ISnippetsService } from 'vs/workbench/contrib/snippets/browser/snippets'
import { AbstractLoggerService, ILogger, ILoggerService, LogLevel, NullLogger } from 'vs/platform/log/common/log'
import { Disposable, DisposableStore, IDisposable } from 'vs/base/common/lifecycle'
import { FallbackKeyboardMapper } from 'vs/workbench/services/keybinding/common/fallbackKeyboardMapper'
import { ITextMateTokenizationService } from 'vs/workbench/services/textMate/browser/textMateTokenizationFeature'
import { IDebugService, IDebugModel, IViewModel, IAdapterManager } from 'vs/workbench/contrib/debug/common/debug'
import { IWorkspaceTrustEnablementService, IWorkspaceTrustRequestService, WorkspaceTrustUriResponse } from 'vs/platform/workspace/common/workspaceTrust'
import { IActivityService } from 'vs/workbench/services/activity/common/activity'
import { IExtensionHostDebugService } from 'vs/platform/debug/common/extensionHostDebug'
import { IViewContainerModel, IViewDescriptorService } from 'vs/workbench/common/views'
import { IHistoryService } from 'vs/workbench/services/history/common/history'
import { ITaskService } from 'vs/workbench/contrib/tasks/common/taskService'
import { IConfigurationResolverService } from 'vs/workbench/services/configurationResolver/common/configurationResolver'
import { BrowserPathService } from 'vs/workbench/services/path/browser/pathService'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService'
import { ICustomEndpointTelemetryService } from 'vs/platform/telemetry/common/telemetry'
import { NullEndpointTelemetryService } from 'vs/platform/telemetry/common/telemetryUtils'
import { ISearchComplete, ISearchService } from 'vs/workbench/services/search/common/search'
import { IRequestService } from 'vs/platform/request/common/request'
import { IEditSessionIdentityService } from 'vs/platform/workspace/common/editSessions'
import { IWorkspaceEditingService } from 'vs/workbench/services/workspaces/common/workspaceEditing'
import { ITimerService } from 'vs/workbench/services/timer/browser/timerService'
import { IExtensionsWorkbenchService } from 'vs/workbench/contrib/extensions/common/extensions'
import { EnablementState, IExtensionManagementServerService, IWebExtensionsScannerService, IWorkbenchExtensionEnablementService, IWorkbenchExtensionManagementService } from 'vs/workbench/services/extensionManagement/common/extensionManagement'
import { ITunnelService } from 'vs/platform/tunnel/common/tunnel'
import { IResolvedWorkingCopyBackup, IWorkingCopyBackupService } from 'vs/workbench/services/workingCopy/common/workingCopyBackup'
import { IWorkingCopyService } from 'vs/workbench/services/workingCopy/common/workingCopyService'
import { IFilesConfigurationService } from 'vs/workbench/services/filesConfiguration/common/filesConfigurationService'
import { IUntitledTextEditorService } from 'vs/workbench/services/untitled/common/untitledTextEditorService'
import { IFileDialogService } from 'vs/platform/dialogs/common/dialogs'
import { IElevatedFileService } from 'vs/workbench/services/files/common/elevatedFileService'
import { IDecorationsService } from 'vs/workbench/services/decorations/common/decorations'
import { UriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentityService'
import { IJSONEditingService } from 'vs/workbench/services/configuration/common/jsonEditing'
import { IWorkspacesService } from 'vs/platform/workspaces/common/workspaces'
import { ITextEditorService } from 'vs/workbench/services/textfile/common/textEditorService'
import { IEditorResolverService } from 'vs/workbench/services/editor/common/editorResolverService'
import { AbstractLifecycleService } from 'vs/workbench/services/lifecycle/common/lifecycleService'
import { IOutputChannel, IOutputChannelDescriptor, IOutputService } from 'vs/workbench/services/output/common/output'
import { IOutputChannelModelService } from 'vs/workbench/contrib/output/common/outputChannelModelService'
import { IExtensionResourceLoaderService } from 'vs/platform/extensionResourceLoader/common/extensionResourceLoader'
import { IExplorerService } from 'vs/workbench/contrib/files/browser/files'
import { IExtensionStorageService } from 'vs/platform/extensionManagement/common/extensionStorage'
import { ILanguagePackItem, ILanguagePackService } from 'vs/platform/languagePacks/common/languagePacks'
import { ITreeViewsDnDService } from 'vs/editor/common/services/treeViewsDndService'
import { ITreeViewsService } from 'vs/workbench/services/views/browser/treeViewsService'
import { IBreadcrumbsService } from 'vs/workbench/browser/parts/editor/breadcrumbs'
import { IOutlineService } from 'vs/workbench/services/outline/browser/outline'
import { IUpdateService, State } from 'vs/platform/update/common/update'
import { IStatusbarService } from 'vs/workbench/services/statusbar/browser/statusbar'
import { IExtensionGalleryService, IExtensionManagementService, IExtensionTipsService, IGlobalExtensionEnablementService, ILocalExtension } from 'vs/platform/extensionManagement/common/extensionManagement'
import { IModelService } from 'vs/editor/common/services/model'
import { ITerminalEditorService, ITerminalGroupService, ITerminalInstance, ITerminalInstanceService, ITerminalService, TerminalConnectionState } from 'vs/workbench/contrib/terminal/browser/terminal'
import { ITerminalProfileResolverService, ITerminalProfileService } from 'vs/workbench/contrib/terminal/common/terminal'
import { ITerminalLogService, TerminalLocation } from 'vs/platform/terminal/common/terminal'
import { ITerminalContributionService } from 'vs/workbench/contrib/terminal/common/terminalExtensionPoints'
import { ITerminalLinkProviderService } from 'vs/workbench/contrib/terminalContrib/links/browser/links'
import { IEnvironmentVariableService } from 'vs/workbench/contrib/terminal/common/environmentVariable'
import { ITerminalQuickFixService } from 'vs/workbench/contrib/terminalContrib/quickFix/browser/quickFix'
import { IPreferencesSearchService } from 'vs/workbench/contrib/preferences/common/preferences'
import { AccountStatus, IUserDataSyncWorkbenchService } from 'vs/workbench/services/userDataSync/common/userDataSync'
import { IUserDataAutoSyncService, IUserDataSyncEnablementService, IUserDataSyncLocalStoreService, IUserDataSyncLogService, IUserDataSyncResourceProviderService, IUserDataSyncService, IUserDataSyncStoreManagementService, IUserDataSyncStoreService, IUserDataSyncUtilService, SyncStatus } from 'vs/platform/userDataSync/common/userDataSync'
import { IKeybindingEditingService } from 'vs/workbench/services/keybinding/common/keybindingEditing'
import { INotebookService } from 'vs/workbench/contrib/notebook/common/notebookService'
import { ISearchHistoryService } from 'vs/workbench/contrib/search/common/searchHistoryService'
import { IReplaceService } from 'vs/workbench/contrib/search/browser/replace'
import { ISearchViewModelWorkbenchService } from 'vs/workbench/contrib/search/browser/searchModel'
import { INotebookEditorService } from 'vs/workbench/contrib/notebook/browser/services/notebookEditorService'
import { INotebookEditorModelResolverService } from 'vs/workbench/contrib/notebook/common/notebookEditorModelResolverService'
import { IWorkingCopyEditorService } from 'vs/workbench/services/workingCopy/common/workingCopyEditorService'
import { IUserActivityService } from 'vs/workbench/services/userActivity/common/userActivityService'
import { ICanonicalUriService } from 'vs/platform/workspace/common/canonicalUri'
import { ExtensionStatusBarEntry, IExtensionStatusBarItemService, StatusBarUpdateKind } from 'vs/workbench/api/browser/statusBarExtensionPoint'
import { IWorkbenchAssignmentService } from 'vs/workbench/services/assignment/common/assignmentService'
import { IChatService } from 'vs/workbench/contrib/chat/common/chatService'
import { IEmbedderTerminalService } from 'vs/workbench/services/terminal/common/embedderTerminalService'
import { ICustomEditorService } from 'vs/workbench/contrib/customEditor/common/customEditor'
import { IWebviewWorkbenchService } from 'vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService'
import { IWebview, IWebviewService } from 'vs/workbench/contrib/webview/browser/webview'
import { IWebviewViewService } from 'vs/workbench/contrib/webviewView/browser/webviewViewService'
import { IRemoteAuthorityResolverService } from 'vs/platform/remote/common/remoteAuthorityResolver'
import { IExternalUriOpenerService } from 'vs/workbench/contrib/externalUriOpener/common/externalUriOpenerService'
import { IAccessibleViewService } from 'vs/workbench/contrib/accessibility/browser/accessibleView'
import { IExtension, IBuiltinExtensionsScannerService, IRelaxedExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { IExtensionManifestPropertiesService } from 'vs/workbench/services/extensions/common/extensionManifestPropertiesService'
import { IRemoteExtensionsScannerService } from 'vs/platform/remote/common/remoteExtensionsScanner'
import { IURLService } from 'vs/platform/url/common/url'
import { IRemoteSocketFactoryService } from 'vs/platform/remote/common/remoteSocketFactoryService'
import { IQuickDiffService } from 'vs/workbench/contrib/scm/common/quickDiff'
import { ISCMService, ISCMViewService } from 'vs/workbench/contrib/scm/common/scm'
import { IDownloadService } from 'vs/platform/download/common/download'
import { IExtensionUrlHandler } from 'vs/workbench/services/extensions/browser/extensionUrlHandler'
import { ICommentService } from 'vs/workbench/contrib/comments/browser/commentService'
import { INotebookCellStatusBarService } from 'vs/workbench/contrib/notebook/common/notebookCellStatusBarService'
import { INotebookKernelHistoryService, INotebookKernelService } from 'vs/workbench/contrib/notebook/common/notebookKernelService'
import { INotebookRendererMessagingService } from 'vs/workbench/contrib/notebook/common/notebookRendererMessagingService'
import { IInteractiveDocumentService } from 'vs/workbench/contrib/interactive/browser/interactiveDocumentService'
import { IInlineChatService } from 'vs/workbench/contrib/inlineChat/common/inlineChat'
import { IChatAccessibilityService, IChatWidgetService, IQuickChatService } from 'vs/workbench/contrib/chat/browser/chat'
import { IRemoteExplorerService } from 'vs/workbench/services/remote/common/remoteExplorerService'
import { IAuthenticationService } from 'vs/workbench/services/authentication/common/authentication'
import { ITimelineService } from 'vs/workbench/contrib/timeline/common/timeline'
import { ITestService } from 'vs/workbench/contrib/testing/common/testService'
import { ISecretStorageService } from 'vs/platform/secrets/common/secrets'
import { IShareService } from 'vs/workbench/contrib/share/common/share'
import { IWorkbenchIssueService } from 'vs/workbench/services/issue/common/issue'
import { INotebookExecutionStateService } from 'vs/workbench/contrib/notebook/common/notebookExecutionStateService'
import { IChatContributionService } from 'vs/workbench/contrib/chat/common/chatContributionService'
import { ITestProfileService } from 'vs/workbench/contrib/testing/common/testProfileService'
import { IEncryptionService } from 'vs/platform/encryption/common/encryptionService'
import { ITestResultService } from 'vs/workbench/contrib/testing/common/testResultService'
import { IDiagnosticsService, NullDiagnosticsService } from 'vs/platform/diagnostics/common/diagnostics'
import { INotebookSearchService } from 'vs/workbench/contrib/search/common/notebookSearch'
import { IChatProviderService } from 'vs/workbench/contrib/chat/common/chatProvider'
import { IChatSlashCommandService } from 'vs/workbench/contrib/chat/common/chatSlashCommands'
import { IChatVariablesService } from 'vs/workbench/contrib/chat/common/chatVariables'
import { IAiRelatedInformationService } from 'vs/workbench/services/aiRelatedInformation/common/aiRelatedInformation'
import { IAiEmbeddingVectorService } from 'vs/workbench/services/aiEmbeddingVector/common/aiEmbeddingVectorService'
import { ResourceSet } from 'vs/base/common/map'
import { DEFAULT_EDITOR_PART_OPTIONS, IEditorGroupView } from 'vs/workbench/browser/parts/editor/editor'
import { IMessage, ISignService } from 'vs/platform/sign/common/sign'
import { IBannerService } from 'vs/workbench/services/banner/browser/bannerService'
import { IChatAgentService } from 'vs/workbench/contrib/chat/common/chatAgents'
import { IActiveLanguagePackService, ILocaleService } from 'vs/workbench/services/localization/common/locale'
import { joinPath } from 'vs/base/common/resources'
import { IExtensionIgnoredRecommendationsService, IExtensionRecommendationsService } from 'vs/workbench/services/extensionRecommendations/common/extensionRecommendations'
import { IIgnoredExtensionsManagementService } from 'vs/platform/userDataSync/common/ignoredExtensions'
import { IExtensionRecommendationNotificationService } from 'vs/platform/extensionRecommendations/common/extensionRecommendations'
import { IWorkspaceExtensionsConfigService } from 'vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig'
import { IRemoteUserDataProfilesService } from 'vs/workbench/services/userDataProfile/common/remoteUserDataProfiles'
import { IExtensionBisectService } from 'vs/workbench/services/extensionManagement/browser/extensionBisect'
import { IUserDataSyncAccountService } from 'vs/platform/userDataSync/common/userDataSyncAccount'
import { IWorkingCopyIdentifier, IWorkingCopyBackupMeta } from 'vs/workbench/services/workingCopy/common/workingCopy'
import { ITestResultStorage } from 'vs/workbench/contrib/testing/common/testResultStorage'
import { ITestingDecorationsService } from 'vs/workbench/contrib/testing/common/testingDecorations'
import { ITestingContinuousRunService } from 'vs/workbench/contrib/testing/common/testingContinuousRunService'
import { ITestExplorerFilterState } from 'vs/workbench/contrib/testing/common/testExplorerFilterState'
import { ITestingPeekOpener } from 'vs/workbench/contrib/testing/common/testingPeekOpener'
import { IAuxiliaryWindowService } from 'vs/workbench/services/auxiliaryWindow/browser/auxiliaryWindowService'
import { ISpeechService } from 'vs/workbench/contrib/speech/common/speechService'
import { ITitleService } from 'vs/workbench/services/title/browser/titleService'
import { ITestCoverageService } from 'vs/workbench/contrib/testing/common/testCoverageService'
import { IChatWidgetHistoryService } from 'vs/workbench/contrib/chat/common/chatWidgetHistoryService'
import { INotebookEditorWorkerService } from 'vs/workbench/contrib/notebook/common/services/notebookWorkerService'
import { INotebookExecutionService } from 'vs/workbench/contrib/notebook/common/notebookExecutionService'
import { INotebookKeymapService } from 'vs/workbench/contrib/notebook/common/notebookKeymapService'
import { INotebookLoggingService } from 'vs/workbench/contrib/notebook/common/notebookLoggingService'
import { IWalkthroughsService } from 'vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedService'
import { IUserDataSyncMachinesService } from 'vs/platform/userDataSync/common/userDataSyncMachines'
import { IWorkingCopyHistoryService } from 'vs/workbench/services/workingCopy/common/workingCopyHistory'
import { mainWindow } from 'vs/base/browser/window'
import { IViewsService } from 'vs/workbench/services/views/common/viewsService'
import { IHoverService } from 'vs/platform/hover/browser/hover'
import { IInlineChatSessionService } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionService'
import { IInlineChatSavingService } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSavingService'
import { INotebookDocumentService } from 'vs/workbench/services/notebook/common/notebookDocumentService'
import { IDebugVisualizerService } from 'vs/workbench/contrib/debug/common/debugVisualizers'
import { IEditSessionsLogService, IEditSessionsStorageService, SyncResource } from 'vs/workbench/contrib/editSessions/common/editSessions'
import { IMultiDiffSourceResolverService } from 'vs/workbench/contrib/multiDiffEditor/browser/multiDiffSourceResolverService'
import { IInteractiveHistoryService } from 'vs/workbench/contrib/interactive/browser/interactiveHistoryService'
import { IWorkspaceTagsService } from 'vs/workbench/contrib/tags/common/workspaceTags'
import { NoOpWorkspaceTagsService } from 'vs/workbench/contrib/tags/browser/workspaceTagsService'
import { IExtensionFeaturesManagementService } from 'vs/workbench/services/extensionManagement/common/extensionFeatures'
import { IEditorPaneService } from 'vs/workbench/services/editor/common/editorPaneService'
import { IWorkspaceIdentityService } from 'vs/workbench/services/workspaces/common/workspaceIdentityService'
import { IDefaultLogLevelsService } from 'vs/workbench/contrib/logs/common/defaultLogLevels'
import { getBuiltInExtensionTranslationsUris } from './l10n'
import { unsupported } from './tools'

registerSingleton(ILoggerService, class NullLoggerService extends AbstractLoggerService {
  constructor () {
    super(LogLevel.Info, URI.file('logs.log'))
  }

  protected doCreateLogger (): ILogger { return new NullLogger() }
}, InstantiationType.Eager)

registerSingleton(IEditorService, class EditorService implements IEditorService {
  readonly _serviceBrand = undefined

  onWillOpenEditor = Event.None
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
  save = async () => ({ success: false, editors: [] })
  saveAll = async () => ({ success: false, editors: [] })
  revert = async () => false
  revertAll = async () => false
  createScoped (): IEditorService {
    return this
  }
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
  showActivity = () => Disposable.None
}, InstantiationType.Eager)

registerSingleton(IUriIdentityService, UriIdentityService, InstantiationType.Delayed)

registerSingleton(ITextFileService, class TextFileService implements ITextFileService {
  _serviceBrand: undefined
  get files () {
    return unsupported()
  }

  get untitled () {
    return unsupported()
  }

  get encoding () {
    return unsupported()
  }

  isDirty = unsupported
  save = unsupported
  saveAs = unsupported
  revert = unsupported
  read = unsupported
  readStream = unsupported
  write = unsupported
  create = unsupported
  getEncodedReadable = unsupported
  getDecodedStream = unsupported
  dispose = unsupported
}, InstantiationType.Eager)

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
  createWatcher = unsupported
  dispose () {
    // ignore
  }
}, InstantiationType.Eager)

class EmptyEditorGroup implements IEditorGroup, IEditorGroupView {
  windowId = mainWindow.vscodeWindowId
  get groupsView () {
    return unsupported()
  }

  notifyLabelChanged (): void {}
  createEditorActions = unsupported
  onDidFocus = Event.None
  onDidOpenEditorFail = Event.None
  whenRestored = Promise.resolve()
  get titleHeight () {
    return unsupported()
  }

  disposed = false
  setActive = unsupported
  notifyIndexChanged = unsupported
  relayout = unsupported
  dispose = unsupported
  toJSON = unsupported
  preferredWidth?: number | undefined
  preferredHeight?: number | undefined
  get element () {
    return unsupported()
  }

  minimumWidth = 0
  maximumWidth = Number.POSITIVE_INFINITY
  minimumHeight = 0
  maximumHeight = Number.POSITIVE_INFINITY
  onDidChange = Event.None
  layout = unsupported
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
  get scopedContextKeyService (): IContextKeyService { return StandaloneServices.get(IContextKeyService) }
  getEditors = () => []
  findEditors = () => []
  getEditorByIndex = () => undefined
  getIndexOfEditor = unsupported
  openEditor = unsupported
  openEditors = unsupported
  isPinned = () => false
  isSticky = () => false
  isActive = () => false
  contains = () => false
  moveEditor = unsupported
  moveEditors = unsupported
  copyEditor = unsupported
  copyEditors = unsupported
  closeEditor = unsupported
  closeEditors = unsupported
  closeAllEditors = unsupported
  replaceEditors = unsupported
  pinEditor = () => {}
  stickEditor = () => {}
  unstickEditor = () => {}
  lock = () => {}
  focus (): void {
    // ignore
  }

  isFirst = unsupported
  isLast = unsupported
}

const fakeActiveGroup = new EmptyEditorGroup()

class EmptyEditorPart implements IEditorPart {
  windowId = mainWindow.vscodeWindowId
  hasMaximizedGroup = () => false
  onDidLayout = Event.None
  onDidScroll = Event.None
  get contentDimension (): never { return unsupported() }
  isReady = true
  whenReady = Promise.resolve()
  whenRestored = Promise.resolve()
  hasRestorableState = false
  centerLayout = unsupported
  isLayoutCentered = unsupported
  enforcePartOptions = unsupported
  onDidChangeActiveGroup = Event.None
  onDidAddGroup = Event.None
  onDidRemoveGroup = Event.None
  onDidMoveGroup = Event.None
  onDidActivateGroup = Event.None
  onDidChangeGroupIndex = Event.None
  onDidChangeGroupLocked = Event.None
  onDidChangeGroupMaximized = Event.None
  activeGroup = fakeActiveGroup
  get sideGroup (): never { return unsupported() }
  groups = [fakeActiveGroup]
  count = 0
  orientation = GroupOrientation.HORIZONTAL
  getGroups = () => []
  getGroup = () => undefined
  activateGroup = unsupported
  getSize = unsupported
  setSize = unsupported
  arrangeGroups = unsupported
  toggleMaximizeGroup = unsupported
  toggleExpandGroup = unsupported
  applyLayout = unsupported
  getLayout = unsupported
  setGroupOrientation = unsupported
  findGroup = () => undefined
  addGroup = unsupported
  removeGroup = unsupported
  moveGroup = unsupported
  mergeGroup = unsupported
  mergeAllGroups = unsupported
  copyGroup = unsupported
  partOptions = DEFAULT_EDITOR_PART_OPTIONS

  onDidChangeEditorPartOptions = Event.None
  createEditorDropTarget = unsupported
}

class EmptyEditorGroupsService implements IEditorGroupsService {
  onDidCreateAuxiliaryEditorPart = Event.None
  mainPart = new EmptyEditorPart()
  activePart = this.mainPart
  parts = [this.mainPart]

  getPart = unsupported
  createAuxiliaryEditorPart = unsupported
  onDidChangeGroupMaximized = Event.None
  toggleMaximizeGroup = unsupported
  toggleExpandGroup = unsupported
  partOptions = DEFAULT_EDITOR_PART_OPTIONS

  createEditorDropTarget = unsupported
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
  get contentDimension (): never { return unsupported() }
  activeGroup = fakeActiveGroup
  get sideGroup (): never { return unsupported() }
  groups = [fakeActiveGroup]
  count = 0
  orientation = GroupOrientation.HORIZONTAL
  isReady = false
  whenReady = Promise.resolve()
  whenRestored = Promise.resolve()
  hasRestorableState = false
  getGroups = (): never[] => []
  getGroup = (): undefined => undefined
  activateGroup = unsupported
  getSize = unsupported
  setSize = unsupported
  arrangeGroups = unsupported
  applyLayout = unsupported
  centerLayout = unsupported
  isLayoutCentered = (): boolean => false
  setGroupOrientation = unsupported
  findGroup = (): undefined => undefined
  addGroup = unsupported
  removeGroup = unsupported
  moveGroup = unsupported
  mergeGroup = unsupported
  mergeAllGroups = unsupported
  copyGroup = unsupported
  onDidChangeEditorPartOptions = Event.None
  enforcePartOptions = unsupported
}

registerSingleton(IEditorGroupsService, EmptyEditorGroupsService, InstantiationType.Eager)

registerSingleton(IBannerService, class BannerService implements IBannerService {
  _serviceBrand: undefined
  focus (): void {}
  focusNextAction (): void {}
  focusPreviousAction (): void {}
  hide (): void {}
  show (): void {}
}, InstantiationType.Eager)

registerSingleton(ITitleService, class TitleService implements ITitleService {
  _serviceBrand: undefined
  getPart = unsupported
  createAuxiliaryTitlebarPart = unsupported
  dispose = unsupported
  onMenubarVisibilityChange = Event.None
  isCommandCenterVisible = false
  onDidChangeCommandCenterVisibility = Event.None
  updateProperties (): void {}
  registerVariables = () => {}
}, InstantiationType.Eager)

registerSingleton(IWorkingCopyFileService, WorkingCopyFileService, InstantiationType.Eager)
registerSingleton(IPathService, BrowserPathService, InstantiationType.Delayed)

registerSingleton(IProductService, class ProductService implements IProductService {
  readonly _serviceBrand = undefined

  version = VSCODE_VERSION
  commit = VSCODE_REF
  quality = 'oss'
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

registerSingleton(IExtensionTipsService, class ExtensionTipsService implements IExtensionTipsService {
  readonly _serviceBrand = undefined
  getConfigBasedTips = async () => []
  getImportantExecutableBasedTips = async () => []
  getOtherExecutableBasedTips = async () => []
}, InstantiationType.Eager)

registerSingleton(ILanguageStatusService, class LanguageStatusService implements ILanguageStatusService {
  _serviceBrand: undefined
  onDidChange = Event.None
  addStatus = unsupported
  getLanguageStatus = unsupported
}, InstantiationType.Delayed)

registerSingleton(IHostService, class HostService implements IHostService {
  onDidChangeFullScreen = Event.None
  _serviceBrand: undefined
  onDidChangeFocus = Event.None
  hasFocus = false
  hadLastFocus = async () => false
  focus = unsupported
  onDidChangeActiveWindow = Event.None
  openWindow = unsupported
  toggleFullScreen = unsupported
  moveTop = unsupported
  getCursorScreenPoint = unsupported
  restart = unsupported
  reload = unsupported
  close = unsupported
  withExpectedShutdown = unsupported
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

registerSingleton(IHostColorSchemeService, class HostColorSchemeService implements IHostColorSchemeService {
  _serviceBrand: undefined
  dark = false
  highContrast = false
  onDidChangeColorScheme = Event.None
}, InstantiationType.Eager)

class PreferencesService implements IPreferencesService {
  constructor (@IUserDataProfileService protected readonly profileService: IUserDataProfileService) {}

  _serviceBrand: undefined
  userSettingsResource = this.profileService.currentProfile.settingsResource
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
}

registerSingleton(IPreferencesService, PreferencesService, InstantiationType.Eager)

registerSingleton(ITextMateTokenizationService, class NullTextMateService implements ITextMateTokenizationService {
  _serviceBrand: undefined
  onDidEncounterLanguage = Event.None
  createGrammar = unsupported
  startDebugMode = unsupported
  createTokenizer = unsupported
}, InstantiationType.Eager)

class UserDataProfilesService implements IUserDataProfilesService {
  constructor (@IUserDataProfileService protected readonly profileService: IUserDataProfileService) {}

  _serviceBrand: undefined
  onDidResetWorkspaces = Event.None
  isEnabled = () => false
  createNamedProfile = unsupported
  createTransientProfile = unsupported
  resetWorkspaces = unsupported
  cleanUp = unsupported
  cleanUpTransientProfiles = unsupported
  get profilesHome () { return unsupported() }
  defaultProfile = this.profileService.currentProfile
  onDidChangeProfiles = Event.None
  profiles = [this.profileService.currentProfile]
  createProfile = unsupported
  updateProfile = unsupported
  setProfileForWorkspace = unsupported
  getProfile = () => this.profileService.currentProfile
  removeProfile = unsupported
}

registerSingleton(IUserDataProfilesService, UserDataProfilesService, InstantiationType.Eager)
class InjectedUserDataProfileService extends UserDataProfileService {
  constructor (@IEnvironmentService environmentService: IEnvironmentService) {
    super({
      ...toUserDataProfile(
        '__default__profile__',
        'Default',
        environmentService.userRoamingDataHome,
        joinPath(environmentService.cacheHome, 'CachedProfilesData')
      ),
      isDefault: true
    })
  }
}
registerSingleton(IUserDataProfileService, InjectedUserDataProfileService, InstantiationType.Eager)

registerSingleton(IPolicyService, NullPolicyService, InstantiationType.Eager)

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
  getId: unsupported,
  registerBreakpointModes: unsupported,
  getBreakpointModes: () => []
}

class FakeViewModel implements IViewModel {
  setVisualizedExpression = unsupported
  getVisualizedExpression = () => undefined
  onDidChangeVisualization = Event.None
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
  onDidFocusThread = Event.None
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
  registerDebugAdapterFactory = () => Disposable.None
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
  initializingOptions = undefined
  sendBreakpoints = unsupported
  updateDataBreakpoint = unsupported
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

registerSingleton(IRequestService, class RequestService implements IRequestService {
  _serviceBrand: undefined
  request = unsupported
  resolveProxy = unsupported
  loadCertificates = unsupported
}, InstantiationType.Eager)

registerSingleton(IWorkspaceTrustRequestService, class WorkspaceTrustRequestService implements IWorkspaceTrustRequestService {
  _serviceBrand: undefined
  onDidInitiateOpenFilesTrustRequest = Event.None
  onDidInitiateWorkspaceTrustRequest = Event.None
  onDidInitiateWorkspaceTrustRequestOnStartup = Event.None
  completeOpenFilesTrustRequest = unsupported
  requestOpenFilesTrust = async () => WorkspaceTrustUriResponse.Open
  cancelWorkspaceTrustRequest = unsupported
  completeWorkspaceTrustRequest = unsupported
  requestWorkspaceTrust = async () => true
  requestWorkspaceTrustOnStartup = () => null
}, InstantiationType.Eager)

registerSingleton(IActivityService, class ActivityService implements IActivityService {
  _serviceBrand: undefined
  onDidChangeActivity = Event.None
  getViewContainerActivities = unsupported
  getActivity = unsupported
  showViewContainerActivity = () => Disposable.None
  showViewActivity = () => Disposable.None
  showAccountsActivity = () => Disposable.None
  showGlobalActivity = () => Disposable.None
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
  getFocusedViewName = unsupported
  onDidChangeFocusedView = Event.None
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
  getViewContainerModel = () => ({
    onDidChangeAllViewDescriptors: Event.None,
    visibleViewDescriptors: []
  } as Pick<IViewContainerModel, 'onDidChangeAllViewDescriptors' | 'visibleViewDescriptors'> as IViewContainerModel)

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
  suspendTracking = () => ({
    dispose () {
    }
  })

  goForward = unsupported
  goBack = unsupported
  goPrevious = unsupported
  goLast = unsupported
  reopenLastClosedEditor = unsupported
  getHistory = () => []
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
  onDidChangeTaskConfig = Event.None
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
  registerTaskSystem = () => {}
  onDidChangeTaskSystemInfo = Event.None
  hasTaskSystemInfo = false
  registerSupportedExecutions = () => {}
  extensionCallbackTaskComplete = unsupported
  isReconnected = false
  onDidReconnectToTasks = Event.None
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

registerSingleton(IRemoteAgentService, class RemoteAgentService implements IRemoteAgentService {
  _serviceBrand: undefined
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

class MonacoSearchService implements ISearchService {
  _serviceBrand: undefined
  constructor (@IModelService private modelService: IModelService) {}
  textSearchSplitSyncAsync = unsupported

  async textSearch (): Promise<ISearchComplete> {
    return {
      results: [],
      messages: []
    }
  }

  async fileSearch (): Promise<ISearchComplete> {
    return {
      results: this.modelService.getModels().map(model => ({
        resource: model.uri
      })),
      messages: []
    }
  }

  async clearCache (): Promise<void> {
  }

  registerSearchResultProvider = unsupported
}
registerSingleton(ISearchService, MonacoSearchService, InstantiationType.Eager)

registerSingleton(IEditSessionIdentityService, class EditSessionIdentityService implements IEditSessionIdentityService {
  _serviceBrand: undefined
  registerEditSessionIdentityProvider = unsupported
  getEditSessionIdentifier = unsupported
  provideEditSessionIdentityMatch = unsupported
  addEditSessionIdentityCreateParticipant = () => new DisposableStore()
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
  _serviceBrand: undefined
  togglePreRelease = unsupported
  isAutoUpdateEnabledFor = unsupported
  updateAutoUpdateEnablementFor = unsupported
  isAutoUpdateEnabled = unsupported
  getAutoUpdateValue = unsupported
  updateAll = unsupported
  toggleApplyExtensionToAllProfiles = unsupported
  whenInitialized = Promise.resolve()
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

registerSingleton(IExtensionManagementServerService, class ExtensionManagementServerService implements IExtensionManagementServerService {
  _serviceBrand = undefined
  localExtensionManagementServer = null
  remoteExtensionManagementServer = null
  webExtensionManagementServer = null

  getExtensionManagementServer = unsupported

  getExtensionInstallLocation = unsupported
}, InstantiationType.Eager)

registerSingleton(IExtensionRecommendationsService, class ExtensionRecommendationsService implements IExtensionRecommendationsService {
  _serviceBrand: undefined
  onDidChangeRecommendations = Event.None
  getAllRecommendationsWithReason = () => ({})
  getImportantRecommendations = async () => []
  getOtherRecommendations = async () => []
  getFileBasedRecommendations = () => []
  getExeBasedRecommendations = async () => ({ important: [], others: [] })
  getConfigBasedRecommendations = async () => ({ important: [], others: [] })
  getWorkspaceRecommendations = async () => []
  getKeymapRecommendations = () => []
  getLanguageRecommendations = () => []
  getRemoteRecommendations = () => []
}, InstantiationType.Eager)
registerSingleton(IUserDataAutoSyncService, class UserDataAutoSyncService implements IUserDataAutoSyncService {
  _serviceBrand: undefined
  readonly onError = Event.None
  turnOn = unsupported
  turnOff = unsupported
  triggerSync = unsupported
}, InstantiationType.Eager)

registerSingleton(IIgnoredExtensionsManagementService, class IgnoredExtensionsManagementService implements IIgnoredExtensionsManagementService {
  _serviceBrand: undefined
  getIgnoredExtensions = () => []
  hasToNeverSyncExtension = () => false
  hasToAlwaysSyncExtension = () => false
  updateIgnoredExtensions = unsupported
  updateSynchronizedExtensions = unsupported
}, InstantiationType.Eager)

registerSingleton(IExtensionRecommendationNotificationService, class ExtensionRecommendationNotificationService implements IExtensionRecommendationNotificationService {
  _serviceBrand: undefined
  readonly ignoredRecommendations: string[] = []
  hasToIgnoreRecommendationNotifications = () => false
  promptImportantExtensionsInstallNotification = unsupported
  promptWorkspaceRecommendations = unsupported
}, InstantiationType.Eager)

registerSingleton(IWebExtensionsScannerService, class WebExtensionsScannerService implements IWebExtensionsScannerService {
  _serviceBrand: undefined
  scanSystemExtensions = async () => []
  scanUserExtensions = async () => []
  scanExtensionsUnderDevelopment = async () => []
  scanExistingExtension = async () => null
  addExtension = unsupported
  addExtensionFromGallery = unsupported
  removeExtension = async () => {}
  copyExtensions = async () => {}
  updateMetadata = unsupported
  scanExtensionManifest = async () => null
}, InstantiationType.Eager)

registerSingleton(IExtensionIgnoredRecommendationsService, class ExtensionIgnoredRecommendationsService implements IExtensionIgnoredRecommendationsService {
  _serviceBrand: undefined
  onDidChangeIgnoredRecommendations = Event.None
  ignoredRecommendations = []
  onDidChangeGlobalIgnoredRecommendation = Event.None
  globalIgnoredRecommendations = []
  toggleGlobalIgnoredRecommendation = unsupported
}, InstantiationType.Eager)

registerSingleton(IWorkspaceExtensionsConfigService, class WorkspaceExtensionsConfigService implements IWorkspaceExtensionsConfigService {
  _serviceBrand: undefined
  onDidChangeExtensionsConfigs = Event.None
  getExtensionsConfigs = unsupported
  getRecommendations = unsupported
  getUnwantedRecommendations = unsupported
  toggleRecommendation = unsupported
  toggleUnwantedRecommendation = unsupported
}, InstantiationType.Eager)

registerSingleton(IWorkbenchExtensionEnablementService, class WorkbenchExtensionEnablementService implements IWorkbenchExtensionEnablementService {
  _serviceBrand: undefined
  getEnablementStates = (extensions: IExtension[]) => extensions.map(() => EnablementState.EnabledGlobally)
  onEnablementChanged = Event.None
  getEnablementState = () => EnablementState.EnabledGlobally
  getDependenciesEnablementStates = () => []
  canChangeEnablement = () => false
  canChangeWorkspaceEnablement = () => false
  isEnabled = () => true
  isEnabledEnablementState = () => true
  isDisabledGlobally = () => false
  setEnablement = unsupported
  updateExtensionsEnablementsWhenWorkspaceTrustChanges = unsupported
}, InstantiationType.Eager)

registerSingleton(ITunnelService, class TunnelService implements ITunnelService {
  _serviceBrand: undefined
  canChangeProtocol = false
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

registerSingleton(IFilesConfigurationService, class FilesConfigurationService implements IFilesConfigurationService {
  _serviceBrand: undefined
  onDidChangeAutoSaveConfiguration = Event.None
  onDidChangeAutoSaveDisabled = Event.None
  hasShortAutoSaveDelay = () => false
  disableAutoSave = unsupported
  onDidChangeReadonly = Event.None
  onDidChangeFilesAssociation = Event.None
  onAutoSaveConfigurationChange = Event.None
  getAutoSaveConfiguration = unsupported
  getAutoSaveMode = unsupported
  toggleAutoSave = unsupported
  onReadonlyChange = Event.None
  isReadonly = unsupported
  updateReadonly = unsupported
  onFilesAssociationChange = Event.None
  isHotExitEnabled = true
  hotExitConfiguration = undefined
  preventSaveConflicts = unsupported
}, InstantiationType.Eager)

registerSingleton(IUntitledTextEditorService, class UntitledTextEditorService implements IUntitledTextEditorService {
  _serviceBrand: undefined
  onDidCreate = Event.None
  canDispose = (): true | Promise<true> => true
  isUntitledWithAssociatedResource = () => false
  onDidChangeDirty = Event.None
  onDidChangeEncoding = Event.None
  onDidChangeLabel = Event.None
  onWillDispose = Event.None
  create = unsupported
  get = () => undefined
  getValue = () => undefined
  resolve = unsupported
}, InstantiationType.Eager)

registerSingleton(IWorkingCopyBackupService, class WorkingCopyBackupService implements IWorkingCopyBackupService {
  _serviceBrand: undefined
  async hasBackups (): Promise<boolean> {
    return false
  }

  hasBackupSync (): boolean {
    return false
  }

  async getBackups (): Promise<readonly IWorkingCopyIdentifier[]> {
    return []
  }

  async resolve<T extends IWorkingCopyBackupMeta> (): Promise<IResolvedWorkingCopyBackup<T> | undefined> {
    return undefined
  }

  async backup (): Promise<void> {
  }

  async discardBackup (): Promise<void> {
  }

  async discardBackups (): Promise<void> {
  }
}, InstantiationType.Eager)
registerSingleton(IWorkingCopyService, class WorkingCopyService implements IWorkingCopyService {
  _serviceBrand: undefined
  onDidRegister = Event.None
  onDidUnregister = Event.None
  onDidChangeDirty = Event.None
  onDidChangeContent = Event.None
  onDidSave = Event.None
  dirtyCount = 0
  dirtyWorkingCopies = []
  modifiedCount = 0
  modifiedWorkingCopies = []
  hasDirty = false
  isDirty = () => false
  workingCopies = []
  registerWorkingCopy (): IDisposable {
    // ignore
    return Disposable.None
  }

  has = () => false
  get = () => undefined
  getAll = () => undefined
}, InstantiationType.Eager)
registerSingleton(IDecorationsService, class DecorationsService implements IDecorationsService {
  _serviceBrand: undefined
  onDidChangeDecorations = Event.None
  registerDecorationsProvider = unsupported
  getDecoration = () => undefined
}, InstantiationType.Eager)
registerSingleton(IElevatedFileService, class ElevatedFileService implements IElevatedFileService {
  _serviceBrand: undefined
  isSupported = () => false
  writeFileElevated = unsupported
}, InstantiationType.Eager)
registerSingleton(IFileDialogService, class FileDialogService implements IFileDialogService {
  preferredHome = unsupported
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

registerSingleton(IJSONEditingService, class JSONEditingService implements IJSONEditingService {
  _serviceBrand: undefined
  write = unsupported
}, InstantiationType.Delayed)

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
  getAllUserAssociations = unsupported
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
  getEditors = () => ([])
}, InstantiationType.Eager)

registerSingleton(IOutputService, class OutputService implements IOutputService {
  _serviceBrand: undefined
  getChannel (): IOutputChannel | undefined {
    return undefined
  }

  getChannelDescriptor (): IOutputChannelDescriptor | undefined {
    return undefined
  }

  getChannelDescriptors (): IOutputChannelDescriptor[] {
    return []
  }

  getActiveChannel (): IOutputChannel | undefined {
    return undefined
  }

  async showChannel (): Promise<void> {
    // ignore
  }

  onActiveOutputChannel = Event.None
}, InstantiationType.Delayed)

registerSingleton(IOutputChannelModelService, class OutputChannelModelService implements IOutputChannelModelService {
  _serviceBrand: undefined
  createOutputChannelModel = unsupported
}, InstantiationType.Delayed)
registerSingleton(IExtensionResourceLoaderService, class ExtensionResourceLoaderService implements IExtensionResourceLoaderService {
  _serviceBrand: undefined
  readExtensionResource = unsupported
  supportsExtensionGalleryResources = false
  isExtensionGalleryResource = () => false
  getExtensionGalleryResourceURL = unsupported
}, InstantiationType.Eager)

registerSingleton(IBuiltinExtensionsScannerService, class BuiltinExtensionsScannerService implements IBuiltinExtensionsScannerService {
  _serviceBrand: undefined
  scanBuiltinExtensions () {
    return Promise.resolve([])
  }
}, InstantiationType.Eager)

registerSingleton(IHoverService, class HoverService implements IHoverService {
  showAndFocusLastHover = unsupported
  _serviceBrand: undefined
  showHover = unsupported
  hideHover = unsupported
}, InstantiationType.Eager)

registerSingleton(IExplorerService, class ExplorerService implements IExplorerService {
  _serviceBrand: undefined
  roots = []
  get sortOrderConfiguration () { return unsupported() }
  getContext = unsupported
  hasViewFocus = unsupported
  setEditable = unsupported
  getEditable = unsupported
  getEditableData = unsupported
  isEditable = unsupported
  findClosest = unsupported
  findClosestRoot = unsupported
  refresh = unsupported
  setToCopy = unsupported
  isCut = unsupported
  applyBulkEdit = unsupported
  select = unsupported
  registerView = unsupported
}, InstantiationType.Delayed)

registerSingleton(IExtensionStorageService, class ExtensionStorageService implements IExtensionStorageService {
  _serviceBrand: undefined
  getExtensionState = () => undefined
  getExtensionStateRaw = () => undefined
  setExtensionState = unsupported
  onDidChangeExtensionStorageToSync = Event.None
  setKeysForSync = unsupported
  getKeysForSync = () => undefined
  addToMigrationList = unsupported
  getSourceExtensionToMigrate = () => undefined
}, InstantiationType.Delayed)

registerSingleton(IGlobalExtensionEnablementService, class GlobalExtensionEnablementService implements IGlobalExtensionEnablementService {
  _serviceBrand: undefined
  onDidChangeEnablement = Event.None
  getDisabledExtensions () {
    return []
  }

  enableExtension () {
    return Promise.resolve(true)
  }

  disableExtension () {
    return Promise.resolve(true)
  }
}, InstantiationType.Delayed)

registerSingleton(ILanguagePackService, class LanguagePackService implements ILanguagePackService {
  _serviceBrand: undefined
  async getAvailableLanguages (): Promise<ILanguagePackItem[]> {
    return []
  }

  async getInstalledLanguages (): Promise<ILanguagePackItem[]> {
    return []
  }

  async getBuiltInExtensionTranslationsUri (id: string, language: string): Promise<URI | undefined> {
    const uri = getBuiltInExtensionTranslationsUris(language)?.[id]
    return uri != null ? URI.parse(uri) : undefined
  }
}, InstantiationType.Delayed)

registerSingleton(ITreeViewsDnDService, class TreeViewsDnDService implements ITreeViewsDnDService {
  _serviceBrand: undefined
  removeDragOperationTransfer = unsupported
  addDragOperationTransfer = unsupported
}, InstantiationType.Delayed)
registerSingleton(ITreeViewsService, class TreeviewsService implements ITreeViewsService {
  _serviceBrand: undefined
  getRenderedTreeElement = unsupported
  addRenderedTreeItemElement = unsupported
  removeRenderedTreeItemElement = unsupported
}, InstantiationType.Delayed)

registerSingleton(IBreadcrumbsService, class BreadcrumbsService implements IBreadcrumbsService {
  _serviceBrand: undefined
  register = unsupported
  getWidget = () => undefined
}, InstantiationType.Eager)

registerSingleton(IOutlineService, class OutlineService implements IOutlineService {
  _serviceBrand: undefined
  onDidChange = Event.None
  canCreateOutline = () => false
  createOutline = async () => undefined
  registerOutlineCreator = unsupported
}, InstantiationType.Eager)

registerSingleton(IUpdateService, class UpdateService implements IUpdateService {
  _serviceBrand: undefined
  onStateChange = Event.None
  state = State.Uninitialized
  checkForUpdates = unsupported
  downloadUpdate = unsupported
  applyUpdate = unsupported
  quitAndInstall = unsupported
  isLatestVersion = async () => true
  _applySpecificUpdate = unsupported
}, InstantiationType.Eager)

registerSingleton(IStatusbarService, class StatusbarService implements IStatusbarService {
  _serviceBrand: undefined
  getPart = unsupported
  createAuxiliaryStatusbarPart = unsupported
  createScoped = unsupported
  dispose = unsupported
  onDidChangeEntryVisibility = Event.None
  addEntry = () => ({
    dispose: () => {},
    update: () => {}
  })

  isEntryVisible = () => false
  updateEntryVisibility = () => { /* ignore */ }
  focus = () => { /* ignore */ }
  focusNextEntry = () => { /* ignore */ }
  focusPreviousEntry = () => { /* ignore */ }
  isEntryFocused = () => false
  overrideStyle = () => Disposable.None
}, InstantiationType.Eager)

registerSingleton(IExtensionGalleryService, class ExtensionGalleryService implements IExtensionGalleryService {
  _serviceBrand: undefined
  isEnabled = () => false
  query = unsupported
  getExtensions = unsupported
  isExtensionCompatible = unsupported
  getCompatibleExtension = unsupported
  getAllCompatibleVersions = unsupported
  download = unsupported
  downloadSignatureArchive = unsupported
  reportStatistic = unsupported
  getReadme = unsupported
  getManifest = unsupported
  getChangelog = unsupported
  getCoreTranslation = unsupported
  getExtensionsControlManifest = unsupported
}, InstantiationType.Eager)

registerSingleton(ITerminalService, class TerminalService implements ITerminalService {
  _serviceBrand: undefined
  moveIntoNewEditor = unsupported
  detachedInstances = []
  onAnyInstanceDataInput = Event.None
  onAnyInstanceIconChange = Event.None
  onAnyInstanceMaximumDimensionsChange = Event.None
  onAnyInstancePrimaryStatusChange = Event.None
  onAnyInstanceProcessIdReady = Event.None
  onAnyInstanceSelectionChange = Event.None
  onAnyInstanceTitleChange = Event.None
  createOnInstanceEvent = unsupported
  createOnInstanceCapabilityEvent = unsupported
  onInstanceEvent = unsupported
  onInstanceCapabilityEvent = unsupported
  createDetachedTerminal = unsupported

  onDidChangeSelection = Event.None

  detachedXterms = []
  get whenConnected () {
    return (async () => {
      unsupported()
    })()
  }

  restoredGroupCount = 0
  createDetachedXterm = unsupported

  instances = []
  get configHelper () {
    return unsupported()
  }

  revealActiveTerminal = unsupported
  isProcessSupportRegistered = false
  connectionState = TerminalConnectionState.Connected
  defaultLocation = TerminalLocation.Panel
  onDidChangeActiveGroup = Event.None
  onDidDisposeGroup = Event.None
  onDidCreateInstance = Event.None
  onDidReceiveProcessId = Event.None
  onDidChangeInstanceDimensions = Event.None
  onDidMaximumDimensionsChange = Event.None
  onDidRequestStartExtensionTerminal = Event.None
  onDidChangeInstanceTitle = Event.None
  onDidChangeInstanceIcon = Event.None
  onDidChangeInstanceColor = Event.None
  onDidChangeInstancePrimaryStatus = Event.None
  onDidInputInstanceData = Event.None
  onDidRegisterProcessSupport = Event.None
  onDidChangeConnectionState = Event.None
  createTerminal = unsupported
  getInstanceFromId = unsupported
  getInstanceFromIndex = unsupported
  getReconnectedTerminals = unsupported
  getActiveOrCreateInstance = unsupported
  moveToEditor = unsupported
  moveToTerminalView = unsupported
  getPrimaryBackend = unsupported
  refreshActiveGroup = unsupported
  registerProcessSupport = () => {}
  showProfileQuickPick = unsupported
  setContainers = unsupported
  requestStartExtensionTerminal = unsupported
  isAttachedToTerminal = unsupported
  getEditableData = unsupported
  setEditable = unsupported
  isEditable = unsupported
  safeDisposeTerminal = unsupported
  getDefaultInstanceHost = unsupported
  getInstanceHost = unsupported
  resolveLocation = unsupported
  setNativeDelegate = unsupported
  toggleEscapeSequenceLogging = unsupported
  getEditingTerminal = unsupported
  setEditingTerminal = unsupported
  activeInstance = undefined
  onDidDisposeInstance = Event.None
  onDidFocusInstance = Event.None
  onDidChangeActiveInstance = Event.None
  onDidChangeInstances = Event.None
  onDidChangeInstanceCapability = Event.None
  setActiveInstance = unsupported
  focusActiveInstance = unsupported
  getInstanceFromResource = unsupported
}, InstantiationType.Delayed)
registerSingleton(ITerminalEditorService, class TerminalEditorService implements ITerminalEditorService {
  _serviceBrand: undefined
  instances = []
  openEditor = unsupported
  detachActiveEditorInstance = unsupported
  detachInstance = unsupported
  splitInstance = unsupported
  revealActiveEditor = unsupported
  resolveResource = unsupported
  reviveInput = unsupported
  getInputFromResource = unsupported
  activeInstance = undefined
  onDidDisposeInstance = Event.None
  onDidFocusInstance = Event.None
  onDidChangeActiveInstance = Event.None
  onDidChangeInstances = Event.None
  onDidChangeInstanceCapability = Event.None
  setActiveInstance = unsupported
  focusActiveInstance = unsupported
  getInstanceFromResource = unsupported
}, InstantiationType.Delayed)

registerSingleton(ITerminalGroupService, class TerminalGroupService implements ITerminalGroupService {
  lastAccessedMenu: 'inline-tab' | 'tab-list' = 'inline-tab'
  _serviceBrand: undefined
  instances = []
  groups = []
  activeGroup = undefined
  activeGroupIndex = 0
  onDidChangeActiveGroup = Event.None
  onDidDisposeGroup = Event.None
  onDidChangeGroups = Event.None
  onDidShow = Event.None
  onDidChangePanelOrientation = Event.None
  createGroup = unsupported
  getGroupForInstance = unsupported
  moveGroup = unsupported
  moveGroupToEnd = unsupported
  moveInstance = unsupported
  unsplitInstance = unsupported
  joinInstances = unsupported
  instanceIsSplit = unsupported
  getGroupLabels = unsupported
  setActiveGroupByIndex = unsupported
  setActiveGroupToNext = unsupported
  setActiveGroupToPrevious = unsupported
  setActiveInstanceByIndex = unsupported
  setContainer = unsupported
  showPanel = unsupported
  hidePanel = unsupported
  focusTabs = unsupported
  focusHover = unsupported
  showTabs = unsupported
  updateVisibility = unsupported
  activeInstance: ITerminalInstance | undefined
  onDidDisposeInstance = Event.None
  onDidFocusInstance = Event.None
  onDidChangeActiveInstance = Event.None
  onDidChangeInstances = Event.None
  onDidChangeInstanceCapability = Event.None
  setActiveInstance = unsupported
  focusActiveInstance = unsupported
  getInstanceFromResource = unsupported
}, InstantiationType.Delayed)
registerSingleton(ITerminalInstanceService, class TerminalInstanceService implements ITerminalInstanceService {
  _serviceBrand: undefined
  getRegisteredBackends = () => [].values()
  onDidCreateInstance = Event.None
  convertProfileToShellLaunchConfig = unsupported
  createInstance = unsupported
  getBackend = unsupported
  didRegisterBackend = unsupported
}, InstantiationType.Delayed)
registerSingleton(ITerminalProfileService, class TerminalProfileService implements ITerminalProfileService {
  _serviceBrand: undefined
  availableProfiles = []
  contributedProfiles = []
  profilesReady = Promise.resolve()
  getPlatformKey = unsupported
  refreshAvailableProfiles = unsupported
  getDefaultProfileName = () => undefined
  getDefaultProfile = () => undefined
  onDidChangeAvailableProfiles = Event.None
  getContributedDefaultProfile = unsupported
  registerContributedProfile = unsupported
  getContributedProfileProvider = unsupported
  registerTerminalProfileProvider = unsupported
}, InstantiationType.Delayed)

registerSingleton(ITerminalLogService, class TerminalLogService implements ITerminalLogService {
  _logBrand: undefined
  _serviceBrand: undefined
  onDidChangeLogLevel = Event.None
  getLevel = unsupported
  setLevel = unsupported
  trace = unsupported
  debug = unsupported
  info = unsupported
  warn = unsupported
  error = unsupported
  flush = unsupported
  dispose = unsupported
}, InstantiationType.Delayed)

registerSingleton(ITerminalLinkProviderService, class TerminalLinkProviderService implements ITerminalLinkProviderService {
  _serviceBrand: undefined
  linkProviders = new Set([])
  onDidAddLinkProvider = Event.None
  onDidRemoveLinkProvider = Event.None
  registerLinkProvider = unsupported
}, InstantiationType.Delayed)

registerSingleton(ITerminalContributionService, class TerminalContributionService implements ITerminalContributionService {
  _serviceBrand: undefined
  terminalProfiles = []
}, InstantiationType.Delayed)

registerSingleton(ITerminalProfileResolverService, class TerminalProfileResolverService implements ITerminalProfileResolverService {
  _serviceBrand: undefined
  defaultProfileName: string | undefined
  resolveIcon = unsupported
  resolveShellLaunchConfig = unsupported
  getDefaultProfile = async () => ({
    profileName: 'bash',
    path: '/bin/bash',
    isDefault: true
  })

  getDefaultShell = unsupported
  getDefaultShellArgs = unsupported
  getDefaultIcon = unsupported
  getEnvironment = unsupported
  createProfileFromShellAndShellArgs = unsupported
}, InstantiationType.Delayed)

registerSingleton(IEnvironmentVariableService, class EnvironmentVariableService implements IEnvironmentVariableService {
  _serviceBrand: undefined
  collections = new Map()
  get mergedCollection () {
    return unsupported()
  }

  onDidChangeCollections = Event.None
  set = unsupported
  delete = unsupported
}, InstantiationType.Delayed)

registerSingleton(ITerminalQuickFixService, class TerminalQuickFixService implements ITerminalQuickFixService {
  _serviceBrand: undefined
  onDidRegisterProvider = Event.None
  onDidRegisterCommandSelector = Event.None
  onDidUnregisterProvider = Event.None
  extensionQuickFixes = Promise.resolve([])
  providers = new Map()
  registerQuickFixProvider = unsupported
  registerCommandSelector = unsupported
}, InstantiationType.Delayed)

registerSingleton(IExtensionManagementService, class ExtensionManagementService implements IExtensionManagementService {
  toggleAppliationScope = async (extension: ILocalExtension) => extension
  _serviceBrand: undefined
  installGalleryExtensions = unsupported
  onInstallExtension = Event.None
  onDidInstallExtensions = Event.None
  onUninstallExtension = Event.None
  onDidUninstallExtension = Event.None
  onDidUpdateExtensionMetadata = Event.None
  zip = unsupported
  unzip = unsupported
  getManifest = unsupported
  install = unsupported
  canInstall = unsupported
  installFromGallery = unsupported
  installFromLocation = unsupported
  installExtensionsFromProfile = unsupported
  uninstall = unsupported
  reinstallFromGallery = unsupported
  getInstalled = async () => []
  getExtensionsControlManifest = unsupported
  copyExtensions = unsupported
  updateMetadata = unsupported
  download = unsupported
  registerParticipant = unsupported
  getTargetPlatform = unsupported
  cleanUp = unsupported
}, InstantiationType.Delayed)

registerSingleton(IUserDataSyncWorkbenchService, class UserDataSyncWorkbenchService implements IUserDataSyncWorkbenchService {
  _serviceBrand: undefined
  enabled = false
  authenticationProviders = []
  all = []
  current = undefined
  accountStatus = AccountStatus.Unavailable
  onDidChangeAccountStatus = Event.None
  turnOn = unsupported
  turnoff = unsupported
  signIn = unsupported
  resetSyncedData = unsupported
  showSyncActivity = unsupported
  syncNow = unsupported
  synchroniseUserDataSyncStoreType = unsupported
  showConflicts = unsupported
  accept = unsupported
  getAllLogResources = unsupported
  downloadSyncActivity = unsupported
}, InstantiationType.Delayed)

registerSingleton(IUserDataSyncEnablementService, class UserDataSyncEnablementService implements IUserDataSyncEnablementService {
  _serviceBrand: undefined
  onDidChangeEnablement = Event.None
  isEnabled = () => false
  canToggleEnablement = () => false
  setEnablement = unsupported
  onDidChangeResourceEnablement = Event.None
  isResourceEnabled = () => false
  setResourceEnablement = unsupported
  getResourceSyncStateVersion = () => undefined
}, InstantiationType.Delayed)

registerSingleton(IKeybindingEditingService, class KeybindingEditingService implements IKeybindingEditingService {
  _serviceBrand: undefined
  addKeybinding = unsupported
  editKeybinding = unsupported
  removeKeybinding = unsupported
  resetKeybinding = unsupported
}, InstantiationType.Delayed)

registerSingleton(IPreferencesSearchService, class PreferencesSearchService implements IPreferencesSearchService {
  _serviceBrand: undefined
  getLocalSearchProvider = unsupported
  getRemoteSearchProvider = unsupported
}, InstantiationType.Delayed)

registerSingleton(INotebookService, class NotebookService implements INotebookService {
  _serviceBrand: undefined
  canResolve = async () => false
  onAddViewType = Event.None
  onWillRemoveViewType = Event.None
  onDidChangeOutputRenderers = Event.None
  onWillAddNotebookDocument = Event.None
  onDidAddNotebookDocument = Event.None
  onWillRemoveNotebookDocument = Event.None
  onDidRemoveNotebookDocument = Event.None
  registerNotebookSerializer = unsupported
  withNotebookDataProvider = unsupported
  getOutputMimeTypeInfo = unsupported
  getViewTypeProvider = () => undefined
  getRendererInfo = () => undefined
  getRenderers = () => []
  getStaticPreloads = unsupported
  updateMimePreferredRenderer = unsupported
  saveMimeDisplayOrder = unsupported
  createNotebookTextModel = unsupported
  getNotebookTextModel = () => undefined
  getNotebookTextModels = unsupported
  listNotebookDocuments = () => []
  registerContributedNotebookType = unsupported
  getContributedNotebookType = unsupported
  getContributedNotebookTypes = () => []
  getNotebookProviderResourceRoots = () => []
  setToCopy = unsupported
  getToCopy = unsupported
  clearEditorCache = unsupported
}, InstantiationType.Delayed)

registerSingleton(IReplaceService, class ReplaceService implements IReplaceService {
  _serviceBrand: undefined
  replace = unsupported
  openReplacePreview = unsupported
  updateReplacePreview = unsupported
}, InstantiationType.Delayed)

registerSingleton(ISearchHistoryService, class SearchHistoryService implements ISearchHistoryService {
  _serviceBrand: undefined
  onDidClearHistory = Event.None
  clearHistory = unsupported
  load = unsupported
  save = unsupported
}, InstantiationType.Delayed)

registerSingleton(INotebookEditorService, class NotebookEditorService implements INotebookEditorService {
  _serviceBrand: undefined
  retrieveWidget = unsupported
  retrieveExistingWidgetFromURI = () => undefined
  retrieveAllExistingWidgets = () => []
  onDidAddNotebookEditor = Event.None
  onDidRemoveNotebookEditor = Event.None
  addNotebookEditor = unsupported
  removeNotebookEditor = unsupported
  getNotebookEditor = () => undefined
  listNotebookEditors = () => []
}, InstantiationType.Delayed)

registerSingleton(ISearchViewModelWorkbenchService, class SearchWorkbenchService implements ISearchViewModelWorkbenchService {
  _serviceBrand: undefined
  get searchModel () {
    return unsupported()
  }
}, InstantiationType.Delayed)

registerSingleton(INotebookEditorModelResolverService, class NotebookEditorModelResolverService implements INotebookEditorModelResolverService {
  _serviceBrand: undefined
  onDidSaveNotebook = Event.None
  onDidChangeDirty = Event.None
  onWillFailWithConflict = Event.None
  isDirty = unsupported
  resolve = unsupported
}, InstantiationType.Delayed)

registerSingleton(IWorkingCopyEditorService, class WorkingCopyEditorService implements IWorkingCopyEditorService {
  _serviceBrand: undefined
  onDidRegisterHandler = Event.None
  registerHandler = () => Disposable.None
  findEditor = () => undefined
}, InstantiationType.Delayed)
registerSingleton(IUserActivityService, class UserActivityService implements IUserActivityService {
  _serviceBrand: undefined
  isActive = false
  onDidChangeIsActive = Event.None
  markActive = unsupported
}, InstantiationType.Delayed)
registerSingleton(ICanonicalUriService, class CanonicalUriService implements ICanonicalUriService {
  _serviceBrand: undefined
  registerCanonicalUriProvider = unsupported
}, InstantiationType.Delayed)
registerSingleton(IExtensionStatusBarItemService, class ExtensionStatusBarItemService implements IExtensionStatusBarItemService {
  _serviceBrand: undefined
  onDidChange = Event.None
  setOrUpdateEntry (): StatusBarUpdateKind {
    // ignore
    return StatusBarUpdateKind.DidUpdate
  }

  unsetEntry (): void {
  }

  getEntries (): Iterable<ExtensionStatusBarEntry> {
    return []
  }
}, InstantiationType.Delayed)
registerSingleton(IWorkbenchAssignmentService, class WorkbenchAssignmentService implements IWorkbenchAssignmentService {
  _serviceBrand: undefined
  getCurrentExperiments = async () => []
  getTreatment = async () => undefined
}, InstantiationType.Delayed)

registerSingleton(IChatService, class ChatService implements IChatService {
  _serviceBrand: undefined
  onDidUnregisterProvider = Event.None
  clearAllHistoryEntries = unsupported
  onDidSubmitAgent = Event.None
  onDidRegisterProvider = Event.None
  hasSessions = () => false
  onDidDisposeSession = Event.None
  transferredSessionData = undefined
  onDidSubmitSlashCommand = Event.None
  getSessionId = () => undefined
  transferredSessionId = undefined
  transferChatSession = unsupported
  registerProvider = unsupported
  registerSlashCommandProvider = unsupported
  getProviderInfos = () => []
  startSession = unsupported
  getSession = () => undefined
  getOrRestoreSession = () => undefined
  loadSessionFromContent = () => undefined
  sendRequest = unsupported
  removeRequest = unsupported
  cancelCurrentRequestForSession = unsupported
  getSlashCommands = unsupported
  clearSession = unsupported
  addRequest = unsupported
  addCompleteRequest = unsupported
  sendRequestToProvider = unsupported
  getHistory = () => []
  removeHistoryEntry = unsupported
  onDidPerformUserAction = Event.None
  notifyUserAction = unsupported
}, InstantiationType.Delayed)

registerSingleton(IQuickChatService, class QuickChatService implements IQuickChatService {
  focused = false
  _serviceBrand: undefined
  onDidClose = Event.None
  enabled = false
  toggle = unsupported
  focus = unsupported
  open = unsupported
  close = unsupported
  openInChatView = unsupported
}, InstantiationType.Delayed)

registerSingleton(IChatAgentService, class QuickChatService implements IChatAgentService {
  getFollowups = unsupported
  getDefaultAgent = unsupported
  getSecondaryAgent = unsupported
  updateAgent = unsupported
  _serviceBrand = undefined
  onDidChangeAgents = Event.None
  registerAgentData = unsupported
  registerAgentCallback = unsupported
  registerAgent = unsupported
  invokeAgent = unsupported
  getAgents = unsupported
  getAgent = unsupported
  hasAgent = unsupported
}, InstantiationType.Delayed)

registerSingleton(IEmbedderTerminalService, class EmbedderTerminalService implements IEmbedderTerminalService {
  _serviceBrand: undefined
  onDidCreateTerminal = Event.None
  createTerminal = unsupported
}, InstantiationType.Delayed)

registerSingleton(ICustomEditorService, class CustomEditorService implements ICustomEditorService {
  _serviceBrand: undefined
  get models () {
    return unsupported()
  }

  getCustomEditor = unsupported
  getAllCustomEditors = unsupported
  getContributedCustomEditors = unsupported
  getUserConfiguredCustomEditors = unsupported
  registerCustomEditorCapabilities = () => Disposable.None
  getCustomEditorCapabilities = () => undefined
}, InstantiationType.Delayed)

registerSingleton(IWebviewService, class WebviewService implements IWebviewService {
  _serviceBrand: undefined
  activeWebview: IWebview | undefined
  webviews = []
  onDidChangeActiveWebview = Event.None
  createWebviewElement = unsupported
  createWebviewOverlay = unsupported
}, InstantiationType.Delayed)

registerSingleton(IWebviewViewService, class WebviewService implements IWebviewViewService {
  _serviceBrand: undefined
  onNewResolverRegistered = Event.None
  register = unsupported
  resolve = unsupported
}, InstantiationType.Delayed)

registerSingleton(ILocaleService, class LocaleService implements ILocaleService {
  _serviceBrand: undefined
  setLocale = unsupported

  clearLocalePreference () {
    return Promise.resolve()
  }
}, InstantiationType.Delayed)

registerSingleton(IWebviewWorkbenchService, class WebviewWorkbenchService implements IWebviewWorkbenchService {
  _serviceBrand: undefined
  get iconManager () {
    return unsupported()
  }

  onDidChangeActiveWebviewEditor = Event.None
  openWebview = unsupported
  openRevivedWebview = unsupported
  revealWebview = unsupported
  registerResolver = () => Disposable.None
  shouldPersist = unsupported
  resolveWebview = unsupported
}, InstantiationType.Delayed)

registerSingleton(IRemoteAuthorityResolverService, class RemoteAuthorityResolverService implements IRemoteAuthorityResolverService {
  _serviceBrand: undefined
  onDidChangeConnectionData = Event.None
  resolveAuthority = unsupported
  getConnectionData = unsupported
  getCanonicalURI = unsupported
  _clearResolvedAuthority = unsupported
  _setResolvedAuthority = unsupported
  _setResolvedAuthorityError = unsupported
  _setAuthorityConnectionToken = unsupported
  _setCanonicalURIProvider = unsupported
}, InstantiationType.Delayed)

registerSingleton(IExternalUriOpenerService, class ExternalUriOpenerService implements IExternalUriOpenerService {
  _serviceBrand: undefined
  registerExternalOpenerProvider = () => Disposable.None
  getOpener = async () => undefined
}, InstantiationType.Delayed)

registerSingleton(IAccessibleViewService, class AccessibleViewService implements IAccessibleViewService {
  showLastProvider = unsupported
  showAccessibleViewHelp = unsupported
  goToSymbol = unsupported
  disableHint = unsupported
  next = unsupported
  previous = unsupported
  getOpenAriaHint = unsupported
  _serviceBrand: undefined
  show = unsupported
  registerProvider = unsupported
  getPosition = unsupported
  setPosition = unsupported
  getLastPosition = unsupported
}, InstantiationType.Delayed)

registerSingleton(IWorkbenchExtensionManagementService, class WorkbenchExtensionManagementService implements IWorkbenchExtensionManagementService {
  toggleAppliationScope = async (extension: ILocalExtension) => extension
  _serviceBrand: undefined
  onInstallExtension = Event.None
  onDidInstallExtensions = Event.None
  onUninstallExtension = Event.None
  onDidUninstallExtension = Event.None
  onDidChangeProfile = Event.None
  installVSIX = unsupported
  installFromLocation = unsupported
  updateFromGallery = unsupported
  onDidUpdateExtensionMetadata = Event.None
  zip = unsupported
  unzip = unsupported
  getManifest = unsupported
  install = unsupported
  canInstall = unsupported
  installFromGallery = unsupported
  installGalleryExtensions = unsupported
  installExtensionsFromProfile = unsupported
  uninstall = unsupported
  reinstallFromGallery = unsupported
  getInstalled = unsupported
  getExtensionsControlManifest = unsupported
  copyExtensions = unsupported
  updateMetadata = unsupported
  download = unsupported
  registerParticipant = unsupported
  getTargetPlatform = unsupported
  cleanUp = unsupported
}, InstantiationType.Delayed)

registerSingleton(IExtensionManifestPropertiesService, class ExtensionManifestPropertiesService implements IExtensionManifestPropertiesService {
  _serviceBrand: undefined
  prefersExecuteOnUI = unsupported
  prefersExecuteOnWorkspace = unsupported
  prefersExecuteOnWeb = unsupported
  canExecuteOnUI = unsupported
  canExecuteOnWorkspace = unsupported
  canExecuteOnWeb = unsupported
  getExtensionKind = unsupported
  getUserConfiguredExtensionKind = unsupported
  getExtensionUntrustedWorkspaceSupportType = unsupported
  getExtensionVirtualWorkspaceSupportType = unsupported
}, InstantiationType.Delayed)

registerSingleton(IWorkspaceTrustEnablementService, class WorkspaceTrustEnablementService implements IWorkspaceTrustEnablementService {
  _serviceBrand: undefined
  isWorkspaceTrustEnabled (): boolean {
    return false
  }
}, InstantiationType.Delayed)

registerSingleton(IRemoteExtensionsScannerService, class RemoteExtensionsScannerService implements IRemoteExtensionsScannerService {
  _serviceBrand: undefined
  whenExtensionsReady (): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async scanExtensions (): Promise<Readonly<IRelaxedExtensionDescription>[]> {
    return []
  }

  async scanSingleExtension (): Promise<Readonly<IRelaxedExtensionDescription> | null> {
    return null
  }
}, InstantiationType.Delayed)

registerSingleton(IURLService, class URLService implements IURLService {
  _serviceBrand: undefined
  create = unsupported
  open = async () => false
  registerHandler = unsupported
}, InstantiationType.Delayed)

registerSingleton(IRemoteSocketFactoryService, class RemoteSocketFactoryService implements IRemoteSocketFactoryService {
  _serviceBrand: undefined
  register = unsupported
  connect = unsupported
}, InstantiationType.Delayed)

registerSingleton(IQuickDiffService, class QuickDiffService implements IQuickDiffService {
  _serviceBrand: undefined
  onDidChangeQuickDiffProviders = Event.None
  addQuickDiffProvider = unsupported
  getQuickDiffs = unsupported
}, InstantiationType.Delayed)

registerSingleton(ISCMService, class SCMService implements ISCMService {
  _serviceBrand: undefined
  onDidChangeInputValueProviders = Event.None
  getDefaultInputValueProvider = unsupported
  registerSCMInputValueProvider = unsupported
  onDidAddRepository = Event.None
  onDidRemoveRepository = Event.None
  repositories = []
  repositoryCount = 0
  registerSCMProvider = unsupported
  getRepository = unsupported
}, InstantiationType.Delayed)

registerSingleton(IDownloadService, class DownloadService implements IDownloadService {
  _serviceBrand: undefined
  download = unsupported
}, InstantiationType.Delayed)

registerSingleton(IExtensionUrlHandler, class ExtensionUrlHandler implements IExtensionUrlHandler {
  _serviceBrand: undefined
  registerExtensionHandler = unsupported
  unregisterExtensionHandler = unsupported
}, InstantiationType.Delayed)

registerSingleton(ICommentService, class CommentService implements ICommentService {
  _serviceBrand: undefined

  get commentsModel () {
    return unsupported()
  }

  onDidChangeActiveEditingCommentThread = Event.None
  setActiveEditingCommentThread = unsupported
  setActiveCommentAndThread = unsupported

  onDidSetResourceCommentInfos = Event.None
  onDidSetAllCommentThreads = Event.None
  onDidUpdateCommentThreads = Event.None
  onDidUpdateNotebookCommentThreads = Event.None
  onDidChangeActiveCommentThread = Event.None
  onDidChangeCurrentCommentThread = Event.None
  onDidUpdateCommentingRanges = Event.None
  onDidChangeActiveCommentingRange = Event.None
  onDidSetDataProvider = Event.None
  onDidDeleteDataProvider = Event.None
  onDidChangeCommentingEnabled = Event.None
  isCommentingEnabled = false
  setDocumentComments = unsupported
  setWorkspaceComments = unsupported
  removeWorkspaceComments = unsupported
  registerCommentController = unsupported
  unregisterCommentController = () => {}
  getCommentController = unsupported
  createCommentThreadTemplate = unsupported
  updateCommentThreadTemplate = unsupported
  getCommentMenus = unsupported
  updateComments = unsupported
  updateNotebookComments = unsupported
  disposeCommentThread = unsupported
  getDocumentComments = async () => []
  getNotebookComments = async () => []
  updateCommentingRanges = unsupported
  hasReactionHandler = unsupported
  toggleReaction = unsupported
  setActiveCommentThread = unsupported
  setCurrentCommentThread = unsupported
  enableCommenting = unsupported
  registerContinueOnCommentProvider = unsupported
  removeContinueOnComment = unsupported
}, InstantiationType.Delayed)

registerSingleton(INotebookCellStatusBarService, class NotebookCellStatusBarService implements INotebookCellStatusBarService {
  _serviceBrand: undefined
  onDidChangeProviders = Event.None
  onDidChangeItems = Event.None
  registerCellStatusBarItemProvider = unsupported
  getStatusBarItemsForCell = unsupported
}, InstantiationType.Delayed)

registerSingleton(INotebookKernelService, class NotebookKernelService implements INotebookKernelService {
  _serviceBrand: undefined
  onDidNotebookVariablesUpdate = Event.None
  notifyVariablesChange = unsupported
  onDidAddKernel = Event.None
  onDidRemoveKernel = Event.None
  onDidChangeSelectedNotebooks = Event.None
  onDidChangeNotebookAffinity = Event.None
  registerKernel = unsupported
  getMatchingKernel = unsupported
  getSelectedOrSuggestedKernel = unsupported
  selectKernelForNotebook = unsupported
  preselectKernelForNotebook = unsupported
  updateKernelNotebookAffinity = unsupported
  onDidChangeKernelDetectionTasks = Event.None
  registerNotebookKernelDetectionTask = unsupported
  getKernelDetectionTasks = unsupported
  onDidChangeSourceActions = Event.None
  getSourceActions = unsupported
  getRunningSourceActions = unsupported
  registerKernelSourceActionProvider = unsupported
  getKernelSourceActions2 = unsupported
}, InstantiationType.Delayed)

registerSingleton(INotebookRendererMessagingService, class NotebookRendererMessagingService implements INotebookRendererMessagingService {
  _serviceBrand: undefined
  onShouldPostMessage = Event.None
  prepare = unsupported
  getScoped = unsupported
  receiveMessage = unsupported
}, InstantiationType.Delayed)

registerSingleton(IInteractiveHistoryService, class InteractiveHistoryService implements IInteractiveHistoryService {
  _serviceBrand: undefined
  addToHistory = unsupported
  getPreviousValue = unsupported
  getNextValue = unsupported
  replaceLast = unsupported
  clearHistory = unsupported
  has = unsupported
}, InstantiationType.Delayed)

registerSingleton(IInteractiveDocumentService, class InteractiveDocumentService implements IInteractiveDocumentService {
  _serviceBrand: undefined
  onWillAddInteractiveDocument = Event.None
  onWillRemoveInteractiveDocument = Event.None
  willCreateInteractiveDocument = unsupported
  willRemoveInteractiveDocument = unsupported
}, InstantiationType.Delayed)

registerSingleton(IActiveLanguagePackService, class ActiveLanguagePackService implements IActiveLanguagePackService {
  readonly _serviceBrand: undefined
  getExtensionIdProvidingCurrentLocale () {
    return Promise.resolve(undefined)
  }
}, InstantiationType.Eager)

registerSingleton(IRemoteUserDataProfilesService, class RemoteUserDataProfilesService implements IRemoteUserDataProfilesService {
  _serviceBrand: undefined
  getRemoteProfiles = async () => []
  getRemoteProfile = unsupported
}, InstantiationType.Eager)

registerSingleton(IExtensionBisectService, class ExtensionBisectService implements IExtensionBisectService {
  _serviceBrand: undefined
  isDisabledByBisect = () => false
  isActive = false
  disabledCount = 0
  start = unsupported
  next = unsupported
  reset = unsupported
}, InstantiationType.Eager)
registerSingleton(IUserDataSyncAccountService, class UserDataSyncAccountService implements IUserDataSyncAccountService {
  _serviceBrand: undefined

  readonly onTokenFailed = Event.None
  readonly account = undefined
  readonly onDidChangeAccount = Event.None
  updateAccount (): Promise<void> {
    return Promise.resolve()
  }
}, InstantiationType.Eager)

registerSingleton(IInlineChatService, class InlineChatService implements IInlineChatService {
  onDidChangeProviders = Event.None
  _serviceBrand: undefined
  addProvider = unsupported
  getAllProvider = () => []
}, InstantiationType.Delayed)

registerSingleton(IChatWidgetService, class ChatWidgetService implements IChatWidgetService {
  _serviceBrand: undefined
  getWidgetBySessionId = () => undefined
  lastFocusedWidget = undefined
  revealViewForProvider = unsupported
  getWidgetByInputUri = unsupported
}, InstantiationType.Delayed)

registerSingleton(IRemoteExplorerService, class RemoteExplorerService implements IRemoteExplorerService {
  onDidChangeHelpInformation = Event.None
  get helpInformation () {
    return unsupported()
  }

  _serviceBrand: undefined
  onDidChangeTargetType = Event.None
  targetType = []
  get tunnelModel () {
    return unsupported()
  }

  onDidChangeEditable = Event.None
  setEditable = unsupported
  getEditableData = unsupported
  forward = unsupported
  close = unsupported
  setTunnelInformation = unsupported
  setCandidateFilter = unsupported
  onFoundNewCandidates = unsupported
  restore = unsupported
  enablePortsFeatures = unsupported
  onEnabledPortsFeatures = Event.None
  portsFeaturesEnabled = false
  namedProcesses = new Map()
}, InstantiationType.Delayed)

registerSingleton(IAuthenticationService, class AuthenticationService implements IAuthenticationService {
  _serviceBrand: undefined
  onDidChangeExtensionSessionAccess = Event.None
  readAllowedExtensions = () => []
  isAuthenticationProviderRegistered = () => false
  getProviderIds = () => []
  registerAuthenticationProvider = unsupported
  unregisterAuthenticationProvider = unsupported
  isAccessAllowed = () => false
  updateAllowedExtension = unsupported
  updateSessionPreference = unsupported
  getSessionPreference = () => undefined
  removeSessionPreference = unsupported
  showGetSessionPrompt = unsupported
  selectSession = unsupported
  requestSessionAccess = unsupported
  completeSessionAccessRequest = unsupported
  requestNewSession = unsupported
  sessionsUpdate = unsupported
  onDidRegisterAuthenticationProvider = Event.None
  onDidUnregisterAuthenticationProvider = Event.None
  onDidChangeSessions = Event.None
  declaredProviders = []
  onDidChangeDeclaredProviders = Event.None
  getSessions = async () => []
  getLabel = unsupported
  supportsMultipleAccounts = () => false
  createSession = unsupported
  removeSession = unsupported
  manageTrustedExtensionsForAccount = unsupported
  removeAccountSessions = unsupported
}, InstantiationType.Delayed)

registerSingleton(ITimelineService, class TimelineService implements ITimelineService {
  _serviceBrand: undefined
  onDidChangeProviders = Event.None
  onDidChangeTimeline = Event.None
  onDidChangeUri = Event.None
  registerTimelineProvider = unsupported
  unregisterTimelineProvider = unsupported
  getSources = () => []
  getTimeline = unsupported
  setUri = unsupported
}, InstantiationType.Delayed)

registerSingleton(ITestService, class TestService implements ITestService {
  _serviceBrand: undefined
  onDidCancelTestRun = Event.None
  get excluded () {
    return unsupported()
  }

  get collection () {
    return unsupported()
  }

  onWillProcessDiff = Event.None
  onDidProcessDiff = Event.None
  get showInlineOutput () {
    return unsupported()
  }

  registerTestController = unsupported
  getTestController = () => undefined
  refreshTests = unsupported
  cancelRefreshTests = unsupported
  startContinuousRun = unsupported
  runTests = unsupported
  runResolvedTests = unsupported
  syncTests = unsupported
  cancelTestRun = unsupported
  publishDiff = unsupported
}, InstantiationType.Delayed)

registerSingleton(ISecretStorageService, class SecretStorageService implements ISecretStorageService {
  _serviceBrand: undefined
  onDidChangeSecret = Event.None
  type: 'in-memory' = 'in-memory'
  get = async () => undefined
  set = unsupported
  delete = unsupported
}, InstantiationType.Delayed)

registerSingleton(IShareService, class ShareService implements IShareService {
  _serviceBrand: undefined
  registerShareProvider = unsupported
  getShareActions = () => []
  provideShare = async () => undefined
}, InstantiationType.Delayed)

registerSingleton(IUserDataProfileImportExportService, class UserDataProfileImportExportService implements IUserDataProfileImportExportService {
  _serviceBrand: undefined
  createProfile = unsupported
  editProfile = unsupported
  registerProfileContentHandler = unsupported
  unregisterProfileContentHandler = unsupported
  exportProfile = unsupported
  importProfile = unsupported
  showProfileContents = unsupported
  createFromCurrentProfile = unsupported
  createTroubleshootProfile = unsupported
  setProfile = unsupported
}, InstantiationType.Delayed)

registerSingleton(IWorkbenchIssueService, class WorkbenchIssueService implements IWorkbenchIssueService {
  registerIssueDataProvider = unsupported
  _serviceBrand: undefined
  openReporter = unsupported
  openProcessExplorer = unsupported
  registerIssueUriRequestHandler = unsupported
}, InstantiationType.Delayed)

registerSingleton(ISCMViewService, class SCMViewService implements ISCMViewService {
  _serviceBrand: undefined
  get menus () {
    return unsupported()
  }

  repositories = []
  onDidChangeRepositories = Event.None
  visibleRepositories = []
  onDidChangeVisibleRepositories = Event.None
  isVisible = () => false
  toggleVisibility = unsupported
  toggleSortKey = unsupported
  focusedRepository = undefined
  onDidFocusRepository = Event.None
  focus = unsupported
}, InstantiationType.Delayed)

registerSingleton(INotebookExecutionStateService, class NotebookExecutionStateService implements INotebookExecutionStateService {
  _serviceBrand: undefined
  onDidChangeExecution = Event.None
  onDidChangeLastRunFailState = Event.None
  forceCancelNotebookExecutions = unsupported
  getCellExecutionsForNotebook = unsupported
  getCellExecutionsByHandleForNotebook = unsupported
  getCellExecution = unsupported
  createCellExecution = unsupported
  getExecution = unsupported
  createExecution = unsupported
  getLastFailedCellForNotebook = unsupported
}, InstantiationType.Delayed)

registerSingleton(IChatContributionService, class ChatContributionService implements IChatContributionService {
  _serviceBrand: undefined
  registeredProviders = []
  getViewIdForProvider = unsupported
  registerChatProvider = unsupported
  deregisterChatProvider = unsupported
}, InstantiationType.Delayed)

registerSingleton(ITestProfileService, class TestProfileService implements ITestProfileService {
  _serviceBrand: undefined
  onDidChange = Event.None
  addProfile = unsupported
  updateProfile = unsupported
  removeProfile = unsupported
  capabilitiesForTest = unsupported
  configure = unsupported
  all = () => []
  getGroupDefaultProfiles = () => []
  setGroupDefaultProfiles = unsupported
  getControllerProfiles = () => []
}, InstantiationType.Delayed)

registerSingleton(IEncryptionService, class EncryptionService implements IEncryptionService {
  setUsePlainTextEncryption = unsupported
  getKeyStorageProvider = unsupported
  _serviceBrand: undefined
  encrypt = unsupported
  decrypt = unsupported
  isEncryptionAvailable = unsupported
}, InstantiationType.Delayed)

registerSingleton(ITestResultService, class TestResultService implements ITestResultService {
  _serviceBrand: undefined
  onResultsChanged = Event.None
  onTestChanged = Event.None
  results = []
  clear = unsupported
  createLiveResult = unsupported
  push = unsupported
  getResult = () => undefined
  getStateById = () => undefined
}, InstantiationType.Delayed)

registerSingleton(ITestResultStorage, class TestResultStorage implements ITestResultStorage {
  _serviceBrand: undefined
  read = unsupported
  persist = unsupported
}, InstantiationType.Delayed)

registerSingleton(ITestingDecorationsService, class TestingDecorationsService implements ITestingDecorationsService {
  _serviceBrand: undefined
  onDidChange = Event.None
  invalidateResultMessage = unsupported
  syncDecorations = unsupported
  getDecoratedTestPosition = unsupported
}, InstantiationType.Delayed)

registerSingleton(IUserDataInitializationService, class UserDataInitializationService implements IUserDataInitializationService {
  _serviceBrand: undefined
  requiresInitialization = async () => false
  whenInitializationFinished = async () => {}
  initializeRequiredResources = async () => {}
  initializeInstalledExtensions = async () => {}
  initializeOtherResources = async () => {}
}, InstantiationType.Delayed)

registerSingleton(IDiagnosticsService, NullDiagnosticsService, InstantiationType.Delayed)

registerSingleton(INotebookSearchService, class NotebookSearchService implements INotebookSearchService {
  notebookSearch () {
    return {
      openFilesToScan: new ResourceSet(),
      completeData: Promise.resolve({
        results: [],
        messages: []
      }),
      allScannedFiles: Promise.resolve(new ResourceSet())
    }
  }

  _serviceBrand: undefined
}, InstantiationType.Delayed)

registerSingleton(IChatProviderService, class ChatProviderService implements IChatProviderService {
  _serviceBrand: undefined
  onDidChangeProviders = Event.None
  getProviders = () => []
  lookupChatResponseProvider = unsupported
  registerChatResponseProvider = unsupported
  fetchChatResponse = unsupported
}, InstantiationType.Delayed)

registerSingleton(IChatSlashCommandService, class ChatSlashCommandService implements IChatSlashCommandService {
  onDidChangeCommands = unsupported
  registerSlashData = unsupported
  registerSlashCallback = unsupported
  registerSlashCommand = unsupported
  executeCommand = unsupported
  getCommands = unsupported
  hasCommand = unsupported
  _serviceBrand: undefined
}, InstantiationType.Delayed)

registerSingleton(IChatVariablesService, class ChatVariablesService implements IChatVariablesService {
  getDynamicVariables = unsupported
  getDynamicReferences = unsupported
  registerVariable = unsupported
  getVariables = unsupported
  resolveVariables = unsupported
  hasVariable = unsupported
  _serviceBrand: undefined
}, InstantiationType.Delayed)

registerSingleton(IAiRelatedInformationService, class AiRelatedInformationService implements IAiRelatedInformationService {
  isEnabled = () => false
  getRelatedInformation = unsupported
  registerAiRelatedInformationProvider = unsupported
  _serviceBrand: undefined
}, InstantiationType.Delayed)

registerSingleton(IAiEmbeddingVectorService, class AiEmbeddingVectorService implements IAiEmbeddingVectorService {
  _serviceBrand: undefined
  isEnabled = () => false
  getEmbeddingVector = unsupported
  registerAiEmbeddingVectorProvider = unsupported
}, InstantiationType.Delayed)

registerSingleton(ISignService, class SignService implements ISignService {
  _serviceBrand: undefined
  private static _nextId = 1

  async createNewMessage (value: string): Promise<IMessage> {
    const id = String(SignService._nextId++)
    return {
      id,
      data: value
    }
  }

  async validate (): Promise<boolean> {
    return true
  }

  async sign (value: string): Promise<string> {
    return value
  }
}, InstantiationType.Delayed)

registerSingleton(ITestingContinuousRunService, class TestingContinuousRunService implements ITestingContinuousRunService {
  _serviceBrand: undefined
  lastRunProfileIds = new Set<number>()
  onDidChange = Event.None
  isSpecificallyEnabledFor = () => false
  isEnabledForAParentOf = () => false
  isEnabledForAChildOf = () => false
  isEnabled = () => false
  start = unsupported
  stop = unsupported
}, InstantiationType.Delayed)

registerSingleton(ITestExplorerFilterState, class TestExplorerFilterState implements ITestExplorerFilterState {
  _serviceBrand: undefined
  get text () { return unsupported() }
  get reveal () { return unsupported() }
  onDidRequestInputFocus = Event.None
  get globList () { return unsupported() }
  get includeTags () { return unsupported() }
  get excludeTags () { return unsupported() }
  get fuzzy () { return unsupported() }
  focusInput = unsupported
  setText = unsupported
  isFilteringFor = () => false
  toggleFilteringFor = unsupported
}, InstantiationType.Delayed)

registerSingleton(ITestingPeekOpener, class TestingPeekOpener implements ITestingPeekOpener {
  _serviceBrand: undefined
  get historyVisible () { return unsupported() }
  tryPeekFirstError = unsupported
  peekUri = unsupported
  openCurrentInEditor = unsupported
  open = unsupported
  closeAllPeeks = unsupported
}, InstantiationType.Delayed)

registerSingleton(IAuxiliaryWindowService, class AuxiliaryWindowService implements IAuxiliaryWindowService {
  _serviceBrand: undefined
  onDidOpenAuxiliaryWindow = Event.None
  hasWindow = () => false
  open = unsupported
}, InstantiationType.Delayed)

registerSingleton(ISpeechService, class SpeechService implements ISpeechService {
  _serviceBrand: undefined
  onDidStartSpeechToTextSession = Event.None
  onDidEndSpeechToTextSession = Event.None
  hasActiveSpeechToTextSession = false
  onDidStartKeywordRecognition = Event.None
  onDidEndKeywordRecognition = Event.None
  hasActiveKeywordRecognition = false
  recognizeKeyword = unsupported
  onDidRegisterSpeechProvider = Event.None
  onDidUnregisterSpeechProvider = Event.None
  hasSpeechProvider = false
  registerSpeechProvider = unsupported
  createSpeechToTextSession = unsupported
}, InstantiationType.Delayed)

registerSingleton(ITestCoverageService, class TestCoverageService implements ITestCoverageService {
  _serviceBrand: undefined
  get selected () {
    return unsupported()
  }

  openCoverage = unsupported
  closeCoverage = unsupported
}, InstantiationType.Delayed)

registerSingleton(IChatAccessibilityService, class ChatAccessibilityService implements IChatAccessibilityService {
  _serviceBrand: undefined
  acceptRequest = unsupported
  acceptResponse = unsupported
}, InstantiationType.Delayed)

registerSingleton(IChatWidgetHistoryService, class ChatWidgetHistoryService implements IChatWidgetHistoryService {
  _serviceBrand: undefined
  onDidClearHistory = Event.None
  clearHistory = unsupported
  getHistory = () => []
  saveHistory = unsupported
}, InstantiationType.Delayed)

registerSingleton(IInlineChatSessionService, class InlineChatSessionService implements IInlineChatSessionService {
  _serviceBrand: undefined
  onDidMoveSession = Event.None
  onDidMoveSessio = Event.None
  onDidStashSession = Event.None
  moveSession = unsupported
  getCodeEditor = unsupported
  stashSession = unsupported
  onWillStartSession = Event.None
  onDidEndSession = Event.None
  createSession = unsupported
  getSession = () => undefined
  releaseSession = unsupported
  registerSessionKeyComputer = unsupported
  recordings = unsupported
  dispose = unsupported
}, InstantiationType.Delayed)

registerSingleton(INotebookEditorWorkerService, class NotebookEditorWorkerService implements INotebookEditorWorkerService {
  _serviceBrand: undefined
  canComputeDiff = () => false
  computeDiff = unsupported
  canPromptRecommendation = async () => false
}, InstantiationType.Delayed)

registerSingleton(INotebookKernelHistoryService, class NotebookKernelHistoryService implements INotebookKernelHistoryService {
  _serviceBrand: undefined
  getKernels = unsupported
  addMostRecentKernel = unsupported
}, InstantiationType.Delayed)

registerSingleton(INotebookExecutionService, class NotebookExecutionService implements INotebookExecutionService {
  _serviceBrand: undefined
  executeNotebookCells = unsupported
  cancelNotebookCells = unsupported
  cancelNotebookCellHandles = unsupported
  registerExecutionParticipant = unsupported
}, InstantiationType.Delayed)

registerSingleton(INotebookKeymapService, class NotebookKeymapService implements INotebookKeymapService {
  _serviceBrand: undefined
}, InstantiationType.Delayed)

registerSingleton(INotebookLoggingService, class NotebookLoggingService implements INotebookLoggingService {
  _serviceBrand: undefined
  info = unsupported
  debug = unsupported
}, InstantiationType.Delayed)

registerSingleton(IWalkthroughsService, class WalkthroughsService implements IWalkthroughsService {
  _serviceBrand: undefined
  onDidAddWalkthrough = Event.None
  onDidRemoveWalkthrough = Event.None
  onDidChangeWalkthrough = Event.None
  onDidProgressStep = Event.None
  getWalkthroughs = unsupported
  getWalkthrough = unsupported
  registerWalkthrough = unsupported
  progressByEvent = unsupported
  progressStep = unsupported
  deprogressStep = unsupported
  markWalkthroughOpened = unsupported
}, InstantiationType.Delayed)

registerSingleton(IUserDataSyncStoreManagementService, class UserDataSyncStoreManagementService implements IUserDataSyncStoreManagementService {
  _serviceBrand: undefined
  onDidChangeUserDataSyncStore = Event.None
  userDataSyncStore = undefined
  switch = unsupported
  getPreviousUserDataSyncStore = unsupported
}, InstantiationType.Delayed)

registerSingleton(IUserDataSyncStoreService, class UserDataSyncStoreService implements IUserDataSyncStoreService {
  _serviceBrand: undefined
  onDidChangeDonotMakeRequestsUntil = Event.None
  donotMakeRequestsUntil = undefined
  onTokenFailed = Event.None
  onTokenSucceed = Event.None
  setAuthToken = unsupported
  manifest = unsupported
  readResource = unsupported
  writeResource = unsupported
  deleteResource = unsupported
  getAllResourceRefs = unsupported
  resolveResourceContent = unsupported
  getAllCollections = unsupported
  createCollection = unsupported
  deleteCollection = unsupported
  getActivityData = unsupported
  clear = unsupported
}, InstantiationType.Delayed)

registerSingleton(IUserDataSyncLogService, class UserDataSyncLogService implements IUserDataSyncLogService {
  _serviceBrand: undefined
  onDidChangeLogLevel = Event.None
  getLevel = unsupported
  setLevel = unsupported
  trace = unsupported
  debug = unsupported
  info = unsupported
  warn = unsupported
  error = unsupported
  flush = unsupported
  dispose = unsupported
}, InstantiationType.Delayed)

registerSingleton(IUserDataSyncService, class UserDataSyncService implements IUserDataSyncService {
  _serviceBrand: undefined
  status = SyncStatus.Uninitialized
  onDidChangeStatus = Event.None
  conflicts = []
  onDidChangeConflicts = Event.None
  onDidChangeLocal = Event.None
  onSyncErrors = Event.None
  lastSyncTime: number | undefined
  onDidChangeLastSyncTime = Event.None
  onDidResetRemote = Event.None
  onDidResetLocal = Event.None
  createSyncTask = unsupported
  createManualSyncTask = unsupported
  resolveContent = unsupported
  accept = unsupported
  reset = unsupported
  resetRemote = unsupported
  cleanUpRemoteData = unsupported
  resetLocal = unsupported
  hasLocalData = unsupported
  hasPreviouslySynced = unsupported
  replace = unsupported
  saveRemoteActivityData = unsupported
  extractActivityData = unsupported
}, InstantiationType.Delayed)

registerSingleton(IUserDataSyncMachinesService, class UserDataSyncMachinesService implements IUserDataSyncMachinesService {
  _serviceBrand: undefined
  onDidChange = Event.None
  getMachines = unsupported
  addCurrentMachine = unsupported
  removeCurrentMachine = unsupported
  renameMachine = unsupported
  setEnablements = unsupported
}, InstantiationType.Delayed)

registerSingleton(IUserDataSyncResourceProviderService, class UserDataSyncResourceProviderService implements IUserDataSyncResourceProviderService {
  _serviceBrand: undefined
  getRemoteSyncedProfiles = unsupported
  getLocalSyncedProfiles = unsupported
  getRemoteSyncResourceHandles = unsupported
  getLocalSyncResourceHandles = unsupported
  getAssociatedResources = unsupported
  getMachineId = unsupported
  getLocalSyncedMachines = unsupported
  resolveContent = unsupported
  resolveUserDataSyncResource = unsupported
}, InstantiationType.Delayed)

registerSingleton(IUserDataSyncLocalStoreService, class UserDataSyncLocalStoreService implements IUserDataSyncLocalStoreService {
  _serviceBrand: undefined
  writeResource = unsupported
  getAllResourceRefs = unsupported
  resolveResourceContent = unsupported
}, InstantiationType.Delayed)

registerSingleton(IUserDataSyncUtilService, class UserDataSyncUtilService implements IUserDataSyncUtilService {
  _serviceBrand: undefined
  resolveUserBindings = unsupported
  resolveFormattingOptions = unsupported
  resolveDefaultIgnoredSettings = unsupported
}, InstantiationType.Delayed)

registerSingleton(IUserDataProfileManagementService, class UserDataProfileManagementService implements IUserDataProfileManagementService {
  _serviceBrand: undefined
  createAndEnterProfile = unsupported
  createAndEnterTransientProfile = unsupported
  removeProfile = unsupported
  updateProfile = unsupported
  switchProfile = unsupported
  getBuiltinProfileTemplates = unsupported
}, InstantiationType.Delayed)

registerSingleton(IWorkingCopyHistoryService, class WorkingCopyHistoryService implements IWorkingCopyHistoryService {
  _serviceBrand: undefined
  onDidAddEntry = Event.None
  onDidChangeEntry = Event.None
  onDidReplaceEntry = Event.None
  onDidRemoveEntry = Event.None
  onDidMoveEntries = Event.None
  onDidRemoveEntries = Event.None
  addEntry = unsupported
  updateEntry = unsupported
  removeEntry = unsupported
  moveEntries = unsupported
  getEntries = unsupported
  getAll = unsupported
  removeAll = unsupported
}, InstantiationType.Delayed)

registerSingleton(IInlineChatSavingService, class InlineChatSavingService implements IInlineChatSavingService {
  _serviceBrand: undefined
  markChanged = unsupported
}, InstantiationType.Delayed)

registerSingleton(INotebookDocumentService, class NotebookDocumentService implements INotebookDocumentService {
  _serviceBrand: undefined
  getNotebook = () => undefined
  addNotebookDocument = unsupported
  removeNotebookDocument = unsupported
}, InstantiationType.Delayed)

registerSingleton(IDebugVisualizerService, class DebugVisualizerService implements IDebugVisualizerService {
  _serviceBrand: undefined
  registerTree = unsupported
  getVisualizedNodeFor = unsupported
  getVisualizedChildren = unsupported
  editTreeItem = unsupported
  getApplicableFor = unsupported
  register = unsupported
}, InstantiationType.Delayed)

registerSingleton(IEditSessionsLogService, class EditSessionsLogService implements IEditSessionsLogService {
  _serviceBrand: undefined
  onDidChangeLogLevel = Event.None
  getLevel = unsupported
  setLevel = unsupported
  trace = unsupported
  debug = unsupported
  info = unsupported
  warn = unsupported
  error = unsupported
  flush = unsupported
  dispose = unsupported
}, InstantiationType.Delayed)

registerSingleton(IEditSessionsStorageService, class EditSessionsWorkbenchService implements IEditSessionsStorageService {
  _serviceBrand: undefined
  SIZE_LIMIT = 0
  isSignedIn = false
  onDidSignIn = Event.None
  onDidSignOut = Event.None
  storeClient = undefined
  lastReadResources = new Map<SyncResource, { ref: string, content: string }>()
  lastWrittenResources = new Map<SyncResource, { ref: string, content: string }>()
  initialize = unsupported
  read = unsupported
  write = unsupported
  delete = unsupported
  list = unsupported
  getMachineById = unsupported
}, InstantiationType.Delayed)

registerSingleton(IMultiDiffSourceResolverService, class MultiDiffSourceResolverService implements IMultiDiffSourceResolverService {
  _serviceBrand: undefined
  registerResolver = unsupported
  resolve = unsupported
}, InstantiationType.Delayed)

registerSingleton(IWorkspaceTagsService, NoOpWorkspaceTagsService, InstantiationType.Delayed)

registerSingleton(IExtensionFeaturesManagementService, class ExtensionFeaturesManagementService implements IExtensionFeaturesManagementService {
  _serviceBrand: undefined
  onDidChangeEnablement = Event.None
  isEnabled = () => true
  setEnablement = unsupported
  getEnablementData = unsupported
  getAccess = unsupported
  onDidChangeAccessData = Event.None
  getAccessData = () => undefined
  setStatus = unsupported
}, InstantiationType.Delayed)

registerSingleton(IEditorPaneService, class EditorPaneService implements IEditorPaneService {
  _serviceBrand: undefined
  onWillInstantiateEditorPane = Event.None
  didInstantiateEditorPane = () => false
}, InstantiationType.Delayed)

registerSingleton(IWorkspaceIdentityService, class WorkspaceIdentityService implements IWorkspaceIdentityService {
  _serviceBrand: undefined
  matches = unsupported
  getWorkspaceStateFolders = unsupported
}, InstantiationType.Delayed)

registerSingleton(IDefaultLogLevelsService, class DefaultLogLevelsService implements IDefaultLogLevelsService {
  _serviceBrand: undefined
  getDefaultLogLevels = unsupported
  setDefaultLogLevel = unsupported
  migrateLogLevels = unsupported
}, InstantiationType.Delayed)
