export * from './setup.common'
import { constructOptions as commonConstructOptions } from './setup.common'

import {
  IEditorOverrideServices,
  IWorkbenchConstructionOptions
} from '@codingame/monaco-vscode-api'
import * as vscode from 'vscode'
import { commonServices as _commonService } from './setup.common'
import getOutlineServiceOverride from '@codingame/monaco-vscode-outline-service-override/session'
import getSearchServiceOverride from '@codingame/monaco-vscode-search-service-override/session'
import getChatServiceOverride from '@codingame/monaco-vscode-chat-service-override/session'
import getWelcomeServiceOverride from '@codingame/monaco-vscode-welcome-service-override/session'
import getUserDataSyncServiceOverride from '@codingame/monaco-vscode-user-data-sync-service-override/session'
import getTelemetryServiceOverride from '@codingame/monaco-vscode-telemetry-service-override/session'
import getMcpServiceOverride from '@codingame/monaco-vscode-mcp-service-override/session'
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override/session'
import getDialogsServiceOverride from '@codingame/monaco-vscode-dialogs-service-override/session'
import getExtensionGalleryServiceOverride from '@codingame/monaco-vscode-extension-gallery-service-override/session'
import getDebugServiceOverride from '@codingame/monaco-vscode-debug-service-override/session'
import getMarkersServiceOverride from '@codingame/monaco-vscode-markers-service-override/session'
import getTestingServiceOverride from '@codingame/monaco-vscode-testing-service-override/session'
import getTimelineServiceOverride from '@codingame/monaco-vscode-timeline-service-override/session'
import getGithubServiceOverride from '@codingame/monaco-vscode-github-service-override/session'
import getTitleBarServiceOverride from '@codingame/monaco-vscode-view-title-bar-service-override/session'

export const constructOptions: IWorkbenchConstructionOptions = {
  ...commonConstructOptions,
  configurationDefaults: {
    ...commonConstructOptions.configurationDefaults,
    'chat.remoteAgentHosts': [
      {
        address: '127.0.0.1:9187',
        name: 'ahpd'
      }
    ],
    'sessions.useWorktree': false
  },
  workspaceProvider: {
    trusted: true,
    async open() {
      window.open(window.location.href)
      return true
    },
    workspace: {
      id: 'session-workspace',
      workspaceUri: vscode.Uri.from({
        path: '/User/agent-sessions.code-workspace',
        scheme: 'vscode-userdata'
      })
    }
  }
}

export const commonServices: IEditorOverrideServices = {
  ..._commonService,
  ...getOutlineServiceOverride(),
  ...getSearchServiceOverride(),
  ...getChatServiceOverride({
    defaultAccount: {
      entitlementsData: {
        access_type_sku: 'unused',
        assigned_date: 'unused',
        can_signup_for_limited: false,
        copilot_plan: 'enterprise',
        organization_login_list: [],
        analytics_tracking_id: 'unused',
        chat_enabled: true
      },
      accountName: 'CodinGame',
      authenticationProvider: {
        id: 'unused',
        name: 'unused',
        enterprise: true
      },
      enterprise: true,
      sessionId: 'unused'
    }
  }),
  ...getUserDataSyncServiceOverride(),
  ...getWelcomeServiceOverride(),
  ...getTelemetryServiceOverride(),
  ...getMcpServiceOverride(),
  ...getTimelineServiceOverride(),
  ...getDialogsServiceOverride(),
  ...getTestingServiceOverride(),
  ...getDebugServiceOverride(),
  ...getExtensionGalleryServiceOverride({ webOnly: false }),
  ...getConfigurationServiceOverride(),
  ...getMarkersServiceOverride(),
  ...getGithubServiceOverride(),
  ...getTitleBarServiceOverride()
}
