import { mainWindow } from 'vs/base/browser/window'
import {
  DynamicListEventMultiplexer,
  Event,
  type IDynamicListEventMultiplexer
} from 'vs/base/common/event'
import { Disposable, type IDisposable } from 'vs/base/common/lifecycle'
import { ResourceSet } from 'vs/base/common/map'
import { OS } from 'vs/base/common/platform'
import { joinPath } from 'vs/base/common/resources'
import { URI } from 'vs/base/common/uri'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { IModelService } from 'vs/editor/common/services/model'
import { ITreeViewsDnDService } from 'vs/editor/common/services/treeViewsDndService'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey.service'
import { IExtensionHostDebugService } from 'vs/platform/debug/common/extensionHostDebug.service'
import { IDiagnosticsService } from 'vs/platform/diagnostics/common/diagnostics.service'
import { NullDiagnosticsService } from 'vs/platform/diagnostics/common/diagnostics'
import { IFileDialogService } from 'vs/platform/dialogs/common/dialogs.service'
import { IDownloadService } from 'vs/platform/download/common/download.service'
import { IEncryptionService } from 'vs/platform/encryption/common/encryptionService.service'
import { IEnvironmentService } from 'vs/platform/environment/common/environment.service'
import type { ILocalExtension } from 'vs/platform/extensionManagement/common/extensionManagement'
import {
  IAllowedExtensionsService,
  IExtensionGalleryService,
  IExtensionTipsService,
  IGlobalExtensionEnablementService
} from 'vs/platform/extensionManagement/common/extensionManagement.service'
import { IExtensionStorageService } from 'vs/platform/extensionManagement/common/extensionStorage.service'
import { IExtensionsProfileScannerService } from 'vs/platform/extensionManagement/common/extensionsProfileScannerService.service'
import { IExtensionsScannerService } from 'vs/platform/extensionManagement/common/extensionsScannerService.service'
import { IExtensionRecommendationNotificationService } from 'vs/platform/extensionRecommendations/common/extensionRecommendations.service'
import { IExtensionResourceLoaderService } from 'vs/platform/extensionResourceLoader/common/extensionResourceLoader.service'
import type {
  IExtension,
  IRelaxedExtensionDescription
} from 'vs/platform/extensions/common/extensions'
import { IBuiltinExtensionsScannerService } from 'vs/platform/extensions/common/extensions.service'
import { IFileService } from 'vs/platform/files/common/files.service'
import { InstantiationType, registerSingleton } from 'vs/platform/instantiation/common/extensions'
import { IKeyboardLayoutService } from 'vs/platform/keyboardLayout/common/keyboardLayout.service'
import type { ILanguagePackItem } from 'vs/platform/languagePacks/common/languagePacks'
import { ILanguagePackService } from 'vs/platform/languagePacks/common/languagePacks.service'
import {
  type ILogger,
  LogLevel,
  AbstractLoggerService,
  NullLogger
} from 'vs/platform/log/common/log'
import { ILoggerService } from 'vs/platform/log/common/log.service'
import { NullPolicyService } from 'vs/platform/policy/common/policy'
import { IPolicyService } from 'vs/platform/policy/common/policy.service'
import { IProductService } from 'vs/platform/product/common/productService.service'
import { IRemoteAuthorityResolverService } from 'vs/platform/remote/common/remoteAuthorityResolver.service'
import { IRemoteExtensionsScannerService } from 'vs/platform/remote/common/remoteExtensionsScanner.service'
import { IRemoteSocketFactoryService } from 'vs/platform/remote/common/remoteSocketFactoryService.service'
import { IRequestService } from 'vs/platform/request/common/request.service'
import { ISecretStorageService } from 'vs/platform/secrets/common/secrets.service'
import { ISignService } from 'vs/platform/sign/common/sign.service'
import type { IMessage } from 'vs/platform/sign/common/sign'
import { ICustomEndpointTelemetryService } from 'vs/platform/telemetry/common/telemetry.service'
import { NullEndpointTelemetryService } from 'vs/platform/telemetry/common/telemetryUtils'
import { TerminalLocation } from 'vs/platform/terminal/common/terminal'
import { ITerminalLogService } from 'vs/platform/terminal/common/terminal.service'
import { ITunnelService } from 'vs/platform/tunnel/common/tunnel.service'
import { State } from 'vs/platform/update/common/update'
import { IUpdateService } from 'vs/platform/update/common/update.service'
import { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity.service'
import { UriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentityService'
import { IURLService } from 'vs/platform/url/common/url.service'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile.service'
import { IIgnoredExtensionsManagementService } from 'vs/platform/userDataSync/common/ignoredExtensions.service'
import { SyncStatus } from 'vs/platform/userDataSync/common/userDataSync'
import {
  IUserDataAutoSyncService,
  IUserDataSyncEnablementService,
  IUserDataSyncLocalStoreService,
  IUserDataSyncLogService,
  IUserDataSyncResourceProviderService,
  IUserDataSyncService,
  IUserDataSyncStoreManagementService,
  IUserDataSyncStoreService,
  IUserDataSyncUtilService
} from 'vs/platform/userDataSync/common/userDataSync.service'
import { IUserDataSyncAccountService } from 'vs/platform/userDataSync/common/userDataSyncAccount.service'
import { IUserDataSyncMachinesService } from 'vs/platform/userDataSync/common/userDataSyncMachines.service'
import { ICanonicalUriService } from 'vs/platform/workspace/common/canonicalUri.service'
import { IEditSessionIdentityService } from 'vs/platform/workspace/common/editSessions.service'
import { WorkspaceTrustUriResponse } from 'vs/platform/workspace/common/workspaceTrust'
import {
  IWorkspaceTrustEnablementService,
  IWorkspaceTrustRequestService
} from 'vs/platform/workspace/common/workspaceTrust.service'
import { IWorkspacesService } from 'vs/platform/workspaces/common/workspaces.service'
import {
  type ExtensionStatusBarEntry,
  IExtensionStatusBarItemService,
  StatusBarUpdateKind
} from 'vs/workbench/api/browser/statusBarService'
import { IBreadcrumbsService } from 'vs/workbench/browser/parts/editor/breadcrumbs.service'
import {
  DEFAULT_EDITOR_PART_OPTIONS,
  type IEditorGroupView
} from 'vs/workbench/browser/parts/editor/editor'
import { IViewDescriptorService } from 'vs/workbench/common/views.service'
import { IAccessibleViewService } from 'vs/platform/accessibility/browser/accessibleView.service'
import {
  IChatAccessibilityService,
  IChatCodeBlockContextProviderService,
  IChatWidgetService,
  IQuickChatService
} from 'vs/workbench/contrib/chat/browser/chat.service'
import {
  IChatAgentNameService,
  IChatAgentService
} from 'vs/workbench/contrib/chat/common/chatAgents.service'
import { IChatService } from 'vs/workbench/contrib/chat/common/chatService.service'
import { IChatSlashCommandService } from 'vs/workbench/contrib/chat/common/chatSlashCommands.service'
import { IChatVariablesService } from 'vs/workbench/contrib/chat/common/chatVariables.service'
import { IChatWidgetHistoryService } from 'vs/workbench/contrib/chat/common/chatWidgetHistoryService.service'
import { ILanguageModelsService } from 'vs/workbench/contrib/chat/common/languageModels.service'
import { ICommentService } from 'vs/workbench/contrib/comments/browser/commentService.service'
import { ICustomEditorService } from 'vs/workbench/contrib/customEditor/common/customEditor.service'
import { IDebugService } from 'vs/workbench/contrib/debug/common/debug.service'
import { IDebugVisualizerService } from 'vs/workbench/contrib/debug/common/debugVisualizers.service'
import {
  IEditSessionsLogService,
  IEditSessionsStorageService
} from 'vs/workbench/contrib/editSessions/common/editSessions.service'
import { IExtensionsWorkbenchService } from 'vs/workbench/contrib/extensions/common/extensions.service'
import { IExternalUriOpenerService } from 'vs/workbench/contrib/externalUriOpener/common/externalUriOpenerService.service'
import { IExplorerService } from 'vs/workbench/contrib/files/browser/files.service'
import { IInlineChatSavingService } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSavingService.service'
import { IInlineChatSessionService } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionService.service'
import { IInteractiveDocumentService } from 'vs/workbench/contrib/interactive/browser/interactiveDocumentService.service'
import { IInteractiveHistoryService } from 'vs/workbench/contrib/interactive/browser/interactiveHistoryService.service'
import { IDefaultLogLevelsService } from 'vs/workbench/contrib/logs/common/defaultLogLevels.service'
import { IMultiDiffSourceResolverService } from 'vs/workbench/contrib/multiDiffEditor/browser/multiDiffSourceResolverService.service'
import { INotebookEditorService } from 'vs/workbench/contrib/notebook/browser/services/notebookEditorService.service'
import { INotebookCellStatusBarService } from 'vs/workbench/contrib/notebook/common/notebookCellStatusBarService.service'
import { INotebookEditorModelResolverService } from 'vs/workbench/contrib/notebook/common/notebookEditorModelResolverService.service'
import { INotebookExecutionService } from 'vs/workbench/contrib/notebook/common/notebookExecutionService.service'
import { INotebookExecutionStateService } from 'vs/workbench/contrib/notebook/common/notebookExecutionStateService.service'
import {
  INotebookKernelHistoryService,
  INotebookKernelService
} from 'vs/workbench/contrib/notebook/common/notebookKernelService.service'
import { INotebookKeymapService } from 'vs/workbench/contrib/notebook/common/notebookKeymapService.service'
import { INotebookLoggingService } from 'vs/workbench/contrib/notebook/common/notebookLoggingService.service'
import { INotebookRendererMessagingService } from 'vs/workbench/contrib/notebook/common/notebookRendererMessagingService.service'
import { INotebookService } from 'vs/workbench/contrib/notebook/common/notebookService.service'
import { INotebookEditorWorkerService } from 'vs/workbench/contrib/notebook/common/services/notebookWorkerService.service'
import { IOutputChannelModelService } from 'vs/workbench/contrib/output/common/outputChannelModelService.service'
import { IPreferencesSearchService } from 'vs/workbench/contrib/preferences/common/preferences.service'
import { IQuickDiffService } from 'vs/workbench/contrib/scm/common/quickDiff.service'
import { ISCMService, ISCMViewService } from 'vs/workbench/contrib/scm/common/scm.service'
import { IReplaceService } from 'vs/workbench/contrib/search/browser/replace.service'
import { ISearchViewModelWorkbenchService } from 'vs/workbench/contrib/search/browser/searchTreeModel/searchViewModelWorkbenchService.service'
import { INotebookSearchService } from 'vs/workbench/contrib/search/common/notebookSearch.service'
import { ISearchHistoryService } from 'vs/workbench/contrib/search/common/searchHistoryService.service'
import { IShareService } from 'vs/workbench/contrib/share/common/share.service'
import { ISnippetsService } from 'vs/workbench/contrib/snippets/browser/snippets.service'
import { ISpeechService } from 'vs/workbench/contrib/speech/common/speechService.service'
import { NoOpWorkspaceTagsService } from 'vs/workbench/contrib/tags/browser/workspaceTagsService'
import { IWorkspaceTagsService } from 'vs/workbench/contrib/tags/common/workspaceTags.service'
import { ITaskService } from 'vs/workbench/contrib/tasks/common/taskService.service'
import {
  ITerminalConfigurationService,
  ITerminalEditorService,
  ITerminalGroupService,
  ITerminalInstanceService,
  ITerminalService
} from 'vs/workbench/contrib/terminal/browser/terminal.service'
import { IEnvironmentVariableService } from 'vs/workbench/contrib/terminal/common/environmentVariable.service'
import {
  ITerminalProfileResolverService,
  ITerminalProfileService
} from 'vs/workbench/contrib/terminal/common/terminal.service'
import { ITerminalContributionService } from 'vs/workbench/contrib/terminal/common/terminalExtensionPoints.service'
import { ITerminalLinkProviderService } from 'vs/workbench/contrib/terminalContrib/links/browser/links.service'
import { ITerminalQuickFixService } from 'vs/workbench/contrib/terminalContrib/quickFix/browser/quickFix.service'
import { ITestCoverageService } from 'vs/workbench/contrib/testing/common/testCoverageService.service'
import { ITestExplorerFilterState } from 'vs/workbench/contrib/testing/common/testExplorerFilterState.service'
import { ITestProfileService } from 'vs/workbench/contrib/testing/common/testProfileService.service'
import { ITestResultService } from 'vs/workbench/contrib/testing/common/testResultService.service'
import { ITestResultStorage } from 'vs/workbench/contrib/testing/common/testResultStorage.service'
import { ITestService } from 'vs/workbench/contrib/testing/common/testService.service'
import { ITestingContinuousRunService } from 'vs/workbench/contrib/testing/common/testingContinuousRunService.service'
import { ITestingDecorationsService } from 'vs/workbench/contrib/testing/common/testingDecorations.service'
import { ITestingPeekOpener } from 'vs/workbench/contrib/testing/common/testingPeekOpener.service'
import { ITimelineService } from 'vs/workbench/contrib/timeline/common/timeline.service'
import { IWebviewService } from 'vs/workbench/contrib/webview/browser/webview.service'
import { IWebviewWorkbenchService } from 'vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService.service'
import { IWebviewViewService } from 'vs/workbench/contrib/webviewView/browser/webviewViewService.service'
import { IWalkthroughsService } from 'vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedService.service'
import { IActivityService } from 'vs/workbench/services/activity/common/activity.service'
import { IAiEmbeddingVectorService } from 'vs/workbench/services/aiEmbeddingVector/common/aiEmbeddingVectorService.service'
import { IAiRelatedInformationService } from 'vs/workbench/services/aiRelatedInformation/common/aiRelatedInformation.service'
import { IWorkbenchAssignmentService } from 'vs/workbench/services/assignment/common/assignmentService.service'
import { IAuthenticationAccessService } from 'vs/workbench/services/authentication/browser/authenticationAccessService.service'
import { IAuthenticationUsageService } from 'vs/workbench/services/authentication/browser/authenticationUsageService.service'
import {
  IAuthenticationExtensionsService,
  IAuthenticationService
} from 'vs/workbench/services/authentication/common/authentication.service'
import { IAuxiliaryWindowService } from 'vs/workbench/services/auxiliaryWindow/browser/auxiliaryWindowService.service'
import { IBannerService } from 'vs/workbench/services/banner/browser/bannerService.service'
import { IJSONEditingService } from 'vs/workbench/services/configuration/common/jsonEditing.service'
import { IConfigurationResolverService } from 'vs/workbench/services/configurationResolver/common/configurationResolver.service'
import { IDecorationsService } from 'vs/workbench/services/decorations/common/decorations.service'
import { ICustomEditorLabelService } from 'vs/workbench/services/editor/common/customEditorLabelService.service'
import { IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService.service'
import { IEditorPaneService } from 'vs/workbench/services/editor/common/editorPaneService.service'
import { IEditorResolverService } from 'vs/workbench/services/editor/common/editorResolverService.service'
import { IEditorService } from 'vs/workbench/services/editor/common/editorService.service'
import { IExtensionBisectService } from 'vs/workbench/services/extensionManagement/browser/extensionBisect.service'
import { IExtensionFeaturesManagementService } from 'vs/workbench/services/extensionManagement/common/extensionFeatures.service'
import { EnablementState } from 'vs/workbench/services/extensionManagement/common/extensionManagement'
import {
  IExtensionManagementServerService,
  IWebExtensionsScannerService,
  IWorkbenchExtensionEnablementService,
  IWorkbenchExtensionManagementService
} from 'vs/workbench/services/extensionManagement/common/extensionManagement.service'
import {
  IExtensionIgnoredRecommendationsService,
  IExtensionRecommendationsService
} from 'vs/workbench/services/extensionRecommendations/common/extensionRecommendations.service'
import { IWorkspaceExtensionsConfigService } from 'vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig.service'
import { IExtensionUrlHandler } from 'vs/workbench/services/extensions/browser/extensionUrlHandler.service'
import { IExtensionManifestPropertiesService } from 'vs/workbench/services/extensions/common/extensionManifestPropertiesService.service'
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions.service'
import { IElevatedFileService } from 'vs/workbench/services/files/common/elevatedFileService.service'
import { IFilesConfigurationService } from 'vs/workbench/services/filesConfiguration/common/filesConfigurationService.service'
import { IHistoryService } from 'vs/workbench/services/history/common/history.service'
import { IHostService } from 'vs/workbench/services/host/browser/host.service'
import { ITroubleshootIssueService } from 'vs/workbench/contrib/issue/browser/issueTroubleshoot.service'
import {
  IIssueFormService,
  IWorkbenchIssueService
} from 'vs/workbench/contrib/issue/common/issue.service'
import { FallbackKeyboardMapper } from 'vs/workbench/services/keybinding/common/fallbackKeyboardMapper'
import { IKeybindingEditingService } from 'vs/workbench/services/keybinding/common/keybindingEditing.service'
import { ILanguageDetectionService } from 'vs/workbench/services/languageDetection/common/languageDetectionWorkerService.service'
import { ILanguageStatusService } from 'vs/workbench/services/languageStatus/common/languageStatusService.service'
import { ILifecycleService } from 'vs/workbench/services/lifecycle/common/lifecycle.service'
import { AbstractLifecycleService } from 'vs/workbench/services/lifecycle/common/lifecycleService'
import {
  IActiveLanguagePackService,
  ILocaleService
} from 'vs/workbench/services/localization/common/locale.service'
import { INotebookDocumentService } from 'vs/workbench/services/notebook/common/notebookDocumentService.service'
import { IOutlineService } from 'vs/workbench/services/outline/browser/outline.service'
import { IOutputService } from 'vs/workbench/services/output/common/output.service'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite.service'
import { IPathService } from 'vs/workbench/services/path/common/pathService.service'
import { IPreferencesService } from 'vs/workbench/services/preferences/common/preferences.service'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService.service'
import { IRemoteExplorerService } from 'vs/workbench/services/remote/common/remoteExplorerService.service'
import { ISearchService } from 'vs/workbench/services/search/common/search.service'
import { IStatusbarService } from 'vs/workbench/services/statusbar/browser/statusbar.service'
import { IEmbedderTerminalService } from 'vs/workbench/services/terminal/common/embedderTerminalService.service'
import { ITextMateTokenizationService } from 'vs/workbench/services/textMate/browser/textMateTokenizationFeature.service'
import { ITextEditorService } from 'vs/workbench/services/textfile/common/textEditorService.service'
import { ITextFileService } from 'vs/workbench/services/textfile/common/textfiles.service'
import { IHostColorSchemeService } from 'vs/workbench/services/themes/common/hostColorSchemeService.service'
import { ITimerService } from 'vs/workbench/services/timer/browser/timerService.service'
import { ITitleService } from 'vs/workbench/services/title/browser/titleService.service'
import { IUntitledTextEditorService } from 'vs/workbench/services/untitled/common/untitledTextEditorService.service'
import { IUserActivityService } from 'vs/workbench/services/userActivity/common/userActivityService.service'
import { IUserDataInitializationService } from 'vs/workbench/services/userData/browser/userDataInit.service'
import { IRemoteUserDataProfilesService } from 'vs/workbench/services/userDataProfile/common/remoteUserDataProfiles.service'
import {
  IUserDataProfileImportExportService,
  IUserDataProfileManagementService,
  IUserDataProfileService
} from 'vs/workbench/services/userDataProfile/common/userDataProfile.service'
import { UserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfileService'
import { IUserDataSyncWorkbenchService } from 'vs/workbench/services/userDataSync/common/userDataSync.service'
import { IViewsService } from 'vs/workbench/services/views/common/viewsService.service'
import type {
  IWorkingCopyBackupMeta,
  IWorkingCopyIdentifier
} from 'vs/workbench/services/workingCopy/common/workingCopy'
import type { IResolvedWorkingCopyBackup } from 'vs/workbench/services/workingCopy/common/workingCopyBackup'
import { IWorkingCopyBackupService } from 'vs/workbench/services/workingCopy/common/workingCopyBackup.service'
import { IWorkingCopyEditorService } from 'vs/workbench/services/workingCopy/common/workingCopyEditorService.service'
import { IWorkingCopyFileService } from 'vs/workbench/services/workingCopy/common/workingCopyFileService.service'
import { IWorkingCopyHistoryService } from 'vs/workbench/services/workingCopy/common/workingCopyHistory.service'
import { IWorkingCopyService } from 'vs/workbench/services/workingCopy/common/workingCopyService.service'
import { IWorkspaceEditingService } from 'vs/workbench/services/workspaces/common/workspaceEditing.service'
import { IWorkspaceIdentityService } from 'vs/workbench/services/workspaces/common/workspaceIdentityService.service'
import {
  type IEditorGroup,
  GroupOrientation,
  type IEditorPart
} from 'vs/workbench/services/editor/common/editorGroupsService'
import { NullExtensionService } from 'vs/workbench/services/extensions/common/extensions'
import { toUserDataProfile } from 'vs/platform/userDataProfile/common/userDataProfile'
import type {
  IAdapterManager,
  IDebugModel,
  IViewModel
} from 'vs/workbench/contrib/debug/common/debug'
import type { IViewContainerModel } from 'vs/workbench/common/views'
import type { ISearchComplete } from 'vs/workbench/services/search/common/search'
import type {
  IOutputChannel,
  IOutputChannelDescriptor
} from 'vs/workbench/services/output/common/output'
import {
  type ITerminalInstance,
  TerminalConnectionState
} from 'vs/workbench/contrib/terminal/browser/terminal'
import { AccountStatus } from 'vs/workbench/services/userDataSync/common/userDataSync'
import type { IWebview } from 'vs/workbench/contrib/webview/browser/webview'
import type { SyncResource } from 'vs/workbench/contrib/editSessions/common/editSessions'
import { ILanguageModelStatsService } from 'vs/workbench/contrib/chat/common/languageModelStats.service'
import { IAccessibleViewInformationService } from 'vs/workbench/services/accessibility/common/accessibleViewInformationService.service'
import { IUserDataProfileStorageService } from 'vs/platform/userDataProfile/common/userDataProfileStorageService.service'
import { IIntegrityService } from 'vs/workbench/services/integrity/common/integrity.service'
import type { IntegrityTestResult } from 'vs/workbench/services/integrity/common/integrity'
import { ITrustedDomainService } from 'vs/workbench/contrib/url/browser/trustedDomainService.service'
import { ILanguageModelToolsService } from 'vs/workbench/contrib/chat/common/languageModelToolsService.service'
import { PortsEnablement } from 'vs/workbench/services/remote/common/remoteExplorerService'
import { ICodeMapperService } from 'vs/workbench/contrib/chat/common/chatCodeMapperService.service'
import { IChatEditingService } from 'vs/workbench/contrib/chat/common/chatEditingService.service'
import { IActionViewItemService } from 'vs/platform/actions/browser/actionViewItemService.service'
import { ITreeSitterTokenizationFeature } from 'vs/workbench/services/treeSitter/browser/treeSitterTokenizationFeature.service'
import { ILanguageModelIgnoredFilesService } from 'vs/workbench/contrib/chat/common/ignoredFiles.service'
import { IChatQuotasService } from 'vs/workbench/contrib/chat/browser/chatQuotasService.service'
import { INotebookSynchronizerService } from 'vs/workbench/contrib/notebook/common/notebookSynchronizerService.service'
import { INotebookOriginalCellModelFactory } from 'vs/workbench/contrib/notebook/browser/contrib/chatEdit/notebookOriginalCellModelFactory.service'
import { INotebookOriginalModelReferenceFactory } from 'vs/workbench/contrib/notebook/browser/contrib/chatEdit/notebookOriginalModelRefFactory.service'
import { INotebookModelSynchronizerFactory } from 'vs/workbench/contrib/notebook/browser/contrib/chatEdit/notebookSynchronizer.service'
import { IDirtyDiffModelService } from 'vs/workbench/contrib/scm/browser/diff.service'
import { ITerminalCompletionService } from 'vs/workbench/contrib/terminalContrib/suggest/browser/terminalCompletionService.service'
import { getBuiltInExtensionTranslationsUris, getExtensionIdProvidingCurrentLocale } from './l10n'
import { unsupported } from './tools'

function Unsupported(target: object, propertyKey: string, descriptor: PropertyDescriptor) {
  function unsupported() {
    throw new Error(
      `Unsupported: ${target.constructor.name}.${propertyKey} is not supported. You are using a feature without registering the corresponding service override.`
    )
  }
  if (descriptor.value != null) {
    descriptor.value = unsupported
  } else if (descriptor.get != null) {
    descriptor.get = unsupported
  }
}

registerSingleton(
  ILoggerService,
  class NullLoggerService extends AbstractLoggerService {
    constructor() {
      super(LogLevel.Info, URI.file('logs.log'))
    }

    protected doCreateLogger(): ILogger {
      return new NullLogger()
    }
  },
  InstantiationType.Eager
)

class EditorService implements IEditorService {
  readonly _serviceBrand = undefined

  getVisibleTextEditorControls = () => []
  onWillOpenEditor = Event.None
  onDidActiveEditorChange = Event.None
  onDidVisibleEditorsChange = Event.None
  onDidEditorsChange = Event.None
  onDidCloseEditor = Event.None
  activeEditorPane = undefined
  activeEditor = undefined
  get activeTextEditorControl() {
    return StandaloneServices.get(ICodeEditorService).getFocusedCodeEditor() ?? undefined
  }

  activeTextEditorLanguageId = undefined
  visibleEditorPanes = []
  visibleEditors = []
  visibleTextEditorControls = []
  editors = []
  count = 0
  getEditors = () => []

  @Unsupported
  openEditor(): never {
    unsupported()
  }

  @Unsupported
  openEditors(): never {
    unsupported()
  }

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
  createScoped(): IEditorService {
    return this
  }
}

registerSingleton(IEditorService, EditorService, InstantiationType.Eager)

class PaneCompositePartService implements IPaneCompositePartService {
  readonly _serviceBrand = undefined
  getPaneCompositeIds = () => []
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
  @Unsupported
  getLastActivePaneCompositeId(): never {
    unsupported()
  }

  showActivity = () => Disposable.None
}
registerSingleton(IPaneCompositePartService, PaneCompositePartService, InstantiationType.Eager)

registerSingleton(IUriIdentityService, UriIdentityService, InstantiationType.Delayed)

class TextFileService implements ITextFileService {
  _serviceBrand: undefined
  @Unsupported
  get files() {
    return unsupported()
  }

  @Unsupported
  get untitled() {
    return unsupported()
  }

  @Unsupported
  get encoding() {
    return unsupported()
  }

  @Unsupported
  isDirty(): never {
    unsupported()
  }

  @Unsupported
  save(): never {
    unsupported()
  }

  @Unsupported
  saveAs(): never {
    unsupported()
  }

  @Unsupported
  revert(): never {
    unsupported()
  }

  @Unsupported
  read(): never {
    unsupported()
  }

  @Unsupported
  readStream(): never {
    unsupported()
  }

  @Unsupported
  write(): never {
    unsupported()
  }

  @Unsupported
  create(): never {
    unsupported()
  }

  @Unsupported
  getEncodedReadable(): never {
    unsupported()
  }

  @Unsupported
  getDecodedStream(): never {
    unsupported()
  }

  @Unsupported
  dispose(): never {
    unsupported()
  }
}
registerSingleton(ITextFileService, TextFileService, InstantiationType.Eager)

class FileService implements IFileService {
  readonly _serviceBrand = undefined
  onDidChangeFileSystemProviderRegistrations = Event.None
  onDidChangeFileSystemProviderCapabilities = Event.None
  onWillActivateFileSystemProvider = Event.None
  @Unsupported
  registerProvider(): never {
    unsupported()
  }

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
  @Unsupported
  resolve(): never {
    unsupported()
  }

  @Unsupported
  resolveAll(): never {
    unsupported()
  }

  @Unsupported
  stat(): never {
    unsupported()
  }

  exists = async () => false
  @Unsupported
  readFile(): never {
    unsupported()
  }

  @Unsupported
  readFileStream(): never {
    unsupported()
  }

  @Unsupported
  writeFile(): never {
    unsupported()
  }

  @Unsupported
  move(): never {
    unsupported()
  }

  @Unsupported
  canMove(): never {
    unsupported()
  }

  @Unsupported
  copy(): never {
    unsupported()
  }

  @Unsupported
  canCopy(): never {
    unsupported()
  }

  @Unsupported
  cloneFile(): never {
    unsupported()
  }

  @Unsupported
  createFile(): never {
    unsupported()
  }

  @Unsupported
  canCreateFile(): never {
    unsupported()
  }

  @Unsupported
  createFolder(): never {
    unsupported()
  }

  @Unsupported
  del(): never {
    unsupported()
  }

  @Unsupported
  canDelete(): never {
    unsupported()
  }

  onDidWatchError = Event.None
  @Unsupported
  watch(): never {
    unsupported()
  }

  @Unsupported
  createWatcher(): never {
    unsupported()
  }

  dispose() {
    // ignore
  }
}

registerSingleton(IFileService, FileService, InstantiationType.Eager)

class EmptyEditorGroup implements IEditorGroup, IEditorGroupView {
  selectedEditors = []
  isSelected = () => false
  @Unsupported
  setSelection(): never {
    unsupported()
  }

  isTransient = () => false
  windowId = mainWindow.vscodeWindowId
  @Unsupported
  get groupsView() {
    return unsupported()
  }

  notifyLabelChanged(): void {}
  @Unsupported
  createEditorActions(): never {
    unsupported()
  }

  onDidFocus = Event.None
  onDidOpenEditorFail = Event.None
  whenRestored = Promise.resolve()
  @Unsupported
  get titleHeight() {
    return unsupported()
  }

  disposed = false
  @Unsupported
  setActive(): never {
    unsupported()
  }

  @Unsupported
  notifyIndexChanged(): never {
    unsupported()
  }

  @Unsupported
  relayout(): never {
    unsupported()
  }

  @Unsupported
  dispose(): never {
    unsupported()
  }

  @Unsupported
  toJSON(): never {
    unsupported()
  }

  preferredWidth?: number | undefined
  preferredHeight?: number | undefined
  @Unsupported
  get element() {
    return unsupported()
  }

  minimumWidth = 0
  maximumWidth = Number.POSITIVE_INFINITY
  minimumHeight = 0
  maximumHeight = Number.POSITIVE_INFINITY
  onDidChange = Event.None
  @Unsupported
  layout(): never {
    unsupported()
  }

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
  get scopedContextKeyService(): IContextKeyService {
    return StandaloneServices.get(IContextKeyService)
  }

  getEditors = () => []
  findEditors = () => []
  getEditorByIndex = () => undefined
  @Unsupported
  getIndexOfEditor(): never {
    unsupported()
  }

  @Unsupported
  openEditor(): never {
    unsupported()
  }

  @Unsupported
  openEditors(): never {
    unsupported()
  }

  isPinned = () => false
  isSticky = () => false
  isActive = () => false
  contains = () => false
  @Unsupported
  moveEditor(): never {
    unsupported()
  }

  @Unsupported
  moveEditors(): never {
    unsupported()
  }

  @Unsupported
  copyEditor(): never {
    unsupported()
  }

  @Unsupported
  copyEditors(): never {
    unsupported()
  }

  @Unsupported
  closeEditor(): never {
    unsupported()
  }

  @Unsupported
  closeEditors(): never {
    unsupported()
  }

  @Unsupported
  closeAllEditors(): never {
    unsupported()
  }

  @Unsupported
  replaceEditors(): never {
    unsupported()
  }

  pinEditor = () => {}
  stickEditor = () => {}
  unstickEditor = () => {}
  lock = () => {}
  focus(): void {
    // ignore
  }

  @Unsupported
  isFirst(): never {
    unsupported()
  }

  @Unsupported
  isLast(): never {
    unsupported()
  }
}

const fakeActiveGroup = new EmptyEditorGroup()

class EmptyEditorPart implements IEditorPart {
  onWillDispose = Event.None
  windowId = mainWindow.vscodeWindowId
  hasMaximizedGroup = () => false
  onDidLayout = Event.None
  onDidScroll = Event.None
  @Unsupported
  get contentDimension(): never {
    return unsupported()
  }

  isReady = true
  whenReady = Promise.resolve()
  whenRestored = Promise.resolve()
  hasRestorableState = false
  @Unsupported
  centerLayout(): never {
    unsupported()
  }

  @Unsupported
  isLayoutCentered(): never {
    unsupported()
  }

  @Unsupported
  enforcePartOptions(): never {
    unsupported()
  }

  onDidChangeActiveGroup = Event.None
  onDidAddGroup = Event.None
  onDidRemoveGroup = Event.None
  onDidMoveGroup = Event.None
  onDidActivateGroup = Event.None
  onDidChangeGroupIndex = Event.None
  onDidChangeGroupLocked = Event.None
  onDidChangeGroupMaximized = Event.None
  activeGroup = fakeActiveGroup
  @Unsupported
  get sideGroup(): never {
    return unsupported()
  }

  groups = [fakeActiveGroup]
  count = 0
  orientation = GroupOrientation.HORIZONTAL
  getGroups = () => []
  getGroup = () => undefined
  @Unsupported
  activateGroup(): never {
    unsupported()
  }

  @Unsupported
  getSize(): never {
    unsupported()
  }

  @Unsupported
  setSize(): never {
    unsupported()
  }

  @Unsupported
  arrangeGroups(): never {
    unsupported()
  }

  @Unsupported
  toggleMaximizeGroup(): never {
    unsupported()
  }

  @Unsupported
  toggleExpandGroup(): never {
    unsupported()
  }

  @Unsupported
  applyLayout(): never {
    unsupported()
  }

  @Unsupported
  getLayout(): never {
    unsupported()
  }

  @Unsupported
  setGroupOrientation(): never {
    unsupported()
  }

  findGroup = () => undefined
  @Unsupported
  addGroup(): never {
    unsupported()
  }

  @Unsupported
  removeGroup(): never {
    unsupported()
  }

  @Unsupported
  moveGroup(): never {
    unsupported()
  }

  @Unsupported
  mergeGroup(): never {
    unsupported()
  }

  @Unsupported
  mergeAllGroups(): never {
    unsupported()
  }

  @Unsupported
  copyGroup(): never {
    unsupported()
  }

  partOptions = DEFAULT_EDITOR_PART_OPTIONS

  onDidChangeEditorPartOptions = Event.None
  @Unsupported
  createEditorDropTarget(): never {
    unsupported()
  }
}

class EmptyEditorGroupsService implements IEditorGroupsService {
  @Unsupported
  getScopedInstantiationService(): never {
    unsupported()
  }

  @Unsupported
  registerContextKeyProvider(): never {
    unsupported()
  }

  @Unsupported
  saveWorkingSet(): never {
    unsupported()
  }

  @Unsupported
  getWorkingSets(): never {
    unsupported()
  }

  @Unsupported
  applyWorkingSet(): never {
    unsupported()
  }

  @Unsupported
  deleteWorkingSet(): never {
    unsupported()
  }

  onDidCreateAuxiliaryEditorPart = Event.None
  mainPart = new EmptyEditorPart()
  activePart = this.mainPart
  parts = [this.mainPart]

  @Unsupported
  getPart(): never {
    unsupported()
  }

  @Unsupported
  createAuxiliaryEditorPart(): never {
    unsupported()
  }

  onDidChangeGroupMaximized = Event.None
  @Unsupported
  toggleMaximizeGroup(): never {
    unsupported()
  }

  @Unsupported
  toggleExpandGroup(): never {
    unsupported()
  }

  partOptions = DEFAULT_EDITOR_PART_OPTIONS

  @Unsupported
  createEditorDropTarget(): never {
    unsupported()
  }

  readonly _serviceBrand = undefined
  @Unsupported
  getLayout(): never {
    unsupported()
  }

  onDidChangeActiveGroup = Event.None
  onDidAddGroup = Event.None
  onDidRemoveGroup = Event.None
  onDidMoveGroup = Event.None
  onDidActivateGroup = Event.None
  onDidLayout = Event.None
  onDidScroll = Event.None
  onDidChangeGroupIndex = Event.None
  onDidChangeGroupLocked = Event.None
  @Unsupported
  get contentDimension(): never {
    return unsupported()
  }

  activeGroup = fakeActiveGroup
  @Unsupported
  get sideGroup(): never {
    return unsupported()
  }

  groups = [fakeActiveGroup]
  count = 0
  orientation = GroupOrientation.HORIZONTAL
  isReady = false
  whenReady = Promise.resolve()
  whenRestored = Promise.resolve()
  hasRestorableState = false
  getGroups = (): never[] => []
  getGroup = (): undefined => undefined
  @Unsupported
  activateGroup(): never {
    unsupported()
  }

  @Unsupported
  getSize(): never {
    unsupported()
  }

  @Unsupported
  setSize(): never {
    unsupported()
  }

  @Unsupported
  arrangeGroups(): never {
    unsupported()
  }

  @Unsupported
  applyLayout(): never {
    unsupported()
  }

  @Unsupported
  centerLayout(): never {
    unsupported()
  }

  isLayoutCentered = (): boolean => false
  @Unsupported
  setGroupOrientation(): never {
    unsupported()
  }

  findGroup = (): undefined => undefined
  @Unsupported
  addGroup(): never {
    unsupported()
  }

  @Unsupported
  removeGroup(): never {
    unsupported()
  }

  @Unsupported
  moveGroup(): never {
    unsupported()
  }

  @Unsupported
  mergeGroup(): never {
    unsupported()
  }

  @Unsupported
  mergeAllGroups(): never {
    unsupported()
  }

  @Unsupported
  copyGroup(): never {
    unsupported()
  }

  onDidChangeEditorPartOptions = Event.None
  @Unsupported
  enforcePartOptions(): never {
    unsupported()
  }
}

registerSingleton(IEditorGroupsService, EmptyEditorGroupsService, InstantiationType.Eager)

class BannerService implements IBannerService {
  _serviceBrand: undefined
  focus(): void {}
  focusNextAction(): void {}
  focusPreviousAction(): void {}
  hide(): void {}
  show(): void {}
}
registerSingleton(IBannerService, BannerService, InstantiationType.Eager)

class TitleService implements ITitleService {
  _serviceBrand: undefined
  @Unsupported
  getPart(): never {
    unsupported()
  }

  @Unsupported
  createAuxiliaryTitlebarPart(): never {
    unsupported()
  }

  @Unsupported
  dispose(): never {
    unsupported()
  }

  onMenubarVisibilityChange = Event.None
  isCommandCenterVisible = false
  onDidChangeCommandCenterVisibility = Event.None
  updateProperties(): void {}
  registerVariables = () => {}
}
registerSingleton(ITitleService, TitleService, InstantiationType.Eager)

class WorkingCopyFileService implements IWorkingCopyFileService {
  _serviceBrand: undefined
  onWillRunWorkingCopyFileOperation = Event.None
  onDidFailWorkingCopyFileOperation = Event.None
  onDidRunWorkingCopyFileOperation = Event.None
  @Unsupported
  addFileOperationParticipant(): never {
    unsupported()
  }

  hasSaveParticipants = false

  @Unsupported
  addSaveParticipant(): never {
    unsupported()
  }

  @Unsupported
  runSaveParticipants(): never {
    unsupported()
  }

  @Unsupported
  create(): never {
    unsupported()
  }

  @Unsupported
  createFolder(): never {
    unsupported()
  }

  @Unsupported
  move(): never {
    unsupported()
  }

  @Unsupported
  copy(): never {
    unsupported()
  }

  @Unsupported
  delete(): never {
    unsupported()
  }

  @Unsupported
  registerWorkingCopyProvider(): never {
    unsupported()
  }

  getDirty = () => []
}
registerSingleton(IWorkingCopyFileService, WorkingCopyFileService, InstantiationType.Eager)

class PathService implements IPathService {
  _serviceBrand: undefined
  @Unsupported
  get path() {
    return unsupported()
  }

  defaultUriScheme = 'file'
  @Unsupported
  fileURI(): never {
    unsupported()
  }

  @Unsupported
  userHome(): never {
    unsupported()
  }

  @Unsupported
  hasValidBasename(): never {
    unsupported()
  }

  resolvedUserHome = undefined
}
registerSingleton(IPathService, PathService, InstantiationType.Delayed)

class ProductService implements IProductService {
  readonly _serviceBrand = undefined

  version = VSCODE_VERSION
  commit = VSCODE_COMMIT
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
}
registerSingleton(IProductService, ProductService, InstantiationType.Eager)

class ExtensionTipsService implements IExtensionTipsService {
  readonly _serviceBrand = undefined
  getConfigBasedTips = async () => []
  getImportantExecutableBasedTips = async () => []
  getOtherExecutableBasedTips = async () => []
}
registerSingleton(IExtensionTipsService, ExtensionTipsService, InstantiationType.Eager)

class LanguageStatusService implements ILanguageStatusService {
  _serviceBrand: undefined
  onDidChange = Event.None
  @Unsupported
  addStatus(): never {
    unsupported()
  }

  @Unsupported
  getLanguageStatus(): never {
    unsupported()
  }
}
registerSingleton(ILanguageStatusService, LanguageStatusService, InstantiationType.Delayed)

class HostService implements IHostService {
  _serviceBrand: undefined

  getNativeWindowHandle = async () => undefined
  getScreenshot = async () => undefined
  getPathForFile = () => undefined
  onDidChangeFullScreen = Event.None
  onDidChangeFocus = Event.None
  hasFocus = false
  hadLastFocus = async () => false
  @Unsupported
  focus(): never {
    unsupported()
  }

  onDidChangeActiveWindow = Event.None
  @Unsupported
  openWindow(): never {
    unsupported()
  }

  @Unsupported
  toggleFullScreen(): never {
    unsupported()
  }

  @Unsupported
  moveTop(): never {
    unsupported()
  }

  @Unsupported
  getCursorScreenPoint(): never {
    unsupported()
  }

  @Unsupported
  restart(): never {
    unsupported()
  }

  @Unsupported
  reload(): never {
    unsupported()
  }

  @Unsupported
  close(): never {
    unsupported()
  }

  @Unsupported
  withExpectedShutdown(): never {
    unsupported()
  }
}
registerSingleton(IHostService, HostService, InstantiationType.Eager)

class LifecycleService extends AbstractLifecycleService {
  @Unsupported
  shutdown(): never {
    unsupported()
  }
}
registerSingleton(ILifecycleService, LifecycleService, InstantiationType.Eager)

class LanguageDetectionService implements ILanguageDetectionService {
  _serviceBrand: undefined
  isEnabledForLanguage(): boolean {
    return false
  }

  async detectLanguage(): Promise<string | undefined> {
    return undefined
  }
}
registerSingleton(ILanguageDetectionService, LanguageDetectionService, InstantiationType.Eager)

registerSingleton(IExtensionService, NullExtensionService, InstantiationType.Eager)

class KeyboardLayoutService implements IKeyboardLayoutService {
  _serviceBrand: undefined
  onDidChangeKeyboardLayout = Event.None
  getRawKeyboardMapping = () => null
  getCurrentKeyboardLayout = () => null
  getAllKeyboardLayouts = () => []
  getKeyboardMapper = () => new FallbackKeyboardMapper(false, OS)
  validateCurrentKeyboardMapping = () => {}
}
registerSingleton(IKeyboardLayoutService, KeyboardLayoutService, InstantiationType.Delayed)

class NullUserDataInitializationService implements IUserDataInitializationService {
  _serviceBrand: undefined
  async requiresInitialization(): Promise<boolean> {
    return false
  }

  async whenInitializationFinished(): Promise<void> {}
  async initializeRequiredResources(): Promise<void> {}
  async initializeInstalledExtensions(): Promise<void> {}
  async initializeOtherResources(): Promise<void> {}
}
registerSingleton(
  IUserDataInitializationService,
  NullUserDataInitializationService,
  InstantiationType.Eager
)

class HostColorSchemeService implements IHostColorSchemeService {
  _serviceBrand: undefined
  dark = false
  highContrast = false
  onDidChangeColorScheme = Event.None
}
registerSingleton(IHostColorSchemeService, HostColorSchemeService, InstantiationType.Eager)

class PreferencesService implements IPreferencesService {
  _serviceBrand: undefined

  constructor(
    @IUserDataProfileService protected readonly profileService: IUserDataProfileService
  ) {}

  onDidDefaultSettingsContentChanged = Event.None
  getDefaultSettingsContent = () => undefined

  hasDefaultSettingsContent = () => false
  getSetting = () => undefined

  userSettingsResource = this.profileService.currentProfile.settingsResource
  workspaceSettingsResource = null
  @Unsupported
  getFolderSettingsResource(): never {
    unsupported()
  }

  @Unsupported
  createPreferencesEditorModel(): never {
    unsupported()
  }

  @Unsupported
  resolveModel(): never {
    unsupported()
  }

  @Unsupported
  createSettings2EditorModel(): never {
    unsupported()
  }

  @Unsupported
  openRawDefaultSettings(): never {
    unsupported()
  }

  @Unsupported
  openSettings(): never {
    unsupported()
  }

  @Unsupported
  openUserSettings(): never {
    unsupported()
  }

  @Unsupported
  openRemoteSettings(): never {
    unsupported()
  }

  @Unsupported
  openWorkspaceSettings(): never {
    unsupported()
  }

  @Unsupported
  openFolderSettings(): never {
    unsupported()
  }

  @Unsupported
  openGlobalKeybindingSettings(): never {
    unsupported()
  }

  @Unsupported
  openDefaultKeybindingsFile(): never {
    unsupported()
  }

  @Unsupported
  getEditableSettingsURI(): never {
    unsupported()
  }

  @Unsupported
  createSplitJsonEditorInput(): never {
    unsupported()
  }

  @Unsupported
  openApplicationSettings(): never {
    unsupported()
  }

  @Unsupported
  openLanguageSpecificSettings(): never {
    unsupported()
  }
}

registerSingleton(IPreferencesService, PreferencesService, InstantiationType.Eager)

class NullTextMateService implements ITextMateTokenizationService {
  _serviceBrand: undefined
  onDidEncounterLanguage = Event.None
  @Unsupported
  createGrammar(): never {
    unsupported()
  }

  @Unsupported
  startDebugMode(): never {
    unsupported()
  }

  @Unsupported
  createTokenizer(): never {
    unsupported()
  }
}
registerSingleton(ITextMateTokenizationService, NullTextMateService, InstantiationType.Eager)

class UserDataProfilesService implements IUserDataProfilesService {
  constructor(
    @IUserDataProfileService protected readonly profileService: IUserDataProfileService
  ) {}

  _serviceBrand: undefined
  onDidResetWorkspaces = Event.None
  isEnabled = () => false
  @Unsupported
  createNamedProfile(): never {
    unsupported()
  }

  @Unsupported
  createTransientProfile(): never {
    unsupported()
  }

  @Unsupported
  resetWorkspaces(): never {
    unsupported()
  }

  @Unsupported
  cleanUp(): never {
    unsupported()
  }

  @Unsupported
  cleanUpTransientProfiles(): never {
    unsupported()
  }

  @Unsupported
  get profilesHome() {
    return unsupported()
  }

  defaultProfile = this.profileService.currentProfile
  onDidChangeProfiles = Event.None
  profiles = [this.profileService.currentProfile]
  @Unsupported
  createProfile(): never {
    unsupported()
  }

  @Unsupported
  updateProfile(): never {
    unsupported()
  }

  @Unsupported
  setProfileForWorkspace(): never {
    unsupported()
  }

  getProfile = () => this.profileService.currentProfile
  @Unsupported
  removeProfile(): never {
    unsupported()
  }
}

registerSingleton(IUserDataProfilesService, UserDataProfilesService, InstantiationType.Eager)

class UserDataProfileStorageService implements IUserDataProfileStorageService {
  _serviceBrand: undefined
  onDidChange = Event.None
  @Unsupported
  readStorageData(): never {
    unsupported()
  }

  @Unsupported
  updateStorageData(): never {
    unsupported()
  }

  @Unsupported
  withProfileScopedStorageService(): never {
    unsupported()
  }
}
registerSingleton(
  IUserDataProfileStorageService,
  UserDataProfileStorageService,
  InstantiationType.Eager
)

class InjectedUserDataProfileService extends UserDataProfileService {
  constructor(@IEnvironmentService environmentService: IEnvironmentService) {
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

class SnippetsService implements ISnippetsService {
  _serviceBrand: undefined
  @Unsupported
  getSnippetFiles(): never {
    unsupported()
  }

  @Unsupported
  isEnabled(): never {
    unsupported()
  }

  @Unsupported
  updateEnablement(): never {
    unsupported()
  }

  @Unsupported
  updateUsageTimestamp(): never {
    unsupported()
  }

  getSnippets = async () => []
  @Unsupported
  getSnippetsSync(): never {
    unsupported()
  }
}
registerSingleton(ISnippetsService, SnippetsService, InstantiationType.Eager)

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
  getBreakpointModes: () => [],
  onDidChangeWatchExpressionValue: Event.None
}

class FakeViewModel implements IViewModel {
  @Unsupported
  setVisualizedExpression(): never {
    unsupported()
  }

  getVisualizedExpression = () => undefined
  onDidChangeVisualization = Event.None
  @Unsupported
  getId(): never {
    unsupported()
  }

  readonly focusedSession = undefined
  readonly focusedThread = undefined
  readonly focusedStackFrame = undefined
  @Unsupported
  getSelectedExpression(): never {
    unsupported()
  }

  @Unsupported
  setSelectedExpression(): never {
    unsupported()
  }

  @Unsupported
  updateViews(): never {
    unsupported()
  }

  @Unsupported
  isMultiSessionView(): never {
    unsupported()
  }

  onDidFocusSession = Event.None
  onDidFocusStackFrame = Event.None
  onDidSelectExpression = Event.None
  onDidEvaluateLazyExpression = Event.None
  onWillUpdateViews = Event.None
  onDidFocusThread = Event.None
  @Unsupported
  evaluateLazyExpression(): never {
    unsupported()
  }
}

class FakeAdapterManager implements IAdapterManager {
  onDidRegisterDebugger = Event.None
  hasEnabledDebuggers = () => false
  @Unsupported
  getDebugAdapterDescriptor(): never {
    unsupported()
  }

  @Unsupported
  getDebuggerLabel(): never {
    unsupported()
  }

  someDebuggerInterestedInLanguage = () => false
  getDebugger = () => undefined
  @Unsupported
  activateDebuggers(): never {
    unsupported()
  }

  registerDebugAdapterFactory = () => Disposable.None
  @Unsupported
  createDebugAdapter(): never {
    unsupported()
  }

  @Unsupported
  registerDebugAdapterDescriptorFactory(): never {
    unsupported()
  }

  @Unsupported
  unregisterDebugAdapterDescriptorFactory(): never {
    unsupported()
  }

  @Unsupported
  substituteVariables(): never {
    unsupported()
  }

  @Unsupported
  runInTerminal(): never {
    unsupported()
  }

  @Unsupported
  getEnabledDebugger(): never {
    unsupported()
  }

  @Unsupported
  guessDebugger(): never {
    unsupported()
  }

  onDidDebuggersExtPointRead = Event.None
}

class DebugService implements IDebugService {
  _serviceBrand: undefined
  initializingOptions = undefined
  @Unsupported
  sendBreakpoints(): never {
    unsupported()
  }

  @Unsupported
  updateDataBreakpoint(): never {
    unsupported()
  }

  @Unsupported
  get state() {
    return unsupported()
  }

  onDidChangeState = Event.None
  onDidNewSession = Event.None
  onWillNewSession = Event.None
  onDidEndSession = Event.None
  @Unsupported
  getConfigurationManager(): never {
    unsupported()
  }

  getAdapterManager = () => new FakeAdapterManager()
  @Unsupported
  focusStackFrame(): never {
    unsupported()
  }

  @Unsupported
  canSetBreakpointsIn(): never {
    unsupported()
  }

  @Unsupported
  addBreakpoints(): never {
    unsupported()
  }

  @Unsupported
  updateBreakpoints(): never {
    unsupported()
  }

  @Unsupported
  enableOrDisableBreakpoints(): never {
    unsupported()
  }

  @Unsupported
  setBreakpointsActivated(): never {
    unsupported()
  }

  @Unsupported
  removeBreakpoints(): never {
    unsupported()
  }

  @Unsupported
  addFunctionBreakpoint(): never {
    unsupported()
  }

  @Unsupported
  updateFunctionBreakpoint(): never {
    unsupported()
  }

  @Unsupported
  removeFunctionBreakpoints(): never {
    unsupported()
  }

  @Unsupported
  addDataBreakpoint(): never {
    unsupported()
  }

  @Unsupported
  removeDataBreakpoints(): never {
    unsupported()
  }

  @Unsupported
  addInstructionBreakpoint(): never {
    unsupported()
  }

  @Unsupported
  removeInstructionBreakpoints(): never {
    unsupported()
  }

  @Unsupported
  setExceptionBreakpointCondition(): never {
    unsupported()
  }

  @Unsupported
  setExceptionBreakpointsForSession(): never {
    unsupported()
  }

  @Unsupported
  sendAllBreakpoints(): never {
    unsupported()
  }

  @Unsupported
  addWatchExpression(): never {
    unsupported()
  }

  @Unsupported
  renameWatchExpression(): never {
    unsupported()
  }

  @Unsupported
  moveWatchExpression(): never {
    unsupported()
  }

  @Unsupported
  removeWatchExpressions(): never {
    unsupported()
  }

  @Unsupported
  startDebugging(): never {
    unsupported()
  }

  @Unsupported
  restartSession(): never {
    unsupported()
  }

  @Unsupported
  stopSession(): never {
    unsupported()
  }

  @Unsupported
  sourceIsNotAvailable(): never {
    unsupported()
  }

  getModel = () => debugModel
  getViewModel = () => new FakeViewModel()
  @Unsupported
  runTo(): never {
    unsupported()
  }
}
registerSingleton(IDebugService, DebugService, InstantiationType.Eager)

class RequestService implements IRequestService {
  _serviceBrand: undefined
  @Unsupported
  lookupAuthorization(): never {
    unsupported()
  }

  @Unsupported
  lookupKerberosAuthorization(): never {
    unsupported()
  }

  @Unsupported
  request(): never {
    unsupported()
  }

  @Unsupported
  resolveProxy(): never {
    unsupported()
  }

  @Unsupported
  loadCertificates(): never {
    unsupported()
  }
}
registerSingleton(IRequestService, RequestService, InstantiationType.Eager)

class WorkspaceTrustRequestService implements IWorkspaceTrustRequestService {
  _serviceBrand: undefined
  onDidInitiateOpenFilesTrustRequest = Event.None
  onDidInitiateWorkspaceTrustRequest = Event.None
  onDidInitiateWorkspaceTrustRequestOnStartup = Event.None
  @Unsupported
  completeOpenFilesTrustRequest(): never {
    unsupported()
  }

  requestOpenFilesTrust = async () => WorkspaceTrustUriResponse.Open
  @Unsupported
  cancelWorkspaceTrustRequest(): never {
    unsupported()
  }

  @Unsupported
  completeWorkspaceTrustRequest(): never {
    unsupported()
  }

  requestWorkspaceTrust = async () => true
  requestWorkspaceTrustOnStartup = () => null
}
registerSingleton(
  IWorkspaceTrustRequestService,
  WorkspaceTrustRequestService,
  InstantiationType.Eager
)

class ActivityService implements IActivityService {
  _serviceBrand: undefined
  onDidChangeActivity = Event.None
  @Unsupported
  getViewContainerActivities(): never {
    unsupported()
  }

  @Unsupported
  getActivity(): never {
    unsupported()
  }

  showViewContainerActivity = () => Disposable.None
  showViewActivity = () => Disposable.None
  showAccountsActivity = () => Disposable.None
  showGlobalActivity = () => Disposable.None
}
registerSingleton(IActivityService, ActivityService, InstantiationType.Eager)

class ExtensionHostDebugService implements IExtensionHostDebugService {
  _serviceBrand: undefined
  @Unsupported
  reload(): never {
    unsupported()
  }

  onReload = Event.None
  @Unsupported
  close(): never {
    unsupported()
  }

  onClose = Event.None
  @Unsupported
  attachSession(): never {
    unsupported()
  }

  onAttachSession = Event.None
  @Unsupported
  terminateSession(): never {
    unsupported()
  }

  onTerminateSession = Event.None
  @Unsupported
  openExtensionDevelopmentHostWindow(): never {
    unsupported()
  }
}
registerSingleton(IExtensionHostDebugService, ExtensionHostDebugService, InstantiationType.Eager)

class ViewsService implements IViewsService {
  _serviceBrand: undefined

  getFocusedView = () => null
  isViewContainerActive = () => false
  @Unsupported
  getFocusedViewName(): never {
    unsupported()
  }

  onDidChangeFocusedView = Event.None
  onDidChangeViewContainerVisibility = Event.None
  isViewContainerVisible = () => false
  @Unsupported
  openViewContainer(): never {
    unsupported()
  }

  @Unsupported
  closeViewContainer(): never {
    unsupported()
  }

  @Unsupported
  getVisibleViewContainer(): never {
    unsupported()
  }

  getActiveViewPaneContainerWithId = () => null
  onDidChangeViewVisibility = Event.None
  isViewVisible = () => false
  openView = async () => null
  @Unsupported
  closeView(): never {
    unsupported()
  }

  getActiveViewWithId = () => null
  getViewWithId = () => null
  getViewProgressIndicator = () => undefined
}
registerSingleton(IViewsService, ViewsService, InstantiationType.Eager)

class ViewDescriptorService implements IViewDescriptorService {
  _serviceBrand: undefined
  viewContainers = []
  onDidChangeViewContainers = Event.None
  getDefaultViewContainer = () => undefined
  getViewContainerById = () => null
  @Unsupported
  isViewContainerRemovedPermanently(): never {
    unsupported()
  }

  getDefaultViewContainerLocation = () => null
  getViewContainerLocation = () => null
  @Unsupported
  getViewContainersByLocation(): never {
    unsupported()
  }

  getViewContainerModel = () =>
    ({
      onDidChangeAllViewDescriptors: Event.None,
      visibleViewDescriptors: []
    }) as Pick<
      IViewContainerModel,
      'onDidChangeAllViewDescriptors' | 'visibleViewDescriptors'
    > as IViewContainerModel

  onDidChangeContainerLocation = Event.None
  @Unsupported
  moveViewContainerToLocation(): never {
    unsupported()
  }

  @Unsupported
  getViewContainerBadgeEnablementState(): never {
    unsupported()
  }

  @Unsupported
  setViewContainerBadgeEnablementState(): never {
    unsupported()
  }

  getViewDescriptorById = () => null
  getViewContainerByViewId = () => null
  getDefaultContainerById = () => null
  getViewLocationById = () => null
  onDidChangeContainer = Event.None
  @Unsupported
  moveViewsToContainer(): never {
    unsupported()
  }

  onDidChangeLocation = Event.None
  moveViewToLocation = () => null
  reset = () => null
}
registerSingleton(IViewDescriptorService, ViewDescriptorService, InstantiationType.Eager)

class HistoryService implements IHistoryService {
  _serviceBrand: undefined
  suspendTracking = () => ({
    dispose() {}
  })

  @Unsupported
  goForward(): never {
    unsupported()
  }

  @Unsupported
  goBack(): never {
    unsupported()
  }

  @Unsupported
  goPrevious(): never {
    unsupported()
  }

  @Unsupported
  goLast(): never {
    unsupported()
  }

  @Unsupported
  reopenLastClosedEditor(): never {
    unsupported()
  }

  getHistory = () => []
  @Unsupported
  removeFromHistory(): never {
    unsupported()
  }

  getLastActiveWorkspaceRoot = () => undefined
  getLastActiveFile = () => undefined
  @Unsupported
  openNextRecentlyUsedEditor(): never {
    unsupported()
  }

  @Unsupported
  openPreviouslyUsedEditor(): never {
    unsupported()
  }

  @Unsupported
  clear(): never {
    unsupported()
  }

  @Unsupported
  clearRecentlyOpened(): never {
    unsupported()
  }
}
registerSingleton(IHistoryService, HistoryService, InstantiationType.Eager)

class TaskService implements ITaskService {
  onDidChangeTaskProviders = Event.None
  getKnownTasks = async () => []
  _serviceBrand: undefined
  onDidChangeTaskConfig = Event.None
  onDidStateChange = Event.None
  supportsMultipleTaskExecutions = false
  @Unsupported
  configureAction(): never {
    unsupported()
  }

  @Unsupported
  run(): never {
    unsupported()
  }

  inTerminal = () => false
  getActiveTasks = async () => []
  @Unsupported
  getBusyTasks(): never {
    unsupported()
  }

  @Unsupported
  terminate(): never {
    unsupported()
  }

  @Unsupported
  tasks(): never {
    unsupported()
  }

  @Unsupported
  taskTypes(): never {
    unsupported()
  }

  @Unsupported
  getWorkspaceTasks(): never {
    unsupported()
  }

  @Unsupported
  getSavedTasks(): never {
    unsupported()
  }

  @Unsupported
  removeRecentlyUsedTask(): never {
    unsupported()
  }

  @Unsupported
  getTask(): never {
    unsupported()
  }

  @Unsupported
  tryResolveTask(): never {
    unsupported()
  }

  @Unsupported
  createSorter(): never {
    unsupported()
  }

  @Unsupported
  getTaskDescription(): never {
    unsupported()
  }

  @Unsupported
  customize(): never {
    unsupported()
  }

  @Unsupported
  openConfig(): never {
    unsupported()
  }

  @Unsupported
  registerTaskProvider(): never {
    unsupported()
  }

  registerTaskSystem = () => {}
  onDidChangeTaskSystemInfo = Event.None
  hasTaskSystemInfo = false
  registerSupportedExecutions = () => {}
  @Unsupported
  extensionCallbackTaskComplete(): never {
    unsupported()
  }

  isReconnected = false
  onDidReconnectToTasks = Event.None
}
registerSingleton(ITaskService, TaskService, InstantiationType.Eager)

class ConfigurationResolverService implements IConfigurationResolverService {
  _serviceBrand: undefined
  @Unsupported
  resolveWithEnvironment(): never {
    unsupported()
  }

  @Unsupported
  resolveAsync(): never {
    unsupported()
  }

  @Unsupported
  resolveAnyAsync(): never {
    unsupported()
  }

  @Unsupported
  resolveAnyMap(): never {
    unsupported()
  }

  @Unsupported
  resolveWithInteractionReplace(): never {
    unsupported()
  }

  @Unsupported
  resolveWithInteraction(): never {
    unsupported()
  }

  @Unsupported
  contributeVariable(): never {
    unsupported()
  }
}
registerSingleton(
  IConfigurationResolverService,
  ConfigurationResolverService,
  InstantiationType.Eager
)

class RemoteAgentService implements IRemoteAgentService {
  _serviceBrand: undefined
  @Unsupported
  endConnection(): never {
    unsupported()
  }

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
}
registerSingleton(IRemoteAgentService, RemoteAgentService, InstantiationType.Eager)

registerSingleton(
  ICustomEndpointTelemetryService,
  NullEndpointTelemetryService,
  InstantiationType.Eager
)

class MonacoSearchService implements ISearchService {
  _serviceBrand: undefined
  constructor(@IModelService private modelService: IModelService) {}
  schemeHasFileSearchProvider = () => false
  getAIName = async () => undefined
  @Unsupported
  aiTextSearch(): never {
    unsupported()
  }

  @Unsupported
  textSearchSplitSyncAsync(): never {
    unsupported()
  }

  async textSearch(): Promise<ISearchComplete> {
    return {
      results: [],
      messages: []
    }
  }

  async fileSearch(): Promise<ISearchComplete> {
    return {
      results: this.modelService.getModels().map((model) => ({
        resource: model.uri
      })),
      messages: []
    }
  }

  async clearCache(): Promise<void> {}

  @Unsupported
  registerSearchResultProvider(): never {
    unsupported()
  }
}
registerSingleton(ISearchService, MonacoSearchService, InstantiationType.Eager)

class EditSessionIdentityService implements IEditSessionIdentityService {
  _serviceBrand: undefined
  registerEditSessionIdentityProvider = () => Disposable.None
  getEditSessionIdentifier = async () => undefined
  provideEditSessionIdentityMatch = async () => undefined
  addEditSessionIdentityCreateParticipant = () => Disposable.None
  onWillCreateEditSessionIdentity = async () => {}
}
registerSingleton(IEditSessionIdentityService, EditSessionIdentityService, InstantiationType.Eager)

class WorkspaceEditingService implements IWorkspaceEditingService {
  _serviceBrand: undefined
  @Unsupported
  addFolders(): never {
    unsupported()
  }

  @Unsupported
  removeFolders(): never {
    unsupported()
  }

  @Unsupported
  updateFolders(): never {
    unsupported()
  }

  @Unsupported
  enterWorkspace(): never {
    unsupported()
  }

  @Unsupported
  createAndEnterWorkspace(): never {
    unsupported()
  }

  @Unsupported
  saveAndEnterWorkspace(): never {
    unsupported()
  }

  @Unsupported
  copyWorkspaceSettings(): never {
    unsupported()
  }

  @Unsupported
  pickNewWorkspacePath(): never {
    unsupported()
  }
}
registerSingleton(IWorkspaceEditingService, WorkspaceEditingService, InstantiationType.Eager)

class TimerService implements ITimerService {
  _serviceBrand: undefined
  @Unsupported
  getStartTime(): never {
    unsupported()
  }

  @Unsupported
  whenReady(): never {
    unsupported()
  }

  @Unsupported
  get perfBaseline() {
    return unsupported()
  }

  @Unsupported
  get startupMetrics() {
    return unsupported()
  }

  setPerformanceMarks = () => {}
  @Unsupported
  getPerformanceMarks(): never {
    unsupported()
  }

  @Unsupported
  getDuration(): never {
    unsupported()
  }
}
registerSingleton(ITimerService, TimerService, InstantiationType.Eager)

class ExtensionsWorkbenchService implements IExtensionsWorkbenchService {
  _serviceBrand: undefined

  @Unsupported
  downloadVSIX(): never {
    unsupported()
  }

  @Unsupported
  updateAutoUpdateForAllExtensions(): never {
    unsupported()
  }

  @Unsupported
  openSearch(): never {
    unsupported()
  }

  getExtensionRuntimeStatus = () => undefined
  onDidChangeExtensionsNotification = Event.None
  getExtensionsNotification = () => undefined
  shouldRequireConsentToUpdate = async () => undefined
  @Unsupported
  updateAutoUpdateValue(): never {
    unsupported()
  }

  @Unsupported
  getResourceExtensions(): never {
    unsupported()
  }

  @Unsupported
  updateRunningExtensions(): never {
    unsupported()
  }

  @Unsupported
  togglePreRelease(): never {
    unsupported()
  }

  @Unsupported
  isAutoUpdateEnabledFor(): never {
    unsupported()
  }

  @Unsupported
  updateAutoUpdateEnablementFor(): never {
    unsupported()
  }

  @Unsupported
  isAutoUpdateEnabled(): never {
    unsupported()
  }

  @Unsupported
  getAutoUpdateValue(): never {
    unsupported()
  }

  @Unsupported
  updateAll(): never {
    unsupported()
  }

  @Unsupported
  toggleApplyExtensionToAllProfiles(): never {
    unsupported()
  }

  whenInitialized = Promise.resolve()
  onChange = Event.None
  onReset = Event.None
  preferPreReleases = false
  local = []
  installed = []
  outdated = []
  @Unsupported
  queryLocal(): never {
    unsupported()
  }

  @Unsupported
  queryGallery(): never {
    unsupported()
  }

  @Unsupported
  getExtensions(): never {
    unsupported()
  }

  @Unsupported
  canInstall(): never {
    unsupported()
  }

  @Unsupported
  install(): never {
    unsupported()
  }

  @Unsupported
  installInServer(): never {
    unsupported()
  }

  @Unsupported
  uninstall(): never {
    unsupported()
  }

  @Unsupported
  installVersion(): never {
    unsupported()
  }

  @Unsupported
  reinstall(): never {
    unsupported()
  }

  @Unsupported
  canSetLanguage(): never {
    unsupported()
  }

  @Unsupported
  setLanguage(): never {
    unsupported()
  }

  @Unsupported
  setEnablement(): never {
    unsupported()
  }

  @Unsupported
  pinExtension(): never {
    unsupported()
  }

  @Unsupported
  open(): never {
    unsupported()
  }

  @Unsupported
  checkForUpdates(): never {
    unsupported()
  }

  @Unsupported
  getExtensionStatus(): never {
    unsupported()
  }

  @Unsupported
  isExtensionIgnoredToSync(): never {
    unsupported()
  }

  @Unsupported
  toggleExtensionIgnoredToSync(): never {
    unsupported()
  }
}
registerSingleton(IExtensionsWorkbenchService, ExtensionsWorkbenchService, InstantiationType.Eager)

class ExtensionManagementServerService implements IExtensionManagementServerService {
  _serviceBrand = undefined
  localExtensionManagementServer = null
  remoteExtensionManagementServer = null
  webExtensionManagementServer = null

  @Unsupported
  getExtensionManagementServer(): never {
    unsupported()
  }

  @Unsupported
  getExtensionInstallLocation(): never {
    unsupported()
  }
}
registerSingleton(
  IExtensionManagementServerService,
  ExtensionManagementServerService,
  InstantiationType.Eager
)

class ExtensionRecommendationsService implements IExtensionRecommendationsService {
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
}
registerSingleton(
  IExtensionRecommendationsService,
  ExtensionRecommendationsService,
  InstantiationType.Eager
)

class UserDataAutoSyncService implements IUserDataAutoSyncService {
  _serviceBrand: undefined
  readonly onError = Event.None
  @Unsupported
  turnOn(): never {
    unsupported()
  }

  @Unsupported
  turnOff(): never {
    unsupported()
  }

  @Unsupported
  triggerSync(): never {
    unsupported()
  }
}
registerSingleton(IUserDataAutoSyncService, UserDataAutoSyncService, InstantiationType.Eager)

class IgnoredExtensionsManagementService implements IIgnoredExtensionsManagementService {
  _serviceBrand: undefined
  getIgnoredExtensions = () => []
  hasToNeverSyncExtension = () => false
  hasToAlwaysSyncExtension = () => false
  @Unsupported
  updateIgnoredExtensions(): never {
    unsupported()
  }

  @Unsupported
  updateSynchronizedExtensions(): never {
    unsupported()
  }
}
registerSingleton(
  IIgnoredExtensionsManagementService,
  IgnoredExtensionsManagementService,
  InstantiationType.Eager
)

class ExtensionRecommendationNotificationService
  implements IExtensionRecommendationNotificationService
{
  _serviceBrand: undefined
  readonly ignoredRecommendations: string[] = []
  hasToIgnoreRecommendationNotifications = () => false
  @Unsupported
  promptImportantExtensionsInstallNotification(): never {
    unsupported()
  }

  @Unsupported
  promptWorkspaceRecommendations(): never {
    unsupported()
  }
}
registerSingleton(
  IExtensionRecommendationNotificationService,
  ExtensionRecommendationNotificationService,
  InstantiationType.Eager
)

class WebExtensionsScannerService implements IWebExtensionsScannerService {
  _serviceBrand: undefined
  scanSystemExtensions = async () => []
  scanUserExtensions = async () => []
  scanExtensionsUnderDevelopment = async () => []
  scanExistingExtension = async () => null
  @Unsupported
  addExtension(): never {
    unsupported()
  }

  @Unsupported
  addExtensionFromGallery(): never {
    unsupported()
  }

  removeExtension = async () => {}
  copyExtensions = async () => {}
  @Unsupported
  updateMetadata(): never {
    unsupported()
  }

  scanExtensionManifest = async () => null
}
registerSingleton(
  IWebExtensionsScannerService,
  WebExtensionsScannerService,
  InstantiationType.Eager
)

class ExtensionsScannerService implements IExtensionsScannerService {
  _serviceBrand: undefined
  @Unsupported
  get systemExtensionsLocation() {
    return unsupported()
  }

  @Unsupported
  get userExtensionsLocation() {
    return unsupported()
  }

  onDidChangeCache = Event.None
  @Unsupported
  getTargetPlatform(): never {
    unsupported()
  }

  @Unsupported
  scanAllExtensions(): never {
    unsupported()
  }

  @Unsupported
  scanSystemExtensions(): never {
    unsupported()
  }

  @Unsupported
  scanUserExtensions(): never {
    unsupported()
  }

  @Unsupported
  scanExtensionsUnderDevelopment(): never {
    unsupported()
  }

  @Unsupported
  scanExistingExtension(): never {
    unsupported()
  }

  @Unsupported
  scanOneOrMultipleExtensions(): never {
    unsupported()
  }

  @Unsupported
  scanMultipleExtensions(): never {
    unsupported()
  }

  @Unsupported
  scanMetadata(): never {
    unsupported()
  }

  @Unsupported
  updateMetadata(): never {
    unsupported()
  }

  @Unsupported
  initializeDefaultProfileExtensions(): never {
    unsupported()
  }
}
registerSingleton(IExtensionsScannerService, ExtensionsScannerService, InstantiationType.Eager)

class ExtensionsProfileScannerService implements IExtensionsProfileScannerService {
  _serviceBrand: undefined
  onAddExtensions = Event.None
  onDidAddExtensions = Event.None
  onRemoveExtensions = Event.None
  onDidRemoveExtensions = Event.None
  @Unsupported
  scanProfileExtensions(): never {
    unsupported()
  }

  @Unsupported
  addExtensionsToProfile(): never {
    unsupported()
  }

  @Unsupported
  updateMetadata(): never {
    unsupported()
  }

  @Unsupported
  removeExtensionFromProfile(): never {
    unsupported()
  }
}
registerSingleton(
  IExtensionsProfileScannerService,
  ExtensionsProfileScannerService,
  InstantiationType.Eager
)

class ExtensionIgnoredRecommendationsService implements IExtensionIgnoredRecommendationsService {
  _serviceBrand: undefined
  onDidChangeIgnoredRecommendations = Event.None
  ignoredRecommendations = []
  onDidChangeGlobalIgnoredRecommendation = Event.None
  globalIgnoredRecommendations = []
  @Unsupported
  toggleGlobalIgnoredRecommendation(): never {
    unsupported()
  }
}
registerSingleton(
  IExtensionIgnoredRecommendationsService,
  ExtensionIgnoredRecommendationsService,
  InstantiationType.Eager
)

class WorkspaceExtensionsConfigService implements IWorkspaceExtensionsConfigService {
  _serviceBrand: undefined
  onDidChangeExtensionsConfigs = Event.None
  @Unsupported
  getExtensionsConfigs(): never {
    unsupported()
  }

  @Unsupported
  getRecommendations(): never {
    unsupported()
  }

  @Unsupported
  getUnwantedRecommendations(): never {
    unsupported()
  }

  @Unsupported
  toggleRecommendation(): never {
    unsupported()
  }

  @Unsupported
  toggleUnwantedRecommendation(): never {
    unsupported()
  }
}
registerSingleton(
  IWorkspaceExtensionsConfigService,
  WorkspaceExtensionsConfigService,
  InstantiationType.Eager
)

class WorkbenchExtensionEnablementService implements IWorkbenchExtensionEnablementService {
  _serviceBrand: undefined
  getEnablementStates = (extensions: IExtension[]) =>
    extensions.map(() => EnablementState.EnabledGlobally)

  onEnablementChanged = Event.None
  getEnablementState = () => EnablementState.EnabledGlobally
  getDependenciesEnablementStates = () => []
  canChangeEnablement = () => false
  canChangeWorkspaceEnablement = () => false
  isEnabled = () => true
  isEnabledEnablementState = () => true
  isDisabledGlobally = () => false
  @Unsupported
  setEnablement(): never {
    unsupported()
  }

  @Unsupported
  updateExtensionsEnablementsWhenWorkspaceTrustChanges(): never {
    unsupported()
  }
}
registerSingleton(
  IWorkbenchExtensionEnablementService,
  WorkbenchExtensionEnablementService,
  InstantiationType.Eager
)

class TunnelService implements ITunnelService {
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
  @Unsupported
  openTunnel(): never {
    unsupported()
  }

  getExistingTunnel = async () => undefined
  @Unsupported
  setEnvironmentTunnel(): never {
    unsupported()
  }

  @Unsupported
  closeTunnel(): never {
    unsupported()
  }

  @Unsupported
  setTunnelProvider(): never {
    unsupported()
  }

  @Unsupported
  setTunnelFeatures(): never {
    unsupported()
  }

  isPortPrivileged = () => false
}
registerSingleton(ITunnelService, TunnelService, InstantiationType.Eager)

class FilesConfigurationService implements IFilesConfigurationService {
  _serviceBrand: undefined
  onDidChangeAutoSaveConfiguration = Event.None
  onDidChangeAutoSaveDisabled = Event.None
  hasShortAutoSaveDelay = () => false
  @Unsupported
  disableAutoSave(): never {
    unsupported()
  }

  onDidChangeReadonly = Event.None
  onDidChangeFilesAssociation = Event.None
  onAutoSaveConfigurationChange = Event.None
  @Unsupported
  getAutoSaveConfiguration(): never {
    unsupported()
  }

  @Unsupported
  getAutoSaveMode(): never {
    unsupported()
  }

  @Unsupported
  toggleAutoSave(): never {
    unsupported()
  }

  onReadonlyChange = Event.None
  @Unsupported
  isReadonly(): never {
    unsupported()
  }

  @Unsupported
  updateReadonly(): never {
    unsupported()
  }

  onFilesAssociationChange = Event.None
  isHotExitEnabled = true
  hotExitConfiguration = undefined
  @Unsupported
  preventSaveConflicts(): never {
    unsupported()
  }
}
registerSingleton(IFilesConfigurationService, FilesConfigurationService, InstantiationType.Eager)

class UntitledTextEditorService implements IUntitledTextEditorService {
  _serviceBrand: undefined
  onDidCreate = Event.None
  canDispose = (): true | Promise<true> => true
  isUntitledWithAssociatedResource = () => false
  onDidChangeDirty = Event.None
  onDidChangeEncoding = Event.None
  onDidChangeLabel = Event.None
  onWillDispose = Event.None
  @Unsupported
  create(): never {
    unsupported()
  }

  get = () => undefined
  getValue = () => undefined
  @Unsupported
  resolve(): never {
    unsupported()
  }
}
registerSingleton(IUntitledTextEditorService, UntitledTextEditorService, InstantiationType.Eager)

class WorkingCopyBackupService implements IWorkingCopyBackupService {
  _serviceBrand: undefined
  async hasBackups(): Promise<boolean> {
    return false
  }

  hasBackupSync(): boolean {
    return false
  }

  async getBackups(): Promise<readonly IWorkingCopyIdentifier[]> {
    return []
  }

  async resolve<T extends IWorkingCopyBackupMeta>(): Promise<
    IResolvedWorkingCopyBackup<T> | undefined
  > {
    return undefined
  }

  async backup(): Promise<void> {}

  async discardBackup(): Promise<void> {}

  async discardBackups(): Promise<void> {}
}
registerSingleton(IWorkingCopyBackupService, WorkingCopyBackupService, InstantiationType.Eager)
class WorkingCopyService implements IWorkingCopyService {
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
  registerWorkingCopy(): IDisposable {
    // ignore
    return Disposable.None
  }

  has = () => false
  get = () => undefined
  getAll = () => undefined
}
registerSingleton(IWorkingCopyService, WorkingCopyService, InstantiationType.Eager)
class DecorationsService implements IDecorationsService {
  _serviceBrand: undefined
  onDidChangeDecorations = Event.None
  @Unsupported
  registerDecorationsProvider(): never {
    unsupported()
  }

  getDecoration = () => undefined
}
registerSingleton(IDecorationsService, DecorationsService, InstantiationType.Eager)
class ElevatedFileService implements IElevatedFileService {
  _serviceBrand: undefined
  isSupported = () => false
  @Unsupported
  writeFileElevated(): never {
    unsupported()
  }
}
registerSingleton(IElevatedFileService, ElevatedFileService, InstantiationType.Eager)
class FileDialogService implements IFileDialogService {
  @Unsupported
  preferredHome(): never {
    unsupported()
  }

  _serviceBrand: undefined
  @Unsupported
  defaultFilePath(): never {
    unsupported()
  }

  @Unsupported
  defaultFolderPath(): never {
    unsupported()
  }

  @Unsupported
  defaultWorkspacePath(): never {
    unsupported()
  }

  @Unsupported
  pickFileFolderAndOpen(): never {
    unsupported()
  }

  @Unsupported
  pickFileAndOpen(): never {
    unsupported()
  }

  @Unsupported
  pickFolderAndOpen(): never {
    unsupported()
  }

  @Unsupported
  pickWorkspaceAndOpen(): never {
    unsupported()
  }

  @Unsupported
  pickFileToSave(): never {
    unsupported()
  }

  @Unsupported
  showSaveDialog(): never {
    unsupported()
  }

  @Unsupported
  showSaveConfirm(): never {
    unsupported()
  }

  @Unsupported
  showOpenDialog(): never {
    unsupported()
  }
}
registerSingleton(IFileDialogService, FileDialogService, InstantiationType.Eager)

class JSONEditingService implements IJSONEditingService {
  _serviceBrand: undefined
  @Unsupported
  write(): never {
    unsupported()
  }
}
registerSingleton(IJSONEditingService, JSONEditingService, InstantiationType.Delayed)

class WorkspacesService implements IWorkspacesService {
  _serviceBrand: undefined
  @Unsupported
  enterWorkspace(): never {
    unsupported()
  }

  @Unsupported
  createUntitledWorkspace(): never {
    unsupported()
  }

  @Unsupported
  deleteUntitledWorkspace(): never {
    unsupported()
  }

  @Unsupported
  getWorkspaceIdentifier(): never {
    unsupported()
  }

  onDidChangeRecentlyOpened = Event.None
  @Unsupported
  addRecentlyOpened(): never {
    unsupported()
  }

  @Unsupported
  removeRecentlyOpened(): never {
    unsupported()
  }

  @Unsupported
  clearRecentlyOpened(): never {
    unsupported()
  }

  @Unsupported
  getRecentlyOpened(): never {
    unsupported()
  }

  @Unsupported
  getDirtyWorkspaces(): never {
    unsupported()
  }
}
registerSingleton(IWorkspacesService, WorkspacesService, InstantiationType.Delayed)

class TextEditorService implements ITextEditorService {
  _serviceBrand: undefined
  @Unsupported
  createTextEditor(): never {
    unsupported()
  }

  @Unsupported
  resolveTextEditor(): never {
    unsupported()
  }
}
registerSingleton(ITextEditorService, TextEditorService, InstantiationType.Eager)

class EditorResolverService implements IEditorResolverService {
  @Unsupported
  getAllUserAssociations(): never {
    unsupported()
  }

  _serviceBrand: undefined
  @Unsupported
  getAssociationsForResource(): never {
    unsupported()
  }

  @Unsupported
  updateUserAssociations(): never {
    unsupported()
  }

  onDidChangeEditorRegistrations = Event.None
  @Unsupported
  bufferChangeEvents(): never {
    unsupported()
  }

  registerEditor() {
    // do nothing
    return {
      dispose: () => {}
    }
  }

  @Unsupported
  resolveEditor(): never {
    unsupported()
  }

  getEditors = () => []
}
registerSingleton(IEditorResolverService, EditorResolverService, InstantiationType.Eager)

class OutputService implements IOutputService {
  _serviceBrand: undefined
  getChannel(): IOutputChannel | undefined {
    return undefined
  }

  getChannelDescriptor(): IOutputChannelDescriptor | undefined {
    return undefined
  }

  getChannelDescriptors(): IOutputChannelDescriptor[] {
    return []
  }

  getActiveChannel(): IOutputChannel | undefined {
    return undefined
  }

  async showChannel(): Promise<void> {
    // ignore
  }

  onActiveOutputChannel = Event.None
}
registerSingleton(IOutputService, OutputService, InstantiationType.Delayed)

class OutputChannelModelService implements IOutputChannelModelService {
  _serviceBrand: undefined
  @Unsupported
  createOutputChannelModel(): never {
    unsupported()
  }
}
registerSingleton(IOutputChannelModelService, OutputChannelModelService, InstantiationType.Delayed)
class ExtensionResourceLoaderService implements IExtensionResourceLoaderService {
  _serviceBrand: undefined
  @Unsupported
  readExtensionResource(): never {
    unsupported()
  }

  supportsExtensionGalleryResources = false
  isExtensionGalleryResource = () => false
  @Unsupported
  getExtensionGalleryResourceURL(): never {
    unsupported()
  }
}
registerSingleton(
  IExtensionResourceLoaderService,
  ExtensionResourceLoaderService,
  InstantiationType.Eager
)

class BuiltinExtensionsScannerService implements IBuiltinExtensionsScannerService {
  _serviceBrand: undefined
  scanBuiltinExtensions() {
    return Promise.resolve([])
  }
}
registerSingleton(
  IBuiltinExtensionsScannerService,
  BuiltinExtensionsScannerService,
  InstantiationType.Eager
)

class ExplorerService implements IExplorerService {
  _serviceBrand: undefined
  roots = []
  @Unsupported
  get sortOrderConfiguration() {
    return unsupported()
  }

  @Unsupported
  getContext(): never {
    unsupported()
  }

  @Unsupported
  hasViewFocus(): never {
    unsupported()
  }

  @Unsupported
  setEditable(): never {
    unsupported()
  }

  @Unsupported
  getEditable(): never {
    unsupported()
  }

  @Unsupported
  getEditableData(): never {
    unsupported()
  }

  @Unsupported
  isEditable(): never {
    unsupported()
  }

  @Unsupported
  findClosest(): never {
    unsupported()
  }

  @Unsupported
  findClosestRoot(): never {
    unsupported()
  }

  @Unsupported
  refresh(): never {
    unsupported()
  }

  @Unsupported
  setToCopy(): never {
    unsupported()
  }

  @Unsupported
  isCut(): never {
    unsupported()
  }

  @Unsupported
  applyBulkEdit(): never {
    unsupported()
  }

  @Unsupported
  select(): never {
    unsupported()
  }

  @Unsupported
  registerView(): never {
    unsupported()
  }
}
registerSingleton(IExplorerService, ExplorerService, InstantiationType.Delayed)

class ExtensionStorageService implements IExtensionStorageService {
  _serviceBrand: undefined
  getExtensionState = () => undefined
  getExtensionStateRaw = () => undefined
  @Unsupported
  setExtensionState(): never {
    unsupported()
  }

  onDidChangeExtensionStorageToSync = Event.None
  @Unsupported
  setKeysForSync(): never {
    unsupported()
  }

  getKeysForSync = () => undefined
  @Unsupported
  addToMigrationList(): never {
    unsupported()
  }

  getSourceExtensionToMigrate = () => undefined
}
registerSingleton(IExtensionStorageService, ExtensionStorageService, InstantiationType.Delayed)

class GlobalExtensionEnablementService implements IGlobalExtensionEnablementService {
  _serviceBrand: undefined
  onDidChangeEnablement = Event.None
  getDisabledExtensions() {
    return []
  }

  enableExtension() {
    return Promise.resolve(true)
  }

  disableExtension() {
    return Promise.resolve(true)
  }
}
registerSingleton(
  IGlobalExtensionEnablementService,
  GlobalExtensionEnablementService,
  InstantiationType.Delayed
)

class LanguagePackService implements ILanguagePackService {
  _serviceBrand: undefined
  async getAvailableLanguages(): Promise<ILanguagePackItem[]> {
    return []
  }

  async getInstalledLanguages(): Promise<ILanguagePackItem[]> {
    return []
  }

  async getBuiltInExtensionTranslationsUri(id: string, language: string): Promise<URI | undefined> {
    const uri = getBuiltInExtensionTranslationsUris(language)?.[id]
    return uri != null ? URI.parse(uri) : undefined
  }
}
registerSingleton(ILanguagePackService, LanguagePackService, InstantiationType.Delayed)

class TreeViewsDnDService implements ITreeViewsDnDService {
  _serviceBrand: undefined
  @Unsupported
  removeDragOperationTransfer(): never {
    unsupported()
  }

  @Unsupported
  addDragOperationTransfer(): never {
    unsupported()
  }
}
registerSingleton(ITreeViewsDnDService, TreeViewsDnDService, InstantiationType.Delayed)

class BreadcrumbsService implements IBreadcrumbsService {
  _serviceBrand: undefined
  @Unsupported
  register(): never {
    unsupported()
  }

  getWidget = () => undefined
}
registerSingleton(IBreadcrumbsService, BreadcrumbsService, InstantiationType.Eager)

class OutlineService implements IOutlineService {
  _serviceBrand: undefined
  onDidChange = Event.None
  canCreateOutline = () => false
  createOutline = async () => undefined
  @Unsupported
  registerOutlineCreator(): never {
    unsupported()
  }
}
registerSingleton(IOutlineService, OutlineService, InstantiationType.Eager)

class UpdateService implements IUpdateService {
  _serviceBrand: undefined
  onStateChange = Event.None
  state = State.Uninitialized
  @Unsupported
  checkForUpdates(): never {
    unsupported()
  }

  @Unsupported
  downloadUpdate(): never {
    unsupported()
  }

  @Unsupported
  applyUpdate(): never {
    unsupported()
  }

  @Unsupported
  quitAndInstall(): never {
    unsupported()
  }

  isLatestVersion = async () => true
  @Unsupported
  _applySpecificUpdate(): never {
    unsupported()
  }
}
registerSingleton(IUpdateService, UpdateService, InstantiationType.Eager)

class StatusbarService implements IStatusbarService {
  _serviceBrand: undefined
  @Unsupported
  overrideEntry(): never {
    unsupported()
  }

  @Unsupported
  getPart(): never {
    unsupported()
  }

  @Unsupported
  createAuxiliaryStatusbarPart(): never {
    unsupported()
  }

  @Unsupported
  createScoped(): never {
    unsupported()
  }

  @Unsupported
  dispose(): never {
    unsupported()
  }

  onDidChangeEntryVisibility = Event.None
  addEntry = () => ({
    dispose: () => {},
    update: () => {}
  })

  isEntryVisible = () => false
  updateEntryVisibility = () => {
    /* ignore */
  }

  focus = () => {
    /* ignore */
  }

  focusNextEntry = () => {
    /* ignore */
  }

  focusPreviousEntry = () => {
    /* ignore */
  }

  isEntryFocused = () => false
  overrideStyle = () => Disposable.None
}
registerSingleton(IStatusbarService, StatusbarService, InstantiationType.Eager)

class ExtensionGalleryService implements IExtensionGalleryService {
  _serviceBrand: undefined
  isEnabled = () => false
  @Unsupported
  query(): never {
    unsupported()
  }

  @Unsupported
  getExtensions(): never {
    unsupported()
  }

  @Unsupported
  isExtensionCompatible(): never {
    unsupported()
  }

  @Unsupported
  getCompatibleExtension(): never {
    unsupported()
  }

  @Unsupported
  getAllCompatibleVersions(): never {
    unsupported()
  }

  @Unsupported
  download(): never {
    unsupported()
  }

  @Unsupported
  downloadSignatureArchive(): never {
    unsupported()
  }

  @Unsupported
  reportStatistic(): never {
    unsupported()
  }

  @Unsupported
  getReadme(): never {
    unsupported()
  }

  @Unsupported
  getManifest(): never {
    unsupported()
  }

  @Unsupported
  getChangelog(): never {
    unsupported()
  }

  @Unsupported
  getCoreTranslation(): never {
    unsupported()
  }

  @Unsupported
  getExtensionsControlManifest(): never {
    unsupported()
  }
}
registerSingleton(IExtensionGalleryService, ExtensionGalleryService, InstantiationType.Eager)

class TerminalService implements ITerminalService {
  _serviceBrand: undefined

  @Unsupported
  revealTerminal(): never {
    unsupported()
  }

  @Unsupported
  focusInstance(): never {
    unsupported()
  }

  createOnInstanceCapabilityEvent<K>(): IDynamicListEventMultiplexer<{
    instance: ITerminalInstance
    data: K
  }> {
    return {
      event: Event.None,
      dispose() {}
    }
  }

  onAnyInstanceData = Event.None
  @Unsupported
  moveIntoNewEditor(): never {
    unsupported()
  }

  detachedInstances = []
  onAnyInstanceDataInput = Event.None
  onAnyInstanceIconChange = Event.None
  onAnyInstanceMaximumDimensionsChange = Event.None
  onAnyInstancePrimaryStatusChange = Event.None
  onAnyInstanceProcessIdReady = Event.None
  onAnyInstanceSelectionChange = Event.None
  onAnyInstanceTitleChange = Event.None
  createOnInstanceEvent<T>(
    getEvent: (instance: ITerminalInstance) => Event<T>
  ): DynamicListEventMultiplexer<ITerminalInstance, T> {
    return new DynamicListEventMultiplexer(
      this.instances,
      this.onDidCreateInstance,
      this.onDidDisposeInstance,
      getEvent
    )
  }

  @Unsupported
  createDetachedTerminal(): never {
    unsupported()
  }

  onDidChangeSelection = Event.None

  detachedXterms = []
  whenConnected = Promise.resolve()

  restoredGroupCount = 0
  @Unsupported
  createDetachedXterm(): never {
    unsupported()
  }

  instances = []
  @Unsupported
  get configHelper() {
    return unsupported()
  }

  @Unsupported
  revealActiveTerminal(): never {
    unsupported()
  }

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
  @Unsupported
  createTerminal(): never {
    unsupported()
  }

  @Unsupported
  getInstanceFromId(): never {
    unsupported()
  }

  @Unsupported
  getInstanceFromIndex(): never {
    unsupported()
  }

  getReconnectedTerminals = () => undefined
  @Unsupported
  getActiveOrCreateInstance(): never {
    unsupported()
  }

  @Unsupported
  moveToEditor(): never {
    unsupported()
  }

  @Unsupported
  moveToTerminalView(): never {
    unsupported()
  }

  @Unsupported
  getPrimaryBackend(): never {
    unsupported()
  }

  @Unsupported
  refreshActiveGroup(): never {
    unsupported()
  }

  registerProcessSupport = () => {}
  @Unsupported
  showProfileQuickPick(): never {
    unsupported()
  }

  @Unsupported
  setContainers(): never {
    unsupported()
  }

  @Unsupported
  requestStartExtensionTerminal(): never {
    unsupported()
  }

  @Unsupported
  isAttachedToTerminal(): never {
    unsupported()
  }

  @Unsupported
  getEditableData(): never {
    unsupported()
  }

  @Unsupported
  setEditable(): never {
    unsupported()
  }

  @Unsupported
  isEditable(): never {
    unsupported()
  }

  @Unsupported
  safeDisposeTerminal(): never {
    unsupported()
  }

  @Unsupported
  getDefaultInstanceHost(): never {
    unsupported()
  }

  @Unsupported
  getInstanceHost(): never {
    unsupported()
  }

  @Unsupported
  resolveLocation(): never {
    unsupported()
  }

  @Unsupported
  setNativeDelegate(): never {
    unsupported()
  }

  @Unsupported
  toggleEscapeSequenceLogging(): never {
    unsupported()
  }

  @Unsupported
  getEditingTerminal(): never {
    unsupported()
  }

  @Unsupported
  setEditingTerminal(): never {
    unsupported()
  }

  activeInstance = undefined
  onDidDisposeInstance = Event.None
  onDidFocusInstance = Event.None
  onDidChangeActiveInstance = Event.None
  onDidChangeInstances = Event.None
  onDidChangeInstanceCapability = Event.None
  @Unsupported
  setActiveInstance(): never {
    unsupported()
  }

  @Unsupported
  focusActiveInstance(): never {
    unsupported()
  }

  @Unsupported
  getInstanceFromResource(): never {
    unsupported()
  }
}
registerSingleton(ITerminalService, TerminalService, InstantiationType.Delayed)

class TerminalConfigurationService implements ITerminalConfigurationService {
  _serviceBrand: undefined
  @Unsupported
  get config() {
    return unsupported()
  }

  onConfigChanged = Event.None
  @Unsupported
  setPanelContainer(): never {
    unsupported()
  }

  @Unsupported
  configFontIsMonospace(): never {
    unsupported()
  }

  @Unsupported
  getFont(): never {
    unsupported()
  }
}
registerSingleton(
  ITerminalConfigurationService,
  TerminalConfigurationService,
  InstantiationType.Delayed
)
class TerminalEditorService implements ITerminalEditorService {
  _serviceBrand: undefined
  @Unsupported
  focusInstance(): never {
    unsupported()
  }

  instances = []
  @Unsupported
  openEditor(): never {
    unsupported()
  }

  @Unsupported
  detachActiveEditorInstance(): never {
    unsupported()
  }

  @Unsupported
  detachInstance(): never {
    unsupported()
  }

  @Unsupported
  splitInstance(): never {
    unsupported()
  }

  @Unsupported
  revealActiveEditor(): never {
    unsupported()
  }

  @Unsupported
  resolveResource(): never {
    unsupported()
  }

  @Unsupported
  reviveInput(): never {
    unsupported()
  }

  @Unsupported
  getInputFromResource(): never {
    unsupported()
  }

  activeInstance = undefined
  onDidDisposeInstance = Event.None
  onDidFocusInstance = Event.None
  onDidChangeActiveInstance = Event.None
  onDidChangeInstances = Event.None
  onDidChangeInstanceCapability = Event.None
  @Unsupported
  setActiveInstance(): never {
    unsupported()
  }

  @Unsupported
  focusActiveInstance(): never {
    unsupported()
  }

  @Unsupported
  getInstanceFromResource(): never {
    unsupported()
  }
}
registerSingleton(ITerminalEditorService, TerminalEditorService, InstantiationType.Delayed)

class TerminalGroupService implements ITerminalGroupService {
  _serviceBrand: undefined
  @Unsupported
  focusInstance(): never {
    unsupported()
  }

  lastAccessedMenu: 'inline-tab' | 'tab-list' = 'inline-tab'
  instances = []
  groups = []
  activeGroup = undefined
  activeGroupIndex = 0
  onDidChangeActiveGroup = Event.None
  onDidDisposeGroup = Event.None
  onDidChangeGroups = Event.None
  onDidShow = Event.None
  onDidChangePanelOrientation = Event.None
  @Unsupported
  createGroup(): never {
    unsupported()
  }

  @Unsupported
  getGroupForInstance(): never {
    unsupported()
  }

  @Unsupported
  moveGroup(): never {
    unsupported()
  }

  @Unsupported
  moveGroupToEnd(): never {
    unsupported()
  }

  @Unsupported
  moveInstance(): never {
    unsupported()
  }

  @Unsupported
  unsplitInstance(): never {
    unsupported()
  }

  @Unsupported
  joinInstances(): never {
    unsupported()
  }

  @Unsupported
  instanceIsSplit(): never {
    unsupported()
  }

  @Unsupported
  getGroupLabels(): never {
    unsupported()
  }

  @Unsupported
  setActiveGroupByIndex(): never {
    unsupported()
  }

  @Unsupported
  setActiveGroupToNext(): never {
    unsupported()
  }

  @Unsupported
  setActiveGroupToPrevious(): never {
    unsupported()
  }

  @Unsupported
  setActiveInstanceByIndex(): never {
    unsupported()
  }

  @Unsupported
  setContainer(): never {
    unsupported()
  }

  @Unsupported
  showPanel(): never {
    unsupported()
  }

  @Unsupported
  hidePanel(): never {
    unsupported()
  }

  @Unsupported
  focusTabs(): never {
    unsupported()
  }

  @Unsupported
  focusHover(): never {
    unsupported()
  }

  @Unsupported
  showTabs(): never {
    unsupported()
  }

  @Unsupported
  updateVisibility(): never {
    unsupported()
  }

  activeInstance: ITerminalInstance | undefined
  onDidDisposeInstance = Event.None
  onDidFocusInstance = Event.None
  onDidChangeActiveInstance = Event.None
  onDidChangeInstances = Event.None
  onDidChangeInstanceCapability = Event.None
  @Unsupported
  setActiveInstance(): never {
    unsupported()
  }

  @Unsupported
  focusActiveInstance(): never {
    unsupported()
  }

  @Unsupported
  getInstanceFromResource(): never {
    unsupported()
  }
}
registerSingleton(ITerminalGroupService, TerminalGroupService, InstantiationType.Delayed)
class TerminalInstanceService implements ITerminalInstanceService {
  _serviceBrand: undefined
  onDidRegisterBackend = Event.None
  getRegisteredBackends = () => [].values()
  onDidCreateInstance = Event.None
  @Unsupported
  convertProfileToShellLaunchConfig(): never {
    unsupported()
  }

  @Unsupported
  createInstance(): never {
    unsupported()
  }

  @Unsupported
  getBackend(): never {
    unsupported()
  }

  @Unsupported
  didRegisterBackend(): never {
    unsupported()
  }
}
registerSingleton(ITerminalInstanceService, TerminalInstanceService, InstantiationType.Delayed)
class TerminalProfileService implements ITerminalProfileService {
  _serviceBrand: undefined
  availableProfiles = []
  contributedProfiles = []
  profilesReady = Promise.resolve()
  @Unsupported
  getPlatformKey(): never {
    unsupported()
  }

  @Unsupported
  refreshAvailableProfiles(): never {
    unsupported()
  }

  getDefaultProfileName = () => undefined
  getDefaultProfile = () => undefined
  onDidChangeAvailableProfiles = Event.None
  @Unsupported
  getContributedDefaultProfile(): never {
    unsupported()
  }

  @Unsupported
  registerContributedProfile(): never {
    unsupported()
  }

  @Unsupported
  getContributedProfileProvider(): never {
    unsupported()
  }

  @Unsupported
  registerTerminalProfileProvider(): never {
    unsupported()
  }
}
registerSingleton(ITerminalProfileService, TerminalProfileService, InstantiationType.Delayed)

class TerminalLogService implements ITerminalLogService {
  _logBrand: undefined
  _serviceBrand: undefined
  onDidChangeLogLevel = Event.None
  @Unsupported
  getLevel(): never {
    unsupported()
  }

  @Unsupported
  setLevel(): never {
    unsupported()
  }

  @Unsupported
  trace(): never {
    unsupported()
  }

  @Unsupported
  debug(): never {
    unsupported()
  }

  @Unsupported
  info(): never {
    unsupported()
  }

  @Unsupported
  warn(): never {
    unsupported()
  }

  @Unsupported
  error(): never {
    unsupported()
  }

  @Unsupported
  flush(): never {
    unsupported()
  }

  @Unsupported
  dispose(): never {
    unsupported()
  }
}
registerSingleton(ITerminalLogService, TerminalLogService, InstantiationType.Delayed)

class TerminalLinkProviderService implements ITerminalLinkProviderService {
  _serviceBrand: undefined
  linkProviders = new Set([])
  onDidAddLinkProvider = Event.None
  onDidRemoveLinkProvider = Event.None
  @Unsupported
  registerLinkProvider(): never {
    unsupported()
  }
}
registerSingleton(
  ITerminalLinkProviderService,
  TerminalLinkProviderService,
  InstantiationType.Delayed
)

class TerminalContributionService implements ITerminalContributionService {
  _serviceBrand: undefined
  terminalProfiles = []
}
registerSingleton(
  ITerminalContributionService,
  TerminalContributionService,
  InstantiationType.Delayed
)

class TerminalProfileResolverService implements ITerminalProfileResolverService {
  _serviceBrand: undefined
  defaultProfileName: string | undefined
  @Unsupported
  resolveIcon(): never {
    unsupported()
  }

  @Unsupported
  resolveShellLaunchConfig(): never {
    unsupported()
  }

  getDefaultProfile = async () => ({
    profileName: 'bash',
    path: '/bin/bash',
    isDefault: true
  })

  @Unsupported
  getDefaultShell(): never {
    unsupported()
  }

  @Unsupported
  getDefaultShellArgs(): never {
    unsupported()
  }

  @Unsupported
  getDefaultIcon(): never {
    unsupported()
  }

  @Unsupported
  getEnvironment(): never {
    unsupported()
  }

  @Unsupported
  createProfileFromShellAndShellArgs(): never {
    unsupported()
  }
}
registerSingleton(
  ITerminalProfileResolverService,
  TerminalProfileResolverService,
  InstantiationType.Delayed
)

class EnvironmentVariableService implements IEnvironmentVariableService {
  _serviceBrand: undefined
  collections = new Map()
  @Unsupported
  get mergedCollection() {
    return unsupported()
  }

  onDidChangeCollections = Event.None
  set = () => {}
  delete = () => {}
}
registerSingleton(
  IEnvironmentVariableService,
  EnvironmentVariableService,
  InstantiationType.Delayed
)

class TerminalQuickFixService implements ITerminalQuickFixService {
  _serviceBrand: undefined
  onDidRegisterProvider = Event.None
  onDidRegisterCommandSelector = Event.None
  onDidUnregisterProvider = Event.None
  extensionQuickFixes = Promise.resolve([])
  providers = new Map()
  @Unsupported
  registerQuickFixProvider(): never {
    unsupported()
  }

  @Unsupported
  registerCommandSelector(): never {
    unsupported()
  }
}
registerSingleton(ITerminalQuickFixService, TerminalQuickFixService, InstantiationType.Delayed)

class UserDataSyncWorkbenchService implements IUserDataSyncWorkbenchService {
  _serviceBrand: undefined
  onDidTurnOnSync = Event.None
  enabled = false
  authenticationProviders = []
  all = []
  current = undefined
  accountStatus = AccountStatus.Unavailable
  onDidChangeAccountStatus = Event.None
  @Unsupported
  turnOn(): never {
    unsupported()
  }

  @Unsupported
  turnoff(): never {
    unsupported()
  }

  @Unsupported
  signIn(): never {
    unsupported()
  }

  @Unsupported
  resetSyncedData(): never {
    unsupported()
  }

  @Unsupported
  showSyncActivity(): never {
    unsupported()
  }

  @Unsupported
  syncNow(): never {
    unsupported()
  }

  @Unsupported
  synchroniseUserDataSyncStoreType(): never {
    unsupported()
  }

  @Unsupported
  showConflicts(): never {
    unsupported()
  }

  @Unsupported
  accept(): never {
    unsupported()
  }

  @Unsupported
  getAllLogResources(): never {
    unsupported()
  }

  @Unsupported
  downloadSyncActivity(): never {
    unsupported()
  }
}
registerSingleton(
  IUserDataSyncWorkbenchService,
  UserDataSyncWorkbenchService,
  InstantiationType.Delayed
)

class UserDataSyncEnablementService implements IUserDataSyncEnablementService {
  _serviceBrand: undefined
  onDidChangeEnablement = Event.None
  isEnabled = () => false
  canToggleEnablement = () => false
  @Unsupported
  setEnablement(): never {
    unsupported()
  }

  onDidChangeResourceEnablement = Event.None
  isResourceEnabled = () => false
  @Unsupported
  setResourceEnablement(): never {
    unsupported()
  }

  getResourceSyncStateVersion = () => undefined
}
registerSingleton(
  IUserDataSyncEnablementService,
  UserDataSyncEnablementService,
  InstantiationType.Delayed
)

class KeybindingEditingService implements IKeybindingEditingService {
  _serviceBrand: undefined
  @Unsupported
  addKeybinding(): never {
    unsupported()
  }

  @Unsupported
  editKeybinding(): never {
    unsupported()
  }

  @Unsupported
  removeKeybinding(): never {
    unsupported()
  }

  @Unsupported
  resetKeybinding(): never {
    unsupported()
  }
}
registerSingleton(IKeybindingEditingService, KeybindingEditingService, InstantiationType.Delayed)

class PreferencesSearchService implements IPreferencesSearchService {
  _serviceBrand: undefined
  @Unsupported
  getLocalSearchProvider(): never {
    unsupported()
  }

  @Unsupported
  getRemoteSearchProvider(): never {
    unsupported()
  }
}
registerSingleton(IPreferencesSearchService, PreferencesSearchService, InstantiationType.Delayed)

class NotebookService implements INotebookService {
  _serviceBrand: undefined
  @Unsupported
  createNotebookTextDocumentSnapshot(): never {
    unsupported()
  }

  @Unsupported
  restoreNotebookTextModelFromSnapshot(): never {
    unsupported()
  }

  @Unsupported
  hasSupportedNotebooks(): never {
    unsupported()
  }

  tryGetDataProviderSync = () => undefined
  canResolve = async () => false
  onAddViewType = Event.None
  onWillRemoveViewType = Event.None
  onDidChangeOutputRenderers = Event.None
  onWillAddNotebookDocument = Event.None
  onDidAddNotebookDocument = Event.None
  onWillRemoveNotebookDocument = Event.None
  onDidRemoveNotebookDocument = Event.None
  @Unsupported
  registerNotebookSerializer(): never {
    unsupported()
  }

  @Unsupported
  withNotebookDataProvider(): never {
    unsupported()
  }

  @Unsupported
  getOutputMimeTypeInfo(): never {
    unsupported()
  }

  getViewTypeProvider = () => undefined
  getRendererInfo = () => undefined
  getRenderers = () => []
  @Unsupported
  getStaticPreloads(): never {
    unsupported()
  }

  @Unsupported
  updateMimePreferredRenderer(): never {
    unsupported()
  }

  @Unsupported
  saveMimeDisplayOrder(): never {
    unsupported()
  }

  @Unsupported
  createNotebookTextModel(): never {
    unsupported()
  }

  getNotebookTextModel = () => undefined
  @Unsupported
  getNotebookTextModels(): never {
    unsupported()
  }

  listNotebookDocuments = () => []
  @Unsupported
  registerContributedNotebookType(): never {
    unsupported()
  }

  @Unsupported
  getContributedNotebookType(): never {
    unsupported()
  }

  getContributedNotebookTypes = () => []
  getNotebookProviderResourceRoots = () => []
  @Unsupported
  setToCopy(): never {
    unsupported()
  }

  @Unsupported
  getToCopy(): never {
    unsupported()
  }

  @Unsupported
  clearEditorCache(): never {
    unsupported()
  }
}
registerSingleton(INotebookService, NotebookService, InstantiationType.Delayed)

class ReplaceService implements IReplaceService {
  _serviceBrand: undefined
  @Unsupported
  replace(): never {
    unsupported()
  }

  @Unsupported
  openReplacePreview(): never {
    unsupported()
  }

  @Unsupported
  updateReplacePreview(): never {
    unsupported()
  }
}
registerSingleton(IReplaceService, ReplaceService, InstantiationType.Delayed)

class SearchHistoryService implements ISearchHistoryService {
  _serviceBrand: undefined
  onDidClearHistory = Event.None
  @Unsupported
  clearHistory(): never {
    unsupported()
  }

  @Unsupported
  load(): never {
    unsupported()
  }

  @Unsupported
  save(): never {
    unsupported()
  }
}
registerSingleton(ISearchHistoryService, SearchHistoryService, InstantiationType.Delayed)

class NotebookEditorService implements INotebookEditorService {
  _serviceBrand: undefined
  @Unsupported
  updateReplContextKey(): never {
    unsupported()
  }

  @Unsupported
  retrieveWidget(): never {
    unsupported()
  }

  retrieveExistingWidgetFromURI = () => undefined
  retrieveAllExistingWidgets = () => []
  onDidAddNotebookEditor = Event.None
  onDidRemoveNotebookEditor = Event.None
  @Unsupported
  addNotebookEditor(): never {
    unsupported()
  }

  @Unsupported
  removeNotebookEditor(): never {
    unsupported()
  }

  getNotebookEditor = () => undefined
  listNotebookEditors = () => []
}
registerSingleton(INotebookEditorService, NotebookEditorService, InstantiationType.Delayed)

class SearchWorkbenchService implements ISearchViewModelWorkbenchService {
  _serviceBrand: undefined
  @Unsupported
  get searchModel() {
    return unsupported()
  }
}
registerSingleton(
  ISearchViewModelWorkbenchService,
  SearchWorkbenchService,
  InstantiationType.Delayed
)

class NotebookEditorModelResolverService implements INotebookEditorModelResolverService {
  _serviceBrand: undefined
  @Unsupported
  createUntitledNotebookTextModel(): never {
    unsupported()
  }

  onDidSaveNotebook = Event.None
  onDidChangeDirty = Event.None
  onWillFailWithConflict = Event.None
  @Unsupported
  isDirty(): never {
    unsupported()
  }

  @Unsupported
  resolve(): never {
    unsupported()
  }
}
registerSingleton(
  INotebookEditorModelResolverService,
  NotebookEditorModelResolverService,
  InstantiationType.Delayed
)

class WorkingCopyEditorService implements IWorkingCopyEditorService {
  _serviceBrand: undefined
  onDidRegisterHandler = Event.None
  registerHandler = () => Disposable.None
  findEditor = () => undefined
}
registerSingleton(IWorkingCopyEditorService, WorkingCopyEditorService, InstantiationType.Delayed)
class UserActivityService implements IUserActivityService {
  _serviceBrand: undefined
  isActive = false
  onDidChangeIsActive = Event.None
  @Unsupported
  markActive(): never {
    unsupported()
  }
}
registerSingleton(IUserActivityService, UserActivityService, InstantiationType.Delayed)
class CanonicalUriService implements ICanonicalUriService {
  _serviceBrand: undefined
  @Unsupported
  registerCanonicalUriProvider(): never {
    unsupported()
  }
}
registerSingleton(ICanonicalUriService, CanonicalUriService, InstantiationType.Delayed)
class ExtensionStatusBarItemService implements IExtensionStatusBarItemService {
  _serviceBrand: undefined
  onDidChange = Event.None
  setOrUpdateEntry(): StatusBarUpdateKind {
    // ignore
    return StatusBarUpdateKind.DidUpdate
  }

  unsetEntry(): void {}

  getEntries(): Iterable<ExtensionStatusBarEntry> {
    return []
  }
}
registerSingleton(
  IExtensionStatusBarItemService,
  ExtensionStatusBarItemService,
  InstantiationType.Delayed
)
class WorkbenchAssignmentService implements IWorkbenchAssignmentService {
  _serviceBrand: undefined
  getCurrentExperiments = async () => []
  getTreatment = async () => undefined
}
registerSingleton(
  IWorkbenchAssignmentService,
  WorkbenchAssignmentService,
  InstantiationType.Delayed
)

class ChatService implements IChatService {
  _serviceBrand: undefined
  @Unsupported
  setChatSessionTitle(): never {
    unsupported()
  }

  @Unsupported
  adoptRequest(): never {
    unsupported()
  }

  isEnabled = () => false
  @Unsupported
  resendRequest(): never {
    unsupported()
  }

  @Unsupported
  clearAllHistoryEntries(): never {
    unsupported()
  }

  onDidSubmitAgent = Event.None
  hasSessions = () => false
  onDidDisposeSession = Event.None
  transferredSessionData = undefined
  onDidSubmitSlashCommand = Event.None
  getSessionId = () => undefined
  transferredSessionId = undefined
  @Unsupported
  transferChatSession(): never {
    unsupported()
  }

  @Unsupported
  registerSlashCommandProvider(): never {
    unsupported()
  }

  getProviderInfos = () => []
  @Unsupported
  startSession(): never {
    unsupported()
  }

  getSession = () => undefined
  getOrRestoreSession = () => undefined
  loadSessionFromContent = () => undefined
  @Unsupported
  sendRequest(): never {
    unsupported()
  }

  @Unsupported
  removeRequest(): never {
    unsupported()
  }

  @Unsupported
  cancelCurrentRequestForSession(): never {
    unsupported()
  }

  @Unsupported
  getSlashCommands(): never {
    unsupported()
  }

  @Unsupported
  clearSession(): never {
    unsupported()
  }

  @Unsupported
  addRequest(): never {
    unsupported()
  }

  @Unsupported
  addCompleteRequest(): never {
    unsupported()
  }

  @Unsupported
  sendRequestToProvider(): never {
    unsupported()
  }

  getHistory = () => []
  @Unsupported
  removeHistoryEntry(): never {
    unsupported()
  }

  onDidPerformUserAction = Event.None
  @Unsupported
  notifyUserAction(): never {
    unsupported()
  }
}
registerSingleton(IChatService, ChatService, InstantiationType.Delayed)

class LanguageModelStatsService implements ILanguageModelStatsService {
  _serviceBrand: undefined
  @Unsupported
  update(): never {
    unsupported()
  }
}
registerSingleton(ILanguageModelStatsService, LanguageModelStatsService, InstantiationType.Delayed)

class QuickChatService implements IQuickChatService {
  focused = false
  _serviceBrand: undefined
  onDidClose = Event.None
  enabled = false
  @Unsupported
  toggle(): never {
    unsupported()
  }

  @Unsupported
  focus(): never {
    unsupported()
  }

  @Unsupported
  open(): never {
    unsupported()
  }

  @Unsupported
  close(): never {
    unsupported()
  }

  @Unsupported
  openInChatView(): never {
    unsupported()
  }
}
registerSingleton(IQuickChatService, QuickChatService, InstantiationType.Delayed)

class QuickChatAgentService implements IChatAgentService {
  _serviceBrand = undefined
  @Unsupported
  registerChatParticipantDetectionProvider(): never {
    unsupported()
  }

  @Unsupported
  detectAgentOrCommand(): never {
    unsupported()
  }

  hasChatParticipantDetectionProviders = () => false
  @Unsupported
  getChatTitle(): never {
    unsupported()
  }

  agentHasDupeName = () => false
  @Unsupported
  registerAgentCompletionProvider(): never {
    unsupported()
  }

  @Unsupported
  getAgentCompletionItems(): never {
    unsupported()
  }

  @Unsupported
  getAgentByFullyQualifiedId(): never {
    unsupported()
  }

  getContributedDefaultAgent = () => undefined
  @Unsupported
  registerAgentImplementation(): never {
    unsupported()
  }

  @Unsupported
  registerDynamicAgent(): never {
    unsupported()
  }

  getActivatedAgents = () => []
  getAgentsByName = () => []
  @Unsupported
  getFollowups(): never {
    unsupported()
  }

  @Unsupported
  getDefaultAgent(): never {
    unsupported()
  }

  @Unsupported
  getSecondaryAgent(): never {
    unsupported()
  }

  @Unsupported
  updateAgent(): never {
    unsupported()
  }

  onDidChangeAgents = Event.None
  @Unsupported
  registerAgentData(): never {
    unsupported()
  }

  @Unsupported
  registerAgentCallback(): never {
    unsupported()
  }

  @Unsupported
  registerAgent(): never {
    unsupported()
  }

  @Unsupported
  invokeAgent(): never {
    unsupported()
  }

  @Unsupported
  getAgents(): never {
    unsupported()
  }

  @Unsupported
  getAgent(): never {
    unsupported()
  }

  @Unsupported
  hasAgent(): never {
    unsupported()
  }
}
registerSingleton(IChatAgentService, QuickChatAgentService, InstantiationType.Delayed)

class ChatAgentNameService implements IChatAgentNameService {
  _serviceBrand: undefined
  getAgentNameRestriction(): boolean {
    return true
  }
}
registerSingleton(IChatAgentNameService, ChatAgentNameService, InstantiationType.Delayed)
class EmbedderTerminalService implements IEmbedderTerminalService {
  _serviceBrand: undefined
  onDidCreateTerminal = Event.None
  @Unsupported
  createTerminal(): never {
    unsupported()
  }
}
registerSingleton(IEmbedderTerminalService, EmbedderTerminalService, InstantiationType.Delayed)

class CustomEditorService implements ICustomEditorService {
  _serviceBrand: undefined
  @Unsupported
  get models() {
    return unsupported()
  }

  @Unsupported
  getCustomEditor(): never {
    unsupported()
  }

  @Unsupported
  getAllCustomEditors(): never {
    unsupported()
  }

  @Unsupported
  getContributedCustomEditors(): never {
    unsupported()
  }

  @Unsupported
  getUserConfiguredCustomEditors(): never {
    unsupported()
  }

  registerCustomEditorCapabilities = () => Disposable.None
  getCustomEditorCapabilities = () => undefined
}
registerSingleton(ICustomEditorService, CustomEditorService, InstantiationType.Delayed)

class WebviewService implements IWebviewService {
  _serviceBrand: undefined
  activeWebview: IWebview | undefined
  webviews = []
  onDidChangeActiveWebview = Event.None
  @Unsupported
  createWebviewElement(): never {
    unsupported()
  }

  @Unsupported
  createWebviewOverlay(): never {
    unsupported()
  }
}
registerSingleton(IWebviewService, WebviewService, InstantiationType.Delayed)

class WebviewViewService implements IWebviewViewService {
  _serviceBrand: undefined
  onNewResolverRegistered = Event.None
  @Unsupported
  register(): never {
    unsupported()
  }

  @Unsupported
  resolve(): never {
    unsupported()
  }
}
registerSingleton(IWebviewViewService, WebviewViewService, InstantiationType.Delayed)

class LocaleService implements ILocaleService {
  _serviceBrand: undefined
  @Unsupported
  setLocale(): never {
    unsupported()
  }

  clearLocalePreference() {
    return Promise.resolve()
  }
}
registerSingleton(ILocaleService, LocaleService, InstantiationType.Delayed)

class WebviewWorkbenchService implements IWebviewWorkbenchService {
  _serviceBrand: undefined
  @Unsupported
  get iconManager() {
    return unsupported()
  }

  onDidChangeActiveWebviewEditor = Event.None
  @Unsupported
  openWebview(): never {
    unsupported()
  }

  @Unsupported
  openRevivedWebview(): never {
    unsupported()
  }

  @Unsupported
  revealWebview(): never {
    unsupported()
  }

  registerResolver = () => Disposable.None
  @Unsupported
  shouldPersist(): never {
    unsupported()
  }

  @Unsupported
  resolveWebview(): never {
    unsupported()
  }
}
registerSingleton(IWebviewWorkbenchService, WebviewWorkbenchService, InstantiationType.Delayed)

class RemoteAuthorityResolverService implements IRemoteAuthorityResolverService {
  _serviceBrand: undefined
  onDidChangeConnectionData = Event.None
  @Unsupported
  resolveAuthority(): never {
    unsupported()
  }

  @Unsupported
  getConnectionData(): never {
    unsupported()
  }

  @Unsupported
  getCanonicalURI(): never {
    unsupported()
  }

  @Unsupported
  _clearResolvedAuthority(): never {
    unsupported()
  }

  @Unsupported
  _setResolvedAuthority(): never {
    unsupported()
  }

  @Unsupported
  _setResolvedAuthorityError(): never {
    unsupported()
  }

  @Unsupported
  _setAuthorityConnectionToken(): never {
    unsupported()
  }

  @Unsupported
  _setCanonicalURIProvider(): never {
    unsupported()
  }
}
registerSingleton(
  IRemoteAuthorityResolverService,
  RemoteAuthorityResolverService,
  InstantiationType.Delayed
)

class ExternalUriOpenerService implements IExternalUriOpenerService {
  _serviceBrand: undefined
  registerExternalOpenerProvider = () => Disposable.None
  getOpener = async () => undefined
}
registerSingleton(IExternalUriOpenerService, ExternalUriOpenerService, InstantiationType.Delayed)

class AccessibleViewService implements IAccessibleViewService {
  _serviceBrand: undefined
  @Unsupported
  configureKeybindings(): never {
    unsupported()
  }

  @Unsupported
  openHelpLink(): never {
    unsupported()
  }

  @Unsupported
  navigateToCodeBlock(): never {
    unsupported()
  }

  getCodeBlockContext = () => undefined
  @Unsupported
  showLastProvider(): never {
    unsupported()
  }

  @Unsupported
  showAccessibleViewHelp(): never {
    unsupported()
  }

  @Unsupported
  goToSymbol(): never {
    unsupported()
  }

  @Unsupported
  disableHint(): never {
    unsupported()
  }

  @Unsupported
  next(): never {
    unsupported()
  }

  @Unsupported
  previous(): never {
    unsupported()
  }

  @Unsupported
  getOpenAriaHint(): never {
    unsupported()
  }

  @Unsupported
  show(): never {
    unsupported()
  }

  @Unsupported
  registerProvider(): never {
    unsupported()
  }

  @Unsupported
  getPosition(): never {
    unsupported()
  }

  @Unsupported
  setPosition(): never {
    unsupported()
  }

  @Unsupported
  getLastPosition(): never {
    unsupported()
  }
}
registerSingleton(IAccessibleViewService, AccessibleViewService, InstantiationType.Delayed)

class AccessibleViewInformationService implements IAccessibleViewInformationService {
  _serviceBrand: undefined
  hasShownAccessibleView = () => false
}
registerSingleton(
  IAccessibleViewInformationService,
  AccessibleViewInformationService,
  InstantiationType.Delayed
)

class WorkbenchExtensionManagementService implements IWorkbenchExtensionManagementService {
  _serviceBrand: undefined
  onProfileAwareDidInstallExtensions = Event.None
  onProfileAwareDidUninstallExtension = Event.None
  onProfileAwareDidUpdateExtensionMetadata = Event.None
  @Unsupported
  uninstallExtensions(): never {
    unsupported()
  }

  @Unsupported
  resetPinnedStateForAllUserExtensions(): never {
    unsupported()
  }

  getInstalledWorkspaceExtensionLocations = () => []
  onDidEnableExtensions = Event.None
  isWorkspaceExtensionsSupported = () => false
  getExtensions = async () => []
  getInstalledWorkspaceExtensions = async () => []
  @Unsupported
  installResourceExtension(): never {
    unsupported()
  }

  toggleAppliationScope = async (extension: ILocalExtension) => extension
  onInstallExtension = Event.None
  onDidInstallExtensions = Event.None
  onUninstallExtension = Event.None
  onDidUninstallExtension = Event.None
  onDidChangeProfile = Event.None
  @Unsupported
  installVSIX(): never {
    unsupported()
  }

  @Unsupported
  installFromLocation(): never {
    unsupported()
  }

  @Unsupported
  updateFromGallery(): never {
    unsupported()
  }

  onDidUpdateExtensionMetadata = Event.None
  @Unsupported
  zip(): never {
    unsupported()
  }

  @Unsupported
  unzip(): never {
    unsupported()
  }

  @Unsupported
  getManifest(): never {
    unsupported()
  }

  @Unsupported
  install(): never {
    unsupported()
  }

  @Unsupported
  canInstall(): never {
    unsupported()
  }

  @Unsupported
  installFromGallery(): never {
    unsupported()
  }

  @Unsupported
  installGalleryExtensions(): never {
    unsupported()
  }

  @Unsupported
  installExtensionsFromProfile(): never {
    unsupported()
  }

  @Unsupported
  uninstall(): never {
    unsupported()
  }

  @Unsupported
  reinstallFromGallery(): never {
    unsupported()
  }

  getInstalled = async () => []
  @Unsupported
  getExtensionsControlManifest(): never {
    unsupported()
  }

  @Unsupported
  copyExtensions(): never {
    unsupported()
  }

  @Unsupported
  updateMetadata(): never {
    unsupported()
  }

  @Unsupported
  download(): never {
    unsupported()
  }

  @Unsupported
  registerParticipant(): never {
    unsupported()
  }

  @Unsupported
  getTargetPlatform(): never {
    unsupported()
  }

  @Unsupported
  cleanUp(): never {
    unsupported()
  }
}
registerSingleton(
  IWorkbenchExtensionManagementService,
  WorkbenchExtensionManagementService,
  InstantiationType.Delayed
)

class ExtensionManifestPropertiesService implements IExtensionManifestPropertiesService {
  _serviceBrand: undefined
  @Unsupported
  prefersExecuteOnUI(): never {
    unsupported()
  }

  @Unsupported
  prefersExecuteOnWorkspace(): never {
    unsupported()
  }

  @Unsupported
  prefersExecuteOnWeb(): never {
    unsupported()
  }

  @Unsupported
  canExecuteOnUI(): never {
    unsupported()
  }

  @Unsupported
  canExecuteOnWorkspace(): never {
    unsupported()
  }

  @Unsupported
  canExecuteOnWeb(): never {
    unsupported()
  }

  @Unsupported
  getExtensionKind(): never {
    unsupported()
  }

  @Unsupported
  getUserConfiguredExtensionKind(): never {
    unsupported()
  }

  @Unsupported
  getExtensionUntrustedWorkspaceSupportType(): never {
    unsupported()
  }

  @Unsupported
  getExtensionVirtualWorkspaceSupportType(): never {
    unsupported()
  }
}
registerSingleton(
  IExtensionManifestPropertiesService,
  ExtensionManifestPropertiesService,
  InstantiationType.Delayed
)

class WorkspaceTrustEnablementService implements IWorkspaceTrustEnablementService {
  _serviceBrand: undefined
  isWorkspaceTrustEnabled(): boolean {
    return false
  }
}
registerSingleton(
  IWorkspaceTrustEnablementService,
  WorkspaceTrustEnablementService,
  InstantiationType.Delayed
)

class RemoteExtensionsScannerService implements IRemoteExtensionsScannerService {
  _serviceBrand: undefined
  whenExtensionsReady(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async scanExtensions(): Promise<Readonly<IRelaxedExtensionDescription>[]> {
    return []
  }

  async scanSingleExtension(): Promise<Readonly<IRelaxedExtensionDescription> | null> {
    return null
  }
}
registerSingleton(
  IRemoteExtensionsScannerService,
  RemoteExtensionsScannerService,
  InstantiationType.Delayed
)

class URLService implements IURLService {
  _serviceBrand: undefined
  @Unsupported
  create(): never {
    unsupported()
  }

  open = async () => false
  @Unsupported
  registerHandler(): never {
    unsupported()
  }
}
registerSingleton(IURLService, URLService, InstantiationType.Delayed)

class RemoteSocketFactoryService implements IRemoteSocketFactoryService {
  _serviceBrand: undefined
  @Unsupported
  register(): never {
    unsupported()
  }

  @Unsupported
  connect(): never {
    unsupported()
  }
}
registerSingleton(
  IRemoteSocketFactoryService,
  RemoteSocketFactoryService,
  InstantiationType.Delayed
)

class QuickDiffService implements IQuickDiffService {
  _serviceBrand: undefined
  onDidChangeQuickDiffProviders = Event.None
  @Unsupported
  addQuickDiffProvider(): never {
    unsupported()
  }

  @Unsupported
  getQuickDiffs(): never {
    unsupported()
  }
}
registerSingleton(IQuickDiffService, QuickDiffService, InstantiationType.Delayed)

class SCMService implements ISCMService {
  _serviceBrand: undefined
  onDidChangeInputValueProviders = Event.None
  @Unsupported
  getDefaultInputValueProvider(): never {
    unsupported()
  }

  @Unsupported
  registerSCMInputValueProvider(): never {
    unsupported()
  }

  onDidAddRepository = Event.None
  onDidRemoveRepository = Event.None
  repositories = []
  repositoryCount = 0
  @Unsupported
  registerSCMProvider(): never {
    unsupported()
  }

  @Unsupported
  getRepository(): never {
    unsupported()
  }
}
registerSingleton(ISCMService, SCMService, InstantiationType.Delayed)

class DownloadService implements IDownloadService {
  _serviceBrand: undefined
  @Unsupported
  download(): never {
    unsupported()
  }
}
registerSingleton(IDownloadService, DownloadService, InstantiationType.Delayed)

class ExtensionUrlHandler implements IExtensionUrlHandler {
  _serviceBrand: undefined
  @Unsupported
  registerExtensionHandler(): never {
    unsupported()
  }

  @Unsupported
  unregisterExtensionHandler(): never {
    unsupported()
  }
}
registerSingleton(IExtensionUrlHandler, ExtensionUrlHandler, InstantiationType.Delayed)

class CommentService implements ICommentService {
  _serviceBrand: undefined
  lastActiveCommentcontroller = undefined

  @Unsupported
  get commentsModel() {
    return unsupported()
  }

  resourceHasCommentingRanges = () => false
  onDidChangeActiveEditingCommentThread = Event.None
  @Unsupported
  setActiveEditingCommentThread(): never {
    unsupported()
  }

  @Unsupported
  setActiveCommentAndThread(): never {
    unsupported()
  }

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
  @Unsupported
  setDocumentComments(): never {
    unsupported()
  }

  @Unsupported
  setWorkspaceComments(): never {
    unsupported()
  }

  @Unsupported
  removeWorkspaceComments(): never {
    unsupported()
  }

  @Unsupported
  registerCommentController(): never {
    unsupported()
  }

  unregisterCommentController = () => {}
  @Unsupported
  getCommentController(): never {
    unsupported()
  }

  @Unsupported
  createCommentThreadTemplate(): never {
    unsupported()
  }

  @Unsupported
  updateCommentThreadTemplate(): never {
    unsupported()
  }

  @Unsupported
  getCommentMenus(): never {
    unsupported()
  }

  @Unsupported
  updateComments(): never {
    unsupported()
  }

  @Unsupported
  updateNotebookComments(): never {
    unsupported()
  }

  @Unsupported
  disposeCommentThread(): never {
    unsupported()
  }

  getDocumentComments = async () => []
  getNotebookComments = async () => []
  @Unsupported
  updateCommentingRanges(): never {
    unsupported()
  }

  @Unsupported
  hasReactionHandler(): never {
    unsupported()
  }

  @Unsupported
  toggleReaction(): never {
    unsupported()
  }

  @Unsupported
  setActiveCommentThread(): never {
    unsupported()
  }

  @Unsupported
  setCurrentCommentThread(): never {
    unsupported()
  }

  @Unsupported
  enableCommenting(): never {
    unsupported()
  }

  @Unsupported
  registerContinueOnCommentProvider(): never {
    unsupported()
  }

  @Unsupported
  removeContinueOnComment(): never {
    unsupported()
  }
}
registerSingleton(ICommentService, CommentService, InstantiationType.Delayed)

class NotebookCellStatusBarService implements INotebookCellStatusBarService {
  _serviceBrand: undefined
  onDidChangeProviders = Event.None
  onDidChangeItems = Event.None
  @Unsupported
  registerCellStatusBarItemProvider(): never {
    unsupported()
  }

  @Unsupported
  getStatusBarItemsForCell(): never {
    unsupported()
  }
}
registerSingleton(
  INotebookCellStatusBarService,
  NotebookCellStatusBarService,
  InstantiationType.Delayed
)

class NotebookKernelService implements INotebookKernelService {
  _serviceBrand: undefined
  onDidNotebookVariablesUpdate = Event.None
  @Unsupported
  notifyVariablesChange(): never {
    unsupported()
  }

  onDidAddKernel = Event.None
  onDidRemoveKernel = Event.None
  onDidChangeSelectedNotebooks = Event.None
  onDidChangeNotebookAffinity = Event.None
  @Unsupported
  registerKernel(): never {
    unsupported()
  }

  @Unsupported
  getMatchingKernel(): never {
    unsupported()
  }

  @Unsupported
  getSelectedOrSuggestedKernel(): never {
    unsupported()
  }

  @Unsupported
  selectKernelForNotebook(): never {
    unsupported()
  }

  @Unsupported
  preselectKernelForNotebook(): never {
    unsupported()
  }

  @Unsupported
  updateKernelNotebookAffinity(): never {
    unsupported()
  }

  onDidChangeKernelDetectionTasks = Event.None
  @Unsupported
  registerNotebookKernelDetectionTask(): never {
    unsupported()
  }

  @Unsupported
  getKernelDetectionTasks(): never {
    unsupported()
  }

  onDidChangeSourceActions = Event.None
  @Unsupported
  getSourceActions(): never {
    unsupported()
  }

  @Unsupported
  getRunningSourceActions(): never {
    unsupported()
  }

  @Unsupported
  registerKernelSourceActionProvider(): never {
    unsupported()
  }

  @Unsupported
  getKernelSourceActions2(): never {
    unsupported()
  }
}
registerSingleton(INotebookKernelService, NotebookKernelService, InstantiationType.Delayed)

class NotebookRendererMessagingService implements INotebookRendererMessagingService {
  _serviceBrand: undefined
  onShouldPostMessage = Event.None
  @Unsupported
  prepare(): never {
    unsupported()
  }

  @Unsupported
  getScoped(): never {
    unsupported()
  }

  @Unsupported
  receiveMessage(): never {
    unsupported()
  }
}
registerSingleton(
  INotebookRendererMessagingService,
  NotebookRendererMessagingService,
  InstantiationType.Delayed
)

class InteractiveHistoryService implements IInteractiveHistoryService {
  _serviceBrand: undefined
  matchesCurrent = () => false
  @Unsupported
  addToHistory(): never {
    unsupported()
  }

  @Unsupported
  getPreviousValue(): never {
    unsupported()
  }

  @Unsupported
  getNextValue(): never {
    unsupported()
  }

  @Unsupported
  replaceLast(): never {
    unsupported()
  }

  @Unsupported
  clearHistory(): never {
    unsupported()
  }

  @Unsupported
  has(): never {
    unsupported()
  }
}
registerSingleton(IInteractiveHistoryService, InteractiveHistoryService, InstantiationType.Delayed)

class InteractiveDocumentService implements IInteractiveDocumentService {
  _serviceBrand: undefined
  onWillAddInteractiveDocument = Event.None
  onWillRemoveInteractiveDocument = Event.None
  @Unsupported
  willCreateInteractiveDocument(): never {
    unsupported()
  }

  @Unsupported
  willRemoveInteractiveDocument(): never {
    unsupported()
  }
}
registerSingleton(
  IInteractiveDocumentService,
  InteractiveDocumentService,
  InstantiationType.Delayed
)

class ActiveLanguagePackService implements IActiveLanguagePackService {
  readonly _serviceBrand: undefined
  async getExtensionIdProvidingCurrentLocale(): Promise<string | undefined> {
    return getExtensionIdProvidingCurrentLocale()
  }
}
registerSingleton(IActiveLanguagePackService, ActiveLanguagePackService, InstantiationType.Eager)

class RemoteUserDataProfilesService implements IRemoteUserDataProfilesService {
  _serviceBrand: undefined
  getRemoteProfiles = async () => []
  @Unsupported
  getRemoteProfile(): never {
    unsupported()
  }
}
registerSingleton(
  IRemoteUserDataProfilesService,
  RemoteUserDataProfilesService,
  InstantiationType.Eager
)

class ExtensionBisectService implements IExtensionBisectService {
  _serviceBrand: undefined
  isDisabledByBisect = () => false
  isActive = false
  disabledCount = 0
  @Unsupported
  start(): never {
    unsupported()
  }

  @Unsupported
  next(): never {
    unsupported()
  }

  @Unsupported
  reset(): never {
    unsupported()
  }
}
registerSingleton(IExtensionBisectService, ExtensionBisectService, InstantiationType.Eager)
class UserDataSyncAccountService implements IUserDataSyncAccountService {
  _serviceBrand: undefined

  readonly onTokenFailed = Event.None
  readonly account = undefined
  readonly onDidChangeAccount = Event.None
  updateAccount(): Promise<void> {
    return Promise.resolve()
  }
}
registerSingleton(IUserDataSyncAccountService, UserDataSyncAccountService, InstantiationType.Eager)

class ChatWidgetService implements IChatWidgetService {
  _serviceBrand: undefined
  getWidgetsByLocations = () => []
  onDidAddWidget = Event.None
  getAllWidgets = () => []
  getWidgetByLocation = () => []
  getWidgetBySessionId = () => undefined
  lastFocusedWidget = undefined
  @Unsupported
  revealViewForProvider(): never {
    unsupported()
  }

  @Unsupported
  getWidgetByInputUri(): never {
    unsupported()
  }
}
registerSingleton(IChatWidgetService, ChatWidgetService, InstantiationType.Delayed)

class RemoteExplorerService implements IRemoteExplorerService {
  onDidChangeHelpInformation = Event.None
  @Unsupported
  get helpInformation() {
    return unsupported()
  }

  _serviceBrand: undefined
  onDidChangeTargetType = Event.None
  targetType = []
  @Unsupported
  get tunnelModel() {
    return unsupported()
  }

  onDidChangeEditable = Event.None
  @Unsupported
  setEditable(): never {
    unsupported()
  }

  @Unsupported
  getEditableData(): never {
    unsupported()
  }

  @Unsupported
  forward(): never {
    unsupported()
  }

  @Unsupported
  close(): never {
    unsupported()
  }

  @Unsupported
  setTunnelInformation(): never {
    unsupported()
  }

  @Unsupported
  setCandidateFilter(): never {
    unsupported()
  }

  @Unsupported
  onFoundNewCandidates(): never {
    unsupported()
  }

  @Unsupported
  restore(): never {
    unsupported()
  }

  @Unsupported
  enablePortsFeatures(): never {
    unsupported()
  }

  onEnabledPortsFeatures = Event.None
  portsFeaturesEnabled = PortsEnablement.Disabled
  namedProcesses = new Map()
}
registerSingleton(IRemoteExplorerService, RemoteExplorerService, InstantiationType.Delayed)

class AuthenticationService implements IAuthenticationService {
  _serviceBrand: undefined
  getAccounts = async () => []
  onDidRegisterAuthenticationProvider = Event.None
  onDidUnregisterAuthenticationProvider = Event.None
  onDidChangeSessions = Event.None
  onDidChangeDeclaredProviders = Event.None
  declaredProviders = []
  @Unsupported
  registerDeclaredAuthenticationProvider(): never {
    unsupported()
  }

  @Unsupported
  unregisterDeclaredAuthenticationProvider(): never {
    unsupported()
  }

  isAuthenticationProviderRegistered = () => false
  @Unsupported
  registerAuthenticationProvider(): never {
    unsupported()
  }

  @Unsupported
  unregisterAuthenticationProvider(): never {
    unsupported()
  }

  getProviderIds = () => []
  @Unsupported
  getProvider(): never {
    unsupported()
  }

  @Unsupported
  getSessions(): never {
    unsupported()
  }

  @Unsupported
  createSession(): never {
    unsupported()
  }

  @Unsupported
  removeSession(): never {
    unsupported()
  }
}
registerSingleton(IAuthenticationService, AuthenticationService, InstantiationType.Delayed)

class AuthenticationAccessService implements IAuthenticationAccessService {
  _serviceBrand: undefined
  onDidChangeExtensionSessionAccess = Event.None
  isAccessAllowed = () => false
  readAllowedExtensions = () => []
  @Unsupported
  updateAllowedExtensions(): never {
    unsupported()
  }

  @Unsupported
  removeAllowedExtensions(): never {
    unsupported()
  }
}
registerSingleton(
  IAuthenticationAccessService,
  AuthenticationAccessService,
  InstantiationType.Delayed
)

class AuthenticationExtensionsService implements IAuthenticationExtensionsService {
  _serviceBrand: undefined
  onDidChangeAccountPreference = Event.None
  getAccountPreference = () => undefined
  @Unsupported
  updateAccountPreference(): never {
    unsupported()
  }

  @Unsupported
  removeAccountPreference(): never {
    unsupported()
  }

  @Unsupported
  updateSessionPreference(): never {
    unsupported()
  }

  getSessionPreference = () => undefined
  @Unsupported
  removeSessionPreference(): never {
    unsupported()
  }

  @Unsupported
  selectSession(): never {
    unsupported()
  }

  @Unsupported
  requestSessionAccess(): never {
    unsupported()
  }

  @Unsupported
  requestNewSession(): never {
    unsupported()
  }
}
registerSingleton(
  IAuthenticationExtensionsService,
  AuthenticationExtensionsService,
  InstantiationType.Delayed
)

class AuthenticationUsageService implements IAuthenticationUsageService {
  _serviceBrand: undefined
  @Unsupported
  initializeExtensionUsageCache(): never {
    unsupported()
  }

  extensionUsesAuth = async () => false
  @Unsupported
  readAccountUsages(): never {
    unsupported()
  }

  @Unsupported
  removeAccountUsage(): never {
    unsupported()
  }

  @Unsupported
  addAccountUsage(): never {
    unsupported()
  }
}
registerSingleton(
  IAuthenticationUsageService,
  AuthenticationUsageService,
  InstantiationType.Delayed
)

class TimelineService implements ITimelineService {
  _serviceBrand: undefined
  onDidChangeProviders = Event.None
  onDidChangeTimeline = Event.None
  onDidChangeUri = Event.None
  @Unsupported
  registerTimelineProvider(): never {
    unsupported()
  }

  @Unsupported
  unregisterTimelineProvider(): never {
    unsupported()
  }

  getSources = () => []
  @Unsupported
  getTimeline(): never {
    unsupported()
  }

  @Unsupported
  setUri(): never {
    unsupported()
  }
}
registerSingleton(ITimelineService, TimelineService, InstantiationType.Delayed)

class TestService implements ITestService {
  _serviceBrand: undefined
  getTestsRelatedToCode = async () => []
  getCodeRelatedToTest = async () => []
  registerExtHost = () => Disposable.None
  @Unsupported
  provideTestFollowups(): never {
    unsupported()
  }

  onDidCancelTestRun = Event.None
  @Unsupported
  get excluded() {
    return unsupported()
  }

  @Unsupported
  get collection() {
    return unsupported()
  }

  onWillProcessDiff = Event.None
  onDidProcessDiff = Event.None
  @Unsupported
  get showInlineOutput() {
    return unsupported()
  }

  @Unsupported
  registerTestController(): never {
    unsupported()
  }

  getTestController = () => undefined
  @Unsupported
  refreshTests(): never {
    unsupported()
  }

  @Unsupported
  cancelRefreshTests(): never {
    unsupported()
  }

  @Unsupported
  startContinuousRun(): never {
    unsupported()
  }

  @Unsupported
  runTests(): never {
    unsupported()
  }

  @Unsupported
  runResolvedTests(): never {
    unsupported()
  }

  @Unsupported
  syncTests(): never {
    unsupported()
  }

  @Unsupported
  cancelTestRun(): never {
    unsupported()
  }

  @Unsupported
  publishDiff(): never {
    unsupported()
  }
}
registerSingleton(ITestService, TestService, InstantiationType.Delayed)

class SecretStorageService implements ISecretStorageService {
  _serviceBrand: undefined
  onDidChangeSecret = Event.None
  type = 'in-memory' as const
  get = async () => undefined
  @Unsupported
  set(): never {
    unsupported()
  }

  @Unsupported
  delete(): never {
    unsupported()
  }
}
registerSingleton(ISecretStorageService, SecretStorageService, InstantiationType.Delayed)

class ShareService implements IShareService {
  _serviceBrand: undefined
  @Unsupported
  registerShareProvider(): never {
    unsupported()
  }

  getShareActions = () => []
  provideShare = async () => undefined
}
registerSingleton(IShareService, ShareService, InstantiationType.Delayed)

class UserDataProfileImportExportService implements IUserDataProfileImportExportService {
  _serviceBrand: undefined
  createProfileFromTemplate = async () => undefined
  resolveProfileTemplate = async () => null
  @Unsupported
  exportProfile2(): never {
    unsupported()
  }

  @Unsupported
  createFromProfile(): never {
    unsupported()
  }

  @Unsupported
  createProfile(): never {
    unsupported()
  }

  @Unsupported
  editProfile(): never {
    unsupported()
  }

  registerProfileContentHandler = () => Disposable.None
  unregisterProfileContentHandler = () => {}
  @Unsupported
  exportProfile(): never {
    unsupported()
  }

  @Unsupported
  importProfile(): never {
    unsupported()
  }

  @Unsupported
  showProfileContents(): never {
    unsupported()
  }

  @Unsupported
  createFromCurrentProfile(): never {
    unsupported()
  }

  @Unsupported
  createTroubleshootProfile(): never {
    unsupported()
  }

  @Unsupported
  setProfile(): never {
    unsupported()
  }
}
registerSingleton(
  IUserDataProfileImportExportService,
  UserDataProfileImportExportService,
  InstantiationType.Delayed
)

class WorkbenchIssueService implements IWorkbenchIssueService {
  @Unsupported
  registerIssueDataProvider(): never {
    unsupported()
  }

  _serviceBrand: undefined
  @Unsupported
  openReporter(): never {
    unsupported()
  }

  @Unsupported
  openProcessExplorer(): never {
    unsupported()
  }

  @Unsupported
  registerIssueUriRequestHandler(): never {
    unsupported()
  }
}
registerSingleton(IWorkbenchIssueService, WorkbenchIssueService, InstantiationType.Delayed)

class SCMViewService implements ISCMViewService {
  _serviceBrand: undefined
  @Unsupported
  get activeRepository() {
    return unsupported()
  }

  @Unsupported
  get menus() {
    return unsupported()
  }

  repositories = []
  onDidChangeRepositories = Event.None
  visibleRepositories = []
  onDidChangeVisibleRepositories = Event.None
  isVisible = () => false
  @Unsupported
  toggleVisibility(): never {
    unsupported()
  }

  @Unsupported
  toggleSortKey(): never {
    unsupported()
  }

  focusedRepository = undefined
  onDidFocusRepository = Event.None
  @Unsupported
  focus(): never {
    unsupported()
  }
}
registerSingleton(ISCMViewService, SCMViewService, InstantiationType.Delayed)

class NotebookExecutionStateService implements INotebookExecutionStateService {
  _serviceBrand: undefined
  getLastCompletedCellForNotebook = () => undefined

  onDidChangeExecution = Event.None
  onDidChangeLastRunFailState = Event.None
  @Unsupported
  forceCancelNotebookExecutions(): never {
    unsupported()
  }

  @Unsupported
  getCellExecutionsForNotebook(): never {
    unsupported()
  }

  @Unsupported
  getCellExecutionsByHandleForNotebook(): never {
    unsupported()
  }

  @Unsupported
  getCellExecution(): never {
    unsupported()
  }

  @Unsupported
  createCellExecution(): never {
    unsupported()
  }

  @Unsupported
  getExecution(): never {
    unsupported()
  }

  @Unsupported
  createExecution(): never {
    unsupported()
  }

  @Unsupported
  getLastFailedCellForNotebook(): never {
    unsupported()
  }
}
registerSingleton(
  INotebookExecutionStateService,
  NotebookExecutionStateService,
  InstantiationType.Delayed
)

class TestProfileService implements ITestProfileService {
  _serviceBrand: undefined
  getDefaultProfileForTest = () => undefined
  onDidChange = Event.None
  @Unsupported
  addProfile(): never {
    unsupported()
  }

  @Unsupported
  updateProfile(): never {
    unsupported()
  }

  @Unsupported
  removeProfile(): never {
    unsupported()
  }

  @Unsupported
  capabilitiesForTest(): never {
    unsupported()
  }

  @Unsupported
  configure(): never {
    unsupported()
  }

  all = () => []
  getGroupDefaultProfiles = () => []
  @Unsupported
  setGroupDefaultProfiles(): never {
    unsupported()
  }

  getControllerProfiles = () => []
}
registerSingleton(ITestProfileService, TestProfileService, InstantiationType.Delayed)

class EncryptionService implements IEncryptionService {
  @Unsupported
  setUsePlainTextEncryption(): never {
    unsupported()
  }

  @Unsupported
  getKeyStorageProvider(): never {
    unsupported()
  }

  _serviceBrand: undefined
  @Unsupported
  encrypt(): never {
    unsupported()
  }

  @Unsupported
  decrypt(): never {
    unsupported()
  }

  @Unsupported
  isEncryptionAvailable(): never {
    unsupported()
  }
}
registerSingleton(IEncryptionService, EncryptionService, InstantiationType.Delayed)

class TestResultService implements ITestResultService {
  _serviceBrand: undefined
  onResultsChanged = Event.None
  onTestChanged = Event.None
  results = []
  @Unsupported
  clear(): never {
    unsupported()
  }

  @Unsupported
  createLiveResult(): never {
    unsupported()
  }

  @Unsupported
  push(): never {
    unsupported()
  }

  getResult = () => undefined
  getStateById = () => undefined
}
registerSingleton(ITestResultService, TestResultService, InstantiationType.Delayed)

class TestResultStorage implements ITestResultStorage {
  _serviceBrand: undefined
  @Unsupported
  read(): never {
    unsupported()
  }

  @Unsupported
  persist(): never {
    unsupported()
  }
}
registerSingleton(ITestResultStorage, TestResultStorage, InstantiationType.Delayed)

class TestingDecorationsService implements ITestingDecorationsService {
  _serviceBrand: undefined
  @Unsupported
  updateDecorationsAlternateAction(): never {
    unsupported()
  }

  onDidChange = Event.None
  @Unsupported
  invalidateResultMessage(): never {
    unsupported()
  }

  @Unsupported
  syncDecorations(): never {
    unsupported()
  }

  @Unsupported
  getDecoratedTestPosition(): never {
    unsupported()
  }
}
registerSingleton(ITestingDecorationsService, TestingDecorationsService, InstantiationType.Delayed)

class UserDataInitializationService implements IUserDataInitializationService {
  _serviceBrand: undefined
  requiresInitialization = async () => false
  whenInitializationFinished = async () => {}
  initializeRequiredResources = async () => {}
  initializeInstalledExtensions = async () => {}
  initializeOtherResources = async () => {}
}
registerSingleton(
  IUserDataInitializationService,
  UserDataInitializationService,
  InstantiationType.Delayed
)

registerSingleton(IDiagnosticsService, NullDiagnosticsService, InstantiationType.Delayed)

class NotebookSearchService implements INotebookSearchService {
  notebookSearch() {
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
}
registerSingleton(INotebookSearchService, NotebookSearchService, InstantiationType.Delayed)

class LanguageModelsService implements ILanguageModelsService {
  _serviceBrand: undefined
  @Unsupported
  sendChatRequest(): never {
    unsupported()
  }

  @Unsupported
  selectLanguageModels(): never {
    unsupported()
  }

  @Unsupported
  computeTokenLength(): never {
    unsupported()
  }

  onDidChangeLanguageModels = Event.None
  getLanguageModelIds = () => []
  lookupLanguageModel = () => undefined
  @Unsupported
  registerLanguageModelChat(): never {
    unsupported()
  }

  @Unsupported
  makeLanguageModelChatRequest(): never {
    unsupported()
  }
}
registerSingleton(ILanguageModelsService, LanguageModelsService, InstantiationType.Delayed)

class ChatSlashCommandService implements IChatSlashCommandService {
  @Unsupported
  onDidChangeCommands(): never {
    unsupported()
  }

  @Unsupported
  registerSlashData(): never {
    unsupported()
  }

  @Unsupported
  registerSlashCallback(): never {
    unsupported()
  }

  @Unsupported
  registerSlashCommand(): never {
    unsupported()
  }

  @Unsupported
  executeCommand(): never {
    unsupported()
  }

  @Unsupported
  getCommands(): never {
    unsupported()
  }

  @Unsupported
  hasCommand(): never {
    unsupported()
  }

  _serviceBrand: undefined
}
registerSingleton(IChatSlashCommandService, ChatSlashCommandService, InstantiationType.Delayed)

class ChatVariablesService implements IChatVariablesService {
  _serviceBrand: undefined
  @Unsupported
  attachContext(): never {
    unsupported()
  }

  getVariable = () => undefined
  resolveVariable = async () => []
  @Unsupported
  getDynamicVariables(): never {
    unsupported()
  }

  @Unsupported
  getDynamicReferences(): never {
    unsupported()
  }

  @Unsupported
  registerVariable(): never {
    unsupported()
  }

  @Unsupported
  getVariables(): never {
    unsupported()
  }

  @Unsupported
  resolveVariables(): never {
    unsupported()
  }

  @Unsupported
  hasVariable(): never {
    unsupported()
  }
}
registerSingleton(IChatVariablesService, ChatVariablesService, InstantiationType.Delayed)

class AiRelatedInformationService implements IAiRelatedInformationService {
  isEnabled = () => false
  @Unsupported
  getRelatedInformation(): never {
    unsupported()
  }

  @Unsupported
  registerAiRelatedInformationProvider(): never {
    unsupported()
  }

  _serviceBrand: undefined
}
registerSingleton(
  IAiRelatedInformationService,
  AiRelatedInformationService,
  InstantiationType.Delayed
)

class AiEmbeddingVectorService implements IAiEmbeddingVectorService {
  _serviceBrand: undefined
  isEnabled = () => false
  @Unsupported
  getEmbeddingVector(): never {
    unsupported()
  }

  @Unsupported
  registerAiEmbeddingVectorProvider(): never {
    unsupported()
  }
}
registerSingleton(IAiEmbeddingVectorService, AiEmbeddingVectorService, InstantiationType.Delayed)

class SignService implements ISignService {
  _serviceBrand: undefined
  private static _nextId = 1

  async createNewMessage(value: string): Promise<IMessage> {
    const id = String(SignService._nextId++)
    return {
      id,
      data: value
    }
  }

  async validate(): Promise<boolean> {
    return true
  }

  async sign(value: string): Promise<string> {
    return value
  }
}
registerSingleton(ISignService, SignService, InstantiationType.Delayed)

class TestingContinuousRunService implements ITestingContinuousRunService {
  _serviceBrand: undefined
  @Unsupported
  isEnabledForProfile(): never {
    unsupported()
  }

  @Unsupported
  stopProfile(): never {
    unsupported()
  }

  lastRunProfileIds = new Set<number>()
  onDidChange = Event.None
  isSpecificallyEnabledFor = () => false
  isEnabledForAParentOf = () => false
  isEnabledForAChildOf = () => false
  isEnabled = () => false
  @Unsupported
  start(): never {
    unsupported()
  }

  @Unsupported
  stop(): never {
    unsupported()
  }
}
registerSingleton(
  ITestingContinuousRunService,
  TestingContinuousRunService,
  InstantiationType.Delayed
)

class TestExplorerFilterState implements ITestExplorerFilterState {
  _serviceBrand: undefined
  onDidSelectTestInExplorer = Event.None

  @Unsupported
  didSelectTestInExplorer(): never {
    unsupported()
  }

  @Unsupported
  get text() {
    return unsupported()
  }

  @Unsupported
  get reveal() {
    return unsupported()
  }

  onDidRequestInputFocus = Event.None
  @Unsupported
  get globList() {
    return unsupported()
  }

  @Unsupported
  get includeTags() {
    return unsupported()
  }

  @Unsupported
  get excludeTags() {
    return unsupported()
  }

  @Unsupported
  get fuzzy() {
    return unsupported()
  }

  @Unsupported
  focusInput(): never {
    unsupported()
  }

  @Unsupported
  setText(): never {
    unsupported()
  }

  isFilteringFor = () => false
  @Unsupported
  toggleFilteringFor(): never {
    unsupported()
  }
}
registerSingleton(ITestExplorerFilterState, TestExplorerFilterState, InstantiationType.Delayed)

class TestingPeekOpener implements ITestingPeekOpener {
  _serviceBrand: undefined
  @Unsupported
  get historyVisible() {
    return unsupported()
  }

  @Unsupported
  tryPeekFirstError(): never {
    unsupported()
  }

  @Unsupported
  peekUri(): never {
    unsupported()
  }

  @Unsupported
  openCurrentInEditor(): never {
    unsupported()
  }

  @Unsupported
  open(): never {
    unsupported()
  }

  @Unsupported
  closeAllPeeks(): never {
    unsupported()
  }
}
registerSingleton(ITestingPeekOpener, TestingPeekOpener, InstantiationType.Delayed)

class AuxiliaryWindowService implements IAuxiliaryWindowService {
  _serviceBrand: undefined
  getWindow = () => undefined
  onDidOpenAuxiliaryWindow = Event.None
  hasWindow = () => false
  @Unsupported
  open(): never {
    unsupported()
  }
}
registerSingleton(IAuxiliaryWindowService, AuxiliaryWindowService, InstantiationType.Delayed)

class SpeechService implements ISpeechService {
  _serviceBrand: undefined
  onDidStartTextToSpeechSession = Event.None
  onDidEndTextToSpeechSession = Event.None
  hasActiveTextToSpeechSession = false
  @Unsupported
  createTextToSpeechSession(): never {
    unsupported()
  }

  onDidChangeHasSpeechProvider = Event.None
  onDidStartSpeechToTextSession = Event.None
  onDidEndSpeechToTextSession = Event.None
  hasActiveSpeechToTextSession = false
  onDidStartKeywordRecognition = Event.None
  onDidEndKeywordRecognition = Event.None
  hasActiveKeywordRecognition = false
  @Unsupported
  recognizeKeyword(): never {
    unsupported()
  }

  onDidRegisterSpeechProvider = Event.None
  onDidUnregisterSpeechProvider = Event.None
  hasSpeechProvider = false
  @Unsupported
  registerSpeechProvider(): never {
    unsupported()
  }

  @Unsupported
  createSpeechToTextSession(): never {
    unsupported()
  }
}
registerSingleton(ISpeechService, SpeechService, InstantiationType.Delayed)

class TestCoverageService implements ITestCoverageService {
  _serviceBrand: undefined
  @Unsupported
  get showInline() {
    return unsupported()
  }

  @Unsupported
  get filterToTest() {
    return unsupported()
  }

  @Unsupported
  get selected() {
    return unsupported()
  }

  @Unsupported
  openCoverage(): never {
    unsupported()
  }

  @Unsupported
  closeCoverage(): never {
    unsupported()
  }
}
registerSingleton(ITestCoverageService, TestCoverageService, InstantiationType.Delayed)

class ChatAccessibilityService implements IChatAccessibilityService {
  _serviceBrand: undefined
  @Unsupported
  acceptRequest(): never {
    unsupported()
  }

  @Unsupported
  acceptResponse(): never {
    unsupported()
  }
}
registerSingleton(IChatAccessibilityService, ChatAccessibilityService, InstantiationType.Delayed)

class ChatWidgetHistoryService implements IChatWidgetHistoryService {
  _serviceBrand: undefined
  onDidClearHistory = Event.None
  @Unsupported
  clearHistory(): never {
    unsupported()
  }

  getHistory = () => []
  @Unsupported
  saveHistory(): never {
    unsupported()
  }
}
registerSingleton(IChatWidgetHistoryService, ChatWidgetHistoryService, InstantiationType.Delayed)

class ChatCodeBlockContextProviderService implements IChatCodeBlockContextProviderService {
  _serviceBrand: undefined
  providers = []
  registerProvider = () => Disposable.None
}
registerSingleton(
  IChatCodeBlockContextProviderService,
  ChatCodeBlockContextProviderService,
  InstantiationType.Delayed
)

class InlineChatSessionService implements IInlineChatSessionService {
  _serviceBrand: undefined
  onDidMoveSession = Event.None
  onDidMoveSessio = Event.None
  onDidStashSession = Event.None
  @Unsupported
  moveSession(): never {
    unsupported()
  }

  @Unsupported
  getCodeEditor(): never {
    unsupported()
  }

  @Unsupported
  stashSession(): never {
    unsupported()
  }

  onWillStartSession = Event.None
  onDidEndSession = Event.None
  @Unsupported
  createSession(): never {
    unsupported()
  }

  getSession = () => undefined
  @Unsupported
  releaseSession(): never {
    unsupported()
  }

  @Unsupported
  registerSessionKeyComputer(): never {
    unsupported()
  }

  @Unsupported
  recordings(): never {
    unsupported()
  }

  @Unsupported
  dispose(): never {
    unsupported()
  }
}
registerSingleton(IInlineChatSessionService, InlineChatSessionService, InstantiationType.Delayed)

class NotebookEditorWorkerService implements INotebookEditorWorkerService {
  _serviceBrand: undefined
  canComputeDiff = () => false
  @Unsupported
  computeDiff(): never {
    unsupported()
  }

  canPromptRecommendation = async () => false
}
registerSingleton(
  INotebookEditorWorkerService,
  NotebookEditorWorkerService,
  InstantiationType.Delayed
)

class NotebookKernelHistoryService implements INotebookKernelHistoryService {
  _serviceBrand: undefined
  @Unsupported
  getKernels(): never {
    unsupported()
  }

  @Unsupported
  addMostRecentKernel(): never {
    unsupported()
  }
}
registerSingleton(
  INotebookKernelHistoryService,
  NotebookKernelHistoryService,
  InstantiationType.Delayed
)

class NotebookExecutionService implements INotebookExecutionService {
  _serviceBrand: undefined
  @Unsupported
  executeNotebookCells(): never {
    unsupported()
  }

  @Unsupported
  cancelNotebookCells(): never {
    unsupported()
  }

  @Unsupported
  cancelNotebookCellHandles(): never {
    unsupported()
  }

  @Unsupported
  registerExecutionParticipant(): never {
    unsupported()
  }
}
registerSingleton(INotebookExecutionService, NotebookExecutionService, InstantiationType.Delayed)

class NotebookKeymapService implements INotebookKeymapService {
  _serviceBrand: undefined
}
registerSingleton(INotebookKeymapService, NotebookKeymapService, InstantiationType.Delayed)

class NotebookLoggingService implements INotebookLoggingService {
  _serviceBrand: undefined
  @Unsupported
  info(): never {
    unsupported()
  }

  @Unsupported
  debug(): never {
    unsupported()
  }

  @Unsupported
  warn(): never {
    unsupported()
  }

  @Unsupported
  error(): never {
    unsupported()
  }
}
registerSingleton(INotebookLoggingService, NotebookLoggingService, InstantiationType.Delayed)

class WalkthroughsService implements IWalkthroughsService {
  _serviceBrand: undefined
  onDidAddWalkthrough = Event.None
  onDidRemoveWalkthrough = Event.None
  onDidChangeWalkthrough = Event.None
  onDidProgressStep = Event.None
  @Unsupported
  getWalkthroughs(): never {
    unsupported()
  }

  @Unsupported
  getWalkthrough(): never {
    unsupported()
  }

  @Unsupported
  registerWalkthrough(): never {
    unsupported()
  }

  @Unsupported
  progressByEvent(): never {
    unsupported()
  }

  @Unsupported
  progressStep(): never {
    unsupported()
  }

  @Unsupported
  deprogressStep(): never {
    unsupported()
  }

  @Unsupported
  markWalkthroughOpened(): never {
    unsupported()
  }
}
registerSingleton(IWalkthroughsService, WalkthroughsService, InstantiationType.Delayed)

class UserDataSyncStoreManagementService implements IUserDataSyncStoreManagementService {
  _serviceBrand: undefined
  onDidChangeUserDataSyncStore = Event.None
  userDataSyncStore = undefined
  @Unsupported
  switch(): never {
    unsupported()
  }

  @Unsupported
  getPreviousUserDataSyncStore(): never {
    unsupported()
  }
}
registerSingleton(
  IUserDataSyncStoreManagementService,
  UserDataSyncStoreManagementService,
  InstantiationType.Delayed
)

class UserDataSyncStoreService implements IUserDataSyncStoreService {
  _serviceBrand: undefined
  onDidChangeDonotMakeRequestsUntil = Event.None
  donotMakeRequestsUntil = undefined
  onTokenFailed = Event.None
  onTokenSucceed = Event.None
  @Unsupported
  setAuthToken(): never {
    unsupported()
  }

  @Unsupported
  manifest(): never {
    unsupported()
  }

  @Unsupported
  readResource(): never {
    unsupported()
  }

  @Unsupported
  writeResource(): never {
    unsupported()
  }

  @Unsupported
  deleteResource(): never {
    unsupported()
  }

  @Unsupported
  getAllResourceRefs(): never {
    unsupported()
  }

  @Unsupported
  resolveResourceContent(): never {
    unsupported()
  }

  @Unsupported
  getAllCollections(): never {
    unsupported()
  }

  @Unsupported
  createCollection(): never {
    unsupported()
  }

  @Unsupported
  deleteCollection(): never {
    unsupported()
  }

  @Unsupported
  getActivityData(): never {
    unsupported()
  }

  @Unsupported
  clear(): never {
    unsupported()
  }
}
registerSingleton(IUserDataSyncStoreService, UserDataSyncStoreService, InstantiationType.Delayed)

class UserDataSyncLogService implements IUserDataSyncLogService {
  _serviceBrand: undefined
  onDidChangeLogLevel = Event.None
  @Unsupported
  getLevel(): never {
    unsupported()
  }

  @Unsupported
  setLevel(): never {
    unsupported()
  }

  @Unsupported
  trace(): never {
    unsupported()
  }

  @Unsupported
  debug(): never {
    unsupported()
  }

  @Unsupported
  info(): never {
    unsupported()
  }

  @Unsupported
  warn(): never {
    unsupported()
  }

  @Unsupported
  error(): never {
    unsupported()
  }

  @Unsupported
  flush(): never {
    unsupported()
  }

  @Unsupported
  dispose(): never {
    unsupported()
  }
}
registerSingleton(IUserDataSyncLogService, UserDataSyncLogService, InstantiationType.Delayed)

class UserDataSyncService implements IUserDataSyncService {
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
  @Unsupported
  createSyncTask(): never {
    unsupported()
  }

  @Unsupported
  createManualSyncTask(): never {
    unsupported()
  }

  @Unsupported
  resolveContent(): never {
    unsupported()
  }

  @Unsupported
  accept(): never {
    unsupported()
  }

  @Unsupported
  reset(): never {
    unsupported()
  }

  @Unsupported
  resetRemote(): never {
    unsupported()
  }

  @Unsupported
  cleanUpRemoteData(): never {
    unsupported()
  }

  @Unsupported
  resetLocal(): never {
    unsupported()
  }

  @Unsupported
  hasLocalData(): never {
    unsupported()
  }

  @Unsupported
  hasPreviouslySynced(): never {
    unsupported()
  }

  @Unsupported
  replace(): never {
    unsupported()
  }

  @Unsupported
  saveRemoteActivityData(): never {
    unsupported()
  }

  @Unsupported
  extractActivityData(): never {
    unsupported()
  }
}
registerSingleton(IUserDataSyncService, UserDataSyncService, InstantiationType.Delayed)

class UserDataSyncMachinesService implements IUserDataSyncMachinesService {
  _serviceBrand: undefined
  onDidChange = Event.None
  @Unsupported
  getMachines(): never {
    unsupported()
  }

  @Unsupported
  addCurrentMachine(): never {
    unsupported()
  }

  @Unsupported
  removeCurrentMachine(): never {
    unsupported()
  }

  @Unsupported
  renameMachine(): never {
    unsupported()
  }

  @Unsupported
  setEnablements(): never {
    unsupported()
  }
}
registerSingleton(
  IUserDataSyncMachinesService,
  UserDataSyncMachinesService,
  InstantiationType.Delayed
)

class UserDataSyncResourceProviderService implements IUserDataSyncResourceProviderService {
  _serviceBrand: undefined
  @Unsupported
  getRemoteSyncedProfiles(): never {
    unsupported()
  }

  @Unsupported
  getLocalSyncedProfiles(): never {
    unsupported()
  }

  @Unsupported
  getRemoteSyncResourceHandles(): never {
    unsupported()
  }

  @Unsupported
  getLocalSyncResourceHandles(): never {
    unsupported()
  }

  @Unsupported
  getAssociatedResources(): never {
    unsupported()
  }

  @Unsupported
  getMachineId(): never {
    unsupported()
  }

  @Unsupported
  getLocalSyncedMachines(): never {
    unsupported()
  }

  @Unsupported
  resolveContent(): never {
    unsupported()
  }

  @Unsupported
  resolveUserDataSyncResource(): never {
    unsupported()
  }
}
registerSingleton(
  IUserDataSyncResourceProviderService,
  UserDataSyncResourceProviderService,
  InstantiationType.Delayed
)

class UserDataSyncLocalStoreService implements IUserDataSyncLocalStoreService {
  _serviceBrand: undefined
  @Unsupported
  writeResource(): never {
    unsupported()
  }

  @Unsupported
  getAllResourceRefs(): never {
    unsupported()
  }

  @Unsupported
  resolveResourceContent(): never {
    unsupported()
  }
}
registerSingleton(
  IUserDataSyncLocalStoreService,
  UserDataSyncLocalStoreService,
  InstantiationType.Delayed
)

class UserDataSyncUtilService implements IUserDataSyncUtilService {
  _serviceBrand: undefined
  resolveDefaultCoreIgnoredSettings = async () => []
  @Unsupported
  resolveUserBindings(): never {
    unsupported()
  }

  @Unsupported
  resolveFormattingOptions(): never {
    unsupported()
  }

  @Unsupported
  resolveDefaultIgnoredSettings(): never {
    unsupported()
  }
}
registerSingleton(IUserDataSyncUtilService, UserDataSyncUtilService, InstantiationType.Delayed)

class UserDataProfileManagementService implements IUserDataProfileManagementService {
  _serviceBrand: undefined
  @Unsupported
  getDefaultProfileToUse(): never {
    unsupported()
  }

  @Unsupported
  createProfile(): never {
    unsupported()
  }

  @Unsupported
  createAndEnterProfile(): never {
    unsupported()
  }

  @Unsupported
  createAndEnterTransientProfile(): never {
    unsupported()
  }

  @Unsupported
  removeProfile(): never {
    unsupported()
  }

  @Unsupported
  updateProfile(): never {
    unsupported()
  }

  @Unsupported
  switchProfile(): never {
    unsupported()
  }

  @Unsupported
  getBuiltinProfileTemplates(): never {
    unsupported()
  }
}
registerSingleton(
  IUserDataProfileManagementService,
  UserDataProfileManagementService,
  InstantiationType.Delayed
)

class WorkingCopyHistoryService implements IWorkingCopyHistoryService {
  _serviceBrand: undefined
  onDidAddEntry = Event.None
  onDidChangeEntry = Event.None
  onDidReplaceEntry = Event.None
  onDidRemoveEntry = Event.None
  onDidMoveEntries = Event.None
  onDidRemoveEntries = Event.None
  @Unsupported
  addEntry(): never {
    unsupported()
  }

  @Unsupported
  updateEntry(): never {
    unsupported()
  }

  @Unsupported
  removeEntry(): never {
    unsupported()
  }

  @Unsupported
  moveEntries(): never {
    unsupported()
  }

  getEntries = async () => []
  getAll = async () => []
  @Unsupported
  removeAll(): never {
    unsupported()
  }
}
registerSingleton(IWorkingCopyHistoryService, WorkingCopyHistoryService, InstantiationType.Delayed)

class InlineChatSavingService implements IInlineChatSavingService {
  _serviceBrand: undefined
  @Unsupported
  markChanged(): never {
    unsupported()
  }
}
registerSingleton(IInlineChatSavingService, InlineChatSavingService, InstantiationType.Delayed)

class NotebookDocumentService implements INotebookDocumentService {
  _serviceBrand: undefined
  getNotebook = () => undefined
  @Unsupported
  addNotebookDocument(): never {
    unsupported()
  }

  @Unsupported
  removeNotebookDocument(): never {
    unsupported()
  }
}
registerSingleton(INotebookDocumentService, NotebookDocumentService, InstantiationType.Delayed)

class DebugVisualizerService implements IDebugVisualizerService {
  _serviceBrand: undefined
  @Unsupported
  registerTree(): never {
    unsupported()
  }

  @Unsupported
  getVisualizedNodeFor(): never {
    unsupported()
  }

  @Unsupported
  getVisualizedChildren(): never {
    unsupported()
  }

  @Unsupported
  editTreeItem(): never {
    unsupported()
  }

  @Unsupported
  getApplicableFor(): never {
    unsupported()
  }

  @Unsupported
  register(): never {
    unsupported()
  }
}
registerSingleton(IDebugVisualizerService, DebugVisualizerService, InstantiationType.Delayed)

class EditSessionsLogService implements IEditSessionsLogService {
  _serviceBrand: undefined
  onDidChangeLogLevel = Event.None
  @Unsupported
  getLevel(): never {
    unsupported()
  }

  @Unsupported
  setLevel(): never {
    unsupported()
  }

  @Unsupported
  trace(): never {
    unsupported()
  }

  @Unsupported
  debug(): never {
    unsupported()
  }

  @Unsupported
  info(): never {
    unsupported()
  }

  @Unsupported
  warn(): never {
    unsupported()
  }

  @Unsupported
  error(): never {
    unsupported()
  }

  @Unsupported
  flush(): never {
    unsupported()
  }

  @Unsupported
  dispose(): never {
    unsupported()
  }
}
registerSingleton(IEditSessionsLogService, EditSessionsLogService, InstantiationType.Delayed)

class EditSessionsWorkbenchService implements IEditSessionsStorageService {
  _serviceBrand: undefined
  SIZE_LIMIT = 0
  isSignedIn = false
  onDidSignIn = Event.None
  onDidSignOut = Event.None
  storeClient = undefined
  lastReadResources = new Map<SyncResource, { ref: string; content: string }>()
  lastWrittenResources = new Map<SyncResource, { ref: string; content: string }>()
  @Unsupported
  initialize(): never {
    unsupported()
  }

  @Unsupported
  read(): never {
    unsupported()
  }

  @Unsupported
  write(): never {
    unsupported()
  }

  @Unsupported
  delete(): never {
    unsupported()
  }

  @Unsupported
  list(): never {
    unsupported()
  }

  @Unsupported
  getMachineById(): never {
    unsupported()
  }
}
registerSingleton(
  IEditSessionsStorageService,
  EditSessionsWorkbenchService,
  InstantiationType.Delayed
)

class MultiDiffSourceResolverService implements IMultiDiffSourceResolverService {
  _serviceBrand: undefined
  registerResolver = () => Disposable.None
  resolve = async () => undefined
}
registerSingleton(
  IMultiDiffSourceResolverService,
  MultiDiffSourceResolverService,
  InstantiationType.Delayed
)

registerSingleton(IWorkspaceTagsService, NoOpWorkspaceTagsService, InstantiationType.Delayed)

class ExtensionFeaturesManagementService implements IExtensionFeaturesManagementService {
  _serviceBrand: undefined
  getAllAccessDataForExtension = () => new Map()

  onDidChangeEnablement = Event.None
  isEnabled = () => true
  @Unsupported
  setEnablement(): never {
    unsupported()
  }

  @Unsupported
  getEnablementData(): never {
    unsupported()
  }

  @Unsupported
  getAccess(): never {
    unsupported()
  }

  onDidChangeAccessData = Event.None
  getAccessData = () => undefined
  @Unsupported
  setStatus(): never {
    unsupported()
  }
}
registerSingleton(
  IExtensionFeaturesManagementService,
  ExtensionFeaturesManagementService,
  InstantiationType.Delayed
)

class EditorPaneService implements IEditorPaneService {
  _serviceBrand: undefined
  onWillInstantiateEditorPane = Event.None
  didInstantiateEditorPane = () => false
}
registerSingleton(IEditorPaneService, EditorPaneService, InstantiationType.Delayed)

class WorkspaceIdentityService implements IWorkspaceIdentityService {
  _serviceBrand: undefined
  @Unsupported
  matches(): never {
    unsupported()
  }

  @Unsupported
  getWorkspaceStateFolders(): never {
    unsupported()
  }
}
registerSingleton(IWorkspaceIdentityService, WorkspaceIdentityService, InstantiationType.Delayed)

class DefaultLogLevelsService implements IDefaultLogLevelsService {
  _serviceBrand: undefined
  onDidChangeDefaultLogLevels = Event.None
  getDefaultLogLevel = async () => LogLevel.Off
  @Unsupported
  getDefaultLogLevels(): never {
    unsupported()
  }

  @Unsupported
  setDefaultLogLevel(): never {
    unsupported()
  }

  @Unsupported
  migrateLogLevels(): never {
    unsupported()
  }
}
registerSingleton(IDefaultLogLevelsService, DefaultLogLevelsService, InstantiationType.Delayed)

class CustomEditorLabelService implements ICustomEditorLabelService {
  _serviceBrand: undefined
  onDidChange = Event.None
  getName = () => undefined
}
registerSingleton(ICustomEditorLabelService, CustomEditorLabelService, InstantiationType.Delayed)

class TroubleshootIssueService implements ITroubleshootIssueService {
  _serviceBrand: undefined
  isActive = () => false
  @Unsupported
  start(): never {
    unsupported()
  }

  @Unsupported
  resume(): never {
    unsupported()
  }

  @Unsupported
  stop(): never {
    unsupported()
  }
}
registerSingleton(ITroubleshootIssueService, TroubleshootIssueService, InstantiationType.Delayed)

class IntegrityService implements IIntegrityService {
  _serviceBrand: undefined
  async isPure(): Promise<IntegrityTestResult> {
    return {
      isPure: false,
      proof: []
    }
  }
}
registerSingleton(IIntegrityService, IntegrityService, InstantiationType.Delayed)

class TrustedDomainService implements ITrustedDomainService {
  _serviceBrand: undefined
  isValid(): boolean {
    return false
  }
}
registerSingleton(ITrustedDomainService, TrustedDomainService, InstantiationType.Delayed)

class LanguageModelToolsService implements ILanguageModelToolsService {
  _serviceBrand: undefined
  getTool = () => undefined
  getToolByName = () => undefined
  onDidChangeTools = Event.None
  @Unsupported
  registerToolData(): never {
    unsupported()
  }

  @Unsupported
  registerToolImplementation(): never {
    unsupported()
  }

  getTools = () => []
  @Unsupported
  invokeTool(): never {
    unsupported()
  }
}
registerSingleton(ILanguageModelToolsService, LanguageModelToolsService, InstantiationType.Delayed)

class IssueFormService implements IIssueFormService {
  _serviceBrand: undefined
  @Unsupported
  openReporter(): never {
    unsupported()
  }

  @Unsupported
  reloadWithExtensionsDisabled(): never {
    unsupported()
  }

  @Unsupported
  showConfirmCloseDialog(): never {
    unsupported()
  }

  @Unsupported
  showClipboardDialog(): never {
    unsupported()
  }

  @Unsupported
  sendReporterMenu(): never {
    unsupported()
  }

  @Unsupported
  closeReporter(): never {
    unsupported()
  }
}
registerSingleton(IIssueFormService, IssueFormService, InstantiationType.Delayed)

class CodeMapperService implements ICodeMapperService {
  _serviceBrand: undefined
  mapCodeFromResponse = async () => undefined

  @Unsupported
  registerCodeMapperProvider(): never {
    unsupported()
  }

  mapCode = async () => undefined
}
registerSingleton(ICodeMapperService, CodeMapperService, InstantiationType.Delayed)

class ChatEditingService implements IChatEditingService {
  _serviceBrand: undefined
  getOrRestoreEditingSession = async () => null
  hasRelatedFilesProviders = () => false
  @Unsupported
  registerRelatedFilesProvider() {
    return unsupported()
  }

  getRelatedFiles = async () => undefined

  onDidChangeEditingSession = Event.None

  @Unsupported
  get currentEditingSessionObs() {
    return unsupported()
  }

  currentAutoApplyOperation = null
  editingSessionFileLimit = 0

  @Unsupported
  triggerEditComputation(): never {
    unsupported()
  }

  getEditingSession = () => null

  @Unsupported
  createSnapshot(): never {
    unsupported()
  }

  @Unsupported
  getSnapshotUri(): never {
    unsupported()
  }

  @Unsupported
  restoreSnapshot(): never {
    unsupported()
  }

  onDidCreateEditingSession = Event.None
  currentEditingSession = null
  @Unsupported
  startOrContinueEditingSession(): never {
    unsupported()
  }
}
registerSingleton(IChatEditingService, ChatEditingService, InstantiationType.Delayed)

class ActionViewItemService implements IActionViewItemService {
  _serviceBrand: undefined
  onDidChange = Event.None
  @Unsupported
  register(): never {
    unsupported()
  }

  lookUp = () => undefined
}
registerSingleton(IActionViewItemService, ActionViewItemService, InstantiationType.Delayed)

class TreeSitterTokenizationFeature implements ITreeSitterTokenizationFeature {
  _serviceBrand: undefined
}
registerSingleton(
  ITreeSitterTokenizationFeature,
  TreeSitterTokenizationFeature,
  InstantiationType.Delayed
)

class LanguageModelIgnoredFilesService implements ILanguageModelIgnoredFilesService {
  _serviceBrand: undefined

  fileIsIgnored = async () => false

  @Unsupported
  registerIgnoredFileProvider(): never {
    unsupported()
  }
}
registerSingleton(
  ILanguageModelIgnoredFilesService,
  LanguageModelIgnoredFilesService,
  InstantiationType.Delayed
)

class AllowedExtensionsService implements IAllowedExtensionsService {
  _serviceBrand: undefined
  onDidChangeAllowedExtensions = Event.None
  isAllowed = (): true => true
}
registerSingleton(IAllowedExtensionsService, AllowedExtensionsService, InstantiationType.Delayed)

class ChatQuotasService implements IChatQuotasService {
  _serviceBrand: undefined

  onDidChangeQuotas = Event.None

  @Unsupported
  get quotas() {
    return unsupported()
  }

  @Unsupported
  acceptQuotas(): never {
    unsupported()
  }

  @Unsupported
  clearQuotas(): never {
    unsupported()
  }
}
registerSingleton(IChatQuotasService, ChatQuotasService, InstantiationType.Delayed)

class NotebookSynchronizerService implements INotebookSynchronizerService {
  _serviceBrand: undefined

  @Unsupported
  revert(): never {
    unsupported()
  }
}
registerSingleton(
  INotebookSynchronizerService,
  NotebookSynchronizerService,
  InstantiationType.Delayed
)

class NotebookOriginalCellModelFactory implements INotebookOriginalCellModelFactory {
  _serviceBrand: undefined

  @Unsupported
  getOrCreate(): never {
    unsupported()
  }
}
registerSingleton(
  INotebookOriginalCellModelFactory,
  NotebookOriginalCellModelFactory,
  InstantiationType.Delayed
)

class NotebookOriginalModelReferenceFactory implements INotebookOriginalModelReferenceFactory {
  _serviceBrand: undefined

  @Unsupported
  getOrCreate(): never {
    unsupported()
  }
}
registerSingleton(
  INotebookOriginalModelReferenceFactory,
  NotebookOriginalModelReferenceFactory,
  InstantiationType.Delayed
)

class NotebookModelSynchronizerFactory implements INotebookModelSynchronizerFactory {
  _serviceBrand: undefined

  @Unsupported
  getOrCreate(): never {
    unsupported()
  }
}
registerSingleton(
  INotebookModelSynchronizerFactory,
  NotebookModelSynchronizerFactory,
  InstantiationType.Delayed
)

class DirtyDiffModelService implements IDirtyDiffModelService {
  _serviceBrand: undefined
  getDirtyDiffModel = () => undefined
  getDiffModel = () => undefined
}
registerSingleton(IDirtyDiffModelService, DirtyDiffModelService, InstantiationType.Delayed)

class TerminalCompletionService implements ITerminalCompletionService {
  _serviceBrand: undefined

  @Unsupported
  get providers(): never {
    return unsupported()
  }

  @Unsupported
  registerTerminalCompletionProvider(): never {
    unsupported()
  }

  @Unsupported
  provideCompletions(): never {
    unsupported()
  }
}
registerSingleton(ITerminalCompletionService, TerminalCompletionService, InstantiationType.Delayed)
