import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ITaskService } from 'vs/workbench/contrib/tasks/common/taskService.service'
import { TaskService } from 'vs/workbench/contrib/tasks/browser/taskService'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration.service'
import { IMarkerService } from 'vs/platform/markers/common/markers.service'
import { IOutputService } from 'vs/workbench/services/output/common/output.service'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite.service'
import { IViewsService } from 'vs/workbench/services/views/common/viewsService.service'
import { ICommandService } from 'vs/platform/commands/common/commands.service'
import { IEditorService } from 'vs/workbench/services/editor/common/editorService.service'
import { IFileService } from 'vs/platform/files/common/files.service'
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace.service'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry.service'
import { ITextFileService } from 'vs/workbench/services/textfile/common/textfiles.service'
import { IModelService } from 'vs/editor/common/services/model.service'
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions.service'
import { IQuickInputService } from 'vs/platform/quickinput/common/quickInput.service'
import { IConfigurationResolverService } from 'vs/workbench/services/configurationResolver/common/configurationResolver.service'
import {
  ITerminalGroupService,
  ITerminalService
} from 'vs/workbench/contrib/terminal/browser/terminal.service'
import { IStorageService } from 'vs/platform/storage/common/storage.service'
import { IProgressService } from 'vs/platform/progress/common/progress.service'
import { IOpenerService } from 'vs/platform/opener/common/opener.service'
import { IDialogService } from 'vs/platform/dialogs/common/dialogs.service'
import { INotificationService } from 'vs/platform/notification/common/notification.service'
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey.service'
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService.service'
import { ITerminalProfileResolverService } from 'vs/workbench/contrib/terminal/common/terminal.service'
import { IPathService } from 'vs/workbench/services/path/common/pathService.service'
import { ITextModelService } from 'vs/editor/common/services/resolverService.service'
import { IPreferencesService } from 'vs/workbench/services/preferences/common/preferences.service'
import { IChatAgentService } from 'vs/workbench/contrib/chat/common/chatAgents.service'
import { IChatService } from 'vs/workbench/contrib/chat/common/chatService.service'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService.service'
import { ILifecycleService } from 'vs/workbench/services/lifecycle/common/lifecycle.service'
import { IThemeService } from 'vs/platform/theme/common/themeService.service'
import { ILogService } from 'vs/platform/log/common/log.service'
import {
  IWorkspaceTrustManagementService,
  IWorkspaceTrustRequestService
} from 'vs/platform/workspace/common/workspaceTrust.service'
import { IViewDescriptorService } from 'vs/workbench/common/views.service'
import 'vs/workbench/contrib/tasks/browser/task.contribution'
import { IHostService } from 'vs/workbench/services/host/browser/host.service'

class CustomTaskService extends TaskService {
  constructor(
    forcedSupportedExecutions: ForcedSupportedExecutions | undefined,
    @IConfigurationService _configurationService: IConfigurationService,
    @IMarkerService _markerService: IMarkerService,
    @IOutputService _outputService: IOutputService,
    @IPaneCompositePartService _paneCompositeService: IPaneCompositePartService,
    @IViewsService _viewsService: IViewsService,
    @ICommandService _commandService: ICommandService,
    @IEditorService _editorService: IEditorService,
    @IFileService _fileService: IFileService,
    @IWorkspaceContextService _contextService: IWorkspaceContextService,
    @ITelemetryService _telemetryService: ITelemetryService,
    @ITextFileService _textFileService: ITextFileService,
    @IModelService _modelService: IModelService,
    @IExtensionService _extensionService: IExtensionService,
    @IQuickInputService _quickInputService: IQuickInputService,
    @IConfigurationResolverService _configurationResolverService: IConfigurationResolverService,
    @ITerminalService _terminalService: ITerminalService,
    @ITerminalGroupService _terminalGroupService: ITerminalGroupService,
    @IStorageService _storageService: IStorageService,
    @IProgressService _progressService: IProgressService,
    @IOpenerService _openerService: IOpenerService,
    @IDialogService _dialogService: IDialogService,
    @INotificationService _notificationService: INotificationService,
    @IContextKeyService _contextKeyService: IContextKeyService,
    @IWorkbenchEnvironmentService _environmentService: IWorkbenchEnvironmentService,
    @ITerminalProfileResolverService
    _terminalProfileResolverService: ITerminalProfileResolverService,
    @IPathService _pathService: IPathService,
    @ITextModelService _textModelResolverService: ITextModelService,
    @IPreferencesService _preferencesService: IPreferencesService,
    @IViewDescriptorService _viewDescriptorService: IViewDescriptorService,
    @IWorkspaceTrustRequestService _workspaceTrustRequestService: IWorkspaceTrustRequestService,
    @IWorkspaceTrustManagementService
    _workspaceTrustManagementService: IWorkspaceTrustManagementService,
    @ILogService _logService: ILogService,
    @IThemeService _themeService: IThemeService,
    @ILifecycleService _lifecycleService: ILifecycleService,
    @IRemoteAgentService remoteAgentService: IRemoteAgentService,
    @IInstantiationService _instantiationService: IInstantiationService,
    @IChatService _chatService: IChatService,
    @IChatAgentService _chatAgentService: IChatAgentService,
    @IHostService _hostService: IHostService
  ) {
    super(
      _configurationService,
      _markerService,
      _outputService,
      _paneCompositeService,
      _viewsService,
      _commandService,
      _editorService,
      _fileService,
      _contextService,
      _telemetryService,
      _textFileService,
      _modelService,
      _extensionService,
      _quickInputService,
      _configurationResolverService,
      _terminalService,
      _terminalGroupService,
      _storageService,
      _progressService,
      _openerService,
      _dialogService,
      _notificationService,
      _contextKeyService,
      _environmentService,
      _terminalProfileResolverService,
      _pathService,
      _textModelResolverService,
      _preferencesService,
      _viewDescriptorService,
      _workspaceTrustRequestService,
      _workspaceTrustManagementService,
      _logService,
      _themeService,
      _lifecycleService,
      remoteAgentService,
      _instantiationService,
      _chatService,
      _chatAgentService,
      _hostService
    )

    if (forcedSupportedExecutions != null) {
      this.registerSupportedExecutions(
        forcedSupportedExecutions.custom,
        forcedSupportedExecutions.shell,
        forcedSupportedExecutions.process
      )
    }
  }
}

export interface ForcedSupportedExecutions {
  custom?: boolean
  shell?: boolean
  process?: boolean
}
export interface TaskServiceOverrideParams {
  /**
   * By default, only custom tasks are supported
   * When using the VSCode server, the server registers all the task types as supported
   * But if the user has registered custom terminal backends, they may want to force support for other task types
   */
  forcedSupportedExecutions?: ForcedSupportedExecutions
}

export default function getServiceOverride({
  forcedSupportedExecutions
}: TaskServiceOverrideParams = {}): IEditorOverrideServices {
  return {
    [ITaskService.toString()]: new SyncDescriptor(
      CustomTaskService,
      [forcedSupportedExecutions],
      true
    )
  }
}
