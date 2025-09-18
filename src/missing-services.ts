import { mainWindow } from 'vs/base/browser/window'
import {
  DynamicListEventMultiplexer,
  Event,
  type IDynamicListEventMultiplexer
} from 'vs/base/common/event'
import { Disposable, type IDisposable } from 'vs/base/common/lifecycle'
import { ResourceSet } from 'vs/base/common/map'
import { constObservable } from 'vs/base/common/observable'
import { OS } from 'vs/base/common/platform'
import { joinPath } from 'vs/base/common/resources'
import { URI } from 'vs/base/common/uri'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService.service'
import { HoverService } from 'vs/editor/browser/services/hoverService/hoverService'
import { InlineCompletionsService } from 'vs/editor/browser/services/inlineCompletionsService'
import { IInlineCompletionsService } from 'vs/editor/browser/services/inlineCompletionsService.service'
import { WorkerBasedDiffProviderFactoryService } from 'vs/editor/browser/widget/diffEditor/diffProviderFactoryService'
import { IDiffProviderFactoryService } from 'vs/editor/browser/widget/diffEditor/diffProviderFactoryService.service'
import { LanguageConfigurationService } from 'vs/editor/common/languages/languageConfigurationRegistry'
import { ILanguageConfigurationService } from 'vs/editor/common/languages/languageConfigurationRegistry.service'
import { LanguageFeatureDebounceService } from 'vs/editor/common/services/languageFeatureDebounce'
import { ILanguageFeatureDebounceService } from 'vs/editor/common/services/languageFeatureDebounce.service'
import { ILanguageFeaturesService } from 'vs/editor/common/services/languageFeatures.service'
import { LanguageFeaturesService } from 'vs/editor/common/services/languageFeaturesService'
import { IModelService } from 'vs/editor/common/services/model.service'
import { ISemanticTokensStylingService } from 'vs/editor/common/services/semanticTokensStyling.service'
import { SemanticTokensStylingService } from 'vs/editor/common/services/semanticTokensStylingService'
import { ITreeSitterLibraryService } from 'vs/editor/common/services/treeSitter/treeSitterLibraryService.service'
import { ITreeSitterThemeService } from 'vs/editor/common/services/treeSitter/treeSitterThemeService.service'
import { ITreeViewsDnDService } from 'vs/editor/common/services/treeViewsDndService.service'
import { CodeLensCache } from 'vs/editor/contrib/codelens/browser/codeLensCache'
import { ICodeLensCache } from 'vs/editor/contrib/codelens/browser/codeLensCache.service'
import { OutlineModelService } from 'vs/editor/contrib/documentSymbols/browser/outlineModel'
import { IOutlineModelService } from 'vs/editor/contrib/documentSymbols/browser/outlineModel.service'
import { EditorCancellationTokens } from 'vs/editor/contrib/editorState/browser/keybindingCancellation'
import { IEditorCancellationTokens } from 'vs/editor/contrib/editorState/browser/keybindingCancellation.service'
import { MarkerNavigationService } from 'vs/editor/contrib/gotoError/browser/markerNavigationService'
import { IMarkerNavigationService } from 'vs/editor/contrib/gotoError/browser/markerNavigationService.service'
import { SymbolNavigationService } from 'vs/editor/contrib/gotoSymbol/browser/symbolNavigation'
import { ISymbolNavigationService } from 'vs/editor/contrib/gotoSymbol/browser/symbolNavigation.service'
import { InlayHintsCache } from 'vs/editor/contrib/inlayHints/browser/inlayHintsController'
import { IInlayHintsCache } from 'vs/editor/contrib/inlayHints/browser/inlayHintsController.service'
import { PeekViewService } from 'vs/editor/contrib/peekView/browser/peekView'
import { IPeekViewService } from 'vs/editor/contrib/peekView/browser/peekView.service'
import { SuggestMemoryService } from 'vs/editor/contrib/suggest/browser/suggestMemory'
import { ISuggestMemoryService } from 'vs/editor/contrib/suggest/browser/suggestMemory.service'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IAccessibleViewService } from 'vs/platform/accessibility/browser/accessibleView.service'
import { ActionWidgetService } from 'vs/platform/actionWidget/browser/actionWidget'
import { IActionWidgetService } from 'vs/platform/actionWidget/browser/actionWidget.service'
import { IActionViewItemService } from 'vs/platform/actions/browser/actionViewItemService.service'
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey.service'
import { IExtensionHostDebugService } from 'vs/platform/debug/common/extensionHostDebug.service'
import { NullDiagnosticsService } from 'vs/platform/diagnostics/common/diagnostics'
import { IDiagnosticsService } from 'vs/platform/diagnostics/common/diagnostics.service'
import { IFileDialogService } from 'vs/platform/dialogs/common/dialogs.service'
import { IDownloadService } from 'vs/platform/download/common/download.service'
import { IEncryptionService } from 'vs/platform/encryption/common/encryptionService.service'
import { IEnvironmentService } from 'vs/platform/environment/common/environment.service'
import { IExtensionGalleryManifestService } from 'vs/platform/extensionManagement/common/extensionGalleryManifest.service'
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
import { IHoverService } from 'vs/platform/hover/browser/hover.service'
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
import {
  IAllowedMcpServersService,
  IMcpGalleryService
} from 'vs/platform/mcp/common/mcpManagement.service'
import { IMcpResourceScannerService } from 'vs/platform/mcp/common/mcpResourceScannerService.service'
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
import { IUndoRedoService } from 'vs/platform/undoRedo/common/undoRedo.service'
import { UndoRedoService } from 'vs/platform/undoRedo/common/undoRedoService'
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
import {
  NullSharedWebContentExtractorService,
  NullWebContentExtractorService
} from 'vs/platform/webContentExtractor/common/webContentExtractor'
import {
  ISharedWebContentExtractorService,
  IWebContentExtractorService
} from 'vs/platform/webContentExtractor/common/webContentExtractor.service'
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
import { IChatAttachmentResolveService } from 'vs/workbench/contrib/chat/browser/chatAttachmentResolveService.service'
import { IChatMarkdownAnchorService } from 'vs/workbench/contrib/chat/browser/chatContentParts/chatMarkdownAnchorService.service'
import { IChatContextPickService } from 'vs/workbench/contrib/chat/browser/chatContextPickService.service'
import { IChatOutputRendererService } from 'vs/workbench/contrib/chat/browser/chatOutputItemRenderer.service'
import { IChatStatusItemService } from 'vs/workbench/contrib/chat/browser/chatStatusItemService.service'
import {
  IChatAgentNameService,
  IChatAgentService
} from 'vs/workbench/contrib/chat/common/chatAgents.service'
import { ICodeMapperService } from 'vs/workbench/contrib/chat/common/chatCodeMapperService.service'
import { IChatEditingService } from 'vs/workbench/contrib/chat/common/chatEditingService.service'
import { IChatEntitlementService } from 'vs/workbench/contrib/chat/common/chatEntitlementService.service'
import { IChatService } from 'vs/workbench/contrib/chat/common/chatService.service'
import { IChatSessionsService } from 'vs/workbench/contrib/chat/common/chatSessionsService.service'
import { IChatSlashCommandService } from 'vs/workbench/contrib/chat/common/chatSlashCommands.service'
import { IChatTodoListService } from 'vs/workbench/contrib/chat/common/chatTodoListService.service'
import { IChatTransferService } from 'vs/workbench/contrib/chat/common/chatTransferService.service'
import { IChatVariablesService } from 'vs/workbench/contrib/chat/common/chatVariables.service'
import { IChatWidgetHistoryService } from 'vs/workbench/contrib/chat/common/chatWidgetHistoryService.service'
import { ILanguageModelIgnoredFilesService } from 'vs/workbench/contrib/chat/common/ignoredFiles.service'
import { ILanguageModelStatsService } from 'vs/workbench/contrib/chat/common/languageModelStats.service'
import { ILanguageModelToolsService } from 'vs/workbench/contrib/chat/common/languageModelToolsService.service'
import { ILanguageModelsService } from 'vs/workbench/contrib/chat/common/languageModels.service'
import { IPromptsService } from 'vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.service'
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
import { IMcpRegistry } from 'vs/workbench/contrib/mcp/common/mcpRegistryTypes.service'
import {
  IMcpElicitationService,
  IMcpSamplingService,
  IMcpService,
  IMcpWorkbenchService
} from 'vs/workbench/contrib/mcp/common/mcpTypes.service'
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
import { IRemoteCodingAgentsService } from 'vs/workbench/contrib/remoteCodingAgents/common/remoteCodingAgentsService.service'
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
import { NullDefaultAccountService } from 'vs/workbench/services/accounts/common/defaultAccount'
import { IDefaultAccountService } from 'vs/workbench/services/accounts/common/defaultAccount.service'
import { IActivityService } from 'vs/workbench/services/activity/common/activity.service'
import { IAiEmbeddingVectorService } from 'vs/workbench/services/aiEmbeddingVector/common/aiEmbeddingVectorService.service'
import { IAiRelatedInformationService } from 'vs/workbench/services/aiRelatedInformation/common/aiRelatedInformation.service'
import { IWorkbenchAssignmentService } from 'vs/workbench/services/assignment/common/assignmentService.service'
import { IAuthenticationAccessService } from 'vs/workbench/services/authentication/browser/authenticationAccessService.service'
import { IAuthenticationMcpAccessService } from 'vs/workbench/services/authentication/browser/authenticationMcpAccessService.service'
import { IAuthenticationMcpService } from 'vs/workbench/services/authentication/browser/authenticationMcpService.service'
import { IAuthenticationMcpUsageService } from 'vs/workbench/services/authentication/browser/authenticationMcpUsageService.service'
import { IAuthenticationUsageService } from 'vs/workbench/services/authentication/browser/authenticationUsageService.service'
import {
  IAuthenticationExtensionsService,
  IAuthenticationService
} from 'vs/workbench/services/authentication/common/authentication.service'
import { IAuthenticationQueryService } from 'vs/workbench/services/authentication/common/authenticationQuery.service'
import { IDynamicAuthenticationProviderStorageService } from 'vs/workbench/services/authentication/common/dynamicAuthenticationProviderStorage.service'
import { IAuxiliaryWindowService } from 'vs/workbench/services/auxiliaryWindow/browser/auxiliaryWindowService.service'
import { IBannerService } from 'vs/workbench/services/banner/browser/bannerService.service'
import { IBrowserElementsService } from 'vs/workbench/services/browserElements/browser/browserElementsService.service'
import { IJSONEditingService } from 'vs/workbench/services/configuration/common/jsonEditing.service'
import { IConfigurationResolverService } from 'vs/workbench/services/configurationResolver/common/configurationResolver.service'
import { IDecorationsService } from 'vs/workbench/services/decorations/common/decorations.service'
import { CodeEditorService } from 'vs/workbench/services/editor/browser/codeEditorService'
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
import { IWorkbenchMcpManagementService } from 'vs/workbench/services/mcp/common/mcpWorkbenchManagementService.service'
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
import { IAiSettingsSearchService } from 'vscode/src/vs/workbench/services/aiSettingsSearch/common/aiSettingsSearch.service'

