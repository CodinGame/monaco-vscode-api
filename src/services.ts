import './missing-services'
import './contributions'
import 'vs/editor/editor.all'
import 'vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard'
import Severity from 'vs/base/common/severity'
import type { ITextModelContentProvider } from 'vs/editor/common/services/resolverService'
import { StorageScope, StorageTarget } from 'vs/platform/storage/common/storage'
import {
  type IEditorOverrideServices,
  StandaloneServices
} from 'vs/editor/standalone/browser/standaloneServices'
import {
  type GetLeadingNonServiceArgs,
  IInstantiationService,
  type ServiceIdentifier,
  type ServicesAccessor
} from 'vs/platform/instantiation/common/instantiation'
import type { IAction } from 'vs/base/common/actions'
import { DisposableStore, type IDisposable } from 'vs/base/common/lifecycle'
import {
  type ILazyWorkbenchContributionInstantiation,
  type IOnEditorWorkbenchContributionInstantiation,
  type IWorkbenchContribution,
  type WorkbenchContributionInstantiation,
  WorkbenchPhase,
  registerWorkbenchContribution2
} from 'vs/workbench/common/contributions'
import { IProductService } from 'vs/platform/product/common/productService.service'
import type { IConfigurationChangeEvent } from 'vs/platform/configuration/common/configuration'
import type { IColorTheme } from 'vs/platform/theme/common/themeService'
import { type EnvironmentOverride, initialize as initializeWorkbench } from './workbench'
import {
  checkServicesNotInitialized,
  checkServicesReady,
  serviceInitializedBarrier,
  serviceInitializedEmitter,
  startup,
  waitServicesReady
} from './lifecycle'
import getQuickAccessOverride from './service-override/quickaccess'
import getFileServiceOverride from './service-override/files'
import getExtensionsServiceOverride from './service-override/extensions'
import getEnvironmentServiceOverride from './service-override/environment'
import getLayoutServiceOverride from './service-override/layout'
import getHostServiceOverride from './service-override/host'
import getBaseServiceOverride from './service-override/base'
import { injectCss } from './css'
import deprecatedProduct from 'vs/platform/product/common/product'
import { mixin } from 'vs/base/common/objects'
import { CommandsRegistry } from 'vs/platform/commands/common/commands'
import { asArray } from 'vs/base/common/arrays'
import { MenuId, MenuRegistry } from 'vs/platform/actions/common/actions'
import { Menu, type IWorkbenchConstructionOptions } from 'vs/workbench/browser/web.api'
declare global {
  interface Window {
    monacoVscodeApiBuildId?: string
  }
}

if (window.monacoVscodeApiBuildId != null && window.monacoVscodeApiBuildId !== BUILD_ID) {
  throw new Error(
    `Another version of monaco-vscode-api has already been loaded. Trying to load ${BUILD_ID}, ${window.monacoVscodeApiBuildId} is already loaded`
  )
}

window.monacoVscodeApiBuildId = BUILD_ID

/**
 * This function comes from VSCode (vs/workbench/browser/web.factory.ts)
 * It's duplicated here because it's not exported and used in a code we can't simply run
 */
function registerCommands(options: IWorkbenchConstructionOptions) {
  function asMenuId(menu: Menu): MenuId {
    switch (menu) {
      case Menu.CommandPalette:
        return MenuId.CommandPalette
      case Menu.StatusBarWindowIndicatorMenu:
        return MenuId.StatusBarWindowIndicatorMenu
    }
  }

  if (Array.isArray(options.commands)) {
    for (const command of options.commands) {
      CommandsRegistry.registerCommand(command.id, (accessor, ...args) => {
        // we currently only pass on the arguments but not the accessor
        // to the command to reduce our exposure of internal API.
        return command.handler(...args)
      })

      // Commands with labels appear in the command palette
      if (command.label) {
        for (const menu of asArray(command.menu ?? Menu.CommandPalette)) {
          MenuRegistry.appendMenuItem(asMenuId(menu), {
            command: { id: command.id, title: command.label }
          })
        }
      }
    }
  }
}

export async function initialize(
  overrides: IEditorOverrideServices,
  container: HTMLElement = document.body,
  configuration: IWorkbenchConstructionOptions = {},
  env?: EnvironmentOverride
): Promise<void> {
  checkServicesNotInitialized()

  injectCss(container)
  registerCommands(configuration)
  initializeWorkbench(container, configuration, env)

  const productService: IProductService = mixin(
    { _serviceBrand: undefined, ...deprecatedProduct },
    configuration.productConfiguration
  )

  const instantiationService = StandaloneServices.initialize({
    [IProductService.toString()]: productService,
    ...getLayoutServiceOverride(), // Always override layout service to break cyclic dependency with ICodeEditorService
    ...getEnvironmentServiceOverride(),
    ...getExtensionsServiceOverride(),
    ...getFileServiceOverride(),
    ...getQuickAccessOverride(),
    ...getHostServiceOverride(),
    ...getBaseServiceOverride(),
    ...overrides
  })

  await startup(instantiationService)
}

export async function getService<T>(identifier: ServiceIdentifier<T>): Promise<T> {
  await waitServicesReady()
  return StandaloneServices.get(identifier)
}

