import { setFullscreen } from 'vs/base/browser/browser'
import { detectFullscreen } from 'vs/base/browser/dom'
import { mainWindow } from 'vs/base/browser/window'
import { setUnexpectedErrorHandler } from 'vs/base/common/errors'
import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { RemoteAgentHostLocationPreferenceService } from 'vs/platform/agentHost/browser/remoteAgentHostLocationPreferenceService'
import { IAgentHostByokLmHandler } from 'vs/platform/agentHost/common/agentHostByokLm.service.js'
import {
  ICloudSandboxAgentHostService,
  ICloudSandboxApiService
} from 'vs/platform/agentHost/common/cloudSandboxAgentHost.service'
import { IRemoteAgentHostLocationPreferenceService } from 'vs/platform/agentHost/common/remoteAgentHostLocationPreference.service.js'
import { ITunnelAgentHostService } from 'vs/platform/agentHost/common/tunnelAgentHost.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { ServiceCollection } from 'vs/platform/instantiation/common/serviceCollection'
import { ILogService } from 'vs/platform/log/common/log.service'
import { IChatDashboardService } from 'vs/sessions/browser/chatDashboardService.service.js'
import { CustomViewGridParts } from 'vs/sessions/browser/parts/customViewGridParts'
import { MobileVisualViewport } from 'vs/sessions/browser/parts/mobile/mobileVisualViewport'
import { IMobileVisualViewport } from 'vs/sessions/browser/parts/mobile/mobileVisualViewport.service'
import { SessionsParts } from 'vs/sessions/browser/parts/sessionsParts'
import { SessionsSetUpService } from 'vs/sessions/browser/sessionsSetUpService'
import { ISessionsSetUpService } from 'vs/sessions/browser/sessionsSetUpService.service'
import { Workbench, type IWorkbenchOptions } from 'vs/sessions/browser/workbench'
import { IDevContainerAgentHostService } from 'vs/sessions/common/devContainerAgentHostService.service'
import { ChatDashboardServiceImpl } from 'vs/sessions/contrib/accountMenu/browser/account.contribution'
import { IAgentFeedbackService } from 'vs/sessions/contrib/agentFeedback/browser/agentFeedbackService.service.js'
import { NullAgentFeedbackService } from 'vs/sessions/contrib/agentFeedback/browser/nullAgentFeedbackService.contribution.js'
import { AquariumService } from 'vs/sessions/contrib/aquarium/browser/aquariumOverlay.js'
import { IAquariumService } from 'vs/sessions/contrib/aquarium/browser/aquariumOverlay.service.js'
import { AutomationDialogService } from 'vs/sessions/contrib/automations/browser/automationDialogService'
import { AutomationRunner } from 'vs/sessions/contrib/automations/browser/automationRunner'
import { BrowserAutomationStorageService } from 'vs/sessions/contrib/automations/browser/automationStorageService'
import { ProviderAutomationService } from 'vs/sessions/contrib/automations/browser/providerAutomationService'
import { IAutomationStorageService } from 'vs/sessions/contrib/automations/common/automationStorageService.service.js'
import { SessionChangesService } from 'vs/sessions/contrib/changes/browser/sessionChangesService.js'
import { ISessionChangesService } from 'vs/sessions/contrib/changes/common/sessionChangesService.service.js'
import { ChatViewFactory } from 'vs/sessions/contrib/chat/browser/chatView'
import { SessionsChatViewStateService } from 'vs/sessions/contrib/chat/browser/chatViewStateService'
import { ISessionsChatViewStateService } from 'vs/sessions/contrib/chat/browser/chatViewStateService.service.js'
import { SessionsCustomizationHarnessService } from 'vs/sessions/contrib/chat/browser/customizationHarnessService'
import { NewChatVoiceTargetService } from 'vs/sessions/contrib/chat/browser/newChatVoice'
import { INewChatVoiceTargetService } from 'vs/sessions/contrib/chat/browser/newChatVoice.service.js'
import { NewSessionComposerService } from 'vs/sessions/contrib/chat/browser/newSessionComposerService'
import { INewSessionComposerService } from 'vs/sessions/contrib/chat/browser/newSessionComposerService.service.js'
import { SessionArchiveNudgeService } from 'vs/sessions/contrib/chat/browser/sessionArchiveNudge'
import { ISessionArchiveNudgeService } from 'vs/sessions/contrib/chat/browser/sessionArchiveNudge.service.js'
import { SessionChatPillsDebugService } from 'vs/sessions/contrib/chat/browser/sessionChatInputToolbarDebug'
import { ISessionChatPillsDebugService } from 'vs/sessions/contrib/chat/browser/sessionChatInputToolbarDebug.service.js'
import { SessionTaskRunnerRegistry } from 'vs/sessions/contrib/chat/browser/sessionTaskRunner.js'
import { ISessionTaskRunnerRegistry } from 'vs/sessions/contrib/chat/browser/sessionTaskRunner.service.js'
import { SessionsTasksService } from 'vs/sessions/contrib/chat/browser/sessionsTasksService.js'
import { ISessionsTasksService } from 'vs/sessions/contrib/chat/browser/sessionsTasksService.service.js'
import { CodeReviewService } from 'vs/sessions/contrib/codeReview/browser/codeReviewService'
import { ICodeReviewService } from 'vs/sessions/contrib/codeReview/browser/codeReviewService.service.js'
import { DiffEditorOptionsService } from 'vs/sessions/contrib/editor/browser/diffEditorOptionsService'
import { IDiffEditorOptionsService } from 'vs/sessions/contrib/editor/common/diffEditorOptionsService.service'
import { GitHubService } from 'vs/sessions/contrib/github/browser/githubService'
import { IGitHubService } from 'vs/sessions/contrib/github/browser/githubService.service'
import { PullRequestIconCache } from 'vs/sessions/contrib/github/browser/pullRequestIconCache'
import { IPullRequestIconCache } from 'vs/sessions/contrib/github/browser/pullRequestIconCache.service'
import { CloudSandboxAgentHostService } from 'vs/sessions/contrib/providers/remoteAgentHost/browser/cloudSandboxAgentHostService'
import { CloudSandboxApiService } from 'vs/sessions/contrib/providers/remoteAgentHost/browser/cloudSandboxApiService'
import { CloudSandboxTelemetryService } from 'vs/sessions/contrib/providers/remoteAgentHost/browser/cloudSandboxTelemetry'
import { ICloudSandboxTelemetryService } from 'vs/sessions/contrib/providers/remoteAgentHost/browser/cloudSandboxTelemetry.service'
import { DevContainerAgentHostService } from 'vs/sessions/contrib/providers/remoteAgentHost/browser/devContainerAgentHostService'
import { RemoteAgentHostConnectionCustomizationService } from 'vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHostConnectionCustomization'
import { IRemoteAgentHostConnectionCustomizationService } from 'vs/sessions/contrib/providers/remoteAgentHost/browser/remoteAgentHostConnectionCustomization.service'
import { BrowserTunnelAgentHostServiceSelector } from 'vs/sessions/contrib/providers/remoteAgentHost/browser/webTunnelAgentHostService.contribution'
import { AgentHostFilterService } from 'vs/sessions/services/agentHostFilter/browser/agentHostFilterService'
import { IAgentHostFilterService } from 'vs/sessions/services/agentHostFilter/common/agentHostFilter.service'
import { SessionsChatBackgroundService } from 'vs/sessions/services/chatBackground/browser/chatBackgroundService'
import { ISessionsChatBackgroundService } from 'vs/sessions/services/chatBackground/browser/chatBackgroundService.service.js'
import { IChatViewFactory } from 'vs/sessions/services/chatView/browser/chatViewFactory.service.js'
import { ICustomViewGridPartService } from 'vs/sessions/services/customView/browser/customViewGridPartService.service'
import { CustomViewService } from 'vs/sessions/services/customView/browser/customViewService'
import { ICustomViewService } from 'vs/sessions/services/customView/browser/customViewService.service'
import { ActiveSessionContext } from 'vs/sessions/services/sessions/browser/sessionContext'
import { ISessionContext } from 'vs/sessions/services/sessions/browser/sessionContext.service'
import { SessionGroupsService } from 'vs/sessions/services/sessions/browser/sessionGroupsService'
import { ISessionGroupsService } from 'vs/sessions/services/sessions/browser/sessionGroupsService.service'
import { SessionOpenTelemetryService } from 'vs/sessions/services/sessions/browser/sessionOpenTelemetryService'
import { ISessionOpenTelemetryService } from 'vs/sessions/services/sessions/browser/sessionOpenTelemetryService.service'
import { SessionSectionOrderService } from 'vs/sessions/services/sessions/browser/sessionSectionOrderService'
import { ISessionSectionOrderService } from 'vs/sessions/services/sessions/browser/sessionSectionOrderService.service'
import { SessionsListModelService } from 'vs/sessions/services/sessions/browser/sessionsListModelService'
import { ISessionsListModelService } from 'vs/sessions/services/sessions/browser/sessionsListModelService.service'
import { SessionsManagementService } from 'vs/sessions/services/sessions/browser/sessionsManagementService'
import { ISessionsPartService } from 'vs/sessions/services/sessions/browser/sessionsPartService.service'
import { SessionsProvidersService } from 'vs/sessions/services/sessions/browser/sessionsProvidersService'
import { ISessionsProvidersService } from 'vs/sessions/services/sessions/browser/sessionsProvidersService.service'
import { SessionsRecentWorkspacesService } from 'vs/sessions/services/sessions/browser/sessionsRecentWorkspacesService'
import { ISessionsRecentWorkspacesService } from 'vs/sessions/services/sessions/browser/sessionsRecentWorkspacesService.service'
import { SessionsService } from 'vs/sessions/services/sessions/browser/sessionsService'
import { ISessionsService } from 'vs/sessions/services/sessions/browser/sessionsService.service.js'
import { SessionsWindowUsageService } from 'vs/sessions/services/sessions/browser/sessionsWindowUsageService'
import { ISessionsWindowUsageService } from 'vs/sessions/services/sessions/browser/sessionsWindowUsageService.service.js'
import { SessionChangesStatsCache } from 'vs/sessions/services/sessions/common/sessionChangesStatsCache'
import { ISessionChangesStatsCache } from 'vs/sessions/services/sessions/common/sessionChangesStatsCache.service.js'
import { ISessionsManagementService } from 'vs/sessions/services/sessions/common/sessionsManagement.service'
import { SessionsWorkspaceFolderLabelService } from 'vs/sessions/services/workspaceFolderLabel/browser/workspaceFolderLabelService'
import { BrowserWindow } from 'vs/workbench/browser/window'
import { AgentHostByokLmHandler } from 'vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostByokLmHandler'
import { IAutomationDialogService } from 'vs/workbench/contrib/chat/common/automations/automationDialogService.service.js'
import { IAutomationRunner } from 'vs/workbench/contrib/chat/common/automations/automationRunner.service.js'
import { IAutomationService } from 'vs/workbench/contrib/chat/common/automations/automationService.service.js'
import { ICustomizationHarnessService } from 'vs/workbench/contrib/chat/common/customizationHarnessService.service.js'
import { IWorkbenchLayoutService } from 'vs/workbench/services/layout/browser/layoutService.service'
import { IWorkspaceFolderLabelService } from 'vs/workbench/services/workspaces/common/workspaceFolderLabelService.service'
import { onLayout, onRenderWorkbench } from '../../lifecycle'
import { getWorkbenchContainer } from '../../workbench'
import getChatServiceOverride from '../chat/session'
import getBannerServiceOverride from '../viewBanner'
import getViewCommonServiceOverride from '../viewCommon/session'
import getStatusBarServiceOverride from '../viewStatusBar'
import getCommonServiceOverride from './common'
export * from '../tools/views'
import 'vs/sessions/browser/parts/menubar.contribution'
import 'vs/sessions/browser/sessions.web.contribution'
import 'vs/sessions/contrib/accountMenu/browser/account.contribution'
import 'vs/sessions/contrib/aiCustomizationTreeView/browser/aiCustomizationTreeView.contribution'
import 'vs/sessions/contrib/aquarium/browser/aquarium.contribution'
import 'vs/sessions/contrib/automations/browser/automations.contribution'
import 'vs/sessions/contrib/browserView/browser/sessionBrowserView.contribution'
import 'vs/sessions/contrib/changes/browser/changes.contribution'
import 'vs/sessions/contrib/chatDebug/browser/chatDebug.contribution'
import 'vs/sessions/contrib/customViewTest/browser/customViewTest.contribution'
import 'vs/sessions/contrib/editor/browser/diffEditor.sessions.contribution'
import 'vs/sessions/contrib/editor/browser/editor.contribution'
import 'vs/sessions/contrib/editor/browser/emptyFileEditor.contribution'
import 'vs/sessions/contrib/fileTreeView/browser/fileTreeView.contribution'
import 'vs/sessions/contrib/files/browser/files.contribution'
import 'vs/sessions/contrib/layout/browser/sessions.layout.contribution'
import 'vs/sessions/contrib/onboardingTours/browser/onboardingTours.contribution'
import 'vs/sessions/contrib/policyBlocked/browser/policyBlocked.contribution'
import 'vs/sessions/contrib/search/browser/search.contribution'
import 'vs/sessions/contrib/search/browser/searchEditorEmptyState.contribution'
import 'vs/sessions/contrib/sessions/browser/customizationsToolbar.contribution'
import 'vs/sessions/contrib/sessions/browser/sessions.contribution'
import 'vs/sessions/contrib/sessions/browser/sessionsTelemetry.contribution'
import 'vs/sessions/contrib/workspace/browser/workspace.contribution'