import { NullDataChannelService } from 'vs/platform/dataChannel/common/dataChannel'
import { IDataChannelService } from 'vs/platform/dataChannel/common/dataChannel.service'
import { IImageResizeService } from 'vs/platform/imageResize/common/imageResizeService.service'
import { McpGalleryManifestStatus } from 'vs/platform/mcp/common/mcpGalleryManifest'
import { IMcpGalleryManifestService } from 'vs/platform/mcp/common/mcpGalleryManifest.service'
import { IChatLayoutService } from 'vs/workbench/contrib/chat/common/chatLayoutService.service'
import { IAiEditTelemetryService } from 'vs/workbench/contrib/editTelemetry/browser/telemetry/aiEditTelemetry/aiEditTelemetryService.service'
import type { IInlineCompletionsUnificationState } from 'vs/workbench/services/inlineCompletions/common/inlineCompletionsUnification'
import { IInlineCompletionsUnificationService } from 'vs/workbench/services/inlineCompletions/common/inlineCompletionsUnification.service'
import { getBuiltInExtensionTranslationsUris, getExtensionIdProvidingCurrentLocale } from './l10n'
import { unsupported } from './tools'
import { IChatModeService } from 'vs/workbench/contrib/chat/common/chatModes.service'

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
registerSingleton(IInlineCompletionsService, InlineCompletionsService, InstantiationType.Delayed)
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
  openEditor: IEditorService['openEditor'] = unsupported
  @Unsupported
  openEditors: IEditorService['openEditors'] = unsupported
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
    unsupported
}
registerSingleton(IPaneCompositePartService, PaneCompositePartService, InstantiationType.Eager)
registerSingleton(IUriIdentityService, UriIdentityService, InstantiationType.Delayed)
class TextFileService implements ITextFileService {
  _serviceBrand: undefined
  @Unsupported
  resolveDecoding: ITextFileService['resolveDecoding'] = unsupported
  @Unsupported
  resolveEncoding: ITextFileService['resolveEncoding'] = unsupported
  @Unsupported
  validateDetectedEncoding: ITextFileService['validateDetectedEncoding'] = unsupported
  @Unsupported
  getEncoding: ITextFileService['getEncoding'] = unsupported
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
  isDirty: ITextFileService['isDirty'] = unsupported
  @Unsupported
  save: ITextFileService['save'] = unsupported
  @Unsupported
  saveAs: ITextFileService['saveAs'] = unsupported
  @Unsupported
  revert: ITextFileService['revert'] = unsupported
  @Unsupported
  read: ITextFileService['read'] = unsupported
  @Unsupported
  readStream: ITextFileService['readStream'] = unsupported
  @Unsupported
  write: ITextFileService['write'] = unsupported
  @Unsupported
  create: ITextFileService['create'] = unsupported
  @Unsupported
  getEncodedReadable: ITextFileService['getEncodedReadable'] = unsupported
  @Unsupported
  getDecodedStream: ITextFileService['getDecodedStream'] = unsupported
  @Unsupported
  dispose: ITextFileService['dispose'] = unsupported
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
  registerProvider: IFileService['registerProvider'] = unsupported
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
  resolve: IFileService['resolve'] = unsupported
  @Unsupported
  resolveAll: IFileService['resolveAll'] = unsupported
  @Unsupported
  stat: IFileService['stat'] = unsupported
  exists: IFileService['exists'] = async () => false
  @Unsupported
  readFile: IFileService['readFile'] = unsupported
  @Unsupported
  readFileStream: IFileService['readFileStream'] = unsupported
  @Unsupported
  writeFile: IFileService['writeFile'] = unsupported
  @Unsupported
  move: IFileService['move'] = unsupported
  @Unsupported
  canMove: IFileService['canMove'] = unsupported
  @Unsupported
  copy: IFileService['copy'] = unsupported
  @Unsupported
  canCopy: IFileService['canCopy'] = unsupported
  @Unsupported
  cloneFile: IFileService['cloneFile'] = unsupported
  @Unsupported
  createFile: IFileService['createFile'] = unsupported
  @Unsupported
  canCreateFile: IFileService['canCreateFile'] = unsupported
  @Unsupported
  createFolder: IFileService['createFolder'] = unsupported
  @Unsupported
  del: IFileService['del'] = unsupported
  @Unsupported
  canDelete: IFileService['canDelete'] = unsupported
  onDidWatchError: IFileService['onDidWatchError'] = Event.None
  @Unsupported
  watch: IFileService['watch'] = unsupported
  @Unsupported
  createWatcher: IFileService['createWatcher'] = unsupported
  realpath: IFileService['realpath'] = async () => {
    return undefined
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
  setSelection: IEditorGroup['setSelection'] = unsupported
  isTransient: IEditorGroup['isTransient'] = () => false
  windowId: IEditorGroup['windowId'] = mainWindow.vscodeWindowId
  @Unsupported
  get groupsView() {
    return unsupported()
  }
  notifyLabelChanged: IEditorGroupView['notifyLabelChanged'] = (): void => {}
  @Unsupported
  createEditorActions: IEditorGroup['createEditorActions'] = unsupported
  onDidFocus: IEditorGroupView['onDidFocus'] = Event.None
  onDidOpenEditorFail: IEditorGroupView['onDidOpenEditorFail'] = Event.None
  whenRestored: IEditorGroupView['whenRestored'] = Promise.resolve()
  @Unsupported
  get titleHeight() {
    return unsupported()
  }
  disposed: IEditorGroupView['disposed'] = false
  @Unsupported
  setActive: IEditorGroupView['setActive'] = unsupported
  @Unsupported
  notifyIndexChanged: IEditorGroupView['notifyIndexChanged'] = unsupported
  @Unsupported
  relayout: IEditorGroupView['relayout'] = unsupported
  @Unsupported
  dispose: IEditorGroupView['dispose'] = unsupported
  @Unsupported
  toJSON: IEditorGroupView['toJSON'] = unsupported
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
  layout: IEditorGroupView['layout'] = unsupported
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
  getIndexOfEditor: IEditorGroup['getIndexOfEditor'] = unsupported
  @Unsupported
  openEditor: IEditorGroup['openEditor'] = unsupported
  @Unsupported
  openEditors: IEditorGroup['openEditors'] = unsupported
  isPinned: IEditorGroup['isPinned'] = () => false
  isSticky: IEditorGroup['isSticky'] = () => false
  isActive: IEditorGroup['isActive'] = () => false
  contains: IEditorGroup['contains'] = () => false
  @Unsupported
  moveEditor: IEditorGroup['moveEditor'] = unsupported
  @Unsupported
  moveEditors: IEditorGroup['moveEditors'] = unsupported
  @Unsupported
  copyEditor: IEditorGroup['copyEditor'] = unsupported
  @Unsupported
  copyEditors: IEditorGroup['copyEditors'] = unsupported
  @Unsupported
  closeEditor: IEditorGroup['closeEditor'] = unsupported
  @Unsupported
  closeEditors: IEditorGroup['closeEditors'] = unsupported
  @Unsupported
  closeAllEditors: IEditorGroup['closeAllEditors'] = unsupported
  @Unsupported
  replaceEditors: IEditorGroup['replaceEditors'] = unsupported
  pinEditor: IEditorGroup['pinEditor'] = () => {}
  stickEditor: IEditorGroup['stickEditor'] = () => {}
  unstickEditor: IEditorGroup['unstickEditor'] = () => {}
  lock: IEditorGroup['lock'] = () => {}
  focus: IEditorGroup['focus'] = (): void => {
    // ignore
  }
  @Unsupported
  isFirst: IEditorGroup['isFirst'] = unsupported
  @Unsupported
  isLast: IEditorGroup['isLast'] = unsupported
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
  centerLayout: IEditorPart['centerLayout'] = unsupported
  @Unsupported
  isLayoutCentered: IEditorPart['isLayoutCentered'] = unsupported
  @Unsupported
  enforcePartOptions: IEditorPart['enforcePartOptions'] = unsupported
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
  activateGroup: IEditorPart['activateGroup'] = unsupported
  @Unsupported
  getSize: IEditorPart['getSize'] = unsupported
  @Unsupported
  setSize: IEditorPart['setSize'] = unsupported
  @Unsupported
  arrangeGroups: IEditorPart['arrangeGroups'] = unsupported
  @Unsupported
  toggleMaximizeGroup: IEditorPart['toggleMaximizeGroup'] = unsupported
  @Unsupported
  toggleExpandGroup: IEditorPart['toggleExpandGroup'] = unsupported
  @Unsupported
  applyLayout: IEditorPart['applyLayout'] = unsupported
  @Unsupported
  getLayout: IEditorPart['getLayout'] = unsupported
  @Unsupported
  setGroupOrientation: IEditorPart['setGroupOrientation'] = unsupported
  findGroup: IEditorPart['findGroup'] = () => undefined
  @Unsupported
  addGroup: IEditorPart['addGroup'] = unsupported
  @Unsupported
  removeGroup: IEditorPart['removeGroup'] = unsupported
  @Unsupported
  moveGroup: IEditorPart['moveGroup'] = unsupported
  @Unsupported
  mergeGroup: IEditorPart['mergeGroup'] = unsupported
  @Unsupported
  mergeAllGroups: IEditorPart['mergeAllGroups'] = unsupported
  @Unsupported
  copyGroup: IEditorPart['copyGroup'] = unsupported
  partOptions: IEditorPart['partOptions'] = DEFAULT_EDITOR_PART_OPTIONS
  onDidChangeEditorPartOptions: IEditorPart['onDidChangeEditorPartOptions'] = Event.None
  @Unsupported
  createEditorDropTarget: IEditorPart['createEditorDropTarget'] = unsupported
}
class EmptyEditorGroupsService implements IEditorGroupsService {
  @Unsupported
  getScopedInstantiationService: IEditorGroupsService['getScopedInstantiationService'] = unsupported
  @Unsupported
  registerContextKeyProvider: IEditorGroupsService['registerContextKeyProvider'] = unsupported
  @Unsupported
  saveWorkingSet: IEditorGroupsService['saveWorkingSet'] = unsupported
  @Unsupported
  getWorkingSets: IEditorGroupsService['getWorkingSets'] = unsupported
  @Unsupported
  applyWorkingSet: IEditorGroupsService['applyWorkingSet'] = unsupported
  @Unsupported
  deleteWorkingSet: IEditorGroupsService['deleteWorkingSet'] = unsupported
  onDidCreateAuxiliaryEditorPart: IEditorGroupsService['onDidCreateAuxiliaryEditorPart'] =
    Event.None
  mainPart: IEditorGroupsService['mainPart'] = new EmptyEditorPart()
  parts: IEditorGroupsService['parts'] = [this.mainPart]
  @Unsupported
  getPart: IEditorGroupsService['getPart'] = unsupported
  @Unsupported
  createAuxiliaryEditorPart: IEditorGroupsService['createAuxiliaryEditorPart'] = unsupported
  onDidChangeGroupMaximized: IEditorGroupsService['onDidChangeGroupMaximized'] = Event.None
  @Unsupported
  toggleMaximizeGroup: IEditorGroupsService['toggleMaximizeGroup'] = unsupported
  @Unsupported
  toggleExpandGroup: IEditorGroupsService['toggleExpandGroup'] = unsupported
  partOptions: IEditorGroupsService['partOptions'] = DEFAULT_EDITOR_PART_OPTIONS
  @Unsupported
  createEditorDropTarget: IEditorGroupsService['createEditorDropTarget'] = unsupported
  readonly _serviceBrand: IEditorGroupsService['_serviceBrand'] = undefined
  @Unsupported
  getLayout: IEditorGroupsService['getLayout'] = unsupported
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
  activateGroup: IEditorGroupsService['activateGroup'] = unsupported
  @Unsupported
  getSize: IEditorGroupsService['getSize'] = unsupported
  @Unsupported
  setSize: IEditorGroupsService['setSize'] = unsupported
  @Unsupported
  arrangeGroups: IEditorGroupsService['arrangeGroups'] = unsupported
  @Unsupported
  applyLayout: IEditorGroupsService['applyLayout'] = unsupported
  @Unsupported
  setGroupOrientation: IEditorGroupsService['setGroupOrientation'] = unsupported
  findGroup: IEditorGroupsService['findGroup'] = (): undefined => undefined
  @Unsupported
  addGroup: IEditorGroupsService['addGroup'] = unsupported
  @Unsupported
  removeGroup: IEditorGroupsService['removeGroup'] = unsupported
  @Unsupported
  moveGroup: IEditorGroupsService['moveGroup'] = unsupported
  @Unsupported
  mergeGroup: IEditorGroupsService['mergeGroup'] = unsupported
  @Unsupported
  mergeAllGroups: IEditorGroupsService['mergeAllGroups'] = unsupported
  @Unsupported
  copyGroup: IEditorGroupsService['copyGroup'] = unsupported
  onDidChangeEditorPartOptions: IEditorGroupsService['onDidChangeEditorPartOptions'] = Event.None
  @Unsupported
  enforcePartOptions: IEditorGroupsService['enforcePartOptions'] = unsupported
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
  getPart: ITitleService['getPart'] = unsupported
  @Unsupported
  createAuxiliaryTitlebarPart: ITitleService['createAuxiliaryTitlebarPart'] = unsupported
  @Unsupported
  dispose: ITitleService['dispose'] = unsupported
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
  addFileOperationParticipant: IWorkingCopyFileService['addFileOperationParticipant'] = unsupported
  hasSaveParticipants: IWorkingCopyFileService['hasSaveParticipants'] = false
  @Unsupported
  addSaveParticipant: IWorkingCopyFileService['addSaveParticipant'] = unsupported
  @Unsupported
  runSaveParticipants: IWorkingCopyFileService['runSaveParticipants'] = unsupported
  @Unsupported
  create: IWorkingCopyFileService['create'] = unsupported
  @Unsupported
  createFolder: IWorkingCopyFileService['createFolder'] = unsupported
  @Unsupported
  move: IWorkingCopyFileService['move'] = unsupported
  @Unsupported
  copy: IWorkingCopyFileService['copy'] = unsupported
  @Unsupported
  delete: IWorkingCopyFileService['delete'] = unsupported
  @Unsupported
  registerWorkingCopyProvider: IWorkingCopyFileService['registerWorkingCopyProvider'] = unsupported
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
  fileURI: IPathService['fileURI'] = unsupported
  @Unsupported
  userHome: IPathService['userHome'] = unsupported
  @Unsupported
  hasValidBasename: IPathService['hasValidBasename'] = unsupported
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
  addStatus: ILanguageStatusService['addStatus'] = unsupported
  @Unsupported
  getLanguageStatus: ILanguageStatusService['getLanguageStatus'] = unsupported
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
  focus: IHostService['focus'] = unsupported
  onDidChangeActiveWindow: IHostService['onDidChangeActiveWindow'] = Event.None
  @Unsupported
  openWindow: IHostService['openWindow'] = unsupported
  @Unsupported
  toggleFullScreen: IHostService['toggleFullScreen'] = unsupported
  @Unsupported
  moveTop: IHostService['moveTop'] = unsupported
  @Unsupported
  getCursorScreenPoint: IHostService['getCursorScreenPoint'] = unsupported
  @Unsupported
  restart: IHostService['restart'] = unsupported
  @Unsupported
  reload: IHostService['reload'] = unsupported
  @Unsupported
  close: IHostService['close'] = unsupported
  @Unsupported
  withExpectedShutdown: IHostService['withExpectedShutdown'] = unsupported
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
  getFolderSettingsResource: IPreferencesService['getFolderSettingsResource'] = unsupported
  @Unsupported
  createPreferencesEditorModel: IPreferencesService['createPreferencesEditorModel'] = unsupported
  @Unsupported
  createSettings2EditorModel: IPreferencesService['createSettings2EditorModel'] = unsupported
  @Unsupported
  openRawDefaultSettings: IPreferencesService['openRawDefaultSettings'] = unsupported
  @Unsupported
  openSettings: IPreferencesService['openSettings'] = unsupported
  @Unsupported
  openUserSettings: IPreferencesService['openUserSettings'] = unsupported
  @Unsupported
  openRemoteSettings: IPreferencesService['openRemoteSettings'] = unsupported
  @Unsupported
  openWorkspaceSettings: IPreferencesService['openWorkspaceSettings'] = unsupported
  @Unsupported
  openFolderSettings: IPreferencesService['openFolderSettings'] = unsupported
  @Unsupported
  openGlobalKeybindingSettings: IPreferencesService['openGlobalKeybindingSettings'] = unsupported
  @Unsupported
  openDefaultKeybindingsFile: IPreferencesService['openDefaultKeybindingsFile'] = unsupported
  @Unsupported
  getEditableSettingsURI: IPreferencesService['getEditableSettingsURI'] = unsupported
  @Unsupported
  createSplitJsonEditorInput: IPreferencesService['createSplitJsonEditorInput'] = unsupported
  @Unsupported
  openApplicationSettings: IPreferencesService['openApplicationSettings'] = unsupported
  @Unsupported
  openLanguageSpecificSettings: IPreferencesService['openLanguageSpecificSettings'] = unsupported
  openPreferences: IPreferencesService['openPreferences'] = async () => undefined
}
registerSingleton(IPreferencesService, PreferencesService, InstantiationType.Eager)
class NullTextMateService implements ITextMateTokenizationService {
  _serviceBrand: undefined
  @Unsupported
  startDebugMode: ITextMateTokenizationService['startDebugMode'] = unsupported
  @Unsupported
  createTokenizer: ITextMateTokenizationService['createTokenizer'] = unsupported
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
  createNamedProfile: IUserDataProfilesService['createNamedProfile'] = unsupported
  @Unsupported
  createTransientProfile: IUserDataProfilesService['createTransientProfile'] = unsupported
  @Unsupported
  resetWorkspaces: IUserDataProfilesService['resetWorkspaces'] = unsupported
  @Unsupported
  cleanUp: IUserDataProfilesService['cleanUp'] = unsupported
  @Unsupported
  cleanUpTransientProfiles: IUserDataProfilesService['cleanUpTransientProfiles'] = unsupported
  @Unsupported
  get profilesHome() {
    return unsupported()
  }
  defaultProfile: IUserDataProfilesService['defaultProfile'] = this.profileService.currentProfile
  onDidChangeProfiles: IUserDataProfilesService['onDidChangeProfiles'] = Event.None
  profiles: IUserDataProfilesService['profiles'] = [this.profileService.currentProfile]
  @Unsupported
  createProfile: IUserDataProfilesService['createProfile'] = unsupported
  @Unsupported
  updateProfile: IUserDataProfilesService['updateProfile'] = unsupported
  @Unsupported
  setProfileForWorkspace: IUserDataProfilesService['setProfileForWorkspace'] = unsupported
  @Unsupported
  removeProfile: IUserDataProfilesService['removeProfile'] = unsupported
}
registerSingleton(IUserDataProfilesService, UserDataProfilesService, InstantiationType.Eager)
class UserDataProfileStorageService implements IUserDataProfileStorageService {
  _serviceBrand: undefined
  onDidChange: IUserDataProfileStorageService['onDidChange'] = Event.None
  @Unsupported
  readStorageData: IUserDataProfileStorageService['readStorageData'] = unsupported
  @Unsupported
  updateStorageData: IUserDataProfileStorageService['updateStorageData'] = unsupported
  @Unsupported
  withProfileScopedStorageService: IUserDataProfileStorageService['withProfileScopedStorageService'] =
    unsupported
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
  getSnippetFiles: ISnippetsService['getSnippetFiles'] = unsupported
  @Unsupported
  isEnabled: ISnippetsService['isEnabled'] = unsupported
  @Unsupported
  updateEnablement: ISnippetsService['updateEnablement'] = unsupported
  @Unsupported
  updateUsageTimestamp: ISnippetsService['updateUsageTimestamp'] = unsupported
  getSnippets: ISnippetsService['getSnippets'] = async () => []
  @Unsupported
  getSnippetsSync: ISnippetsService['getSnippetsSync'] = unsupported
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
  setVisualizedExpression: IViewModel['setVisualizedExpression'] = unsupported
  getVisualizedExpression: IViewModel['getVisualizedExpression'] = () => undefined
  onDidChangeVisualization: IViewModel['onDidChangeVisualization'] = Event.None
  @Unsupported
  getId: IViewModel['getId'] = unsupported
  readonly focusedSession: IViewModel['focusedSession'] = undefined
  readonly focusedThread: IViewModel['focusedThread'] = undefined
  readonly focusedStackFrame: IViewModel['focusedStackFrame'] = undefined
  @Unsupported
  getSelectedExpression: IViewModel['getSelectedExpression'] = unsupported
  @Unsupported
  setSelectedExpression: IViewModel['setSelectedExpression'] = unsupported
  @Unsupported
  updateViews: IViewModel['updateViews'] = unsupported
  @Unsupported
  isMultiSessionView: IViewModel['isMultiSessionView'] = unsupported
  onDidFocusSession: IViewModel['onDidFocusSession'] = Event.None
  onDidFocusStackFrame: IViewModel['onDidFocusStackFrame'] = Event.None
  onDidSelectExpression: IViewModel['onDidSelectExpression'] = Event.None
  onDidEvaluateLazyExpression: IViewModel['onDidEvaluateLazyExpression'] = Event.None
  onWillUpdateViews: IViewModel['onWillUpdateViews'] = Event.None
  onDidFocusThread: IViewModel['onDidFocusThread'] = Event.None
  @Unsupported
  evaluateLazyExpression: IViewModel['evaluateLazyExpression'] = unsupported
}
class FakeAdapterManager implements IAdapterManager {
  onDidRegisterDebugger: IAdapterManager['onDidRegisterDebugger'] = Event.None
  hasEnabledDebuggers: IAdapterManager['hasEnabledDebuggers'] = () => false
  @Unsupported
  getDebugAdapterDescriptor: IAdapterManager['getDebugAdapterDescriptor'] = unsupported
  @Unsupported
  getDebuggerLabel: IAdapterManager['getDebuggerLabel'] = unsupported
  someDebuggerInterestedInLanguage: IAdapterManager['someDebuggerInterestedInLanguage'] = () =>
    false
  getDebugger: IAdapterManager['getDebugger'] = () => undefined
  @Unsupported
  activateDebuggers: IAdapterManager['activateDebuggers'] = unsupported
  registerDebugAdapterFactory: IAdapterManager['registerDebugAdapterFactory'] = () =>
    Disposable.None
  @Unsupported
  createDebugAdapter: IAdapterManager['createDebugAdapter'] = unsupported
  @Unsupported
  registerDebugAdapterDescriptorFactory: IAdapterManager['registerDebugAdapterDescriptorFactory'] =
    unsupported
  @Unsupported
  unregisterDebugAdapterDescriptorFactory: IAdapterManager['unregisterDebugAdapterDescriptorFactory'] =
    unsupported
  @Unsupported
  substituteVariables: IAdapterManager['substituteVariables'] = unsupported
  @Unsupported
  runInTerminal: IAdapterManager['runInTerminal'] = unsupported
  @Unsupported
  getEnabledDebugger: IAdapterManager['getEnabledDebugger'] = unsupported
  @Unsupported
  guessDebugger: IAdapterManager['guessDebugger'] = unsupported
  onDidDebuggersExtPointRead: IAdapterManager['onDidDebuggersExtPointRead'] = Event.None
}
class DebugService implements IDebugService {
  _serviceBrand: undefined
  initializingOptions: IDebugService['initializingOptions'] = undefined
  @Unsupported
  sendBreakpoints: IDebugService['sendBreakpoints'] = unsupported
  @Unsupported
  updateDataBreakpoint: IDebugService['updateDataBreakpoint'] = unsupported
  @Unsupported
  get state() {
    return unsupported()
  }
  onDidChangeState: IDebugService['onDidChangeState'] = Event.None
  onDidNewSession: IDebugService['onDidNewSession'] = Event.None
  onWillNewSession: IDebugService['onWillNewSession'] = Event.None
  onDidEndSession: IDebugService['onDidEndSession'] = Event.None
  @Unsupported
  getConfigurationManager: IDebugService['getConfigurationManager'] = unsupported
  getAdapterManager: IDebugService['getAdapterManager'] = () => new FakeAdapterManager()
  @Unsupported
  focusStackFrame: IDebugService['focusStackFrame'] = unsupported
  @Unsupported
  canSetBreakpointsIn: IDebugService['canSetBreakpointsIn'] = unsupported
  @Unsupported
  addBreakpoints: IDebugService['addBreakpoints'] = unsupported
  @Unsupported
  updateBreakpoints: IDebugService['updateBreakpoints'] = unsupported
  @Unsupported
  enableOrDisableBreakpoints: IDebugService['enableOrDisableBreakpoints'] = unsupported
  @Unsupported
  setBreakpointsActivated: IDebugService['setBreakpointsActivated'] = unsupported
  @Unsupported
  removeBreakpoints: IDebugService['removeBreakpoints'] = unsupported
  @Unsupported
  addFunctionBreakpoint: IDebugService['addFunctionBreakpoint'] = unsupported
  @Unsupported
  updateFunctionBreakpoint: IDebugService['updateFunctionBreakpoint'] = unsupported
  @Unsupported
  removeFunctionBreakpoints: IDebugService['removeFunctionBreakpoints'] = unsupported
  @Unsupported
  addDataBreakpoint: IDebugService['addDataBreakpoint'] = unsupported
  @Unsupported
  removeDataBreakpoints: IDebugService['removeDataBreakpoints'] = unsupported
  @Unsupported
  addInstructionBreakpoint: IDebugService['addInstructionBreakpoint'] = unsupported
  @Unsupported
  removeInstructionBreakpoints: IDebugService['removeInstructionBreakpoints'] = unsupported
  @Unsupported
  setExceptionBreakpointCondition: IDebugService['setExceptionBreakpointCondition'] = unsupported
  @Unsupported
  setExceptionBreakpointsForSession: IDebugService['setExceptionBreakpointsForSession'] =
    unsupported
  @Unsupported
  sendAllBreakpoints: IDebugService['sendAllBreakpoints'] = unsupported
  @Unsupported
  addWatchExpression: IDebugService['addWatchExpression'] = unsupported
  @Unsupported
  renameWatchExpression: IDebugService['renameWatchExpression'] = unsupported
  @Unsupported
  moveWatchExpression: IDebugService['moveWatchExpression'] = unsupported
  @Unsupported
  removeWatchExpressions: IDebugService['removeWatchExpressions'] = unsupported
  @Unsupported
  startDebugging: IDebugService['startDebugging'] = unsupported
  @Unsupported
  restartSession: IDebugService['restartSession'] = unsupported
  @Unsupported
  stopSession: IDebugService['stopSession'] = unsupported
  @Unsupported
  sourceIsNotAvailable: IDebugService['sourceIsNotAvailable'] = unsupported
  getModel: IDebugService['getModel'] = () => debugModel
  getViewModel: IDebugService['getViewModel'] = () => new FakeViewModel()
  @Unsupported
  runTo: IDebugService['runTo'] = unsupported
}
registerSingleton(IDebugService, DebugService, InstantiationType.Eager)
class RequestService implements IRequestService {
  _serviceBrand: undefined
  @Unsupported
  lookupAuthorization: IRequestService['lookupAuthorization'] = unsupported
  @Unsupported
  lookupKerberosAuthorization: IRequestService['lookupKerberosAuthorization'] = unsupported
  @Unsupported
  request: IRequestService['request'] = unsupported
  @Unsupported
  resolveProxy: IRequestService['resolveProxy'] = unsupported
  @Unsupported
  loadCertificates: IRequestService['loadCertificates'] = unsupported
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
    unsupported
  requestOpenFilesTrust: IWorkspaceTrustRequestService['requestOpenFilesTrust'] = async () =>
    WorkspaceTrustUriResponse.Open
  @Unsupported
  cancelWorkspaceTrustRequest: IWorkspaceTrustRequestService['cancelWorkspaceTrustRequest'] =
    unsupported
  @Unsupported
  completeWorkspaceTrustRequest: IWorkspaceTrustRequestService['completeWorkspaceTrustRequest'] =
    unsupported
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
  getViewContainerActivities: IActivityService['getViewContainerActivities'] = unsupported
  @Unsupported
  getActivity: IActivityService['getActivity'] = unsupported
  showViewContainerActivity: IActivityService['showViewContainerActivity'] = () => Disposable.None
  showViewActivity: IActivityService['showViewActivity'] = () => Disposable.None
  showAccountsActivity: IActivityService['showAccountsActivity'] = () => Disposable.None
  showGlobalActivity: IActivityService['showGlobalActivity'] = () => Disposable.None
}
registerSingleton(IActivityService, ActivityService, InstantiationType.Eager)
class ExtensionHostDebugService implements IExtensionHostDebugService {
  _serviceBrand: undefined
  @Unsupported
  reload: IExtensionHostDebugService['reload'] = unsupported
  onReload: IExtensionHostDebugService['onReload'] = Event.None
  @Unsupported
  close: IExtensionHostDebugService['close'] = unsupported
  onClose: IExtensionHostDebugService['onClose'] = Event.None
  @Unsupported
  attachSession: IExtensionHostDebugService['attachSession'] = unsupported
  onAttachSession: IExtensionHostDebugService['onAttachSession'] = Event.None
  @Unsupported
  terminateSession: IExtensionHostDebugService['terminateSession'] = unsupported
  onTerminateSession: IExtensionHostDebugService['onTerminateSession'] = Event.None
  @Unsupported
  openExtensionDevelopmentHostWindow: IExtensionHostDebugService['openExtensionDevelopmentHostWindow'] =
    unsupported

  @Unsupported
  attachToCurrentWindowRenderer: IExtensionHostDebugService['attachToCurrentWindowRenderer'] =
    unsupported
}
registerSingleton(IExtensionHostDebugService, ExtensionHostDebugService, InstantiationType.Eager)
class ViewsService implements IViewsService {
  _serviceBrand: undefined
  getFocusedView: IViewsService['getFocusedView'] = () => null
  isViewContainerActive: IViewsService['isViewContainerActive'] = () => false
  @Unsupported
  getFocusedViewName: IViewsService['getFocusedViewName'] = unsupported
  onDidChangeFocusedView: IViewsService['onDidChangeFocusedView'] = Event.None
  onDidChangeViewContainerVisibility: IViewsService['onDidChangeViewContainerVisibility'] =
    Event.None
  isViewContainerVisible: IViewsService['isViewContainerVisible'] = () => false
  @Unsupported
  openViewContainer: IViewsService['openViewContainer'] = unsupported
  @Unsupported
  closeViewContainer: IViewsService['closeViewContainer'] = unsupported
  @Unsupported
  getVisibleViewContainer: IViewsService['getVisibleViewContainer'] = unsupported
  getActiveViewPaneContainerWithId: IViewsService['getActiveViewPaneContainerWithId'] = () => null
  onDidChangeViewVisibility: IViewsService['onDidChangeViewVisibility'] = Event.None
  isViewVisible: IViewsService['isViewVisible'] = () => false
  openView: IViewsService['openView'] = async () => null
  @Unsupported
  closeView: IViewsService['closeView'] = unsupported
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
    unsupported
  getDefaultViewContainerLocation: IViewDescriptorService['getDefaultViewContainerLocation'] = () =>
    null
  getViewContainerLocation: IViewDescriptorService['getViewContainerLocation'] = () => null
  @Unsupported
  getViewContainersByLocation: IViewDescriptorService['getViewContainersByLocation'] = unsupported
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
  moveViewContainerToLocation: IViewDescriptorService['moveViewContainerToLocation'] = unsupported
  @Unsupported
  getViewContainerBadgeEnablementState: IViewDescriptorService['getViewContainerBadgeEnablementState'] =
    unsupported
  @Unsupported
  setViewContainerBadgeEnablementState: IViewDescriptorService['setViewContainerBadgeEnablementState'] =
    unsupported
  getViewDescriptorById: IViewDescriptorService['getViewDescriptorById'] = () => null
  getViewContainerByViewId: IViewDescriptorService['getViewContainerByViewId'] = () => null
  getDefaultContainerById: IViewDescriptorService['getDefaultContainerById'] = () => null
  getViewLocationById: IViewDescriptorService['getViewLocationById'] = () => null
  onDidChangeContainer: IViewDescriptorService['onDidChangeContainer'] = Event.None
  @Unsupported
  moveViewsToContainer: IViewDescriptorService['moveViewsToContainer'] = unsupported
  onDidChangeLocation: IViewDescriptorService['onDidChangeLocation'] = Event.None
  moveViewToLocation: IViewDescriptorService['moveViewToLocation'] = () => null
  reset: IViewDescriptorService['reset'] = () => null
}
registerSingleton(IViewDescriptorService, ViewDescriptorService, InstantiationType.Eager)
class HistoryService implements IHistoryService {
  _serviceBrand: undefined
  @Unsupported
  goForward: IHistoryService['goForward'] = unsupported
  @Unsupported
  goBack: IHistoryService['goBack'] = unsupported
  @Unsupported
  goPrevious: IHistoryService['goPrevious'] = unsupported
  @Unsupported
  goLast: IHistoryService['goLast'] = unsupported
  @Unsupported
  reopenLastClosedEditor: IHistoryService['reopenLastClosedEditor'] = unsupported
  getHistory: IHistoryService['getHistory'] = () => []
  @Unsupported
  removeFromHistory: IHistoryService['removeFromHistory'] = unsupported
  getLastActiveWorkspaceRoot: IHistoryService['getLastActiveWorkspaceRoot'] = () => undefined
  getLastActiveFile: IHistoryService['getLastActiveFile'] = () => undefined
  @Unsupported
  openNextRecentlyUsedEditor: IHistoryService['openNextRecentlyUsedEditor'] = unsupported
  @Unsupported
  openPreviouslyUsedEditor: IHistoryService['openPreviouslyUsedEditor'] = unsupported
  @Unsupported
  clear: IHistoryService['clear'] = unsupported
  @Unsupported
  clearRecentlyOpened: IHistoryService['clearRecentlyOpened'] = unsupported
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
  configureAction: ITaskService['configureAction'] = unsupported
  @Unsupported
  rerun: ITaskService['rerun'] = unsupported
  @Unsupported
  run: ITaskService['run'] = unsupported
  inTerminal: ITaskService['inTerminal'] = () => false
  getActiveTasks: ITaskService['getActiveTasks'] = async () => []
  @Unsupported
  getBusyTasks: ITaskService['getBusyTasks'] = unsupported
  @Unsupported
  terminate: ITaskService['terminate'] = unsupported
  @Unsupported
  tasks: ITaskService['tasks'] = unsupported
  @Unsupported
  taskTypes: ITaskService['taskTypes'] = unsupported
  @Unsupported
  getWorkspaceTasks: ITaskService['getWorkspaceTasks'] = unsupported
  @Unsupported
  getSavedTasks: ITaskService['getSavedTasks'] = unsupported
  @Unsupported
  removeRecentlyUsedTask: ITaskService['removeRecentlyUsedTask'] = unsupported
  @Unsupported
  getTask: ITaskService['getTask'] = unsupported
  @Unsupported
  tryResolveTask: ITaskService['tryResolveTask'] = unsupported
  @Unsupported
  createSorter: ITaskService['createSorter'] = unsupported
  @Unsupported
  getTaskDescription: ITaskService['getTaskDescription'] = unsupported
  @Unsupported
  customize: ITaskService['customize'] = unsupported
  @Unsupported
  openConfig: ITaskService['openConfig'] = unsupported
  @Unsupported
  registerTaskProvider: ITaskService['registerTaskProvider'] = unsupported
  registerTaskSystem: ITaskService['registerTaskSystem'] = () => {}
  onDidChangeTaskSystemInfo: ITaskService['onDidChangeTaskSystemInfo'] = Event.None
  hasTaskSystemInfo: ITaskService['hasTaskSystemInfo'] = false
  registerSupportedExecutions: ITaskService['registerSupportedExecutions'] = () => {}
  @Unsupported
  extensionCallbackTaskComplete: ITaskService['extensionCallbackTaskComplete'] = unsupported
  isReconnected: ITaskService['isReconnected'] = false
  onDidReconnectToTasks: ITaskService['onDidReconnectToTasks'] = Event.None

