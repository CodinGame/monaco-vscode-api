import getConfigurationServiceOverride, {
  IStoredWorkspace,
  initUserConfiguration
} from '@codingame/monaco-vscode-configuration-service-override'
import getKeybindingsServiceOverride, {
  initUserKeybindings
} from '@codingame/monaco-vscode-keybindings-service-override'
import {
  RegisteredFileSystemProvider,
  RegisteredMemoryFile,
  RegisteredReadOnlyFile,
  createIndexedDBProviders,
  registerHTMLFileSystemProvider,
  registerFileSystemOverlay,
  initFile
} from '@codingame/monaco-vscode-files-service-override'
import * as monaco from 'monaco-editor'
import {
  IWorkbenchConstructionOptions,
  LogLevel,
  IEditorOverrideServices
} from '@codingame/monaco-vscode-api'
import * as vscode from 'vscode'
import getModelServiceOverride from '@codingame/monaco-vscode-model-service-override'
import getNotificationServiceOverride from '@codingame/monaco-vscode-notifications-service-override'
import getDialogsServiceOverride from '@codingame/monaco-vscode-dialogs-service-override'
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override'
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override'
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override'
import getSecretStorageServiceOverride from '@codingame/monaco-vscode-secret-storage-service-override'
import getAuthenticationServiceOverride from '@codingame/monaco-vscode-authentication-service-override'
import getScmServiceOverride from '@codingame/monaco-vscode-scm-service-override'
import getExtensionGalleryServiceOverride from '@codingame/monaco-vscode-extension-gallery-service-override'
import getBannerServiceOverride from '@codingame/monaco-vscode-view-banner-service-override'
import getStatusBarServiceOverride from '@codingame/monaco-vscode-view-status-bar-service-override'
import getTitleBarServiceOverride from '@codingame/monaco-vscode-view-title-bar-service-override'
import getDebugServiceOverride from '@codingame/monaco-vscode-debug-service-override'
import getPreferencesServiceOverride from '@codingame/monaco-vscode-preferences-service-override'
import getSnippetServiceOverride from '@codingame/monaco-vscode-snippets-service-override'
import getOutputServiceOverride from '@codingame/monaco-vscode-output-service-override'
import getTerminalServiceOverride from '@codingame/monaco-vscode-terminal-service-override'
import getSearchServiceOverride from '@codingame/monaco-vscode-search-service-override'
import getMarkersServiceOverride from '@codingame/monaco-vscode-markers-service-override'
import getAccessibilityServiceOverride from '@codingame/monaco-vscode-accessibility-service-override'
import getLanguageDetectionWorkerServiceOverride from '@codingame/monaco-vscode-language-detection-worker-service-override'
import getStorageServiceOverride from '@codingame/monaco-vscode-storage-service-override'
import getExtensionServiceOverride from '@codingame/monaco-vscode-extensions-service-override'
import getRemoteAgentServiceOverride from '@codingame/monaco-vscode-remote-agent-service-override'
import getEnvironmentServiceOverride from '@codingame/monaco-vscode-environment-service-override'
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override'
import getWorkspaceTrustOverride from '@codingame/monaco-vscode-workspace-trust-service-override'
import getLogServiceOverride from '@codingame/monaco-vscode-log-service-override'
import getWorkingCopyServiceOverride from '@codingame/monaco-vscode-working-copy-service-override'
import getTestingServiceOverride from '@codingame/monaco-vscode-testing-service-override'
import getChatServiceOverride from '@codingame/monaco-vscode-chat-service-override'
import getNotebookServiceOverride from '@codingame/monaco-vscode-notebook-service-override'
import getWelcomeServiceOverride from '@codingame/monaco-vscode-welcome-service-override'
import getWalkThroughServiceOverride from '@codingame/monaco-vscode-walkthrough-service-override'
import getUserDataSyncServiceOverride from '@codingame/monaco-vscode-user-data-sync-service-override'
import getUserDataProfileServiceOverride from '@codingame/monaco-vscode-user-data-profile-service-override'
import getAiServiceOverride from '@codingame/monaco-vscode-ai-service-override'
import getTaskServiceOverride from '@codingame/monaco-vscode-task-service-override'
import getOutlineServiceOverride from '@codingame/monaco-vscode-outline-service-override'
import getTimelineServiceOverride from '@codingame/monaco-vscode-timeline-service-override'
import getCommentsServiceOverride from '@codingame/monaco-vscode-comments-service-override'
import getEditSessionsServiceOverride from '@codingame/monaco-vscode-edit-sessions-service-override'
import getEmmetServiceOverride from '@codingame/monaco-vscode-emmet-service-override'
import getInteractiveServiceOverride from '@codingame/monaco-vscode-interactive-service-override'
import getIssueServiceOverride from '@codingame/monaco-vscode-issue-service-override'
import getMultiDiffEditorServiceOverride from '@codingame/monaco-vscode-multi-diff-editor-service-override'
import getPerformanceServiceOverride from '@codingame/monaco-vscode-performance-service-override'
import getRelauncherServiceOverride from '@codingame/monaco-vscode-relauncher-service-override'
import getShareServiceOverride from '@codingame/monaco-vscode-share-service-override'
import getSpeechServiceOverride from '@codingame/monaco-vscode-speech-service-override'
import getSurveyServiceOverride from '@codingame/monaco-vscode-survey-service-override'
import getUpdateServiceOverride from '@codingame/monaco-vscode-update-service-override'
import getExplorerServiceOverride from '@codingame/monaco-vscode-explorer-service-override'
import getLocalizationServiceOverride from '@codingame/monaco-vscode-localization-service-override'
import getTreeSitterServiceOverride from '@codingame/monaco-vscode-treesitter-service-override'
import getTelemetryServiceOverride from '@codingame/monaco-vscode-telemetry-service-override'
import getMcpServiceOverride from '@codingame/monaco-vscode-mcp-service-override'
import getProcessControllerServiceOverride from '@codingame/monaco-vscode-process-explorer-service-override'
import getImageResizeServiceOverride from '@codingame/monaco-vscode-image-resize-service-override'
import getAssignmentServiceOverride from '@codingame/monaco-vscode-assignment-service-override'
import { EnvironmentOverride } from '@codingame/monaco-vscode-api/workbench'
import { Worker } from './tools/fakeWorker.js'
import defaultKeybindings from './user/keybindings.json?raw'
import defaultConfiguration from './user/configuration.json?raw'
import { TerminalBackend } from './features/terminal.js'
import 'vscode/localExtensionHost'

