import getConfigurationServiceOverride, { IStoredWorkspace, initUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override'
import getKeybindingsServiceOverride, { initUserKeybindings } from '@codingame/monaco-vscode-keybindings-service-override'
import { RegisteredFileSystemProvider, RegisteredMemoryFile, RegisteredReadOnlyFile, createIndexedDBProviders, initFile, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override'
import * as monaco from 'monaco-editor'
import { IWorkbenchConstructionOptions, LogLevel, IEditorOverrideServices } from 'vscode/services'
import * as vscode from 'vscode'
import getModelServiceOverride from '@codingame/monaco-vscode-model-service-override'
import getNotificationServiceOverride from '@codingame/monaco-vscode-notifications-service-override'
import getDialogsServiceOverride from '@codingame/monaco-vscode-dialogs-service-override'
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override'
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override'
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override'
import getAuthenticationServiceOverride from '@codingame/monaco-vscode-authentication-service-override'
import getAudioCueServiceOverride from '@codingame/monaco-vscode-audio-cue-service-override'
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
import getUserDataSyncServiceOverride from '@codingame/monaco-vscode-user-data-sync-service-override'
import getAiServiceOverride from '@codingame/monaco-vscode-ai-service-override'
import getTaskServiceOverride from '@codingame/monaco-vscode-task-service-override'
import getOutlineServiceOverride from '@codingame/monaco-vscode-outline-service-override'
import getTimelineServiceOverride from '@codingame/monaco-vscode-timeline-service-override'
import { Worker } from './tools/crossOriginWorker'
import defaultKeybindings from './user/keybindings.json?raw'
import defaultConfiguration from './user/configuration.json?raw'
import { TerminalBackend } from './features/terminal'
import { workerConfig } from './tools/extHostWorker'
import 'vscode/localExtensionHost'

const fileSystemProvider = new RegisteredFileSystemProvider(false)

fileSystemProvider.registerFile(new RegisteredMemoryFile(vscode.Uri.file('/tmp/test.js'), `// import anotherfile
let variable = 1
function inc () {
  variable++
}

while (variable < 5000) {
  inc()
  console.log('Hello world', variable);
}`
))

fileSystemProvider.registerFile(new RegisteredReadOnlyFile(vscode.Uri.file('/tmp/test_readonly.js'), async () => 'This is a readonly static file'))

fileSystemProvider.registerFile(new RegisteredMemoryFile(vscode.Uri.file('/tmp/jsconfig.json'), `{
  "compilerOptions": {
    "target": "es2020",
    "module": "esnext",
    "lib": [
      "es2021",
      "DOM"
    ]
  }
}`
))

fileSystemProvider.registerFile(new RegisteredMemoryFile(vscode.Uri.file('/tmp/index.html'), `
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
))

fileSystemProvider.registerFile(new RegisteredMemoryFile(vscode.Uri.file('/tmp/test.md'), `
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
))

fileSystemProvider.registerFile(new RegisteredMemoryFile(vscode.Uri.file('/tmp/test.customeditor'), `
Custom Editor!`
))

fileSystemProvider.registerFile(new RegisteredMemoryFile(vscode.Uri.file('/tmp/test.css'), `
h1 {
  color: DeepSkyBlue;
}`
))

registerFileSystemOverlay(1, fileSystemProvider)

export const userDataProvider = await createIndexedDBProviders()

// Workers
export type WorkerLoader = () => Worker
const workerLoaders: Partial<Record<string, WorkerLoader>> = {
  editorWorkerService: () => new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
  textMateWorker: () => new Worker(new URL('@codingame/monaco-vscode-textmate-service-override/worker', import.meta.url), { type: 'module' }),
  outputLinkComputer: () => new Worker(new URL('@codingame/monaco-vscode-output-service-override/worker', import.meta.url), { type: 'module' }),
  languageDetectionWorkerService: () => new Worker(new URL('@codingame/monaco-vscode-language-detection-worker-service-override/worker', import.meta.url), { type: 'module' }),
  notebookEditorWorkerService: () => new Worker(new URL('@codingame/monaco-vscode-notebook-service-override/worker', import.meta.url), { type: 'module' })

}
window.MonacoEnvironment = {
  getWorker: function (moduleId, label) {
    const workerFactory = workerLoaders[label]
    if (workerFactory != null) {
      return workerFactory()
    }
    throw new Error(`Unimplemented worker ${label} (${moduleId})`)
  }
}

const params = new URL(document.location.href).searchParams
export const remoteAuthority = params.get('remoteAuthority') ?? undefined
export const connectionToken = params.get('connectionToken') ?? undefined
export const remotePath = remoteAuthority != null ? params.get('remotePath') ?? undefined : undefined

// Set configuration before initializing service so it's directly available (especially for the theme, to prevent a flicker)
export const workspaceFile = monaco.Uri.file('/workspace.code-workspace')
await Promise.all([
  initUserConfiguration(defaultConfiguration),
  initUserKeybindings(defaultKeybindings),
  // Use a workspace file to be able to add another folder later (for the "Attach filesystem" button)
  initFile(workspaceFile, JSON.stringify(<IStoredWorkspace>{
    folders: [{
      path: '/tmp'
    }]
  })),
  initFile(monaco.Uri.file('/tmp/.vscode/extensions.json'), `{
    "recommendations": [
        "vscodevim.vim"
    ]
}`)
])

export const constructOptions: IWorkbenchConstructionOptions = {
  remoteAuthority,
  enableWorkspaceTrust: true,
  connectionToken,
  workspaceProvider: {
    trusted: true,
    async open () {
      return false
    },
    workspace: remotePath == null
      ? {
          workspaceUri: workspaceFile
        }
      : {
          folderUri: monaco.Uri.from({ scheme: 'vscode-remote', path: remotePath, authority: remoteAuthority })
        }
  },
  developmentOptions: {
    logLevel: LogLevel.Info // Default value
  },
  defaultLayout: {
    editors: [{
      uri: monaco.Uri.file('/tmp/test.js'),
      viewColumn: 1
    }, {
      uri: monaco.Uri.file('/tmp/test.md'),
      viewColumn: 2
    }],
    layout: {
      editors: {
        orientation: 0,
        groups: [{ size: 1 }, { size: 1 }]
      }
    }
  },
  productConfiguration: {
    extensionsGallery: {
      serviceUrl: 'https://open-vsx.org/vscode/gallery',
      itemUrl: 'https://open-vsx.org/vscode/item',
      resourceUrlTemplate: 'https://open-vsx.org/vscode/unpkg/{publisher}/{name}/{version}/{path}',
      controlUrl: '',
      nlsBaseUrl: '',
      publisherUrl: ''
    }
  }
}

export const commonServices: IEditorOverrideServices = {
  ...getAuthenticationServiceOverride(),
  ...getLogServiceOverride(),
  ...getExtensionServiceOverride(workerConfig),
  ...getExtensionGalleryServiceOverride({ webOnly: false }),
  ...getModelServiceOverride(),
  ...getNotificationServiceOverride(),
  ...getDialogsServiceOverride(),
  ...getConfigurationServiceOverride(),
  ...getKeybindingsServiceOverride(),
  ...getTextmateServiceOverride(),
  ...getThemeServiceOverride(),
  ...getLanguagesServiceOverride(),
  ...getAudioCueServiceOverride(),
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
  ...getStorageServiceOverride(),
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
  ...getUserDataSyncServiceOverride(),
  ...getAiServiceOverride(),
  ...getTaskServiceOverride()
}