  getTerminalsForTasks: ITaskService['getTerminalsForTasks'] = () => undefined
  getTaskProblems: ITaskService['getTaskProblems'] = () => undefined
}
registerSingleton(ITaskService, TaskService, InstantiationType.Eager)
class ConfigurationResolverService implements IConfigurationResolverService {
  _serviceBrand: undefined
  resolvableVariables: IConfigurationResolverService['resolvableVariables'] = new Set<string>()
  @Unsupported
  resolveWithEnvironment: IConfigurationResolverService['resolveWithEnvironment'] = unsupported
  @Unsupported
  resolveAsync: IConfigurationResolverService['resolveAsync'] = unsupported
  @Unsupported
  resolveWithInteractionReplace: IConfigurationResolverService['resolveWithInteractionReplace'] =
    unsupported
  @Unsupported
  resolveWithInteraction: IConfigurationResolverService['resolveWithInteraction'] = unsupported
  @Unsupported
  contributeVariable: IConfigurationResolverService['contributeVariable'] = unsupported
}
registerSingleton(
  IConfigurationResolverService,
  ConfigurationResolverService,
  InstantiationType.Eager
)
class RemoteAgentService implements IRemoteAgentService {
  _serviceBrand: undefined
  @Unsupported
  endConnection: IRemoteAgentService['endConnection'] = unsupported
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
  aiTextSearch: ISearchService['aiTextSearch'] = unsupported
  @Unsupported
  textSearchSplitSyncAsync: ISearchService['textSearchSplitSyncAsync'] = unsupported
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
  registerSearchResultProvider: ISearchService['registerSearchResultProvider'] = unsupported
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
  addFolders: IWorkspaceEditingService['addFolders'] = unsupported
  @Unsupported
  removeFolders: IWorkspaceEditingService['removeFolders'] = unsupported
  @Unsupported
  updateFolders: IWorkspaceEditingService['updateFolders'] = unsupported
  @Unsupported
  enterWorkspace: IWorkspaceEditingService['enterWorkspace'] = unsupported
  @Unsupported
  createAndEnterWorkspace: IWorkspaceEditingService['createAndEnterWorkspace'] = unsupported
  @Unsupported
  saveAndEnterWorkspace: IWorkspaceEditingService['saveAndEnterWorkspace'] = unsupported
  @Unsupported
  copyWorkspaceSettings: IWorkspaceEditingService['copyWorkspaceSettings'] = unsupported
  @Unsupported
  pickNewWorkspacePath: IWorkspaceEditingService['pickNewWorkspacePath'] = unsupported
}
registerSingleton(IWorkspaceEditingService, WorkspaceEditingService, InstantiationType.Eager)
class TimerService implements ITimerService {
  _serviceBrand: undefined
  @Unsupported
  getStartTime: ITimerService['getStartTime'] = unsupported
  @Unsupported
  whenReady: ITimerService['whenReady'] = unsupported
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
  getPerformanceMarks: ITimerService['getPerformanceMarks'] = unsupported
  @Unsupported
  getDuration: ITimerService['getDuration'] = unsupported
}
registerSingleton(ITimerService, TimerService, InstantiationType.Eager)
class ExtensionsWorkbenchService implements IExtensionsWorkbenchService {
  _serviceBrand: undefined
  @Unsupported
  downloadVSIX: IExtensionsWorkbenchService['downloadVSIX'] = unsupported
  @Unsupported
  updateAutoUpdateForAllExtensions: IExtensionsWorkbenchService['updateAutoUpdateForAllExtensions'] =
    unsupported
  @Unsupported
  openSearch: IExtensionsWorkbenchService['openSearch'] = unsupported
  getExtensionRuntimeStatus: IExtensionsWorkbenchService['getExtensionRuntimeStatus'] = () =>
    undefined
  onDidChangeExtensionsNotification: IExtensionsWorkbenchService['onDidChangeExtensionsNotification'] =
    Event.None
  getExtensionsNotification: IExtensionsWorkbenchService['getExtensionsNotification'] = () =>
    undefined
  shouldRequireConsentToUpdate: IExtensionsWorkbenchService['shouldRequireConsentToUpdate'] =
    async () => undefined
  @Unsupported
  getResourceExtensions: IExtensionsWorkbenchService['getResourceExtensions'] = unsupported
  @Unsupported
  updateRunningExtensions: IExtensionsWorkbenchService['updateRunningExtensions'] = unsupported
  @Unsupported
  togglePreRelease: IExtensionsWorkbenchService['togglePreRelease'] = unsupported
  @Unsupported
  isAutoUpdateEnabledFor: IExtensionsWorkbenchService['isAutoUpdateEnabledFor'] = unsupported
  @Unsupported
  updateAutoUpdateEnablementFor: IExtensionsWorkbenchService['updateAutoUpdateEnablementFor'] =
    unsupported
  @Unsupported
  getAutoUpdateValue: IExtensionsWorkbenchService['getAutoUpdateValue'] = unsupported
  @Unsupported
  updateAll: IExtensionsWorkbenchService['updateAll'] = unsupported
  @Unsupported
  toggleApplyExtensionToAllProfiles: IExtensionsWorkbenchService['toggleApplyExtensionToAllProfiles'] =
    unsupported
  whenInitialized: IExtensionsWorkbenchService['whenInitialized'] = Promise.resolve()
  onChange: IExtensionsWorkbenchService['onChange'] = Event.None
  onReset: IExtensionsWorkbenchService['onReset'] = Event.None
  local: IExtensionsWorkbenchService['local'] = []
  installed: IExtensionsWorkbenchService['installed'] = []
  outdated: IExtensionsWorkbenchService['outdated'] = []
  @Unsupported
  queryLocal: IExtensionsWorkbenchService['queryLocal'] = unsupported
  @Unsupported
  queryGallery: IExtensionsWorkbenchService['queryGallery'] = unsupported
  @Unsupported
  getExtensions: IExtensionsWorkbenchService['getExtensions'] = unsupported
  @Unsupported
  canInstall: IExtensionsWorkbenchService['canInstall'] = unsupported
  @Unsupported
  install: IExtensionsWorkbenchService['install'] = unsupported
  @Unsupported
  installInServer: IExtensionsWorkbenchService['installInServer'] = unsupported
  @Unsupported
  uninstall: IExtensionsWorkbenchService['uninstall'] = unsupported
  @Unsupported
  canSetLanguage: IExtensionsWorkbenchService['canSetLanguage'] = unsupported
  @Unsupported
  setLanguage: IExtensionsWorkbenchService['setLanguage'] = unsupported
  @Unsupported
  setEnablement: IExtensionsWorkbenchService['setEnablement'] = unsupported
  @Unsupported
  open: IExtensionsWorkbenchService['open'] = unsupported
  @Unsupported
  checkForUpdates: IExtensionsWorkbenchService['checkForUpdates'] = unsupported
  @Unsupported
  isExtensionIgnoredToSync: IExtensionsWorkbenchService['isExtensionIgnoredToSync'] = unsupported
  @Unsupported
  toggleExtensionIgnoredToSync: IExtensionsWorkbenchService['toggleExtensionIgnoredToSync'] =
    unsupported
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
    unsupported
  @Unsupported
  getExtensionInstallLocation: IExtensionManagementServerService['getExtensionInstallLocation'] =
    unsupported
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
  turnOn: IUserDataAutoSyncService['turnOn'] = unsupported
  @Unsupported
  turnOff: IUserDataAutoSyncService['turnOff'] = unsupported
  @Unsupported
  triggerSync: IUserDataAutoSyncService['triggerSync'] = unsupported
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
    unsupported
  @Unsupported
  updateSynchronizedExtensions: IIgnoredExtensionsManagementService['updateSynchronizedExtensions'] =
    unsupported
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
    unsupported
  @Unsupported
  promptWorkspaceRecommendations: IExtensionRecommendationNotificationService['promptWorkspaceRecommendations'] =
    unsupported
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
  addExtension: IWebExtensionsScannerService['addExtension'] = unsupported
  @Unsupported
  addExtensionFromGallery: IWebExtensionsScannerService['addExtensionFromGallery'] = unsupported
  removeExtension: IWebExtensionsScannerService['removeExtension'] = async () => {}
  copyExtensions: IWebExtensionsScannerService['copyExtensions'] = async () => {}
  @Unsupported
  updateMetadata: IWebExtensionsScannerService['updateMetadata'] = unsupported
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
  scanAllExtensions: IExtensionsScannerService['scanAllExtensions'] = async () => []
  @Unsupported
  scanSystemExtensions: IExtensionsScannerService['scanSystemExtensions'] = async () => []
  @Unsupported
  scanUserExtensions: IExtensionsScannerService['scanUserExtensions'] = async () => []
  @Unsupported
  scanExtensionsUnderDevelopment: IExtensionsScannerService['scanExtensionsUnderDevelopment'] =
    unsupported
  @Unsupported
  scanExistingExtension: IExtensionsScannerService['scanExistingExtension'] = unsupported
  @Unsupported
  scanOneOrMultipleExtensions: IExtensionsScannerService['scanOneOrMultipleExtensions'] =
    unsupported
  @Unsupported
  scanMultipleExtensions: IExtensionsScannerService['scanMultipleExtensions'] = unsupported
  @Unsupported
  scanAllUserExtensions: IExtensionsScannerService['scanAllUserExtensions'] = unsupported
  @Unsupported
  initializeDefaultProfileExtensions: IExtensionsScannerService['initializeDefaultProfileExtensions'] =
    unsupported
  @Unsupported
  updateManifestMetadata: IExtensionsScannerService['updateManifestMetadata'] = unsupported
}
registerSingleton(IExtensionsScannerService, ExtensionsScannerService, InstantiationType.Eager)
class ExtensionsProfileScannerService implements IExtensionsProfileScannerService {
  _serviceBrand: undefined
  onAddExtensions: IExtensionsProfileScannerService['onAddExtensions'] = Event.None
  onDidAddExtensions: IExtensionsProfileScannerService['onDidAddExtensions'] = Event.None
  onRemoveExtensions: IExtensionsProfileScannerService['onRemoveExtensions'] = Event.None
  onDidRemoveExtensions: IExtensionsProfileScannerService['onDidRemoveExtensions'] = Event.None
  @Unsupported
  scanProfileExtensions: IExtensionsProfileScannerService['scanProfileExtensions'] = unsupported
  @Unsupported
  addExtensionsToProfile: IExtensionsProfileScannerService['addExtensionsToProfile'] = unsupported
  @Unsupported
  updateMetadata: IExtensionsProfileScannerService['updateMetadata'] = unsupported
  @Unsupported
  removeExtensionsFromProfile: IExtensionsProfileScannerService['removeExtensionsFromProfile'] =
    unsupported
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
    unsupported
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
  getExtensionsConfigs: IWorkspaceExtensionsConfigService['getExtensionsConfigs'] = unsupported
  @Unsupported
  getRecommendations: IWorkspaceExtensionsConfigService['getRecommendations'] = unsupported
  @Unsupported
  getUnwantedRecommendations: IWorkspaceExtensionsConfigService['getUnwantedRecommendations'] =
    unsupported
  @Unsupported
  toggleRecommendation: IWorkspaceExtensionsConfigService['toggleRecommendation'] = unsupported
  @Unsupported
  toggleUnwantedRecommendation: IWorkspaceExtensionsConfigService['toggleUnwantedRecommendation'] =
    unsupported
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
  setEnablement: IWorkbenchExtensionEnablementService['setEnablement'] = unsupported
  @Unsupported
  updateExtensionsEnablementsWhenWorkspaceTrustChanges: IWorkbenchExtensionEnablementService['updateExtensionsEnablementsWhenWorkspaceTrustChanges'] =
    unsupported
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
  openTunnel: ITunnelService['openTunnel'] = unsupported
  getExistingTunnel: ITunnelService['getExistingTunnel'] = async () => undefined
  @Unsupported
  setEnvironmentTunnel: ITunnelService['setEnvironmentTunnel'] = unsupported
  @Unsupported
  closeTunnel: ITunnelService['closeTunnel'] = unsupported
  @Unsupported
  setTunnelProvider: ITunnelService['setTunnelProvider'] = unsupported
  @Unsupported
  setTunnelFeatures: ITunnelService['setTunnelFeatures'] = unsupported
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
  disableAutoSave: IFilesConfigurationService['disableAutoSave'] = unsupported
  @Unsupported
  enableAutoSaveAfterShortDelay: IFilesConfigurationService['enableAutoSaveAfterShortDelay'] =
    unsupported
  onDidChangeReadonly: IFilesConfigurationService['onDidChangeReadonly'] = Event.None
  onDidChangeFilesAssociation: IFilesConfigurationService['onDidChangeFilesAssociation'] =
    Event.None
  @Unsupported
  getAutoSaveConfiguration: IFilesConfigurationService['getAutoSaveConfiguration'] = unsupported
  @Unsupported
  getAutoSaveMode: IFilesConfigurationService['getAutoSaveMode'] = unsupported
  @Unsupported
  toggleAutoSave: IFilesConfigurationService['toggleAutoSave'] = unsupported
  @Unsupported
  isReadonly: IFilesConfigurationService['isReadonly'] = unsupported
  @Unsupported
  updateReadonly: IFilesConfigurationService['updateReadonly'] = unsupported
  isHotExitEnabled: IFilesConfigurationService['isHotExitEnabled'] = true
  hotExitConfiguration: IFilesConfigurationService['hotExitConfiguration'] = undefined
  @Unsupported
  preventSaveConflicts: IFilesConfigurationService['preventSaveConflicts'] = unsupported
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
  create: IUntitledTextEditorService['create'] = unsupported
  get: IUntitledTextEditorService['get'] = () => undefined
  getValue: IUntitledTextEditorService['getValue'] = () => undefined
  @Unsupported
  resolve: IUntitledTextEditorService['resolve'] = unsupported
}
registerSingleton(IUntitledTextEditorService, UntitledTextEditorService, InstantiationType.Eager)
class WorkingCopyBackupService implements IWorkingCopyBackupService {
  _serviceBrand: undefined
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
  registerDecorationsProvider: IDecorationsService['registerDecorationsProvider'] = unsupported
  getDecoration: IDecorationsService['getDecoration'] = () => undefined
}
registerSingleton(IDecorationsService, DecorationsService, InstantiationType.Eager)
class ElevatedFileService implements IElevatedFileService {
  _serviceBrand: undefined
  isSupported: IElevatedFileService['isSupported'] = () => false
  @Unsupported
  writeFileElevated: IElevatedFileService['writeFileElevated'] = unsupported
}
registerSingleton(IElevatedFileService, ElevatedFileService, InstantiationType.Eager)
class FileDialogService implements IFileDialogService {
  @Unsupported
  preferredHome: IFileDialogService['preferredHome'] = unsupported
  _serviceBrand: undefined
  @Unsupported
  defaultFilePath: IFileDialogService['defaultFilePath'] = unsupported
  @Unsupported
  defaultFolderPath: IFileDialogService['defaultFolderPath'] = unsupported
  @Unsupported
  defaultWorkspacePath: IFileDialogService['defaultWorkspacePath'] = unsupported
  @Unsupported
  pickFileFolderAndOpen: IFileDialogService['pickFileFolderAndOpen'] = unsupported
  @Unsupported
  pickFileAndOpen: IFileDialogService['pickFileAndOpen'] = unsupported
  @Unsupported
  pickFolderAndOpen: IFileDialogService['pickFolderAndOpen'] = unsupported
  @Unsupported
  pickWorkspaceAndOpen: IFileDialogService['pickWorkspaceAndOpen'] = unsupported
  @Unsupported
  pickFileToSave: IFileDialogService['pickFileToSave'] = unsupported
  @Unsupported
  showSaveDialog: IFileDialogService['showSaveDialog'] = unsupported
  @Unsupported
  showSaveConfirm: IFileDialogService['showSaveConfirm'] = unsupported
  @Unsupported
  showOpenDialog: IFileDialogService['showOpenDialog'] = unsupported
}
registerSingleton(IFileDialogService, FileDialogService, InstantiationType.Eager)
class JSONEditingService implements IJSONEditingService {
  _serviceBrand: undefined
  @Unsupported
  write: IJSONEditingService['write'] = unsupported
}
registerSingleton(IJSONEditingService, JSONEditingService, InstantiationType.Delayed)
class WorkspacesService implements IWorkspacesService {
  _serviceBrand: undefined
  @Unsupported
  enterWorkspace: IWorkspacesService['enterWorkspace'] = unsupported
  @Unsupported
  createUntitledWorkspace: IWorkspacesService['createUntitledWorkspace'] = unsupported
  @Unsupported
  deleteUntitledWorkspace: IWorkspacesService['deleteUntitledWorkspace'] = unsupported
  @Unsupported
  getWorkspaceIdentifier: IWorkspacesService['getWorkspaceIdentifier'] = unsupported
  onDidChangeRecentlyOpened: IWorkspacesService['onDidChangeRecentlyOpened'] = Event.None
  @Unsupported
  addRecentlyOpened: IWorkspacesService['addRecentlyOpened'] = unsupported
  @Unsupported
  removeRecentlyOpened: IWorkspacesService['removeRecentlyOpened'] = unsupported
  @Unsupported
  clearRecentlyOpened: IWorkspacesService['clearRecentlyOpened'] = unsupported
  @Unsupported
  getRecentlyOpened: IWorkspacesService['getRecentlyOpened'] = unsupported
  @Unsupported
  getDirtyWorkspaces: IWorkspacesService['getDirtyWorkspaces'] = unsupported
}
registerSingleton(IWorkspacesService, WorkspacesService, InstantiationType.Delayed)
class TextEditorService implements ITextEditorService {
  _serviceBrand: undefined
  @Unsupported
  createTextEditor: ITextEditorService['createTextEditor'] = unsupported
  @Unsupported
  resolveTextEditor: ITextEditorService['resolveTextEditor'] = unsupported
}
registerSingleton(ITextEditorService, TextEditorService, InstantiationType.Eager)
class EditorResolverService implements IEditorResolverService {
  @Unsupported
  getAllUserAssociations: IEditorResolverService['getAllUserAssociations'] = unsupported
  _serviceBrand: undefined
  @Unsupported
  getAssociationsForResource: IEditorResolverService['getAssociationsForResource'] = unsupported
  @Unsupported
  updateUserAssociations: IEditorResolverService['updateUserAssociations'] = unsupported
  onDidChangeEditorRegistrations: IEditorResolverService['onDidChangeEditorRegistrations'] =
    Event.None
  @Unsupported
  bufferChangeEvents: IEditorResolverService['bufferChangeEvents'] = unsupported
  registerEditor: IEditorResolverService['registerEditor'] = () => {
    // do nothing
    return {
      dispose: () => {}
    }
  }
  @Unsupported
  resolveEditor: IEditorResolverService['resolveEditor'] = unsupported
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
  registerCompoundLogChannel: IOutputService['registerCompoundLogChannel'] = unsupported
  @Unsupported
  saveOutputAs: IOutputService['saveOutputAs'] = unsupported
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
  readExtensionResource: IExtensionResourceLoaderService['readExtensionResource'] = unsupported
  supportsExtensionGalleryResources: IExtensionResourceLoaderService['supportsExtensionGalleryResources'] =
    async () => false
  isExtensionGalleryResource: IExtensionResourceLoaderService['isExtensionGalleryResource'] =
    async () => false
  @Unsupported
  getExtensionGalleryResourceURL: IExtensionResourceLoaderService['getExtensionGalleryResourceURL'] =
    unsupported
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
  getContext: IExplorerService['getContext'] = unsupported
  @Unsupported
  hasViewFocus: IExplorerService['hasViewFocus'] = unsupported
  @Unsupported
  setEditable: IExplorerService['setEditable'] = unsupported
  @Unsupported
  getEditable: IExplorerService['getEditable'] = unsupported
  @Unsupported
  getEditableData: IExplorerService['getEditableData'] = unsupported
  @Unsupported
  isEditable: IExplorerService['isEditable'] = unsupported
  @Unsupported
  findClosest: IExplorerService['findClosest'] = unsupported
  @Unsupported
  findClosestRoot: IExplorerService['findClosestRoot'] = unsupported
  @Unsupported
  refresh: IExplorerService['refresh'] = unsupported
  @Unsupported
  setToCopy: IExplorerService['setToCopy'] = unsupported
  @Unsupported
  isCut: IExplorerService['isCut'] = unsupported
  @Unsupported
  applyBulkEdit: IExplorerService['applyBulkEdit'] = unsupported
  @Unsupported
  select: IExplorerService['select'] = unsupported
  @Unsupported
  registerView: IExplorerService['registerView'] = unsupported
}
registerSingleton(IExplorerService, ExplorerService, InstantiationType.Delayed)
class ExtensionStorageService implements IExtensionStorageService {
  _serviceBrand: undefined
  getExtensionState: IExtensionStorageService['getExtensionState'] = () => undefined
  getExtensionStateRaw: IExtensionStorageService['getExtensionStateRaw'] = () => undefined
  @Unsupported
  setExtensionState: IExtensionStorageService['setExtensionState'] = unsupported
  onDidChangeExtensionStorageToSync: IExtensionStorageService['onDidChangeExtensionStorageToSync'] =
    Event.None
  @Unsupported
  setKeysForSync: IExtensionStorageService['setKeysForSync'] = unsupported
  getKeysForSync: IExtensionStorageService['getKeysForSync'] = () => undefined
  @Unsupported
  addToMigrationList: IExtensionStorageService['addToMigrationList'] = unsupported
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
  removeDragOperationTransfer: ITreeViewsDnDService['removeDragOperationTransfer'] = unsupported
  @Unsupported
  addDragOperationTransfer: ITreeViewsDnDService['addDragOperationTransfer'] = unsupported
}
registerSingleton(ITreeViewsDnDService, TreeViewsDnDService, InstantiationType.Delayed)
class BreadcrumbsService implements IBreadcrumbsService {
  _serviceBrand: undefined
  @Unsupported
  register: IBreadcrumbsService['register'] = unsupported
  getWidget: IBreadcrumbsService['getWidget'] = () => undefined
}
registerSingleton(IBreadcrumbsService, BreadcrumbsService, InstantiationType.Eager)
class OutlineService implements IOutlineService {
  _serviceBrand: undefined
  onDidChange: IOutlineService['onDidChange'] = Event.None
  canCreateOutline: IOutlineService['canCreateOutline'] = () => false
  createOutline: IOutlineService['createOutline'] = async () => undefined
  @Unsupported
  registerOutlineCreator: IOutlineService['registerOutlineCreator'] = unsupported
}
registerSingleton(IOutlineService, OutlineService, InstantiationType.Eager)
class UpdateService implements IUpdateService {
  _serviceBrand: undefined
  onStateChange: IUpdateService['onStateChange'] = Event.None
  state: IUpdateService['state'] = State.Uninitialized
  @Unsupported
  checkForUpdates: IUpdateService['checkForUpdates'] = unsupported
  @Unsupported
  downloadUpdate: IUpdateService['downloadUpdate'] = unsupported
  @Unsupported
  applyUpdate: IUpdateService['applyUpdate'] = unsupported
  @Unsupported
  quitAndInstall: IUpdateService['quitAndInstall'] = unsupported
  isLatestVersion: IUpdateService['isLatestVersion'] = async () => true
  @Unsupported
  _applySpecificUpdate: IUpdateService['_applySpecificUpdate'] = unsupported
}
registerSingleton(IUpdateService, UpdateService, InstantiationType.Eager)
class StatusbarService implements IStatusbarService {
  _serviceBrand: undefined
  @Unsupported
  overrideEntry: IStatusbarService['overrideEntry'] = unsupported
  @Unsupported
  getPart: IStatusbarService['getPart'] = unsupported
  @Unsupported
  createAuxiliaryStatusbarPart: IStatusbarService['createAuxiliaryStatusbarPart'] = unsupported
  @Unsupported
  createScoped: IStatusbarService['createScoped'] = unsupported
  @Unsupported
  dispose: IStatusbarService['dispose'] = unsupported
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
  query: IExtensionGalleryService['query'] = unsupported
  @Unsupported
  getExtensions: IExtensionGalleryService['getExtensions'] = unsupported
  @Unsupported
  isExtensionCompatible: IExtensionGalleryService['isExtensionCompatible'] = unsupported
  @Unsupported
  getCompatibleExtension: IExtensionGalleryService['getCompatibleExtension'] = unsupported
  @Unsupported
  getAllCompatibleVersions: IExtensionGalleryService['getAllCompatibleVersions'] = unsupported
  @Unsupported
  download: IExtensionGalleryService['download'] = unsupported
  @Unsupported
  downloadSignatureArchive: IExtensionGalleryService['downloadSignatureArchive'] = unsupported
  @Unsupported
  reportStatistic: IExtensionGalleryService['reportStatistic'] = unsupported
  @Unsupported
  getReadme: IExtensionGalleryService['getReadme'] = unsupported
  @Unsupported
  getManifest: IExtensionGalleryService['getManifest'] = unsupported
  @Unsupported
  getChangelog: IExtensionGalleryService['getChangelog'] = unsupported
  @Unsupported
  getCoreTranslation: IExtensionGalleryService['getCoreTranslation'] = unsupported
  @Unsupported
  getExtensionsControlManifest: IExtensionGalleryService['getExtensionsControlManifest'] =
    unsupported
  getAllVersions: IExtensionGalleryService['getAllVersions'] = async () => []
}
registerSingleton(IExtensionGalleryService, ExtensionGalleryService, InstantiationType.Eager)
class TerminalService implements ITerminalService {
  _serviceBrand: undefined
  onAnyInstanceAddedCapabilityType: ITerminalService['onAnyInstanceAddedCapabilityType'] =
    Event.None
  onAnyInstanceShellTypeChanged: ITerminalService['onAnyInstanceShellTypeChanged'] = Event.None
  @Unsupported
  revealTerminal: ITerminalService['revealTerminal'] = unsupported
  @Unsupported
  focusInstance: ITerminalService['focusInstance'] = unsupported
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
  moveIntoNewEditor: ITerminalService['moveIntoNewEditor'] = unsupported
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
  createDetachedTerminal: ITerminalService['createDetachedTerminal'] = unsupported
  whenConnected: ITerminalService['whenConnected'] = Promise.resolve()
  restoredGroupCount: ITerminalService['restoredGroupCount'] = 0
  instances: ITerminalService['instances'] = []
  @Unsupported
  get configHelper() {
    return unsupported()
  }
  @Unsupported
  revealActiveTerminal: ITerminalService['revealActiveTerminal'] = unsupported
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
  createTerminal: ITerminalService['createTerminal'] = unsupported
  @Unsupported
  getInstanceFromId: ITerminalService['getInstanceFromId'] = unsupported
  @Unsupported
  getInstanceFromIndex: ITerminalService['getInstanceFromIndex'] = unsupported
  getReconnectedTerminals: ITerminalService['getReconnectedTerminals'] = () => undefined
  @Unsupported
  getActiveOrCreateInstance: ITerminalService['getActiveOrCreateInstance'] = unsupported
  @Unsupported
  moveToEditor: ITerminalService['moveToEditor'] = unsupported
  @Unsupported
  moveToTerminalView: ITerminalService['moveToTerminalView'] = unsupported
  @Unsupported
  getPrimaryBackend: ITerminalService['getPrimaryBackend'] = unsupported
  @Unsupported
  refreshActiveGroup: ITerminalService['refreshActiveGroup'] = unsupported
  registerProcessSupport: ITerminalService['registerProcessSupport'] = () => {}
  @Unsupported
  showProfileQuickPick: ITerminalService['showProfileQuickPick'] = unsupported
  @Unsupported
  setContainers: ITerminalService['setContainers'] = unsupported
  @Unsupported
  requestStartExtensionTerminal: ITerminalService['requestStartExtensionTerminal'] = unsupported
  @Unsupported
  isAttachedToTerminal: ITerminalService['isAttachedToTerminal'] = unsupported
  @Unsupported
  getEditableData: ITerminalService['getEditableData'] = unsupported
  @Unsupported
  setEditable: ITerminalService['setEditable'] = unsupported
  @Unsupported
  isEditable: ITerminalService['isEditable'] = unsupported
  @Unsupported
  safeDisposeTerminal: ITerminalService['safeDisposeTerminal'] = unsupported
  @Unsupported
  getDefaultInstanceHost: ITerminalService['getDefaultInstanceHost'] = unsupported
  @Unsupported
  getInstanceHost: ITerminalService['getInstanceHost'] = unsupported
  @Unsupported
  resolveLocation: ITerminalService['resolveLocation'] = unsupported
  @Unsupported
  setNativeDelegate: ITerminalService['setNativeDelegate'] = unsupported
  @Unsupported
  getEditingTerminal: ITerminalService['getEditingTerminal'] = unsupported
  @Unsupported
  setEditingTerminal: ITerminalService['setEditingTerminal'] = unsupported
  activeInstance: ITerminalService['activeInstance'] = undefined
  onDidDisposeInstance: ITerminalService['onDidDisposeInstance'] = Event.None
  onDidFocusInstance: ITerminalService['onDidFocusInstance'] = Event.None
  onDidChangeActiveInstance: ITerminalService['onDidChangeActiveInstance'] = Event.None
  onDidChangeInstances: ITerminalService['onDidChangeInstances'] = Event.None
  onDidChangeInstanceCapability: ITerminalService['onDidChangeInstanceCapability'] = Event.None
  @Unsupported
  setActiveInstance: ITerminalService['setActiveInstance'] = unsupported
  @Unsupported
  focusActiveInstance: ITerminalService['focusActiveInstance'] = unsupported
  @Unsupported
  getInstanceFromResource: ITerminalService['getInstanceFromResource'] = unsupported