const url = new URL(document.location.href)
const params = url.searchParams
export const remoteAuthority = params.get('remoteAuthority') ?? undefined
export const connectionToken = params.get('connectionToken') ?? undefined
export const remotePath =
  remoteAuthority != null ? (params.get('remotePath') ?? undefined) : undefined
export const resetLayout = params.has('resetLayout')
export const useHtmlFileSystemProvider = params.has('htmlFileSystemProvider')
export const disableShadowDom = params.has('disableShadowDom')
params.delete('resetLayout')

window.history.replaceState({}, document.title, url.href)

export let workspaceFile = monaco.Uri.file('/workspace.code-workspace')

export const userDataProvider = await createIndexedDBProviders()

if (useHtmlFileSystemProvider) {
  workspaceFile = monaco.Uri.from({ scheme: 'tmp', path: '/test.code-workspace' })
  await initFile(
    workspaceFile,
    JSON.stringify(
      <IStoredWorkspace>{
        folders: []
      },
      null,
      2
    )
  )

  registerHTMLFileSystemProvider()
} else {
  const fileSystemProvider = new RegisteredFileSystemProvider(false)

  fileSystemProvider.registerFile(
    new RegisteredMemoryFile(
      vscode.Uri.file('/workspace/test.js'),
      `// import anotherfile
let variable = 1
function inc () {
  variable++
}

while (variable < 5000) {
  inc()
  console.log('Hello world', variable);
}`
    )
  )

  const content = new TextEncoder().encode('This is a readonly static file')
  fileSystemProvider.registerFile(
    new RegisteredReadOnlyFile(
      vscode.Uri.file('/workspace/test_readonly.js'),
      async () => content,
      content.length
    )
  )

  fileSystemProvider.registerFile(
    new RegisteredMemoryFile(
      vscode.Uri.file('/workspace/jsconfig.json'),
      `{
  "compilerOptions": {
    "target": "es2020",
    "module": "esnext",
    "lib": [
      "es2021",
      "DOM"
    ]
  }
}`
    )
  )

  fileSystemProvider.registerFile(
    new RegisteredMemoryFile(
      vscode.Uri.file('/workspace/index.html'),
      `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>monaco-vscode-api demo</title>
    <link rel="stylesheet" href="test.css">
  </head>
  <body>
    <style type="text/css">
      h1 {
        color: DeepSkyBlue;
      }
    </style>

    <h1>Hello, world!</h1>
  </body>
</html>`
    )
  )

  fileSystemProvider.registerFile(
    new RegisteredMemoryFile(
      vscode.Uri.file('/workspace/test.md'),
      `
***Hello World***

Math block:
$$
\\displaystyle
\\left( \\sum_{k=1}^n a_k b_k \\right)^2
\\leq
\\left( \\sum_{k=1}^n a_k^2 \\right)
\\left( \\sum_{k=1}^n b_k^2 \\right)
$$

# Easy Math

2 + 2 = 4 // this test will pass
2 + 2 = 5 // this test will fail

# Harder Math

230230 + 5819123 = 6049353
`
    )
  )

  fileSystemProvider.registerFile(
    new RegisteredMemoryFile(
      vscode.Uri.file('/workspace/test.customeditor'),
      `
Custom Editor!`
    )
  )

  fileSystemProvider.registerFile(
    new RegisteredMemoryFile(
      vscode.Uri.file('/workspace/test.css'),
      `
h1 {
  color: DeepSkyBlue;
}`
    )
  )

  // Use a workspace file to be able to add another folder later (for the "Attach filesystem" button)
  fileSystemProvider.registerFile(
    new RegisteredMemoryFile(
      workspaceFile,
      JSON.stringify(
        <IStoredWorkspace>{
          folders: [
            {
              path: '/workspace'
            }
          ]
        },
        null,
        2
      )
    )
  )

  fileSystemProvider.registerFile(
    new RegisteredMemoryFile(
      monaco.Uri.file('/workspace/.vscode/extensions.json'),
      JSON.stringify(
        {
          recommendations: ['vscodevim.vim']
        },
        null,
        2
      )
    )
  )

  registerFileSystemOverlay(1, fileSystemProvider)
}

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
  workspaceProvider: {
    trusted: true,
    async open() {
      window.open(window.location.href)
      return true
    },
    workspace:
      remotePath == null
        ? {
            workspaceUri: workspaceFile
          }
        : {
            folderUri: monaco.Uri.from({
              scheme: 'vscode-remote',
              path: remotePath,
              authority: remoteAuthority
            })
          }
  },
  developmentOptions: {
    logLevel: LogLevel.Info // Default value
  },
  configurationDefaults: {
    'window.title': 'Monaco-Vscode-Api${separator}${dirty}${activeEditorShort}'
  },
  defaultLayout: {
    editors: useHtmlFileSystemProvider
      ? undefined
      : [
          {
            uri: monaco.Uri.file('/workspace/test.js'),
            viewColumn: 1
          },
          {
            uri: monaco.Uri.file('/workspace/test.md'),
            viewColumn: 2
          }
        ],
    layout: useHtmlFileSystemProvider
      ? undefined
      : {
          editors: {
            orientation: 0,
            groups: [{ size: 1 }, { size: 1 }]
          }
        },
    views: [
      {
        id: 'custom-view'
      }
    ],
    force: resetLayout
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
  }
}

