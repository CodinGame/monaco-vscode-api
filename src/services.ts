import './extHost'
import Severity from 'vs/base/common/severity'
import { IConfigurationChangeEvent } from 'vs/platform/configuration/common/configuration'
import { ITextModelContentProvider } from 'vs/editor/common/services/resolverService'
import { IColorTheme } from 'vs/platform/theme/common/themeService'
import { StorageScope, StorageTarget } from 'vscode/vs/platform/storage/common/storage'
import { Registry } from 'vs/platform/registry/common/platform'
import { IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'vs/workbench/common/contributions'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ILifecycleService, LifecyclePhase } from 'vs/workbench/services/lifecycle/common/lifecycle'
import { IInstantiationService, ServicesAccessor } from 'vs/platform/instantiation/common/instantiation'
import { RunOnceScheduler, runWhenIdle } from 'vs/base/common/async'
import { Emitter } from 'vs/base/common/event'
import { IAction } from 'vs/base/common/actions'
import getLayoutServiceOverride from './service-override/layout'
import getEnvironmentServiceOverride from './service-override/environment'

interface ServiceInitializeParticipant {
  (accessor: ServicesAccessor): Promise<void>
}
const serviceInitializeParticipants: ServiceInitializeParticipant[] = []
export function registerServiceInitializeParticipant (participant: ServiceInitializeParticipant): void {
  serviceInitializeParticipants.push(participant)
}

async function initServices (overrides: IEditorOverrideServices): Promise<IInstantiationService> {
  const instantiationService = StandaloneServices.initialize({
    ...getLayoutServiceOverride(), // Always override layout service to break cyclic dependency with ICodeEditorService
    ...getEnvironmentServiceOverride(),
    ...overrides
  })

  await instantiationService.invokeFunction(async accessor => {
    const lifecycleService = accessor.get(ILifecycleService)

    await Promise.all(serviceInitializeParticipants.map(participant => participant(accessor)))

    // Signal to lifecycle that services are set
    lifecycleService.phase = LifecyclePhase.Ready
  })

  return instantiationService
}

const renderWorkbenchEmitter = new Emitter<ServicesAccessor>()
export const onRenderWorkbench = renderWorkbenchEmitter.event

export async function initialize (overrides: IEditorOverrideServices): Promise<void> {
  const instantiationService = await initServices(overrides)

  instantiationService.invokeFunction(accessor => {
    const lifecycleService = accessor.get(ILifecycleService)

    Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).start(accessor)

    renderWorkbenchEmitter.fire(accessor)

    lifecycleService.phase = LifecyclePhase.Restored

    // Set lifecycle phase to `Eventually` after a short delay and when idle (min 2.5sec, max 5sec)
    const eventuallyPhaseScheduler = new RunOnceScheduler(() => {
      runWhenIdle(() => {
        lifecycleService.phase = LifecyclePhase.Eventually
      }, 2500)
    }, 2500)
    eventuallyPhaseScheduler.schedule()
  })
}

export { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'

// Export all services as monaco doesn't export them
export { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'

export { ICommandService } from 'vs/platform/commands/common/commands'
export { INotificationService } from 'vs/platform/notification/common/notification'
export { IBulkEditService } from 'vs/editor/browser/services/bulkEditService'
export { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
export { ILanguageService } from 'vs/editor/common/languages/language'
export { ILanguageConfigurationService } from 'vs/editor/common/languages/languageConfigurationRegistry'
export { IEditorWorkerService } from 'vs/editor/common/services/editorWorker'
export { ILanguageFeaturesService } from 'vs/editor/common/services/languageFeatures'
export { IModelService } from 'vs/editor/common/services/model'
export { ITextModelService } from 'vs/editor/common/services/resolverService'
export { IClipboardService } from 'vs/platform/clipboard/common/clipboardService'
export { IDialogService } from 'vs/platform/dialogs/common/dialogs'
export { IFileService } from 'vs/platform/files/common/files'
export { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
export { IMarkerService } from 'vs/platform/markers/common/markers'
export { IOpenerService } from 'vs/platform/opener/common/opener'
export { IProductService } from 'vs/platform/product/common/productService'
export { IQuickInputService } from 'vs/platform/quickinput/common/quickInput'
export { ITelemetryService } from 'vs/platform/telemetry/common/telemetry'
export { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity'
export { IBreadcrumbsService } from 'vs/workbench/browser/parts/editor/breadcrumbs'
export {
  IEditorGroupsService,
  GroupDirection,
  GroupOrientation,
  GroupLocation,
  IFindGroupScope,
  GroupsArrangement,
  GroupLayoutArgument,
  EditorGroupLayout,
  IAddGroupOptions,
  MergeGroupMode,
  IMergeGroupOptions,
  ICloseEditorOptions,
  ICloseEditorsFilter,
  ICloseAllEditorsOptions,
  IEditorReplacement,
  GroupsOrder,
  IEditorSideGroup,
  IEditorGroup
} from 'vs/workbench/services/editor/common/editorGroupsService'
export {
  IEditorPane,
  GroupIdentifier,
  EditorInputWithOptions,
  CloseDirection,
  IEditorPartOptions,
  IEditorPartOptionsChangeEvent,
  EditorsOrder,
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
export { IDimension } from 'vs/editor/common/core/dimension'
export { IEditorOptions, ITextEditorOptions, IResourceEditorInput } from 'vs/platform/editor/common/editor'
export { EditorInput } from 'vs/workbench/common/editor/editorInput'
export { IGroupModelChangeEvent } from 'vs/workbench/common/editor/editorGroupModel'
export { IEditorService } from 'vs/workbench/services/editor/common/editorService'
export { IEditorResolverService } from 'vs/workbench/services/editor/common/editorResolverService'
export { ITextEditorService } from 'vs/workbench/services/textfile/common/textEditorService'
export { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService'
export { IHostService } from 'vs/workbench/services/host/browser/host'
export { ILanguageStatusService } from 'vs/workbench/services/languageStatus/common/languageStatusService'
export { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite'
export { IPathService } from 'vs/workbench/services/path/common/pathService'
export { ITextFileService } from 'vs/workbench/services/textfile/common/textfiles'
export { IWorkingCopyFileService } from 'vs/workbench/services/workingCopy/common/workingCopyFileService'
export { IConfigurationService } from 'vs/platform/configuration/common/configuration'
export { IContextKeyService } from 'vs/platform/contextkey/common/contextkey'
export { IThemeService } from 'vs/platform/theme/common/themeService'
export { ISnippetsService } from 'vs/workbench/contrib/snippets/browser/snippets'
export { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace'
export { IStorageService } from 'vs/platform/storage/common/storage'
export { IAudioCueService } from 'vs/platform/audioCues/browser/audioCueService'
export { IDebugService } from 'vs/workbench/contrib/debug/common/debug'
export { ILoggerService, LogLevel } from 'vs/platform/log/common/log'
export { ILogService } from 'vs/platform/log/common/log'
export { IViewsService, IViewDescriptorService } from 'vs/workbench/common/views'
export { ILayoutService } from 'vs/platform/layout/browser/layoutService'
export { IPreferencesService } from 'vs/workbench/services/preferences/common/preferences'
export { IPreferencesSearchService } from 'vs/workbench/contrib/preferences/common/preferences'
export { IKeybindingEditingService } from 'vs/workbench/services/keybinding/common/keybindingEditing'
export { IOutputService } from 'vs/workbench/services/output/common/output'
export { IHistoryService, GoFilter, GoScope } from 'vs/workbench/services/history/common/history'

// Export all Notification service parts
export {
  NotificationsFilter,
  NotificationMessage,
  NotificationPriority,
  INotificationProperties,
  NeverShowAgainScope,
  INeverShowAgainOptions,
  INotification,
  INotificationActions,
  INotificationProgress,
  INotificationProgressProperties,
  INotificationHandle,
  IPromptChoice,
  IPromptChoiceWithMenu,
  IPromptOptions,
  IStatusMessageOptions,
  NoOpNotification,
  NoOpProgress
} from 'vs/platform/notification/common/notification'

// Export all Dialog service parts
export {
  IDialogArgs,
  DialogType,
  IDialogResult,
  IDialogHandler,
  IConfirmDialogArgs,
  IInputDialogArgs,
  IPromptDialogArgs,
  IBaseDialogOptions,
  ICheckbox,
  ICheckboxResult,
  ICustomDialogOptions,
  ICustomDialogMarkdown,
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
export { IMarkdownString, MarkdownStringTrustedOptions } from 'vs/base/common/htmlContent'
export { IActivityService, IBadge } from 'vs/workbench/services/activity/common/activity'
export { IHoverService } from 'vs/workbench/services/hover/browser/hover'
export { IExplorerService } from 'vs/workbench/contrib/files/browser/files'
export { IStatusbarService } from 'vs/workbench/services/statusbar/browser/statusbar'

export {
  IAction,
  IConfigurationChangeEvent,
  ITextModelContentProvider,
  IColorTheme,
  StorageScope,
  StorageTarget,
  Severity
}