  @Unsupported
  createAndFocusTerminal: ITerminalService['createAndFocusTerminal'] = unsupported
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
  setPanelContainer: ITerminalConfigurationService['setPanelContainer'] = unsupported
  @Unsupported
  configFontIsMonospace: ITerminalConfigurationService['configFontIsMonospace'] = unsupported
  @Unsupported
  getFont: ITerminalConfigurationService['getFont'] = unsupported
}
registerSingleton(
  ITerminalConfigurationService,
  TerminalConfigurationService,
  InstantiationType.Delayed
)
class TerminalEditorService implements ITerminalEditorService {
  _serviceBrand: undefined
  @Unsupported
  focusInstance: ITerminalEditorService['focusInstance'] = unsupported
  instances: ITerminalEditorService['instances'] = []
  @Unsupported
  openEditor: ITerminalEditorService['openEditor'] = unsupported
  @Unsupported
  detachInstance: ITerminalEditorService['detachInstance'] = unsupported
  @Unsupported
  splitInstance: ITerminalEditorService['splitInstance'] = unsupported
  @Unsupported
  revealActiveEditor: ITerminalEditorService['revealActiveEditor'] = unsupported
  @Unsupported
  resolveResource: ITerminalEditorService['resolveResource'] = unsupported
  @Unsupported
  reviveInput: ITerminalEditorService['reviveInput'] = unsupported
  @Unsupported
  getInputFromResource: ITerminalEditorService['getInputFromResource'] = unsupported
  activeInstance: ITerminalEditorService['activeInstance'] = undefined
  onDidDisposeInstance: ITerminalEditorService['onDidDisposeInstance'] = Event.None
  onDidFocusInstance: ITerminalEditorService['onDidFocusInstance'] = Event.None
  onDidChangeActiveInstance: ITerminalEditorService['onDidChangeActiveInstance'] = Event.None
  onDidChangeInstances: ITerminalEditorService['onDidChangeInstances'] = Event.None
  onDidChangeInstanceCapability: ITerminalEditorService['onDidChangeInstanceCapability'] =
    Event.None
  @Unsupported
  setActiveInstance: ITerminalEditorService['setActiveInstance'] = unsupported
  @Unsupported
  focusActiveInstance: ITerminalEditorService['focusActiveInstance'] = unsupported
  @Unsupported
  getInstanceFromResource: ITerminalEditorService['getInstanceFromResource'] = unsupported
}
registerSingleton(ITerminalEditorService, TerminalEditorService, InstantiationType.Delayed)
class TerminalGroupService implements ITerminalGroupService {
  _serviceBrand: undefined
  @Unsupported
  focusInstance: ITerminalGroupService['focusInstance'] = unsupported
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
  createGroup: ITerminalGroupService['createGroup'] = unsupported
  @Unsupported
  getGroupForInstance: ITerminalGroupService['getGroupForInstance'] = unsupported
  @Unsupported
  moveGroup: ITerminalGroupService['moveGroup'] = unsupported
  @Unsupported
  moveGroupToEnd: ITerminalGroupService['moveGroupToEnd'] = unsupported
  @Unsupported
  moveInstance: ITerminalGroupService['moveInstance'] = unsupported
  @Unsupported
  unsplitInstance: ITerminalGroupService['unsplitInstance'] = unsupported
  @Unsupported
  joinInstances: ITerminalGroupService['joinInstances'] = unsupported
  @Unsupported
  instanceIsSplit: ITerminalGroupService['instanceIsSplit'] = unsupported
  @Unsupported
  getGroupLabels: ITerminalGroupService['getGroupLabels'] = unsupported
  @Unsupported
  setActiveGroupByIndex: ITerminalGroupService['setActiveGroupByIndex'] = unsupported
  @Unsupported
  setActiveGroupToNext: ITerminalGroupService['setActiveGroupToNext'] = unsupported
  @Unsupported
  setActiveGroupToPrevious: ITerminalGroupService['setActiveGroupToPrevious'] = unsupported
  @Unsupported
  setActiveInstanceByIndex: ITerminalGroupService['setActiveInstanceByIndex'] = unsupported
  @Unsupported
  setContainer: ITerminalGroupService['setContainer'] = unsupported
  @Unsupported
  showPanel: ITerminalGroupService['showPanel'] = unsupported
  @Unsupported
  hidePanel: ITerminalGroupService['hidePanel'] = unsupported
  @Unsupported
  focusTabs: ITerminalGroupService['focusTabs'] = unsupported
  @Unsupported
  focusHover: ITerminalGroupService['focusHover'] = unsupported
  @Unsupported
  updateVisibility: ITerminalGroupService['updateVisibility'] = unsupported
  activeInstance: ITerminalInstance | undefined
  onDidDisposeInstance: ITerminalGroupService['onDidDisposeInstance'] = Event.None
  onDidFocusInstance: ITerminalGroupService['onDidFocusInstance'] = Event.None
  onDidChangeActiveInstance: ITerminalGroupService['onDidChangeActiveInstance'] = Event.None
  onDidChangeInstances: ITerminalGroupService['onDidChangeInstances'] = Event.None
  onDidChangeInstanceCapability: ITerminalGroupService['onDidChangeInstanceCapability'] = Event.None
  @Unsupported
  setActiveInstance: ITerminalGroupService['setActiveInstance'] = unsupported
  @Unsupported
  focusActiveInstance: ITerminalGroupService['focusActiveInstance'] = unsupported
  @Unsupported
  getInstanceFromResource: ITerminalGroupService['getInstanceFromResource'] = unsupported
}
registerSingleton(ITerminalGroupService, TerminalGroupService, InstantiationType.Delayed)
class TerminalInstanceService implements ITerminalInstanceService {
  _serviceBrand: undefined
  onDidRegisterBackend: ITerminalInstanceService['onDidRegisterBackend'] = Event.None
  getRegisteredBackends: ITerminalInstanceService['getRegisteredBackends'] = () => [].values()
  onDidCreateInstance: ITerminalInstanceService['onDidCreateInstance'] = Event.None
  @Unsupported
  convertProfileToShellLaunchConfig: ITerminalInstanceService['convertProfileToShellLaunchConfig'] =
    unsupported
  @Unsupported
  createInstance: ITerminalInstanceService['createInstance'] = unsupported
  @Unsupported
  getBackend: ITerminalInstanceService['getBackend'] = unsupported
  @Unsupported
  didRegisterBackend: ITerminalInstanceService['didRegisterBackend'] = unsupported
}
registerSingleton(ITerminalInstanceService, TerminalInstanceService, InstantiationType.Delayed)
class TerminalProfileService implements ITerminalProfileService {
  _serviceBrand: undefined
  availableProfiles: ITerminalProfileService['availableProfiles'] = []
  contributedProfiles: ITerminalProfileService['contributedProfiles'] = []
  profilesReady: ITerminalProfileService['profilesReady'] = Promise.resolve()
  @Unsupported
  getPlatformKey: ITerminalProfileService['getPlatformKey'] = unsupported
  @Unsupported
  refreshAvailableProfiles: ITerminalProfileService['refreshAvailableProfiles'] = unsupported
  getDefaultProfileName: ITerminalProfileService['getDefaultProfileName'] = () => undefined
  getDefaultProfile: ITerminalProfileService['getDefaultProfile'] = () => undefined
  onDidChangeAvailableProfiles: ITerminalProfileService['onDidChangeAvailableProfiles'] = Event.None
  @Unsupported
  getContributedDefaultProfile: ITerminalProfileService['getContributedDefaultProfile'] =
    unsupported
  @Unsupported
  registerContributedProfile: ITerminalProfileService['registerContributedProfile'] = unsupported
  @Unsupported
  getContributedProfileProvider: ITerminalProfileService['getContributedProfileProvider'] =
    unsupported
  @Unsupported
  registerTerminalProfileProvider: ITerminalProfileService['registerTerminalProfileProvider'] =
    unsupported
}
registerSingleton(ITerminalProfileService, TerminalProfileService, InstantiationType.Delayed)
class TerminalLogService implements ITerminalLogService {
  _logBrand: undefined
  _serviceBrand: undefined
  onDidChangeLogLevel: ITerminalLogService['onDidChangeLogLevel'] = Event.None
  @Unsupported
  getLevel: ITerminalLogService['getLevel'] = unsupported
  @Unsupported
  setLevel: ITerminalLogService['setLevel'] = unsupported
  @Unsupported
  trace: ITerminalLogService['trace'] = unsupported
  @Unsupported
  debug: ITerminalLogService['debug'] = unsupported
  @Unsupported
  info: ITerminalLogService['info'] = unsupported
  @Unsupported
  warn: ITerminalLogService['warn'] = unsupported
  @Unsupported
  error: ITerminalLogService['error'] = unsupported
  @Unsupported
  flush: ITerminalLogService['flush'] = unsupported
  @Unsupported
  dispose: ITerminalLogService['dispose'] = unsupported
}
registerSingleton(ITerminalLogService, TerminalLogService, InstantiationType.Delayed)
class TerminalLinkProviderService implements ITerminalLinkProviderService {
  _serviceBrand: undefined
  linkProviders: ITerminalLinkProviderService['linkProviders'] = new Set([])
  onDidAddLinkProvider: ITerminalLinkProviderService['onDidAddLinkProvider'] = Event.None
  onDidRemoveLinkProvider: ITerminalLinkProviderService['onDidRemoveLinkProvider'] = Event.None
  @Unsupported
  registerLinkProvider: ITerminalLinkProviderService['registerLinkProvider'] = unsupported
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
  resolveIcon: ITerminalProfileResolverService['resolveIcon'] = unsupported
  @Unsupported
  resolveShellLaunchConfig: ITerminalProfileResolverService['resolveShellLaunchConfig'] =
    unsupported
  getDefaultProfile: ITerminalProfileResolverService['getDefaultProfile'] = async () => ({
    profileName: 'bash',
    path: '/bin/bash',
    isDefault: true
  })
  @Unsupported
  getDefaultShell: ITerminalProfileResolverService['getDefaultShell'] = unsupported
  @Unsupported
  getDefaultShellArgs: ITerminalProfileResolverService['getDefaultShellArgs'] = unsupported
  @Unsupported
  getDefaultIcon: ITerminalProfileResolverService['getDefaultIcon'] = unsupported
  @Unsupported
  getEnvironment: ITerminalProfileResolverService['getEnvironment'] = unsupported
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
  registerQuickFixProvider: ITerminalQuickFixService['registerQuickFixProvider'] = unsupported
  @Unsupported
  registerCommandSelector: ITerminalQuickFixService['registerCommandSelector'] = unsupported
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
  turnOn: IUserDataSyncWorkbenchService['turnOn'] = unsupported
  @Unsupported
  turnoff: IUserDataSyncWorkbenchService['turnoff'] = unsupported
  @Unsupported
  signIn: IUserDataSyncWorkbenchService['signIn'] = unsupported
  @Unsupported
  resetSyncedData: IUserDataSyncWorkbenchService['resetSyncedData'] = unsupported
  @Unsupported
  showSyncActivity: IUserDataSyncWorkbenchService['showSyncActivity'] = unsupported
  @Unsupported
  syncNow: IUserDataSyncWorkbenchService['syncNow'] = unsupported
  @Unsupported
  synchroniseUserDataSyncStoreType: IUserDataSyncWorkbenchService['synchroniseUserDataSyncStoreType'] =
    unsupported
  @Unsupported
  showConflicts: IUserDataSyncWorkbenchService['showConflicts'] = unsupported
  @Unsupported
  accept: IUserDataSyncWorkbenchService['accept'] = unsupported
  @Unsupported
  getAllLogResources: IUserDataSyncWorkbenchService['getAllLogResources'] = unsupported
  @Unsupported
  downloadSyncActivity: IUserDataSyncWorkbenchService['downloadSyncActivity'] = unsupported
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
  setEnablement: IUserDataSyncEnablementService['setEnablement'] = unsupported
  isResourceEnablementConfigured: IUserDataSyncEnablementService['isResourceEnablementConfigured'] =
    () => false
  onDidChangeResourceEnablement: IUserDataSyncEnablementService['onDidChangeResourceEnablement'] =
    Event.None
  isResourceEnabled: IUserDataSyncEnablementService['isResourceEnabled'] = () => false
  @Unsupported
  setResourceEnablement: IUserDataSyncEnablementService['setResourceEnablement'] = unsupported
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
  addKeybinding: IKeybindingEditingService['addKeybinding'] = unsupported
  @Unsupported
  editKeybinding: IKeybindingEditingService['editKeybinding'] = unsupported
  @Unsupported
  removeKeybinding: IKeybindingEditingService['removeKeybinding'] = unsupported
  @Unsupported
  resetKeybinding: IKeybindingEditingService['resetKeybinding'] = unsupported
}
registerSingleton(IKeybindingEditingService, KeybindingEditingService, InstantiationType.Delayed)
class PreferencesSearchService implements IPreferencesSearchService {
  _serviceBrand: undefined
  @Unsupported
  getLocalSearchProvider: IPreferencesSearchService['getLocalSearchProvider'] = unsupported
  @Unsupported
  getRemoteSearchProvider: IPreferencesSearchService['getRemoteSearchProvider'] = unsupported
  @Unsupported
  getAiSearchProvider: IPreferencesSearchService['getAiSearchProvider'] = unsupported
}
registerSingleton(IPreferencesSearchService, PreferencesSearchService, InstantiationType.Delayed)
class NotebookService implements INotebookService {
  _serviceBrand: undefined
  @Unsupported
  createNotebookTextDocumentSnapshot: INotebookService['createNotebookTextDocumentSnapshot'] =
    unsupported
  @Unsupported
  restoreNotebookTextModelFromSnapshot: INotebookService['restoreNotebookTextModelFromSnapshot'] =
    unsupported
  @Unsupported
  hasSupportedNotebooks: INotebookService['hasSupportedNotebooks'] = unsupported
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
  registerNotebookSerializer: INotebookService['registerNotebookSerializer'] = unsupported
  @Unsupported
  withNotebookDataProvider: INotebookService['withNotebookDataProvider'] = unsupported
  @Unsupported
  getOutputMimeTypeInfo: INotebookService['getOutputMimeTypeInfo'] = unsupported
  getViewTypeProvider: INotebookService['getViewTypeProvider'] = () => undefined
  getRendererInfo: INotebookService['getRendererInfo'] = () => undefined
  getRenderers: INotebookService['getRenderers'] = () => []
  @Unsupported
  getStaticPreloads: INotebookService['getStaticPreloads'] = unsupported
  @Unsupported
  updateMimePreferredRenderer: INotebookService['updateMimePreferredRenderer'] = unsupported
  @Unsupported
  saveMimeDisplayOrder: INotebookService['saveMimeDisplayOrder'] = unsupported
  @Unsupported
  createNotebookTextModel: INotebookService['createNotebookTextModel'] = unsupported
  getNotebookTextModel: INotebookService['getNotebookTextModel'] = () => undefined
  @Unsupported
  getNotebookTextModels: INotebookService['getNotebookTextModels'] = unsupported
  listNotebookDocuments: INotebookService['listNotebookDocuments'] = () => []
  @Unsupported
  registerContributedNotebookType: INotebookService['registerContributedNotebookType'] = unsupported
  getContributedNotebookType: INotebookService['getContributedNotebookType'] = () => undefined
  getContributedNotebookTypes: INotebookService['getContributedNotebookTypes'] = () => []
  getNotebookProviderResourceRoots: INotebookService['getNotebookProviderResourceRoots'] = () => []
  @Unsupported
  setToCopy: INotebookService['setToCopy'] = unsupported
  @Unsupported
  getToCopy: INotebookService['getToCopy'] = unsupported
  @Unsupported
  clearEditorCache: INotebookService['clearEditorCache'] = unsupported
}
registerSingleton(INotebookService, NotebookService, InstantiationType.Delayed)
class ReplaceService implements IReplaceService {
  _serviceBrand: undefined
  @Unsupported
  replace: IReplaceService['replace'] = unsupported
  @Unsupported
  openReplacePreview: IReplaceService['openReplacePreview'] = unsupported
  @Unsupported
  updateReplacePreview: IReplaceService['updateReplacePreview'] = unsupported
}
registerSingleton(IReplaceService, ReplaceService, InstantiationType.Delayed)
class SearchHistoryService implements ISearchHistoryService {
  _serviceBrand: undefined
  onDidClearHistory: ISearchHistoryService['onDidClearHistory'] = Event.None
  @Unsupported
  clearHistory: ISearchHistoryService['clearHistory'] = unsupported
  @Unsupported
  load: ISearchHistoryService['load'] = unsupported
  @Unsupported
  save: ISearchHistoryService['save'] = unsupported
}
registerSingleton(ISearchHistoryService, SearchHistoryService, InstantiationType.Delayed)
class NotebookEditorService implements INotebookEditorService {
  _serviceBrand: undefined
  @Unsupported
  updateReplContextKey: INotebookEditorService['updateReplContextKey'] = unsupported
  @Unsupported
  retrieveWidget: INotebookEditorService['retrieveWidget'] = unsupported
  retrieveExistingWidgetFromURI: INotebookEditorService['retrieveExistingWidgetFromURI'] = () =>
    undefined
  retrieveAllExistingWidgets: INotebookEditorService['retrieveAllExistingWidgets'] = () => []
  onDidAddNotebookEditor: INotebookEditorService['onDidAddNotebookEditor'] = Event.None
  onDidRemoveNotebookEditor: INotebookEditorService['onDidRemoveNotebookEditor'] = Event.None
  @Unsupported
  addNotebookEditor: INotebookEditorService['addNotebookEditor'] = unsupported
  @Unsupported
  removeNotebookEditor: INotebookEditorService['removeNotebookEditor'] = unsupported
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
    unsupported
  onDidSaveNotebook: INotebookEditorModelResolverService['onDidSaveNotebook'] = Event.None
  onDidChangeDirty: INotebookEditorModelResolverService['onDidChangeDirty'] = Event.None
  onWillFailWithConflict: INotebookEditorModelResolverService['onWillFailWithConflict'] = Event.None
  @Unsupported
  isDirty: INotebookEditorModelResolverService['isDirty'] = unsupported
  @Unsupported
  resolve: INotebookEditorModelResolverService['resolve'] = unsupported
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
  markActive: IUserActivityService['markActive'] = unsupported
}
registerSingleton(IUserActivityService, UserActivityService, InstantiationType.Delayed)
class CanonicalUriService implements ICanonicalUriService {
  _serviceBrand: undefined
  @Unsupported
  registerCanonicalUriProvider: ICanonicalUriService['registerCanonicalUriProvider'] = unsupported
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
  onDidRefetchAssignments: IWorkbenchAssignmentService['onDidRefetchAssignments'] = Event.None
  getCurrentExperiments: IWorkbenchAssignmentService['getCurrentExperiments'] = async () => []
  getTreatment: IWorkbenchAssignmentService['getTreatment'] = async () => undefined
}
registerSingleton(
  IWorkbenchAssignmentService,
  WorkbenchAssignmentService,
  InstantiationType.Delayed
)
class ChatService implements IChatService {
  _serviceBrand: undefined
  isPersistedSessionEmpty: IChatService['isPersistedSessionEmpty'] = () => true
  @Unsupported
  activateDefaultAgent: IChatService['activateDefaultAgent'] = unsupported
  @Unsupported
  getChatStorageFolder: IChatService['getChatStorageFolder'] = unsupported
  @Unsupported
  logChatIndex: IChatService['logChatIndex'] = unsupported
  @Unsupported
  setChatSessionTitle: IChatService['setChatSessionTitle'] = unsupported
  @Unsupported
  adoptRequest: IChatService['adoptRequest'] = unsupported
  isEnabled: IChatService['isEnabled'] = () => false
  @Unsupported
  resendRequest: IChatService['resendRequest'] = unsupported
  @Unsupported
  clearAllHistoryEntries: IChatService['clearAllHistoryEntries'] = unsupported
  hasSessions: IChatService['hasSessions'] = () => false
  onDidDisposeSession: IChatService['onDidDisposeSession'] = Event.None
  transferredSessionData: IChatService['transferredSessionData'] = undefined
  @Unsupported
  transferChatSession: IChatService['transferChatSession'] = unsupported
  @Unsupported
  startSession: IChatService['startSession'] = unsupported
  getSession: IChatService['getSession'] = () => undefined
  getOrRestoreSession: IChatService['getOrRestoreSession'] = async () => undefined
  loadSessionFromContent: IChatService['loadSessionFromContent'] = () => undefined
  @Unsupported
  sendRequest: IChatService['sendRequest'] = unsupported
  @Unsupported
  removeRequest: IChatService['removeRequest'] = unsupported
  @Unsupported
  cancelCurrentRequestForSession: IChatService['cancelCurrentRequestForSession'] = unsupported
  @Unsupported
  clearSession: IChatService['clearSession'] = unsupported
  @Unsupported
  addCompleteRequest: IChatService['addCompleteRequest'] = unsupported
  getHistory: IChatService['getHistory'] = async () => []
  @Unsupported
  removeHistoryEntry: IChatService['removeHistoryEntry'] = unsupported
  onDidPerformUserAction: IChatService['onDidPerformUserAction'] = Event.None
  @Unsupported
  notifyUserAction: IChatService['notifyUserAction'] = unsupported
  onDidSubmitRequest: IChatService['onDidSubmitRequest'] = Event.None
  @Unsupported
  loadSessionForResource: IChatService['loadSessionForResource'] = unsupported
  requestInProgressObs: IChatService['requestInProgressObs'] = constObservable(false)
  edits2Enabled: IChatService['edits2Enabled'] = false
  getPersistedSessionTitle: IChatService['getPersistedSessionTitle'] = () => undefined
}
registerSingleton(IChatService, ChatService, InstantiationType.Delayed)
class ChatMarkdownAnchorService implements IChatMarkdownAnchorService {
  _serviceBrand: undefined
  lastFocusedAnchor: IChatMarkdownAnchorService['lastFocusedAnchor'] = undefined
  @Unsupported
  register: IChatMarkdownAnchorService['register'] = unsupported
}
registerSingleton(IChatMarkdownAnchorService, ChatMarkdownAnchorService, InstantiationType.Delayed)
class LanguageModelStatsService implements ILanguageModelStatsService {
  _serviceBrand: undefined
  @Unsupported
  update: ILanguageModelStatsService['update'] = unsupported
}
registerSingleton(ILanguageModelStatsService, LanguageModelStatsService, InstantiationType.Delayed)
class QuickChatService implements IQuickChatService {
  focused: IQuickChatService['focused'] = false
  _serviceBrand: undefined
  onDidClose: IQuickChatService['onDidClose'] = Event.None
  enabled: IQuickChatService['enabled'] = false
  @Unsupported
  toggle: IQuickChatService['toggle'] = unsupported
  @Unsupported
  focus: IQuickChatService['focus'] = unsupported
  @Unsupported
  open: IQuickChatService['open'] = unsupported
  @Unsupported
  close: IQuickChatService['close'] = unsupported
  @Unsupported
  openInChatView: IQuickChatService['openInChatView'] = unsupported
}
registerSingleton(IQuickChatService, QuickChatService, InstantiationType.Delayed)
class QuickChatAgentService implements IChatAgentService {
  _serviceBrand: IChatAgentService['_serviceBrand'] = undefined
  hasToolsAgent: IChatAgentService['hasToolsAgent'] = false
  @Unsupported
  registerChatParticipantDetectionProvider: IChatAgentService['registerChatParticipantDetectionProvider'] =
    unsupported
  @Unsupported
  detectAgentOrCommand: IChatAgentService['detectAgentOrCommand'] = unsupported
  hasChatParticipantDetectionProviders: IChatAgentService['hasChatParticipantDetectionProviders'] =
    () => false
  @Unsupported
  getChatTitle: IChatAgentService['getChatTitle'] = unsupported
  agentHasDupeName: IChatAgentService['agentHasDupeName'] = () => false
  @Unsupported
  registerAgentCompletionProvider: IChatAgentService['registerAgentCompletionProvider'] =
    unsupported
  @Unsupported
  getAgentCompletionItems: IChatAgentService['getAgentCompletionItems'] = unsupported
  @Unsupported
  getAgentByFullyQualifiedId: IChatAgentService['getAgentByFullyQualifiedId'] = unsupported
  getContributedDefaultAgent: IChatAgentService['getContributedDefaultAgent'] = () => undefined
  @Unsupported
  registerAgentImplementation: IChatAgentService['registerAgentImplementation'] = unsupported
  @Unsupported
  registerDynamicAgent: IChatAgentService['registerDynamicAgent'] = unsupported
  getActivatedAgents: IChatAgentService['getActivatedAgents'] = () => []
  getAgentsByName: IChatAgentService['getAgentsByName'] = () => []
  @Unsupported
  getFollowups: IChatAgentService['getFollowups'] = unsupported
  getDefaultAgent: IChatAgentService['getDefaultAgent'] = () => undefined
  @Unsupported
  updateAgent: IChatAgentService['updateAgent'] = unsupported
  onDidChangeAgents: IChatAgentService['onDidChangeAgents'] = Event.None
  @Unsupported
  registerAgent: IChatAgentService['registerAgent'] = unsupported
  @Unsupported
  invokeAgent: IChatAgentService['invokeAgent'] = unsupported
  @Unsupported
  getAgents: IChatAgentService['getAgents'] = unsupported
  @Unsupported
  getAgent: IChatAgentService['getAgent'] = unsupported

