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
import { mixin } from 'vs/base/common/objects'
import {
  type GetLeadingNonServiceArgs,
  IInstantiationService,
  type ServiceIdentifier,
  type ServicesAccessor
} from 'vs/platform/instantiation/common/instantiation'
import type { IAction } from 'vs/base/common/actions'
import { DisposableStore, type IDisposable } from 'vs/base/common/lifecycle'
import type { IWorkbenchConstructionOptions } from 'vs/workbench/browser/web.api'
import type { IProductConfiguration } from 'vs/base/common/product'
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

export async function initialize(
  overrides: IEditorOverrideServices,
  container: HTMLElement = document.body,
  configuration: IWorkbenchConstructionOptions = {},
  env?: EnvironmentOverride
): Promise<void> {
  checkServicesNotInitialized()

  initializeWorkbench(container, configuration, env)

  const instantiationService = StandaloneServices.initialize({
    [IProductService.toString()]: mixin(
      <Partial<IProductConfiguration>>{
        version: VSCODE_VERSION,
        quality: 'stable',
        commit: VSCODE_COMMIT,
        nameShort: 'Code - OSS',
        nameLong: 'Code - OSS',
        applicationName: 'code-oss',
        dataFolderName: '.vscode-oss',
        urlProtocol: 'code-oss',
        reportIssueUrl: 'https://github.com/microsoft/vscode/issues/new',
        licenseName: 'MIT',
        licenseUrl: 'https://github.com/microsoft/vscode/blob/main/LICENSE.txt',
        serverApplicationName: 'code-server-oss'
      },
      configuration.productConfiguration ?? {}
    ),
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
export { IBulkEditService } from 'vs/editor/browser/services/bulkEditService'
export { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
export { ILanguageService } from 'vs/editor/common/languages/language'
export { ILanguageConfigurationService } from 'vs/editor/common/languages/languageConfigurationRegistry'
export { IEditorWorkerService } from 'vs/editor/common/services/editorWorker'
export { ILanguageFeaturesService } from 'vs/editor/common/services/languageFeatures'
export { IModelService } from 'vs/editor/common/services/model'
export { ITextModelService } from 'vs/editor/common/services/resolverService'
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
export type { IDimension } from 'vs/editor/common/core/dimension'
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
export { ConfigurationTarget } from 'vs/platform/configuration/common/configuration'
