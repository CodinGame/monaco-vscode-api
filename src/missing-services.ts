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
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService.service'
import { IModelService } from 'vs/editor/common/services/model.service'
import { ITreeViewsDnDService } from 'vs/editor/common/services/treeViewsDndService.service'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IAccessibleViewService } from 'vs/platform/accessibility/browser/accessibleView.service'
import { IActionViewItemService } from 'vs/platform/actions/browser/actionViewItemService.service'
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey.service'
import { IExtensionHostDebugService } from 'vs/platform/debug/common/extensionHostDebug.service'
import { NullDiagnosticsService } from 'vs/platform/diagnostics/common/diagnostics'
import { IDiagnosticsService } from 'vs/platform/diagnostics/common/diagnostics.service'
import { IFileDialogService } from 'vs/platform/dialogs/common/dialogs.service'
import { IDownloadService } from 'vs/platform/download/common/download.service'
import { IEncryptionService } from 'vs/platform/encryption/common/encryptionService.service'
import { IEnvironmentService } from 'vs/platform/environment/common/environment.service'
import type { AllowedExtensionsConfigValueType } from 'vs/platform/extensionManagement/common/extensionManagement'
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
  AbstractLoggerService,
  type ILogger,
  LogLevel,
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
import type { IMessage } from 'vs/platform/sign/common/sign'
import { ISignService } from 'vs/platform/sign/common/sign.service'
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
import { toUserDataProfile } from 'vs/platform/userDataProfile/common/userDataProfile'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile.service'
import { IUserDataProfileStorageService } from 'vs/platform/userDataProfile/common/userDataProfileStorageService.service'
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
import type { IViewContainerModel } from 'vs/workbench/common/views'
import { IViewDescriptorService } from 'vs/workbench/common/views.service'
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
import { ICodeMapperService } from 'vs/workbench/contrib/chat/common/chatCodeMapperService.service'
import { IChatEditingService } from 'vs/workbench/contrib/chat/common/chatEditingService.service'
import { IChatService } from 'vs/workbench/contrib/chat/common/chatService.service'
import { IChatSlashCommandService } from 'vs/workbench/contrib/chat/common/chatSlashCommands.service'
import { IChatVariablesService } from 'vs/workbench/contrib/chat/common/chatVariables.service'
import { IChatWidgetHistoryService } from 'vs/workbench/contrib/chat/common/chatWidgetHistoryService.service'
import { ILanguageModelIgnoredFilesService } from 'vs/workbench/contrib/chat/common/ignoredFiles.service'
import { ILanguageModelStatsService } from 'vs/workbench/contrib/chat/common/languageModelStats.service'
import { ILanguageModelToolsService } from 'vs/workbench/contrib/chat/common/languageModelToolsService.service'
import { ILanguageModelsService } from 'vs/workbench/contrib/chat/common/languageModels.service'
import { ICommentService } from 'vs/workbench/contrib/comments/browser/commentService.service'
import { ICustomEditorService } from 'vs/workbench/contrib/customEditor/common/customEditor.service'
import type {
  IAdapterManager,
  IDebugModel,
  IViewModel
} from 'vs/workbench/contrib/debug/common/debug'
import { IDebugService } from 'vs/workbench/contrib/debug/common/debug.service'
import { IDebugVisualizerService } from 'vs/workbench/contrib/debug/common/debugVisualizers.service'
import type { SyncResource } from 'vs/workbench/contrib/editSessions/common/editSessions'
import {
  IEditSessionsLogService,
  IEditSessionsStorageService
} from 'vs/workbench/contrib/editSessions/common/editSessions.service'
import { IExtensionsWorkbenchService } from 'vs/workbench/contrib/extensions/common/extensions.service'
import { IExternalUriOpenerService } from 'vs/workbench/contrib/externalUriOpener/common/externalUriOpenerService.service'
import { IExplorerService } from 'vs/workbench/contrib/files/browser/files.service'
import { IInlineChatSessionService } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionService.service'
import { IInteractiveDocumentService } from 'vs/workbench/contrib/interactive/browser/interactiveDocumentService.service'
import { IInteractiveHistoryService } from 'vs/workbench/contrib/interactive/browser/interactiveHistoryService.service'
import { ITroubleshootIssueService } from 'vs/workbench/contrib/issue/browser/issueTroubleshoot.service'
import {
  IIssueFormService,
  IWorkbenchIssueService
} from 'vs/workbench/contrib/issue/common/issue.service'
import { IDefaultLogLevelsService } from 'vs/workbench/contrib/logs/common/defaultLogLevels.service'
import { IMultiDiffSourceResolverService } from 'vs/workbench/contrib/multiDiffEditor/browser/multiDiffSourceResolverService.service'
import { INotebookOriginalCellModelFactory } from 'vs/workbench/contrib/notebook/browser/diff/inlineDiff/notebookOriginalCellModelFactory.service'
import { INotebookOriginalModelReferenceFactory } from 'vs/workbench/contrib/notebook/browser/diff/inlineDiff/notebookOriginalModelRefFactory.service'
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
import { IPreferencesSearchService } from 'vs/workbench/contrib/preferences/common/preferences.service'
import { IQuickDiffModelService } from 'vs/workbench/contrib/scm/browser/quickDiffModel.service'
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
  type ITerminalInstance,
  TerminalConnectionState
} from 'vs/workbench/contrib/terminal/browser/terminal'
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
import { ITerminalCompletionService } from 'vs/workbench/contrib/terminalContrib/suggest/browser/terminalCompletionService.service'
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
import { ITrustedDomainService } from 'vs/workbench/contrib/url/browser/trustedDomainService.service'
import type { IWebview } from 'vs/workbench/contrib/webview/browser/webview'
import { IWebviewService } from 'vs/workbench/contrib/webview/browser/webview.service'
import { IWebviewWorkbenchService } from 'vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService.service'
import { IWebviewViewService } from 'vs/workbench/contrib/webviewView/browser/webviewViewService.service'
import { IWalkthroughsService } from 'vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedService.service'
import { IAccessibleViewInformationService } from 'vs/workbench/services/accessibility/common/accessibleViewInformationService.service'
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
import {
  GroupOrientation,
  type IEditorGroup,
  type IEditorPart
} from 'vs/workbench/services/editor/common/editorGroupsService'
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
import { NullExtensionService } from 'vs/workbench/services/extensions/common/extensions'
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions.service'
import { IElevatedFileService } from 'vs/workbench/services/files/common/elevatedFileService.service'
import { IFilesConfigurationService } from 'vs/workbench/services/filesConfiguration/common/filesConfigurationService.service'
import { IHistoryService } from 'vs/workbench/services/history/common/history.service'
import { IHostService } from 'vs/workbench/services/host/browser/host.service'
import type { IntegrityTestResult } from 'vs/workbench/services/integrity/common/integrity'
import { IIntegrityService } from 'vs/workbench/services/integrity/common/integrity.service'
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
import type {
  IOutputChannel,
  IOutputChannelDescriptor
} from 'vs/workbench/services/output/common/output'
import { IOutputService } from 'vs/workbench/services/output/common/output.service'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite.service'
import { IPathService } from 'vs/workbench/services/path/common/pathService.service'
import { IPreferencesService } from 'vs/workbench/services/preferences/common/preferences.service'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService.service'
import { PortsEnablement } from 'vs/workbench/services/remote/common/remoteExplorerService'
import { IRemoteExplorerService } from 'vs/workbench/services/remote/common/remoteExplorerService.service'
import type { ISearchComplete } from 'vs/workbench/services/search/common/search'
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
import { AccountStatus } from 'vs/workbench/services/userDataSync/common/userDataSync'
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
import { IChatMarkdownAnchorService } from 'vs/workbench/contrib/chat/browser/chatContentParts/chatMarkdownAnchorService.service'
import { getBuiltInExtensionTranslationsUris, getExtensionIdProvidingCurrentLocale } from './l10n'
import { unsupported } from './tools'
import { IChatEntitlementService } from 'vs/workbench/contrib/chat/common/chatEntitlementService.service'
import { IPromptsService } from 'vs/workbench/contrib/chat/common/promptSyntax/service/types.service'
import { ISuggestMemoryService } from 'vs/editor/contrib/suggest/browser/suggestMemory.service'
import { LanguageConfigurationService } from 'vs/editor/common/languages/languageConfigurationRegistry'
import { ILanguageConfigurationService } from 'vs/editor/common/languages/languageConfigurationRegistry.service'
import { ISemanticTokensStylingService } from 'vs/editor/common/services/semanticTokensStyling.service'
import { ILanguageFeatureDebounceService } from 'vs/editor/common/services/languageFeatureDebounce.service'
import { ILanguageFeaturesService } from 'vs/editor/common/services/languageFeatures.service'
import { IDiffProviderFactoryService } from 'vs/editor/browser/widget/diffEditor/diffProviderFactoryService.service'
import { IOutlineModelService } from 'vs/editor/contrib/documentSymbols/browser/outlineModel.service'
import { IMarkerNavigationService } from 'vs/editor/contrib/gotoError/browser/markerNavigationService.service'
import { ICodeLensCache } from 'vs/editor/contrib/codelens/browser/codeLensCache.service'
import { IInlayHintsCache } from 'vs/editor/contrib/inlayHints/browser/inlayHintsController.service'
import { ISymbolNavigationService } from 'vs/editor/contrib/gotoSymbol/browser/symbolNavigation.service'
import { IEditorCancellationTokens } from 'vs/editor/contrib/editorState/browser/keybindingCancellation.service'
import { IPeekViewService } from 'vs/editor/contrib/peekView/browser/peekView.service'
import { SemanticTokensStylingService } from 'vs/editor/common/services/semanticTokensStylingService'
import { LanguageFeatureDebounceService } from 'vs/editor/common/services/languageFeatureDebounce'
import { CodeEditorService } from 'vs/workbench/services/editor/browser/codeEditorService'
import { LanguageFeaturesService } from 'vs/editor/common/services/languageFeaturesService'
import { WorkerBasedDiffProviderFactoryService } from 'vs/editor/browser/widget/diffEditor/diffProviderFactoryService'
import { OutlineModelService } from 'vs/editor/contrib/documentSymbols/browser/outlineModel'
import { SuggestMemoryService } from 'vs/editor/contrib/suggest/browser/suggestMemory'
import { CodeLensCache } from 'vs/editor/contrib/codelens/browser/codeLensCache'
import { PeekViewService } from 'vs/editor/contrib/peekView/browser/peekView'
import { MarkerNavigationService } from 'vs/editor/contrib/gotoError/browser/markerNavigationService'
import { InlayHintsCache } from 'vs/editor/contrib/inlayHints/browser/inlayHintsController'
import { IUndoRedoService } from 'vs/platform/undoRedo/common/undoRedo.service'
import { UndoRedoService } from 'vs/platform/undoRedo/common/undoRedoService'
import { ActionWidgetService } from 'vs/platform/actionWidget/browser/actionWidget'
import { IActionWidgetService } from 'vs/platform/actionWidget/browser/actionWidget.service'
import { EditorCancellationTokens } from 'vs/editor/contrib/editorState/browser/keybindingCancellation'
import { SymbolNavigationService } from 'vs/editor/contrib/gotoSymbol/browser/symbolNavigation'
import { IHoverService } from 'vs/platform/hover/browser/hover.service'
import { HoverService } from 'vs/editor/browser/services/hoverService/hoverService'
import {
  IMcpSamplingService,
  IMcpService,
  IMcpWorkbenchService
} from 'vs/workbench/contrib/mcp/common/mcpTypes.service'
import { IMcpConfigPathsService } from 'vs/workbench/contrib/mcp/common/mcpConfigPathsService.service'
import { IMcpRegistry } from 'vs/workbench/contrib/mcp/common/mcpRegistryTypes.service'
import { IExtensionGalleryManifestService } from 'vs/platform/extensionManagement/common/extensionGalleryManifest.service'
import {
  ISharedWebContentExtractorService,
  IWebContentExtractorService
} from 'vs/platform/webContentExtractor/common/webContentExtractor.service'
import { IDefaultAccountService } from 'vs/workbench/services/accounts/common/defaultAccount.service'
import {
  NullSharedWebContentExtractorService,
  NullWebContentExtractorService
} from 'vs/platform/webContentExtractor/common/webContentExtractor'
import { NullDefaultAccountService } from 'vs/workbench/services/accounts/common/defaultAccount'
import { IChatTransferService } from 'vs/workbench/contrib/chat/common/chatTransferService.service'
import { IChatStatusItemService } from 'vs/workbench/contrib/chat/browser/chatStatusItemService.service'
import { IAiSettingsSearchService } from 'vscode/src/vs/workbench/services/aiSettingsSearch/common/aiSettingsSearch.service'
import { IDynamicAuthenticationProviderStorageService } from 'vs/workbench/services/authentication/common/dynamicAuthenticationProviderStorage.service'
import { IAuthenticationMcpService } from 'vs/workbench/services/authentication/browser/authenticationMcpService.service'
import { IAuthenticationMcpAccessService } from 'vs/workbench/services/authentication/browser/authenticationMcpAccessService.service'
import { IAuthenticationMcpUsageService } from 'vs/workbench/services/authentication/browser/authenticationMcpUsageService.service'
import { IBrowserElementsService } from 'vs/workbench/services/browserElements/browser/browserElementsService.service'
import { IGettingStartedExperimentService } from 'vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedExpService.service'
import { IChatContextPickService } from 'vs/workbench/contrib/chat/browser/chatContextPickService.service'
import {
  IMcpGalleryService,
  IMcpManagementService
} from 'vs/platform/mcp/common/mcpManagement.service'
import { ITreeSitterThemeService } from 'vs/editor/common/services/treeSitter/treeSitterThemeService.service'
import { ITreeSitterLibraryService } from 'vs/editor/common/services/treeSitter/treeSitterLibraryService.service'
import { constObservable } from 'vs/base/common/observable'
function Unsupported(target: object, propertyKey: string, descriptor?: PropertyDescriptor) {
  function unsupported() {
    throw new Error(
      `Unsupported: ${target.constructor.name}.${propertyKey} is not supported. You are using a feature without registering the corresponding service override.`
    )
  }
  if (descriptor != null) {
    if (descriptor.value != null) {
      descriptor.value = unsupported
    } else if (descriptor.get != null) {
      descriptor.get = unsupported
    }
  } else {
    Object.defineProperty(target, propertyKey, {
      get() {
        unsupported()
      },
      set() {},
      configurable: true,
      enumerable: true
    })
  }
}
/**
 * Editor services: all editor service that are not defined in vs/editor/standalone/
 */
registerSingleton(
  ILanguageConfigurationService,
  LanguageConfigurationService,
  InstantiationType.Delayed
)
registerSingleton(
  ISemanticTokensStylingService,
  SemanticTokensStylingService,
  InstantiationType.Delayed
)
registerSingleton(
  ILanguageFeatureDebounceService,
  LanguageFeatureDebounceService,
  InstantiationType.Delayed
)
registerSingleton(ILanguageFeaturesService, LanguageFeaturesService, InstantiationType.Delayed)
registerSingleton(ICodeEditorService, CodeEditorService, InstantiationType.Delayed)
registerSingleton(
  IDiffProviderFactoryService,
  WorkerBasedDiffProviderFactoryService,
  InstantiationType.Delayed
)
registerSingleton(ISymbolNavigationService, SymbolNavigationService, InstantiationType.Delayed)
registerSingleton(IEditorCancellationTokens, EditorCancellationTokens, InstantiationType.Delayed)
registerSingleton(IPeekViewService, PeekViewService, InstantiationType.Delayed)
registerSingleton(IOutlineModelService, OutlineModelService, InstantiationType.Delayed)
registerSingleton(IMarkerNavigationService, MarkerNavigationService, InstantiationType.Delayed)
registerSingleton(ISuggestMemoryService, SuggestMemoryService, InstantiationType.Delayed)
registerSingleton(ICodeLensCache, CodeLensCache, InstantiationType.Delayed)
registerSingleton(IHoverService, HoverService, InstantiationType.Delayed)
registerSingleton(IInlayHintsCache, InlayHintsCache, InstantiationType.Delayed)
registerSingleton(IActionWidgetService, ActionWidgetService, InstantiationType.Delayed)
registerSingleton(IUndoRedoService, UndoRedoService, InstantiationType.Delayed)
/**
 * End editor services
 */
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
  readonly _serviceBrand: IEditorService['_serviceBrand'] = undefined
  getVisibleTextEditorControls: IEditorService['getVisibleTextEditorControls'] = () => []
  onWillOpenEditor: IEditorService['onWillOpenEditor'] = Event.None
  onDidActiveEditorChange: IEditorService['onDidActiveEditorChange'] = Event.None
  onDidVisibleEditorsChange: IEditorService['onDidVisibleEditorsChange'] = Event.None
  onDidEditorsChange: IEditorService['onDidEditorsChange'] = Event.None
  onDidCloseEditor: IEditorService['onDidCloseEditor'] = Event.None
  activeEditorPane: IEditorService['activeEditorPane'] = undefined
  activeEditor: IEditorService['activeEditor'] = undefined
  get activeTextEditorControl() {
    return StandaloneServices.get(ICodeEditorService).getFocusedCodeEditor() ?? undefined
  }
  activeTextEditorLanguageId: IEditorService['activeTextEditorLanguageId'] = undefined
  visibleEditorPanes: IEditorService['visibleEditorPanes'] = []
  visibleEditors: IEditorService['visibleEditors'] = []
  visibleTextEditorControls: IEditorService['visibleTextEditorControls'] = []
  editors: IEditorService['editors'] = []
  count: IEditorService['count'] = 0
  getEditors: IEditorService['getEditors'] = () => []
  @Unsupported
  openEditor: IEditorService['openEditor'] = (): never => {
    unsupported()
  }
  @Unsupported
  openEditors: IEditorService['openEditors'] = (): never => {
    unsupported()
  }
  replaceEditors: IEditorService['replaceEditors'] = async () => {}
  isOpened: IEditorService['isOpened'] = () => false
  isVisible: IEditorService['isVisible'] = () => false
  closeEditor: IEditorService['closeEditor'] = async () => {}
  closeEditors: IEditorService['closeEditors'] = async () => {}
  findEditors: IEditorService['findEditors'] = () => []
  save: IEditorService['save'] = async () => ({ success: false, editors: [] })
  saveAll: IEditorService['saveAll'] = async () => ({ success: false, editors: [] })
  revert: IEditorService['revert'] = async () => false
  revertAll: IEditorService['revertAll'] = async () => false
  createScoped: IEditorService['createScoped'] = (): IEditorService => {
    return this
  }
}
registerSingleton(IEditorService, EditorService, InstantiationType.Eager)
class PaneCompositePartService implements IPaneCompositePartService {
  readonly _serviceBrand: IPaneCompositePartService['_serviceBrand'] = undefined
  getPaneCompositeIds: IPaneCompositePartService['getPaneCompositeIds'] = () => []
  onDidPaneCompositeOpen: IPaneCompositePartService['onDidPaneCompositeOpen'] = Event.None
  onDidPaneCompositeClose: IPaneCompositePartService['onDidPaneCompositeClose'] = Event.None
  openPaneComposite: IPaneCompositePartService['openPaneComposite'] = async () => undefined
  getActivePaneComposite: IPaneCompositePartService['getActivePaneComposite'] = () => undefined
  getPaneComposite: IPaneCompositePartService['getPaneComposite'] = () => undefined
  getPaneComposites: IPaneCompositePartService['getPaneComposites'] = () => []
  getPinnedPaneCompositeIds: IPaneCompositePartService['getPinnedPaneCompositeIds'] = () => []
  getVisiblePaneCompositeIds: IPaneCompositePartService['getVisiblePaneCompositeIds'] = () => []
  getProgressIndicator: IPaneCompositePartService['getProgressIndicator'] = () => undefined
  hideActivePaneComposite: IPaneCompositePartService['hideActivePaneComposite'] = () => {}
  @Unsupported
  getLastActivePaneCompositeId: IPaneCompositePartService['getLastActivePaneCompositeId'] =
    (): never => {
      unsupported()
    }
}
registerSingleton(IPaneCompositePartService, PaneCompositePartService, InstantiationType.Eager)
registerSingleton(IUriIdentityService, UriIdentityService, InstantiationType.Delayed)
class TextFileService implements ITextFileService {
  _serviceBrand: undefined
  @Unsupported
  resolveDecoding: ITextFileService['resolveDecoding'] = (): never => {
    unsupported()
  }
  @Unsupported
  resolveEncoding: ITextFileService['resolveEncoding'] = (): never => {
    unsupported()
  }
  @Unsupported
  validateDetectedEncoding: ITextFileService['validateDetectedEncoding'] = (): never => {
    unsupported()
  }
  @Unsupported
  getEncoding: ITextFileService['getEncoding'] = (): never => {
    unsupported()
  }
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
  isDirty: ITextFileService['isDirty'] = (): never => {
    unsupported()
  }
  @Unsupported
  save: ITextFileService['save'] = (): never => {
    unsupported()
  }
  @Unsupported
  saveAs: ITextFileService['saveAs'] = (): never => {
    unsupported()
  }
  @Unsupported
  revert: ITextFileService['revert'] = (): never => {
    unsupported()
  }
  @Unsupported
  read: ITextFileService['read'] = (): never => {
    unsupported()
  }
  @Unsupported
  readStream: ITextFileService['readStream'] = (): never => {
    unsupported()
  }
  @Unsupported
  write: ITextFileService['write'] = (): never => {
    unsupported()
  }
  @Unsupported
  create: ITextFileService['create'] = (): never => {
    unsupported()
  }
  @Unsupported
  getEncodedReadable: ITextFileService['getEncodedReadable'] = (): never => {
    unsupported()
  }
  @Unsupported
  getDecodedStream: ITextFileService['getDecodedStream'] = (): never => {
    unsupported()
  }
  @Unsupported
  dispose: ITextFileService['dispose'] = (): never => {
    unsupported()
  }
}

