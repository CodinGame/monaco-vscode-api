import {
  IEditorOverrideServices,
  IWorkbenchConstructionOptions,
  LogLevel
} from '@codingame/monaco-vscode-api'
import { initUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override/common'
import { createIndexedDBProviders } from '@codingame/monaco-vscode-files-service-override'
import getKeybindingsServiceOverride, {
  initUserKeybindings
} from '@codingame/monaco-vscode-keybindings-service-override'
import getModelServiceOverride from '@codingame/monaco-vscode-model-service-override'
import getNotificationServiceOverride from '@codingame/monaco-vscode-notifications-service-override'
import * as vscode from 'vscode'

import getAccessibilityServiceOverride from '@codingame/monaco-vscode-accessibility-service-override'
import getAiServiceOverride from '@codingame/monaco-vscode-ai-service-override'
import { EnvironmentOverride } from '@codingame/monaco-vscode-api/workbench'
import getAssignmentServiceOverride from '@codingame/monaco-vscode-assignment-service-override'
import getAuthenticationServiceOverride from '@codingame/monaco-vscode-authentication-service-override'
import { ChatEntitlement } from '@codingame/monaco-vscode-chat-service-override/common'
import getCommentsServiceOverride from '@codingame/monaco-vscode-comments-service-override'
import getEditSessionsServiceOverride from '@codingame/monaco-vscode-edit-sessions-service-override'
import getEmmetServiceOverride from '@codingame/monaco-vscode-emmet-service-override'
import getEnvironmentServiceOverride from '@codingame/monaco-vscode-environment-service-override'
import getExplorerServiceOverride from '@codingame/monaco-vscode-explorer-service-override'
import getExtensionServiceOverride from '@codingame/monaco-vscode-extensions-service-override'
import getImageResizeServiceOverride from '@codingame/monaco-vscode-image-resize-service-override'
import getInteractiveServiceOverride from '@codingame/monaco-vscode-interactive-service-override'
import getIssueServiceOverride from '@codingame/monaco-vscode-issue-service-override'
import getLanguageDetectionWorkerServiceOverride from '@codingame/monaco-vscode-language-detection-worker-service-override'
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override'
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override'
import getLocalizationServiceOverride from '@codingame/monaco-vscode-localization-service-override'
import getLogServiceOverride from '@codingame/monaco-vscode-log-service-override'
import getMultiDiffEditorServiceOverride from '@codingame/monaco-vscode-multi-diff-editor-service-override'
import getNotebookServiceOverride from '@codingame/monaco-vscode-notebook-service-override'
import getOutputServiceOverride from '@codingame/monaco-vscode-output-service-override'
import getPerformanceServiceOverride from '@codingame/monaco-vscode-performance-service-override'
import getPreferencesServiceOverride from '@codingame/monaco-vscode-preferences-service-override'
import getProcessControllerServiceOverride from '@codingame/monaco-vscode-process-explorer-service-override'
import getRelauncherServiceOverride from '@codingame/monaco-vscode-relauncher-service-override'
import getRemoteAgentServiceOverride from '@codingame/monaco-vscode-remote-agent-service-override'
import getScmServiceOverride from '@codingame/monaco-vscode-scm-service-override'
import getSecretStorageServiceOverride from '@codingame/monaco-vscode-secret-storage-service-override'
import getShareServiceOverride from '@codingame/monaco-vscode-share-service-override'
import getSpeechServiceOverride from '@codingame/monaco-vscode-speech-service-override'
import getStorageServiceOverride from '@codingame/monaco-vscode-storage-service-override'
import getSurveyServiceOverride from '@codingame/monaco-vscode-survey-service-override'
import getTaskServiceOverride from '@codingame/monaco-vscode-task-service-override'
import getTerminalServiceOverride from '@codingame/monaco-vscode-terminal-service-override'
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override'
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override'
import getTreeSitterServiceOverride from '@codingame/monaco-vscode-treesitter-service-override'
import getUpdateServiceOverride from '@codingame/monaco-vscode-update-service-override'
import getUserDataProfileServiceOverride from '@codingame/monaco-vscode-user-data-profile-service-override'
import getBannerServiceOverride from '@codingame/monaco-vscode-view-banner-service-override'
import getStatusBarServiceOverride from '@codingame/monaco-vscode-view-status-bar-service-override'
import getWorkingCopyServiceOverride from '@codingame/monaco-vscode-working-copy-service-override'
import getWorkspaceTrustOverride from '@codingame/monaco-vscode-workspace-trust-service-override'
import 'vscode/localExtensionHost'
import { TerminalBackend } from './features/terminal.js'
import { Worker } from './tools/fakeWorker.js'
import defaultConfiguration from './user/configuration.json?raw'
import defaultKeybindings from './user/keybindings.json?raw'

const url = new URL(document.location.href)
export const params = url.searchParams
export const remoteAuthority = params.get('remoteAuthority') ?? undefined
export const connectionToken = params.get('connectionToken') ?? undefined
export const disableShadowDom = params.has('disableShadowDom')

window.history.replaceState({}, document.title, url.href)

export const userDataProvider = await createIndexedDBProviders()

// Workers
const workers: Partial<Record<string, Worker>> = {
  editorWorkerService: new Worker(
    new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
    { type: 'module' }
  ),
  extensionHostWorkerMain: new Worker(
    new URL('@codingame/monaco-vscode-api/workers/extensionHost.worker', import.meta.url),
    { type: 'module' }
  ),
  TextMateWorker: new Worker(
    new URL('@codingame/monaco-vscode-textmate-service-override/worker', import.meta.url),
    { type: 'module' }
  ),
  OutputLinkDetectionWorker: new Worker(
    new URL('@codingame/monaco-vscode-output-service-override/worker', import.meta.url),
    { type: 'module' }
  ),
  LanguageDetectionWorker: new Worker(
    new URL(
      '@codingame/monaco-vscode-language-detection-worker-service-override/worker',
      import.meta.url
    ),
    { type: 'module' }
  ),
  NotebookEditorWorker: new Worker(
    new URL('@codingame/monaco-vscode-notebook-service-override/worker', import.meta.url),
    { type: 'module' }
  ),
  LocalFileSearchWorker: new Worker(
    new URL('@codingame/monaco-vscode-search-service-override/worker', import.meta.url),
    { type: 'module' }
  )
}

window.MonacoEnvironment = {
  getWorkerUrl(_, label) {
    return workers[label]?.url.toString()
  },
  getWorkerOptions(_, label) {
    return workers[label]?.options
  }
}

// Set configuration before initializing service so it's directly available (especially for the theme, to prevent a flicker)
await Promise.all([
  initUserConfiguration(defaultConfiguration),
  initUserKeybindings(defaultKeybindings)
])

export const constructOptions: IWorkbenchConstructionOptions = {
  remoteAuthority,
  enableWorkspaceTrust: true,
  connectionToken,
  windowIndicator: {
    label: 'monaco-vscode-api',
    tooltip: '',
    command: ''
  },
  developmentOptions: {
    logLevel: LogLevel.Info // Default value
  },
  configurationDefaults: {
    'window.title': 'Monaco-Vscode-Api${separator}${dirty}${activeEditorShort}'
  },
  welcomeBanner: {
    message: 'Welcome in monaco-vscode-api demo'
  },
  productConfiguration: {
    nameShort: 'monaco-vscode-api',
    nameLong: 'monaco-vscode-api',
    extensionsGallery: {
      serviceUrl: 'https://open-vsx.org/vscode/gallery',
      resourceUrlTemplate: 'https://open-vsx.org/vscode/unpkg/{publisher}/{name}/{version}/{path}',
      extensionUrlTemplate: 'https://open-vsx.org/vscode/gallery/{publisher}/{name}/latest', // https://github.com/eclipse/openvsx/issues/1036#issuecomment-2476449435
      controlUrl: '',
      nlsBaseUrl: ''
    }
  },
  enabledExtensions: ['codingame.demo-main', 'codingame.demo']
}

export const envOptions: EnvironmentOverride = {
  // Otherwise, VSCode detect it as the first open workspace folder
  // which make the search result extension fail as it's not able to know what was detected by VSCode
  userHome: vscode.Uri.file('/')
}

const alternateDomainPatternUrl = new URL('.', import.meta.url)
alternateDomainPatternUrl.pathname = ''

// Only localhost supports subdomains, netlify doesn't
if (alternateDomainPatternUrl.hostname.includes('localhost')) {
  alternateDomainPatternUrl.hostname = `{{uuid}}.${alternateDomainPatternUrl.hostname}`
}

export let alternateDomainPattern = alternateDomainPatternUrl.href

export const commonServices: IEditorOverrideServices = {
  ...getAuthenticationServiceOverride(),
  ...getLogServiceOverride(),
  ...getExtensionServiceOverride({
    enableWorkerExtensionHost: true,
    iframeAlternateDomain: alternateDomainPattern
  }),

  ...getModelServiceOverride(),
  ...getNotificationServiceOverride(),

  ...getKeybindingsServiceOverride(),
  ...getTextmateServiceOverride(),
  ...getTreeSitterServiceOverride(),
  ...getThemeServiceOverride(),
  ...getLanguagesServiceOverride(),

  ...getPreferencesServiceOverride(),

  ...getBannerServiceOverride(),
  ...getStatusBarServiceOverride(),

  ...getOutputServiceOverride(),
  ...getTerminalServiceOverride(new TerminalBackend()),

  ...getAccessibilityServiceOverride(),
  ...getLanguageDetectionWorkerServiceOverride(),
  ...getStorageServiceOverride({
    forcedValues: {
      /**
       * VSCode stores in its storage the chat setup state
       * We need it to be configured out of the box, with is not supported by VSCode
       * Except if we set the desired state in its storage directly, then it will work as if the user had set it up already
       */
      'chat.setupContext': {
        entitlement: ChatEntitlement.Enterprise,
        organisations: undefined,
        sku: undefined,
        copilotTrackingId: undefined,
        registered: true,
        completed: true,
        installed: true
      }
    },
    fallbackOverride: {
      'workbench.activity.showAccounts': false
    }
  }),
  ...getRemoteAgentServiceOverride({ scanRemoteExtensions: true }),
  ...getLifecycleServiceOverride(),
  ...getEnvironmentServiceOverride(),
  ...getWorkspaceTrustOverride(),
  ...getWorkingCopyServiceOverride(),
  ...getScmServiceOverride(),

  ...getNotebookServiceOverride(),

  ...getUserDataProfileServiceOverride(),

  ...getAiServiceOverride(),
  ...getTaskServiceOverride(),
  ...getCommentsServiceOverride(),
  ...getEditSessionsServiceOverride(),
  ...getEmmetServiceOverride(),
  ...getInteractiveServiceOverride(),
  ...getIssueServiceOverride(),
  ...getMultiDiffEditorServiceOverride(),
  ...getPerformanceServiceOverride(),
  ...getRelauncherServiceOverride(),
  ...getShareServiceOverride(),
  ...getSpeechServiceOverride(),
  ...getSurveyServiceOverride(),
  ...getUpdateServiceOverride(),
  ...getExplorerServiceOverride(),
  ...getLocalizationServiceOverride({
    async clearLocale() {
      const url = new URL(window.location.href)
      url.searchParams.delete('locale')
      window.history.pushState(null, '', url.toString())
    },
    async setLocale(id) {
      const url = new URL(window.location.href)
      url.searchParams.set('locale', id)
      window.history.pushState(null, '', url.toString())
    },
    availableLanguages: [
      {
        locale: 'en',
        languageName: 'English'
      },
      {
        locale: 'cs',
        languageName: 'Czech'
      },
      {
        locale: 'de',
        languageName: 'German'
      },
      {
        locale: 'es',
        languageName: 'Spanish'
      },
      {
        locale: 'fr',
        languageName: 'French'
      },
      {
        locale: 'it',
        languageName: 'Italian'
      },
      {
        locale: 'ja',
        languageName: 'Japanese'
      },
      {
        locale: 'ko',
        languageName: 'Korean'
      },
      {
        locale: 'pl',
        languageName: 'Polish'
      },
      {
        locale: 'pt-br',
        languageName: 'Portuguese (Brazil)'
      },
      {
        locale: 'qps-ploc',
        languageName: 'Pseudo Language'
      },
      {
        locale: 'ru',
        languageName: 'Russian'
      },
      {
        locale: 'tr',
        languageName: 'Turkish'
      },
      {
        locale: 'zh-hans',
        languageName: 'Chinese (Simplified)'
      },
      {
        locale: 'zh-hant',
        languageName: 'Chinese (Traditional)'
      },
      {
        locale: 'en',
        languageName: 'English'
      }
    ]
  }),
  ...getSecretStorageServiceOverride(),

  ...getProcessControllerServiceOverride(),
  ...getImageResizeServiceOverride(),
  ...getAssignmentServiceOverride()
}