  getChatSummary: IChatAgentService['getChatSummary'] = async () => undefined
  @Unsupported
  setRequestTools: IChatAgentService['setRequestTools'] = unsupported
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
  createTerminal: IEmbedderTerminalService['createTerminal'] = unsupported
}
registerSingleton(IEmbedderTerminalService, EmbedderTerminalService, InstantiationType.Delayed)
class CustomEditorService implements ICustomEditorService {
  _serviceBrand: undefined
  @Unsupported
  get models() {
    return unsupported()
  }
  @Unsupported
  getCustomEditor: ICustomEditorService['getCustomEditor'] = unsupported
  @Unsupported
  getAllCustomEditors: ICustomEditorService['getAllCustomEditors'] = unsupported
  @Unsupported
  getContributedCustomEditors: ICustomEditorService['getContributedCustomEditors'] = unsupported
  @Unsupported
  getUserConfiguredCustomEditors: ICustomEditorService['getUserConfiguredCustomEditors'] =
    unsupported
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
  createWebviewElement: IWebviewService['createWebviewElement'] = unsupported
  @Unsupported
  createWebviewOverlay: IWebviewService['createWebviewOverlay'] = unsupported
}
registerSingleton(IWebviewService, WebviewService, InstantiationType.Delayed)
class WebviewViewService implements IWebviewViewService {
  _serviceBrand: undefined
  onNewResolverRegistered: IWebviewViewService['onNewResolverRegistered'] = Event.None
  @Unsupported
  register: IWebviewViewService['register'] = unsupported
  @Unsupported
  resolve: IWebviewViewService['resolve'] = unsupported
}
registerSingleton(IWebviewViewService, WebviewViewService, InstantiationType.Delayed)
class LocaleService implements ILocaleService {
  _serviceBrand: undefined
  @Unsupported
  setLocale: ILocaleService['setLocale'] = unsupported
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
  openWebview: IWebviewWorkbenchService['openWebview'] = unsupported
  @Unsupported
  openRevivedWebview: IWebviewWorkbenchService['openRevivedWebview'] = unsupported
  @Unsupported
  revealWebview: IWebviewWorkbenchService['revealWebview'] = unsupported
  registerResolver: IWebviewWorkbenchService['registerResolver'] = () => Disposable.None
  @Unsupported
  shouldPersist: IWebviewWorkbenchService['shouldPersist'] = unsupported
  @Unsupported
  resolveWebview: IWebviewWorkbenchService['resolveWebview'] = unsupported
}
registerSingleton(IWebviewWorkbenchService, WebviewWorkbenchService, InstantiationType.Delayed)
class RemoteAuthorityResolverService implements IRemoteAuthorityResolverService {
  _serviceBrand: undefined
  onDidChangeConnectionData: IRemoteAuthorityResolverService['onDidChangeConnectionData'] =
    Event.None
  @Unsupported
  resolveAuthority: IRemoteAuthorityResolverService['resolveAuthority'] = unsupported
  @Unsupported
  getConnectionData: IRemoteAuthorityResolverService['getConnectionData'] = unsupported
  @Unsupported
  getCanonicalURI: IRemoteAuthorityResolverService['getCanonicalURI'] = unsupported
  @Unsupported
  _clearResolvedAuthority: IRemoteAuthorityResolverService['_clearResolvedAuthority'] = unsupported
  @Unsupported
  _setResolvedAuthority: IRemoteAuthorityResolverService['_setResolvedAuthority'] = unsupported
  @Unsupported
  _setResolvedAuthorityError: IRemoteAuthorityResolverService['_setResolvedAuthorityError'] =
    unsupported
  @Unsupported
  _setAuthorityConnectionToken: IRemoteAuthorityResolverService['_setAuthorityConnectionToken'] =
    unsupported
  @Unsupported
  _setCanonicalURIProvider: IRemoteAuthorityResolverService['_setCanonicalURIProvider'] =
    unsupported
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
  configureKeybindings: IAccessibleViewService['configureKeybindings'] = unsupported
  @Unsupported
  openHelpLink: IAccessibleViewService['openHelpLink'] = unsupported
  @Unsupported
  navigateToCodeBlock: IAccessibleViewService['navigateToCodeBlock'] = unsupported
  getCodeBlockContext: IAccessibleViewService['getCodeBlockContext'] = () => undefined
  @Unsupported
  showLastProvider: IAccessibleViewService['showLastProvider'] = unsupported
  @Unsupported
  showAccessibleViewHelp: IAccessibleViewService['showAccessibleViewHelp'] = unsupported
  @Unsupported
  goToSymbol: IAccessibleViewService['goToSymbol'] = unsupported
  @Unsupported
  disableHint: IAccessibleViewService['disableHint'] = unsupported
  @Unsupported
  next: IAccessibleViewService['next'] = unsupported
  @Unsupported
  previous: IAccessibleViewService['previous'] = unsupported
  @Unsupported
  getOpenAriaHint: IAccessibleViewService['getOpenAriaHint'] = unsupported
  @Unsupported
  show: IAccessibleViewService['show'] = unsupported
  @Unsupported
  getPosition: IAccessibleViewService['getPosition'] = unsupported
  @Unsupported
  setPosition: IAccessibleViewService['setPosition'] = unsupported
  @Unsupported
  getLastPosition: IAccessibleViewService['getLastPosition'] = unsupported
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
    unsupported
  @Unsupported
  uninstallExtensions: IWorkbenchExtensionManagementService['uninstallExtensions'] = unsupported
  @Unsupported
  resetPinnedStateForAllUserExtensions: IWorkbenchExtensionManagementService['resetPinnedStateForAllUserExtensions'] =
    unsupported
  getInstalledWorkspaceExtensionLocations: IWorkbenchExtensionManagementService['getInstalledWorkspaceExtensionLocations'] =
    () => []
  onDidEnableExtensions: IWorkbenchExtensionManagementService['onDidEnableExtensions'] = Event.None
  getExtensions: IWorkbenchExtensionManagementService['getExtensions'] = async () => []
  getInstalledWorkspaceExtensions: IWorkbenchExtensionManagementService['getInstalledWorkspaceExtensions'] =
    async () => []
  @Unsupported
  installResourceExtension: IWorkbenchExtensionManagementService['installResourceExtension'] =
    unsupported
  onInstallExtension: IWorkbenchExtensionManagementService['onInstallExtension'] = Event.None
  onDidInstallExtensions: IWorkbenchExtensionManagementService['onDidInstallExtensions'] =
    Event.None
  onUninstallExtension: IWorkbenchExtensionManagementService['onUninstallExtension'] = Event.None
  onDidUninstallExtension: IWorkbenchExtensionManagementService['onDidUninstallExtension'] =
    Event.None
  onDidChangeProfile: IWorkbenchExtensionManagementService['onDidChangeProfile'] = Event.None
  @Unsupported
  installVSIX: IWorkbenchExtensionManagementService['installVSIX'] = unsupported
  @Unsupported
  installFromLocation: IWorkbenchExtensionManagementService['installFromLocation'] = unsupported
  @Unsupported
  updateFromGallery: IWorkbenchExtensionManagementService['updateFromGallery'] = unsupported
  onDidUpdateExtensionMetadata: IWorkbenchExtensionManagementService['onDidUpdateExtensionMetadata'] =
    Event.None
  @Unsupported
  zip: IWorkbenchExtensionManagementService['zip'] = unsupported
  @Unsupported
  getManifest: IWorkbenchExtensionManagementService['getManifest'] = unsupported
  @Unsupported
  install: IWorkbenchExtensionManagementService['install'] = unsupported
  @Unsupported
  canInstall: IWorkbenchExtensionManagementService['canInstall'] = unsupported
  @Unsupported
  installFromGallery: IWorkbenchExtensionManagementService['installFromGallery'] = unsupported
  @Unsupported
  installGalleryExtensions: IWorkbenchExtensionManagementService['installGalleryExtensions'] =
    unsupported
  @Unsupported
  installExtensionsFromProfile: IWorkbenchExtensionManagementService['installExtensionsFromProfile'] =
    unsupported
  @Unsupported
  uninstall: IWorkbenchExtensionManagementService['uninstall'] = unsupported
  getInstalled: IWorkbenchExtensionManagementService['getInstalled'] = async () => []
  @Unsupported
  getExtensionsControlManifest: IWorkbenchExtensionManagementService['getExtensionsControlManifest'] =
    unsupported
  @Unsupported
  copyExtensions: IWorkbenchExtensionManagementService['copyExtensions'] = unsupported
  @Unsupported
  updateMetadata: IWorkbenchExtensionManagementService['updateMetadata'] = unsupported
  @Unsupported
  download: IWorkbenchExtensionManagementService['download'] = unsupported
  @Unsupported
  registerParticipant: IWorkbenchExtensionManagementService['registerParticipant'] = unsupported
  @Unsupported
  getTargetPlatform: IWorkbenchExtensionManagementService['getTargetPlatform'] = unsupported
  @Unsupported
  cleanUp: IWorkbenchExtensionManagementService['cleanUp'] = unsupported
  getInstallableServers: IWorkbenchExtensionManagementService['getInstallableServers'] =
    async () => []
  isPublisherTrusted: IWorkbenchExtensionManagementService['isPublisherTrusted'] = () => false
  getTrustedPublishers: IWorkbenchExtensionManagementService['getTrustedPublishers'] = () => []
  @Unsupported
  requestPublisherTrust: IWorkbenchExtensionManagementService['requestPublisherTrust'] = unsupported
  @Unsupported
  trustPublishers: IWorkbenchExtensionManagementService['trustPublishers'] = unsupported
  @Unsupported
  untrustPublishers: IWorkbenchExtensionManagementService['untrustPublishers'] = unsupported
}
registerSingleton(
  IWorkbenchExtensionManagementService,
  WorkbenchExtensionManagementService,
  InstantiationType.Delayed
)
class ExtensionManifestPropertiesService implements IExtensionManifestPropertiesService {
  _serviceBrand: undefined
  @Unsupported
  prefersExecuteOnUI: IExtensionManifestPropertiesService['prefersExecuteOnUI'] = unsupported
  @Unsupported
  prefersExecuteOnWorkspace: IExtensionManifestPropertiesService['prefersExecuteOnWorkspace'] =
    unsupported
  @Unsupported
  prefersExecuteOnWeb: IExtensionManifestPropertiesService['prefersExecuteOnWeb'] = unsupported
  @Unsupported
  canExecuteOnUI: IExtensionManifestPropertiesService['canExecuteOnUI'] = unsupported
  @Unsupported
  canExecuteOnWorkspace: IExtensionManifestPropertiesService['canExecuteOnWorkspace'] = unsupported
  @Unsupported
  canExecuteOnWeb: IExtensionManifestPropertiesService['canExecuteOnWeb'] = unsupported
  @Unsupported
  getExtensionKind: IExtensionManifestPropertiesService['getExtensionKind'] = unsupported
  @Unsupported
  getUserConfiguredExtensionKind: IExtensionManifestPropertiesService['getUserConfiguredExtensionKind'] =
    unsupported
  @Unsupported
  getExtensionUntrustedWorkspaceSupportType: IExtensionManifestPropertiesService['getExtensionUntrustedWorkspaceSupportType'] =
    unsupported
  @Unsupported
  getExtensionVirtualWorkspaceSupportType: IExtensionManifestPropertiesService['getExtensionVirtualWorkspaceSupportType'] =
    unsupported
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
  whenExtensionsReady: IRemoteExtensionsScannerService['whenExtensionsReady'] = unsupported
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
  create: IURLService['create'] = unsupported
  open: IURLService['open'] = async () => false
  @Unsupported
  registerHandler: IURLService['registerHandler'] = unsupported
}
registerSingleton(IURLService, URLService, InstantiationType.Delayed)
class RemoteSocketFactoryService implements IRemoteSocketFactoryService {
  _serviceBrand: undefined
  @Unsupported
  register: IRemoteSocketFactoryService['register'] = unsupported
  @Unsupported
  connect: IRemoteSocketFactoryService['connect'] = unsupported
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
  addQuickDiffProvider: IQuickDiffService['addQuickDiffProvider'] = unsupported
  @Unsupported
  toggleQuickDiffProviderVisibility: IQuickDiffService['toggleQuickDiffProviderVisibility'] =
    unsupported
  @Unsupported
  getQuickDiffs: IQuickDiffService['getQuickDiffs'] = unsupported
}
registerSingleton(IQuickDiffService, QuickDiffService, InstantiationType.Delayed)
class SCMService implements ISCMService {
  _serviceBrand: undefined
  onDidAddRepository: ISCMService['onDidAddRepository'] = Event.None
  onDidRemoveRepository: ISCMService['onDidRemoveRepository'] = Event.None
  repositories: ISCMService['repositories'] = []
  repositoryCount: ISCMService['repositoryCount'] = 0
  @Unsupported
  registerSCMProvider: ISCMService['registerSCMProvider'] = unsupported
  @Unsupported
  getRepository: ISCMService['getRepository'] = unsupported
}
registerSingleton(ISCMService, SCMService, InstantiationType.Delayed)
class DownloadService implements IDownloadService {
  _serviceBrand: undefined
  @Unsupported
  download: IDownloadService['download'] = unsupported
}
registerSingleton(IDownloadService, DownloadService, InstantiationType.Delayed)
class ExtensionUrlHandler implements IExtensionUrlHandler {
  _serviceBrand: undefined
  @Unsupported
  registerExtensionHandler: IExtensionUrlHandler['registerExtensionHandler'] = unsupported
  @Unsupported
  unregisterExtensionHandler: IExtensionUrlHandler['unregisterExtensionHandler'] = unsupported
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
  setActiveEditingCommentThread: ICommentService['setActiveEditingCommentThread'] = unsupported
  @Unsupported
  setActiveCommentAndThread: ICommentService['setActiveCommentAndThread'] = unsupported
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
  setDocumentComments: ICommentService['setDocumentComments'] = unsupported
  @Unsupported
  setWorkspaceComments: ICommentService['setWorkspaceComments'] = unsupported
  @Unsupported
  removeWorkspaceComments: ICommentService['removeWorkspaceComments'] = unsupported
  @Unsupported
  registerCommentController: ICommentService['registerCommentController'] = unsupported
  unregisterCommentController: ICommentService['unregisterCommentController'] = () => {}
  @Unsupported
  getCommentController: ICommentService['getCommentController'] = unsupported
  @Unsupported
  createCommentThreadTemplate: ICommentService['createCommentThreadTemplate'] = unsupported
  @Unsupported
  updateCommentThreadTemplate: ICommentService['updateCommentThreadTemplate'] = unsupported
  @Unsupported
  getCommentMenus: ICommentService['getCommentMenus'] = unsupported
  @Unsupported
  updateComments: ICommentService['updateComments'] = unsupported
  @Unsupported
  updateNotebookComments: ICommentService['updateNotebookComments'] = unsupported
  @Unsupported
  disposeCommentThread: ICommentService['disposeCommentThread'] = unsupported
  getDocumentComments: ICommentService['getDocumentComments'] = async () => []
  getNotebookComments: ICommentService['getNotebookComments'] = async () => []
  @Unsupported
  updateCommentingRanges: ICommentService['updateCommentingRanges'] = unsupported
  @Unsupported
  hasReactionHandler: ICommentService['hasReactionHandler'] = unsupported
  @Unsupported
  toggleReaction: ICommentService['toggleReaction'] = unsupported
  @Unsupported
  setCurrentCommentThread: ICommentService['setCurrentCommentThread'] = unsupported
  @Unsupported
  enableCommenting: ICommentService['enableCommenting'] = unsupported
  @Unsupported
  registerContinueOnCommentProvider: ICommentService['registerContinueOnCommentProvider'] =
    unsupported
  @Unsupported
  removeContinueOnComment: ICommentService['removeContinueOnComment'] = unsupported
}
registerSingleton(ICommentService, CommentService, InstantiationType.Delayed)
class NotebookCellStatusBarService implements INotebookCellStatusBarService {
  _serviceBrand: undefined
  onDidChangeProviders: INotebookCellStatusBarService['onDidChangeProviders'] = Event.None
  onDidChangeItems: INotebookCellStatusBarService['onDidChangeItems'] = Event.None
  @Unsupported
  registerCellStatusBarItemProvider: INotebookCellStatusBarService['registerCellStatusBarItemProvider'] =
    unsupported
  @Unsupported
  getStatusBarItemsForCell: INotebookCellStatusBarService['getStatusBarItemsForCell'] = unsupported
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
  notifyVariablesChange: INotebookKernelService['notifyVariablesChange'] = unsupported
  onDidAddKernel: INotebookKernelService['onDidAddKernel'] = Event.None
  onDidRemoveKernel: INotebookKernelService['onDidRemoveKernel'] = Event.None
  onDidChangeSelectedNotebooks: INotebookKernelService['onDidChangeSelectedNotebooks'] = Event.None
  onDidChangeNotebookAffinity: INotebookKernelService['onDidChangeNotebookAffinity'] = Event.None
  @Unsupported
  registerKernel: INotebookKernelService['registerKernel'] = unsupported
  @Unsupported
  getMatchingKernel: INotebookKernelService['getMatchingKernel'] = unsupported
  @Unsupported
  getSelectedOrSuggestedKernel: INotebookKernelService['getSelectedOrSuggestedKernel'] = unsupported
  @Unsupported
  selectKernelForNotebook: INotebookKernelService['selectKernelForNotebook'] = unsupported
  @Unsupported
  preselectKernelForNotebook: INotebookKernelService['preselectKernelForNotebook'] = unsupported
  @Unsupported
  updateKernelNotebookAffinity: INotebookKernelService['updateKernelNotebookAffinity'] = unsupported
  onDidChangeKernelDetectionTasks: INotebookKernelService['onDidChangeKernelDetectionTasks'] =
    Event.None
  @Unsupported
  registerNotebookKernelDetectionTask: INotebookKernelService['registerNotebookKernelDetectionTask'] =
    unsupported
  @Unsupported
  getKernelDetectionTasks: INotebookKernelService['getKernelDetectionTasks'] = unsupported
  onDidChangeSourceActions: INotebookKernelService['onDidChangeSourceActions'] = Event.None
  @Unsupported
  getSourceActions: INotebookKernelService['getSourceActions'] = unsupported
  @Unsupported
  getRunningSourceActions: INotebookKernelService['getRunningSourceActions'] = unsupported
  @Unsupported
  registerKernelSourceActionProvider: INotebookKernelService['registerKernelSourceActionProvider'] =
    unsupported
  @Unsupported
  getKernelSourceActions2: INotebookKernelService['getKernelSourceActions2'] = unsupported
}
registerSingleton(INotebookKernelService, NotebookKernelService, InstantiationType.Delayed)
class NotebookRendererMessagingService implements INotebookRendererMessagingService {
  _serviceBrand: undefined
  onShouldPostMessage: INotebookRendererMessagingService['onShouldPostMessage'] = Event.None
  @Unsupported
  prepare: INotebookRendererMessagingService['prepare'] = unsupported
  @Unsupported
  getScoped: INotebookRendererMessagingService['getScoped'] = unsupported
  @Unsupported
  receiveMessage: INotebookRendererMessagingService['receiveMessage'] = unsupported
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
  addToHistory: IInteractiveHistoryService['addToHistory'] = unsupported
  @Unsupported
  getPreviousValue: IInteractiveHistoryService['getPreviousValue'] = unsupported
  @Unsupported
  getNextValue: IInteractiveHistoryService['getNextValue'] = unsupported
  @Unsupported
  replaceLast: IInteractiveHistoryService['replaceLast'] = unsupported
  @Unsupported
  clearHistory: IInteractiveHistoryService['clearHistory'] = unsupported
  @Unsupported
  has: IInteractiveHistoryService['has'] = unsupported
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
    unsupported
  @Unsupported
  willRemoveInteractiveDocument: IInteractiveDocumentService['willRemoveInteractiveDocument'] =
    unsupported
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
  getRemoteProfile: IRemoteUserDataProfilesService['getRemoteProfile'] = unsupported
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
  start: IExtensionBisectService['start'] = unsupported
  @Unsupported
  next: IExtensionBisectService['next'] = unsupported
  @Unsupported
  reset: IExtensionBisectService['reset'] = unsupported
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
  getWidgetByInputUri: IChatWidgetService['getWidgetByInputUri'] = unsupported
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
  setEditable: IRemoteExplorerService['setEditable'] = unsupported
  @Unsupported
  getEditableData: IRemoteExplorerService['getEditableData'] = unsupported
  @Unsupported
  forward: IRemoteExplorerService['forward'] = unsupported
  @Unsupported
  close: IRemoteExplorerService['close'] = unsupported
  @Unsupported
  setTunnelInformation: IRemoteExplorerService['setTunnelInformation'] = unsupported
  @Unsupported
  setCandidateFilter: IRemoteExplorerService['setCandidateFilter'] = unsupported
  @Unsupported
  onFoundNewCandidates: IRemoteExplorerService['onFoundNewCandidates'] = unsupported
  @Unsupported
  restore: IRemoteExplorerService['restore'] = unsupported
  @Unsupported
  enablePortsFeatures: IRemoteExplorerService['enablePortsFeatures'] = unsupported
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
    unsupported
  @Unsupported
  unregisterDeclaredAuthenticationProvider: IAuthenticationService['unregisterDeclaredAuthenticationProvider'] =
    unsupported
  isAuthenticationProviderRegistered: IAuthenticationService['isAuthenticationProviderRegistered'] =
    () => false
  @Unsupported
  registerAuthenticationProvider: IAuthenticationService['registerAuthenticationProvider'] =
    unsupported
  @Unsupported
  unregisterAuthenticationProvider: IAuthenticationService['unregisterAuthenticationProvider'] =
    unsupported
  getProviderIds: IAuthenticationService['getProviderIds'] = () => []
  @Unsupported
  getProvider: IAuthenticationService['getProvider'] = unsupported
  @Unsupported
  getSessions: IAuthenticationService['getSessions'] = unsupported
  @Unsupported
  createSession: IAuthenticationService['createSession'] = unsupported
  @Unsupported
  removeSession: IAuthenticationService['removeSession'] = unsupported
  getOrActivateProviderIdForServer: IAuthenticationService['getOrActivateProviderIdForServer'] =
    async () => undefined
  registerAuthenticationProviderHostDelegate: IAuthenticationService['registerAuthenticationProviderHostDelegate'] =
    () => Disposable.None
  createDynamicAuthenticationProvider: IAuthenticationService['createDynamicAuthenticationProvider'] =
    async () => undefined