registerSingleton(ITextFileService, TextFileService, InstantiationType.Eager)
class FileService implements IFileService {
  readonly _serviceBrand: IFileService['_serviceBrand'] = undefined
  onDidChangeFileSystemProviderRegistrations: IFileService['onDidChangeFileSystemProviderRegistrations'] =
    Event.None
  onDidChangeFileSystemProviderCapabilities: IFileService['onDidChangeFileSystemProviderCapabilities'] =
    Event.None
  onWillActivateFileSystemProvider: IFileService['onWillActivateFileSystemProvider'] = Event.None
  @Unsupported
  registerProvider: IFileService['registerProvider'] = (): never => {
    unsupported()
  }
  getProvider: IFileService['getProvider'] = function () {
    return undefined
  }
  activateProvider: IFileService['activateProvider'] = async () => {}
  canHandleResource: IFileService['canHandleResource'] = async () => false
  hasProvider: IFileService['hasProvider'] = () => false
  hasCapability: IFileService['hasCapability'] = () => false
  listCapabilities: IFileService['listCapabilities'] = () => []
  onDidFilesChange: IFileService['onDidFilesChange'] = Event.None
  onDidRunOperation: IFileService['onDidRunOperation'] = Event.None
  @Unsupported
  resolve: IFileService['resolve'] = (): never => {
    unsupported()
  }
  @Unsupported
  resolveAll: IFileService['resolveAll'] = (): never => {
    unsupported()
  }
  @Unsupported
  stat: IFileService['stat'] = (): never => {
    unsupported()
  }
  exists: IFileService['exists'] = async () => false
  @Unsupported
  readFile: IFileService['readFile'] = (): never => {
    unsupported()
  }
  @Unsupported
  readFileStream: IFileService['readFileStream'] = (): never => {
    unsupported()
  }
  @Unsupported
  writeFile: IFileService['writeFile'] = (): never => {
    unsupported()
  }
  @Unsupported
  move: IFileService['move'] = (): never => {
    unsupported()
  }
  @Unsupported
  canMove: IFileService['canMove'] = (): never => {
    unsupported()
  }
  @Unsupported
  copy: IFileService['copy'] = (): never => {
    unsupported()
  }
  @Unsupported
  canCopy: IFileService['canCopy'] = (): never => {
    unsupported()
  }
  @Unsupported
  cloneFile: IFileService['cloneFile'] = (): never => {
    unsupported()
  }
  @Unsupported
  createFile: IFileService['createFile'] = (): never => {
    unsupported()
  }
  @Unsupported
  canCreateFile: IFileService['canCreateFile'] = (): never => {
    unsupported()
  }
  @Unsupported
  createFolder: IFileService['createFolder'] = (): never => {
    unsupported()
  }
  @Unsupported
  del: IFileService['del'] = (): never => {
    unsupported()
  }
  @Unsupported
  canDelete: IFileService['canDelete'] = (): never => {
    unsupported()
  }
  onDidWatchError: IFileService['onDidWatchError'] = Event.None
  @Unsupported
  watch: IFileService['watch'] = (): never => {
    unsupported()
  }
  @Unsupported
  createWatcher: IFileService['createWatcher'] = (): never => {
    unsupported()
  }
  dispose: IFileService['dispose'] = () => {
    // ignore
  }
}
registerSingleton(IFileService, FileService, InstantiationType.Eager)
class EmptyEditorGroup implements IEditorGroup, IEditorGroupView {
  selectedEditors: IEditorGroup['selectedEditors'] = []
  isSelected: IEditorGroup['isSelected'] = () => false
  @Unsupported
  setSelection: IEditorGroup['setSelection'] = (): never => {
    unsupported()
  }
  isTransient: IEditorGroup['isTransient'] = () => false
  windowId: IEditorGroup['windowId'] = mainWindow.vscodeWindowId
  @Unsupported
  get groupsView() {
    return unsupported()
  }
  notifyLabelChanged: IEditorGroupView['notifyLabelChanged'] = (): void => {}
  @Unsupported
  createEditorActions: IEditorGroup['createEditorActions'] = (): never => {
    unsupported()
  }
  onDidFocus: IEditorGroupView['onDidFocus'] = Event.None
  onDidOpenEditorFail: IEditorGroupView['onDidOpenEditorFail'] = Event.None
  whenRestored: IEditorGroupView['whenRestored'] = Promise.resolve()
  @Unsupported
  get titleHeight() {
    return unsupported()
  }
  disposed: IEditorGroupView['disposed'] = false
  @Unsupported
  setActive: IEditorGroupView['setActive'] = (): never => {
    unsupported()
  }
  @Unsupported
  notifyIndexChanged: IEditorGroupView['notifyIndexChanged'] = (): never => {
    unsupported()
  }
  @Unsupported
  relayout: IEditorGroupView['relayout'] = (): never => {
    unsupported()
  }
  @Unsupported
  dispose: IEditorGroupView['dispose'] = (): never => {
    unsupported()
  }
  @Unsupported
  toJSON: IEditorGroupView['toJSON'] = (): never => {
    unsupported()
  }
  preferredWidth?: number | undefined
  preferredHeight?: number | undefined
  @Unsupported
  get element() {
    return unsupported()
  }
  minimumWidth: IEditorGroupView['minimumWidth'] = 0
  maximumWidth: IEditorGroupView['maximumWidth'] = Number.POSITIVE_INFINITY
  minimumHeight: IEditorGroupView['minimumHeight'] = 0
  maximumHeight: IEditorGroupView['maximumHeight'] = Number.POSITIVE_INFINITY
  onDidChange: IEditorGroupView['onDidChange'] = Event.None
  @Unsupported
  layout: IEditorGroupView['layout'] = (): never => {
    unsupported()
  }
  onDidModelChange: IEditorGroup['onDidModelChange'] = Event.None
  onWillDispose: IEditorGroup['onWillDispose'] = Event.None
  onDidActiveEditorChange: IEditorGroup['onDidActiveEditorChange'] = Event.None
  onWillCloseEditor: IEditorGroup['onWillCloseEditor'] = Event.None
  onDidCloseEditor: IEditorGroup['onDidCloseEditor'] = Event.None
  onWillMoveEditor: IEditorGroup['onWillMoveEditor'] = Event.None
  onWillOpenEditor: IEditorGroupView['onWillOpenEditor'] = Event.None
  id: IEditorGroup['id'] = 0
  index: IEditorGroup['index'] = 0
  label: IEditorGroup['label'] = 'main'
  ariaLabel: IEditorGroup['ariaLabel'] = 'main'
  activeEditorPane: IEditorGroup['activeEditorPane'] = undefined
  activeEditor: IEditorGroup['activeEditor'] = null
  previewEditor: IEditorGroup['previewEditor'] = null
  count: IEditorGroup['count'] = 0
  isEmpty: IEditorGroup['isEmpty'] = false
  isLocked: IEditorGroup['isLocked'] = false
  stickyCount: IEditorGroup['stickyCount'] = 0
  editors: IEditorGroup['editors'] = []
  get scopedContextKeyService(): IContextKeyService {
    return StandaloneServices.get(IContextKeyService)
  }
  getEditors: IEditorGroup['getEditors'] = () => []
  findEditors: IEditorGroup['findEditors'] = () => []
  getEditorByIndex: IEditorGroup['getEditorByIndex'] = () => undefined
  @Unsupported
  getIndexOfEditor: IEditorGroup['getIndexOfEditor'] = (): never => {
    unsupported()
  }
  @Unsupported
  openEditor: IEditorGroup['openEditor'] = (): never => {
    unsupported()
  }
  @Unsupported
  openEditors: IEditorGroup['openEditors'] = (): never => {
    unsupported()
  }
  isPinned: IEditorGroup['isPinned'] = () => false
  isSticky: IEditorGroup['isSticky'] = () => false
  isActive: IEditorGroup['isActive'] = () => false
  contains: IEditorGroup['contains'] = () => false
  @Unsupported
  moveEditor: IEditorGroup['moveEditor'] = (): never => {
    unsupported()
  }
  @Unsupported
  moveEditors: IEditorGroup['moveEditors'] = (): never => {
    unsupported()
  }
  @Unsupported
  copyEditor: IEditorGroup['copyEditor'] = (): never => {
    unsupported()
  }
  @Unsupported
  copyEditors: IEditorGroup['copyEditors'] = (): never => {
    unsupported()
  }
  @Unsupported
  closeEditor: IEditorGroup['closeEditor'] = (): never => {
    unsupported()
  }
  @Unsupported
  closeEditors: IEditorGroup['closeEditors'] = (): never => {
    unsupported()
  }
  @Unsupported
  closeAllEditors: IEditorGroup['closeAllEditors'] = (): never => {
    unsupported()
  }
  @Unsupported
  replaceEditors: IEditorGroup['replaceEditors'] = (): never => {
    unsupported()
  }
  pinEditor: IEditorGroup['pinEditor'] = () => {}
  stickEditor: IEditorGroup['stickEditor'] = () => {}
  unstickEditor: IEditorGroup['unstickEditor'] = () => {}
  lock: IEditorGroup['lock'] = () => {}
  focus: IEditorGroup['focus'] = (): void => {
    // ignore
  }
  @Unsupported
  isFirst: IEditorGroup['isFirst'] = (): never => {
    unsupported()
  }
  @Unsupported
  isLast: IEditorGroup['isLast'] = (): never => {
    unsupported()
  }
}
const fakeActiveGroup = new EmptyEditorGroup()
class EmptyEditorPart implements IEditorPart {
  onWillDispose: IEditorPart['onWillDispose'] = Event.None
  windowId: IEditorPart['windowId'] = mainWindow.vscodeWindowId
  hasMaximizedGroup: IEditorPart['hasMaximizedGroup'] = () => false
  onDidLayout: IEditorPart['onDidLayout'] = Event.None
  onDidScroll: IEditorPart['onDidScroll'] = Event.None
  @Unsupported
  get contentDimension(): never {
    return unsupported()
  }
  isReady: IEditorPart['isReady'] = true
  whenReady: IEditorPart['whenReady'] = Promise.resolve()
  whenRestored: IEditorPart['whenRestored'] = Promise.resolve()
  hasRestorableState: IEditorPart['hasRestorableState'] = false
  @Unsupported
  centerLayout: IEditorPart['centerLayout'] = (): never => {
    unsupported()
  }
  @Unsupported
  isLayoutCentered: IEditorPart['isLayoutCentered'] = (): never => {
    unsupported()
  }
  @Unsupported
  enforcePartOptions: IEditorPart['enforcePartOptions'] = (): never => {
    unsupported()
  }
  onDidChangeActiveGroup: IEditorPart['onDidChangeActiveGroup'] = Event.None
  onDidAddGroup: IEditorPart['onDidAddGroup'] = Event.None
  onDidRemoveGroup: IEditorPart['onDidRemoveGroup'] = Event.None
  onDidMoveGroup: IEditorPart['onDidMoveGroup'] = Event.None
  onDidActivateGroup: IEditorPart['onDidActivateGroup'] = Event.None
  onDidChangeGroupIndex: IEditorPart['onDidChangeGroupIndex'] = Event.None
  onDidChangeGroupLocked: IEditorPart['onDidChangeGroupLocked'] = Event.None
  onDidChangeGroupMaximized: IEditorPart['onDidChangeGroupMaximized'] = Event.None
  activeGroup: IEditorPart['activeGroup'] = fakeActiveGroup
  @Unsupported
  get sideGroup(): never {
    return unsupported()
  }
  groups: IEditorPart['groups'] = [fakeActiveGroup]
  count: IEditorPart['count'] = 0
  orientation: IEditorPart['orientation'] = GroupOrientation.HORIZONTAL
  getGroups: IEditorPart['getGroups'] = () => []
  getGroup: IEditorPart['getGroup'] = () => undefined
  @Unsupported
  activateGroup: IEditorPart['activateGroup'] = (): never => {
    unsupported()
  }
  @Unsupported
  getSize: IEditorPart['getSize'] = (): never => {
    unsupported()
  }
  @Unsupported
  setSize: IEditorPart['setSize'] = (): never => {
    unsupported()
  }
  @Unsupported
  arrangeGroups: IEditorPart['arrangeGroups'] = (): never => {
    unsupported()
  }
  @Unsupported
  toggleMaximizeGroup: IEditorPart['toggleMaximizeGroup'] = (): never => {
    unsupported()
  }
  @Unsupported
  toggleExpandGroup: IEditorPart['toggleExpandGroup'] = (): never => {
    unsupported()
  }
  @Unsupported
  applyLayout: IEditorPart['applyLayout'] = (): never => {
    unsupported()
  }
  @Unsupported
  getLayout: IEditorPart['getLayout'] = (): never => {
    unsupported()
  }
  @Unsupported
  setGroupOrientation: IEditorPart['setGroupOrientation'] = (): never => {
    unsupported()
  }
  findGroup: IEditorPart['findGroup'] = () => undefined
  @Unsupported
  addGroup: IEditorPart['addGroup'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeGroup: IEditorPart['removeGroup'] = (): never => {
    unsupported()
  }
  @Unsupported
  moveGroup: IEditorPart['moveGroup'] = (): never => {
    unsupported()
  }
  @Unsupported
  mergeGroup: IEditorPart['mergeGroup'] = (): never => {
    unsupported()
  }
  @Unsupported
  mergeAllGroups: IEditorPart['mergeAllGroups'] = (): never => {
    unsupported()
  }
  @Unsupported
  copyGroup: IEditorPart['copyGroup'] = (): never => {
    unsupported()
  }
  partOptions: IEditorPart['partOptions'] = DEFAULT_EDITOR_PART_OPTIONS
  onDidChangeEditorPartOptions: IEditorPart['onDidChangeEditorPartOptions'] = Event.None
  @Unsupported
  createEditorDropTarget: IEditorPart['createEditorDropTarget'] = (): never => {
    unsupported()
  }
}
class EmptyEditorGroupsService implements IEditorGroupsService {
  @Unsupported
  getScopedInstantiationService: IEditorGroupsService['getScopedInstantiationService'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  registerContextKeyProvider: IEditorGroupsService['registerContextKeyProvider'] = (): never => {
    unsupported()
  }
  @Unsupported
  saveWorkingSet: IEditorGroupsService['saveWorkingSet'] = (): never => {
    unsupported()
  }
  @Unsupported
  getWorkingSets: IEditorGroupsService['getWorkingSets'] = (): never => {
    unsupported()
  }
  @Unsupported
  applyWorkingSet: IEditorGroupsService['applyWorkingSet'] = (): never => {
    unsupported()
  }
  @Unsupported
  deleteWorkingSet: IEditorGroupsService['deleteWorkingSet'] = (): never => {
    unsupported()
  }
  onDidCreateAuxiliaryEditorPart: IEditorGroupsService['onDidCreateAuxiliaryEditorPart'] =
    Event.None
  mainPart: IEditorGroupsService['mainPart'] = new EmptyEditorPart()
  parts: IEditorGroupsService['parts'] = [this.mainPart]
  @Unsupported
  getPart: IEditorGroupsService['getPart'] = (): never => {
    unsupported()
  }
  @Unsupported
  createAuxiliaryEditorPart: IEditorGroupsService['createAuxiliaryEditorPart'] = (): never => {
    unsupported()
  }
  onDidChangeGroupMaximized: IEditorGroupsService['onDidChangeGroupMaximized'] = Event.None
  @Unsupported
  toggleMaximizeGroup: IEditorGroupsService['toggleMaximizeGroup'] = (): never => {
    unsupported()
  }
  @Unsupported
  toggleExpandGroup: IEditorGroupsService['toggleExpandGroup'] = (): never => {
    unsupported()
  }
  partOptions: IEditorGroupsService['partOptions'] = DEFAULT_EDITOR_PART_OPTIONS
  @Unsupported
  createEditorDropTarget: IEditorGroupsService['createEditorDropTarget'] = (): never => {
    unsupported()
  }
  readonly _serviceBrand: IEditorGroupsService['_serviceBrand'] = undefined
  @Unsupported
  getLayout: IEditorGroupsService['getLayout'] = (): never => {
    unsupported()
  }
  onDidChangeActiveGroup: IEditorGroupsService['onDidChangeActiveGroup'] = Event.None
  onDidAddGroup: IEditorGroupsService['onDidAddGroup'] = Event.None
  onDidRemoveGroup: IEditorGroupsService['onDidRemoveGroup'] = Event.None
  onDidMoveGroup: IEditorGroupsService['onDidMoveGroup'] = Event.None
  onDidActivateGroup: IEditorGroupsService['onDidActivateGroup'] = Event.None
  onDidChangeGroupIndex: IEditorGroupsService['onDidChangeGroupIndex'] = Event.None
  onDidChangeGroupLocked: IEditorGroupsService['onDidChangeGroupLocked'] = Event.None
  @Unsupported
  get contentDimension(): never {
    return unsupported()
  }
  activeGroup: IEditorGroupsService['activeGroup'] = fakeActiveGroup
  @Unsupported
  get sideGroup(): never {
    return unsupported()
  }
  groups: IEditorGroupsService['groups'] = [fakeActiveGroup]
  count: IEditorGroupsService['count'] = 0
  orientation: IEditorGroupsService['orientation'] = GroupOrientation.HORIZONTAL
  isReady: IEditorGroupsService['isReady'] = false
  whenReady: IEditorGroupsService['whenReady'] = Promise.resolve()
  whenRestored: IEditorGroupsService['whenRestored'] = Promise.resolve()
  hasRestorableState: IEditorGroupsService['hasRestorableState'] = false
  getGroups: IEditorGroupsService['getGroups'] = (): never[] => []
  getGroup: IEditorGroupsService['getGroup'] = (): undefined => undefined
  @Unsupported
  activateGroup: IEditorGroupsService['activateGroup'] = (): never => {
    unsupported()
  }
  @Unsupported
  getSize: IEditorGroupsService['getSize'] = (): never => {
    unsupported()
  }
  @Unsupported
  setSize: IEditorGroupsService['setSize'] = (): never => {
    unsupported()
  }
  @Unsupported
  arrangeGroups: IEditorGroupsService['arrangeGroups'] = (): never => {
    unsupported()
  }
  @Unsupported
  applyLayout: IEditorGroupsService['applyLayout'] = (): never => {
    unsupported()
  }
  @Unsupported
  setGroupOrientation: IEditorGroupsService['setGroupOrientation'] = (): never => {
    unsupported()
  }
  findGroup: IEditorGroupsService['findGroup'] = (): undefined => undefined
  @Unsupported
  addGroup: IEditorGroupsService['addGroup'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeGroup: IEditorGroupsService['removeGroup'] = (): never => {
    unsupported()
  }
  @Unsupported
  moveGroup: IEditorGroupsService['moveGroup'] = (): never => {
    unsupported()
  }
  @Unsupported
  mergeGroup: IEditorGroupsService['mergeGroup'] = (): never => {
    unsupported()
  }
  @Unsupported
  mergeAllGroups: IEditorGroupsService['mergeAllGroups'] = (): never => {
    unsupported()
  }
  @Unsupported
  copyGroup: IEditorGroupsService['copyGroup'] = (): never => {
    unsupported()
  }
  onDidChangeEditorPartOptions: IEditorGroupsService['onDidChangeEditorPartOptions'] = Event.None
  @Unsupported
  enforcePartOptions: IEditorGroupsService['enforcePartOptions'] = (): never => {
    unsupported()
  }
}
registerSingleton(IEditorGroupsService, EmptyEditorGroupsService, InstantiationType.Eager)
class BannerService implements IBannerService {
  _serviceBrand: undefined
  focus: IBannerService['focus'] = (): void => {}
  focusNextAction: IBannerService['focusNextAction'] = (): void => {}
  focusPreviousAction: IBannerService['focusPreviousAction'] = (): void => {}
  hide: IBannerService['hide'] = (): void => {}
  show: IBannerService['show'] = (): void => {}
}
registerSingleton(IBannerService, BannerService, InstantiationType.Eager)
class TitleService implements ITitleService {
  _serviceBrand: undefined
  @Unsupported
  getPart: ITitleService['getPart'] = (): never => {
    unsupported()
  }
  @Unsupported
  createAuxiliaryTitlebarPart: ITitleService['createAuxiliaryTitlebarPart'] = (): never => {
    unsupported()
  }
  @Unsupported
  dispose: ITitleService['dispose'] = (): never => {
    unsupported()
  }
  onMenubarVisibilityChange: ITitleService['onMenubarVisibilityChange'] = Event.None
  updateProperties: ITitleService['updateProperties'] = (): void => {}
  registerVariables: ITitleService['registerVariables'] = () => {}
}
registerSingleton(ITitleService, TitleService, InstantiationType.Eager)
class WorkingCopyFileService implements IWorkingCopyFileService {
  _serviceBrand: undefined
  onWillRunWorkingCopyFileOperation: IWorkingCopyFileService['onWillRunWorkingCopyFileOperation'] =
    Event.None
  onDidFailWorkingCopyFileOperation: IWorkingCopyFileService['onDidFailWorkingCopyFileOperation'] =
    Event.None
  onDidRunWorkingCopyFileOperation: IWorkingCopyFileService['onDidRunWorkingCopyFileOperation'] =
    Event.None
  @Unsupported
  addFileOperationParticipant: IWorkingCopyFileService['addFileOperationParticipant'] =
    (): never => {
      unsupported()
    }
  hasSaveParticipants: IWorkingCopyFileService['hasSaveParticipants'] = false
  @Unsupported
  addSaveParticipant: IWorkingCopyFileService['addSaveParticipant'] = (): never => {
    unsupported()
  }
  @Unsupported
  runSaveParticipants: IWorkingCopyFileService['runSaveParticipants'] = (): never => {
    unsupported()
  }
  @Unsupported
  create: IWorkingCopyFileService['create'] = (): never => {
    unsupported()
  }
  @Unsupported
  createFolder: IWorkingCopyFileService['createFolder'] = (): never => {
    unsupported()
  }
  @Unsupported
  move: IWorkingCopyFileService['move'] = (): never => {
    unsupported()
  }
  @Unsupported
  copy: IWorkingCopyFileService['copy'] = (): never => {
    unsupported()
  }
  @Unsupported
  delete: IWorkingCopyFileService['delete'] = (): never => {
    unsupported()
  }
  @Unsupported
  registerWorkingCopyProvider: IWorkingCopyFileService['registerWorkingCopyProvider'] =
    (): never => {
      unsupported()
    }
  getDirty: IWorkingCopyFileService['getDirty'] = () => []
}
registerSingleton(IWorkingCopyFileService, WorkingCopyFileService, InstantiationType.Eager)
class PathService implements IPathService {
  _serviceBrand: undefined
  @Unsupported
  get path() {
    return unsupported()
  }
  defaultUriScheme: IPathService['defaultUriScheme'] = 'file'
  @Unsupported
  fileURI: IPathService['fileURI'] = (): never => {
    unsupported()
  }
  @Unsupported
  userHome: IPathService['userHome'] = (): never => {
    unsupported()
  }
  @Unsupported
  hasValidBasename: IPathService['hasValidBasename'] = (): never => {
    unsupported()
  }
  resolvedUserHome: IPathService['resolvedUserHome'] = undefined
}
registerSingleton(IPathService, PathService, InstantiationType.Delayed)
class ProductService implements IProductService {
  readonly _serviceBrand: IProductService['_serviceBrand'] = undefined
  version: IProductService['version'] = 'unknown'
  commit: IProductService['commit'] = 'unknown'
  quality: IProductService['quality'] = 'oss'
  nameShort: IProductService['nameShort'] = 'Code - OSS Dev'
  nameLong: IProductService['nameLong'] = 'Code - OSS Dev'
  applicationName: IProductService['applicationName'] = 'code-oss'
  dataFolderName: IProductService['dataFolderName'] = '.vscode-oss'
  urlProtocol: IProductService['urlProtocol'] = 'code-oss'
  reportIssueUrl: IProductService['reportIssueUrl'] =
    'https://github.com/microsoft/vscode/issues/new'
  licenseUrl: IProductService['licenseUrl'] =
    'https://github.com/microsoft/vscode/blob/main/LICENSE.txt'
  serverApplicationName: IProductService['serverApplicationName'] = 'code-server-oss'
  extensionProperties: IProductService['extensionProperties'] = {}
}
registerSingleton(IProductService, ProductService, InstantiationType.Eager)
class ExtensionTipsService implements IExtensionTipsService {
  readonly _serviceBrand: IExtensionTipsService['_serviceBrand'] = undefined
  getConfigBasedTips: IExtensionTipsService['getConfigBasedTips'] = async () => []
  getImportantExecutableBasedTips: IExtensionTipsService['getImportantExecutableBasedTips'] =
    async () => []
  getOtherExecutableBasedTips: IExtensionTipsService['getOtherExecutableBasedTips'] = async () => []
}
registerSingleton(IExtensionTipsService, ExtensionTipsService, InstantiationType.Eager)
class LanguageStatusService implements ILanguageStatusService {
  _serviceBrand: undefined
  onDidChange: ILanguageStatusService['onDidChange'] = Event.None
  @Unsupported
  addStatus: ILanguageStatusService['addStatus'] = (): never => {
    unsupported()
  }
  @Unsupported
  getLanguageStatus: ILanguageStatusService['getLanguageStatus'] = (): never => {
    unsupported()
  }
}
registerSingleton(ILanguageStatusService, LanguageStatusService, InstantiationType.Delayed)
class HostService implements IHostService {
  _serviceBrand: undefined
  getNativeWindowHandle: IHostService['getNativeWindowHandle'] = async () => undefined
  getScreenshot: IHostService['getScreenshot'] = async () => undefined
  onDidChangeFullScreen: IHostService['onDidChangeFullScreen'] = Event.None
  onDidChangeFocus: IHostService['onDidChangeFocus'] = Event.None
  hasFocus: IHostService['hasFocus'] = false
  hadLastFocus: IHostService['hadLastFocus'] = async () => false
  @Unsupported
  focus: IHostService['focus'] = (): never => {
    unsupported()
  }
  onDidChangeActiveWindow: IHostService['onDidChangeActiveWindow'] = Event.None
  @Unsupported
  openWindow: IHostService['openWindow'] = (): never => {
    unsupported()
  }
  @Unsupported
  toggleFullScreen: IHostService['toggleFullScreen'] = (): never => {
    unsupported()
  }
  @Unsupported
  moveTop: IHostService['moveTop'] = (): never => {
    unsupported()
  }
  @Unsupported
  getCursorScreenPoint: IHostService['getCursorScreenPoint'] = (): never => {
    unsupported()
  }
  @Unsupported
  restart: IHostService['restart'] = (): never => {
    unsupported()
  }
  @Unsupported
  reload: IHostService['reload'] = (): never => {
    unsupported()
  }
  @Unsupported
  close: IHostService['close'] = (): never => {
    unsupported()
  }
  @Unsupported
  withExpectedShutdown: IHostService['withExpectedShutdown'] = (): never => {
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
  isEnabledForLanguage: ILanguageDetectionService['isEnabledForLanguage'] = (): boolean => {
    return false
  }
  detectLanguage: ILanguageDetectionService['detectLanguage'] = async (): Promise<
    string | undefined
  > => {
    return undefined
  }
}
registerSingleton(ILanguageDetectionService, LanguageDetectionService, InstantiationType.Eager)
registerSingleton(IExtensionService, NullExtensionService, InstantiationType.Eager)
class KeyboardLayoutService implements IKeyboardLayoutService {
  _serviceBrand: undefined
  onDidChangeKeyboardLayout: IKeyboardLayoutService['onDidChangeKeyboardLayout'] = Event.None
  getRawKeyboardMapping: IKeyboardLayoutService['getRawKeyboardMapping'] = () => null
  getCurrentKeyboardLayout: IKeyboardLayoutService['getCurrentKeyboardLayout'] = () => null
  getAllKeyboardLayouts: IKeyboardLayoutService['getAllKeyboardLayouts'] = () => []
  getKeyboardMapper: IKeyboardLayoutService['getKeyboardMapper'] = () =>
    new FallbackKeyboardMapper(false, OS)
  validateCurrentKeyboardMapping: IKeyboardLayoutService['validateCurrentKeyboardMapping'] =
    () => {}
}
registerSingleton(IKeyboardLayoutService, KeyboardLayoutService, InstantiationType.Delayed)
class NullUserDataInitializationService implements IUserDataInitializationService {
  _serviceBrand: undefined
  requiresInitialization: IUserDataInitializationService['requiresInitialization'] =
    async (): Promise<boolean> => {
      return false
    }
  whenInitializationFinished: IUserDataInitializationService['whenInitializationFinished'] =
    async (): Promise<void> => {}
  initializeRequiredResources: IUserDataInitializationService['initializeRequiredResources'] =
    async (): Promise<void> => {}
  initializeInstalledExtensions: IUserDataInitializationService['initializeInstalledExtensions'] =
    async (): Promise<void> => {}
  initializeOtherResources: IUserDataInitializationService['initializeOtherResources'] =
    async (): Promise<void> => {}
}
registerSingleton(
  IUserDataInitializationService,
  NullUserDataInitializationService,
  InstantiationType.Eager
)
class HostColorSchemeService implements IHostColorSchemeService {
  _serviceBrand: undefined
  dark: IHostColorSchemeService['dark'] = false
  highContrast: IHostColorSchemeService['highContrast'] = false
  onDidChangeColorScheme: IHostColorSchemeService['onDidChangeColorScheme'] = Event.None
}
registerSingleton(IHostColorSchemeService, HostColorSchemeService, InstantiationType.Eager)
class PreferencesService implements IPreferencesService {
  _serviceBrand: undefined
  constructor(
    @IUserDataProfileService
    protected readonly profileService: IUserDataProfileService
  ) {}
  onDidDefaultSettingsContentChanged: IPreferencesService['onDidDefaultSettingsContentChanged'] =
    Event.None
  getDefaultSettingsContent: IPreferencesService['getDefaultSettingsContent'] = () => undefined
  hasDefaultSettingsContent: IPreferencesService['hasDefaultSettingsContent'] = () => false
  getSetting: IPreferencesService['getSetting'] = () => undefined
  userSettingsResource: IPreferencesService['userSettingsResource'] =
    this.profileService.currentProfile.settingsResource
  workspaceSettingsResource: IPreferencesService['workspaceSettingsResource'] = null
  @Unsupported
  getFolderSettingsResource: IPreferencesService['getFolderSettingsResource'] = (): never => {
    unsupported()
  }
  @Unsupported
  createPreferencesEditorModel: IPreferencesService['createPreferencesEditorModel'] = (): never => {
    unsupported()
  }
  @Unsupported
  createSettings2EditorModel: IPreferencesService['createSettings2EditorModel'] = (): never => {
    unsupported()
  }
  @Unsupported
  openRawDefaultSettings: IPreferencesService['openRawDefaultSettings'] = (): never => {
    unsupported()
  }
  @Unsupported
  openSettings: IPreferencesService['openSettings'] = (): never => {
    unsupported()
  }
  @Unsupported
  openUserSettings: IPreferencesService['openUserSettings'] = (): never => {
    unsupported()
  }
  @Unsupported
  openRemoteSettings: IPreferencesService['openRemoteSettings'] = (): never => {
    unsupported()
  }
  @Unsupported
  openWorkspaceSettings: IPreferencesService['openWorkspaceSettings'] = (): never => {
    unsupported()
  }
  @Unsupported
  openFolderSettings: IPreferencesService['openFolderSettings'] = (): never => {
    unsupported()
  }
  @Unsupported
  openGlobalKeybindingSettings: IPreferencesService['openGlobalKeybindingSettings'] = (): never => {
    unsupported()
  }
  @Unsupported
  openDefaultKeybindingsFile: IPreferencesService['openDefaultKeybindingsFile'] = (): never => {
    unsupported()
  }
  @Unsupported
  getEditableSettingsURI: IPreferencesService['getEditableSettingsURI'] = (): never => {
    unsupported()
  }
  @Unsupported
  createSplitJsonEditorInput: IPreferencesService['createSplitJsonEditorInput'] = (): never => {
    unsupported()
  }
  @Unsupported
  openApplicationSettings: IPreferencesService['openApplicationSettings'] = (): never => {
    unsupported()
  }
  @Unsupported
  openLanguageSpecificSettings: IPreferencesService['openLanguageSpecificSettings'] = (): never => {
    unsupported()
  }
  openPreferences: IPreferencesService['openPreferences'] = async () => undefined
}
registerSingleton(IPreferencesService, PreferencesService, InstantiationType.Eager)
class NullTextMateService implements ITextMateTokenizationService {
  _serviceBrand: undefined
  @Unsupported
  startDebugMode: ITextMateTokenizationService['startDebugMode'] = (): never => {
    unsupported()
  }
  @Unsupported
  createTokenizer: ITextMateTokenizationService['createTokenizer'] = (): never => {
    unsupported()
  }
}
registerSingleton(ITextMateTokenizationService, NullTextMateService, InstantiationType.Eager)
class UserDataProfilesService implements IUserDataProfilesService {
  constructor(
    @IUserDataProfileService
    protected readonly profileService: IUserDataProfileService
  ) {}
  _serviceBrand: undefined
  onDidResetWorkspaces: IUserDataProfilesService['onDidResetWorkspaces'] = Event.None
  @Unsupported
  createNamedProfile: IUserDataProfilesService['createNamedProfile'] = (): never => {
    unsupported()
  }
  @Unsupported
  createTransientProfile: IUserDataProfilesService['createTransientProfile'] = (): never => {
    unsupported()
  }
  @Unsupported
  resetWorkspaces: IUserDataProfilesService['resetWorkspaces'] = (): never => {
    unsupported()
  }
  @Unsupported
  cleanUp: IUserDataProfilesService['cleanUp'] = (): never => {
    unsupported()
  }
  @Unsupported
  cleanUpTransientProfiles: IUserDataProfilesService['cleanUpTransientProfiles'] = (): never => {
    unsupported()
  }
  @Unsupported
  get profilesHome() {
    return unsupported()
  }
  defaultProfile: IUserDataProfilesService['defaultProfile'] = this.profileService.currentProfile
  onDidChangeProfiles: IUserDataProfilesService['onDidChangeProfiles'] = Event.None
  profiles: IUserDataProfilesService['profiles'] = [this.profileService.currentProfile]
  @Unsupported
  createProfile: IUserDataProfilesService['createProfile'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateProfile: IUserDataProfilesService['updateProfile'] = (): never => {
    unsupported()
  }
  @Unsupported
  setProfileForWorkspace: IUserDataProfilesService['setProfileForWorkspace'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeProfile: IUserDataProfilesService['removeProfile'] = (): never => {
    unsupported()
  }
}
registerSingleton(IUserDataProfilesService, UserDataProfilesService, InstantiationType.Eager)
class UserDataProfileStorageService implements IUserDataProfileStorageService {
  _serviceBrand: undefined
  onDidChange: IUserDataProfileStorageService['onDidChange'] = Event.None
  @Unsupported
  readStorageData: IUserDataProfileStorageService['readStorageData'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateStorageData: IUserDataProfileStorageService['updateStorageData'] = (): never => {
    unsupported()
  }
  @Unsupported
  withProfileScopedStorageService: IUserDataProfileStorageService['withProfileScopedStorageService'] =
    (): never => {
      unsupported()
    }
}
registerSingleton(
  IUserDataProfileStorageService,
  UserDataProfileStorageService,
  InstantiationType.Eager
)
class InjectedUserDataProfileService extends UserDataProfileService {
  constructor(
    @IEnvironmentService
    environmentService: IEnvironmentService
  ) {
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
  getSnippetFiles: ISnippetsService['getSnippetFiles'] = (): never => {
    unsupported()
  }
  @Unsupported
  isEnabled: ISnippetsService['isEnabled'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateEnablement: ISnippetsService['updateEnablement'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateUsageTimestamp: ISnippetsService['updateUsageTimestamp'] = (): never => {
    unsupported()
  }
  getSnippets: ISnippetsService['getSnippets'] = async () => []
  @Unsupported
  getSnippetsSync: ISnippetsService['getSnippetsSync'] = (): never => {
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
  setVisualizedExpression: IViewModel['setVisualizedExpression'] = (): never => {
    unsupported()
  }
  getVisualizedExpression: IViewModel['getVisualizedExpression'] = () => undefined
  onDidChangeVisualization: IViewModel['onDidChangeVisualization'] = Event.None
  @Unsupported
  getId: IViewModel['getId'] = (): never => {
    unsupported()
  }
  readonly focusedSession: IViewModel['focusedSession'] = undefined
  readonly focusedThread: IViewModel['focusedThread'] = undefined
  readonly focusedStackFrame: IViewModel['focusedStackFrame'] = undefined
  @Unsupported
  getSelectedExpression: IViewModel['getSelectedExpression'] = (): never => {
    unsupported()
  }
  @Unsupported
  setSelectedExpression: IViewModel['setSelectedExpression'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateViews: IViewModel['updateViews'] = (): never => {
    unsupported()
  }
  @Unsupported
  isMultiSessionView: IViewModel['isMultiSessionView'] = (): never => {
    unsupported()
  }
  onDidFocusSession: IViewModel['onDidFocusSession'] = Event.None
  onDidFocusStackFrame: IViewModel['onDidFocusStackFrame'] = Event.None
  onDidSelectExpression: IViewModel['onDidSelectExpression'] = Event.None
  onDidEvaluateLazyExpression: IViewModel['onDidEvaluateLazyExpression'] = Event.None
  onWillUpdateViews: IViewModel['onWillUpdateViews'] = Event.None
  onDidFocusThread: IViewModel['onDidFocusThread'] = Event.None
  @Unsupported
  evaluateLazyExpression: IViewModel['evaluateLazyExpression'] = (): never => {
    unsupported()
  }
}
class FakeAdapterManager implements IAdapterManager {
  onDidRegisterDebugger: IAdapterManager['onDidRegisterDebugger'] = Event.None
  hasEnabledDebuggers: IAdapterManager['hasEnabledDebuggers'] = () => false
  @Unsupported
  getDebugAdapterDescriptor: IAdapterManager['getDebugAdapterDescriptor'] = (): never => {
    unsupported()
  }
  @Unsupported
  getDebuggerLabel: IAdapterManager['getDebuggerLabel'] = (): never => {
    unsupported()
  }
  someDebuggerInterestedInLanguage: IAdapterManager['someDebuggerInterestedInLanguage'] = () =>
    false
  getDebugger: IAdapterManager['getDebugger'] = () => undefined
  @Unsupported
  activateDebuggers: IAdapterManager['activateDebuggers'] = (): never => {
    unsupported()
  }
  registerDebugAdapterFactory: IAdapterManager['registerDebugAdapterFactory'] = () =>
    Disposable.None
  @Unsupported
  createDebugAdapter: IAdapterManager['createDebugAdapter'] = (): never => {
    unsupported()
  }
  @Unsupported
  registerDebugAdapterDescriptorFactory: IAdapterManager['registerDebugAdapterDescriptorFactory'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  unregisterDebugAdapterDescriptorFactory: IAdapterManager['unregisterDebugAdapterDescriptorFactory'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  substituteVariables: IAdapterManager['substituteVariables'] = (): never => {
    unsupported()
  }
  @Unsupported
  runInTerminal: IAdapterManager['runInTerminal'] = (): never => {
    unsupported()
  }
  @Unsupported
  getEnabledDebugger: IAdapterManager['getEnabledDebugger'] = (): never => {
    unsupported()
  }
  @Unsupported
  guessDebugger: IAdapterManager['guessDebugger'] = (): never => {
    unsupported()
  }
  onDidDebuggersExtPointRead: IAdapterManager['onDidDebuggersExtPointRead'] = Event.None
}
class DebugService implements IDebugService {
  _serviceBrand: undefined
  initializingOptions: IDebugService['initializingOptions'] = undefined
  @Unsupported
  sendBreakpoints: IDebugService['sendBreakpoints'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateDataBreakpoint: IDebugService['updateDataBreakpoint'] = (): never => {
    unsupported()
  }
  @Unsupported
  get state() {
    return unsupported()
  }
  onDidChangeState: IDebugService['onDidChangeState'] = Event.None
  onDidNewSession: IDebugService['onDidNewSession'] = Event.None
  onWillNewSession: IDebugService['onWillNewSession'] = Event.None
  onDidEndSession: IDebugService['onDidEndSession'] = Event.None
  @Unsupported
  getConfigurationManager: IDebugService['getConfigurationManager'] = (): never => {
    unsupported()
  }
  getAdapterManager: IDebugService['getAdapterManager'] = () => new FakeAdapterManager()
  @Unsupported
  focusStackFrame: IDebugService['focusStackFrame'] = (): never => {
    unsupported()
  }
  @Unsupported
  canSetBreakpointsIn: IDebugService['canSetBreakpointsIn'] = (): never => {
    unsupported()
  }
  @Unsupported
  addBreakpoints: IDebugService['addBreakpoints'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateBreakpoints: IDebugService['updateBreakpoints'] = (): never => {
    unsupported()
  }
  @Unsupported
  enableOrDisableBreakpoints: IDebugService['enableOrDisableBreakpoints'] = (): never => {
    unsupported()
  }
  @Unsupported
  setBreakpointsActivated: IDebugService['setBreakpointsActivated'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeBreakpoints: IDebugService['removeBreakpoints'] = (): never => {
    unsupported()
  }
  @Unsupported
  addFunctionBreakpoint: IDebugService['addFunctionBreakpoint'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateFunctionBreakpoint: IDebugService['updateFunctionBreakpoint'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeFunctionBreakpoints: IDebugService['removeFunctionBreakpoints'] = (): never => {
    unsupported()
  }
  @Unsupported
  addDataBreakpoint: IDebugService['addDataBreakpoint'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeDataBreakpoints: IDebugService['removeDataBreakpoints'] = (): never => {
    unsupported()
  }
  @Unsupported
  addInstructionBreakpoint: IDebugService['addInstructionBreakpoint'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeInstructionBreakpoints: IDebugService['removeInstructionBreakpoints'] = (): never => {
    unsupported()
  }
  @Unsupported
  setExceptionBreakpointCondition: IDebugService['setExceptionBreakpointCondition'] = (): never => {
    unsupported()
  }
  @Unsupported
  setExceptionBreakpointsForSession: IDebugService['setExceptionBreakpointsForSession'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  sendAllBreakpoints: IDebugService['sendAllBreakpoints'] = (): never => {
    unsupported()
  }
  @Unsupported
  addWatchExpression: IDebugService['addWatchExpression'] = (): never => {
    unsupported()
  }
  @Unsupported
  renameWatchExpression: IDebugService['renameWatchExpression'] = (): never => {
    unsupported()
  }
  @Unsupported
  moveWatchExpression: IDebugService['moveWatchExpression'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeWatchExpressions: IDebugService['removeWatchExpressions'] = (): never => {
    unsupported()
  }
  @Unsupported
  startDebugging: IDebugService['startDebugging'] = (): never => {
    unsupported()
  }
  @Unsupported
  restartSession: IDebugService['restartSession'] = (): never => {
    unsupported()
  }
  @Unsupported
  stopSession: IDebugService['stopSession'] = (): never => {
    unsupported()
  }
  @Unsupported
  sourceIsNotAvailable: IDebugService['sourceIsNotAvailable'] = (): never => {
    unsupported()
  }
  getModel: IDebugService['getModel'] = () => debugModel
  getViewModel: IDebugService['getViewModel'] = () => new FakeViewModel()
  @Unsupported
  runTo: IDebugService['runTo'] = (): never => {
    unsupported()
  }
}
registerSingleton(IDebugService, DebugService, InstantiationType.Eager)
class RequestService implements IRequestService {
  _serviceBrand: undefined
  @Unsupported
  lookupAuthorization: IRequestService['lookupAuthorization'] = (): never => {
    unsupported()
  }
  @Unsupported
  lookupKerberosAuthorization: IRequestService['lookupKerberosAuthorization'] = (): never => {
    unsupported()
  }
  @Unsupported
  request: IRequestService['request'] = (): never => {
    unsupported()
  }
  @Unsupported
  resolveProxy: IRequestService['resolveProxy'] = (): never => {
    unsupported()
  }
  @Unsupported
  loadCertificates: IRequestService['loadCertificates'] = (): never => {
    unsupported()
  }
}
registerSingleton(IRequestService, RequestService, InstantiationType.Eager)
class WorkspaceTrustRequestService implements IWorkspaceTrustRequestService {
  _serviceBrand: undefined
  onDidInitiateOpenFilesTrustRequest: IWorkspaceTrustRequestService['onDidInitiateOpenFilesTrustRequest'] =
    Event.None
  onDidInitiateWorkspaceTrustRequest: IWorkspaceTrustRequestService['onDidInitiateWorkspaceTrustRequest'] =
    Event.None
  onDidInitiateWorkspaceTrustRequestOnStartup: IWorkspaceTrustRequestService['onDidInitiateWorkspaceTrustRequestOnStartup'] =
    Event.None
  @Unsupported
  completeOpenFilesTrustRequest: IWorkspaceTrustRequestService['completeOpenFilesTrustRequest'] =
    (): never => {
      unsupported()
    }
  requestOpenFilesTrust: IWorkspaceTrustRequestService['requestOpenFilesTrust'] = async () =>
    WorkspaceTrustUriResponse.Open
  @Unsupported
  cancelWorkspaceTrustRequest: IWorkspaceTrustRequestService['cancelWorkspaceTrustRequest'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  completeWorkspaceTrustRequest: IWorkspaceTrustRequestService['completeWorkspaceTrustRequest'] =
    (): never => {
      unsupported()
    }
  requestWorkspaceTrust: IWorkspaceTrustRequestService['requestWorkspaceTrust'] = async () => true
  requestWorkspaceTrustOnStartup: IWorkspaceTrustRequestService['requestWorkspaceTrustOnStartup'] =
    () => null
}
registerSingleton(
  IWorkspaceTrustRequestService,
  WorkspaceTrustRequestService,
  InstantiationType.Eager
)
class ActivityService implements IActivityService {
  _serviceBrand: undefined
  onDidChangeActivity: IActivityService['onDidChangeActivity'] = Event.None
  @Unsupported
  getViewContainerActivities: IActivityService['getViewContainerActivities'] = (): never => {
    unsupported()
  }
  @Unsupported
  getActivity: IActivityService['getActivity'] = (): never => {
    unsupported()
  }
  showViewContainerActivity: IActivityService['showViewContainerActivity'] = () => Disposable.None
  showViewActivity: IActivityService['showViewActivity'] = () => Disposable.None
  showAccountsActivity: IActivityService['showAccountsActivity'] = () => Disposable.None
  showGlobalActivity: IActivityService['showGlobalActivity'] = () => Disposable.None
}
registerSingleton(IActivityService, ActivityService, InstantiationType.Eager)
class ExtensionHostDebugService implements IExtensionHostDebugService {
  _serviceBrand: undefined
  @Unsupported
  reload: IExtensionHostDebugService['reload'] = (): never => {
    unsupported()
  }
  onReload: IExtensionHostDebugService['onReload'] = Event.None
  @Unsupported
  close: IExtensionHostDebugService['close'] = (): never => {
    unsupported()
  }
  onClose: IExtensionHostDebugService['onClose'] = Event.None
  @Unsupported
  attachSession: IExtensionHostDebugService['attachSession'] = (): never => {
    unsupported()
  }
  onAttachSession: IExtensionHostDebugService['onAttachSession'] = Event.None
  @Unsupported
  terminateSession: IExtensionHostDebugService['terminateSession'] = (): never => {
    unsupported()
  }
  onTerminateSession: IExtensionHostDebugService['onTerminateSession'] = Event.None
  @Unsupported
  openExtensionDevelopmentHostWindow: IExtensionHostDebugService['openExtensionDevelopmentHostWindow'] =
    (): never => {
      unsupported()
    }
}
registerSingleton(IExtensionHostDebugService, ExtensionHostDebugService, InstantiationType.Eager)
class ViewsService implements IViewsService {
  _serviceBrand: undefined
  getFocusedView: IViewsService['getFocusedView'] = () => null
  isViewContainerActive: IViewsService['isViewContainerActive'] = () => false
  @Unsupported
  getFocusedViewName: IViewsService['getFocusedViewName'] = (): never => {
    unsupported()
  }
  onDidChangeFocusedView: IViewsService['onDidChangeFocusedView'] = Event.None
  onDidChangeViewContainerVisibility: IViewsService['onDidChangeViewContainerVisibility'] =
    Event.None
  isViewContainerVisible: IViewsService['isViewContainerVisible'] = () => false
  @Unsupported
  openViewContainer: IViewsService['openViewContainer'] = (): never => {
    unsupported()
  }
  @Unsupported
  closeViewContainer: IViewsService['closeViewContainer'] = (): never => {
    unsupported()
  }
  @Unsupported
  getVisibleViewContainer: IViewsService['getVisibleViewContainer'] = (): never => {
    unsupported()
  }
  getActiveViewPaneContainerWithId: IViewsService['getActiveViewPaneContainerWithId'] = () => null
  onDidChangeViewVisibility: IViewsService['onDidChangeViewVisibility'] = Event.None
  isViewVisible: IViewsService['isViewVisible'] = () => false
  openView: IViewsService['openView'] = async () => null
  @Unsupported
  closeView: IViewsService['closeView'] = (): never => {
    unsupported()
  }
  getActiveViewWithId: IViewsService['getActiveViewWithId'] = () => null
  getViewWithId: IViewsService['getViewWithId'] = () => null
  getViewProgressIndicator: IViewsService['getViewProgressIndicator'] = () => undefined
}
registerSingleton(IViewsService, ViewsService, InstantiationType.Eager)
class ViewDescriptorService implements IViewDescriptorService {
  _serviceBrand: undefined
  viewContainers: IViewDescriptorService['viewContainers'] = []
  onDidChangeViewContainers: IViewDescriptorService['onDidChangeViewContainers'] = Event.None
  getDefaultViewContainer: IViewDescriptorService['getDefaultViewContainer'] = () => undefined
  getViewContainerById: IViewDescriptorService['getViewContainerById'] = () => null
  @Unsupported
  isViewContainerRemovedPermanently: IViewDescriptorService['isViewContainerRemovedPermanently'] =
    (): never => {
      unsupported()
    }
  getDefaultViewContainerLocation: IViewDescriptorService['getDefaultViewContainerLocation'] = () =>
    null
  getViewContainerLocation: IViewDescriptorService['getViewContainerLocation'] = () => null
  @Unsupported
  getViewContainersByLocation: IViewDescriptorService['getViewContainersByLocation'] =
    (): never => {
      unsupported()
    }
  getViewContainerModel: IViewDescriptorService['getViewContainerModel'] = () =>
    ({
      onDidChangeAllViewDescriptors: Event.None,
      visibleViewDescriptors: []
    }) as Pick<
      IViewContainerModel,
      'onDidChangeAllViewDescriptors' | 'visibleViewDescriptors'
    > as IViewContainerModel
  onDidChangeContainerLocation: IViewDescriptorService['onDidChangeContainerLocation'] = Event.None
  @Unsupported
  moveViewContainerToLocation: IViewDescriptorService['moveViewContainerToLocation'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  getViewContainerBadgeEnablementState: IViewDescriptorService['getViewContainerBadgeEnablementState'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  setViewContainerBadgeEnablementState: IViewDescriptorService['setViewContainerBadgeEnablementState'] =
    (): never => {
      unsupported()
    }
  getViewDescriptorById: IViewDescriptorService['getViewDescriptorById'] = () => null
  getViewContainerByViewId: IViewDescriptorService['getViewContainerByViewId'] = () => null
  getDefaultContainerById: IViewDescriptorService['getDefaultContainerById'] = () => null
  getViewLocationById: IViewDescriptorService['getViewLocationById'] = () => null
  onDidChangeContainer: IViewDescriptorService['onDidChangeContainer'] = Event.None
  @Unsupported
  moveViewsToContainer: IViewDescriptorService['moveViewsToContainer'] = (): never => {
    unsupported()
  }
  onDidChangeLocation: IViewDescriptorService['onDidChangeLocation'] = Event.None
  moveViewToLocation: IViewDescriptorService['moveViewToLocation'] = () => null
  reset: IViewDescriptorService['reset'] = () => null
}
registerSingleton(IViewDescriptorService, ViewDescriptorService, InstantiationType.Eager)
class HistoryService implements IHistoryService {
  _serviceBrand: undefined
  @Unsupported
  goForward: IHistoryService['goForward'] = (): never => {
    unsupported()
  }
  @Unsupported
  goBack: IHistoryService['goBack'] = (): never => {
    unsupported()
  }
  @Unsupported
  goPrevious: IHistoryService['goPrevious'] = (): never => {
    unsupported()
  }
  @Unsupported
  goLast: IHistoryService['goLast'] = (): never => {
    unsupported()
  }
  @Unsupported
  reopenLastClosedEditor: IHistoryService['reopenLastClosedEditor'] = (): never => {
    unsupported()
  }
  getHistory: IHistoryService['getHistory'] = () => []
  @Unsupported
  removeFromHistory: IHistoryService['removeFromHistory'] = (): never => {
    unsupported()
  }
  getLastActiveWorkspaceRoot: IHistoryService['getLastActiveWorkspaceRoot'] = () => undefined
  getLastActiveFile: IHistoryService['getLastActiveFile'] = () => undefined
  @Unsupported
  openNextRecentlyUsedEditor: IHistoryService['openNextRecentlyUsedEditor'] = (): never => {
    unsupported()
  }
  @Unsupported
  openPreviouslyUsedEditor: IHistoryService['openPreviouslyUsedEditor'] = (): never => {
    unsupported()
  }
  @Unsupported
  clear: IHistoryService['clear'] = (): never => {
    unsupported()
  }
  @Unsupported
  clearRecentlyOpened: IHistoryService['clearRecentlyOpened'] = (): never => {
    unsupported()
  }
}
registerSingleton(IHistoryService, HistoryService, InstantiationType.Eager)
class TaskService implements ITaskService {
  _serviceBrand: undefined
  onDidChangeTaskProviders: ITaskService['onDidChangeTaskProviders'] = Event.None
  getKnownTasks: ITaskService['getKnownTasks'] = async () => []
  onDidChangeTaskConfig: ITaskService['onDidChangeTaskConfig'] = Event.None
  onDidStateChange: ITaskService['onDidStateChange'] = Event.None
  supportsMultipleTaskExecutions: ITaskService['supportsMultipleTaskExecutions'] = false
  @Unsupported
  configureAction: ITaskService['configureAction'] = (): never => {
    unsupported()
  }
  @Unsupported
  rerun: ITaskService['rerun'] = (): never => {
    unsupported()
  }
  @Unsupported
  run: ITaskService['run'] = (): never => {
    unsupported()
  }
  inTerminal: ITaskService['inTerminal'] = () => false
  getActiveTasks: ITaskService['getActiveTasks'] = async () => []
  @Unsupported
  getBusyTasks: ITaskService['getBusyTasks'] = (): never => {
    unsupported()
  }
  @Unsupported
  terminate: ITaskService['terminate'] = (): never => {
    unsupported()
  }
  @Unsupported
  tasks: ITaskService['tasks'] = (): never => {
    unsupported()
  }
  @Unsupported
  taskTypes: ITaskService['taskTypes'] = (): never => {
    unsupported()
  }
  @Unsupported
  getWorkspaceTasks: ITaskService['getWorkspaceTasks'] = (): never => {
    unsupported()
  }
  @Unsupported
  getSavedTasks: ITaskService['getSavedTasks'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeRecentlyUsedTask: ITaskService['removeRecentlyUsedTask'] = (): never => {
    unsupported()
  }
  @Unsupported
  getTask: ITaskService['getTask'] = (): never => {
    unsupported()
  }
  @Unsupported
  tryResolveTask: ITaskService['tryResolveTask'] = (): never => {
    unsupported()
  }
  @Unsupported
  createSorter: ITaskService['createSorter'] = (): never => {
    unsupported()
  }
  @Unsupported
  getTaskDescription: ITaskService['getTaskDescription'] = (): never => {
    unsupported()
  }
  @Unsupported
  customize: ITaskService['customize'] = (): never => {
    unsupported()
  }
  @Unsupported
  openConfig: ITaskService['openConfig'] = (): never => {
    unsupported()
  }
  @Unsupported
  registerTaskProvider: ITaskService['registerTaskProvider'] = (): never => {
    unsupported()
  }
  registerTaskSystem: ITaskService['registerTaskSystem'] = () => {}
  onDidChangeTaskSystemInfo: ITaskService['onDidChangeTaskSystemInfo'] = Event.None
  hasTaskSystemInfo: ITaskService['hasTaskSystemInfo'] = false
  registerSupportedExecutions: ITaskService['registerSupportedExecutions'] = () => {}
  @Unsupported
  extensionCallbackTaskComplete: ITaskService['extensionCallbackTaskComplete'] = (): never => {
    unsupported()
  }
  isReconnected: ITaskService['isReconnected'] = false
  onDidReconnectToTasks: ITaskService['onDidReconnectToTasks'] = Event.None
}
registerSingleton(ITaskService, TaskService, InstantiationType.Eager)
class ConfigurationResolverService implements IConfigurationResolverService {
  _serviceBrand: undefined
  resolvableVariables: IConfigurationResolverService['resolvableVariables'] = new Set<string>()
  @Unsupported
  resolveWithEnvironment: IConfigurationResolverService['resolveWithEnvironment'] = (): never => {
    unsupported()
  }
  @Unsupported
  resolveAsync: IConfigurationResolverService['resolveAsync'] = (): never => {
    unsupported()
  }
  @Unsupported
  resolveWithInteractionReplace: IConfigurationResolverService['resolveWithInteractionReplace'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  resolveWithInteraction: IConfigurationResolverService['resolveWithInteraction'] = (): never => {
    unsupported()
  }
  @Unsupported
  contributeVariable: IConfigurationResolverService['contributeVariable'] = (): never => {
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
  endConnection: IRemoteAgentService['endConnection'] = (): never => {
    unsupported()
  }
  getConnection: IRemoteAgentService['getConnection'] = () => null
  getEnvironment: IRemoteAgentService['getEnvironment'] = async () => null
  getRawEnvironment: IRemoteAgentService['getRawEnvironment'] = async () => null
  getExtensionHostExitInfo: IRemoteAgentService['getExtensionHostExitInfo'] = async () => null
  getRoundTripTime: IRemoteAgentService['getRoundTripTime'] = async () => undefined
  getDiagnosticInfo: IRemoteAgentService['getDiagnosticInfo'] = async () => undefined
  updateTelemetryLevel: IRemoteAgentService['updateTelemetryLevel'] = async () => undefined
  logTelemetry: IRemoteAgentService['logTelemetry'] = async () => undefined
  flushTelemetry: IRemoteAgentService['flushTelemetry'] = async () => undefined
}
registerSingleton(IRemoteAgentService, RemoteAgentService, InstantiationType.Eager)
registerSingleton(
  ICustomEndpointTelemetryService,
  NullEndpointTelemetryService,
  InstantiationType.Eager
)
class MonacoSearchService implements ISearchService {
  _serviceBrand: undefined
  constructor(
    @IModelService
    private modelService: IModelService
  ) {}
  schemeHasFileSearchProvider: ISearchService['schemeHasFileSearchProvider'] = () => false
  getAIName: ISearchService['getAIName'] = async () => undefined
  @Unsupported
  aiTextSearch: ISearchService['aiTextSearch'] = (): never => {
    unsupported()
  }
  @Unsupported
  textSearchSplitSyncAsync: ISearchService['textSearchSplitSyncAsync'] = (): never => {
    unsupported()
  }
  textSearch: ISearchService['textSearch'] = async (): Promise<ISearchComplete> => {
    return {
      results: [],
      messages: []
    }
  }
  fileSearch: ISearchService['fileSearch'] = async (): Promise<ISearchComplete> => {
    return {
      results: this.modelService.getModels().map((model) => ({
        resource: model.uri
      })),
      messages: []
    }
  }
  clearCache: ISearchService['clearCache'] = async (): Promise<void> => {}
  @Unsupported
  registerSearchResultProvider: ISearchService['registerSearchResultProvider'] = (): never => {
    unsupported()
  }
}
registerSingleton(ISearchService, MonacoSearchService, InstantiationType.Eager)
class EditSessionIdentityService implements IEditSessionIdentityService {
  _serviceBrand: undefined
  registerEditSessionIdentityProvider: IEditSessionIdentityService['registerEditSessionIdentityProvider'] =
    () => Disposable.None
  getEditSessionIdentifier: IEditSessionIdentityService['getEditSessionIdentifier'] = async () =>
    undefined
  provideEditSessionIdentityMatch: IEditSessionIdentityService['provideEditSessionIdentityMatch'] =
    async () => undefined
  addEditSessionIdentityCreateParticipant: IEditSessionIdentityService['addEditSessionIdentityCreateParticipant'] =
    () => Disposable.None
  onWillCreateEditSessionIdentity: IEditSessionIdentityService['onWillCreateEditSessionIdentity'] =
    async () => {}
}
registerSingleton(IEditSessionIdentityService, EditSessionIdentityService, InstantiationType.Eager)
class WorkspaceEditingService implements IWorkspaceEditingService {
  _serviceBrand: undefined
  @Unsupported
  addFolders: IWorkspaceEditingService['addFolders'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeFolders: IWorkspaceEditingService['removeFolders'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateFolders: IWorkspaceEditingService['updateFolders'] = (): never => {
    unsupported()
  }
  @Unsupported
  enterWorkspace: IWorkspaceEditingService['enterWorkspace'] = (): never => {
    unsupported()
  }
  @Unsupported
  createAndEnterWorkspace: IWorkspaceEditingService['createAndEnterWorkspace'] = (): never => {
    unsupported()
  }
  @Unsupported
  saveAndEnterWorkspace: IWorkspaceEditingService['saveAndEnterWorkspace'] = (): never => {
    unsupported()
  }
  @Unsupported
  copyWorkspaceSettings: IWorkspaceEditingService['copyWorkspaceSettings'] = (): never => {
    unsupported()
  }
  @Unsupported
  pickNewWorkspacePath: IWorkspaceEditingService['pickNewWorkspacePath'] = (): never => {
    unsupported()
  }
}
registerSingleton(IWorkspaceEditingService, WorkspaceEditingService, InstantiationType.Eager)
class TimerService implements ITimerService {
  _serviceBrand: undefined
  @Unsupported
  getStartTime: ITimerService['getStartTime'] = (): never => {
    unsupported()
  }
  @Unsupported
  whenReady: ITimerService['whenReady'] = (): never => {
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
  setPerformanceMarks: ITimerService['setPerformanceMarks'] = () => {}
  @Unsupported
  getPerformanceMarks: ITimerService['getPerformanceMarks'] = (): never => {
    unsupported()
  }
  @Unsupported
  getDuration: ITimerService['getDuration'] = (): never => {
    unsupported()
  }
}
registerSingleton(ITimerService, TimerService, InstantiationType.Eager)
class ExtensionsWorkbenchService implements IExtensionsWorkbenchService {
  _serviceBrand: undefined
  @Unsupported
  downloadVSIX: IExtensionsWorkbenchService['downloadVSIX'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateAutoUpdateForAllExtensions: IExtensionsWorkbenchService['updateAutoUpdateForAllExtensions'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  openSearch: IExtensionsWorkbenchService['openSearch'] = (): never => {
    unsupported()
  }
  getExtensionRuntimeStatus: IExtensionsWorkbenchService['getExtensionRuntimeStatus'] = () =>
    undefined
  onDidChangeExtensionsNotification: IExtensionsWorkbenchService['onDidChangeExtensionsNotification'] =
    Event.None
  getExtensionsNotification: IExtensionsWorkbenchService['getExtensionsNotification'] = () =>
    undefined
  shouldRequireConsentToUpdate: IExtensionsWorkbenchService['shouldRequireConsentToUpdate'] =
    async () => undefined
  @Unsupported
  getResourceExtensions: IExtensionsWorkbenchService['getResourceExtensions'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateRunningExtensions: IExtensionsWorkbenchService['updateRunningExtensions'] = (): never => {
    unsupported()
  }
  @Unsupported
  togglePreRelease: IExtensionsWorkbenchService['togglePreRelease'] = (): never => {
    unsupported()
  }
  @Unsupported
  isAutoUpdateEnabledFor: IExtensionsWorkbenchService['isAutoUpdateEnabledFor'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateAutoUpdateEnablementFor: IExtensionsWorkbenchService['updateAutoUpdateEnablementFor'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  getAutoUpdateValue: IExtensionsWorkbenchService['getAutoUpdateValue'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateAll: IExtensionsWorkbenchService['updateAll'] = (): never => {
    unsupported()
  }
  @Unsupported
  toggleApplyExtensionToAllProfiles: IExtensionsWorkbenchService['toggleApplyExtensionToAllProfiles'] =
    (): never => {
      unsupported()
    }
  whenInitialized: IExtensionsWorkbenchService['whenInitialized'] = Promise.resolve()
  onChange: IExtensionsWorkbenchService['onChange'] = Event.None
  onReset: IExtensionsWorkbenchService['onReset'] = Event.None
  local: IExtensionsWorkbenchService['local'] = []
  installed: IExtensionsWorkbenchService['installed'] = []
  outdated: IExtensionsWorkbenchService['outdated'] = []
  @Unsupported
  queryLocal: IExtensionsWorkbenchService['queryLocal'] = (): never => {
    unsupported()
  }
  @Unsupported
  queryGallery: IExtensionsWorkbenchService['queryGallery'] = (): never => {
    unsupported()
  }
  @Unsupported
  getExtensions: IExtensionsWorkbenchService['getExtensions'] = (): never => {
    unsupported()
  }
  @Unsupported
  canInstall: IExtensionsWorkbenchService['canInstall'] = (): never => {
    unsupported()
  }
  @Unsupported
  install: IExtensionsWorkbenchService['install'] = (): never => {
    unsupported()
  }
  @Unsupported
  installInServer: IExtensionsWorkbenchService['installInServer'] = (): never => {
    unsupported()
  }
  @Unsupported
  uninstall: IExtensionsWorkbenchService['uninstall'] = (): never => {
    unsupported()
  }
  @Unsupported
  canSetLanguage: IExtensionsWorkbenchService['canSetLanguage'] = (): never => {
    unsupported()
  }
  @Unsupported
  setLanguage: IExtensionsWorkbenchService['setLanguage'] = (): never => {
    unsupported()
  }
  @Unsupported
  setEnablement: IExtensionsWorkbenchService['setEnablement'] = (): never => {
    unsupported()
  }
  @Unsupported
  open: IExtensionsWorkbenchService['open'] = (): never => {
    unsupported()
  }
  @Unsupported
  checkForUpdates: IExtensionsWorkbenchService['checkForUpdates'] = (): never => {
    unsupported()
  }
  @Unsupported
  isExtensionIgnoredToSync: IExtensionsWorkbenchService['isExtensionIgnoredToSync'] = (): never => {
    unsupported()
  }
  @Unsupported
  toggleExtensionIgnoredToSync: IExtensionsWorkbenchService['toggleExtensionIgnoredToSync'] =
    (): never => {
      unsupported()
    }
}
registerSingleton(IExtensionsWorkbenchService, ExtensionsWorkbenchService, InstantiationType.Eager)
class ExtensionManagementServerService implements IExtensionManagementServerService {
  _serviceBrand: IExtensionManagementServerService['_serviceBrand'] = undefined
  localExtensionManagementServer: IExtensionManagementServerService['localExtensionManagementServer'] =
    null
  remoteExtensionManagementServer: IExtensionManagementServerService['remoteExtensionManagementServer'] =
    null
  webExtensionManagementServer: IExtensionManagementServerService['webExtensionManagementServer'] =
    null
  @Unsupported
  getExtensionManagementServer: IExtensionManagementServerService['getExtensionManagementServer'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  getExtensionInstallLocation: IExtensionManagementServerService['getExtensionInstallLocation'] =
    (): never => {
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
  onDidChangeRecommendations: IExtensionRecommendationsService['onDidChangeRecommendations'] =
    Event.None
  getAllRecommendationsWithReason: IExtensionRecommendationsService['getAllRecommendationsWithReason'] =
    () => ({})
  getImportantRecommendations: IExtensionRecommendationsService['getImportantRecommendations'] =
    async () => []
  getOtherRecommendations: IExtensionRecommendationsService['getOtherRecommendations'] =
    async () => []
  getFileBasedRecommendations: IExtensionRecommendationsService['getFileBasedRecommendations'] =
    () => []
  getExeBasedRecommendations: IExtensionRecommendationsService['getExeBasedRecommendations'] =
    async () => ({ important: [], others: [] })
  getConfigBasedRecommendations: IExtensionRecommendationsService['getConfigBasedRecommendations'] =
    async () => ({ important: [], others: [] })
  getWorkspaceRecommendations: IExtensionRecommendationsService['getWorkspaceRecommendations'] =
    async () => []
  getKeymapRecommendations: IExtensionRecommendationsService['getKeymapRecommendations'] = () => []
  getLanguageRecommendations: IExtensionRecommendationsService['getLanguageRecommendations'] =
    () => []
  getRemoteRecommendations: IExtensionRecommendationsService['getRemoteRecommendations'] = () => []
}
registerSingleton(
  IExtensionRecommendationsService,
  ExtensionRecommendationsService,
  InstantiationType.Eager
)
class UserDataAutoSyncService implements IUserDataAutoSyncService {
  _serviceBrand: undefined
  readonly onError: IUserDataAutoSyncService['onError'] = Event.None
  @Unsupported
  turnOn: IUserDataAutoSyncService['turnOn'] = (): never => {
    unsupported()
  }
  @Unsupported
  turnOff: IUserDataAutoSyncService['turnOff'] = (): never => {
    unsupported()
  }
  @Unsupported
  triggerSync: IUserDataAutoSyncService['triggerSync'] = (): never => {
    unsupported()
  }
}
registerSingleton(IUserDataAutoSyncService, UserDataAutoSyncService, InstantiationType.Eager)
class IgnoredExtensionsManagementService implements IIgnoredExtensionsManagementService {
  _serviceBrand: undefined
  getIgnoredExtensions: IIgnoredExtensionsManagementService['getIgnoredExtensions'] = () => []
  hasToNeverSyncExtension: IIgnoredExtensionsManagementService['hasToNeverSyncExtension'] = () =>
    false
  hasToAlwaysSyncExtension: IIgnoredExtensionsManagementService['hasToAlwaysSyncExtension'] = () =>
    false
  @Unsupported
  updateIgnoredExtensions: IIgnoredExtensionsManagementService['updateIgnoredExtensions'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  updateSynchronizedExtensions: IIgnoredExtensionsManagementService['updateSynchronizedExtensions'] =
    (): never => {
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
  readonly ignoredRecommendations: IExtensionRecommendationNotificationService['ignoredRecommendations'] =
    []
  hasToIgnoreRecommendationNotifications: IExtensionRecommendationNotificationService['hasToIgnoreRecommendationNotifications'] =
    () => false
  @Unsupported
  promptImportantExtensionsInstallNotification: IExtensionRecommendationNotificationService['promptImportantExtensionsInstallNotification'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  promptWorkspaceRecommendations: IExtensionRecommendationNotificationService['promptWorkspaceRecommendations'] =
    (): never => {
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
  scanSystemExtensions: IWebExtensionsScannerService['scanSystemExtensions'] = async () => []
  scanUserExtensions: IWebExtensionsScannerService['scanUserExtensions'] = async () => []
  scanExtensionsUnderDevelopment: IWebExtensionsScannerService['scanExtensionsUnderDevelopment'] =
    async () => []
  scanExistingExtension: IWebExtensionsScannerService['scanExistingExtension'] = async () => null
  @Unsupported
  addExtension: IWebExtensionsScannerService['addExtension'] = (): never => {
    unsupported()
  }
  @Unsupported
  addExtensionFromGallery: IWebExtensionsScannerService['addExtensionFromGallery'] = (): never => {
    unsupported()
  }
  removeExtension: IWebExtensionsScannerService['removeExtension'] = async () => {}
  copyExtensions: IWebExtensionsScannerService['copyExtensions'] = async () => {}
  @Unsupported
  updateMetadata: IWebExtensionsScannerService['updateMetadata'] = (): never => {
    unsupported()
  }
  scanExtensionManifest: IWebExtensionsScannerService['scanExtensionManifest'] = async () => null
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
  onDidChangeCache: IExtensionsScannerService['onDidChangeCache'] = Event.None
  @Unsupported
  scanAllExtensions: IExtensionsScannerService['scanAllExtensions'] = (): never => {
    unsupported()
  }
  @Unsupported
  scanSystemExtensions: IExtensionsScannerService['scanSystemExtensions'] = (): never => {
    unsupported()
  }
  @Unsupported
  scanUserExtensions: IExtensionsScannerService['scanUserExtensions'] = (): never => {
    unsupported()
  }
  @Unsupported
  scanExtensionsUnderDevelopment: IExtensionsScannerService['scanExtensionsUnderDevelopment'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  scanExistingExtension: IExtensionsScannerService['scanExistingExtension'] = (): never => {
    unsupported()
  }
  @Unsupported
  scanOneOrMultipleExtensions: IExtensionsScannerService['scanOneOrMultipleExtensions'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  scanMultipleExtensions: IExtensionsScannerService['scanMultipleExtensions'] = (): never => {
    unsupported()
  }
  @Unsupported
  scanAllUserExtensions: IExtensionsScannerService['scanAllUserExtensions'] = (): never => {
    unsupported()
  }
  @Unsupported
  initializeDefaultProfileExtensions: IExtensionsScannerService['initializeDefaultProfileExtensions'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  updateManifestMetadata: IExtensionsScannerService['updateManifestMetadata'] = (): never => {
    unsupported()
  }
}
registerSingleton(IExtensionsScannerService, ExtensionsScannerService, InstantiationType.Eager)
class ExtensionsProfileScannerService implements IExtensionsProfileScannerService {
  _serviceBrand: undefined
  onAddExtensions: IExtensionsProfileScannerService['onAddExtensions'] = Event.None
  onDidAddExtensions: IExtensionsProfileScannerService['onDidAddExtensions'] = Event.None
  onRemoveExtensions: IExtensionsProfileScannerService['onRemoveExtensions'] = Event.None
  onDidRemoveExtensions: IExtensionsProfileScannerService['onDidRemoveExtensions'] = Event.None
  @Unsupported
  scanProfileExtensions: IExtensionsProfileScannerService['scanProfileExtensions'] = (): never => {
    unsupported()
  }
  @Unsupported
  addExtensionsToProfile: IExtensionsProfileScannerService['addExtensionsToProfile'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  updateMetadata: IExtensionsProfileScannerService['updateMetadata'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeExtensionsFromProfile: IExtensionsProfileScannerService['removeExtensionsFromProfile'] =
    (): never => {
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
  onDidChangeIgnoredRecommendations: IExtensionIgnoredRecommendationsService['onDidChangeIgnoredRecommendations'] =
    Event.None
  ignoredRecommendations: IExtensionIgnoredRecommendationsService['ignoredRecommendations'] = []
  onDidChangeGlobalIgnoredRecommendation: IExtensionIgnoredRecommendationsService['onDidChangeGlobalIgnoredRecommendation'] =
    Event.None
  globalIgnoredRecommendations: IExtensionIgnoredRecommendationsService['globalIgnoredRecommendations'] =
    []
  @Unsupported
  toggleGlobalIgnoredRecommendation: IExtensionIgnoredRecommendationsService['toggleGlobalIgnoredRecommendation'] =
    (): never => {
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
  onDidChangeExtensionsConfigs: IWorkspaceExtensionsConfigService['onDidChangeExtensionsConfigs'] =
    Event.None
  @Unsupported
  getExtensionsConfigs: IWorkspaceExtensionsConfigService['getExtensionsConfigs'] = (): never => {
    unsupported()
  }
  @Unsupported
  getRecommendations: IWorkspaceExtensionsConfigService['getRecommendations'] = (): never => {
    unsupported()
  }
  @Unsupported
  getUnwantedRecommendations: IWorkspaceExtensionsConfigService['getUnwantedRecommendations'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  toggleRecommendation: IWorkspaceExtensionsConfigService['toggleRecommendation'] = (): never => {
    unsupported()
  }
  @Unsupported
  toggleUnwantedRecommendation: IWorkspaceExtensionsConfigService['toggleUnwantedRecommendation'] =
    (): never => {
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
  getEnablementStates: IWorkbenchExtensionEnablementService['getEnablementStates'] = (
    extensions: IExtension[]
  ) => extensions.map(() => EnablementState.EnabledGlobally)
  onEnablementChanged: IWorkbenchExtensionEnablementService['onEnablementChanged'] = Event.None
  getEnablementState: IWorkbenchExtensionEnablementService['getEnablementState'] = () =>
    EnablementState.EnabledGlobally
  getDependenciesEnablementStates: IWorkbenchExtensionEnablementService['getDependenciesEnablementStates'] =
    () => []
  canChangeEnablement: IWorkbenchExtensionEnablementService['canChangeEnablement'] = () => false
  canChangeWorkspaceEnablement: IWorkbenchExtensionEnablementService['canChangeWorkspaceEnablement'] =
    () => false
  isEnabled: IWorkbenchExtensionEnablementService['isEnabled'] = () => true
  isEnabledEnablementState: IWorkbenchExtensionEnablementService['isEnabledEnablementState'] = () =>
    true
  isDisabledGlobally: IWorkbenchExtensionEnablementService['isDisabledGlobally'] = () => false
  @Unsupported
  setEnablement: IWorkbenchExtensionEnablementService['setEnablement'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateExtensionsEnablementsWhenWorkspaceTrustChanges: IWorkbenchExtensionEnablementService['updateExtensionsEnablementsWhenWorkspaceTrustChanges'] =
    (): never => {
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
  canChangeProtocol: ITunnelService['canChangeProtocol'] = false
  tunnels: ITunnelService['tunnels'] = Promise.resolve([])
  canChangePrivacy: ITunnelService['canChangePrivacy'] = false
  privacyOptions: ITunnelService['privacyOptions'] = []
  onTunnelOpened: ITunnelService['onTunnelOpened'] = Event.None
  onTunnelClosed: ITunnelService['onTunnelClosed'] = Event.None
  canElevate: ITunnelService['canElevate'] = false
  hasTunnelProvider: ITunnelService['hasTunnelProvider'] = false
  onAddedTunnelProvider: ITunnelService['onAddedTunnelProvider'] = Event.None
  canTunnel: ITunnelService['canTunnel'] = () => false
  @Unsupported
  openTunnel: ITunnelService['openTunnel'] = (): never => {
    unsupported()
  }
  getExistingTunnel: ITunnelService['getExistingTunnel'] = async () => undefined
  @Unsupported
  setEnvironmentTunnel: ITunnelService['setEnvironmentTunnel'] = (): never => {
    unsupported()
  }
  @Unsupported
  closeTunnel: ITunnelService['closeTunnel'] = (): never => {
    unsupported()
  }
  @Unsupported
  setTunnelProvider: ITunnelService['setTunnelProvider'] = (): never => {
    unsupported()
  }
  @Unsupported
  setTunnelFeatures: ITunnelService['setTunnelFeatures'] = (): never => {
    unsupported()
  }
  isPortPrivileged: ITunnelService['isPortPrivileged'] = () => false
}
registerSingleton(ITunnelService, TunnelService, InstantiationType.Eager)
class FilesConfigurationService implements IFilesConfigurationService {
  _serviceBrand: undefined
  onDidChangeAutoSaveConfiguration: IFilesConfigurationService['onDidChangeAutoSaveConfiguration'] =
    Event.None
  onDidChangeAutoSaveDisabled: IFilesConfigurationService['onDidChangeAutoSaveDisabled'] =
    Event.None
  hasShortAutoSaveDelay: IFilesConfigurationService['hasShortAutoSaveDelay'] = () => false
  @Unsupported
  disableAutoSave: IFilesConfigurationService['disableAutoSave'] = (): never => {
    unsupported()
  }
  @Unsupported
  enableAutoSaveAfterShortDelay: IFilesConfigurationService['enableAutoSaveAfterShortDelay'] =
    (): never => {
      unsupported()
    }
  onDidChangeReadonly: IFilesConfigurationService['onDidChangeReadonly'] = Event.None
  onDidChangeFilesAssociation: IFilesConfigurationService['onDidChangeFilesAssociation'] =
    Event.None
  @Unsupported
  getAutoSaveConfiguration: IFilesConfigurationService['getAutoSaveConfiguration'] = (): never => {
    unsupported()
  }
  @Unsupported
  getAutoSaveMode: IFilesConfigurationService['getAutoSaveMode'] = (): never => {
    unsupported()
  }
  @Unsupported
  toggleAutoSave: IFilesConfigurationService['toggleAutoSave'] = (): never => {
    unsupported()
  }
  @Unsupported
  isReadonly: IFilesConfigurationService['isReadonly'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateReadonly: IFilesConfigurationService['updateReadonly'] = (): never => {
    unsupported()
  }
  isHotExitEnabled: IFilesConfigurationService['isHotExitEnabled'] = true
  hotExitConfiguration: IFilesConfigurationService['hotExitConfiguration'] = undefined
  @Unsupported
  preventSaveConflicts: IFilesConfigurationService['preventSaveConflicts'] = (): never => {
    unsupported()
  }
}
registerSingleton(IFilesConfigurationService, FilesConfigurationService, InstantiationType.Eager)
class UntitledTextEditorService implements IUntitledTextEditorService {
  _serviceBrand: undefined
  onDidSave: IUntitledTextEditorService['onDidSave'] = Event.None
  onDidCreate: IUntitledTextEditorService['onDidCreate'] = Event.None
  canDispose: IUntitledTextEditorService['canDispose'] = (): true | Promise<true> => true
  isUntitledWithAssociatedResource: IUntitledTextEditorService['isUntitledWithAssociatedResource'] =
    () => false
  onDidChangeDirty: IUntitledTextEditorService['onDidChangeDirty'] = Event.None
  onDidChangeEncoding: IUntitledTextEditorService['onDidChangeEncoding'] = Event.None
  onDidChangeLabel: IUntitledTextEditorService['onDidChangeLabel'] = Event.None
  onWillDispose: IUntitledTextEditorService['onWillDispose'] = Event.None
  @Unsupported
  create: IUntitledTextEditorService['create'] = (): never => {
    unsupported()
  }
  get: IUntitledTextEditorService['get'] = () => undefined
  getValue: IUntitledTextEditorService['getValue'] = () => undefined
  @Unsupported
  resolve: IUntitledTextEditorService['resolve'] = (): never => {
    unsupported()
  }
}
registerSingleton(IUntitledTextEditorService, UntitledTextEditorService, InstantiationType.Eager)
class WorkingCopyBackupService implements IWorkingCopyBackupService {
  _serviceBrand: undefined
  hasBackups: IWorkingCopyBackupService['hasBackups'] = async (): Promise<boolean> => {
    return false
  }
  hasBackupSync: IWorkingCopyBackupService['hasBackupSync'] = (): boolean => {
    return false
  }
  getBackups: IWorkingCopyBackupService['getBackups'] = async (): Promise<
    readonly IWorkingCopyIdentifier[]
  > => {
    return []
  }
  resolve: IWorkingCopyBackupService['resolve'] = async <
    T extends IWorkingCopyBackupMeta
  >(): Promise<IResolvedWorkingCopyBackup<T> | undefined> => {
    return undefined
  }
  backup: IWorkingCopyBackupService['backup'] = async (): Promise<void> => {}
  discardBackup: IWorkingCopyBackupService['discardBackup'] = async (): Promise<void> => {}
  discardBackups: IWorkingCopyBackupService['discardBackups'] = async (): Promise<void> => {}
}
registerSingleton(IWorkingCopyBackupService, WorkingCopyBackupService, InstantiationType.Eager)
class WorkingCopyService implements IWorkingCopyService {
  _serviceBrand: undefined
  onDidRegister: IWorkingCopyService['onDidRegister'] = Event.None
  onDidUnregister: IWorkingCopyService['onDidUnregister'] = Event.None
  onDidChangeDirty: IWorkingCopyService['onDidChangeDirty'] = Event.None
  onDidChangeContent: IWorkingCopyService['onDidChangeContent'] = Event.None
  onDidSave: IWorkingCopyService['onDidSave'] = Event.None
  dirtyCount: IWorkingCopyService['dirtyCount'] = 0
  dirtyWorkingCopies: IWorkingCopyService['dirtyWorkingCopies'] = []
  modifiedCount: IWorkingCopyService['modifiedCount'] = 0
  modifiedWorkingCopies: IWorkingCopyService['modifiedWorkingCopies'] = []
  hasDirty: IWorkingCopyService['hasDirty'] = false
  isDirty: IWorkingCopyService['isDirty'] = () => false
  workingCopies: IWorkingCopyService['workingCopies'] = []
  registerWorkingCopy: IWorkingCopyService['registerWorkingCopy'] = (): IDisposable => {
    // ignore
    return Disposable.None
  }
  has: IWorkingCopyService['has'] = () => false
  get: IWorkingCopyService['get'] = () => undefined
  getAll: IWorkingCopyService['getAll'] = () => undefined
}
registerSingleton(IWorkingCopyService, WorkingCopyService, InstantiationType.Eager)
class DecorationsService implements IDecorationsService {
  _serviceBrand: undefined
  onDidChangeDecorations: IDecorationsService['onDidChangeDecorations'] = Event.None
  @Unsupported
  registerDecorationsProvider: IDecorationsService['registerDecorationsProvider'] = (): never => {
    unsupported()
  }
  getDecoration: IDecorationsService['getDecoration'] = () => undefined
}
registerSingleton(IDecorationsService, DecorationsService, InstantiationType.Eager)
class ElevatedFileService implements IElevatedFileService {
  _serviceBrand: undefined
  isSupported: IElevatedFileService['isSupported'] = () => false
  @Unsupported
  writeFileElevated: IElevatedFileService['writeFileElevated'] = (): never => {
    unsupported()
  }
}
registerSingleton(IElevatedFileService, ElevatedFileService, InstantiationType.Eager)
class FileDialogService implements IFileDialogService {
  @Unsupported
  preferredHome: IFileDialogService['preferredHome'] = (): never => {
    unsupported()
  }
  _serviceBrand: undefined
  @Unsupported
  defaultFilePath: IFileDialogService['defaultFilePath'] = (): never => {
    unsupported()
  }
  @Unsupported
  defaultFolderPath: IFileDialogService['defaultFolderPath'] = (): never => {
    unsupported()
  }
  @Unsupported
  defaultWorkspacePath: IFileDialogService['defaultWorkspacePath'] = (): never => {
    unsupported()
  }
  @Unsupported
  pickFileFolderAndOpen: IFileDialogService['pickFileFolderAndOpen'] = (): never => {
    unsupported()
  }
  @Unsupported
  pickFileAndOpen: IFileDialogService['pickFileAndOpen'] = (): never => {
    unsupported()
  }
  @Unsupported
  pickFolderAndOpen: IFileDialogService['pickFolderAndOpen'] = (): never => {
    unsupported()
  }
  @Unsupported
  pickWorkspaceAndOpen: IFileDialogService['pickWorkspaceAndOpen'] = (): never => {
    unsupported()
  }
  @Unsupported
  pickFileToSave: IFileDialogService['pickFileToSave'] = (): never => {
    unsupported()
  }
  @Unsupported
  showSaveDialog: IFileDialogService['showSaveDialog'] = (): never => {
    unsupported()
  }
  @Unsupported
  showSaveConfirm: IFileDialogService['showSaveConfirm'] = (): never => {
    unsupported()
  }
  @Unsupported
  showOpenDialog: IFileDialogService['showOpenDialog'] = (): never => {
    unsupported()
  }
}
registerSingleton(IFileDialogService, FileDialogService, InstantiationType.Eager)
class JSONEditingService implements IJSONEditingService {
  _serviceBrand: undefined
  @Unsupported
  write: IJSONEditingService['write'] = (): never => {
    unsupported()
  }
}
registerSingleton(IJSONEditingService, JSONEditingService, InstantiationType.Delayed)
class WorkspacesService implements IWorkspacesService {
  _serviceBrand: undefined
  @Unsupported
  enterWorkspace: IWorkspacesService['enterWorkspace'] = (): never => {
    unsupported()
  }
  @Unsupported
  createUntitledWorkspace: IWorkspacesService['createUntitledWorkspace'] = (): never => {
    unsupported()
  }
  @Unsupported
  deleteUntitledWorkspace: IWorkspacesService['deleteUntitledWorkspace'] = (): never => {
    unsupported()
  }
  @Unsupported
  getWorkspaceIdentifier: IWorkspacesService['getWorkspaceIdentifier'] = (): never => {
    unsupported()
  }
  onDidChangeRecentlyOpened: IWorkspacesService['onDidChangeRecentlyOpened'] = Event.None
  @Unsupported
  addRecentlyOpened: IWorkspacesService['addRecentlyOpened'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeRecentlyOpened: IWorkspacesService['removeRecentlyOpened'] = (): never => {
    unsupported()
  }
  @Unsupported
  clearRecentlyOpened: IWorkspacesService['clearRecentlyOpened'] = (): never => {
    unsupported()
  }
  @Unsupported
  getRecentlyOpened: IWorkspacesService['getRecentlyOpened'] = (): never => {
    unsupported()
  }
  @Unsupported
  getDirtyWorkspaces: IWorkspacesService['getDirtyWorkspaces'] = (): never => {
    unsupported()
  }
}
registerSingleton(IWorkspacesService, WorkspacesService, InstantiationType.Delayed)
class TextEditorService implements ITextEditorService {
  _serviceBrand: undefined
  @Unsupported
  createTextEditor: ITextEditorService['createTextEditor'] = (): never => {
    unsupported()
  }
  @Unsupported
  resolveTextEditor: ITextEditorService['resolveTextEditor'] = (): never => {
    unsupported()
  }
}
registerSingleton(ITextEditorService, TextEditorService, InstantiationType.Eager)
class EditorResolverService implements IEditorResolverService {
  @Unsupported
  getAllUserAssociations: IEditorResolverService['getAllUserAssociations'] = (): never => {
    unsupported()
  }
  _serviceBrand: undefined
  @Unsupported
  getAssociationsForResource: IEditorResolverService['getAssociationsForResource'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateUserAssociations: IEditorResolverService['updateUserAssociations'] = (): never => {
    unsupported()
  }
  onDidChangeEditorRegistrations: IEditorResolverService['onDidChangeEditorRegistrations'] =
    Event.None
  @Unsupported
  bufferChangeEvents: IEditorResolverService['bufferChangeEvents'] = (): never => {
    unsupported()
  }
  registerEditor: IEditorResolverService['registerEditor'] = () => {
    // do nothing
    return {
      dispose: () => {}
    }
  }
  @Unsupported
  resolveEditor: IEditorResolverService['resolveEditor'] = (): never => {
    unsupported()
  }
  getEditors: IEditorResolverService['getEditors'] = () => []
}
registerSingleton(IEditorResolverService, EditorResolverService, InstantiationType.Eager)
class OutputService implements IOutputService {
  _serviceBrand: undefined
  @Unsupported
  get filters() {
    return unsupported()
  }
  canSetLogLevel: IOutputService['canSetLogLevel'] = () => false
  getLogLevel: IOutputService['getLogLevel'] = () => undefined
  setLogLevel: IOutputService['setLogLevel'] = () => {}
  getChannel: IOutputService['getChannel'] = (): IOutputChannel | undefined => {
    return undefined
  }
  @Unsupported
  registerCompoundLogChannel: IOutputService['registerCompoundLogChannel'] = (): never => {
    unsupported()
  }
  @Unsupported
  saveOutputAs: IOutputService['saveOutputAs'] = (): never => {
    unsupported()
  }
  getChannelDescriptor: IOutputService['getChannelDescriptor'] = ():
    | IOutputChannelDescriptor
    | undefined => {
    return undefined
  }
  getChannelDescriptors: IOutputService['getChannelDescriptors'] =
    (): IOutputChannelDescriptor[] => {
      return []
    }
  getActiveChannel: IOutputService['getActiveChannel'] = (): IOutputChannel | undefined => {
    return undefined
  }
  showChannel: IOutputService['showChannel'] = async (): Promise<void> => {
    // ignore
  }
  onActiveOutputChannel: IOutputService['onActiveOutputChannel'] = Event.None
}
registerSingleton(IOutputService, OutputService, InstantiationType.Delayed)
class ExtensionResourceLoaderService implements IExtensionResourceLoaderService {
  _serviceBrand: undefined
  @Unsupported
  readExtensionResource: IExtensionResourceLoaderService['readExtensionResource'] = (): never => {
    unsupported()
  }
  supportsExtensionGalleryResources: IExtensionResourceLoaderService['supportsExtensionGalleryResources'] =
    async () => false
  isExtensionGalleryResource: IExtensionResourceLoaderService['isExtensionGalleryResource'] =
    async () => false
  @Unsupported
  getExtensionGalleryResourceURL: IExtensionResourceLoaderService['getExtensionGalleryResourceURL'] =
    (): never => {
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
  scanBuiltinExtensions: IBuiltinExtensionsScannerService['scanBuiltinExtensions'] = () => {
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
  roots: IExplorerService['roots'] = []
  @Unsupported
  get sortOrderConfiguration() {
    return unsupported()
  }
  @Unsupported
  getContext: IExplorerService['getContext'] = (): never => {
    unsupported()
  }
  @Unsupported
  hasViewFocus: IExplorerService['hasViewFocus'] = (): never => {
    unsupported()
  }
  @Unsupported
  setEditable: IExplorerService['setEditable'] = (): never => {
    unsupported()
  }
  @Unsupported
  getEditable: IExplorerService['getEditable'] = (): never => {
    unsupported()
  }
  @Unsupported
  getEditableData: IExplorerService['getEditableData'] = (): never => {
    unsupported()
  }
  @Unsupported
  isEditable: IExplorerService['isEditable'] = (): never => {
    unsupported()
  }
  @Unsupported
  findClosest: IExplorerService['findClosest'] = (): never => {
    unsupported()
  }
  @Unsupported
  findClosestRoot: IExplorerService['findClosestRoot'] = (): never => {
    unsupported()
  }
  @Unsupported
  refresh: IExplorerService['refresh'] = (): never => {
    unsupported()
  }
  @Unsupported
  setToCopy: IExplorerService['setToCopy'] = (): never => {
    unsupported()
  }
  @Unsupported
  isCut: IExplorerService['isCut'] = (): never => {
    unsupported()
  }
  @Unsupported
  applyBulkEdit: IExplorerService['applyBulkEdit'] = (): never => {
    unsupported()
  }
  @Unsupported
  select: IExplorerService['select'] = (): never => {
    unsupported()
  }
  @Unsupported
  registerView: IExplorerService['registerView'] = (): never => {
    unsupported()
  }
}
registerSingleton(IExplorerService, ExplorerService, InstantiationType.Delayed)
class ExtensionStorageService implements IExtensionStorageService {
  _serviceBrand: undefined
  getExtensionState: IExtensionStorageService['getExtensionState'] = () => undefined
  getExtensionStateRaw: IExtensionStorageService['getExtensionStateRaw'] = () => undefined
  @Unsupported
  setExtensionState: IExtensionStorageService['setExtensionState'] = (): never => {
    unsupported()
  }
  onDidChangeExtensionStorageToSync: IExtensionStorageService['onDidChangeExtensionStorageToSync'] =
    Event.None
  @Unsupported
  setKeysForSync: IExtensionStorageService['setKeysForSync'] = (): never => {
    unsupported()
  }
  getKeysForSync: IExtensionStorageService['getKeysForSync'] = () => undefined
  @Unsupported
  addToMigrationList: IExtensionStorageService['addToMigrationList'] = (): never => {
    unsupported()
  }
  getSourceExtensionToMigrate: IExtensionStorageService['getSourceExtensionToMigrate'] = () =>
    undefined
}
registerSingleton(IExtensionStorageService, ExtensionStorageService, InstantiationType.Delayed)
class GlobalExtensionEnablementService implements IGlobalExtensionEnablementService {
  _serviceBrand: undefined
  onDidChangeEnablement: IGlobalExtensionEnablementService['onDidChangeEnablement'] = Event.None
  getDisabledExtensions: IGlobalExtensionEnablementService['getDisabledExtensions'] = () => {
    return []
  }
  enableExtension: IGlobalExtensionEnablementService['enableExtension'] = () => {
    return Promise.resolve(true)
  }
  disableExtension: IGlobalExtensionEnablementService['disableExtension'] = () => {
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
  getAvailableLanguages: ILanguagePackService['getAvailableLanguages'] = async (): Promise<
    ILanguagePackItem[]
  > => {
    return []
  }
  getInstalledLanguages: ILanguagePackService['getInstalledLanguages'] = async (): Promise<
    ILanguagePackItem[]
  > => {
    return []
  }
  getBuiltInExtensionTranslationsUri: ILanguagePackService['getBuiltInExtensionTranslationsUri'] =
    async (id: string, language: string): Promise<URI | undefined> => {
      const uri = getBuiltInExtensionTranslationsUris(language)?.[id]
      return uri != null ? URI.parse(uri) : undefined
    }
}
registerSingleton(ILanguagePackService, LanguagePackService, InstantiationType.Delayed)
class TreeViewsDnDService implements ITreeViewsDnDService {
  _serviceBrand: undefined
  @Unsupported
  removeDragOperationTransfer: ITreeViewsDnDService['removeDragOperationTransfer'] = (): never => {
    unsupported()
  }
  @Unsupported
  addDragOperationTransfer: ITreeViewsDnDService['addDragOperationTransfer'] = (): never => {
    unsupported()
  }
}
registerSingleton(ITreeViewsDnDService, TreeViewsDnDService, InstantiationType.Delayed)
class BreadcrumbsService implements IBreadcrumbsService {
  _serviceBrand: undefined
  @Unsupported
  register: IBreadcrumbsService['register'] = (): never => {
    unsupported()
  }
  getWidget: IBreadcrumbsService['getWidget'] = () => undefined
}
registerSingleton(IBreadcrumbsService, BreadcrumbsService, InstantiationType.Eager)
class OutlineService implements IOutlineService {
  _serviceBrand: undefined
  onDidChange: IOutlineService['onDidChange'] = Event.None
  canCreateOutline: IOutlineService['canCreateOutline'] = () => false
  createOutline: IOutlineService['createOutline'] = async () => undefined
  @Unsupported
  registerOutlineCreator: IOutlineService['registerOutlineCreator'] = (): never => {
    unsupported()
  }
}
registerSingleton(IOutlineService, OutlineService, InstantiationType.Eager)
class UpdateService implements IUpdateService {
  _serviceBrand: undefined
  onStateChange: IUpdateService['onStateChange'] = Event.None
  state: IUpdateService['state'] = State.Uninitialized
  @Unsupported
  checkForUpdates: IUpdateService['checkForUpdates'] = (): never => {
    unsupported()
  }
  @Unsupported
  downloadUpdate: IUpdateService['downloadUpdate'] = (): never => {
    unsupported()
  }
  @Unsupported
  applyUpdate: IUpdateService['applyUpdate'] = (): never => {
    unsupported()
  }
  @Unsupported
  quitAndInstall: IUpdateService['quitAndInstall'] = (): never => {
    unsupported()
  }
  isLatestVersion: IUpdateService['isLatestVersion'] = async () => true
  @Unsupported
  _applySpecificUpdate: IUpdateService['_applySpecificUpdate'] = (): never => {
    unsupported()
  }
}
registerSingleton(IUpdateService, UpdateService, InstantiationType.Eager)
class StatusbarService implements IStatusbarService {
  _serviceBrand: undefined
  @Unsupported
  overrideEntry: IStatusbarService['overrideEntry'] = (): never => {
    unsupported()
  }
  @Unsupported
  getPart: IStatusbarService['getPart'] = (): never => {
    unsupported()
  }
  @Unsupported
  createAuxiliaryStatusbarPart: IStatusbarService['createAuxiliaryStatusbarPart'] = (): never => {
    unsupported()
  }
  @Unsupported
  createScoped: IStatusbarService['createScoped'] = (): never => {
    unsupported()
  }
  @Unsupported
  dispose: IStatusbarService['dispose'] = (): never => {
    unsupported()
  }
  onDidChangeEntryVisibility: IStatusbarService['onDidChangeEntryVisibility'] = Event.None
  addEntry: IStatusbarService['addEntry'] = () => ({
    dispose: () => {},
    update: () => {}
  })
  isEntryVisible: IStatusbarService['isEntryVisible'] = () => false
  updateEntryVisibility: IStatusbarService['updateEntryVisibility'] = () => {
    /* ignore */
  }
  focus: IStatusbarService['focus'] = () => {
    /* ignore */
  }
  focusNextEntry: IStatusbarService['focusNextEntry'] = () => {
    /* ignore */
  }
  focusPreviousEntry: IStatusbarService['focusPreviousEntry'] = () => {
    /* ignore */
  }
  isEntryFocused: IStatusbarService['isEntryFocused'] = () => false
  overrideStyle: IStatusbarService['overrideStyle'] = () => Disposable.None
}
registerSingleton(IStatusbarService, StatusbarService, InstantiationType.Eager)
class ExtensionGalleryService implements IExtensionGalleryService {
  _serviceBrand: undefined
  isEnabled: IExtensionGalleryService['isEnabled'] = () => false
  @Unsupported
  query: IExtensionGalleryService['query'] = (): never => {
    unsupported()
  }
  @Unsupported
  getExtensions: IExtensionGalleryService['getExtensions'] = (): never => {
    unsupported()
  }
  @Unsupported
  isExtensionCompatible: IExtensionGalleryService['isExtensionCompatible'] = (): never => {
    unsupported()
  }
  @Unsupported
  getCompatibleExtension: IExtensionGalleryService['getCompatibleExtension'] = (): never => {
    unsupported()
  }
  @Unsupported
  getAllCompatibleVersions: IExtensionGalleryService['getAllCompatibleVersions'] = (): never => {
    unsupported()
  }
  @Unsupported
  download: IExtensionGalleryService['download'] = (): never => {
    unsupported()
  }
  @Unsupported
  downloadSignatureArchive: IExtensionGalleryService['downloadSignatureArchive'] = (): never => {
    unsupported()
  }
  @Unsupported
  reportStatistic: IExtensionGalleryService['reportStatistic'] = (): never => {
    unsupported()
  }
  @Unsupported
  getReadme: IExtensionGalleryService['getReadme'] = (): never => {
    unsupported()
  }
  @Unsupported
  getManifest: IExtensionGalleryService['getManifest'] = (): never => {
    unsupported()
  }
  @Unsupported
  getChangelog: IExtensionGalleryService['getChangelog'] = (): never => {
    unsupported()
  }
  @Unsupported
  getCoreTranslation: IExtensionGalleryService['getCoreTranslation'] = (): never => {
    unsupported()
  }
  @Unsupported
  getExtensionsControlManifest: IExtensionGalleryService['getExtensionsControlManifest'] =
    (): never => {
      unsupported()
    }
  getAllVersions: IExtensionGalleryService['getAllVersions'] = async () => []
}
registerSingleton(IExtensionGalleryService, ExtensionGalleryService, InstantiationType.Eager)
class TerminalService implements ITerminalService {
  _serviceBrand: undefined
  onAnyInstanceAddedCapabilityType: ITerminalService['onAnyInstanceAddedCapabilityType'] =
    Event.None
  onAnyInstanceShellTypeChanged: ITerminalService['onAnyInstanceShellTypeChanged'] = Event.None
  @Unsupported
  revealTerminal: ITerminalService['revealTerminal'] = (): never => {
    unsupported()
  }
  @Unsupported
  focusInstance: ITerminalService['focusInstance'] = (): never => {
    unsupported()
  }
  createOnInstanceCapabilityEvent: ITerminalService['createOnInstanceCapabilityEvent'] = <
    K
  >(): IDynamicListEventMultiplexer<{
    instance: ITerminalInstance
    data: K
  }> => {
    return {
      event: Event.None,
      dispose() {}
    }
  }
  onAnyInstanceData: ITerminalService['onAnyInstanceData'] = Event.None
  @Unsupported
  moveIntoNewEditor: ITerminalService['moveIntoNewEditor'] = (): never => {
    unsupported()
  }
  detachedInstances: ITerminalService['detachedInstances'] = []
  onAnyInstanceDataInput: ITerminalService['onAnyInstanceDataInput'] = Event.None
  onAnyInstanceIconChange: ITerminalService['onAnyInstanceIconChange'] = Event.None
  onAnyInstanceMaximumDimensionsChange: ITerminalService['onAnyInstanceMaximumDimensionsChange'] =
    Event.None
  onAnyInstancePrimaryStatusChange: ITerminalService['onAnyInstancePrimaryStatusChange'] =
    Event.None
  onAnyInstanceProcessIdReady: ITerminalService['onAnyInstanceProcessIdReady'] = Event.None
  onAnyInstanceSelectionChange: ITerminalService['onAnyInstanceSelectionChange'] = Event.None
  onAnyInstanceTitleChange: ITerminalService['onAnyInstanceTitleChange'] = Event.None
  createOnInstanceEvent: ITerminalService['createOnInstanceEvent'] = <T>(
    getEvent: (instance: ITerminalInstance) => Event<T>
  ): DynamicListEventMultiplexer<ITerminalInstance, T> => {
    return new DynamicListEventMultiplexer(
      this.instances as ITerminalInstance[],
      this.onDidCreateInstance,
      this.onDidDisposeInstance,
      getEvent
    )
  }
  @Unsupported
  createDetachedTerminal: ITerminalService['createDetachedTerminal'] = (): never => {
    unsupported()
  }
  whenConnected: ITerminalService['whenConnected'] = Promise.resolve()
  restoredGroupCount: ITerminalService['restoredGroupCount'] = 0
  instances: ITerminalService['instances'] = []
  @Unsupported
  get configHelper() {
    return unsupported()
  }
  @Unsupported
  revealActiveTerminal: ITerminalService['revealActiveTerminal'] = (): never => {
    unsupported()
  }
  isProcessSupportRegistered: ITerminalService['isProcessSupportRegistered'] = false
  connectionState: ITerminalService['connectionState'] = TerminalConnectionState.Connected
  defaultLocation: ITerminalService['defaultLocation'] = TerminalLocation.Panel
  onDidChangeActiveGroup: ITerminalService['onDidChangeActiveGroup'] = Event.None
  onDidCreateInstance: ITerminalService['onDidCreateInstance'] = Event.None
  onDidChangeInstanceDimensions: ITerminalService['onDidChangeInstanceDimensions'] = Event.None
  onDidRequestStartExtensionTerminal: ITerminalService['onDidRequestStartExtensionTerminal'] =
    Event.None
  onDidRegisterProcessSupport: ITerminalService['onDidRegisterProcessSupport'] = Event.None
  onDidChangeConnectionState: ITerminalService['onDidChangeConnectionState'] = Event.None
  @Unsupported
  createTerminal: ITerminalService['createTerminal'] = (): never => {
    unsupported()
  }
  @Unsupported
  getInstanceFromId: ITerminalService['getInstanceFromId'] = (): never => {
    unsupported()
  }
  @Unsupported
  getInstanceFromIndex: ITerminalService['getInstanceFromIndex'] = (): never => {
    unsupported()
  }
  getReconnectedTerminals: ITerminalService['getReconnectedTerminals'] = () => undefined
  @Unsupported
  getActiveOrCreateInstance: ITerminalService['getActiveOrCreateInstance'] = (): never => {
    unsupported()
  }
  @Unsupported
  moveToEditor: ITerminalService['moveToEditor'] = (): never => {
    unsupported()
  }
  @Unsupported
  moveToTerminalView: ITerminalService['moveToTerminalView'] = (): never => {
    unsupported()
  }
  @Unsupported
  getPrimaryBackend: ITerminalService['getPrimaryBackend'] = (): never => {
    unsupported()
  }
  @Unsupported
  refreshActiveGroup: ITerminalService['refreshActiveGroup'] = (): never => {
    unsupported()
  }
  registerProcessSupport: ITerminalService['registerProcessSupport'] = () => {}
  @Unsupported
  showProfileQuickPick: ITerminalService['showProfileQuickPick'] = (): never => {
    unsupported()
  }
  @Unsupported
  setContainers: ITerminalService['setContainers'] = (): never => {
    unsupported()
  }
  @Unsupported
  requestStartExtensionTerminal: ITerminalService['requestStartExtensionTerminal'] = (): never => {
    unsupported()
  }
  @Unsupported
  isAttachedToTerminal: ITerminalService['isAttachedToTerminal'] = (): never => {
    unsupported()
  }
  @Unsupported
  getEditableData: ITerminalService['getEditableData'] = (): never => {
    unsupported()
  }
  @Unsupported
  setEditable: ITerminalService['setEditable'] = (): never => {
    unsupported()
  }
  @Unsupported
  isEditable: ITerminalService['isEditable'] = (): never => {
    unsupported()
  }
  @Unsupported
  safeDisposeTerminal: ITerminalService['safeDisposeTerminal'] = (): never => {
    unsupported()
  }
  @Unsupported
  getDefaultInstanceHost: ITerminalService['getDefaultInstanceHost'] = (): never => {
    unsupported()
  }
  @Unsupported
  getInstanceHost: ITerminalService['getInstanceHost'] = (): never => {
    unsupported()
  }
  @Unsupported
  resolveLocation: ITerminalService['resolveLocation'] = (): never => {
    unsupported()
  }
  @Unsupported
  setNativeDelegate: ITerminalService['setNativeDelegate'] = (): never => {
    unsupported()
  }
  @Unsupported
  getEditingTerminal: ITerminalService['getEditingTerminal'] = (): never => {
    unsupported()
  }
  @Unsupported
  setEditingTerminal: ITerminalService['setEditingTerminal'] = (): never => {
    unsupported()
  }
  activeInstance: ITerminalService['activeInstance'] = undefined
  onDidDisposeInstance: ITerminalService['onDidDisposeInstance'] = Event.None
  onDidFocusInstance: ITerminalService['onDidFocusInstance'] = Event.None
  onDidChangeActiveInstance: ITerminalService['onDidChangeActiveInstance'] = Event.None
  onDidChangeInstances: ITerminalService['onDidChangeInstances'] = Event.None
  onDidChangeInstanceCapability: ITerminalService['onDidChangeInstanceCapability'] = Event.None
  @Unsupported
  setActiveInstance: ITerminalService['setActiveInstance'] = (): never => {
    unsupported()
  }
  @Unsupported
  focusActiveInstance: ITerminalService['focusActiveInstance'] = (): never => {
    unsupported()
  }
  @Unsupported
  getInstanceFromResource: ITerminalService['getInstanceFromResource'] = (): never => {
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
  onConfigChanged: ITerminalConfigurationService['onConfigChanged'] = Event.None
  @Unsupported
  setPanelContainer: ITerminalConfigurationService['setPanelContainer'] = (): never => {
    unsupported()
  }
  @Unsupported
  configFontIsMonospace: ITerminalConfigurationService['configFontIsMonospace'] = (): never => {
    unsupported()
  }
  @Unsupported
  getFont: ITerminalConfigurationService['getFont'] = (): never => {
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
  focusInstance: ITerminalEditorService['focusInstance'] = (): never => {
    unsupported()
  }
  instances: ITerminalEditorService['instances'] = []
  @Unsupported
  openEditor: ITerminalEditorService['openEditor'] = (): never => {
    unsupported()
  }
  @Unsupported
  detachInstance: ITerminalEditorService['detachInstance'] = (): never => {
    unsupported()
  }
  @Unsupported
  splitInstance: ITerminalEditorService['splitInstance'] = (): never => {
    unsupported()
  }
  @Unsupported
  revealActiveEditor: ITerminalEditorService['revealActiveEditor'] = (): never => {
    unsupported()
  }
  @Unsupported
  resolveResource: ITerminalEditorService['resolveResource'] = (): never => {
    unsupported()
  }
  @Unsupported
  reviveInput: ITerminalEditorService['reviveInput'] = (): never => {
    unsupported()
  }
  @Unsupported
  getInputFromResource: ITerminalEditorService['getInputFromResource'] = (): never => {
    unsupported()
  }
  activeInstance: ITerminalEditorService['activeInstance'] = undefined
  onDidDisposeInstance: ITerminalEditorService['onDidDisposeInstance'] = Event.None
  onDidFocusInstance: ITerminalEditorService['onDidFocusInstance'] = Event.None
  onDidChangeActiveInstance: ITerminalEditorService['onDidChangeActiveInstance'] = Event.None
  onDidChangeInstances: ITerminalEditorService['onDidChangeInstances'] = Event.None
  onDidChangeInstanceCapability: ITerminalEditorService['onDidChangeInstanceCapability'] =
    Event.None
  @Unsupported
  setActiveInstance: ITerminalEditorService['setActiveInstance'] = (): never => {
    unsupported()
  }
  @Unsupported
  focusActiveInstance: ITerminalEditorService['focusActiveInstance'] = (): never => {
    unsupported()
  }
  @Unsupported
  getInstanceFromResource: ITerminalEditorService['getInstanceFromResource'] = (): never => {
    unsupported()
  }
}
registerSingleton(ITerminalEditorService, TerminalEditorService, InstantiationType.Delayed)
class TerminalGroupService implements ITerminalGroupService {
  _serviceBrand: undefined
  @Unsupported
  focusInstance: ITerminalGroupService['focusInstance'] = (): never => {
    unsupported()
  }
  lastAccessedMenu: ITerminalGroupService['lastAccessedMenu'] = 'inline-tab'
  instances: ITerminalGroupService['instances'] = []
  groups: ITerminalGroupService['groups'] = []
  activeGroup: ITerminalGroupService['activeGroup'] = undefined
  activeGroupIndex: ITerminalGroupService['activeGroupIndex'] = 0
  onDidChangeActiveGroup: ITerminalGroupService['onDidChangeActiveGroup'] = Event.None
  onDidDisposeGroup: ITerminalGroupService['onDidDisposeGroup'] = Event.None
  onDidChangeGroups: ITerminalGroupService['onDidChangeGroups'] = Event.None
  onDidShow: ITerminalGroupService['onDidShow'] = Event.None
  onDidChangePanelOrientation: ITerminalGroupService['onDidChangePanelOrientation'] = Event.None
  @Unsupported
  createGroup: ITerminalGroupService['createGroup'] = (): never => {
    unsupported()
  }
  @Unsupported
  getGroupForInstance: ITerminalGroupService['getGroupForInstance'] = (): never => {
    unsupported()
  }
  @Unsupported
  moveGroup: ITerminalGroupService['moveGroup'] = (): never => {
    unsupported()
  }
  @Unsupported
  moveGroupToEnd: ITerminalGroupService['moveGroupToEnd'] = (): never => {
    unsupported()
  }
  @Unsupported
  moveInstance: ITerminalGroupService['moveInstance'] = (): never => {
    unsupported()
  }
  @Unsupported
  unsplitInstance: ITerminalGroupService['unsplitInstance'] = (): never => {
    unsupported()
  }
  @Unsupported
  joinInstances: ITerminalGroupService['joinInstances'] = (): never => {
    unsupported()
  }
  @Unsupported
  instanceIsSplit: ITerminalGroupService['instanceIsSplit'] = (): never => {
    unsupported()
  }
  @Unsupported
  getGroupLabels: ITerminalGroupService['getGroupLabels'] = (): never => {
    unsupported()
  }
  @Unsupported
  setActiveGroupByIndex: ITerminalGroupService['setActiveGroupByIndex'] = (): never => {
    unsupported()
  }
  @Unsupported
  setActiveGroupToNext: ITerminalGroupService['setActiveGroupToNext'] = (): never => {
    unsupported()
  }
  @Unsupported
  setActiveGroupToPrevious: ITerminalGroupService['setActiveGroupToPrevious'] = (): never => {
    unsupported()
  }
  @Unsupported
  setActiveInstanceByIndex: ITerminalGroupService['setActiveInstanceByIndex'] = (): never => {
    unsupported()
  }
  @Unsupported
  setContainer: ITerminalGroupService['setContainer'] = (): never => {
    unsupported()
  }
  @Unsupported
  showPanel: ITerminalGroupService['showPanel'] = (): never => {
    unsupported()
  }
  @Unsupported
  hidePanel: ITerminalGroupService['hidePanel'] = (): never => {
    unsupported()
  }
  @Unsupported
  focusTabs: ITerminalGroupService['focusTabs'] = (): never => {
    unsupported()
  }
  @Unsupported
  focusHover: ITerminalGroupService['focusHover'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateVisibility: ITerminalGroupService['updateVisibility'] = (): never => {
    unsupported()
  }
  activeInstance: ITerminalInstance | undefined
  onDidDisposeInstance: ITerminalGroupService['onDidDisposeInstance'] = Event.None
  onDidFocusInstance: ITerminalGroupService['onDidFocusInstance'] = Event.None
  onDidChangeActiveInstance: ITerminalGroupService['onDidChangeActiveInstance'] = Event.None
  onDidChangeInstances: ITerminalGroupService['onDidChangeInstances'] = Event.None
  onDidChangeInstanceCapability: ITerminalGroupService['onDidChangeInstanceCapability'] = Event.None
  @Unsupported
  setActiveInstance: ITerminalGroupService['setActiveInstance'] = (): never => {
    unsupported()
  }
  @Unsupported
  focusActiveInstance: ITerminalGroupService['focusActiveInstance'] = (): never => {
    unsupported()
  }
  @Unsupported
  getInstanceFromResource: ITerminalGroupService['getInstanceFromResource'] = (): never => {
    unsupported()
  }
}
registerSingleton(ITerminalGroupService, TerminalGroupService, InstantiationType.Delayed)
class TerminalInstanceService implements ITerminalInstanceService {
  _serviceBrand: undefined
  onDidRegisterBackend: ITerminalInstanceService['onDidRegisterBackend'] = Event.None
  getRegisteredBackends: ITerminalInstanceService['getRegisteredBackends'] = () => [].values()
  onDidCreateInstance: ITerminalInstanceService['onDidCreateInstance'] = Event.None
  @Unsupported
  convertProfileToShellLaunchConfig: ITerminalInstanceService['convertProfileToShellLaunchConfig'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  createInstance: ITerminalInstanceService['createInstance'] = (): never => {
    unsupported()
  }
  @Unsupported
  getBackend: ITerminalInstanceService['getBackend'] = (): never => {
    unsupported()
  }
  @Unsupported
  didRegisterBackend: ITerminalInstanceService['didRegisterBackend'] = (): never => {
    unsupported()
  }
}
registerSingleton(ITerminalInstanceService, TerminalInstanceService, InstantiationType.Delayed)
class TerminalProfileService implements ITerminalProfileService {
  _serviceBrand: undefined
  availableProfiles: ITerminalProfileService['availableProfiles'] = []
  contributedProfiles: ITerminalProfileService['contributedProfiles'] = []
  profilesReady: ITerminalProfileService['profilesReady'] = Promise.resolve()
  @Unsupported
  getPlatformKey: ITerminalProfileService['getPlatformKey'] = (): never => {
    unsupported()
  }
  @Unsupported
  refreshAvailableProfiles: ITerminalProfileService['refreshAvailableProfiles'] = (): never => {
    unsupported()
  }
  getDefaultProfileName: ITerminalProfileService['getDefaultProfileName'] = () => undefined
  getDefaultProfile: ITerminalProfileService['getDefaultProfile'] = () => undefined
  onDidChangeAvailableProfiles: ITerminalProfileService['onDidChangeAvailableProfiles'] = Event.None
  @Unsupported
  getContributedDefaultProfile: ITerminalProfileService['getContributedDefaultProfile'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  registerContributedProfile: ITerminalProfileService['registerContributedProfile'] = (): never => {
    unsupported()
  }
  @Unsupported
  getContributedProfileProvider: ITerminalProfileService['getContributedProfileProvider'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  registerTerminalProfileProvider: ITerminalProfileService['registerTerminalProfileProvider'] =
    (): never => {
      unsupported()
    }
}
registerSingleton(ITerminalProfileService, TerminalProfileService, InstantiationType.Delayed)
class TerminalLogService implements ITerminalLogService {
  _logBrand: undefined
  _serviceBrand: undefined
  onDidChangeLogLevel: ITerminalLogService['onDidChangeLogLevel'] = Event.None
  @Unsupported
  getLevel: ITerminalLogService['getLevel'] = (): never => {
    unsupported()
  }
  @Unsupported
  setLevel: ITerminalLogService['setLevel'] = (): never => {
    unsupported()
  }
  @Unsupported
  trace: ITerminalLogService['trace'] = (): never => {
    unsupported()
  }
  @Unsupported
  debug: ITerminalLogService['debug'] = (): never => {
    unsupported()
  }
  @Unsupported
  info: ITerminalLogService['info'] = (): never => {
    unsupported()
  }
  @Unsupported
  warn: ITerminalLogService['warn'] = (): never => {
    unsupported()
  }
  @Unsupported
  error: ITerminalLogService['error'] = (): never => {
    unsupported()
  }
  @Unsupported
  flush: ITerminalLogService['flush'] = (): never => {
    unsupported()
  }
  @Unsupported
  dispose: ITerminalLogService['dispose'] = (): never => {
    unsupported()
  }
}
registerSingleton(ITerminalLogService, TerminalLogService, InstantiationType.Delayed)
class TerminalLinkProviderService implements ITerminalLinkProviderService {
  _serviceBrand: undefined
  linkProviders: ITerminalLinkProviderService['linkProviders'] = new Set([])
  onDidAddLinkProvider: ITerminalLinkProviderService['onDidAddLinkProvider'] = Event.None
  onDidRemoveLinkProvider: ITerminalLinkProviderService['onDidRemoveLinkProvider'] = Event.None
  @Unsupported
  registerLinkProvider: ITerminalLinkProviderService['registerLinkProvider'] = (): never => {
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
  terminalProfiles: ITerminalContributionService['terminalProfiles'] = []
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
  resolveIcon: ITerminalProfileResolverService['resolveIcon'] = (): never => {
    unsupported()
  }
  @Unsupported
  resolveShellLaunchConfig: ITerminalProfileResolverService['resolveShellLaunchConfig'] =
    (): never => {
      unsupported()
    }
  getDefaultProfile: ITerminalProfileResolverService['getDefaultProfile'] = async () => ({
    profileName: 'bash',
    path: '/bin/bash',
    isDefault: true
  })
  @Unsupported
  getDefaultShell: ITerminalProfileResolverService['getDefaultShell'] = (): never => {
    unsupported()
  }
  @Unsupported
  getDefaultShellArgs: ITerminalProfileResolverService['getDefaultShellArgs'] = (): never => {
    unsupported()
  }
  @Unsupported
  getDefaultIcon: ITerminalProfileResolverService['getDefaultIcon'] = (): never => {
    unsupported()
  }
  @Unsupported
  getEnvironment: ITerminalProfileResolverService['getEnvironment'] = (): never => {
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
  collections: IEnvironmentVariableService['collections'] = new Map()
  @Unsupported
  get mergedCollection() {
    return unsupported()
  }
  onDidChangeCollections: IEnvironmentVariableService['onDidChangeCollections'] = Event.None
  set: IEnvironmentVariableService['set'] = () => {}
  delete: IEnvironmentVariableService['delete'] = () => {}
}
registerSingleton(
  IEnvironmentVariableService,
  EnvironmentVariableService,
  InstantiationType.Delayed
)
class TerminalQuickFixService implements ITerminalQuickFixService {
  _serviceBrand: undefined
  onDidRegisterProvider: ITerminalQuickFixService['onDidRegisterProvider'] = Event.None
  onDidRegisterCommandSelector: ITerminalQuickFixService['onDidRegisterCommandSelector'] =
    Event.None
  onDidUnregisterProvider: ITerminalQuickFixService['onDidUnregisterProvider'] = Event.None
  extensionQuickFixes: ITerminalQuickFixService['extensionQuickFixes'] = Promise.resolve([])
  providers: ITerminalQuickFixService['providers'] = new Map()
  @Unsupported
  registerQuickFixProvider: ITerminalQuickFixService['registerQuickFixProvider'] = (): never => {
    unsupported()
  }
  @Unsupported
  registerCommandSelector: ITerminalQuickFixService['registerCommandSelector'] = (): never => {
    unsupported()
  }
}
registerSingleton(ITerminalQuickFixService, TerminalQuickFixService, InstantiationType.Delayed)
class UserDataSyncWorkbenchService implements IUserDataSyncWorkbenchService {
  _serviceBrand: undefined
  onDidTurnOnSync: IUserDataSyncWorkbenchService['onDidTurnOnSync'] = Event.None
  enabled: IUserDataSyncWorkbenchService['enabled'] = false
  authenticationProviders: IUserDataSyncWorkbenchService['authenticationProviders'] = []
  current: IUserDataSyncWorkbenchService['current'] = undefined
  accountStatus: IUserDataSyncWorkbenchService['accountStatus'] = AccountStatus.Unavailable
  onDidChangeAccountStatus: IUserDataSyncWorkbenchService['onDidChangeAccountStatus'] = Event.None
  @Unsupported
  turnOn: IUserDataSyncWorkbenchService['turnOn'] = (): never => {
    unsupported()
  }
  @Unsupported
  turnoff: IUserDataSyncWorkbenchService['turnoff'] = (): never => {
    unsupported()
  }
  @Unsupported
  signIn: IUserDataSyncWorkbenchService['signIn'] = (): never => {
    unsupported()
  }
  @Unsupported
  resetSyncedData: IUserDataSyncWorkbenchService['resetSyncedData'] = (): never => {
    unsupported()
  }
  @Unsupported
  showSyncActivity: IUserDataSyncWorkbenchService['showSyncActivity'] = (): never => {
    unsupported()
  }
  @Unsupported
  syncNow: IUserDataSyncWorkbenchService['syncNow'] = (): never => {
    unsupported()
  }
  @Unsupported
  synchroniseUserDataSyncStoreType: IUserDataSyncWorkbenchService['synchroniseUserDataSyncStoreType'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  showConflicts: IUserDataSyncWorkbenchService['showConflicts'] = (): never => {
    unsupported()
  }
  @Unsupported
  accept: IUserDataSyncWorkbenchService['accept'] = (): never => {
    unsupported()
  }
  @Unsupported
  getAllLogResources: IUserDataSyncWorkbenchService['getAllLogResources'] = (): never => {
    unsupported()
  }
  @Unsupported
  downloadSyncActivity: IUserDataSyncWorkbenchService['downloadSyncActivity'] = (): never => {
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
  onDidChangeEnablement: IUserDataSyncEnablementService['onDidChangeEnablement'] = Event.None
  isEnabled: IUserDataSyncEnablementService['isEnabled'] = () => false
  canToggleEnablement: IUserDataSyncEnablementService['canToggleEnablement'] = () => false
  @Unsupported
  setEnablement: IUserDataSyncEnablementService['setEnablement'] = (): never => {
    unsupported()
  }
  isResourceEnablementConfigured: IUserDataSyncEnablementService['isResourceEnablementConfigured'] =
    () => false
  onDidChangeResourceEnablement: IUserDataSyncEnablementService['onDidChangeResourceEnablement'] =
    Event.None
  isResourceEnabled: IUserDataSyncEnablementService['isResourceEnabled'] = () => false
  @Unsupported
  setResourceEnablement: IUserDataSyncEnablementService['setResourceEnablement'] = (): never => {
    unsupported()
  }
  getResourceSyncStateVersion: IUserDataSyncEnablementService['getResourceSyncStateVersion'] = () =>
    undefined
}
registerSingleton(
  IUserDataSyncEnablementService,
  UserDataSyncEnablementService,
  InstantiationType.Delayed
)
class KeybindingEditingService implements IKeybindingEditingService {
  _serviceBrand: undefined
  @Unsupported
  addKeybinding: IKeybindingEditingService['addKeybinding'] = (): never => {
    unsupported()
  }
  @Unsupported
  editKeybinding: IKeybindingEditingService['editKeybinding'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeKeybinding: IKeybindingEditingService['removeKeybinding'] = (): never => {
    unsupported()
  }
  @Unsupported
  resetKeybinding: IKeybindingEditingService['resetKeybinding'] = (): never => {
    unsupported()
  }
}
registerSingleton(IKeybindingEditingService, KeybindingEditingService, InstantiationType.Delayed)
class PreferencesSearchService implements IPreferencesSearchService {
  _serviceBrand: undefined
  @Unsupported
  getLocalSearchProvider: IPreferencesSearchService['getLocalSearchProvider'] = (): never => {
    unsupported()
  }
  @Unsupported
  getRemoteSearchProvider: IPreferencesSearchService['getRemoteSearchProvider'] = (): never => {
    unsupported()
  }
  @Unsupported
  getAiSearchProvider: IPreferencesSearchService['getAiSearchProvider'] = (): never => {
    unsupported()
  }
}
registerSingleton(IPreferencesSearchService, PreferencesSearchService, InstantiationType.Delayed)
class NotebookService implements INotebookService {
  _serviceBrand: undefined
  @Unsupported
  createNotebookTextDocumentSnapshot: INotebookService['createNotebookTextDocumentSnapshot'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  restoreNotebookTextModelFromSnapshot: INotebookService['restoreNotebookTextModelFromSnapshot'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  hasSupportedNotebooks: INotebookService['hasSupportedNotebooks'] = (): never => {
    unsupported()
  }
  tryGetDataProviderSync: INotebookService['tryGetDataProviderSync'] = () => undefined
  canResolve: INotebookService['canResolve'] = async () => false
  onAddViewType: INotebookService['onAddViewType'] = Event.None
  onWillRemoveViewType: INotebookService['onWillRemoveViewType'] = Event.None
  onDidChangeOutputRenderers: INotebookService['onDidChangeOutputRenderers'] = Event.None
  onWillAddNotebookDocument: INotebookService['onWillAddNotebookDocument'] = Event.None
  onDidAddNotebookDocument: INotebookService['onDidAddNotebookDocument'] = Event.None
  onWillRemoveNotebookDocument: INotebookService['onWillRemoveNotebookDocument'] = Event.None
  onDidRemoveNotebookDocument: INotebookService['onDidRemoveNotebookDocument'] = Event.None
  @Unsupported
  registerNotebookSerializer: INotebookService['registerNotebookSerializer'] = (): never => {
    unsupported()
  }
  @Unsupported
  withNotebookDataProvider: INotebookService['withNotebookDataProvider'] = (): never => {
    unsupported()
  }
  @Unsupported
  getOutputMimeTypeInfo: INotebookService['getOutputMimeTypeInfo'] = (): never => {
    unsupported()
  }
  getViewTypeProvider: INotebookService['getViewTypeProvider'] = () => undefined
  getRendererInfo: INotebookService['getRendererInfo'] = () => undefined
  getRenderers: INotebookService['getRenderers'] = () => []
  @Unsupported
  getStaticPreloads: INotebookService['getStaticPreloads'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateMimePreferredRenderer: INotebookService['updateMimePreferredRenderer'] = (): never => {
    unsupported()
  }
  @Unsupported
  saveMimeDisplayOrder: INotebookService['saveMimeDisplayOrder'] = (): never => {
    unsupported()
  }
  @Unsupported
  createNotebookTextModel: INotebookService['createNotebookTextModel'] = (): never => {
    unsupported()
  }
  getNotebookTextModel: INotebookService['getNotebookTextModel'] = () => undefined
  @Unsupported
  getNotebookTextModels: INotebookService['getNotebookTextModels'] = (): never => {
    unsupported()
  }
  listNotebookDocuments: INotebookService['listNotebookDocuments'] = () => []
  @Unsupported
  registerContributedNotebookType: INotebookService['registerContributedNotebookType'] =
    (): never => {
      unsupported()
    }
  getContributedNotebookType: INotebookService['getContributedNotebookType'] = () => undefined
  getContributedNotebookTypes: INotebookService['getContributedNotebookTypes'] = () => []
  getNotebookProviderResourceRoots: INotebookService['getNotebookProviderResourceRoots'] = () => []
  @Unsupported
  setToCopy: INotebookService['setToCopy'] = (): never => {
    unsupported()
  }
  @Unsupported
  getToCopy: INotebookService['getToCopy'] = (): never => {
    unsupported()
  }
  @Unsupported
  clearEditorCache: INotebookService['clearEditorCache'] = (): never => {
    unsupported()
  }
}
registerSingleton(INotebookService, NotebookService, InstantiationType.Delayed)
class ReplaceService implements IReplaceService {
  _serviceBrand: undefined
  @Unsupported
  replace: IReplaceService['replace'] = (): never => {
    unsupported()
  }
  @Unsupported
  openReplacePreview: IReplaceService['openReplacePreview'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateReplacePreview: IReplaceService['updateReplacePreview'] = (): never => {
    unsupported()
  }
}
registerSingleton(IReplaceService, ReplaceService, InstantiationType.Delayed)
class SearchHistoryService implements ISearchHistoryService {
  _serviceBrand: undefined
  onDidClearHistory: ISearchHistoryService['onDidClearHistory'] = Event.None
  @Unsupported
  clearHistory: ISearchHistoryService['clearHistory'] = (): never => {
    unsupported()
  }
  @Unsupported
  load: ISearchHistoryService['load'] = (): never => {
    unsupported()
  }
  @Unsupported
  save: ISearchHistoryService['save'] = (): never => {
    unsupported()
  }
}
registerSingleton(ISearchHistoryService, SearchHistoryService, InstantiationType.Delayed)
class NotebookEditorService implements INotebookEditorService {
  _serviceBrand: undefined
  @Unsupported
  updateReplContextKey: INotebookEditorService['updateReplContextKey'] = (): never => {
    unsupported()
  }
  @Unsupported
  retrieveWidget: INotebookEditorService['retrieveWidget'] = (): never => {
    unsupported()
  }
  retrieveExistingWidgetFromURI: INotebookEditorService['retrieveExistingWidgetFromURI'] = () =>
    undefined
  retrieveAllExistingWidgets: INotebookEditorService['retrieveAllExistingWidgets'] = () => []
  onDidAddNotebookEditor: INotebookEditorService['onDidAddNotebookEditor'] = Event.None
  onDidRemoveNotebookEditor: INotebookEditorService['onDidRemoveNotebookEditor'] = Event.None
  @Unsupported
  addNotebookEditor: INotebookEditorService['addNotebookEditor'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeNotebookEditor: INotebookEditorService['removeNotebookEditor'] = (): never => {
    unsupported()
  }
  getNotebookEditor: INotebookEditorService['getNotebookEditor'] = () => undefined
  listNotebookEditors: INotebookEditorService['listNotebookEditors'] = () => []
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
  createUntitledNotebookTextModel: INotebookEditorModelResolverService['createUntitledNotebookTextModel'] =
    (): never => {
      unsupported()
    }
  onDidSaveNotebook: INotebookEditorModelResolverService['onDidSaveNotebook'] = Event.None
  onDidChangeDirty: INotebookEditorModelResolverService['onDidChangeDirty'] = Event.None
  onWillFailWithConflict: INotebookEditorModelResolverService['onWillFailWithConflict'] = Event.None
  @Unsupported
  isDirty: INotebookEditorModelResolverService['isDirty'] = (): never => {
    unsupported()
  }
  @Unsupported
  resolve: INotebookEditorModelResolverService['resolve'] = (): never => {
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
  onDidRegisterHandler: IWorkingCopyEditorService['onDidRegisterHandler'] = Event.None
  registerHandler: IWorkingCopyEditorService['registerHandler'] = () => Disposable.None
  findEditor: IWorkingCopyEditorService['findEditor'] = () => undefined
}
registerSingleton(IWorkingCopyEditorService, WorkingCopyEditorService, InstantiationType.Delayed)
class UserActivityService implements IUserActivityService {
  _serviceBrand: undefined
  isActive: IUserActivityService['isActive'] = false
  onDidChangeIsActive: IUserActivityService['onDidChangeIsActive'] = Event.None
  @Unsupported
  markActive: IUserActivityService['markActive'] = (): never => {
    unsupported()
  }
}
registerSingleton(IUserActivityService, UserActivityService, InstantiationType.Delayed)
class CanonicalUriService implements ICanonicalUriService {
  _serviceBrand: undefined
  @Unsupported
  registerCanonicalUriProvider: ICanonicalUriService['registerCanonicalUriProvider'] =
    (): never => {
      unsupported()
    }
}
registerSingleton(ICanonicalUriService, CanonicalUriService, InstantiationType.Delayed)
class ExtensionStatusBarItemService implements IExtensionStatusBarItemService {
  _serviceBrand: undefined
  onDidChange: IExtensionStatusBarItemService['onDidChange'] = Event.None
  setOrUpdateEntry: IExtensionStatusBarItemService['setOrUpdateEntry'] =
    (): StatusBarUpdateKind => {
      // ignore
      return StatusBarUpdateKind.DidUpdate
    }
  unsetEntry: IExtensionStatusBarItemService['unsetEntry'] = (): void => {}
  getEntries: IExtensionStatusBarItemService['getEntries'] =
    (): Iterable<ExtensionStatusBarEntry> => {
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
  getCurrentExperiments: IWorkbenchAssignmentService['getCurrentExperiments'] = async () => []
  getTreatment: IWorkbenchAssignmentService['getTreatment'] = async () => undefined
}
registerSingleton(
  IWorkbenchAssignmentService,
  WorkbenchAssignmentService,
  InstantiationType.Delayed
)
class ChatService implements IChatService {
  edits2Enabled: IChatService['edits2Enabled'] = false
  _serviceBrand: undefined
  isPersistedSessionEmpty: IChatService['isPersistedSessionEmpty'] = () => true
  @Unsupported
  activateDefaultAgent: IChatService['activateDefaultAgent'] = (): never => {
    unsupported()
  }
  @Unsupported
  getChatStorageFolder: IChatService['getChatStorageFolder'] = (): never => {
    unsupported()
  }
  @Unsupported
  logChatIndex: IChatService['logChatIndex'] = (): never => {
    unsupported()
  }
  @Unsupported
  setChatSessionTitle: IChatService['setChatSessionTitle'] = (): never => {
    unsupported()
  }
  @Unsupported
  adoptRequest: IChatService['adoptRequest'] = (): never => {
    unsupported()
  }
  isEnabled: IChatService['isEnabled'] = () => false
  @Unsupported
  resendRequest: IChatService['resendRequest'] = (): never => {
    unsupported()
  }
  @Unsupported
  clearAllHistoryEntries: IChatService['clearAllHistoryEntries'] = (): never => {
    unsupported()
  }
  hasSessions: IChatService['hasSessions'] = () => false
  onDidDisposeSession: IChatService['onDidDisposeSession'] = Event.None
  transferredSessionData: IChatService['transferredSessionData'] = undefined
  @Unsupported
  transferChatSession: IChatService['transferChatSession'] = (): never => {
    unsupported()
  }
  @Unsupported
  startSession: IChatService['startSession'] = (): never => {
    unsupported()
  }
  getSession: IChatService['getSession'] = () => undefined
  getOrRestoreSession: IChatService['getOrRestoreSession'] = async () => undefined
  loadSessionFromContent: IChatService['loadSessionFromContent'] = () => undefined
  @Unsupported
  sendRequest: IChatService['sendRequest'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeRequest: IChatService['removeRequest'] = (): never => {
    unsupported()
  }
  @Unsupported
  cancelCurrentRequestForSession: IChatService['cancelCurrentRequestForSession'] = (): never => {
    unsupported()
  }
  @Unsupported
  clearSession: IChatService['clearSession'] = (): never => {
    unsupported()
  }
  @Unsupported
  addCompleteRequest: IChatService['addCompleteRequest'] = (): never => {
    unsupported()
  }
  getHistory: IChatService['getHistory'] = async () => []
  @Unsupported
  removeHistoryEntry: IChatService['removeHistoryEntry'] = (): never => {
    unsupported()
  }
  onDidPerformUserAction: IChatService['onDidPerformUserAction'] = Event.None
  @Unsupported
  notifyUserAction: IChatService['notifyUserAction'] = (): never => {
    unsupported()
  }
  onDidSubmitRequest: IChatService['onDidSubmitRequest'] = Event.None
}
registerSingleton(IChatService, ChatService, InstantiationType.Delayed)
class ChatMarkdownAnchorService implements IChatMarkdownAnchorService {
  _serviceBrand: undefined
  lastFocusedAnchor: IChatMarkdownAnchorService['lastFocusedAnchor'] = undefined
  @Unsupported
  register: IChatMarkdownAnchorService['register'] = (): never => {
    unsupported()
  }
}
registerSingleton(IChatMarkdownAnchorService, ChatMarkdownAnchorService, InstantiationType.Delayed)
class LanguageModelStatsService implements ILanguageModelStatsService {
  _serviceBrand: undefined
  @Unsupported
  update: ILanguageModelStatsService['update'] = (): never => {
    unsupported()
  }
}
registerSingleton(ILanguageModelStatsService, LanguageModelStatsService, InstantiationType.Delayed)
class QuickChatService implements IQuickChatService {
  focused: IQuickChatService['focused'] = false
  _serviceBrand: undefined
  onDidClose: IQuickChatService['onDidClose'] = Event.None
  enabled: IQuickChatService['enabled'] = false
  @Unsupported
  toggle: IQuickChatService['toggle'] = (): never => {
    unsupported()
  }
  @Unsupported
  focus: IQuickChatService['focus'] = (): never => {
    unsupported()
  }
  @Unsupported
  open: IQuickChatService['open'] = (): never => {
    unsupported()
  }
  @Unsupported
  close: IQuickChatService['close'] = (): never => {
    unsupported()
  }
  @Unsupported
  openInChatView: IQuickChatService['openInChatView'] = (): never => {
    unsupported()
  }
}
registerSingleton(IQuickChatService, QuickChatService, InstantiationType.Delayed)
class QuickChatAgentService implements IChatAgentService {
  _serviceBrand: IChatAgentService['_serviceBrand'] = undefined
  hasToolsAgent: IChatAgentService['hasToolsAgent'] = false
  @Unsupported
  setRequestPaused: IChatAgentService['setRequestPaused'] = (): never => {
    unsupported()
  }
  @Unsupported
  registerChatParticipantDetectionProvider: IChatAgentService['registerChatParticipantDetectionProvider'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  detectAgentOrCommand: IChatAgentService['detectAgentOrCommand'] = (): never => {
    unsupported()
  }
  hasChatParticipantDetectionProviders: IChatAgentService['hasChatParticipantDetectionProviders'] =
    () => false
  @Unsupported
  getChatTitle: IChatAgentService['getChatTitle'] = (): never => {
    unsupported()
  }
  agentHasDupeName: IChatAgentService['agentHasDupeName'] = () => false
  @Unsupported
  registerAgentCompletionProvider: IChatAgentService['registerAgentCompletionProvider'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  getAgentCompletionItems: IChatAgentService['getAgentCompletionItems'] = (): never => {
    unsupported()
  }
  @Unsupported
  getAgentByFullyQualifiedId: IChatAgentService['getAgentByFullyQualifiedId'] = (): never => {
    unsupported()
  }
  getContributedDefaultAgent: IChatAgentService['getContributedDefaultAgent'] = () => undefined
  @Unsupported
  registerAgentImplementation: IChatAgentService['registerAgentImplementation'] = (): never => {
    unsupported()
  }
  @Unsupported
  registerDynamicAgent: IChatAgentService['registerDynamicAgent'] = (): never => {
    unsupported()
  }
  getActivatedAgents: IChatAgentService['getActivatedAgents'] = () => []
  getAgentsByName: IChatAgentService['getAgentsByName'] = () => []
  @Unsupported
  getFollowups: IChatAgentService['getFollowups'] = (): never => {
    unsupported()
  }
  getDefaultAgent: IChatAgentService['getDefaultAgent'] = () => undefined
  @Unsupported
  updateAgent: IChatAgentService['updateAgent'] = (): never => {
    unsupported()
  }
  onDidChangeAgents: IChatAgentService['onDidChangeAgents'] = Event.None
  @Unsupported
  registerAgent: IChatAgentService['registerAgent'] = (): never => {
    unsupported()
  }
  @Unsupported
  invokeAgent: IChatAgentService['invokeAgent'] = (): never => {
    unsupported()
  }
  @Unsupported
  getAgents: IChatAgentService['getAgents'] = (): never => {
    unsupported()
  }
  @Unsupported
  getAgent: IChatAgentService['getAgent'] = (): never => {
    unsupported()
  }
}
registerSingleton(IChatAgentService, QuickChatAgentService, InstantiationType.Delayed)
class ChatAgentNameService implements IChatAgentNameService {
  _serviceBrand: undefined
  getAgentNameRestriction: IChatAgentNameService['getAgentNameRestriction'] = (): boolean => {
    return true
  }
}
registerSingleton(IChatAgentNameService, ChatAgentNameService, InstantiationType.Delayed)
class EmbedderTerminalService implements IEmbedderTerminalService {
  _serviceBrand: undefined
  onDidCreateTerminal: IEmbedderTerminalService['onDidCreateTerminal'] = Event.None
  @Unsupported
  createTerminal: IEmbedderTerminalService['createTerminal'] = (): never => {
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
  getCustomEditor: ICustomEditorService['getCustomEditor'] = (): never => {
    unsupported()
  }
  @Unsupported
  getAllCustomEditors: ICustomEditorService['getAllCustomEditors'] = (): never => {
    unsupported()
  }
  @Unsupported
  getContributedCustomEditors: ICustomEditorService['getContributedCustomEditors'] = (): never => {
    unsupported()
  }
  @Unsupported
  getUserConfiguredCustomEditors: ICustomEditorService['getUserConfiguredCustomEditors'] =
    (): never => {
      unsupported()
    }
  registerCustomEditorCapabilities: ICustomEditorService['registerCustomEditorCapabilities'] = () =>
    Disposable.None
  getCustomEditorCapabilities: ICustomEditorService['getCustomEditorCapabilities'] = () => undefined
}
registerSingleton(ICustomEditorService, CustomEditorService, InstantiationType.Delayed)
class WebviewService implements IWebviewService {
  _serviceBrand: undefined
  activeWebview: IWebview | undefined
  webviews: IWebviewService['webviews'] = []
  onDidChangeActiveWebview: IWebviewService['onDidChangeActiveWebview'] = Event.None
  @Unsupported
  createWebviewElement: IWebviewService['createWebviewElement'] = (): never => {
    unsupported()
  }
  @Unsupported
  createWebviewOverlay: IWebviewService['createWebviewOverlay'] = (): never => {
    unsupported()
  }
}
registerSingleton(IWebviewService, WebviewService, InstantiationType.Delayed)
class WebviewViewService implements IWebviewViewService {
  _serviceBrand: undefined
  onNewResolverRegistered: IWebviewViewService['onNewResolverRegistered'] = Event.None
  @Unsupported
  register: IWebviewViewService['register'] = (): never => {
    unsupported()
  }
  @Unsupported
  resolve: IWebviewViewService['resolve'] = (): never => {
    unsupported()
  }
}
registerSingleton(IWebviewViewService, WebviewViewService, InstantiationType.Delayed)
class LocaleService implements ILocaleService {
  _serviceBrand: undefined
  @Unsupported
  setLocale: ILocaleService['setLocale'] = (): never => {
    unsupported()
  }
  clearLocalePreference: ILocaleService['clearLocalePreference'] = () => {
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
  onDidChangeActiveWebviewEditor: IWebviewWorkbenchService['onDidChangeActiveWebviewEditor'] =
    Event.None
  @Unsupported
  openWebview: IWebviewWorkbenchService['openWebview'] = (): never => {
    unsupported()
  }
  @Unsupported
  openRevivedWebview: IWebviewWorkbenchService['openRevivedWebview'] = (): never => {
    unsupported()
  }
  @Unsupported
  revealWebview: IWebviewWorkbenchService['revealWebview'] = (): never => {
    unsupported()
  }
  registerResolver: IWebviewWorkbenchService['registerResolver'] = () => Disposable.None
  @Unsupported
  shouldPersist: IWebviewWorkbenchService['shouldPersist'] = (): never => {
    unsupported()
  }
  @Unsupported
  resolveWebview: IWebviewWorkbenchService['resolveWebview'] = (): never => {
    unsupported()
  }
}
registerSingleton(IWebviewWorkbenchService, WebviewWorkbenchService, InstantiationType.Delayed)
class RemoteAuthorityResolverService implements IRemoteAuthorityResolverService {
  _serviceBrand: undefined
  onDidChangeConnectionData: IRemoteAuthorityResolverService['onDidChangeConnectionData'] =
    Event.None
  @Unsupported
  resolveAuthority: IRemoteAuthorityResolverService['resolveAuthority'] = (): never => {
    unsupported()
  }
  @Unsupported
  getConnectionData: IRemoteAuthorityResolverService['getConnectionData'] = (): never => {
    unsupported()
  }
  @Unsupported
  getCanonicalURI: IRemoteAuthorityResolverService['getCanonicalURI'] = (): never => {
    unsupported()
  }
  @Unsupported
  _clearResolvedAuthority: IRemoteAuthorityResolverService['_clearResolvedAuthority'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  _setResolvedAuthority: IRemoteAuthorityResolverService['_setResolvedAuthority'] = (): never => {
    unsupported()
  }
  @Unsupported
  _setResolvedAuthorityError: IRemoteAuthorityResolverService['_setResolvedAuthorityError'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  _setAuthorityConnectionToken: IRemoteAuthorityResolverService['_setAuthorityConnectionToken'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  _setCanonicalURIProvider: IRemoteAuthorityResolverService['_setCanonicalURIProvider'] =
    (): never => {
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
  registerExternalOpenerProvider: IExternalUriOpenerService['registerExternalOpenerProvider'] =
    () => Disposable.None
  getOpener: IExternalUriOpenerService['getOpener'] = async () => undefined
}
registerSingleton(IExternalUriOpenerService, ExternalUriOpenerService, InstantiationType.Delayed)
class AccessibleViewService implements IAccessibleViewService {
  _serviceBrand: undefined
  @Unsupported
  configureKeybindings: IAccessibleViewService['configureKeybindings'] = (): never => {
    unsupported()
  }
  @Unsupported
  openHelpLink: IAccessibleViewService['openHelpLink'] = (): never => {
    unsupported()
  }
  @Unsupported
  navigateToCodeBlock: IAccessibleViewService['navigateToCodeBlock'] = (): never => {
    unsupported()
  }
  getCodeBlockContext: IAccessibleViewService['getCodeBlockContext'] = () => undefined
  @Unsupported
  showLastProvider: IAccessibleViewService['showLastProvider'] = (): never => {
    unsupported()
  }
  @Unsupported
  showAccessibleViewHelp: IAccessibleViewService['showAccessibleViewHelp'] = (): never => {
    unsupported()
  }
  @Unsupported
  goToSymbol: IAccessibleViewService['goToSymbol'] = (): never => {
    unsupported()
  }
  @Unsupported
  disableHint: IAccessibleViewService['disableHint'] = (): never => {
    unsupported()
  }
  @Unsupported
  next: IAccessibleViewService['next'] = (): never => {
    unsupported()
  }
  @Unsupported
  previous: IAccessibleViewService['previous'] = (): never => {
    unsupported()
  }
  @Unsupported
  getOpenAriaHint: IAccessibleViewService['getOpenAriaHint'] = (): never => {
    unsupported()
  }
  @Unsupported
  show: IAccessibleViewService['show'] = (): never => {
    unsupported()
  }
  @Unsupported
  getPosition: IAccessibleViewService['getPosition'] = (): never => {
    unsupported()
  }
  @Unsupported
  setPosition: IAccessibleViewService['setPosition'] = (): never => {
    unsupported()
  }
  @Unsupported
  getLastPosition: IAccessibleViewService['getLastPosition'] = (): never => {
    unsupported()
  }
}
registerSingleton(IAccessibleViewService, AccessibleViewService, InstantiationType.Delayed)
class AccessibleViewInformationService implements IAccessibleViewInformationService {
  _serviceBrand: undefined
  hasShownAccessibleView: IAccessibleViewInformationService['hasShownAccessibleView'] = () => false
}
registerSingleton(
  IAccessibleViewInformationService,
  AccessibleViewInformationService,
  InstantiationType.Delayed
)
class WorkbenchExtensionManagementService implements IWorkbenchExtensionManagementService {
  preferPreReleases: IWorkbenchExtensionManagementService['preferPreReleases'] = false
  _serviceBrand: undefined
  onProfileAwareDidInstallExtensions: IWorkbenchExtensionManagementService['onProfileAwareDidInstallExtensions'] =
    Event.None
  onProfileAwareDidUninstallExtension: IWorkbenchExtensionManagementService['onProfileAwareDidUninstallExtension'] =
    Event.None
  onProfileAwareDidUpdateExtensionMetadata: IWorkbenchExtensionManagementService['onProfileAwareDidUpdateExtensionMetadata'] =
    Event.None
  @Unsupported
  toggleApplicationScope: IWorkbenchExtensionManagementService['toggleApplicationScope'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  uninstallExtensions: IWorkbenchExtensionManagementService['uninstallExtensions'] = (): never => {
    unsupported()
  }
  @Unsupported
  resetPinnedStateForAllUserExtensions: IWorkbenchExtensionManagementService['resetPinnedStateForAllUserExtensions'] =
    (): never => {
      unsupported()
    }
  getInstalledWorkspaceExtensionLocations: IWorkbenchExtensionManagementService['getInstalledWorkspaceExtensionLocations'] =
    () => []
  onDidEnableExtensions: IWorkbenchExtensionManagementService['onDidEnableExtensions'] = Event.None
  getExtensions: IWorkbenchExtensionManagementService['getExtensions'] = async () => []
  getInstalledWorkspaceExtensions: IWorkbenchExtensionManagementService['getInstalledWorkspaceExtensions'] =
    async () => []
  @Unsupported
  installResourceExtension: IWorkbenchExtensionManagementService['installResourceExtension'] =
    (): never => {
      unsupported()
    }
  onInstallExtension: IWorkbenchExtensionManagementService['onInstallExtension'] = Event.None
  onDidInstallExtensions: IWorkbenchExtensionManagementService['onDidInstallExtensions'] =
    Event.None
  onUninstallExtension: IWorkbenchExtensionManagementService['onUninstallExtension'] = Event.None
  onDidUninstallExtension: IWorkbenchExtensionManagementService['onDidUninstallExtension'] =
    Event.None
  onDidChangeProfile: IWorkbenchExtensionManagementService['onDidChangeProfile'] = Event.None
  @Unsupported
  installVSIX: IWorkbenchExtensionManagementService['installVSIX'] = (): never => {
    unsupported()
  }
  @Unsupported
  installFromLocation: IWorkbenchExtensionManagementService['installFromLocation'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateFromGallery: IWorkbenchExtensionManagementService['updateFromGallery'] = (): never => {
    unsupported()
  }
  onDidUpdateExtensionMetadata: IWorkbenchExtensionManagementService['onDidUpdateExtensionMetadata'] =
    Event.None
  @Unsupported
  zip: IWorkbenchExtensionManagementService['zip'] = (): never => {
    unsupported()
  }
  @Unsupported
  getManifest: IWorkbenchExtensionManagementService['getManifest'] = (): never => {
    unsupported()
  }
  @Unsupported
  install: IWorkbenchExtensionManagementService['install'] = (): never => {
    unsupported()
  }
  @Unsupported
  canInstall: IWorkbenchExtensionManagementService['canInstall'] = (): never => {
    unsupported()
  }
  @Unsupported
  installFromGallery: IWorkbenchExtensionManagementService['installFromGallery'] = (): never => {
    unsupported()
  }
  @Unsupported
  installGalleryExtensions: IWorkbenchExtensionManagementService['installGalleryExtensions'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  installExtensionsFromProfile: IWorkbenchExtensionManagementService['installExtensionsFromProfile'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  uninstall: IWorkbenchExtensionManagementService['uninstall'] = (): never => {
    unsupported()
  }
  getInstalled: IWorkbenchExtensionManagementService['getInstalled'] = async () => []
  @Unsupported
  getExtensionsControlManifest: IWorkbenchExtensionManagementService['getExtensionsControlManifest'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  copyExtensions: IWorkbenchExtensionManagementService['copyExtensions'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateMetadata: IWorkbenchExtensionManagementService['updateMetadata'] = (): never => {
    unsupported()
  }
  @Unsupported
  download: IWorkbenchExtensionManagementService['download'] = (): never => {
    unsupported()
  }
  @Unsupported
  registerParticipant: IWorkbenchExtensionManagementService['registerParticipant'] = (): never => {
    unsupported()
  }
  @Unsupported
  getTargetPlatform: IWorkbenchExtensionManagementService['getTargetPlatform'] = (): never => {
    unsupported()
  }
  @Unsupported
  cleanUp: IWorkbenchExtensionManagementService['cleanUp'] = (): never => {
    unsupported()
  }
  getInstallableServers: IWorkbenchExtensionManagementService['getInstallableServers'] =
    async () => []
  isPublisherTrusted: IWorkbenchExtensionManagementService['isPublisherTrusted'] = () => false
  getTrustedPublishers: IWorkbenchExtensionManagementService['getTrustedPublishers'] = () => []
  @Unsupported
  requestPublisherTrust: IWorkbenchExtensionManagementService['requestPublisherTrust'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  trustPublishers: IWorkbenchExtensionManagementService['trustPublishers'] = (): never => {
    unsupported()
  }
  @Unsupported
  untrustPublishers: IWorkbenchExtensionManagementService['untrustPublishers'] = (): never => {
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
  prefersExecuteOnUI: IExtensionManifestPropertiesService['prefersExecuteOnUI'] = (): never => {
    unsupported()
  }
  @Unsupported
  prefersExecuteOnWorkspace: IExtensionManifestPropertiesService['prefersExecuteOnWorkspace'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  prefersExecuteOnWeb: IExtensionManifestPropertiesService['prefersExecuteOnWeb'] = (): never => {
    unsupported()
  }
  @Unsupported
  canExecuteOnUI: IExtensionManifestPropertiesService['canExecuteOnUI'] = (): never => {
    unsupported()
  }
  @Unsupported
  canExecuteOnWorkspace: IExtensionManifestPropertiesService['canExecuteOnWorkspace'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  canExecuteOnWeb: IExtensionManifestPropertiesService['canExecuteOnWeb'] = (): never => {
    unsupported()
  }
  @Unsupported
  getExtensionKind: IExtensionManifestPropertiesService['getExtensionKind'] = (): never => {
    unsupported()
  }
  @Unsupported
  getUserConfiguredExtensionKind: IExtensionManifestPropertiesService['getUserConfiguredExtensionKind'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  getExtensionUntrustedWorkspaceSupportType: IExtensionManifestPropertiesService['getExtensionUntrustedWorkspaceSupportType'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  getExtensionVirtualWorkspaceSupportType: IExtensionManifestPropertiesService['getExtensionVirtualWorkspaceSupportType'] =
    (): never => {
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
  isWorkspaceTrustEnabled: IWorkspaceTrustEnablementService['isWorkspaceTrustEnabled'] =
    (): boolean => {
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
  @Unsupported
  whenExtensionsReady: IRemoteExtensionsScannerService['whenExtensionsReady'] = (): never => {
    unsupported()
  }
  scanExtensions: IRemoteExtensionsScannerService['scanExtensions'] = async (): Promise<
    Readonly<IRelaxedExtensionDescription>[]
  > => {
    return []
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
  create: IURLService['create'] = (): never => {
    unsupported()
  }
  open: IURLService['open'] = async () => false
  @Unsupported
  registerHandler: IURLService['registerHandler'] = (): never => {
    unsupported()
  }
}
registerSingleton(IURLService, URLService, InstantiationType.Delayed)
class RemoteSocketFactoryService implements IRemoteSocketFactoryService {
  _serviceBrand: undefined
  @Unsupported
  register: IRemoteSocketFactoryService['register'] = (): never => {
    unsupported()
  }
  @Unsupported
  connect: IRemoteSocketFactoryService['connect'] = (): never => {
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
  onDidChangeQuickDiffProviders: IQuickDiffService['onDidChangeQuickDiffProviders'] = Event.None
  providers: IQuickDiffService['providers'] = []
  isQuickDiffProviderVisible: IQuickDiffService['isQuickDiffProviderVisible'] = () => false
  @Unsupported
  addQuickDiffProvider: IQuickDiffService['addQuickDiffProvider'] = (): never => {
    unsupported()
  }
  @Unsupported
  toggleQuickDiffProviderVisibility: IQuickDiffService['toggleQuickDiffProviderVisibility'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  getQuickDiffs: IQuickDiffService['getQuickDiffs'] = (): never => {
    unsupported()
  }
}
registerSingleton(IQuickDiffService, QuickDiffService, InstantiationType.Delayed)
class SCMService implements ISCMService {
  _serviceBrand: undefined
  onDidAddRepository: ISCMService['onDidAddRepository'] = Event.None
  onDidRemoveRepository: ISCMService['onDidRemoveRepository'] = Event.None
  repositories: ISCMService['repositories'] = []
  repositoryCount: ISCMService['repositoryCount'] = 0
  @Unsupported
  registerSCMProvider: ISCMService['registerSCMProvider'] = (): never => {
    unsupported()
  }
  @Unsupported
  getRepository: ISCMService['getRepository'] = (): never => {
    unsupported()
  }
}
registerSingleton(ISCMService, SCMService, InstantiationType.Delayed)
class DownloadService implements IDownloadService {
  _serviceBrand: undefined
  @Unsupported
  download: IDownloadService['download'] = (): never => {
    unsupported()
  }
}
registerSingleton(IDownloadService, DownloadService, InstantiationType.Delayed)
class ExtensionUrlHandler implements IExtensionUrlHandler {
  _serviceBrand: undefined
  @Unsupported
  registerExtensionHandler: IExtensionUrlHandler['registerExtensionHandler'] = (): never => {
    unsupported()
  }
  @Unsupported
  unregisterExtensionHandler: IExtensionUrlHandler['unregisterExtensionHandler'] = (): never => {
    unsupported()
  }
}
registerSingleton(IExtensionUrlHandler, ExtensionUrlHandler, InstantiationType.Delayed)
class CommentService implements ICommentService {
  _serviceBrand: undefined
  lastActiveCommentcontroller: ICommentService['lastActiveCommentcontroller'] = undefined
  onResourceHasCommentingRanges: ICommentService['onResourceHasCommentingRanges'] = Event.None
  @Unsupported
  get commentsModel() {
    return unsupported()
  }
  resourceHasCommentingRanges: ICommentService['resourceHasCommentingRanges'] = () => false
  onDidChangeActiveEditingCommentThread: ICommentService['onDidChangeActiveEditingCommentThread'] =
    Event.None
  @Unsupported
  setActiveEditingCommentThread: ICommentService['setActiveEditingCommentThread'] = (): never => {
    unsupported()
  }
  @Unsupported
  setActiveCommentAndThread: ICommentService['setActiveCommentAndThread'] = (): never => {
    unsupported()
  }
  onDidSetResourceCommentInfos: ICommentService['onDidSetResourceCommentInfos'] = Event.None
  onDidSetAllCommentThreads: ICommentService['onDidSetAllCommentThreads'] = Event.None
  onDidUpdateCommentThreads: ICommentService['onDidUpdateCommentThreads'] = Event.None
  onDidUpdateNotebookCommentThreads: ICommentService['onDidUpdateNotebookCommentThreads'] =
    Event.None
  onDidChangeCurrentCommentThread: ICommentService['onDidChangeCurrentCommentThread'] = Event.None
  onDidUpdateCommentingRanges: ICommentService['onDidUpdateCommentingRanges'] = Event.None
  onDidChangeActiveCommentingRange: ICommentService['onDidChangeActiveCommentingRange'] = Event.None
  onDidSetDataProvider: ICommentService['onDidSetDataProvider'] = Event.None
  onDidDeleteDataProvider: ICommentService['onDidDeleteDataProvider'] = Event.None
  onDidChangeCommentingEnabled: ICommentService['onDidChangeCommentingEnabled'] = Event.None
  isCommentingEnabled: ICommentService['isCommentingEnabled'] = false
  @Unsupported
  setDocumentComments: ICommentService['setDocumentComments'] = (): never => {
    unsupported()
  }
  @Unsupported
  setWorkspaceComments: ICommentService['setWorkspaceComments'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeWorkspaceComments: ICommentService['removeWorkspaceComments'] = (): never => {
    unsupported()
  }
  @Unsupported
  registerCommentController: ICommentService['registerCommentController'] = (): never => {
    unsupported()
  }
  unregisterCommentController: ICommentService['unregisterCommentController'] = () => {}
  @Unsupported
  getCommentController: ICommentService['getCommentController'] = (): never => {
    unsupported()
  }
  @Unsupported
  createCommentThreadTemplate: ICommentService['createCommentThreadTemplate'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateCommentThreadTemplate: ICommentService['updateCommentThreadTemplate'] = (): never => {
    unsupported()
  }
  @Unsupported
  getCommentMenus: ICommentService['getCommentMenus'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateComments: ICommentService['updateComments'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateNotebookComments: ICommentService['updateNotebookComments'] = (): never => {
    unsupported()
  }
  @Unsupported
  disposeCommentThread: ICommentService['disposeCommentThread'] = (): never => {
    unsupported()
  }
  getDocumentComments: ICommentService['getDocumentComments'] = async () => []
  getNotebookComments: ICommentService['getNotebookComments'] = async () => []
  @Unsupported
  updateCommentingRanges: ICommentService['updateCommentingRanges'] = (): never => {
    unsupported()
  }
  @Unsupported
  hasReactionHandler: ICommentService['hasReactionHandler'] = (): never => {
    unsupported()
  }
  @Unsupported
  toggleReaction: ICommentService['toggleReaction'] = (): never => {
    unsupported()
  }
  @Unsupported
  setCurrentCommentThread: ICommentService['setCurrentCommentThread'] = (): never => {
    unsupported()
  }
  @Unsupported
  enableCommenting: ICommentService['enableCommenting'] = (): never => {
    unsupported()
  }
  @Unsupported
  registerContinueOnCommentProvider: ICommentService['registerContinueOnCommentProvider'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  removeContinueOnComment: ICommentService['removeContinueOnComment'] = (): never => {
    unsupported()
  }
}
registerSingleton(ICommentService, CommentService, InstantiationType.Delayed)
class NotebookCellStatusBarService implements INotebookCellStatusBarService {
  _serviceBrand: undefined
  onDidChangeProviders: INotebookCellStatusBarService['onDidChangeProviders'] = Event.None
  onDidChangeItems: INotebookCellStatusBarService['onDidChangeItems'] = Event.None
  @Unsupported
  registerCellStatusBarItemProvider: INotebookCellStatusBarService['registerCellStatusBarItemProvider'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  getStatusBarItemsForCell: INotebookCellStatusBarService['getStatusBarItemsForCell'] =
    (): never => {
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
  onDidNotebookVariablesUpdate: INotebookKernelService['onDidNotebookVariablesUpdate'] = Event.None
  @Unsupported
  notifyVariablesChange: INotebookKernelService['notifyVariablesChange'] = (): never => {
    unsupported()
  }
  onDidAddKernel: INotebookKernelService['onDidAddKernel'] = Event.None
  onDidRemoveKernel: INotebookKernelService['onDidRemoveKernel'] = Event.None
  onDidChangeSelectedNotebooks: INotebookKernelService['onDidChangeSelectedNotebooks'] = Event.None
  onDidChangeNotebookAffinity: INotebookKernelService['onDidChangeNotebookAffinity'] = Event.None
  @Unsupported
  registerKernel: INotebookKernelService['registerKernel'] = (): never => {
    unsupported()
  }
  @Unsupported
  getMatchingKernel: INotebookKernelService['getMatchingKernel'] = (): never => {
    unsupported()
  }
  @Unsupported
  getSelectedOrSuggestedKernel: INotebookKernelService['getSelectedOrSuggestedKernel'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  selectKernelForNotebook: INotebookKernelService['selectKernelForNotebook'] = (): never => {
    unsupported()
  }
  @Unsupported
  preselectKernelForNotebook: INotebookKernelService['preselectKernelForNotebook'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateKernelNotebookAffinity: INotebookKernelService['updateKernelNotebookAffinity'] =
    (): never => {
      unsupported()
    }
  onDidChangeKernelDetectionTasks: INotebookKernelService['onDidChangeKernelDetectionTasks'] =
    Event.None
  @Unsupported
  registerNotebookKernelDetectionTask: INotebookKernelService['registerNotebookKernelDetectionTask'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  getKernelDetectionTasks: INotebookKernelService['getKernelDetectionTasks'] = (): never => {
    unsupported()
  }
  onDidChangeSourceActions: INotebookKernelService['onDidChangeSourceActions'] = Event.None
  @Unsupported
  getSourceActions: INotebookKernelService['getSourceActions'] = (): never => {
    unsupported()
  }
  @Unsupported
  getRunningSourceActions: INotebookKernelService['getRunningSourceActions'] = (): never => {
    unsupported()
  }
  @Unsupported
  registerKernelSourceActionProvider: INotebookKernelService['registerKernelSourceActionProvider'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  getKernelSourceActions2: INotebookKernelService['getKernelSourceActions2'] = (): never => {
    unsupported()
  }
}
registerSingleton(INotebookKernelService, NotebookKernelService, InstantiationType.Delayed)
class NotebookRendererMessagingService implements INotebookRendererMessagingService {
  _serviceBrand: undefined
  onShouldPostMessage: INotebookRendererMessagingService['onShouldPostMessage'] = Event.None
  @Unsupported
  prepare: INotebookRendererMessagingService['prepare'] = (): never => {
    unsupported()
  }
  @Unsupported
  getScoped: INotebookRendererMessagingService['getScoped'] = (): never => {
    unsupported()
  }
  @Unsupported
  receiveMessage: INotebookRendererMessagingService['receiveMessage'] = (): never => {
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
  matchesCurrent: IInteractiveHistoryService['matchesCurrent'] = () => false
  @Unsupported
  addToHistory: IInteractiveHistoryService['addToHistory'] = (): never => {
    unsupported()
  }
  @Unsupported
  getPreviousValue: IInteractiveHistoryService['getPreviousValue'] = (): never => {
    unsupported()
  }
  @Unsupported
  getNextValue: IInteractiveHistoryService['getNextValue'] = (): never => {
    unsupported()
  }
  @Unsupported
  replaceLast: IInteractiveHistoryService['replaceLast'] = (): never => {
    unsupported()
  }
  @Unsupported
  clearHistory: IInteractiveHistoryService['clearHistory'] = (): never => {
    unsupported()
  }
  @Unsupported
  has: IInteractiveHistoryService['has'] = (): never => {
    unsupported()
  }
}
registerSingleton(IInteractiveHistoryService, InteractiveHistoryService, InstantiationType.Delayed)
class InteractiveDocumentService implements IInteractiveDocumentService {
  _serviceBrand: undefined
  onWillAddInteractiveDocument: IInteractiveDocumentService['onWillAddInteractiveDocument'] =
    Event.None
  onWillRemoveInteractiveDocument: IInteractiveDocumentService['onWillRemoveInteractiveDocument'] =
    Event.None
  @Unsupported
  willCreateInteractiveDocument: IInteractiveDocumentService['willCreateInteractiveDocument'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  willRemoveInteractiveDocument: IInteractiveDocumentService['willRemoveInteractiveDocument'] =
    (): never => {
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
  getExtensionIdProvidingCurrentLocale: IActiveLanguagePackService['getExtensionIdProvidingCurrentLocale'] =
    async (): Promise<string | undefined> => {
      return getExtensionIdProvidingCurrentLocale()
    }
}
registerSingleton(IActiveLanguagePackService, ActiveLanguagePackService, InstantiationType.Eager)
class RemoteUserDataProfilesService implements IRemoteUserDataProfilesService {
  _serviceBrand: undefined
  getRemoteProfiles: IRemoteUserDataProfilesService['getRemoteProfiles'] = async () => []
  @Unsupported
  getRemoteProfile: IRemoteUserDataProfilesService['getRemoteProfile'] = (): never => {
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
  isDisabledByBisect: IExtensionBisectService['isDisabledByBisect'] = () => false
  isActive: IExtensionBisectService['isActive'] = false
  disabledCount: IExtensionBisectService['disabledCount'] = 0
  @Unsupported
  start: IExtensionBisectService['start'] = (): never => {
    unsupported()
  }
  @Unsupported
  next: IExtensionBisectService['next'] = (): never => {
    unsupported()
  }
  @Unsupported
  reset: IExtensionBisectService['reset'] = (): never => {
    unsupported()
  }
}
registerSingleton(IExtensionBisectService, ExtensionBisectService, InstantiationType.Eager)
class UserDataSyncAccountService implements IUserDataSyncAccountService {
  _serviceBrand: undefined
  readonly onTokenFailed: IUserDataSyncAccountService['onTokenFailed'] = Event.None
  readonly account: IUserDataSyncAccountService['account'] = undefined
  readonly onDidChangeAccount: IUserDataSyncAccountService['onDidChangeAccount'] = Event.None
  updateAccount: IUserDataSyncAccountService['updateAccount'] = (): Promise<void> => {
    return Promise.resolve()
  }
}
registerSingleton(IUserDataSyncAccountService, UserDataSyncAccountService, InstantiationType.Eager)
class ChatWidgetService implements IChatWidgetService {
  _serviceBrand: undefined
  getWidgetsByLocations: IChatWidgetService['getWidgetsByLocations'] = () => []
  onDidAddWidget: IChatWidgetService['onDidAddWidget'] = Event.None
  getAllWidgets: IChatWidgetService['getAllWidgets'] = () => []
  getWidgetBySessionId: IChatWidgetService['getWidgetBySessionId'] = () => undefined
  lastFocusedWidget: IChatWidgetService['lastFocusedWidget'] = undefined
  @Unsupported
  getWidgetByInputUri: IChatWidgetService['getWidgetByInputUri'] = (): never => {
    unsupported()
  }
}
registerSingleton(IChatWidgetService, ChatWidgetService, InstantiationType.Delayed)
class RemoteExplorerService implements IRemoteExplorerService {
  onDidChangeHelpInformation: IRemoteExplorerService['onDidChangeHelpInformation'] = Event.None
  @Unsupported
  get helpInformation() {
    return unsupported()
  }
  _serviceBrand: undefined
  onDidChangeTargetType: IRemoteExplorerService['onDidChangeTargetType'] = Event.None
  targetType: IRemoteExplorerService['targetType'] = []
  @Unsupported
  get tunnelModel() {
    return unsupported()
  }
  onDidChangeEditable: IRemoteExplorerService['onDidChangeEditable'] = Event.None
  @Unsupported
  setEditable: IRemoteExplorerService['setEditable'] = (): never => {
    unsupported()
  }
  @Unsupported
  getEditableData: IRemoteExplorerService['getEditableData'] = (): never => {
    unsupported()
  }
  @Unsupported
  forward: IRemoteExplorerService['forward'] = (): never => {
    unsupported()
  }
  @Unsupported
  close: IRemoteExplorerService['close'] = (): never => {
    unsupported()
  }
  @Unsupported
  setTunnelInformation: IRemoteExplorerService['setTunnelInformation'] = (): never => {
    unsupported()
  }
  @Unsupported
  setCandidateFilter: IRemoteExplorerService['setCandidateFilter'] = (): never => {
    unsupported()
  }
  @Unsupported
  onFoundNewCandidates: IRemoteExplorerService['onFoundNewCandidates'] = (): never => {
    unsupported()
  }
  @Unsupported
  restore: IRemoteExplorerService['restore'] = (): never => {
    unsupported()
  }
  @Unsupported
  enablePortsFeatures: IRemoteExplorerService['enablePortsFeatures'] = (): never => {
    unsupported()
  }
  onEnabledPortsFeatures: IRemoteExplorerService['onEnabledPortsFeatures'] = Event.None
  portsFeaturesEnabled: IRemoteExplorerService['portsFeaturesEnabled'] = PortsEnablement.Disabled
  namedProcesses: IRemoteExplorerService['namedProcesses'] = new Map()
}
registerSingleton(IRemoteExplorerService, RemoteExplorerService, InstantiationType.Delayed)
class AuthenticationService implements IAuthenticationService {
  _serviceBrand: undefined
  getAccounts: IAuthenticationService['getAccounts'] = async () => []
  onDidRegisterAuthenticationProvider: IAuthenticationService['onDidRegisterAuthenticationProvider'] =
    Event.None
  onDidUnregisterAuthenticationProvider: IAuthenticationService['onDidUnregisterAuthenticationProvider'] =
    Event.None
  onDidChangeSessions: IAuthenticationService['onDidChangeSessions'] = Event.None
  onDidChangeDeclaredProviders: IAuthenticationService['onDidChangeDeclaredProviders'] = Event.None
  declaredProviders: IAuthenticationService['declaredProviders'] = []
  @Unsupported
  registerDeclaredAuthenticationProvider: IAuthenticationService['registerDeclaredAuthenticationProvider'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  unregisterDeclaredAuthenticationProvider: IAuthenticationService['unregisterDeclaredAuthenticationProvider'] =
    (): never => {
      unsupported()
    }
  isAuthenticationProviderRegistered: IAuthenticationService['isAuthenticationProviderRegistered'] =
    () => false
  @Unsupported
  registerAuthenticationProvider: IAuthenticationService['registerAuthenticationProvider'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  unregisterAuthenticationProvider: IAuthenticationService['unregisterAuthenticationProvider'] =
    (): never => {
      unsupported()
    }
  getProviderIds: IAuthenticationService['getProviderIds'] = () => []
  @Unsupported
  getProvider: IAuthenticationService['getProvider'] = (): never => {
    unsupported()
  }
  @Unsupported
  getSessions: IAuthenticationService['getSessions'] = (): never => {
    unsupported()
  }
  @Unsupported
  createSession: IAuthenticationService['createSession'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeSession: IAuthenticationService['removeSession'] = (): never => {
    unsupported()
  }
  getOrActivateProviderIdForServer: IAuthenticationService['getOrActivateProviderIdForServer'] =
    async () => undefined
  registerAuthenticationProviderHostDelegate: IAuthenticationService['registerAuthenticationProviderHostDelegate'] =
    () => Disposable.None
  createDynamicAuthenticationProvider: IAuthenticationService['createDynamicAuthenticationProvider'] =
    async () => undefined
}
registerSingleton(IAuthenticationService, AuthenticationService, InstantiationType.Delayed)
class AuthenticationAccessService implements IAuthenticationAccessService {
  _serviceBrand: undefined
  onDidChangeExtensionSessionAccess: IAuthenticationAccessService['onDidChangeExtensionSessionAccess'] =
    Event.None
  isAccessAllowed: IAuthenticationAccessService['isAccessAllowed'] = () => false
  readAllowedExtensions: IAuthenticationAccessService['readAllowedExtensions'] = () => []
  @Unsupported
  updateAllowedExtensions: IAuthenticationAccessService['updateAllowedExtensions'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeAllowedExtensions: IAuthenticationAccessService['removeAllowedExtensions'] = (): never => {
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
  onDidChangeAccountPreference: IAuthenticationExtensionsService['onDidChangeAccountPreference'] =
    Event.None
  getAccountPreference: IAuthenticationExtensionsService['getAccountPreference'] = () => undefined
  @Unsupported
  updateAccountPreference: IAuthenticationExtensionsService['updateAccountPreference'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  removeAccountPreference: IAuthenticationExtensionsService['removeAccountPreference'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  updateSessionPreference: IAuthenticationExtensionsService['updateSessionPreference'] =
    (): never => {
      unsupported()
    }
  getSessionPreference: IAuthenticationExtensionsService['getSessionPreference'] = () => undefined
  @Unsupported
  removeSessionPreference: IAuthenticationExtensionsService['removeSessionPreference'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  selectSession: IAuthenticationExtensionsService['selectSession'] = (): never => {
    unsupported()
  }
  @Unsupported
  requestSessionAccess: IAuthenticationExtensionsService['requestSessionAccess'] = (): never => {
    unsupported()
  }
  @Unsupported
  requestNewSession: IAuthenticationExtensionsService['requestNewSession'] = (): never => {
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
  initializeExtensionUsageCache: IAuthenticationUsageService['initializeExtensionUsageCache'] =
    (): never => {
      unsupported()
    }
  extensionUsesAuth: IAuthenticationUsageService['extensionUsesAuth'] = async () => false
  @Unsupported
  readAccountUsages: IAuthenticationUsageService['readAccountUsages'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeAccountUsage: IAuthenticationUsageService['removeAccountUsage'] = (): never => {
    unsupported()
  }
  @Unsupported
  addAccountUsage: IAuthenticationUsageService['addAccountUsage'] = (): never => {
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
  onDidChangeProviders: ITimelineService['onDidChangeProviders'] = Event.None
  onDidChangeTimeline: ITimelineService['onDidChangeTimeline'] = Event.None
  onDidChangeUri: ITimelineService['onDidChangeUri'] = Event.None
  @Unsupported
  registerTimelineProvider: ITimelineService['registerTimelineProvider'] = (): never => {
    unsupported()
  }
  @Unsupported
  unregisterTimelineProvider: ITimelineService['unregisterTimelineProvider'] = (): never => {
    unsupported()
  }
  getSources: ITimelineService['getSources'] = () => []
  @Unsupported
  getTimeline: ITimelineService['getTimeline'] = (): never => {
    unsupported()
  }
  @Unsupported
  setUri: ITimelineService['setUri'] = (): never => {
    unsupported()
  }
}
registerSingleton(ITimelineService, TimelineService, InstantiationType.Delayed)
class TestService implements ITestService {
  _serviceBrand: undefined
  getTestsRelatedToCode: ITestService['getTestsRelatedToCode'] = async () => []
  getCodeRelatedToTest: ITestService['getCodeRelatedToTest'] = async () => []
  registerExtHost: ITestService['registerExtHost'] = () => Disposable.None
  @Unsupported
  provideTestFollowups: ITestService['provideTestFollowups'] = (): never => {
    unsupported()
  }
  onDidCancelTestRun: ITestService['onDidCancelTestRun'] = Event.None
  @Unsupported
  get excluded() {
    return unsupported()
  }
  @Unsupported
  get collection() {
    return unsupported()
  }
  onWillProcessDiff: ITestService['onWillProcessDiff'] = Event.None
  onDidProcessDiff: ITestService['onDidProcessDiff'] = Event.None
  @Unsupported
  get showInlineOutput() {
    return unsupported()
  }
  @Unsupported
  registerTestController: ITestService['registerTestController'] = (): never => {
    unsupported()
  }
  getTestController: ITestService['getTestController'] = () => undefined
  @Unsupported
  refreshTests: ITestService['refreshTests'] = (): never => {
    unsupported()
  }
  @Unsupported
  cancelRefreshTests: ITestService['cancelRefreshTests'] = (): never => {
    unsupported()
  }
  @Unsupported
  startContinuousRun: ITestService['startContinuousRun'] = (): never => {
    unsupported()
  }
  @Unsupported
  runTests: ITestService['runTests'] = (): never => {
    unsupported()
  }
  @Unsupported
  runResolvedTests: ITestService['runResolvedTests'] = (): never => {
    unsupported()
  }
  @Unsupported
  syncTests: ITestService['syncTests'] = (): never => {
    unsupported()
  }
  @Unsupported
  cancelTestRun: ITestService['cancelTestRun'] = (): never => {
    unsupported()
  }
  @Unsupported
  publishDiff: ITestService['publishDiff'] = (): never => {
    unsupported()
  }
}
registerSingleton(ITestService, TestService, InstantiationType.Delayed)
class SecretStorageService implements ISecretStorageService {
  _serviceBrand: undefined
  onDidChangeSecret: ISecretStorageService['onDidChangeSecret'] = Event.None
  type: ISecretStorageService['type'] = 'in-memory' as const
  get: ISecretStorageService['get'] = async () => undefined
  @Unsupported
  set: ISecretStorageService['set'] = (): never => {
    unsupported()
  }
  @Unsupported
  delete: ISecretStorageService['delete'] = (): never => {
    unsupported()
  }
}
registerSingleton(ISecretStorageService, SecretStorageService, InstantiationType.Delayed)
class ShareService implements IShareService {
  _serviceBrand: undefined
  @Unsupported
  registerShareProvider: IShareService['registerShareProvider'] = (): never => {
    unsupported()
  }
  getShareActions: IShareService['getShareActions'] = () => []
  provideShare: IShareService['provideShare'] = async () => undefined
}
registerSingleton(IShareService, ShareService, InstantiationType.Delayed)
class UserDataProfileImportExportService implements IUserDataProfileImportExportService {
  _serviceBrand: undefined
  createProfileFromTemplate: IUserDataProfileImportExportService['createProfileFromTemplate'] =
    async () => undefined
  resolveProfileTemplate: IUserDataProfileImportExportService['resolveProfileTemplate'] =
    async () => null
  @Unsupported
  createFromProfile: IUserDataProfileImportExportService['createFromProfile'] = (): never => {
    unsupported()
  }
  registerProfileContentHandler: IUserDataProfileImportExportService['registerProfileContentHandler'] =
    () => Disposable.None
  unregisterProfileContentHandler: IUserDataProfileImportExportService['unregisterProfileContentHandler'] =
    () => {}
  @Unsupported
  exportProfile: IUserDataProfileImportExportService['exportProfile'] = (): never => {
    unsupported()
  }
  @Unsupported
  createTroubleshootProfile: IUserDataProfileImportExportService['createTroubleshootProfile'] =
    (): never => {
      unsupported()
    }
}
registerSingleton(
  IUserDataProfileImportExportService,
  UserDataProfileImportExportService,
  InstantiationType.Delayed
)
class WorkbenchIssueService implements IWorkbenchIssueService {
  _serviceBrand: undefined
  @Unsupported
  openReporter: IWorkbenchIssueService['openReporter'] = (): never => {
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
  repositories: ISCMViewService['repositories'] = []
  onDidChangeRepositories: ISCMViewService['onDidChangeRepositories'] = Event.None
  visibleRepositories: ISCMViewService['visibleRepositories'] = []
  onDidChangeVisibleRepositories: ISCMViewService['onDidChangeVisibleRepositories'] = Event.None
  isVisible: ISCMViewService['isVisible'] = () => false
  @Unsupported
  toggleVisibility: ISCMViewService['toggleVisibility'] = (): never => {
    unsupported()
  }
  @Unsupported
  toggleSortKey: ISCMViewService['toggleSortKey'] = (): never => {
    unsupported()
  }
  focusedRepository: ISCMViewService['focusedRepository'] = undefined
  onDidFocusRepository: ISCMViewService['onDidFocusRepository'] = Event.None
  @Unsupported
  focus: ISCMViewService['focus'] = (): never => {
    unsupported()
  }
  @Unsupported
  pinActiveRepository: ISCMViewService['pinActiveRepository'] = (): never => {
    unsupported()
  }
}
registerSingleton(ISCMViewService, SCMViewService, InstantiationType.Delayed)
class NotebookExecutionStateService implements INotebookExecutionStateService {
  _serviceBrand: undefined
  getLastCompletedCellForNotebook: INotebookExecutionStateService['getLastCompletedCellForNotebook'] =
    () => undefined
  onDidChangeExecution: INotebookExecutionStateService['onDidChangeExecution'] = Event.None
  onDidChangeLastRunFailState: INotebookExecutionStateService['onDidChangeLastRunFailState'] =
    Event.None
  @Unsupported
  forceCancelNotebookExecutions: INotebookExecutionStateService['forceCancelNotebookExecutions'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  getCellExecutionsForNotebook: INotebookExecutionStateService['getCellExecutionsForNotebook'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  getCellExecutionsByHandleForNotebook: INotebookExecutionStateService['getCellExecutionsByHandleForNotebook'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  getCellExecution: INotebookExecutionStateService['getCellExecution'] = (): never => {
    unsupported()
  }
  @Unsupported
  createCellExecution: INotebookExecutionStateService['createCellExecution'] = (): never => {
    unsupported()
  }
  @Unsupported
  getExecution: INotebookExecutionStateService['getExecution'] = (): never => {
    unsupported()
  }
  @Unsupported
  createExecution: INotebookExecutionStateService['createExecution'] = (): never => {
    unsupported()
  }
  @Unsupported
  getLastFailedCellForNotebook: INotebookExecutionStateService['getLastFailedCellForNotebook'] =
    (): never => {
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
  getDefaultProfileForTest: ITestProfileService['getDefaultProfileForTest'] = () => undefined
  onDidChange: ITestProfileService['onDidChange'] = Event.None
  @Unsupported
  addProfile: ITestProfileService['addProfile'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateProfile: ITestProfileService['updateProfile'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeProfile: ITestProfileService['removeProfile'] = (): never => {
    unsupported()
  }
  @Unsupported
  capabilitiesForTest: ITestProfileService['capabilitiesForTest'] = (): never => {
    unsupported()
  }
  @Unsupported
  configure: ITestProfileService['configure'] = (): never => {
    unsupported()
  }
  all: ITestProfileService['all'] = () => []
  getGroupDefaultProfiles: ITestProfileService['getGroupDefaultProfiles'] = () => []
  @Unsupported
  setGroupDefaultProfiles: ITestProfileService['setGroupDefaultProfiles'] = (): never => {
    unsupported()
  }
  getControllerProfiles: ITestProfileService['getControllerProfiles'] = () => []
}
registerSingleton(ITestProfileService, TestProfileService, InstantiationType.Delayed)
class EncryptionService implements IEncryptionService {
  @Unsupported
  setUsePlainTextEncryption: IEncryptionService['setUsePlainTextEncryption'] = (): never => {
    unsupported()
  }
  @Unsupported
  getKeyStorageProvider: IEncryptionService['getKeyStorageProvider'] = (): never => {
    unsupported()
  }
  _serviceBrand: undefined
  @Unsupported
  encrypt: IEncryptionService['encrypt'] = (): never => {
    unsupported()
  }
  @Unsupported
  decrypt: IEncryptionService['decrypt'] = (): never => {
    unsupported()
  }
  @Unsupported
  isEncryptionAvailable: IEncryptionService['isEncryptionAvailable'] = (): never => {
    unsupported()
  }
}
registerSingleton(IEncryptionService, EncryptionService, InstantiationType.Delayed)
class TestResultService implements ITestResultService {
  _serviceBrand: undefined
  onResultsChanged: ITestResultService['onResultsChanged'] = Event.None
  onTestChanged: ITestResultService['onTestChanged'] = Event.None
  results: ITestResultService['results'] = []
  @Unsupported
  clear: ITestResultService['clear'] = (): never => {
    unsupported()
  }
  @Unsupported
  createLiveResult: ITestResultService['createLiveResult'] = (): never => {
    unsupported()
  }
  @Unsupported
  push: ITestResultService['push'] = (): never => {
    unsupported()
  }
  getResult: ITestResultService['getResult'] = () => undefined
  getStateById: ITestResultService['getStateById'] = () => undefined
}
registerSingleton(ITestResultService, TestResultService, InstantiationType.Delayed)
class TestResultStorage implements ITestResultStorage {
  _serviceBrand: undefined
  @Unsupported
  read: ITestResultStorage['read'] = (): never => {
    unsupported()
  }
  @Unsupported
  persist: ITestResultStorage['persist'] = (): never => {
    unsupported()
  }
}
registerSingleton(ITestResultStorage, TestResultStorage, InstantiationType.Delayed)
class TestingDecorationsService implements ITestingDecorationsService {
  _serviceBrand: undefined
  @Unsupported
  updateDecorationsAlternateAction: ITestingDecorationsService['updateDecorationsAlternateAction'] =
    (): never => {
      unsupported()
    }
  onDidChange: ITestingDecorationsService['onDidChange'] = Event.None
  @Unsupported
  invalidateResultMessage: ITestingDecorationsService['invalidateResultMessage'] = (): never => {
    unsupported()
  }
  @Unsupported
  syncDecorations: ITestingDecorationsService['syncDecorations'] = (): never => {
    unsupported()
  }
  @Unsupported
  getDecoratedTestPosition: ITestingDecorationsService['getDecoratedTestPosition'] = (): never => {
    unsupported()
  }
}
registerSingleton(ITestingDecorationsService, TestingDecorationsService, InstantiationType.Delayed)
class UserDataInitializationService implements IUserDataInitializationService {
  _serviceBrand: undefined
  requiresInitialization: IUserDataInitializationService['requiresInitialization'] = async () =>
    false
  whenInitializationFinished: IUserDataInitializationService['whenInitializationFinished'] =
    async () => {}
  initializeRequiredResources: IUserDataInitializationService['initializeRequiredResources'] =
    async () => {}
  initializeInstalledExtensions: IUserDataInitializationService['initializeInstalledExtensions'] =
    async () => {}
  initializeOtherResources: IUserDataInitializationService['initializeOtherResources'] =
    async () => {}
}
registerSingleton(
  IUserDataInitializationService,
  UserDataInitializationService,
  InstantiationType.Delayed
)
registerSingleton(IDiagnosticsService, NullDiagnosticsService, InstantiationType.Delayed)
class NotebookSearchService implements INotebookSearchService {
  notebookSearch: INotebookSearchService['notebookSearch'] = () => {
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
  sendChatRequest: ILanguageModelsService['sendChatRequest'] = (): never => {
    unsupported()
  }
  @Unsupported
  selectLanguageModels: ILanguageModelsService['selectLanguageModels'] = (): never => {
    unsupported()
  }
  @Unsupported
  computeTokenLength: ILanguageModelsService['computeTokenLength'] = (): never => {
    unsupported()
  }
  onDidChangeLanguageModels: ILanguageModelsService['onDidChangeLanguageModels'] = Event.None
  getLanguageModelIds: ILanguageModelsService['getLanguageModelIds'] = () => []
  lookupLanguageModel: ILanguageModelsService['lookupLanguageModel'] = () => undefined
  @Unsupported
  registerLanguageModelChat: ILanguageModelsService['registerLanguageModelChat'] = (): never => {
    unsupported()
  }
}
registerSingleton(ILanguageModelsService, LanguageModelsService, InstantiationType.Delayed)
class ChatSlashCommandService implements IChatSlashCommandService {
  @Unsupported
  onDidChangeCommands: IChatSlashCommandService['onDidChangeCommands'] = (): never => {
    unsupported()
  }
  @Unsupported
  registerSlashCommand: IChatSlashCommandService['registerSlashCommand'] = (): never => {
    unsupported()
  }
  @Unsupported
  executeCommand: IChatSlashCommandService['executeCommand'] = (): never => {
    unsupported()
  }
  @Unsupported
  getCommands: IChatSlashCommandService['getCommands'] = (): never => {
    unsupported()
  }
  @Unsupported
  hasCommand: IChatSlashCommandService['hasCommand'] = (): never => {
    unsupported()
  }
  _serviceBrand: undefined
}
registerSingleton(IChatSlashCommandService, ChatSlashCommandService, InstantiationType.Delayed)
class ChatVariablesService implements IChatVariablesService {
  _serviceBrand: undefined
  @Unsupported
  getDynamicVariables: IChatVariablesService['getDynamicVariables'] = (): never => {
    unsupported()
  }
  @Unsupported
  getSelectedTools: IChatVariablesService['getSelectedTools'] = (): never => {
    unsupported()
  }
  @Unsupported
  getSelectedToolSets: IChatVariablesService['getSelectedToolSets'] = (): never => {
    unsupported()
  }
}
registerSingleton(IChatVariablesService, ChatVariablesService, InstantiationType.Delayed)
class AiRelatedInformationService implements IAiRelatedInformationService {
  isEnabled: IAiRelatedInformationService['isEnabled'] = () => false
  @Unsupported
  getRelatedInformation: IAiRelatedInformationService['getRelatedInformation'] = (): never => {
    unsupported()
  }
  @Unsupported
  registerAiRelatedInformationProvider: IAiRelatedInformationService['registerAiRelatedInformationProvider'] =
    (): never => {
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
  isEnabled: IAiEmbeddingVectorService['isEnabled'] = () => false
  @Unsupported
  getEmbeddingVector: IAiEmbeddingVectorService['getEmbeddingVector'] = (): never => {
    unsupported()
  }
  @Unsupported
  registerAiEmbeddingVectorProvider: IAiEmbeddingVectorService['registerAiEmbeddingVectorProvider'] =
    (): never => {
      unsupported()
    }
}
registerSingleton(IAiEmbeddingVectorService, AiEmbeddingVectorService, InstantiationType.Delayed)
class AiSettingsSearchService implements IAiSettingsSearchService {
  _serviceBrand: undefined
  isEnabled: IAiSettingsSearchService['isEnabled'] = () => false
  @Unsupported
  startSearch: IAiSettingsSearchService['startSearch'] = (): never => {
    unsupported()
  }
  getEmbeddingsResults: IAiSettingsSearchService['getEmbeddingsResults'] = async () => []
  getLLMRankedResults: IAiSettingsSearchService['getLLMRankedResults'] = async () => []
  @Unsupported
  registerSettingsSearchProvider: IAiSettingsSearchService['registerSettingsSearchProvider'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  handleSearchResult: IAiSettingsSearchService['handleSearchResult'] = (): never => {
    unsupported()
  }
  onProviderRegistered: IAiSettingsSearchService['onProviderRegistered'] = Event.None
}
registerSingleton(IAiSettingsSearchService, AiSettingsSearchService, InstantiationType.Delayed)
class SignService implements ISignService {
  _serviceBrand: undefined
  private static _nextId = 1
  createNewMessage: ISignService['createNewMessage'] = async (value: string): Promise<IMessage> => {
    const id = String(SignService._nextId++)
    return {
      id,
      data: value
    }
  }
  validate: ISignService['validate'] = async (): Promise<boolean> => {
    return true
  }
  sign: ISignService['sign'] = async (value: string): Promise<string> => {
    return value
  }
}
registerSingleton(ISignService, SignService, InstantiationType.Delayed)
class TestingContinuousRunService implements ITestingContinuousRunService {
  _serviceBrand: undefined
  @Unsupported
  isEnabledForProfile: ITestingContinuousRunService['isEnabledForProfile'] = (): never => {
    unsupported()
  }
  @Unsupported
  stopProfile: ITestingContinuousRunService['stopProfile'] = (): never => {
    unsupported()
  }
  lastRunProfileIds: ITestingContinuousRunService['lastRunProfileIds'] = new Set<number>()
  onDidChange: ITestingContinuousRunService['onDidChange'] = Event.None
  isSpecificallyEnabledFor: ITestingContinuousRunService['isSpecificallyEnabledFor'] = () => false
  isEnabledForAParentOf: ITestingContinuousRunService['isEnabledForAParentOf'] = () => false
  isEnabledForAChildOf: ITestingContinuousRunService['isEnabledForAChildOf'] = () => false
  isEnabled: ITestingContinuousRunService['isEnabled'] = () => false
  @Unsupported
  start: ITestingContinuousRunService['start'] = (): never => {
    unsupported()
  }
  @Unsupported
  stop: ITestingContinuousRunService['stop'] = (): never => {
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
  onDidSelectTestInExplorer: ITestExplorerFilterState['onDidSelectTestInExplorer'] = Event.None
  @Unsupported
  didSelectTestInExplorer: ITestExplorerFilterState['didSelectTestInExplorer'] = (): never => {
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
  onDidRequestInputFocus: ITestExplorerFilterState['onDidRequestInputFocus'] = Event.None
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
  focusInput: ITestExplorerFilterState['focusInput'] = (): never => {
    unsupported()
  }
  @Unsupported
  setText: ITestExplorerFilterState['setText'] = (): never => {
    unsupported()
  }
  isFilteringFor: ITestExplorerFilterState['isFilteringFor'] = () => false
  @Unsupported
  toggleFilteringFor: ITestExplorerFilterState['toggleFilteringFor'] = (): never => {
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
  tryPeekFirstError: ITestingPeekOpener['tryPeekFirstError'] = (): never => {
    unsupported()
  }
  @Unsupported
  peekUri: ITestingPeekOpener['peekUri'] = (): never => {
    unsupported()
  }
  @Unsupported
  openCurrentInEditor: ITestingPeekOpener['openCurrentInEditor'] = (): never => {
    unsupported()
  }
  @Unsupported
  open: ITestingPeekOpener['open'] = (): never => {
    unsupported()
  }
  @Unsupported
  closeAllPeeks: ITestingPeekOpener['closeAllPeeks'] = (): never => {
    unsupported()
  }
}
registerSingleton(ITestingPeekOpener, TestingPeekOpener, InstantiationType.Delayed)
class AuxiliaryWindowService implements IAuxiliaryWindowService {
  _serviceBrand: undefined
  getWindow: IAuxiliaryWindowService['getWindow'] = () => undefined
  onDidOpenAuxiliaryWindow: IAuxiliaryWindowService['onDidOpenAuxiliaryWindow'] = Event.None
  @Unsupported
  open: IAuxiliaryWindowService['open'] = (): never => {
    unsupported()
  }
}
registerSingleton(IAuxiliaryWindowService, AuxiliaryWindowService, InstantiationType.Delayed)
class SpeechService implements ISpeechService {
  _serviceBrand: undefined
  onDidStartTextToSpeechSession: ISpeechService['onDidStartTextToSpeechSession'] = Event.None
  onDidEndTextToSpeechSession: ISpeechService['onDidEndTextToSpeechSession'] = Event.None
  hasActiveTextToSpeechSession: ISpeechService['hasActiveTextToSpeechSession'] = false
  @Unsupported
  createTextToSpeechSession: ISpeechService['createTextToSpeechSession'] = (): never => {
    unsupported()
  }
  onDidChangeHasSpeechProvider: ISpeechService['onDidChangeHasSpeechProvider'] = Event.None
  onDidStartSpeechToTextSession: ISpeechService['onDidStartSpeechToTextSession'] = Event.None
  onDidEndSpeechToTextSession: ISpeechService['onDidEndSpeechToTextSession'] = Event.None
  hasActiveSpeechToTextSession: ISpeechService['hasActiveSpeechToTextSession'] = false
  onDidStartKeywordRecognition: ISpeechService['onDidStartKeywordRecognition'] = Event.None
  onDidEndKeywordRecognition: ISpeechService['onDidEndKeywordRecognition'] = Event.None
  hasActiveKeywordRecognition: ISpeechService['hasActiveKeywordRecognition'] = false
  @Unsupported
  recognizeKeyword: ISpeechService['recognizeKeyword'] = (): never => {
    unsupported()
  }
  hasSpeechProvider: ISpeechService['hasSpeechProvider'] = false
  @Unsupported
  registerSpeechProvider: ISpeechService['registerSpeechProvider'] = (): never => {
    unsupported()
  }
  @Unsupported
  createSpeechToTextSession: ISpeechService['createSpeechToTextSession'] = (): never => {
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
  openCoverage: ITestCoverageService['openCoverage'] = (): never => {
    unsupported()
  }
  @Unsupported
  closeCoverage: ITestCoverageService['closeCoverage'] = (): never => {
    unsupported()
  }
}
registerSingleton(ITestCoverageService, TestCoverageService, InstantiationType.Delayed)
class ChatAccessibilityService implements IChatAccessibilityService {
  _serviceBrand: undefined
  @Unsupported
  acceptRequest: IChatAccessibilityService['acceptRequest'] = (): never => {
    unsupported()
  }
  @Unsupported
  acceptResponse: IChatAccessibilityService['acceptResponse'] = (): never => {
    unsupported()
  }
}
registerSingleton(IChatAccessibilityService, ChatAccessibilityService, InstantiationType.Delayed)
class ChatWidgetHistoryService implements IChatWidgetHistoryService {
  _serviceBrand: undefined
  onDidClearHistory: IChatWidgetHistoryService['onDidClearHistory'] = Event.None
  @Unsupported
  clearHistory: IChatWidgetHistoryService['clearHistory'] = (): never => {
    unsupported()
  }
  getHistory: IChatWidgetHistoryService['getHistory'] = () => []
  @Unsupported
  saveHistory: IChatWidgetHistoryService['saveHistory'] = (): never => {
    unsupported()
  }
}
registerSingleton(IChatWidgetHistoryService, ChatWidgetHistoryService, InstantiationType.Delayed)
class ChatCodeBlockContextProviderService implements IChatCodeBlockContextProviderService {
  _serviceBrand: undefined
  providers: IChatCodeBlockContextProviderService['providers'] = []
  registerProvider: IChatCodeBlockContextProviderService['registerProvider'] = () => Disposable.None
}
registerSingleton(
  IChatCodeBlockContextProviderService,
  ChatCodeBlockContextProviderService,
  InstantiationType.Delayed
)
class InlineChatSessionService implements IInlineChatSessionService {
  _serviceBrand: undefined
  onDidMoveSession: IInlineChatSessionService['onDidMoveSession'] = Event.None
  onDidStashSession: IInlineChatSessionService['onDidStashSession'] = Event.None
  @Unsupported
  get hideOnRequest() {
    return unsupported()
  }
  @Unsupported
  moveSession: IInlineChatSessionService['moveSession'] = (): never => {
    unsupported()
  }
  @Unsupported
  getCodeEditor: IInlineChatSessionService['getCodeEditor'] = (): never => {
    unsupported()
  }
  @Unsupported
  stashSession: IInlineChatSessionService['stashSession'] = (): never => {
    unsupported()
  }
  onWillStartSession: IInlineChatSessionService['onWillStartSession'] = Event.None
  onDidEndSession: IInlineChatSessionService['onDidEndSession'] = Event.None
  @Unsupported
  createSession: IInlineChatSessionService['createSession'] = (): never => {
    unsupported()
  }
  getSession: IInlineChatSessionService['getSession'] = () => undefined
  @Unsupported
  releaseSession: IInlineChatSessionService['releaseSession'] = (): never => {
    unsupported()
  }
  @Unsupported
  registerSessionKeyComputer: IInlineChatSessionService['registerSessionKeyComputer'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  dispose: IInlineChatSessionService['dispose'] = (): never => {
    unsupported()
  }
  @Unsupported
  createSession2: IInlineChatSessionService['createSession2'] = (): never => {
    unsupported()
  }
  getSession2: IInlineChatSessionService['getSession2'] = () => undefined
  onDidChangeSessions = Event.None
}
registerSingleton(IInlineChatSessionService, InlineChatSessionService, InstantiationType.Delayed)
class NotebookEditorWorkerService implements INotebookEditorWorkerService {
  _serviceBrand: undefined
  canComputeDiff: INotebookEditorWorkerService['canComputeDiff'] = () => false
  @Unsupported
  computeDiff: INotebookEditorWorkerService['computeDiff'] = (): never => {
    unsupported()
  }
  canPromptRecommendation: INotebookEditorWorkerService['canPromptRecommendation'] = async () =>
    false
}
registerSingleton(
  INotebookEditorWorkerService,
  NotebookEditorWorkerService,
  InstantiationType.Delayed
)
class NotebookKernelHistoryService implements INotebookKernelHistoryService {
  _serviceBrand: undefined
  @Unsupported
  getKernels: INotebookKernelHistoryService['getKernels'] = (): never => {
    unsupported()
  }
  @Unsupported
  addMostRecentKernel: INotebookKernelHistoryService['addMostRecentKernel'] = (): never => {
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
  executeNotebookCells: INotebookExecutionService['executeNotebookCells'] = (): never => {
    unsupported()
  }
  @Unsupported
  cancelNotebookCells: INotebookExecutionService['cancelNotebookCells'] = (): never => {
    unsupported()
  }
  @Unsupported
  cancelNotebookCellHandles: INotebookExecutionService['cancelNotebookCellHandles'] = (): never => {
    unsupported()
  }
  @Unsupported
  registerExecutionParticipant: INotebookExecutionService['registerExecutionParticipant'] =
    (): never => {
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
  info: INotebookLoggingService['info'] = (): never => {
    unsupported()
  }
  @Unsupported
  debug: INotebookLoggingService['debug'] = (): never => {
    unsupported()
  }
  @Unsupported
  warn: INotebookLoggingService['warn'] = (): never => {
    unsupported()
  }
  @Unsupported
  error: INotebookLoggingService['error'] = (): never => {
    unsupported()
  }
}
registerSingleton(INotebookLoggingService, NotebookLoggingService, InstantiationType.Delayed)
class WalkthroughsService implements IWalkthroughsService {
  _serviceBrand: undefined
  onDidAddWalkthrough: IWalkthroughsService['onDidAddWalkthrough'] = Event.None
  onDidRemoveWalkthrough: IWalkthroughsService['onDidRemoveWalkthrough'] = Event.None
  onDidChangeWalkthrough: IWalkthroughsService['onDidChangeWalkthrough'] = Event.None
  onDidProgressStep: IWalkthroughsService['onDidProgressStep'] = Event.None
  @Unsupported
  getWalkthroughs: IWalkthroughsService['getWalkthroughs'] = (): never => {
    unsupported()
  }
  @Unsupported
  getWalkthrough: IWalkthroughsService['getWalkthrough'] = (): never => {
    unsupported()
  }
  @Unsupported
  registerWalkthrough: IWalkthroughsService['registerWalkthrough'] = (): never => {
    unsupported()
  }
  @Unsupported
  progressByEvent: IWalkthroughsService['progressByEvent'] = (): never => {
    unsupported()
  }
  @Unsupported
  progressStep: IWalkthroughsService['progressStep'] = (): never => {
    unsupported()
  }
  @Unsupported
  deprogressStep: IWalkthroughsService['deprogressStep'] = (): never => {
    unsupported()
  }
  @Unsupported
  markWalkthroughOpened: IWalkthroughsService['markWalkthroughOpened'] = (): never => {
    unsupported()
  }
}
registerSingleton(IWalkthroughsService, WalkthroughsService, InstantiationType.Delayed)
class UserDataSyncStoreManagementService implements IUserDataSyncStoreManagementService {
  _serviceBrand: undefined
  onDidChangeUserDataSyncStore: IUserDataSyncStoreManagementService['onDidChangeUserDataSyncStore'] =
    Event.None
  userDataSyncStore: IUserDataSyncStoreManagementService['userDataSyncStore'] = undefined
  @Unsupported
  switch: IUserDataSyncStoreManagementService['switch'] = (): never => {
    unsupported()
  }
  @Unsupported
  getPreviousUserDataSyncStore: IUserDataSyncStoreManagementService['getPreviousUserDataSyncStore'] =
    (): never => {
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
  onDidChangeDonotMakeRequestsUntil: IUserDataSyncStoreService['onDidChangeDonotMakeRequestsUntil'] =
    Event.None
  donotMakeRequestsUntil: IUserDataSyncStoreService['donotMakeRequestsUntil'] = undefined
  onTokenFailed: IUserDataSyncStoreService['onTokenFailed'] = Event.None
  onTokenSucceed: IUserDataSyncStoreService['onTokenSucceed'] = Event.None
  @Unsupported
  setAuthToken: IUserDataSyncStoreService['setAuthToken'] = (): never => {
    unsupported()
  }
  @Unsupported
  manifest: IUserDataSyncStoreService['manifest'] = (): never => {
    unsupported()
  }
  @Unsupported
  readResource: IUserDataSyncStoreService['readResource'] = (): never => {
    unsupported()
  }
  @Unsupported
  writeResource: IUserDataSyncStoreService['writeResource'] = (): never => {
    unsupported()
  }
  @Unsupported
  deleteResource: IUserDataSyncStoreService['deleteResource'] = (): never => {
    unsupported()
  }
  @Unsupported
  getAllResourceRefs: IUserDataSyncStoreService['getAllResourceRefs'] = (): never => {
    unsupported()
  }
  @Unsupported
  resolveResourceContent: IUserDataSyncStoreService['resolveResourceContent'] = (): never => {
    unsupported()
  }
  @Unsupported
  getAllCollections: IUserDataSyncStoreService['getAllCollections'] = (): never => {
    unsupported()
  }
  @Unsupported
  createCollection: IUserDataSyncStoreService['createCollection'] = (): never => {
    unsupported()
  }
  @Unsupported
  deleteCollection: IUserDataSyncStoreService['deleteCollection'] = (): never => {
    unsupported()
  }
  @Unsupported
  getActivityData: IUserDataSyncStoreService['getActivityData'] = (): never => {
    unsupported()
  }
  @Unsupported
  clear: IUserDataSyncStoreService['clear'] = (): never => {
    unsupported()
  }
}
registerSingleton(IUserDataSyncStoreService, UserDataSyncStoreService, InstantiationType.Delayed)
class UserDataSyncLogService implements IUserDataSyncLogService {
  _serviceBrand: undefined
  onDidChangeLogLevel: IUserDataSyncLogService['onDidChangeLogLevel'] = Event.None
  @Unsupported
  getLevel: IUserDataSyncLogService['getLevel'] = (): never => {
    unsupported()
  }
  @Unsupported
  setLevel: IUserDataSyncLogService['setLevel'] = (): never => {
    unsupported()
  }
  @Unsupported
  trace: IUserDataSyncLogService['trace'] = (): never => {
    unsupported()
  }
  @Unsupported
  debug: IUserDataSyncLogService['debug'] = (): never => {
    unsupported()
  }
  @Unsupported
  info: IUserDataSyncLogService['info'] = (): never => {
    unsupported()
  }
  @Unsupported
  warn: IUserDataSyncLogService['warn'] = (): never => {
    unsupported()
  }
  @Unsupported
  error: IUserDataSyncLogService['error'] = (): never => {
    unsupported()
  }
  @Unsupported
  flush: IUserDataSyncLogService['flush'] = (): never => {
    unsupported()
  }
  @Unsupported
  dispose: IUserDataSyncLogService['dispose'] = (): never => {
    unsupported()
  }
}
registerSingleton(IUserDataSyncLogService, UserDataSyncLogService, InstantiationType.Delayed)
class UserDataSyncService implements IUserDataSyncService {
  _serviceBrand: undefined
  status: IUserDataSyncService['status'] = SyncStatus.Uninitialized
  onDidChangeStatus: IUserDataSyncService['onDidChangeStatus'] = Event.None
  conflicts: IUserDataSyncService['conflicts'] = []
  onDidChangeConflicts: IUserDataSyncService['onDidChangeConflicts'] = Event.None
  onDidChangeLocal: IUserDataSyncService['onDidChangeLocal'] = Event.None
  onSyncErrors: IUserDataSyncService['onSyncErrors'] = Event.None
  lastSyncTime: number | undefined
  onDidChangeLastSyncTime: IUserDataSyncService['onDidChangeLastSyncTime'] = Event.None
  onDidResetRemote: IUserDataSyncService['onDidResetRemote'] = Event.None
  onDidResetLocal: IUserDataSyncService['onDidResetLocal'] = Event.None
  @Unsupported
  createSyncTask: IUserDataSyncService['createSyncTask'] = (): never => {
    unsupported()
  }
  @Unsupported
  createManualSyncTask: IUserDataSyncService['createManualSyncTask'] = (): never => {
    unsupported()
  }
  @Unsupported
  resolveContent: IUserDataSyncService['resolveContent'] = (): never => {
    unsupported()
  }
  @Unsupported
  accept: IUserDataSyncService['accept'] = (): never => {
    unsupported()
  }
  @Unsupported
  reset: IUserDataSyncService['reset'] = (): never => {
    unsupported()
  }
  @Unsupported
  resetRemote: IUserDataSyncService['resetRemote'] = (): never => {
    unsupported()
  }
  @Unsupported
  cleanUpRemoteData: IUserDataSyncService['cleanUpRemoteData'] = (): never => {
    unsupported()
  }
  @Unsupported
  resetLocal: IUserDataSyncService['resetLocal'] = (): never => {
    unsupported()
  }
  @Unsupported
  hasLocalData: IUserDataSyncService['hasLocalData'] = (): never => {
    unsupported()
  }
  @Unsupported
  hasPreviouslySynced: IUserDataSyncService['hasPreviouslySynced'] = (): never => {
    unsupported()
  }
  @Unsupported
  replace: IUserDataSyncService['replace'] = (): never => {
    unsupported()
  }
  @Unsupported
  saveRemoteActivityData: IUserDataSyncService['saveRemoteActivityData'] = (): never => {
    unsupported()
  }
  @Unsupported
  extractActivityData: IUserDataSyncService['extractActivityData'] = (): never => {
    unsupported()
  }
}
registerSingleton(IUserDataSyncService, UserDataSyncService, InstantiationType.Delayed)
class UserDataSyncMachinesService implements IUserDataSyncMachinesService {
  _serviceBrand: undefined
  onDidChange: IUserDataSyncMachinesService['onDidChange'] = Event.None
  @Unsupported
  getMachines: IUserDataSyncMachinesService['getMachines'] = (): never => {
    unsupported()
  }
  @Unsupported
  addCurrentMachine: IUserDataSyncMachinesService['addCurrentMachine'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeCurrentMachine: IUserDataSyncMachinesService['removeCurrentMachine'] = (): never => {
    unsupported()
  }
  @Unsupported
  renameMachine: IUserDataSyncMachinesService['renameMachine'] = (): never => {
    unsupported()
  }
  @Unsupported
  setEnablements: IUserDataSyncMachinesService['setEnablements'] = (): never => {
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
  getRemoteSyncedProfiles: IUserDataSyncResourceProviderService['getRemoteSyncedProfiles'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  getLocalSyncedProfiles: IUserDataSyncResourceProviderService['getLocalSyncedProfiles'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  getRemoteSyncResourceHandles: IUserDataSyncResourceProviderService['getRemoteSyncResourceHandles'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  getLocalSyncResourceHandles: IUserDataSyncResourceProviderService['getLocalSyncResourceHandles'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  getAssociatedResources: IUserDataSyncResourceProviderService['getAssociatedResources'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  getMachineId: IUserDataSyncResourceProviderService['getMachineId'] = (): never => {
    unsupported()
  }
  @Unsupported
  getLocalSyncedMachines: IUserDataSyncResourceProviderService['getLocalSyncedMachines'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  resolveContent: IUserDataSyncResourceProviderService['resolveContent'] = (): never => {
    unsupported()
  }
  @Unsupported
  resolveUserDataSyncResource: IUserDataSyncResourceProviderService['resolveUserDataSyncResource'] =
    (): never => {
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
  writeResource: IUserDataSyncLocalStoreService['writeResource'] = (): never => {
    unsupported()
  }
  @Unsupported
  getAllResourceRefs: IUserDataSyncLocalStoreService['getAllResourceRefs'] = (): never => {
    unsupported()
  }
  @Unsupported
  resolveResourceContent: IUserDataSyncLocalStoreService['resolveResourceContent'] = (): never => {
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
  resolveDefaultCoreIgnoredSettings: IUserDataSyncUtilService['resolveDefaultCoreIgnoredSettings'] =
    async () => []
  @Unsupported
  resolveUserBindings: IUserDataSyncUtilService['resolveUserBindings'] = (): never => {
    unsupported()
  }
  @Unsupported
  resolveFormattingOptions: IUserDataSyncUtilService['resolveFormattingOptions'] = (): never => {
    unsupported()
  }
}
registerSingleton(IUserDataSyncUtilService, UserDataSyncUtilService, InstantiationType.Delayed)
class UserDataProfileManagementService implements IUserDataProfileManagementService {
  _serviceBrand: undefined
  @Unsupported
  getDefaultProfileToUse: IUserDataProfileManagementService['getDefaultProfileToUse'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  createProfile: IUserDataProfileManagementService['createProfile'] = (): never => {
    unsupported()
  }
  @Unsupported
  createAndEnterProfile: IUserDataProfileManagementService['createAndEnterProfile'] = (): never => {
    unsupported()
  }
  @Unsupported
  createAndEnterTransientProfile: IUserDataProfileManagementService['createAndEnterTransientProfile'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  removeProfile: IUserDataProfileManagementService['removeProfile'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateProfile: IUserDataProfileManagementService['updateProfile'] = (): never => {
    unsupported()
  }
  @Unsupported
  switchProfile: IUserDataProfileManagementService['switchProfile'] = (): never => {
    unsupported()
  }
  @Unsupported
  getBuiltinProfileTemplates: IUserDataProfileManagementService['getBuiltinProfileTemplates'] =
    (): never => {
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
  onDidAddEntry: IWorkingCopyHistoryService['onDidAddEntry'] = Event.None
  onDidChangeEntry: IWorkingCopyHistoryService['onDidChangeEntry'] = Event.None
  onDidReplaceEntry: IWorkingCopyHistoryService['onDidReplaceEntry'] = Event.None
  onDidRemoveEntry: IWorkingCopyHistoryService['onDidRemoveEntry'] = Event.None
  onDidMoveEntries: IWorkingCopyHistoryService['onDidMoveEntries'] = Event.None
  onDidRemoveEntries: IWorkingCopyHistoryService['onDidRemoveEntries'] = Event.None
  @Unsupported
  addEntry: IWorkingCopyHistoryService['addEntry'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateEntry: IWorkingCopyHistoryService['updateEntry'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeEntry: IWorkingCopyHistoryService['removeEntry'] = (): never => {
    unsupported()
  }
  @Unsupported
  moveEntries: IWorkingCopyHistoryService['moveEntries'] = (): never => {
    unsupported()
  }
  getEntries: IWorkingCopyHistoryService['getEntries'] = async () => []
  getAll: IWorkingCopyHistoryService['getAll'] = async () => []
  @Unsupported
  removeAll: IWorkingCopyHistoryService['removeAll'] = (): never => {
    unsupported()
  }
}
registerSingleton(IWorkingCopyHistoryService, WorkingCopyHistoryService, InstantiationType.Delayed)
class NotebookDocumentService implements INotebookDocumentService {
  _serviceBrand: undefined
  getNotebook: INotebookDocumentService['getNotebook'] = () => undefined
  @Unsupported
  addNotebookDocument: INotebookDocumentService['addNotebookDocument'] = (): never => {
    unsupported()
  }
  @Unsupported
  removeNotebookDocument: INotebookDocumentService['removeNotebookDocument'] = (): never => {
    unsupported()
  }
}
registerSingleton(INotebookDocumentService, NotebookDocumentService, InstantiationType.Delayed)
class DebugVisualizerService implements IDebugVisualizerService {
  _serviceBrand: undefined
  @Unsupported
  registerTree: IDebugVisualizerService['registerTree'] = (): never => {
    unsupported()
  }
  @Unsupported
  getVisualizedNodeFor: IDebugVisualizerService['getVisualizedNodeFor'] = (): never => {
    unsupported()
  }
  @Unsupported
  getVisualizedChildren: IDebugVisualizerService['getVisualizedChildren'] = (): never => {
    unsupported()
  }
  @Unsupported
  editTreeItem: IDebugVisualizerService['editTreeItem'] = (): never => {
    unsupported()
  }
  @Unsupported
  getApplicableFor: IDebugVisualizerService['getApplicableFor'] = (): never => {
    unsupported()
  }
  @Unsupported
  register: IDebugVisualizerService['register'] = (): never => {
    unsupported()
  }
}
registerSingleton(IDebugVisualizerService, DebugVisualizerService, InstantiationType.Delayed)
class EditSessionsLogService implements IEditSessionsLogService {
  _serviceBrand: undefined
  onDidChangeLogLevel: IEditSessionsLogService['onDidChangeLogLevel'] = Event.None
  @Unsupported
  getLevel: IEditSessionsLogService['getLevel'] = (): never => {
    unsupported()
  }
  @Unsupported
  setLevel: IEditSessionsLogService['setLevel'] = (): never => {
    unsupported()
  }
  @Unsupported
  trace: IEditSessionsLogService['trace'] = (): never => {
    unsupported()
  }
  @Unsupported
  debug: IEditSessionsLogService['debug'] = (): never => {
    unsupported()
  }
  @Unsupported
  info: IEditSessionsLogService['info'] = (): never => {
    unsupported()
  }
  @Unsupported
  warn: IEditSessionsLogService['warn'] = (): never => {
    unsupported()
  }
  @Unsupported
  error: IEditSessionsLogService['error'] = (): never => {
    unsupported()
  }
  @Unsupported
  flush: IEditSessionsLogService['flush'] = (): never => {
    unsupported()
  }
  @Unsupported
  dispose: IEditSessionsLogService['dispose'] = (): never => {
    unsupported()
  }
}
registerSingleton(IEditSessionsLogService, EditSessionsLogService, InstantiationType.Delayed)
class EditSessionsWorkbenchService implements IEditSessionsStorageService {
  _serviceBrand: undefined
  SIZE_LIMIT: IEditSessionsStorageService['SIZE_LIMIT'] = 0
  isSignedIn: IEditSessionsStorageService['isSignedIn'] = false
  onDidSignIn: IEditSessionsStorageService['onDidSignIn'] = Event.None
  onDidSignOut: IEditSessionsStorageService['onDidSignOut'] = Event.None
  storeClient: IEditSessionsStorageService['storeClient'] = undefined
  lastReadResources: IEditSessionsStorageService['lastReadResources'] = new Map<
    SyncResource,
    {
      ref: string
      content: string
    }
  >()
  lastWrittenResources: IEditSessionsStorageService['lastWrittenResources'] = new Map<
    SyncResource,
    {
      ref: string
      content: string
    }
  >()
  @Unsupported
  initialize: IEditSessionsStorageService['initialize'] = (): never => {
    unsupported()
  }
  @Unsupported
  read: IEditSessionsStorageService['read'] = (): never => {
    unsupported()
  }
  @Unsupported
  write: IEditSessionsStorageService['write'] = (): never => {
    unsupported()
  }
  @Unsupported
  delete: IEditSessionsStorageService['delete'] = (): never => {
    unsupported()
  }
  @Unsupported
  list: IEditSessionsStorageService['list'] = (): never => {
    unsupported()
  }
  @Unsupported
  getMachineById: IEditSessionsStorageService['getMachineById'] = (): never => {
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
  registerResolver: IMultiDiffSourceResolverService['registerResolver'] = () => Disposable.None
  resolve: IMultiDiffSourceResolverService['resolve'] = async () => undefined
}
registerSingleton(
  IMultiDiffSourceResolverService,
  MultiDiffSourceResolverService,
  InstantiationType.Delayed
)
registerSingleton(IWorkspaceTagsService, NoOpWorkspaceTagsService, InstantiationType.Delayed)
class ExtensionFeaturesManagementService implements IExtensionFeaturesManagementService {
  _serviceBrand: undefined
  getAllAccessDataForExtension: IExtensionFeaturesManagementService['getAllAccessDataForExtension'] =
    () => new Map()
  onDidChangeEnablement: IExtensionFeaturesManagementService['onDidChangeEnablement'] = Event.None
  isEnabled: IExtensionFeaturesManagementService['isEnabled'] = () => true
  @Unsupported
  setEnablement: IExtensionFeaturesManagementService['setEnablement'] = (): never => {
    unsupported()
  }
  @Unsupported
  getEnablementData: IExtensionFeaturesManagementService['getEnablementData'] = (): never => {
    unsupported()
  }
  @Unsupported
  getAccess: IExtensionFeaturesManagementService['getAccess'] = (): never => {
    unsupported()
  }
  onDidChangeAccessData: IExtensionFeaturesManagementService['onDidChangeAccessData'] = Event.None
  getAccessData: IExtensionFeaturesManagementService['getAccessData'] = () => undefined
  @Unsupported
  setStatus: IExtensionFeaturesManagementService['setStatus'] = (): never => {
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
  onWillInstantiateEditorPane: IEditorPaneService['onWillInstantiateEditorPane'] = Event.None
  didInstantiateEditorPane: IEditorPaneService['didInstantiateEditorPane'] = () => false
}
registerSingleton(IEditorPaneService, EditorPaneService, InstantiationType.Delayed)
class WorkspaceIdentityService implements IWorkspaceIdentityService {
  _serviceBrand: undefined
  @Unsupported
  matches: IWorkspaceIdentityService['matches'] = (): never => {
    unsupported()
  }
  @Unsupported
  getWorkspaceStateFolders: IWorkspaceIdentityService['getWorkspaceStateFolders'] = (): never => {
    unsupported()
  }
}
registerSingleton(IWorkspaceIdentityService, WorkspaceIdentityService, InstantiationType.Delayed)
class DefaultLogLevelsService implements IDefaultLogLevelsService {
  _serviceBrand: undefined
  onDidChangeDefaultLogLevels: IDefaultLogLevelsService['onDidChangeDefaultLogLevels'] = Event.None
  getDefaultLogLevel: IDefaultLogLevelsService['getDefaultLogLevel'] = async () => LogLevel.Off
  @Unsupported
  getDefaultLogLevels: IDefaultLogLevelsService['getDefaultLogLevels'] = (): never => {
    unsupported()
  }
  @Unsupported
  setDefaultLogLevel: IDefaultLogLevelsService['setDefaultLogLevel'] = (): never => {
    unsupported()
  }
}
registerSingleton(IDefaultLogLevelsService, DefaultLogLevelsService, InstantiationType.Delayed)
class CustomEditorLabelService implements ICustomEditorLabelService {
  _serviceBrand: undefined
  onDidChange: ICustomEditorLabelService['onDidChange'] = Event.None
  getName: ICustomEditorLabelService['getName'] = () => undefined
}
registerSingleton(ICustomEditorLabelService, CustomEditorLabelService, InstantiationType.Delayed)
class TroubleshootIssueService implements ITroubleshootIssueService {
  _serviceBrand: undefined
  isActive: ITroubleshootIssueService['isActive'] = () => false
  @Unsupported
  start: ITroubleshootIssueService['start'] = (): never => {
    unsupported()
  }
  @Unsupported
  resume: ITroubleshootIssueService['resume'] = (): never => {
    unsupported()
  }
  @Unsupported
  stop: ITroubleshootIssueService['stop'] = (): never => {
    unsupported()
  }
}
registerSingleton(ITroubleshootIssueService, TroubleshootIssueService, InstantiationType.Delayed)
class IntegrityService implements IIntegrityService {
  _serviceBrand: undefined
  isPure: IIntegrityService['isPure'] = async (): Promise<IntegrityTestResult> => {
    return {
      isPure: false,
      proof: []
    }
  }
}
registerSingleton(IIntegrityService, IntegrityService, InstantiationType.Delayed)
class TrustedDomainService implements ITrustedDomainService {
  _serviceBrand: undefined
  onDidChangeTrustedDomains: ITrustedDomainService['onDidChangeTrustedDomains'] = Event.None
  isValid: ITrustedDomainService['isValid'] = (): boolean => {
    return false
  }
}
registerSingleton(ITrustedDomainService, TrustedDomainService, InstantiationType.Delayed)
class LanguageModelToolsService implements ILanguageModelToolsService {
  _serviceBrand: undefined
  getTool: ILanguageModelToolsService['getTool'] = () => undefined
  getToolByName: ILanguageModelToolsService['getToolByName'] = () => undefined
  onDidChangeTools: ILanguageModelToolsService['onDidChangeTools'] = Event.None
  @Unsupported
  registerToolData: ILanguageModelToolsService['registerToolData'] = (): never => {
    unsupported()
  }
  @Unsupported
  registerToolImplementation: ILanguageModelToolsService['registerToolImplementation'] =
    (): never => {
      unsupported()
    }
  getTools: ILanguageModelToolsService['getTools'] = () => []
  @Unsupported
  invokeTool: ILanguageModelToolsService['invokeTool'] = (): never => {
    unsupported()
  }
  @Unsupported
  cancelToolCallsForRequest: ILanguageModelToolsService['cancelToolCallsForRequest'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  setToolAutoConfirmation: ILanguageModelToolsService['setToolAutoConfirmation'] = (): never => {
    unsupported()
  }
  @Unsupported
  resetToolAutoConfirmation: ILanguageModelToolsService['resetToolAutoConfirmation'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  toEnablementMap: ILanguageModelToolsService['toEnablementMap'] = (): never => {
    unsupported()
  }
  getToolSetByName: ILanguageModelToolsService['getToolSetByName'] = () => undefined
  @Unsupported
  createToolSet: ILanguageModelToolsService['createToolSet'] = (): never => {
    unsupported()
  }
  @Unsupported
  get toolSets(): never {
    return unsupported()
  }
}
registerSingleton(ILanguageModelToolsService, LanguageModelToolsService, InstantiationType.Delayed)
class IssueFormService implements IIssueFormService {
  _serviceBrand: undefined
  @Unsupported
  openReporter: IIssueFormService['openReporter'] = (): never => {
    unsupported()
  }
  @Unsupported
  reloadWithExtensionsDisabled: IIssueFormService['reloadWithExtensionsDisabled'] = (): never => {
    unsupported()
  }
  @Unsupported
  showConfirmCloseDialog: IIssueFormService['showConfirmCloseDialog'] = (): never => {
    unsupported()
  }
  @Unsupported
  showClipboardDialog: IIssueFormService['showClipboardDialog'] = (): never => {
    unsupported()
  }
  @Unsupported
  sendReporterMenu: IIssueFormService['sendReporterMenu'] = (): never => {
    unsupported()
  }
  @Unsupported
  closeReporter: IIssueFormService['closeReporter'] = (): never => {
    unsupported()
  }
}
registerSingleton(IIssueFormService, IssueFormService, InstantiationType.Delayed)
class CodeMapperService implements ICodeMapperService {
  _serviceBrand: undefined
  providers: ICodeMapperService['providers'] = []
  @Unsupported
  registerCodeMapperProvider: ICodeMapperService['registerCodeMapperProvider'] = (): never => {
    unsupported()
  }
  mapCode: ICodeMapperService['mapCode'] = async () => undefined
}
registerSingleton(ICodeMapperService, CodeMapperService, InstantiationType.Delayed)
class ChatEditingService implements IChatEditingService {
  _serviceBrand: undefined
  get editingSessionsObs() {
    return constObservable([])
  }
  hasRelatedFilesProviders: IChatEditingService['hasRelatedFilesProviders'] = () => false
  @Unsupported
  registerRelatedFilesProvider: IChatEditingService['registerRelatedFilesProvider'] = () => {
    return unsupported()
  }
  getRelatedFiles: IChatEditingService['getRelatedFiles'] = async () => undefined
  getEditingSession: IChatEditingService['getEditingSession'] = () => undefined
  @Unsupported
  startOrContinueGlobalEditingSession: IChatEditingService['startOrContinueGlobalEditingSession'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  createEditingSession: IChatEditingService['createEditingSession'] = (): never => {
    unsupported()
  }
}
registerSingleton(IChatEditingService, ChatEditingService, InstantiationType.Delayed)
class ActionViewItemService implements IActionViewItemService {
  _serviceBrand: undefined
  onDidChange: IActionViewItemService['onDidChange'] = Event.None
  @Unsupported
  register: IActionViewItemService['register'] = (): never => {
    unsupported()
  }
  lookUp: IActionViewItemService['lookUp'] = () => undefined
}
registerSingleton(IActionViewItemService, ActionViewItemService, InstantiationType.Delayed)
class LanguageModelIgnoredFilesService implements ILanguageModelIgnoredFilesService {
  _serviceBrand: undefined
  fileIsIgnored: ILanguageModelIgnoredFilesService['fileIsIgnored'] = async () => false
  @Unsupported
  registerIgnoredFileProvider: ILanguageModelIgnoredFilesService['registerIgnoredFileProvider'] =
    (): never => {
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
  allowedExtensionsConfigValue: AllowedExtensionsConfigValueType | undefined
  onDidChangeAllowedExtensionsConfigValue: IAllowedExtensionsService['onDidChangeAllowedExtensionsConfigValue'] =
    Event.None
  isAllowed: IAllowedExtensionsService['isAllowed'] = (): true => true
}
registerSingleton(IAllowedExtensionsService, AllowedExtensionsService, InstantiationType.Delayed)
class ChatTransferService implements IChatTransferService {
  _serviceBrand: undefined
  @Unsupported
  checkAndSetTransferredWorkspaceTrust: IChatTransferService['checkAndSetTransferredWorkspaceTrust'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  addWorkspaceToTransferred: IChatTransferService['addWorkspaceToTransferred'] = (): never => {
    unsupported()
  }
}
registerSingleton(IChatTransferService, ChatTransferService, InstantiationType.Delayed)
class ChatStatusItemService implements IChatStatusItemService {
  _serviceBrand: undefined
  onDidChange: IChatStatusItemService['onDidChange'] = Event.None
  @Unsupported
  setOrUpdateEntry: IChatStatusItemService['setOrUpdateEntry'] = (): never => {
    unsupported()
  }
  @Unsupported
  deleteEntry: IChatStatusItemService['deleteEntry'] = (): never => {
    unsupported()
  }
  @Unsupported
  getEntries: IChatStatusItemService['getEntries'] = (): never => {
    unsupported()
  }
}
registerSingleton(IChatStatusItemService, ChatStatusItemService, InstantiationType.Delayed)
class NotebookOriginalCellModelFactory implements INotebookOriginalCellModelFactory {
  _serviceBrand: undefined
  @Unsupported
  getOrCreate: INotebookOriginalCellModelFactory['getOrCreate'] = (): never => {
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
  getOrCreate: INotebookOriginalModelReferenceFactory['getOrCreate'] = (): never => {
    unsupported()
  }
}
registerSingleton(
  INotebookOriginalModelReferenceFactory,
  NotebookOriginalModelReferenceFactory,
  InstantiationType.Delayed
)
class QuickDiffModelService implements IQuickDiffModelService {
  _serviceBrand: undefined
  createQuickDiffModelReference: IQuickDiffModelService['createQuickDiffModelReference'] = () =>
    undefined
}
registerSingleton(IQuickDiffModelService, QuickDiffModelService, InstantiationType.Delayed)
class TerminalCompletionService implements ITerminalCompletionService {
  _serviceBrand: undefined
  @Unsupported
  get providers(): never {
    return unsupported()
  }
  @Unsupported
  registerTerminalCompletionProvider: ITerminalCompletionService['registerTerminalCompletionProvider'] =
    (): never => {
      unsupported()
    }
  @Unsupported
  provideCompletions: ITerminalCompletionService['provideCompletions'] = (): never => {
    unsupported()
  }
}
registerSingleton(ITerminalCompletionService, TerminalCompletionService, InstantiationType.Delayed)
class ChatEntitlementsService implements IChatEntitlementService {
  _serviceBrand: undefined
  onDidChangeEntitlement: IChatEntitlementService['onDidChangeEntitlement'] = Event.None
  onDidChangeQuotaExceeded: IChatEntitlementService['onDidChangeQuotaExceeded'] = Event.None
  onDidChangeQuotaRemaining: IChatEntitlementService['onDidChangeQuotaRemaining'] = Event.None
  onDidChangeSentiment: IChatEntitlementService['onDidChangeSentiment'] = Event.None
  @Unsupported
  get entitlement() {
    return unsupported()
  }
  @Unsupported
  get quotas() {
    return unsupported()
  }
  @Unsupported
  get sentiment() {
    return unsupported()
  }
  @Unsupported
  update: IChatEntitlementService['update'] = (): never => {
    unsupported()
  }
}
registerSingleton(IChatEntitlementService, ChatEntitlementsService, InstantiationType.Eager)
class PromptsService implements IPromptsService {
  _serviceBrand: undefined
  @Unsupported
  getSyntaxParserFor: IPromptsService['getSyntaxParserFor'] = (): never => {
    unsupported()
  }
  listPromptFiles: IPromptsService['listPromptFiles'] = async () => []
  getSourceFolders: IPromptsService['getSourceFolders'] = () => []
  dispose: IPromptsService['dispose'] = (): void => {}
  asPromptSlashCommand: IPromptsService['asPromptSlashCommand'] = () => undefined
  resolvePromptSlashCommand: IPromptsService['resolvePromptSlashCommand'] = async () => undefined
  findPromptSlashCommands: IPromptsService['findPromptSlashCommands'] = async () => []
  findInstructionFilesFor: IPromptsService['findInstructionFilesFor'] = async () => []
  getAllMetadata: IPromptsService['getAllMetadata'] = async () => []
  onDidChangeCustomChatModes: IPromptsService['onDidChangeCustomChatModes'] = Event.None
  getCustomChatModes: IPromptsService['getCustomChatModes'] = async () => []
  @Unsupported
  getMetadata: IPromptsService['getMetadata'] = (): never => {
    unsupported()
  }
}
registerSingleton(IPromptsService, PromptsService, InstantiationType.Eager)
class McpRegistry implements IMcpRegistry {
  _serviceBrand: undefined
  onDidChangeInputs: IMcpRegistry['onDidChangeInputs'] = Event.None
  @Unsupported
  get collections() {
    return unsupported()
  }
  @Unsupported
  get lazyCollectionState() {
    return unsupported()
  }
  @Unsupported
  get delegates(): never {
    return unsupported()
  }
  discoverCollections: IMcpRegistry['discoverCollections'] = async () => []
  @Unsupported
  registerCollection: IMcpRegistry['registerCollection'] = (): never => {
    unsupported()
  }
  @Unsupported
  resetTrust: IMcpRegistry['resetTrust'] = (): never => {
    unsupported()
  }
  @Unsupported
  getTrust: IMcpRegistry['getTrust'] = (): never => {
    unsupported()
  }
  @Unsupported
  clearSavedInputs: IMcpRegistry['clearSavedInputs'] = (): never => {
    unsupported()
  }
  @Unsupported
  editSavedInput: IMcpRegistry['editSavedInput'] = (): never => {
    unsupported()
  }
  @Unsupported
  getSavedInputs: IMcpRegistry['getSavedInputs'] = (): never => {
    unsupported()
  }
  @Unsupported
  resolveConnection: IMcpRegistry['resolveConnection'] = (): never => {
    unsupported()
  }
  registerDelegate: IMcpRegistry['registerDelegate'] = (): IDisposable => {
    return Disposable.None
  }
  @Unsupported
  setSavedInput: IMcpRegistry['setSavedInput'] = (): never => {
    unsupported()
  }
  @Unsupported
  getServerDefinition: IMcpRegistry['getServerDefinition'] = (): never => {
    unsupported()
  }
}
registerSingleton(IMcpRegistry, McpRegistry, InstantiationType.Eager)
class McpService implements IMcpService {
  _serviceBrand: undefined
  @Unsupported
  get servers() {
    return unsupported()
  }
  @Unsupported
  get lazyCollectionState() {
    return unsupported()
  }
  @Unsupported
  resetCaches: IMcpService['resetCaches'] = (): never => {
    unsupported()
  }
  @Unsupported
  activateCollections: IMcpService['activateCollections'] = (): never => {
    unsupported()
  }
}
registerSingleton(IMcpService, McpService, InstantiationType.Eager)
class McpConfigPathsService implements IMcpConfigPathsService {
  _serviceBrand: undefined
  @Unsupported
  get paths() {
    return unsupported()
  }
}
registerSingleton(IMcpConfigPathsService, McpConfigPathsService, InstantiationType.Eager)
class ExtensionGalleryManifestService implements IExtensionGalleryManifestService {
  _serviceBrand: undefined
  onDidChangeExtensionGalleryManifest: IExtensionGalleryManifestService['onDidChangeExtensionGalleryManifest'] =
    Event.None
  isEnabled: IExtensionGalleryManifestService['isEnabled'] = () => false
  getExtensionGalleryManifest: IExtensionGalleryManifestService['getExtensionGalleryManifest'] =
    async () => null
}
registerSingleton(
  IExtensionGalleryManifestService,
  ExtensionGalleryManifestService,
  InstantiationType.Eager
)
registerSingleton(
  IWebContentExtractorService,
  NullWebContentExtractorService,
  InstantiationType.Delayed
)
registerSingleton(
  ISharedWebContentExtractorService,
  NullSharedWebContentExtractorService,
  InstantiationType.Delayed
)
registerSingleton(IDefaultAccountService, NullDefaultAccountService, InstantiationType.Delayed)
class DynamicAuthenticationProviderStorageService
  implements IDynamicAuthenticationProviderStorageService
{
  _serviceBrand: undefined
  getClientId: IDynamicAuthenticationProviderStorageService['getClientId'] = () => undefined
  storeClientId: IDynamicAuthenticationProviderStorageService['storeClientId'] = () => undefined
  getInteractedProviders: IDynamicAuthenticationProviderStorageService['getInteractedProviders'] =
    () => []
  removeDynamicProvider: IDynamicAuthenticationProviderStorageService['removeDynamicProvider'] =
    async () => undefined
  getSessionsForDynamicAuthProvider: IDynamicAuthenticationProviderStorageService['getSessionsForDynamicAuthProvider'] =
    async () => undefined
  setSessionsForDynamicAuthProvider: IDynamicAuthenticationProviderStorageService['setSessionsForDynamicAuthProvider'] =
    async () => undefined
  onDidChangeTokens: IDynamicAuthenticationProviderStorageService['onDidChangeTokens'] = Event.None
}
registerSingleton(
  IDynamicAuthenticationProviderStorageService,
  DynamicAuthenticationProviderStorageService,
  InstantiationType.Eager
)
class AuthenticationMcpService implements IAuthenticationMcpService {
  _serviceBrand: undefined
  onDidChangeAccountPreference: IAuthenticationMcpService['onDidChangeAccountPreference'] =
    Event.None
  getAccountPreference: IAuthenticationMcpService['getAccountPreference'] = () => undefined
  updateAccountPreference: IAuthenticationMcpService['updateAccountPreference'] = () => undefined
  removeAccountPreference: IAuthenticationMcpService['removeAccountPreference'] = () => undefined
  updateSessionPreference: IAuthenticationMcpService['updateSessionPreference'] = () => undefined
  getSessionPreference: IAuthenticationMcpService['getSessionPreference'] = () => undefined
  removeSessionPreference: IAuthenticationMcpService['removeSessionPreference'] = () => undefined
  requestSessionAccess: IAuthenticationMcpService['requestSessionAccess'] = () => undefined
  requestNewSession: IAuthenticationMcpService['requestNewSession'] = async () => undefined
  @Unsupported
  selectSession: IAuthenticationMcpService['selectSession'] = (): never => {
    unsupported()
  }
}
registerSingleton(IAuthenticationMcpService, AuthenticationMcpService, InstantiationType.Eager)
class AuthenticationMcpAccessService implements IAuthenticationMcpAccessService {
  _serviceBrand: undefined
  onDidChangeMcpSessionAccess: IAuthenticationMcpAccessService['onDidChangeMcpSessionAccess'] =
    Event.None
  isAccessAllowed: IAuthenticationMcpAccessService['isAccessAllowed'] = () => undefined
  readAllowedMcpServers: IAuthenticationMcpAccessService['readAllowedMcpServers'] = () => []
  updateAllowedMcpServers: IAuthenticationMcpAccessService['updateAllowedMcpServers'] = () =>
    undefined
  removeAllowedMcpServers: IAuthenticationMcpAccessService['removeAllowedMcpServers'] = () =>
    undefined
}
registerSingleton(
  IAuthenticationMcpAccessService,
  AuthenticationMcpAccessService,
  InstantiationType.Eager
)
class AuthenticationMcpUsageService implements IAuthenticationMcpUsageService {
  _serviceBrand: undefined
  initializeUsageCache: IAuthenticationMcpUsageService['initializeUsageCache'] = async () =>
    undefined
  hasUsedAuth: IAuthenticationMcpUsageService['hasUsedAuth'] = async () => false
  readAccountUsages: IAuthenticationMcpUsageService['readAccountUsages'] = () => []
  removeAccountUsage: IAuthenticationMcpUsageService['removeAccountUsage'] = () => undefined
  addAccountUsage: IAuthenticationMcpUsageService['addAccountUsage'] = () => undefined
}
registerSingleton(
  IAuthenticationMcpUsageService,
  AuthenticationMcpUsageService,
  InstantiationType.Eager
)
class McpWorkbenchService implements IMcpWorkbenchService {
  _serviceBrand: undefined
  onChange: IMcpWorkbenchService['onChange'] = Event.None
  local: IMcpWorkbenchService['local'] = []
  queryLocal: IMcpWorkbenchService['queryLocal'] = async () => []
  queryGallery: IMcpWorkbenchService['queryGallery'] = async () => []
  install: IMcpWorkbenchService['install'] = async () => undefined
  uninstall: IMcpWorkbenchService['uninstall'] = async () => undefined
  open: IMcpWorkbenchService['open'] = async () => undefined
}
registerSingleton(IMcpWorkbenchService, McpWorkbenchService, InstantiationType.Eager)
class McpGalleryService implements IMcpGalleryService {
  _serviceBrand: undefined
  isEnabled: IMcpGalleryService['isEnabled'] = () => false
  query: IMcpGalleryService['query'] = async () => []
  @Unsupported
  getManifest: IMcpGalleryService['getManifest'] = (): never => {
    unsupported()
  }
  @Unsupported
  getReadme: IMcpGalleryService['getReadme'] = (): never => {
    unsupported()
  }
}
registerSingleton(IMcpGalleryService, McpGalleryService, InstantiationType.Eager)
class McpManagementService implements IMcpManagementService {
  _serviceBrand: undefined
  onInstallMcpServer: IMcpManagementService['onInstallMcpServer'] = Event.None
  onDidInstallMcpServers: IMcpManagementService['onDidInstallMcpServers'] = Event.None
  onUninstallMcpServer: IMcpManagementService['onUninstallMcpServer'] = Event.None
  onDidUninstallMcpServer: IMcpManagementService['onDidUninstallMcpServer'] = Event.None
  getInstalled: IMcpManagementService['getInstalled'] = async () => []
  installFromGallery: IMcpManagementService['installFromGallery'] = async () => undefined
  uninstall: IMcpManagementService['uninstall'] = async () => undefined
}
registerSingleton(IMcpManagementService, McpManagementService, InstantiationType.Eager)
class McpSamplingService implements IMcpSamplingService {
  _serviceBrand: undefined
  @Unsupported
  sample: IMcpSamplingService['sample'] = (): never => {
    unsupported()
  }
  hasLogs: IMcpSamplingService['hasLogs'] = () => false
  @Unsupported
  getLogText: IMcpSamplingService['getLogText'] = (): never => {
    unsupported()
  }
  @Unsupported
  getConfig: IMcpSamplingService['getConfig'] = (): never => {
    unsupported()
  }
  @Unsupported
  updateConfig: IMcpSamplingService['updateConfig'] = (): never => {
    unsupported()
  }
}
registerSingleton(IMcpSamplingService, McpSamplingService, InstantiationType.Eager)
class ChatContextPickService implements IChatContextPickService {
  _serviceBrand: undefined
  items: IChatContextPickService['items'] = []
  registerChatContextItem: IChatContextPickService['registerChatContextItem'] = () =>
    Disposable.None
}
registerSingleton(IChatContextPickService, ChatContextPickService, InstantiationType.Eager)
class BrowserElementsService implements IBrowserElementsService {
  _serviceBrand: undefined
  getElementData: IBrowserElementsService['getElementData'] = async () => undefined
  startDebugSession: IBrowserElementsService['startDebugSession'] = async () => undefined
}
registerSingleton(IBrowserElementsService, BrowserElementsService, InstantiationType.Eager)
class GettingStartedExperimentService implements IGettingStartedExperimentService {
  _serviceBrand: undefined
  getCurrentExperiment: IGettingStartedExperimentService['getCurrentExperiment'] = () => undefined
}
registerSingleton(
  IGettingStartedExperimentService,
  GettingStartedExperimentService,
  InstantiationType.Eager
)
class TreeSitterThemeService implements ITreeSitterThemeService {
  _serviceBrand: undefined
  @Unsupported
  get onChange() {
    return unsupported()
  }
  @Unsupported
  findMetadata: ITreeSitterThemeService['findMetadata'] = (): never => {
    unsupported()
  }
}
registerSingleton(ITreeSitterThemeService, TreeSitterThemeService, InstantiationType.Eager)
class TreeSitterLibraryService implements ITreeSitterLibraryService {
  _serviceBrand: undefined
  @Unsupported
  getParserClass: ITreeSitterLibraryService['getParserClass'] = (): never => {
    unsupported()
  }
  supportsLanguage: ITreeSitterLibraryService['supportsLanguage'] = () => false
  getLanguage: ITreeSitterLibraryService['getLanguage'] = () => undefined
  getInjectionQueries: ITreeSitterLibraryService['getInjectionQueries'] = () => undefined
  getHighlightingQueries: ITreeSitterLibraryService['getHighlightingQueries'] = () => undefined
}
registerSingleton(ITreeSitterLibraryService, TreeSitterLibraryService, InstantiationType.Eager)