export const envOptions: EnvironmentOverride = {
  // Otherwise, VSCode detect it as the first open workspace folder
  // which make the search result extension fail as it's not able to know what was detected by VSCode
  // userHome: vscode.Uri.file('/')
}

export const commonServices: IEditorOverrideServices = {
  ...getAuthenticationServiceOverride(),
  ...getLogServiceOverride(),
  ...getExtensionServiceOverride({
    enableWorkerExtensionHost: true
  }),
  ...getExtensionGalleryServiceOverride({ webOnly: false }),
  ...getModelServiceOverride(),
  ...getNotificationServiceOverride(),
  ...getDialogsServiceOverride(),
  ...getConfigurationServiceOverride(),
  ...getKeybindingsServiceOverride(),
  ...getTextmateServiceOverride(),
  ...getTreeSitterServiceOverride(),
  ...getThemeServiceOverride(),
  ...getLanguagesServiceOverride(),
  ...getDebugServiceOverride(),
  ...getPreferencesServiceOverride(),
  ...getOutlineServiceOverride(),
  ...getTimelineServiceOverride(),
  ...getBannerServiceOverride(),
  ...getStatusBarServiceOverride(),
  ...getTitleBarServiceOverride(),
  ...getSnippetServiceOverride(),
  ...getOutputServiceOverride(),
  ...getTerminalServiceOverride(new TerminalBackend()),
  ...getSearchServiceOverride(),
  ...getMarkersServiceOverride(),
  ...getAccessibilityServiceOverride(),
  ...getLanguageDetectionWorkerServiceOverride(),
  ...getStorageServiceOverride({
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
  ...getTestingServiceOverride(),
  ...getChatServiceOverride(),
  ...getNotebookServiceOverride(),
  ...getWelcomeServiceOverride(),
  ...getWalkThroughServiceOverride(),
  ...getUserDataProfileServiceOverride(),
  ...getUserDataSyncServiceOverride(),
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
  ...getTelemetryServiceOverride(),
  ...getMcpServiceOverride(),
  ...getProcessControllerServiceOverride(),
  ...getImageResizeServiceOverride(),
  ...getAssignmentServiceOverride()
}