  isDynamicAuthenticationProvider: IAuthenticationService['isDynamicAuthenticationProvider'] = () =>
    false
}
registerSingleton(IAuthenticationService, AuthenticationService, InstantiationType.Delayed)
class AuthenticationAccessService implements IAuthenticationAccessService {
  _serviceBrand: undefined
  onDidChangeExtensionSessionAccess: IAuthenticationAccessService['onDidChangeExtensionSessionAccess'] =
    Event.None
  isAccessAllowed: IAuthenticationAccessService['isAccessAllowed'] = () => false
  readAllowedExtensions: IAuthenticationAccessService['readAllowedExtensions'] = () => []
  @Unsupported
  updateAllowedExtensions: IAuthenticationAccessService['updateAllowedExtensions'] = unsupported
  @Unsupported
  removeAllowedExtensions: IAuthenticationAccessService['removeAllowedExtensions'] = unsupported
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
  updateAccountPreference: IAuthenticationExtensionsService['updateAccountPreference'] = unsupported
  @Unsupported
  removeAccountPreference: IAuthenticationExtensionsService['removeAccountPreference'] = unsupported
  @Unsupported
  updateSessionPreference: IAuthenticationExtensionsService['updateSessionPreference'] = unsupported
  getSessionPreference: IAuthenticationExtensionsService['getSessionPreference'] = () => undefined
  @Unsupported
  removeSessionPreference: IAuthenticationExtensionsService['removeSessionPreference'] = unsupported
  @Unsupported
  selectSession: IAuthenticationExtensionsService['selectSession'] = unsupported
  @Unsupported
  requestSessionAccess: IAuthenticationExtensionsService['requestSessionAccess'] = unsupported
  @Unsupported
  requestNewSession: IAuthenticationExtensionsService['requestNewSession'] = unsupported