class CustomWorkbench extends Workbench {
  constructor(
    options: IWorkbenchOptions | undefined,
    @ILogService logService: ILogService,
    @IInstantiationService private _instantiationService: IInstantiationService
  ) {
    super(getWorkbenchContainer(), options, new ServiceCollection(), logService)

    this.mainContainer.classList.add('monaco-workbench-part')
  }

  protected override registerErrorHandler(logService: ILogService): void {
    // prevent intercepting global error events
    setUnexpectedErrorHandler((error) => this.handleUnexpectedError(error, logService))
  }

  protected override createNotificationsHandlers() {
    this.registerNotificationRowHeight()

    // nothing, it's done in the notification service override
    // Register with Layout
  }

  protected override initServices(): IInstantiationService {
    return this._instantiationService
  }

  protected override restore(): void {
    performance.measure(
      'perf: workbench create & restore',
      'code/didLoadWorkbenchMain',
      'code/didStartWorkbench'
    )

    // Restore parts (open default view containers)
    this.restoreParts()

    // Restore the sessions that were visible in the grid.
    void this.sessionsService.restoreVisibleSessions().catch((e) => {
      this.logService.error('[Workbench] restoreVisibleSessions failed', e)
    })

    // prevent managing lifecycle service phase as it's already done in lifecycle.ts
  }
}