export async function createInstance<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Ctor extends new (...args: any[]) => any,
  R extends InstanceType<Ctor>
>(ctor: Ctor, ...args: GetLeadingNonServiceArgs<ConstructorParameters<Ctor>>): Promise<R> {
  await waitServicesReady()
  return StandaloneServices.get(IInstantiationService).createInstance(ctor, ...args)
}

export function createInstanceSync<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Ctor extends new (...args: any[]) => any,
  R extends InstanceType<Ctor>
>(ctor: Ctor, ...args: GetLeadingNonServiceArgs<ConstructorParameters<Ctor>>): R {
  checkServicesReady()
  return StandaloneServices.get(IInstantiationService).createInstance(ctor, ...args)
}

/**
 * Equivalent to `StandaloneServices.withServices` except the callback is called when the services are ready, not just initialized
 */
export function withReadyServices(
  callback: (serviceAccessor: ServicesAccessor) => IDisposable
): IDisposable {
  if (serviceInitializedBarrier.isOpen()) {
    return StandaloneServices.get(IInstantiationService).invokeFunction(callback)
  }

  const disposable = new DisposableStore()

  const listener = disposable.add(
    serviceInitializedEmitter.event(() => {
      listener.dispose()
      disposable.add(StandaloneServices.get(IInstantiationService).invokeFunction(callback))
    })
  )

  return disposable
}

export const registerWorkbenchContribution = (
  id: string,
  contribution: (accessor: ServicesAccessor) => void,
  instantiation: WorkbenchContributionInstantiation
): void => {
  class Contribution implements IWorkbenchContribution {
    constructor(@IInstantiationService instantiationService: IInstantiationService) {
      instantiationService.invokeFunction(contribution)
    }
  }
  registerWorkbenchContribution2(id, Contribution, instantiation)
}

export { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'

// Export all services as monaco doesn't export them
export { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'

export { ICommandService } from 'vs/platform/commands/common/commands.service'
export { INotificationService } from 'vs/platform/notification/common/notification.service'
export { IBulkEditService } from 'vs/editor/browser/services/bulkEditService.service'
export { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService.service'
export { ILanguageService } from 'vs/editor/common/languages/language.service'
export { ILanguageConfigurationService } from 'vs/editor/common/languages/languageConfigurationRegistry.service'
export { IEditorWorkerService } from 'vs/editor/common/services/editorWorker.service'
export { ILanguageFeaturesService } from 'vs/editor/common/services/languageFeatures.service'
export { IModelService } from 'vs/editor/common/services/model.service'
export { ITextModelService } from 'vs/editor/common/services/resolverService.service'
export { IClipboardService } from 'vs/platform/clipboard/common/clipboardService.service'
export { IDialogService, IFileDialogService } from 'vs/platform/dialogs/common/dialogs.service'
export { IFileService } from 'vs/platform/files/common/files.service'
export { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
export { IMarkerService } from 'vs/platform/markers/common/markers.service'
export { IOpenerService } from 'vs/platform/opener/common/opener.service'
export { IQuickInputService } from 'vs/platform/quickinput/common/quickInput.service'
export { ITelemetryService } from 'vs/platform/telemetry/common/telemetry.service'
export { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity.service'
export { IBreadcrumbsService } from 'vs/workbench/browser/parts/editor/breadcrumbs.service'
export { IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService.service'
export {
  GroupDirection,
  GroupOrientation,
  GroupLocation,
  GroupsArrangement,
  MergeGroupMode,
  GroupsOrder
} from 'vs/workbench/services/editor/common/editorGroupsService'
export type {
  IEditorGroup,
  IFindGroupScope,
  GroupLayoutArgument,
  EditorGroupLayout,
  IMergeGroupOptions,
  ICloseEditorOptions,
  ICloseEditorsFilter,
  ICloseAllEditorsOptions,
  IEditorReplacement,
  IEditorSideGroup
} from 'vs/workbench/services/editor/common/editorGroupsService'
export { CloseDirection, EditorsOrder } from 'vs/workbench/common/editor'
export type {
  IEditorPane,
  GroupIdentifier,
  EditorInputWithOptions,
  IEditorPartOptions,
  IEditorPartOptionsChangeEvent,
  IVisibleEditorPane,
  IEditorCloseEvent,
  IUntypedEditorInput,
  IEditorWillMoveEvent,
  IEditorWillOpenEvent,
  IMatchEditorOptions,
  IActiveEditorChangeEvent,
  IFindEditorOptions,
  IEditorControl
} from 'vs/workbench/common/editor'
export type {
  IEditorOptions,
  ITextEditorOptions,
  IResourceEditorInput
} from 'vs/platform/editor/common/editor'
export { EditorInput } from 'vs/workbench/common/editor/editorInput'
export type { IGroupModelChangeEvent } from 'vs/workbench/common/editor/editorGroupModel'
export { IEditorService } from 'vs/workbench/services/editor/common/editorService.service'
export { IEditorResolverService } from 'vs/workbench/services/editor/common/editorResolverService.service'
export { ITextEditorService } from 'vs/workbench/services/textfile/common/textEditorService.service'
export { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService.service'
export { IHostService } from 'vs/workbench/services/host/browser/host.service'
export { ILanguageStatusService } from 'vs/workbench/services/languageStatus/common/languageStatusService.service'
export { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite.service'
export { IPathService } from 'vs/workbench/services/path/common/pathService.service'
export { ITextFileService } from 'vs/workbench/services/textfile/common/textfiles.service'
export { IWorkingCopyFileService } from 'vs/workbench/services/workingCopy/common/workingCopyFileService.service'
export { IConfigurationService } from 'vs/platform/configuration/common/configuration.service'
export { IContextKeyService } from 'vs/platform/contextkey/common/contextkey.service'
export { IThemeService } from 'vs/platform/theme/common/themeService.service'
export { IWorkbenchThemeService } from 'vs/workbench/services/themes/common/workbenchThemeService.service'
export { ISnippetsService } from 'vs/workbench/contrib/snippets/browser/snippets.service'
export { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace.service'
export { IStorageService } from 'vs/platform/storage/common/storage.service'
export { IAccessibilitySignalService } from 'vs/platform/accessibilitySignal/browser/accessibilitySignalService.service'
export { IDebugService } from 'vs/workbench/contrib/debug/common/debug.service'
export { ILoggerService } from 'vs/platform/log/common/log.service'
export { LogLevel } from 'vs/platform/log/common/log'
export { ILogService } from 'vs/platform/log/common/log.service'
export { IViewDescriptorService } from 'vs/workbench/common/views.service'
export { IViewsService } from 'vs/workbench/services/views/common/viewsService.service'
export { ILayoutService } from 'vs/platform/layout/browser/layoutService.service'
export { IPreferencesService } from 'vs/workbench/services/preferences/common/preferences.service'
export { IPreferencesSearchService } from 'vs/workbench/contrib/preferences/common/preferences.service'
export { IKeybindingEditingService } from 'vs/workbench/services/keybinding/common/keybindingEditing.service'
export { IOutputService } from 'vs/workbench/services/output/common/output.service'
export { IHistoryService } from 'vs/workbench/services/history/common/history.service'
export { GoFilter, GoScope } from 'vs/workbench/services/history/common/history'
export { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService.service'
export { IRemoteAuthorityResolverService } from 'vs/platform/remote/common/remoteAuthorityResolver.service'
export { IRemoteSocketFactoryService } from 'vs/platform/remote/common/remoteSocketFactoryService.service'
export { IFilesConfigurationService } from 'vs/workbench/services/filesConfiguration/common/filesConfigurationService.service'
export { ILabelService } from 'vs/platform/label/common/label.service'
export { IWorkbenchLayoutService } from 'vs/workbench/services/layout/browser/layoutService.service'
export { ILanguagePackService } from 'vs/platform/languagePacks/common/languagePacks.service'
export { ILocaleService } from 'vs/workbench/services/localization/common/locale.service'

// Export all Notification service parts
export { NoOpNotification, NoOpProgress } from 'vs/platform/notification/common/notification'
export {
  NotificationsFilter,
  NotificationPriority,
  NeverShowAgainScope
} from 'vs/platform/notification/common/notification'
export type {
  NotificationMessage,
  INotificationProperties,
  INeverShowAgainOptions,
  INotification,
  INotificationActions,
  INotificationProgress,
  INotificationProgressProperties,
  INotificationHandle,
  IPromptChoice,
  IPromptChoiceWithMenu,
  IPromptOptions,
  IStatusMessageOptions
} from 'vs/platform/notification/common/notification'

// Export all Dialog service parts
export type {
  IDialogArgs,
  DialogType,
  IDialogResult,
  IConfirmDialogArgs,
  IInputDialogArgs,
  IPromptDialogArgs,
  IBaseDialogOptions,
  ICheckbox,
  ICheckboxResult,
  IConfirmation,
  IConfirmationResult,
  IInput,
  IInputResult,
  IInputElement,
  IPrompt,
  IPromptResult,
  IPromptBaseButton,
  IPromptButton,
  IPromptCancelButton,
  IPromptResultWithCancel,
  IPromptWithCustomCancel,
  IPromptWithDefaultCancel
} from 'vs/platform/dialogs/common/dialogs'
export type {
  IDialogHandler,
  ICustomDialogOptions,
  ICustomDialogMarkdown
} from 'vs/platform/dialogs/common/dialogs'
export type { IMarkdownString, MarkdownStringTrustedOptions } from 'vs/base/common/htmlContent'
export { IActivityService } from 'vs/workbench/services/activity/common/activity.service'
export type { IBadge } from 'vs/workbench/services/activity/common/activity'
export { IHoverService } from 'vs/platform/hover/browser/hover.service'
export { IExplorerService } from 'vs/workbench/contrib/files/browser/files.service'
export { IStatusbarService } from 'vs/workbench/services/statusbar/browser/statusbar.service'
export { ITitleService } from 'vs/workbench/services/title/browser/titleService.service'
export { IBannerService } from 'vs/workbench/services/banner/browser/bannerService.service'
export {
  IWorkspaceTrustManagementService,
  IWorkspaceTrustRequestService,
  IWorkspaceTrustEnablementService
} from 'vs/platform/workspace/common/workspaceTrust.service'
export type { IWorkspaceTrustUriInfo } from 'vs/platform/workspace/common/workspaceTrust'
export { IKeybindingService } from 'vs/platform/keybinding/common/keybinding.service'
export { ISecretStorageService } from 'vs/platform/secrets/common/secrets.service'
export type { ISecretStorageProvider } from 'vs/platform/secrets/common/secrets'
export type { IProductConfiguration } from 'vs/base/common/product'

export { StorageScope, StorageTarget, Severity, IProductService, WorkbenchPhase }
export type {
  IAction,
  IConfigurationChangeEvent,
  ITextModelContentProvider,
  IColorTheme,
  IWorkbenchConstructionOptions,
  IEditorOverrideServices,
  WorkbenchContributionInstantiation,
  ILazyWorkbenchContributionInstantiation,
  IOnEditorWorkbenchContributionInstantiation,
  ServicesAccessor
}
export * from 'vs/workbench/browser/web.api'
export { ConfigurationTarget } from 'vs/platform/configuration/common/configuration'
export { IRemoteExplorerService } from 'vs/workbench/services/remote/common/remoteExplorerService.service'
export { ITunnelService } from 'vs/platform/tunnel/common/tunnel.service'

export { ITreeViewsDnDService } from 'vs/editor/common/services/treeViewsDndService.service'
export { IAccessibleViewService } from 'vs/platform/accessibility/browser/accessibleView.service'
export { IActionViewItemService } from 'vs/platform/actions/browser/actionViewItemService.service'
export { IExtensionHostDebugService } from 'vs/platform/debug/common/extensionHostDebug.service'
export { NullDiagnosticsService } from 'vs/platform/diagnostics/common/diagnostics'
export { IDiagnosticsService } from 'vs/platform/diagnostics/common/diagnostics.service'
export { IDownloadService } from 'vs/platform/download/common/download.service'
export { IEncryptionService } from 'vs/platform/encryption/common/encryptionService.service'
export { IEnvironmentService } from 'vs/platform/environment/common/environment.service'
export {
  IAllowedExtensionsService,
  IExtensionGalleryService,
  IExtensionTipsService,
  IGlobalExtensionEnablementService
} from 'vs/platform/extensionManagement/common/extensionManagement.service'
export { IExtensionStorageService } from 'vs/platform/extensionManagement/common/extensionStorage.service'
export { IExtensionsProfileScannerService } from 'vs/platform/extensionManagement/common/extensionsProfileScannerService.service'
export { IExtensionsScannerService } from 'vs/platform/extensionManagement/common/extensionsScannerService.service'
export { IExtensionRecommendationNotificationService } from 'vs/platform/extensionRecommendations/common/extensionRecommendations.service'
export { IExtensionResourceLoaderService } from 'vs/platform/extensionResourceLoader/common/extensionResourceLoader.service'
export { IBuiltinExtensionsScannerService } from 'vs/platform/extensions/common/extensions.service'
export { InstantiationType, registerSingleton } from 'vs/platform/instantiation/common/extensions'
export { IKeyboardLayoutService } from 'vs/platform/keyboardLayout/common/keyboardLayout.service'
export { NullPolicyService } from 'vs/platform/policy/common/policy'
export { IPolicyService } from 'vs/platform/policy/common/policy.service'
export { IRemoteExtensionsScannerService } from 'vs/platform/remote/common/remoteExtensionsScanner.service'
export { IRequestService } from 'vs/platform/request/common/request.service'
export { ISignService } from 'vs/platform/sign/common/sign.service'
export { ICustomEndpointTelemetryService } from 'vs/platform/telemetry/common/telemetry.service'
export { NullEndpointTelemetryService } from 'vs/platform/telemetry/common/telemetryUtils'
export { TerminalLocation } from 'vs/platform/terminal/common/terminal'
export { ITerminalLogService } from 'vs/platform/terminal/common/terminal.service'
export { State } from 'vs/platform/update/common/update'
export { IUpdateService } from 'vs/platform/update/common/update.service'
export { UriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentityService'
export { IURLService } from 'vs/platform/url/common/url.service'
export { toUserDataProfile } from 'vs/platform/userDataProfile/common/userDataProfile'
export { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile.service'
export { IUserDataProfileStorageService } from 'vs/platform/userDataProfile/common/userDataProfileStorageService.service'
export { IIgnoredExtensionsManagementService } from 'vs/platform/userDataSync/common/ignoredExtensions.service'
export {
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
export { IUserDataSyncAccountService } from 'vs/platform/userDataSync/common/userDataSyncAccount.service'
export { IUserDataSyncMachinesService } from 'vs/platform/userDataSync/common/userDataSyncMachines.service'
export { ICanonicalUriService } from 'vs/platform/workspace/common/canonicalUri.service'
export { IEditSessionIdentityService } from 'vs/platform/workspace/common/editSessions.service'
export { WorkspaceTrustUriResponse } from 'vs/platform/workspace/common/workspaceTrust'
export { IWorkspacesService } from 'vs/platform/workspaces/common/workspaces.service'
export {
  type ExtensionStatusBarEntry,
  IExtensionStatusBarItemService,
  StatusBarUpdateKind
} from 'vs/workbench/api/browser/statusBarService'
export {
  DEFAULT_EDITOR_PART_OPTIONS,
  type IEditorGroupView
} from 'vs/workbench/browser/parts/editor/editor'
export {
  IChatAccessibilityService,
  IChatCodeBlockContextProviderService,
  IChatWidgetService,
  IQuickChatService
} from 'vs/workbench/contrib/chat/browser/chat.service'
export {
  IChatAgentNameService,
  IChatAgentService
} from 'vs/workbench/contrib/chat/common/chatAgents.service'
export { ICodeMapperService } from 'vs/workbench/contrib/chat/common/chatCodeMapperService.service'
export { IChatEditingService } from 'vs/workbench/contrib/chat/common/chatEditingService.service'
export { IChatService } from 'vs/workbench/contrib/chat/common/chatService.service'
export { IChatSlashCommandService } from 'vs/workbench/contrib/chat/common/chatSlashCommands.service'
export { IChatVariablesService } from 'vs/workbench/contrib/chat/common/chatVariables.service'
export { IChatWidgetHistoryService } from 'vs/workbench/contrib/chat/common/chatWidgetHistoryService.service'
export { ILanguageModelIgnoredFilesService } from 'vs/workbench/contrib/chat/common/ignoredFiles.service'
export { ILanguageModelStatsService } from 'vs/workbench/contrib/chat/common/languageModelStats.service'
export { ILanguageModelToolsService } from 'vs/workbench/contrib/chat/common/languageModelToolsService.service'
export { ILanguageModelsService } from 'vs/workbench/contrib/chat/common/languageModels.service'
export { ICommentService } from 'vs/workbench/contrib/comments/browser/commentService.service'
export { ICustomEditorService } from 'vs/workbench/contrib/customEditor/common/customEditor.service'
export { IDebugVisualizerService } from 'vs/workbench/contrib/debug/common/debugVisualizers.service'
export {
  IEditSessionsLogService,
  IEditSessionsStorageService
} from 'vs/workbench/contrib/editSessions/common/editSessions.service'
export { IExtensionsWorkbenchService } from 'vs/workbench/contrib/extensions/common/extensions.service'
export { IExternalUriOpenerService } from 'vs/workbench/contrib/externalUriOpener/common/externalUriOpenerService.service'
export { IInlineChatSessionService } from 'vs/workbench/contrib/inlineChat/browser/inlineChatSessionService.service'
export { IInteractiveDocumentService } from 'vs/workbench/contrib/interactive/browser/interactiveDocumentService.service'
export { IInteractiveHistoryService } from 'vs/workbench/contrib/interactive/browser/interactiveHistoryService.service'
export { ITroubleshootIssueService } from 'vs/workbench/contrib/issue/browser/issueTroubleshoot.service'
export {
  IIssueFormService,
  IWorkbenchIssueService
} from 'vs/workbench/contrib/issue/common/issue.service'
export { IDefaultLogLevelsService } from 'vs/workbench/contrib/logs/common/defaultLogLevels.service'
export { IMultiDiffSourceResolverService } from 'vs/workbench/contrib/multiDiffEditor/browser/multiDiffSourceResolverService.service'
export { INotebookOriginalCellModelFactory } from 'vs/workbench/contrib/notebook/browser/diff/inlineDiff/notebookOriginalCellModelFactory.service'
export { INotebookOriginalModelReferenceFactory } from 'vs/workbench/contrib/notebook/browser/diff/inlineDiff/notebookOriginalModelRefFactory.service'
export { INotebookEditorService } from 'vs/workbench/contrib/notebook/browser/services/notebookEditorService.service'
export { INotebookCellStatusBarService } from 'vs/workbench/contrib/notebook/common/notebookCellStatusBarService.service'
export { INotebookEditorModelResolverService } from 'vs/workbench/contrib/notebook/common/notebookEditorModelResolverService.service'
export { INotebookExecutionService } from 'vs/workbench/contrib/notebook/common/notebookExecutionService.service'
export { INotebookExecutionStateService } from 'vs/workbench/contrib/notebook/common/notebookExecutionStateService.service'
export {
  INotebookKernelHistoryService,
  INotebookKernelService
} from 'vs/workbench/contrib/notebook/common/notebookKernelService.service'
export { INotebookKeymapService } from 'vs/workbench/contrib/notebook/common/notebookKeymapService.service'
export { INotebookLoggingService } from 'vs/workbench/contrib/notebook/common/notebookLoggingService.service'
export { INotebookRendererMessagingService } from 'vs/workbench/contrib/notebook/common/notebookRendererMessagingService.service'
export { INotebookService } from 'vs/workbench/contrib/notebook/common/notebookService.service'
export { INotebookEditorWorkerService } from 'vs/workbench/contrib/notebook/common/services/notebookWorkerService.service'
export { IQuickDiffModelService } from 'vs/workbench/contrib/scm/browser/quickDiffModel.service'
export { IQuickDiffService } from 'vs/workbench/contrib/scm/common/quickDiff.service'
export { ISCMService, ISCMViewService } from 'vs/workbench/contrib/scm/common/scm.service'
export { IReplaceService } from 'vs/workbench/contrib/search/browser/replace.service'
export { ISearchViewModelWorkbenchService } from 'vs/workbench/contrib/search/browser/searchTreeModel/searchViewModelWorkbenchService.service'
export { INotebookSearchService } from 'vs/workbench/contrib/search/common/notebookSearch.service'
export { ISearchHistoryService } from 'vs/workbench/contrib/search/common/searchHistoryService.service'
export { IShareService } from 'vs/workbench/contrib/share/common/share.service'
export { ISpeechService } from 'vs/workbench/contrib/speech/common/speechService.service'
export { NoOpWorkspaceTagsService } from 'vs/workbench/contrib/tags/browser/workspaceTagsService'
export { IWorkspaceTagsService } from 'vs/workbench/contrib/tags/common/workspaceTags.service'
export { ITaskService } from 'vs/workbench/contrib/tasks/common/taskService.service'
export {
  ITerminalConfigurationService,
  ITerminalEditorService,
  ITerminalGroupService,
  ITerminalInstanceService,
  ITerminalService
} from 'vs/workbench/contrib/terminal/browser/terminal.service'
export { IEnvironmentVariableService } from 'vs/workbench/contrib/terminal/common/environmentVariable.service'
export {
  ITerminalProfileResolverService,
  ITerminalProfileService
} from 'vs/workbench/contrib/terminal/common/terminal.service'
export { ITerminalContributionService } from 'vs/workbench/contrib/terminal/common/terminalExtensionPoints.service'
export { ITerminalLinkProviderService } from 'vs/workbench/contrib/terminalContrib/links/browser/links.service'
export { ITerminalQuickFixService } from 'vs/workbench/contrib/terminalContrib/quickFix/browser/quickFix.service'
export { ITerminalCompletionService } from 'vs/workbench/contrib/terminalContrib/suggest/browser/terminalCompletionService.service'
export { ITestCoverageService } from 'vs/workbench/contrib/testing/common/testCoverageService.service'
export { ITestExplorerFilterState } from 'vs/workbench/contrib/testing/common/testExplorerFilterState.service'
export { ITestProfileService } from 'vs/workbench/contrib/testing/common/testProfileService.service'
export { ITestResultService } from 'vs/workbench/contrib/testing/common/testResultService.service'
export { ITestResultStorage } from 'vs/workbench/contrib/testing/common/testResultStorage.service'
export { ITestService } from 'vs/workbench/contrib/testing/common/testService.service'
export { ITestingContinuousRunService } from 'vs/workbench/contrib/testing/common/testingContinuousRunService.service'
export { ITestingDecorationsService } from 'vs/workbench/contrib/testing/common/testingDecorations.service'
export { ITestingPeekOpener } from 'vs/workbench/contrib/testing/common/testingPeekOpener.service'
export { ITimelineService } from 'vs/workbench/contrib/timeline/common/timeline.service'
export { ITrustedDomainService } from 'vs/workbench/contrib/url/browser/trustedDomainService.service'
export { IWebviewService } from 'vs/workbench/contrib/webview/browser/webview.service'
export { IWebviewWorkbenchService } from 'vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService.service'
export { IWebviewViewService } from 'vs/workbench/contrib/webviewView/browser/webviewViewService.service'
export { IWalkthroughsService } from 'vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedService.service'
export { IAccessibleViewInformationService } from 'vs/workbench/services/accessibility/common/accessibleViewInformationService.service'
export { IAiEmbeddingVectorService } from 'vs/workbench/services/aiEmbeddingVector/common/aiEmbeddingVectorService.service'
export { IAiRelatedInformationService } from 'vs/workbench/services/aiRelatedInformation/common/aiRelatedInformation.service'
export { IWorkbenchAssignmentService } from 'vs/workbench/services/assignment/common/assignmentService.service'
export { IAuthenticationAccessService } from 'vs/workbench/services/authentication/browser/authenticationAccessService.service'
export { IAuthenticationUsageService } from 'vs/workbench/services/authentication/browser/authenticationUsageService.service'
export {
  IAuthenticationExtensionsService,
  IAuthenticationService
} from 'vs/workbench/services/authentication/common/authentication.service'
export { IAuxiliaryWindowService } from 'vs/workbench/services/auxiliaryWindow/browser/auxiliaryWindowService.service'
export { IJSONEditingService } from 'vs/workbench/services/configuration/common/jsonEditing.service'
export { IConfigurationResolverService } from 'vs/workbench/services/configurationResolver/common/configurationResolver.service'
export { IDecorationsService } from 'vs/workbench/services/decorations/common/decorations.service'
export { ICustomEditorLabelService } from 'vs/workbench/services/editor/common/customEditorLabelService.service'
export { IEditorPaneService } from 'vs/workbench/services/editor/common/editorPaneService.service'
export { IExtensionBisectService } from 'vs/workbench/services/extensionManagement/browser/extensionBisect.service'
export { IExtensionFeaturesManagementService } from 'vs/workbench/services/extensionManagement/common/extensionFeatures.service'
export {
  IExtensionManagementServerService,
  IWebExtensionsScannerService,
  IWorkbenchExtensionEnablementService,
  IWorkbenchExtensionManagementService
} from 'vs/workbench/services/extensionManagement/common/extensionManagement.service'
export {
  IExtensionIgnoredRecommendationsService,
  IExtensionRecommendationsService
} from 'vs/workbench/services/extensionRecommendations/common/extensionRecommendations.service'
export { IWorkspaceExtensionsConfigService } from 'vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig.service'
export { IExtensionUrlHandler } from 'vs/workbench/services/extensions/browser/extensionUrlHandler.service'
export { IExtensionManifestPropertiesService } from 'vs/workbench/services/extensions/common/extensionManifestPropertiesService.service'
export { NullExtensionService } from 'vs/workbench/services/extensions/common/extensions'
export { IExtensionService } from 'vs/workbench/services/extensions/common/extensions.service'
export { IElevatedFileService } from 'vs/workbench/services/files/common/elevatedFileService.service'
export { IIntegrityService } from 'vs/workbench/services/integrity/common/integrity.service'
export { FallbackKeyboardMapper } from 'vs/workbench/services/keybinding/common/fallbackKeyboardMapper'
export { ILanguageDetectionService } from 'vs/workbench/services/languageDetection/common/languageDetectionWorkerService.service'
export { ILifecycleService } from 'vs/workbench/services/lifecycle/common/lifecycle.service'
export { IActiveLanguagePackService } from 'vs/workbench/services/localization/common/locale.service'
export { INotebookDocumentService } from 'vs/workbench/services/notebook/common/notebookDocumentService.service'
export { IOutlineService } from 'vs/workbench/services/outline/browser/outline.service'
export { ISearchService } from 'vs/workbench/services/search/common/search.service'
export { IEmbedderTerminalService } from 'vs/workbench/services/terminal/common/embedderTerminalService.service'
export { ITextMateTokenizationService } from 'vs/workbench/services/textMate/browser/textMateTokenizationFeature.service'
export { IHostColorSchemeService } from 'vs/workbench/services/themes/common/hostColorSchemeService.service'
export { ITimerService } from 'vs/workbench/services/timer/browser/timerService.service'
export { IUntitledTextEditorService } from 'vs/workbench/services/untitled/common/untitledTextEditorService.service'
export { IUserActivityService } from 'vs/workbench/services/userActivity/common/userActivityService.service'
export { IUserDataInitializationService } from 'vs/workbench/services/userData/browser/userDataInit.service'
export { IRemoteUserDataProfilesService } from 'vs/workbench/services/userDataProfile/common/remoteUserDataProfiles.service'
export {
  IUserDataProfileImportExportService,
  IUserDataProfileManagementService,
  IUserDataProfileService
} from 'vs/workbench/services/userDataProfile/common/userDataProfile.service'
export { UserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfileService'
export { AccountStatus } from 'vs/workbench/services/userDataSync/common/userDataSync'
export { IUserDataSyncWorkbenchService } from 'vs/workbench/services/userDataSync/common/userDataSync.service'
export { IWorkingCopyBackupService } from 'vs/workbench/services/workingCopy/common/workingCopyBackup.service'
export { IWorkingCopyEditorService } from 'vs/workbench/services/workingCopy/common/workingCopyEditorService.service'
export { IWorkingCopyHistoryService } from 'vs/workbench/services/workingCopy/common/workingCopyHistory.service'
export { IWorkingCopyService } from 'vs/workbench/services/workingCopy/common/workingCopyService.service'
export { IWorkspaceEditingService } from 'vs/workbench/services/workspaces/common/workspaceEditing.service'
export { IWorkspaceIdentityService } from 'vs/workbench/services/workspaces/common/workspaceIdentityService.service'
export { IChatMarkdownAnchorService } from 'vs/workbench/contrib/chat/browser/chatContentParts/chatMarkdownAnchorService.service'
export { getBuiltInExtensionTranslationsUris, getExtensionIdProvidingCurrentLocale } from './l10n'
export { unsupported } from './tools'
export { IChatEntitlementService } from 'vs/workbench/services/chat/common/chatEntitlementService.service'
export { IPromptsService } from 'vs/workbench/contrib/chat/common/promptSyntax/service/promptsService.service'
export { ISuggestMemoryService } from 'vs/editor/contrib/suggest/browser/suggestMemory.service'
export { LanguageConfigurationService } from 'vs/editor/common/languages/languageConfigurationRegistry'
export { ISemanticTokensStylingService } from 'vs/editor/common/services/semanticTokensStyling.service'
export { ILanguageFeatureDebounceService } from 'vs/editor/common/services/languageFeatureDebounce.service'
export { IDiffProviderFactoryService } from 'vs/editor/browser/widget/diffEditor/diffProviderFactoryService.service'
export { IOutlineModelService } from 'vs/editor/contrib/documentSymbols/browser/outlineModel.service'
export { IMarkerNavigationService } from 'vs/editor/contrib/gotoError/browser/markerNavigationService.service'
export { ICodeLensCache } from 'vs/editor/contrib/codelens/browser/codeLensCache.service'
export { IInlayHintsCache } from 'vs/editor/contrib/inlayHints/browser/inlayHintsController.service'
export { ISymbolNavigationService } from 'vs/editor/contrib/gotoSymbol/browser/symbolNavigation.service'
export { IEditorCancellationTokens } from 'vs/editor/contrib/editorState/browser/keybindingCancellation.service'
export { IPeekViewService } from 'vs/editor/contrib/peekView/browser/peekView.service'
export { IUndoRedoService } from 'vs/platform/undoRedo/common/undoRedo.service'
export { IActionWidgetService } from 'vs/platform/actionWidget/browser/actionWidget.service'
export {
  IMcpElicitationService,
  IMcpSamplingService,
  IMcpService,
  IMcpWorkbenchService
} from 'vs/workbench/contrib/mcp/common/mcpTypes.service'
export { IMcpResourceScannerService } from 'vs/platform/mcp/common/mcpResourceScannerService.service'
export { IMcpRegistry } from 'vs/workbench/contrib/mcp/common/mcpRegistryTypes.service'
export { IExtensionGalleryManifestService } from 'vs/platform/extensionManagement/common/extensionGalleryManifest.service'
export {
  ISharedWebContentExtractorService,
  IWebContentExtractorService
} from 'vs/platform/webContentExtractor/common/webContentExtractor.service'
export { IDefaultAccountService } from 'vs/platform/defaultAccount/common/defaultAccount.service'
export { IChatTransferService } from 'vs/workbench/contrib/chat/common/chatTransferService.service'
export { IChatStatusItemService } from 'vs/workbench/contrib/chat/browser/chatStatus/chatStatusItemService.service'
export { IAiSettingsSearchService } from 'vscode/src/vs/workbench/services/aiSettingsSearch/common/aiSettingsSearch.service'
export { IDynamicAuthenticationProviderStorageService } from 'vs/workbench/services/authentication/common/dynamicAuthenticationProviderStorage.service'
export { IAuthenticationMcpService } from 'vs/workbench/services/authentication/browser/authenticationMcpService.service'
export { IAuthenticationMcpAccessService } from 'vs/workbench/services/authentication/browser/authenticationMcpAccessService.service'
export { IAuthenticationMcpUsageService } from 'vs/workbench/services/authentication/browser/authenticationMcpUsageService.service'
export { IBrowserElementsService } from 'vs/workbench/services/browserElements/browser/browserElementsService.service'
export { IChatContextPickService } from 'vs/workbench/contrib/chat/browser/chatContextPickService.service'
export {
  IMcpGalleryService,
  IMcpManagementService
} from 'vs/platform/mcp/common/mcpManagement.service'
export { ITreeSitterThemeService } from 'vs/editor/common/services/treeSitter/treeSitterThemeService.service'
export { ITreeSitterLibraryService } from 'vs/editor/common/services/treeSitter/treeSitterLibraryService.service'
export { IChatAttachmentResolveService } from 'vs/workbench/contrib/chat/browser/chatAttachmentResolveService.service'
export { IRemoteCodingAgentsService } from 'vs/workbench/contrib/remoteCodingAgents/common/remoteCodingAgentsService.service'
export { IAuthenticationQueryService } from 'vs/workbench/services/authentication/common/authenticationQuery.service'
export { IWorkbenchMcpManagementService } from 'vs/workbench/services/mcp/common/mcpWorkbenchManagementService.service'

export { IChatLayoutService } from 'vs/workbench/contrib/chat/common/chatLayoutService.service'
export { IAiEditTelemetryService } from 'vs/workbench/contrib/editTelemetry/browser/telemetry/aiEditTelemetry/aiEditTelemetryService.service'
export { IInlineCompletionsUnificationService } from 'vs/workbench/services/inlineCompletions/common/inlineCompletionsUnification.service'
export { IMcpGalleryManifestService } from 'vs/platform/mcp/common/mcpGalleryManifest.service'
export { IDataChannelService } from 'vs/platform/dataChannel/common/dataChannel.service'
export { IProgressService } from 'vs/platform/progress/common/progress.service'
export { IMarkdownRendererService } from 'vs/platform/markdown/browser/markdownRenderer.service'
export { IChatContextService } from 'vs/workbench/contrib/chat/browser/chatContextService.service'
export { ILanguageModelToolsConfirmationService } from 'vs/workbench/contrib/chat/common/languageModelToolsConfirmationService.service'
export { IRandomService } from 'vs/workbench/contrib/editTelemetry/browser/randomService.service'
export { ISCMRepositorySelectionMode } from 'vs/workbench/contrib/scm/common/scm'
export { IAgentSessionsService } from 'vs/workbench/contrib/chat/browser/agentSessions/agentSessionsService.service'
export { IUserAttentionService } from 'vs/workbench/services/userAttention/common/userAttentionService.service'
export type { IAgentSessionsModel } from 'vs/workbench/contrib/chat/browser/agentSessions/agentSessionsModel'