  @Unsupported
  updateNewSessionRequests: IAuthenticationExtensionsService['updateNewSessionRequests'] =
    unsupported
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
    unsupported
  extensionUsesAuth: IAuthenticationUsageService['extensionUsesAuth'] = async () => false
  @Unsupported
  readAccountUsages: IAuthenticationUsageService['readAccountUsages'] = unsupported
  @Unsupported
  removeAccountUsage: IAuthenticationUsageService['removeAccountUsage'] = unsupported
  @Unsupported
  addAccountUsage: IAuthenticationUsageService['addAccountUsage'] = unsupported
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
  registerTimelineProvider: ITimelineService['registerTimelineProvider'] = unsupported
  @Unsupported
  unregisterTimelineProvider: ITimelineService['unregisterTimelineProvider'] = unsupported
  getSources: ITimelineService['getSources'] = () => []
  @Unsupported
  getTimeline: ITimelineService['getTimeline'] = unsupported
  @Unsupported
  setUri: ITimelineService['setUri'] = unsupported
}
registerSingleton(ITimelineService, TimelineService, InstantiationType.Delayed)
class TestService implements ITestService {
  _serviceBrand: undefined
  getTestsRelatedToCode: ITestService['getTestsRelatedToCode'] = async () => []
  getCodeRelatedToTest: ITestService['getCodeRelatedToTest'] = async () => []
  registerExtHost: ITestService['registerExtHost'] = () => Disposable.None
  @Unsupported
  provideTestFollowups: ITestService['provideTestFollowups'] = unsupported
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
  registerTestController: ITestService['registerTestController'] = unsupported
  getTestController: ITestService['getTestController'] = () => undefined
  @Unsupported
  refreshTests: ITestService['refreshTests'] = unsupported
  @Unsupported
  cancelRefreshTests: ITestService['cancelRefreshTests'] = unsupported
  @Unsupported
  startContinuousRun: ITestService['startContinuousRun'] = unsupported
  @Unsupported
  runTests: ITestService['runTests'] = unsupported
  @Unsupported
  runResolvedTests: ITestService['runResolvedTests'] = unsupported
  @Unsupported
  syncTests: ITestService['syncTests'] = unsupported
  @Unsupported
  cancelTestRun: ITestService['cancelTestRun'] = unsupported
  @Unsupported
  publishDiff: ITestService['publishDiff'] = unsupported
}
registerSingleton(ITestService, TestService, InstantiationType.Delayed)
class SecretStorageService implements ISecretStorageService {
  _serviceBrand: undefined
  onDidChangeSecret: ISecretStorageService['onDidChangeSecret'] = Event.None
  type: ISecretStorageService['type'] = 'in-memory' as const
  get: ISecretStorageService['get'] = async () => undefined
  @Unsupported
  set: ISecretStorageService['set'] = unsupported
  @Unsupported
  delete: ISecretStorageService['delete'] = unsupported
}
registerSingleton(ISecretStorageService, SecretStorageService, InstantiationType.Delayed)
class ShareService implements IShareService {
  _serviceBrand: undefined
  @Unsupported
  registerShareProvider: IShareService['registerShareProvider'] = unsupported
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
  createFromProfile: IUserDataProfileImportExportService['createFromProfile'] = unsupported
  registerProfileContentHandler: IUserDataProfileImportExportService['registerProfileContentHandler'] =
    () => Disposable.None
  unregisterProfileContentHandler: IUserDataProfileImportExportService['unregisterProfileContentHandler'] =
    () => {}
  @Unsupported
  exportProfile: IUserDataProfileImportExportService['exportProfile'] = unsupported
  @Unsupported
  createTroubleshootProfile: IUserDataProfileImportExportService['createTroubleshootProfile'] =
    unsupported
}
registerSingleton(
  IUserDataProfileImportExportService,
  UserDataProfileImportExportService,
  InstantiationType.Delayed
)
class WorkbenchIssueService implements IWorkbenchIssueService {
  _serviceBrand: undefined
  @Unsupported
  openReporter: IWorkbenchIssueService['openReporter'] = unsupported
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
  toggleVisibility: ISCMViewService['toggleVisibility'] = unsupported
  @Unsupported
  toggleSortKey: ISCMViewService['toggleSortKey'] = unsupported
  focusedRepository: ISCMViewService['focusedRepository'] = undefined
  onDidFocusRepository: ISCMViewService['onDidFocusRepository'] = Event.None
  @Unsupported
  focus: ISCMViewService['focus'] = unsupported
  @Unsupported
  pinActiveRepository: ISCMViewService['pinActiveRepository'] = unsupported
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
    unsupported
  @Unsupported
  getCellExecutionsForNotebook: INotebookExecutionStateService['getCellExecutionsForNotebook'] =
    unsupported
  @Unsupported
  getCellExecutionsByHandleForNotebook: INotebookExecutionStateService['getCellExecutionsByHandleForNotebook'] =
    unsupported
  @Unsupported
  getCellExecution: INotebookExecutionStateService['getCellExecution'] = unsupported
  @Unsupported
  createCellExecution: INotebookExecutionStateService['createCellExecution'] = unsupported
  @Unsupported
  getExecution: INotebookExecutionStateService['getExecution'] = unsupported
  @Unsupported
  createExecution: INotebookExecutionStateService['createExecution'] = unsupported
  @Unsupported
  getLastFailedCellForNotebook: INotebookExecutionStateService['getLastFailedCellForNotebook'] =
    unsupported
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
  addProfile: ITestProfileService['addProfile'] = unsupported
  @Unsupported
  updateProfile: ITestProfileService['updateProfile'] = unsupported
  @Unsupported
  removeProfile: ITestProfileService['removeProfile'] = unsupported
  @Unsupported
  capabilitiesForTest: ITestProfileService['capabilitiesForTest'] = unsupported
  @Unsupported
  configure: ITestProfileService['configure'] = unsupported
  all: ITestProfileService['all'] = () => []
  getGroupDefaultProfiles: ITestProfileService['getGroupDefaultProfiles'] = () => []
  @Unsupported
  setGroupDefaultProfiles: ITestProfileService['setGroupDefaultProfiles'] = unsupported
  getControllerProfiles: ITestProfileService['getControllerProfiles'] = () => []
}
registerSingleton(ITestProfileService, TestProfileService, InstantiationType.Delayed)
class EncryptionService implements IEncryptionService {
  @Unsupported
  setUsePlainTextEncryption: IEncryptionService['setUsePlainTextEncryption'] = unsupported
  @Unsupported
  getKeyStorageProvider: IEncryptionService['getKeyStorageProvider'] = unsupported
  _serviceBrand: undefined
  @Unsupported
  encrypt: IEncryptionService['encrypt'] = unsupported
  @Unsupported
  decrypt: IEncryptionService['decrypt'] = unsupported
  @Unsupported
  isEncryptionAvailable: IEncryptionService['isEncryptionAvailable'] = unsupported
}
registerSingleton(IEncryptionService, EncryptionService, InstantiationType.Delayed)
class TestResultService implements ITestResultService {
  _serviceBrand: undefined
  onResultsChanged: ITestResultService['onResultsChanged'] = Event.None
  onTestChanged: ITestResultService['onTestChanged'] = Event.None
  results: ITestResultService['results'] = []
  @Unsupported
  clear: ITestResultService['clear'] = unsupported
  @Unsupported
  createLiveResult: ITestResultService['createLiveResult'] = unsupported
  @Unsupported
  push: ITestResultService['push'] = unsupported
  getResult: ITestResultService['getResult'] = () => undefined
  getStateById: ITestResultService['getStateById'] = () => undefined
}
registerSingleton(ITestResultService, TestResultService, InstantiationType.Delayed)
class TestResultStorage implements ITestResultStorage {
  _serviceBrand: undefined
  @Unsupported
  read: ITestResultStorage['read'] = unsupported
  @Unsupported
  persist: ITestResultStorage['persist'] = unsupported
}
registerSingleton(ITestResultStorage, TestResultStorage, InstantiationType.Delayed)
class TestingDecorationsService implements ITestingDecorationsService {
  _serviceBrand: undefined
  @Unsupported
  updateDecorationsAlternateAction: ITestingDecorationsService['updateDecorationsAlternateAction'] =
    unsupported
  onDidChange: ITestingDecorationsService['onDidChange'] = Event.None
  @Unsupported
  invalidateResultMessage: ITestingDecorationsService['invalidateResultMessage'] = unsupported
  @Unsupported
  syncDecorations: ITestingDecorationsService['syncDecorations'] = unsupported
  @Unsupported
  getDecoratedTestPosition: ITestingDecorationsService['getDecoratedTestPosition'] = unsupported
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
  sendChatRequest: ILanguageModelsService['sendChatRequest'] = unsupported
  @Unsupported
  selectLanguageModels: ILanguageModelsService['selectLanguageModels'] = unsupported
  @Unsupported
  computeTokenLength: ILanguageModelsService['computeTokenLength'] = unsupported
  onDidChangeLanguageModels: ILanguageModelsService['onDidChangeLanguageModels'] = Event.None
  getLanguageModelIds: ILanguageModelsService['getLanguageModelIds'] = () => []
  lookupLanguageModel: ILanguageModelsService['lookupLanguageModel'] = () => undefined
  @Unsupported
  updateModelPickerPreference: ILanguageModelsService['updateModelPickerPreference'] = unsupported
  getVendors: ILanguageModelsService['getVendors'] = () => []
  registerLanguageModelProvider: ILanguageModelsService['registerLanguageModelProvider'] = () =>
    Disposable.None
}
registerSingleton(ILanguageModelsService, LanguageModelsService, InstantiationType.Delayed)
class ChatSlashCommandService implements IChatSlashCommandService {
  @Unsupported
  onDidChangeCommands: IChatSlashCommandService['onDidChangeCommands'] = unsupported
  @Unsupported
  registerSlashCommand: IChatSlashCommandService['registerSlashCommand'] = unsupported
  @Unsupported
  executeCommand: IChatSlashCommandService['executeCommand'] = unsupported
  @Unsupported
  getCommands: IChatSlashCommandService['getCommands'] = unsupported
  @Unsupported
  hasCommand: IChatSlashCommandService['hasCommand'] = unsupported
  _serviceBrand: undefined
}
registerSingleton(IChatSlashCommandService, ChatSlashCommandService, InstantiationType.Delayed)
class ChatVariablesService implements IChatVariablesService {
  _serviceBrand: undefined
  @Unsupported
  getDynamicVariables: IChatVariablesService['getDynamicVariables'] = unsupported
  @Unsupported
  getSelectedToolAndToolSets: IChatVariablesService['getSelectedToolAndToolSets'] = unsupported
}
registerSingleton(IChatVariablesService, ChatVariablesService, InstantiationType.Delayed)
class AiRelatedInformationService implements IAiRelatedInformationService {
  isEnabled: IAiRelatedInformationService['isEnabled'] = () => false
  @Unsupported
  getRelatedInformation: IAiRelatedInformationService['getRelatedInformation'] = unsupported
  @Unsupported
  registerAiRelatedInformationProvider: IAiRelatedInformationService['registerAiRelatedInformationProvider'] =
    unsupported
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
  getEmbeddingVector: IAiEmbeddingVectorService['getEmbeddingVector'] = unsupported
  @Unsupported
  registerAiEmbeddingVectorProvider: IAiEmbeddingVectorService['registerAiEmbeddingVectorProvider'] =
    unsupported
}
registerSingleton(IAiEmbeddingVectorService, AiEmbeddingVectorService, InstantiationType.Delayed)
class AiSettingsSearchService implements IAiSettingsSearchService {
  _serviceBrand: undefined
  isEnabled: IAiSettingsSearchService['isEnabled'] = () => false
  @Unsupported
  startSearch: IAiSettingsSearchService['startSearch'] = unsupported
  getEmbeddingsResults: IAiSettingsSearchService['getEmbeddingsResults'] = async () => []
  getLLMRankedResults: IAiSettingsSearchService['getLLMRankedResults'] = async () => []
  @Unsupported
  registerSettingsSearchProvider: IAiSettingsSearchService['registerSettingsSearchProvider'] =
    unsupported
  @Unsupported
  handleSearchResult: IAiSettingsSearchService['handleSearchResult'] = unsupported
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
  isEnabledForProfile: ITestingContinuousRunService['isEnabledForProfile'] = unsupported
  @Unsupported
  stopProfile: ITestingContinuousRunService['stopProfile'] = unsupported
  lastRunProfileIds: ITestingContinuousRunService['lastRunProfileIds'] = new Set<number>()
  onDidChange: ITestingContinuousRunService['onDidChange'] = Event.None
  isSpecificallyEnabledFor: ITestingContinuousRunService['isSpecificallyEnabledFor'] = () => false
  isEnabledForAParentOf: ITestingContinuousRunService['isEnabledForAParentOf'] = () => false
  isEnabledForAChildOf: ITestingContinuousRunService['isEnabledForAChildOf'] = () => false
  isEnabled: ITestingContinuousRunService['isEnabled'] = () => false
  @Unsupported
  start: ITestingContinuousRunService['start'] = unsupported
  @Unsupported
  stop: ITestingContinuousRunService['stop'] = unsupported
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
  didSelectTestInExplorer: ITestExplorerFilterState['didSelectTestInExplorer'] = unsupported
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
  focusInput: ITestExplorerFilterState['focusInput'] = unsupported
  @Unsupported
  setText: ITestExplorerFilterState['setText'] = unsupported
  isFilteringFor: ITestExplorerFilterState['isFilteringFor'] = () => false
  @Unsupported
  toggleFilteringFor: ITestExplorerFilterState['toggleFilteringFor'] = unsupported
}
registerSingleton(ITestExplorerFilterState, TestExplorerFilterState, InstantiationType.Delayed)
class TestingPeekOpener implements ITestingPeekOpener {
  _serviceBrand: undefined
  @Unsupported
  get historyVisible() {
    return unsupported()
  }
  @Unsupported
  tryPeekFirstError: ITestingPeekOpener['tryPeekFirstError'] = unsupported
  @Unsupported
  peekUri: ITestingPeekOpener['peekUri'] = unsupported
  @Unsupported
  openCurrentInEditor: ITestingPeekOpener['openCurrentInEditor'] = unsupported
  @Unsupported
  open: ITestingPeekOpener['open'] = unsupported
  @Unsupported
  closeAllPeeks: ITestingPeekOpener['closeAllPeeks'] = unsupported
}
registerSingleton(ITestingPeekOpener, TestingPeekOpener, InstantiationType.Delayed)
class AuxiliaryWindowService implements IAuxiliaryWindowService {
  _serviceBrand: undefined
  getWindow: IAuxiliaryWindowService['getWindow'] = () => undefined
  onDidOpenAuxiliaryWindow: IAuxiliaryWindowService['onDidOpenAuxiliaryWindow'] = Event.None
  @Unsupported
  open: IAuxiliaryWindowService['open'] = unsupported
}
registerSingleton(IAuxiliaryWindowService, AuxiliaryWindowService, InstantiationType.Delayed)
class SpeechService implements ISpeechService {
  _serviceBrand: undefined
  onDidStartTextToSpeechSession: ISpeechService['onDidStartTextToSpeechSession'] = Event.None
  onDidEndTextToSpeechSession: ISpeechService['onDidEndTextToSpeechSession'] = Event.None
  hasActiveTextToSpeechSession: ISpeechService['hasActiveTextToSpeechSession'] = false
  @Unsupported
  createTextToSpeechSession: ISpeechService['createTextToSpeechSession'] = unsupported
  onDidChangeHasSpeechProvider: ISpeechService['onDidChangeHasSpeechProvider'] = Event.None
  onDidStartSpeechToTextSession: ISpeechService['onDidStartSpeechToTextSession'] = Event.None
  onDidEndSpeechToTextSession: ISpeechService['onDidEndSpeechToTextSession'] = Event.None
  hasActiveSpeechToTextSession: ISpeechService['hasActiveSpeechToTextSession'] = false
  onDidStartKeywordRecognition: ISpeechService['onDidStartKeywordRecognition'] = Event.None
  onDidEndKeywordRecognition: ISpeechService['onDidEndKeywordRecognition'] = Event.None
  hasActiveKeywordRecognition: ISpeechService['hasActiveKeywordRecognition'] = false
  @Unsupported
  recognizeKeyword: ISpeechService['recognizeKeyword'] = unsupported
  hasSpeechProvider: ISpeechService['hasSpeechProvider'] = false
  @Unsupported
  registerSpeechProvider: ISpeechService['registerSpeechProvider'] = unsupported
  @Unsupported
  createSpeechToTextSession: ISpeechService['createSpeechToTextSession'] = unsupported
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
  openCoverage: ITestCoverageService['openCoverage'] = unsupported
  @Unsupported
  closeCoverage: ITestCoverageService['closeCoverage'] = unsupported
}
registerSingleton(ITestCoverageService, TestCoverageService, InstantiationType.Delayed)
class ChatAccessibilityService implements IChatAccessibilityService {
  _serviceBrand: undefined
  @Unsupported
  acceptRequest: IChatAccessibilityService['acceptRequest'] = unsupported
  @Unsupported
  acceptResponse: IChatAccessibilityService['acceptResponse'] = unsupported
  @Unsupported
  acceptElicitation: IChatAccessibilityService['acceptElicitation'] = unsupported
}
registerSingleton(IChatAccessibilityService, ChatAccessibilityService, InstantiationType.Delayed)
class ChatWidgetHistoryService implements IChatWidgetHistoryService {
  _serviceBrand: undefined
  onDidClearHistory: IChatWidgetHistoryService['onDidClearHistory'] = Event.None
  @Unsupported
  clearHistory: IChatWidgetHistoryService['clearHistory'] = unsupported
  getHistory: IChatWidgetHistoryService['getHistory'] = () => []
  @Unsupported
  saveHistory: IChatWidgetHistoryService['saveHistory'] = unsupported
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
  moveSession: IInlineChatSessionService['moveSession'] = unsupported
  @Unsupported
  getCodeEditor: IInlineChatSessionService['getCodeEditor'] = unsupported
  @Unsupported
  stashSession: IInlineChatSessionService['stashSession'] = unsupported
  onWillStartSession: IInlineChatSessionService['onWillStartSession'] = Event.None
  onDidEndSession: IInlineChatSessionService['onDidEndSession'] = Event.None
  @Unsupported
  createSession: IInlineChatSessionService['createSession'] = unsupported
  getSession: IInlineChatSessionService['getSession'] = () => undefined
  @Unsupported
  releaseSession: IInlineChatSessionService['releaseSession'] = unsupported
  @Unsupported
  registerSessionKeyComputer: IInlineChatSessionService['registerSessionKeyComputer'] = unsupported
  @Unsupported
  dispose: IInlineChatSessionService['dispose'] = unsupported
  @Unsupported
  createSession2: IInlineChatSessionService['createSession2'] = unsupported
  getSession2: IInlineChatSessionService['getSession2'] = () => undefined
  onDidChangeSessions = Event.None
}
registerSingleton(IInlineChatSessionService, InlineChatSessionService, InstantiationType.Delayed)
class NotebookEditorWorkerService implements INotebookEditorWorkerService {
  _serviceBrand: undefined
  canComputeDiff: INotebookEditorWorkerService['canComputeDiff'] = () => false
  @Unsupported
  computeDiff: INotebookEditorWorkerService['computeDiff'] = unsupported
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
  getKernels: INotebookKernelHistoryService['getKernels'] = unsupported
  @Unsupported
  addMostRecentKernel: INotebookKernelHistoryService['addMostRecentKernel'] = unsupported
}
registerSingleton(
  INotebookKernelHistoryService,
  NotebookKernelHistoryService,
  InstantiationType.Delayed
)
class NotebookExecutionService implements INotebookExecutionService {
  _serviceBrand: undefined
  @Unsupported
  executeNotebookCells: INotebookExecutionService['executeNotebookCells'] = unsupported
  @Unsupported
  cancelNotebookCells: INotebookExecutionService['cancelNotebookCells'] = unsupported
  @Unsupported
  cancelNotebookCellHandles: INotebookExecutionService['cancelNotebookCellHandles'] = unsupported
  @Unsupported
  registerExecutionParticipant: INotebookExecutionService['registerExecutionParticipant'] =
    unsupported
}
registerSingleton(INotebookExecutionService, NotebookExecutionService, InstantiationType.Delayed)
class NotebookKeymapService implements INotebookKeymapService {
  _serviceBrand: undefined
}
registerSingleton(INotebookKeymapService, NotebookKeymapService, InstantiationType.Delayed)
class NotebookLoggingService implements INotebookLoggingService {
  _serviceBrand: undefined
  @Unsupported
  info: INotebookLoggingService['info'] = unsupported
  @Unsupported
  debug: INotebookLoggingService['debug'] = unsupported
  @Unsupported
  warn: INotebookLoggingService['warn'] = unsupported
  @Unsupported
  error: INotebookLoggingService['error'] = unsupported
}
registerSingleton(INotebookLoggingService, NotebookLoggingService, InstantiationType.Delayed)
class WalkthroughsService implements IWalkthroughsService {
  _serviceBrand: undefined
  onDidAddWalkthrough: IWalkthroughsService['onDidAddWalkthrough'] = Event.None
  onDidRemoveWalkthrough: IWalkthroughsService['onDidRemoveWalkthrough'] = Event.None
  onDidChangeWalkthrough: IWalkthroughsService['onDidChangeWalkthrough'] = Event.None
  onDidProgressStep: IWalkthroughsService['onDidProgressStep'] = Event.None
  @Unsupported
  getWalkthroughs: IWalkthroughsService['getWalkthroughs'] = unsupported
  @Unsupported
  getWalkthrough: IWalkthroughsService['getWalkthrough'] = unsupported
  @Unsupported
  registerWalkthrough: IWalkthroughsService['registerWalkthrough'] = unsupported
  @Unsupported
  progressByEvent: IWalkthroughsService['progressByEvent'] = unsupported
  @Unsupported
  progressStep: IWalkthroughsService['progressStep'] = unsupported
  @Unsupported
  deprogressStep: IWalkthroughsService['deprogressStep'] = unsupported
  @Unsupported
  markWalkthroughOpened: IWalkthroughsService['markWalkthroughOpened'] = unsupported
}
registerSingleton(IWalkthroughsService, WalkthroughsService, InstantiationType.Delayed)
class UserDataSyncStoreManagementService implements IUserDataSyncStoreManagementService {
  _serviceBrand: undefined
  onDidChangeUserDataSyncStore: IUserDataSyncStoreManagementService['onDidChangeUserDataSyncStore'] =
    Event.None
  userDataSyncStore: IUserDataSyncStoreManagementService['userDataSyncStore'] = undefined
  @Unsupported
  switch: IUserDataSyncStoreManagementService['switch'] = unsupported
  @Unsupported
  getPreviousUserDataSyncStore: IUserDataSyncStoreManagementService['getPreviousUserDataSyncStore'] =
    unsupported
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
  setAuthToken: IUserDataSyncStoreService['setAuthToken'] = unsupported
  @Unsupported
  manifest: IUserDataSyncStoreService['manifest'] = unsupported
  @Unsupported
  readResource: IUserDataSyncStoreService['readResource'] = unsupported
  @Unsupported
  writeResource: IUserDataSyncStoreService['writeResource'] = unsupported
  @Unsupported
  deleteResource: IUserDataSyncStoreService['deleteResource'] = unsupported
  @Unsupported
  getAllResourceRefs: IUserDataSyncStoreService['getAllResourceRefs'] = unsupported
  @Unsupported
  resolveResourceContent: IUserDataSyncStoreService['resolveResourceContent'] = unsupported
  @Unsupported
  getAllCollections: IUserDataSyncStoreService['getAllCollections'] = unsupported
  @Unsupported
  createCollection: IUserDataSyncStoreService['createCollection'] = unsupported
  @Unsupported
  deleteCollection: IUserDataSyncStoreService['deleteCollection'] = unsupported
  @Unsupported
  getActivityData: IUserDataSyncStoreService['getActivityData'] = unsupported
  @Unsupported
  clear: IUserDataSyncStoreService['clear'] = unsupported
  getLatestData: IUserDataSyncStoreService['getLatestData'] = async () => null
}
registerSingleton(IUserDataSyncStoreService, UserDataSyncStoreService, InstantiationType.Delayed)
class UserDataSyncLogService implements IUserDataSyncLogService {
  _serviceBrand: undefined
  onDidChangeLogLevel: IUserDataSyncLogService['onDidChangeLogLevel'] = Event.None
  @Unsupported
  getLevel: IUserDataSyncLogService['getLevel'] = unsupported
  @Unsupported
  setLevel: IUserDataSyncLogService['setLevel'] = unsupported
  @Unsupported
  trace: IUserDataSyncLogService['trace'] = unsupported
  @Unsupported
  debug: IUserDataSyncLogService['debug'] = unsupported
  @Unsupported
  info: IUserDataSyncLogService['info'] = unsupported
  @Unsupported
  warn: IUserDataSyncLogService['warn'] = unsupported
  @Unsupported
  error: IUserDataSyncLogService['error'] = unsupported
  @Unsupported
  flush: IUserDataSyncLogService['flush'] = unsupported
  @Unsupported
  dispose: IUserDataSyncLogService['dispose'] = unsupported
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
  createSyncTask: IUserDataSyncService['createSyncTask'] = unsupported
  @Unsupported
  createManualSyncTask: IUserDataSyncService['createManualSyncTask'] = unsupported
  @Unsupported
  resolveContent: IUserDataSyncService['resolveContent'] = unsupported
  @Unsupported
  accept: IUserDataSyncService['accept'] = unsupported
  @Unsupported
  reset: IUserDataSyncService['reset'] = unsupported
  @Unsupported
  resetRemote: IUserDataSyncService['resetRemote'] = unsupported
  @Unsupported
  cleanUpRemoteData: IUserDataSyncService['cleanUpRemoteData'] = unsupported
  @Unsupported
  resetLocal: IUserDataSyncService['resetLocal'] = unsupported
  @Unsupported
  hasLocalData: IUserDataSyncService['hasLocalData'] = unsupported
  @Unsupported
  hasPreviouslySynced: IUserDataSyncService['hasPreviouslySynced'] = unsupported
  @Unsupported
  replace: IUserDataSyncService['replace'] = unsupported
  @Unsupported
  saveRemoteActivityData: IUserDataSyncService['saveRemoteActivityData'] = unsupported
  @Unsupported
  extractActivityData: IUserDataSyncService['extractActivityData'] = unsupported
}
registerSingleton(IUserDataSyncService, UserDataSyncService, InstantiationType.Delayed)
class UserDataSyncMachinesService implements IUserDataSyncMachinesService {
  _serviceBrand: undefined
  onDidChange: IUserDataSyncMachinesService['onDidChange'] = Event.None
  @Unsupported
  getMachines: IUserDataSyncMachinesService['getMachines'] = unsupported
  @Unsupported
  addCurrentMachine: IUserDataSyncMachinesService['addCurrentMachine'] = unsupported
  @Unsupported
  removeCurrentMachine: IUserDataSyncMachinesService['removeCurrentMachine'] = unsupported
  @Unsupported
  renameMachine: IUserDataSyncMachinesService['renameMachine'] = unsupported
  @Unsupported
  setEnablements: IUserDataSyncMachinesService['setEnablements'] = unsupported
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
    unsupported
  @Unsupported
  getLocalSyncedProfiles: IUserDataSyncResourceProviderService['getLocalSyncedProfiles'] =
    unsupported
  @Unsupported
  getRemoteSyncResourceHandles: IUserDataSyncResourceProviderService['getRemoteSyncResourceHandles'] =
    unsupported
  @Unsupported
  getLocalSyncResourceHandles: IUserDataSyncResourceProviderService['getLocalSyncResourceHandles'] =
    unsupported
  @Unsupported
  getAssociatedResources: IUserDataSyncResourceProviderService['getAssociatedResources'] =
    unsupported
  @Unsupported
  getMachineId: IUserDataSyncResourceProviderService['getMachineId'] = unsupported
  @Unsupported
  getLocalSyncedMachines: IUserDataSyncResourceProviderService['getLocalSyncedMachines'] =
    unsupported
  @Unsupported
  resolveContent: IUserDataSyncResourceProviderService['resolveContent'] = unsupported
  @Unsupported
  resolveUserDataSyncResource: IUserDataSyncResourceProviderService['resolveUserDataSyncResource'] =
    unsupported
}
registerSingleton(
  IUserDataSyncResourceProviderService,
  UserDataSyncResourceProviderService,
  InstantiationType.Delayed
)
class UserDataSyncLocalStoreService implements IUserDataSyncLocalStoreService {
  _serviceBrand: undefined
  @Unsupported
  writeResource: IUserDataSyncLocalStoreService['writeResource'] = unsupported
  @Unsupported
  getAllResourceRefs: IUserDataSyncLocalStoreService['getAllResourceRefs'] = unsupported
  @Unsupported
  resolveResourceContent: IUserDataSyncLocalStoreService['resolveResourceContent'] = unsupported
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
  resolveUserBindings: IUserDataSyncUtilService['resolveUserBindings'] = unsupported
  @Unsupported
  resolveFormattingOptions: IUserDataSyncUtilService['resolveFormattingOptions'] = unsupported
}
registerSingleton(IUserDataSyncUtilService, UserDataSyncUtilService, InstantiationType.Delayed)
class UserDataProfileManagementService implements IUserDataProfileManagementService {
  _serviceBrand: undefined
  @Unsupported
  getDefaultProfileToUse: IUserDataProfileManagementService['getDefaultProfileToUse'] = unsupported
  @Unsupported
  createProfile: IUserDataProfileManagementService['createProfile'] = unsupported
  @Unsupported
  createAndEnterProfile: IUserDataProfileManagementService['createAndEnterProfile'] = unsupported
  @Unsupported
  createAndEnterTransientProfile: IUserDataProfileManagementService['createAndEnterTransientProfile'] =
    unsupported
  @Unsupported
  removeProfile: IUserDataProfileManagementService['removeProfile'] = unsupported
  @Unsupported
  updateProfile: IUserDataProfileManagementService['updateProfile'] = unsupported
  @Unsupported
  switchProfile: IUserDataProfileManagementService['switchProfile'] = unsupported
  @Unsupported
  getBuiltinProfileTemplates: IUserDataProfileManagementService['getBuiltinProfileTemplates'] =
    unsupported
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
  addEntry: IWorkingCopyHistoryService['addEntry'] = unsupported
  @Unsupported
  updateEntry: IWorkingCopyHistoryService['updateEntry'] = unsupported
  @Unsupported
  removeEntry: IWorkingCopyHistoryService['removeEntry'] = unsupported
  @Unsupported
  moveEntries: IWorkingCopyHistoryService['moveEntries'] = unsupported
  getEntries: IWorkingCopyHistoryService['getEntries'] = async () => []
  getAll: IWorkingCopyHistoryService['getAll'] = async () => []
  @Unsupported
  removeAll: IWorkingCopyHistoryService['removeAll'] = unsupported
}
registerSingleton(IWorkingCopyHistoryService, WorkingCopyHistoryService, InstantiationType.Delayed)
class NotebookDocumentService implements INotebookDocumentService {
  _serviceBrand: undefined
  getNotebook: INotebookDocumentService['getNotebook'] = () => undefined
  @Unsupported
  addNotebookDocument: INotebookDocumentService['addNotebookDocument'] = unsupported
  @Unsupported
  removeNotebookDocument: INotebookDocumentService['removeNotebookDocument'] = unsupported
}
registerSingleton(INotebookDocumentService, NotebookDocumentService, InstantiationType.Delayed)
class DebugVisualizerService implements IDebugVisualizerService {
  _serviceBrand: undefined
  @Unsupported
  registerTree: IDebugVisualizerService['registerTree'] = unsupported
  @Unsupported
  getVisualizedNodeFor: IDebugVisualizerService['getVisualizedNodeFor'] = unsupported
  @Unsupported
  getVisualizedChildren: IDebugVisualizerService['getVisualizedChildren'] = unsupported
  @Unsupported
  editTreeItem: IDebugVisualizerService['editTreeItem'] = unsupported
  @Unsupported
  getApplicableFor: IDebugVisualizerService['getApplicableFor'] = unsupported
  @Unsupported
  register: IDebugVisualizerService['register'] = unsupported
}
registerSingleton(IDebugVisualizerService, DebugVisualizerService, InstantiationType.Delayed)
class EditSessionsLogService implements IEditSessionsLogService {
  _serviceBrand: undefined
  onDidChangeLogLevel: IEditSessionsLogService['onDidChangeLogLevel'] = Event.None
  @Unsupported
  getLevel: IEditSessionsLogService['getLevel'] = unsupported
  @Unsupported
  setLevel: IEditSessionsLogService['setLevel'] = unsupported
  @Unsupported
  trace: IEditSessionsLogService['trace'] = unsupported
  @Unsupported
  debug: IEditSessionsLogService['debug'] = unsupported
  @Unsupported
  info: IEditSessionsLogService['info'] = unsupported
  @Unsupported
  warn: IEditSessionsLogService['warn'] = unsupported
  @Unsupported
  error: IEditSessionsLogService['error'] = unsupported
  @Unsupported
  flush: IEditSessionsLogService['flush'] = unsupported
  @Unsupported
  dispose: IEditSessionsLogService['dispose'] = unsupported
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
  initialize: IEditSessionsStorageService['initialize'] = unsupported
  @Unsupported
  read: IEditSessionsStorageService['read'] = unsupported
  @Unsupported
  write: IEditSessionsStorageService['write'] = unsupported
  @Unsupported
  delete: IEditSessionsStorageService['delete'] = unsupported
  @Unsupported
  list: IEditSessionsStorageService['list'] = unsupported
  @Unsupported
  getMachineById: IEditSessionsStorageService['getMachineById'] = unsupported
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
  setEnablement: IExtensionFeaturesManagementService['setEnablement'] = unsupported
  @Unsupported
  getEnablementData: IExtensionFeaturesManagementService['getEnablementData'] = unsupported
  @Unsupported
  getAccess: IExtensionFeaturesManagementService['getAccess'] = unsupported
  onDidChangeAccessData: IExtensionFeaturesManagementService['onDidChangeAccessData'] = Event.None
  getAccessData: IExtensionFeaturesManagementService['getAccessData'] = () => undefined
  @Unsupported
  setStatus: IExtensionFeaturesManagementService['setStatus'] = unsupported
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
  matches: IWorkspaceIdentityService['matches'] = unsupported
  @Unsupported
  getWorkspaceStateFolders: IWorkspaceIdentityService['getWorkspaceStateFolders'] = unsupported
}
registerSingleton(IWorkspaceIdentityService, WorkspaceIdentityService, InstantiationType.Delayed)
class DefaultLogLevelsService implements IDefaultLogLevelsService {
  _serviceBrand: undefined
  onDidChangeDefaultLogLevels: IDefaultLogLevelsService['onDidChangeDefaultLogLevels'] = Event.None
  getDefaultLogLevel: IDefaultLogLevelsService['getDefaultLogLevel'] = async () => LogLevel.Off
  @Unsupported
  getDefaultLogLevels: IDefaultLogLevelsService['getDefaultLogLevels'] = unsupported
  @Unsupported
  setDefaultLogLevel: IDefaultLogLevelsService['setDefaultLogLevel'] = unsupported
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
  start: ITroubleshootIssueService['start'] = unsupported
  @Unsupported
  resume: ITroubleshootIssueService['resume'] = unsupported
  @Unsupported
  stop: ITroubleshootIssueService['stop'] = unsupported
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
  registerToolData: ILanguageModelToolsService['registerToolData'] = () => Disposable.None
  registerToolImplementation: ILanguageModelToolsService['registerToolImplementation'] = () =>
    Disposable.None
  getTools: ILanguageModelToolsService['getTools'] = () => []
  @Unsupported
  invokeTool: ILanguageModelToolsService['invokeTool'] = unsupported
  @Unsupported
  cancelToolCallsForRequest: ILanguageModelToolsService['cancelToolCallsForRequest'] = unsupported
  @Unsupported
  setToolAutoConfirmation: ILanguageModelToolsService['setToolAutoConfirmation'] = unsupported
  @Unsupported
  resetToolAutoConfirmation: ILanguageModelToolsService['resetToolAutoConfirmation'] = unsupported
  getToolSetByName: ILanguageModelToolsService['getToolSetByName'] = () => undefined
  @Unsupported
  createToolSet: ILanguageModelToolsService['createToolSet'] = unsupported
  toolSets: ILanguageModelToolsService['toolSets'] = constObservable([])

  @Unsupported
  toToolEnablementMap: ILanguageModelToolsService['toToolEnablementMap'] = unsupported

  @Unsupported
  toToolAndToolSetEnablementMap: ILanguageModelToolsService['toToolAndToolSetEnablementMap'] =
    unsupported
  @Unsupported
  registerTool: ILanguageModelToolsService['registerTool'] = unsupported
  @Unsupported
  getToolAutoConfirmation: ILanguageModelToolsService['getToolAutoConfirmation'] = unsupported