onLayout(async (accessor) => {
  ;(accessor.get(IWorkbenchLayoutService) as Workbench).startup()
  const detectedFullScreen = detectFullscreen(mainWindow, getWorkbenchContainer())
  setFullscreen(detectedFullScreen != null && !detectedFullScreen.guess, mainWindow)
})
onRenderWorkbench(async (accessor) => {
  accessor.get(IInstantiationService).createInstance(BrowserWindow)
})

export default function getServiceOverride(
  options?: IWorkbenchOptions,
  _webviewIframeAlternateDomains?: string
): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride(),
    ...getViewCommonServiceOverride(_webviewIframeAlternateDomains),

    [IWorkbenchLayoutService.toString()]: new SyncDescriptor(CustomWorkbench, [options], false),
    [IWorkspaceFolderLabelService.toString()]: new SyncDescriptor(
      SessionsWorkspaceFolderLabelService,
      [],
      true
    ),
    ...getStatusBarServiceOverride(),
    ...getBannerServiceOverride(),

    [ISessionsSetUpService.toString()]: new SyncDescriptor(SessionsSetUpService, [], true),

    [ICustomViewGridPartService.toString()]: new SyncDescriptor(CustomViewGridParts, [], true),

    [ISessionsPartService.toString()]: new SyncDescriptor(SessionsParts, [], true),

    [IMobileVisualViewport.toString()]: new SyncDescriptor(MobileVisualViewport, [], true),

    ...getChatServiceOverride(),

    // Specific services
    [IRemoteAgentHostLocationPreferenceService.toString()]: new SyncDescriptor(
      RemoteAgentHostLocationPreferenceService,
      [],
      true
    ),
    [IChatDashboardService.toString()]: new SyncDescriptor(ChatDashboardServiceImpl, [], true),
    [IAgentFeedbackService.toString()]: new SyncDescriptor(NullAgentFeedbackService, [], true),
    [IAquariumService.toString()]: new SyncDescriptor(AquariumService, [], true),
    [IAutomationStorageService.toString()]: new SyncDescriptor(
      BrowserAutomationStorageService,
      [],
      true
    ),
    [IAutomationService.toString()]: new SyncDescriptor(ProviderAutomationService, [], true),
    [IAutomationRunner.toString()]: new SyncDescriptor(AutomationRunner, [], true),
    [IAutomationDialogService.toString()]: new SyncDescriptor(AutomationDialogService, [], true),
    [ISessionChangesService.toString()]: new SyncDescriptor(SessionChangesService, [], true),
    [ISessionTaskRunnerRegistry.toString()]: new SyncDescriptor(
      SessionTaskRunnerRegistry,
      [],
      true
    ),
    [ISessionsTasksService.toString()]: new SyncDescriptor(SessionsTasksService, [], true),
    [ICustomizationHarnessService.toString()]: new SyncDescriptor(
      SessionsCustomizationHarnessService,
      [],
      true
    ),
    [IChatViewFactory.toString()]: new SyncDescriptor(ChatViewFactory, [], true),
    [ISessionsChatViewStateService.toString()]: new SyncDescriptor(
      SessionsChatViewStateService,
      [],
      true
    ),
    [ISessionsChatBackgroundService.toString()]: new SyncDescriptor(
      SessionsChatBackgroundService,
      [],
      true
    ),
    [ISessionArchiveNudgeService.toString()]: new SyncDescriptor(
      SessionArchiveNudgeService,
      [],
      true
    ),
    [INewChatVoiceTargetService.toString()]: new SyncDescriptor(
      NewChatVoiceTargetService,
      [],
      true
    ),
    [INewSessionComposerService.toString()]: new SyncDescriptor(
      NewSessionComposerService,
      [],
      true
    ),
    [ISessionChatPillsDebugService.toString()]: new SyncDescriptor(
      SessionChatPillsDebugService,
      [],
      true
    ),
    [IAgentHostByokLmHandler.toString()]: new SyncDescriptor(AgentHostByokLmHandler, [], true),
    [ICodeReviewService.toString()]: new SyncDescriptor(CodeReviewService, [], true),
    [IDiffEditorOptionsService.toString()]: new SyncDescriptor(DiffEditorOptionsService, [], true),
    [IGitHubService.toString()]: new SyncDescriptor(GitHubService, [], true),
    [IPullRequestIconCache.toString()]: new SyncDescriptor(PullRequestIconCache, [], true),
    [ICloudSandboxTelemetryService.toString()]: new SyncDescriptor(
      CloudSandboxTelemetryService,
      [],
      true
    ),
    [ICloudSandboxApiService.toString()]: new SyncDescriptor(CloudSandboxApiService, [], true),
    [ICloudSandboxAgentHostService.toString()]: new SyncDescriptor(
      CloudSandboxAgentHostService,
      [],
      true
    ),
    [IDevContainerAgentHostService.toString()]: new SyncDescriptor(
      DevContainerAgentHostService,
      [],
      true
    ),
    [IRemoteAgentHostConnectionCustomizationService.toString()]: new SyncDescriptor(
      RemoteAgentHostConnectionCustomizationService,
      [],
      true
    ),
    [ITunnelAgentHostService.toString()]: new SyncDescriptor(
      BrowserTunnelAgentHostServiceSelector,
      [],
      true
    ),
    [IAgentHostFilterService.toString()]: new SyncDescriptor(AgentHostFilterService, [], true),
    [ICustomViewService.toString()]: new SyncDescriptor(CustomViewService, [], true),
    [ISessionContext.toString()]: new SyncDescriptor(ActiveSessionContext, [], true),
    [ISessionGroupsService.toString()]: new SyncDescriptor(SessionGroupsService, [], true),
    [ISessionOpenTelemetryService.toString()]: new SyncDescriptor(
      SessionOpenTelemetryService,
      [],
      true
    ),
    [ISessionSectionOrderService.toString()]: new SyncDescriptor(
      SessionSectionOrderService,
      [],
      true
    ),
    [ISessionsListModelService.toString()]: new SyncDescriptor(SessionsListModelService, [], true),
    [ISessionsManagementService.toString()]: new SyncDescriptor(
      SessionsManagementService,
      [],
      true
    ),
    [ISessionsProvidersService.toString()]: new SyncDescriptor(SessionsProvidersService, [], true),
    [ISessionsRecentWorkspacesService.toString()]: new SyncDescriptor(
      SessionsRecentWorkspacesService,
      [],
      true
    ),
    [ISessionsService.toString()]: new SyncDescriptor(SessionsService, [], true),
    [ISessionsWindowUsageService.toString()]: new SyncDescriptor(
      SessionsWindowUsageService,
      [],
      true
    ),
    [ISessionChangesStatsCache.toString()]: new SyncDescriptor(SessionChangesStatsCache, [], true)
  }
}