  getToolSet: ILanguageModelToolsService['getToolSet'] = () => undefined
}
registerSingleton(ILanguageModelToolsService, LanguageModelToolsService, InstantiationType.Delayed)
class IssueFormService implements IIssueFormService {
  _serviceBrand: undefined
  @Unsupported
  openReporter: IIssueFormService['openReporter'] = unsupported
  @Unsupported
  reloadWithExtensionsDisabled: IIssueFormService['reloadWithExtensionsDisabled'] = unsupported
  @Unsupported
  showConfirmCloseDialog: IIssueFormService['showConfirmCloseDialog'] = unsupported
  @Unsupported
  showClipboardDialog: IIssueFormService['showClipboardDialog'] = unsupported
  @Unsupported
  sendReporterMenu: IIssueFormService['sendReporterMenu'] = unsupported
  @Unsupported
  closeReporter: IIssueFormService['closeReporter'] = unsupported
}
registerSingleton(IIssueFormService, IssueFormService, InstantiationType.Delayed)
class CodeMapperService implements ICodeMapperService {
  _serviceBrand: undefined
  providers: ICodeMapperService['providers'] = []
  @Unsupported
  registerCodeMapperProvider: ICodeMapperService['registerCodeMapperProvider'] = unsupported
  mapCode: ICodeMapperService['mapCode'] = async () => undefined
}
registerSingleton(ICodeMapperService, CodeMapperService, InstantiationType.Delayed)
class ChatEditingService implements IChatEditingService {
  _serviceBrand: undefined
  editingSessionsObs: IChatEditingService['editingSessionsObs'] = constObservable([])
  hasRelatedFilesProviders: IChatEditingService['hasRelatedFilesProviders'] = () => false
  @Unsupported
  registerRelatedFilesProvider: IChatEditingService['registerRelatedFilesProvider'] = () => {
    return unsupported()
  }
  getRelatedFiles: IChatEditingService['getRelatedFiles'] = async () => undefined
  getEditingSession: IChatEditingService['getEditingSession'] = () => undefined
  @Unsupported
  startOrContinueGlobalEditingSession: IChatEditingService['startOrContinueGlobalEditingSession'] =
    unsupported
  @Unsupported
  createEditingSession: IChatEditingService['createEditingSession'] = unsupported
}
registerSingleton(IChatEditingService, ChatEditingService, InstantiationType.Delayed)
class ActionViewItemService implements IActionViewItemService {
  _serviceBrand: undefined
  onDidChange: IActionViewItemService['onDidChange'] = Event.None
  @Unsupported
  register: IActionViewItemService['register'] = unsupported
  lookUp: IActionViewItemService['lookUp'] = () => undefined
}
registerSingleton(IActionViewItemService, ActionViewItemService, InstantiationType.Delayed)
class LanguageModelIgnoredFilesService implements ILanguageModelIgnoredFilesService {
  _serviceBrand: undefined
  fileIsIgnored: ILanguageModelIgnoredFilesService['fileIsIgnored'] = async () => false
  @Unsupported
  registerIgnoredFileProvider: ILanguageModelIgnoredFilesService['registerIgnoredFileProvider'] =
    unsupported
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
    unsupported
  @Unsupported
  addWorkspaceToTransferred: IChatTransferService['addWorkspaceToTransferred'] = unsupported
}
registerSingleton(IChatTransferService, ChatTransferService, InstantiationType.Delayed)
class ChatStatusItemService implements IChatStatusItemService {
  _serviceBrand: undefined
  onDidChange: IChatStatusItemService['onDidChange'] = Event.None
  @Unsupported
  setOrUpdateEntry: IChatStatusItemService['setOrUpdateEntry'] = unsupported
  @Unsupported
  deleteEntry: IChatStatusItemService['deleteEntry'] = unsupported
  @Unsupported
  getEntries: IChatStatusItemService['getEntries'] = unsupported
}
registerSingleton(IChatStatusItemService, ChatStatusItemService, InstantiationType.Delayed)
class NotebookOriginalCellModelFactory implements INotebookOriginalCellModelFactory {
  _serviceBrand: undefined
  @Unsupported
  getOrCreate: INotebookOriginalCellModelFactory['getOrCreate'] = unsupported
}
registerSingleton(
  INotebookOriginalCellModelFactory,
  NotebookOriginalCellModelFactory,
  InstantiationType.Delayed
)
class NotebookOriginalModelReferenceFactory implements INotebookOriginalModelReferenceFactory {
  _serviceBrand: undefined
  @Unsupported
  getOrCreate: INotebookOriginalModelReferenceFactory['getOrCreate'] = unsupported
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
  onDidChangeProviders: ITerminalCompletionService['onDidChangeProviders'] = Event.None
  @Unsupported
  get providers(): never {
    return unsupported()
  }
  @Unsupported
  registerTerminalCompletionProvider: ITerminalCompletionService['registerTerminalCompletionProvider'] =
    unsupported
  @Unsupported
  provideCompletions: ITerminalCompletionService['provideCompletions'] = unsupported
}
registerSingleton(ITerminalCompletionService, TerminalCompletionService, InstantiationType.Delayed)
class ChatEntitlementsService implements IChatEntitlementService {
  _serviceBrand: undefined
  organisations: IChatEntitlementService['organisations'] = undefined
  isInternal: IChatEntitlementService['isInternal'] = false
  sku: IChatEntitlementService['sku'] = undefined
  onDidChangeEntitlement: IChatEntitlementService['onDidChangeEntitlement'] = Event.None
  onDidChangeQuotaExceeded: IChatEntitlementService['onDidChangeQuotaExceeded'] = Event.None
  onDidChangeQuotaRemaining: IChatEntitlementService['onDidChangeQuotaRemaining'] = Event.None
  onDidChangeSentiment: IChatEntitlementService['onDidChangeSentiment'] = Event.None
  @Unsupported
  get entitlement(): IChatEntitlementService['entitlement'] {
    return unsupported()
  }
  @Unsupported
  get quotas(): IChatEntitlementService['quotas'] {
    return unsupported()
  }
  @Unsupported
  get sentiment(): IChatEntitlementService['sentiment'] {
    return unsupported()
  }
  @Unsupported
  update: IChatEntitlementService['update'] = unsupported
}
registerSingleton(IChatEntitlementService, ChatEntitlementsService, InstantiationType.Eager)
class PromptsService implements IPromptsService {
  _serviceBrand: undefined
  @Unsupported
  getSyntaxParserFor: IPromptsService['getSyntaxParserFor'] = unsupported
  listPromptFiles: IPromptsService['listPromptFiles'] = async () => []
  getSourceFolders: IPromptsService['getSourceFolders'] = () => []
  dispose: IPromptsService['dispose'] = (): void => {}
  asPromptSlashCommand: IPromptsService['asPromptSlashCommand'] = () => undefined
  resolvePromptSlashCommand: IPromptsService['resolvePromptSlashCommand'] = async () => undefined
  findPromptSlashCommands: IPromptsService['findPromptSlashCommands'] = async () => []
  onDidChangeCustomChatModes: IPromptsService['onDidChangeCustomChatModes'] = Event.None
  getCustomChatModes: IPromptsService['getCustomChatModes'] = async () => []
  @Unsupported
  parse: IPromptsService['parse'] = unsupported
  getPromptFileType: IPromptsService['getPromptFileType'] = () => undefined
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
  registerCollection: IMcpRegistry['registerCollection'] = unsupported
  @Unsupported
  clearSavedInputs: IMcpRegistry['clearSavedInputs'] = unsupported
  @Unsupported
  editSavedInput: IMcpRegistry['editSavedInput'] = unsupported
  @Unsupported
  getSavedInputs: IMcpRegistry['getSavedInputs'] = unsupported
  @Unsupported
  resolveConnection: IMcpRegistry['resolveConnection'] = unsupported
  registerDelegate: IMcpRegistry['registerDelegate'] = (): IDisposable => {
    return Disposable.None
  }
  @Unsupported
  setSavedInput: IMcpRegistry['setSavedInput'] = unsupported
  @Unsupported
  getServerDefinition: IMcpRegistry['getServerDefinition'] = unsupported
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
  resetCaches: IMcpService['resetCaches'] = unsupported
  @Unsupported
  activateCollections: IMcpService['activateCollections'] = unsupported
  @Unsupported
  resetTrust: IMcpService['resetTrust'] = unsupported
  @Unsupported
  autostart: IMcpService['autostart'] = unsupported
}
registerSingleton(IMcpService, McpService, InstantiationType.Eager)
class ExtensionGalleryManifestService implements IExtensionGalleryManifestService {
  _serviceBrand: undefined
  onDidChangeExtensionGalleryManifest: IExtensionGalleryManifestService['onDidChangeExtensionGalleryManifest'] =
    Event.None
  onDidChangeExtensionGalleryManifestStatus: IExtensionGalleryManifestService['onDidChangeExtensionGalleryManifestStatus'] =
    Event.None
  getExtensionGalleryManifest: IExtensionGalleryManifestService['getExtensionGalleryManifest'] =
    async () => null

  @Unsupported
  get extensionGalleryManifestStatus(): IExtensionGalleryManifestService['extensionGalleryManifestStatus'] {
    return unsupported()
  }
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
  getClientRegistration: IDynamicAuthenticationProviderStorageService['getClientRegistration'] =
    async () => undefined
  @Unsupported
  storeClientRegistration: IDynamicAuthenticationProviderStorageService['storeClientRegistration'] =
    unsupported

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
  selectSession: IAuthenticationMcpService['selectSession'] = unsupported
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
  @Unsupported
  queryGallery: IMcpWorkbenchService['queryGallery'] = unsupported
  @Unsupported
  install: IMcpWorkbenchService['install'] = unsupported
  uninstall: IMcpWorkbenchService['uninstall'] = async () => undefined
  open: IMcpWorkbenchService['open'] = async () => undefined
  onReset: IMcpWorkbenchService['onReset'] = Event.None

  @Unsupported
  getMcpConfigPath: IMcpWorkbenchService['getMcpConfigPath'] = unsupported

  getEnabledLocalMcpServers: IMcpWorkbenchService['getEnabledLocalMcpServers'] = () => []

  @Unsupported
  canInstall: IMcpWorkbenchService['canInstall'] = unsupported
}
registerSingleton(IMcpWorkbenchService, McpWorkbenchService, InstantiationType.Eager)
class McpGalleryService implements IMcpGalleryService {
  _serviceBrand: undefined
  isEnabled: IMcpGalleryService['isEnabled'] = () => false
  @Unsupported
  query: IMcpGalleryService['query'] = unsupported
  @Unsupported
  getReadme: IMcpGalleryService['getReadme'] = unsupported

  getMcpServersFromVSCodeGallery: IMcpGalleryService['getMcpServersFromVSCodeGallery'] =
    async () => []

  getMcpServersFromGallery: IMcpGalleryService['getMcpServersFromGallery'] = async () => []

  getMcpServer: IMcpGalleryService['getMcpServer'] = async () => undefined

  @Unsupported
  getMcpServerConfiguration: IMcpGalleryService['getMcpServerConfiguration'] = unsupported
}
registerSingleton(IMcpGalleryService, McpGalleryService, InstantiationType.Eager)
class McpSamplingService implements IMcpSamplingService {
  _serviceBrand: undefined
  @Unsupported
  sample: IMcpSamplingService['sample'] = unsupported
  hasLogs: IMcpSamplingService['hasLogs'] = () => false
  @Unsupported
  getLogText: IMcpSamplingService['getLogText'] = unsupported
  @Unsupported
  getConfig: IMcpSamplingService['getConfig'] = unsupported
  @Unsupported
  updateConfig: IMcpSamplingService['updateConfig'] = unsupported
}
registerSingleton(IMcpSamplingService, McpSamplingService, InstantiationType.Eager)

class McpResourceScannerService implements IMcpResourceScannerService {
  _serviceBrand: undefined
  @Unsupported
  scanMcpServers: IMcpResourceScannerService['scanMcpServers'] = unsupported
  @Unsupported
  addMcpServers: IMcpResourceScannerService['addMcpServers'] = unsupported
  @Unsupported
  removeMcpServers: IMcpResourceScannerService['removeMcpServers'] = unsupported
}
registerSingleton(IMcpResourceScannerService, McpResourceScannerService, InstantiationType.Eager)

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
class TreeSitterThemeService implements ITreeSitterThemeService {
  _serviceBrand: undefined
  onChange: ITreeSitterThemeService['onChange'] = constObservable(undefined)
  @Unsupported
  findMetadata: ITreeSitterThemeService['findMetadata'] = unsupported
}
registerSingleton(ITreeSitterThemeService, TreeSitterThemeService, InstantiationType.Eager)
class TreeSitterLibraryService implements ITreeSitterLibraryService {
  _serviceBrand: undefined
  @Unsupported
  getParserClass: ITreeSitterLibraryService['getParserClass'] = unsupported
  supportsLanguage: ITreeSitterLibraryService['supportsLanguage'] = () => false
  getLanguage: ITreeSitterLibraryService['getLanguage'] = () => undefined
  getInjectionQueries: ITreeSitterLibraryService['getInjectionQueries'] = () => undefined
  getHighlightingQueries: ITreeSitterLibraryService['getHighlightingQueries'] = () => undefined
}
registerSingleton(ITreeSitterLibraryService, TreeSitterLibraryService, InstantiationType.Eager)

class ChatAttachmentResolveService implements IChatAttachmentResolveService {
  _serviceBrand: undefined
  @Unsupported
  resolveEditorAttachContext: IChatAttachmentResolveService['resolveEditorAttachContext'] =
    unsupported
  @Unsupported
  resolveUntitledEditorAttachContext: IChatAttachmentResolveService['resolveUntitledEditorAttachContext'] =
    unsupported
  @Unsupported
  resolveResourceAttachContext: IChatAttachmentResolveService['resolveResourceAttachContext'] =
    unsupported
  @Unsupported
  resolveImageEditorAttachContext: IChatAttachmentResolveService['resolveImageEditorAttachContext'] =
    unsupported
  @Unsupported
  resolveImageAttachContext: IChatAttachmentResolveService['resolveImageAttachContext'] =
    unsupported
  @Unsupported
  resolveMarkerAttachContext: IChatAttachmentResolveService['resolveMarkerAttachContext'] =
    unsupported
  @Unsupported
  resolveSymbolsAttachContext: IChatAttachmentResolveService['resolveSymbolsAttachContext'] =
    unsupported
  @Unsupported
  resolveNotebookOutputAttachContext: IChatAttachmentResolveService['resolveNotebookOutputAttachContext'] =
    unsupported

  @Unsupported
  resolveSourceControlHistoryItemAttachContext: IChatAttachmentResolveService['resolveSourceControlHistoryItemAttachContext'] =
    unsupported
}
registerSingleton(
  IChatAttachmentResolveService,
  ChatAttachmentResolveService,
  InstantiationType.Eager
)

class McpElicitationService implements IMcpElicitationService {
  _serviceBrand: undefined
  @Unsupported
  elicit: IMcpElicitationService['elicit'] = unsupported
}
registerSingleton(IMcpElicitationService, McpElicitationService, InstantiationType.Eager)

class RemoteCodingAgentsService implements IRemoteCodingAgentsService {
  _serviceBrand: undefined
  @Unsupported
  registerAgent: IRemoteCodingAgentsService['registerAgent'] = unsupported

  getRegisteredAgents: IRemoteCodingAgentsService['getRegisteredAgents'] = () => []
  getAvailableAgents: IRemoteCodingAgentsService['getAvailableAgents'] = () => []
}
registerSingleton(IRemoteCodingAgentsService, RemoteCodingAgentsService, InstantiationType.Eager)

class AuthenticationQueryService implements IAuthenticationQueryService {
  _serviceBrand: undefined
  onDidChangePreferences: IAuthenticationQueryService['onDidChangePreferences'] = Event.None
  onDidChangeAccess: IAuthenticationQueryService['onDidChangeAccess'] = Event.None
  @Unsupported
  provider: IAuthenticationQueryService['provider'] = unsupported
  @Unsupported
  extension: IAuthenticationQueryService['extension'] = unsupported
  @Unsupported
  mcpServer: IAuthenticationQueryService['mcpServer'] = unsupported
  @Unsupported
  getProviderIds: IAuthenticationQueryService['getProviderIds'] = unsupported
  @Unsupported
  clearAllData: IAuthenticationQueryService['clearAllData'] = unsupported
}
registerSingleton(IAuthenticationQueryService, AuthenticationQueryService, InstantiationType.Eager)

class WorkbenchMcpManagementService implements IWorkbenchMcpManagementService {
  _serviceBrand: undefined
  onDidInstallMcpServers: IWorkbenchMcpManagementService['onDidInstallMcpServers'] = Event.None
  onInstallMcpServerInCurrentProfile: IWorkbenchMcpManagementService['onInstallMcpServerInCurrentProfile'] =
    Event.None
  onDidInstallMcpServersInCurrentProfile: IWorkbenchMcpManagementService['onDidInstallMcpServersInCurrentProfile'] =
    Event.None
  onDidUpdateMcpServersInCurrentProfile: IWorkbenchMcpManagementService['onDidUpdateMcpServersInCurrentProfile'] =
    Event.None
  onUninstallMcpServerInCurrentProfile: IWorkbenchMcpManagementService['onUninstallMcpServerInCurrentProfile'] =
    Event.None
  onDidUninstallMcpServerInCurrentProfile: IWorkbenchMcpManagementService['onDidUninstallMcpServerInCurrentProfile'] =
    Event.None
  onDidChangeProfile: IWorkbenchMcpManagementService['onDidChangeProfile'] = Event.None
  onInstallMcpServer: IWorkbenchMcpManagementService['onInstallMcpServer'] = Event.None
  onDidUpdateMcpServers: IWorkbenchMcpManagementService['onDidUpdateMcpServers'] = Event.None
  onUninstallMcpServer: IWorkbenchMcpManagementService['onUninstallMcpServer'] = Event.None
  onDidUninstallMcpServer: IWorkbenchMcpManagementService['onDidUninstallMcpServer'] = Event.None
  getInstalled: IWorkbenchMcpManagementService['getInstalled'] = async () => []
  @Unsupported
  install: IWorkbenchMcpManagementService['install'] = unsupported
  @Unsupported
  installFromGallery: IWorkbenchMcpManagementService['installFromGallery'] = unsupported
  @Unsupported
  updateMetadata: IWorkbenchMcpManagementService['updateMetadata'] = unsupported
  @Unsupported
  uninstall: IWorkbenchMcpManagementService['uninstall'] = unsupported
  @Unsupported
  canInstall: IWorkbenchMcpManagementService['canInstall'] = unsupported
  @Unsupported
  getMcpServerConfigurationFromManifest: IWorkbenchMcpManagementService['getMcpServerConfigurationFromManifest'] =
    unsupported
}
registerSingleton(
  IWorkbenchMcpManagementService,
  WorkbenchMcpManagementService,
  InstantiationType.Eager
)

class ChatTodoListService implements IChatTodoListService {
  _serviceBrand: undefined
  @Unsupported
  setTodos: IChatTodoListService['setTodos'] = unsupported

  getTodos: IChatTodoListService['getTodos'] = () => []
}
registerSingleton(IChatTodoListService, ChatTodoListService, InstantiationType.Delayed)

class ChatOutputRendererService implements IChatOutputRendererService {
  _serviceBrand: undefined
  registerRenderer: IChatOutputRendererService['registerRenderer'] = () => Disposable.None

  @Unsupported
  renderOutputPart: IChatOutputRendererService['renderOutputPart'] = unsupported
}
registerSingleton(IChatOutputRendererService, ChatOutputRendererService, InstantiationType.Delayed)

class ChatSessionsService implements IChatSessionsService {
  _serviceBrand: undefined
  onDidChangeInProgress: IChatSessionsService['onDidChangeInProgress'] = Event.None
  getAllChatSessionContributions: IChatSessionsService['getAllChatSessionContributions'] = () => []
  getAllChatSessionItemProviders: IChatSessionsService['getAllChatSessionItemProviders'] = () => []

  @Unsupported
  provideNewChatSessionItem: IChatSessionsService['provideNewChatSessionItem'] = unsupported

  @Unsupported
  reportInProgress: IChatSessionsService['reportInProgress'] = unsupported

  @Unsupported
  setEditableSession: IChatSessionsService['setEditableSession'] = unsupported

  @Unsupported
  notifySessionItemsChanged: IChatSessionsService['notifySessionItemsChanged'] = unsupported

  getInProgress: IChatSessionsService['getInProgress'] = () => []
  getEditableData: IChatSessionsService['getEditableData'] = () => undefined
  isEditable: IChatSessionsService['isEditable'] = () => false

  onDidChangeItemsProviders: IChatSessionsService['onDidChangeItemsProviders'] = Event.None
  onDidChangeSessionItems: IChatSessionsService['onDidChangeSessionItems'] = Event.None
  onDidChangeAvailability: IChatSessionsService['onDidChangeAvailability'] = Event.None
  canResolveItemProvider: IChatSessionsService['canResolveItemProvider'] = async () => false
  canResolveContentProvider: IChatSessionsService['canResolveContentProvider'] = async () => false
  registerChatSessionItemProvider: IChatSessionsService['registerChatSessionItemProvider'] = () =>
    Disposable.None
  registerChatSessionContentProvider: IChatSessionsService['registerChatSessionContentProvider'] =
    () => Disposable.None
  provideChatSessionItems: IChatSessionsService['provideChatSessionItems'] = async () => []

  @Unsupported
  provideChatSessionContent: IChatSessionsService['provideChatSessionContent'] = unsupported
}
registerSingleton(IChatSessionsService, ChatSessionsService, InstantiationType.Delayed)

class ImageResizeService implements IImageResizeService {
  _serviceBrand: undefined

  @Unsupported
  resizeImage: IImageResizeService['resizeImage'] = unsupported
}
registerSingleton(IImageResizeService, ImageResizeService, InstantiationType.Delayed)

registerSingleton(IDataChannelService, NullDataChannelService, InstantiationType.Delayed)

class AllowedMcpServersService implements IAllowedMcpServersService {
  _serviceBrand: undefined
  onDidChangeAllowedMcpServers: IAllowedMcpServersService['onDidChangeAllowedMcpServers'] =
    Event.None

  @Unsupported
  isAllowed: IAllowedMcpServersService['isAllowed'] = unsupported
}
registerSingleton(IAllowedMcpServersService, AllowedMcpServersService, InstantiationType.Delayed)

class ChatLayoutService implements IChatLayoutService {
  _serviceBrand: undefined

  @Unsupported
  get fontFamily(): IChatLayoutService['fontFamily'] {
    return unsupported()
  }

  @Unsupported
  get fontSize(): IChatLayoutService['fontSize'] {
    return unsupported()
  }
}
registerSingleton(IChatLayoutService, ChatLayoutService, InstantiationType.Delayed)

class AiEditTelemetryService implements IAiEditTelemetryService {
  _serviceBrand: undefined
  @Unsupported
  createSuggestionId: IAiEditTelemetryService['createSuggestionId'] = unsupported
  handleCodeAccepted: IAiEditTelemetryService['handleCodeAccepted'] = () => {}
}
registerSingleton(IAiEditTelemetryService, AiEditTelemetryService, InstantiationType.Delayed)

class InlineCompletionsUnificationService implements IInlineCompletionsUnificationService {
  @Unsupported
  get state(): IInlineCompletionsUnificationState {
    return unsupported()
  }
  onDidStateChange: IInlineCompletionsUnificationService['onDidStateChange'] = Event.None
  _serviceBrand: undefined
}
registerSingleton(
  IInlineCompletionsUnificationService,
  InlineCompletionsUnificationService,
  InstantiationType.Delayed
)

class McpGalleryManifestService implements IMcpGalleryManifestService {
  mcpGalleryManifestStatus = McpGalleryManifestStatus.Unavailable
  onDidChangeMcpGalleryManifestStatus: IMcpGalleryManifestService['onDidChangeMcpGalleryManifestStatus'] =
    Event.None
  onDidChangeMcpGalleryManifest: IMcpGalleryManifestService['onDidChangeMcpGalleryManifest'] =
    Event.None
  getMcpGalleryManifest: IMcpGalleryManifestService['getMcpGalleryManifest'] = async () => null
  _serviceBrand: undefined
}
registerSingleton(IMcpGalleryManifestService, McpGalleryManifestService, InstantiationType.Delayed)

class ChatModeService implements IChatModeService {
  _serviceBrand: undefined
  onDidChangeChatModes: IChatModeService['onDidChangeChatModes'] = Event.None

  @Unsupported
  getModes: IChatModeService['getModes'] = unsupported

  findModeById: IChatModeService['findModeById'] = () => undefined
  findModeByName: IChatModeService['findModeByName'] = () => undefined
}
registerSingleton(IChatModeService, ChatModeService, InstantiationType.Delayed)
