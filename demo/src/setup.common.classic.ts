export * from './setup.common'
import { IEditorOverrideServices, IWorkspace } from '@codingame/monaco-vscode-api'
import {
  commonServices as _commonService,
  constructOptions as _constructOptions,
  remoteAuthority,
  params
} from './setup.common'
import getOutlineServiceOverride from '@codingame/monaco-vscode-outline-service-override'
import getSnippetServiceOverride from '@codingame/monaco-vscode-snippets-service-override'
import getSearchServiceOverride from '@codingame/monaco-vscode-search-service-override'
import getChatServiceOverride from '@codingame/monaco-vscode-chat-service-override'
import getWelcomeServiceOverride from '@codingame/monaco-vscode-welcome-service-override'
import getWalkThroughServiceOverride from '@codingame/monaco-vscode-walkthrough-service-override'
import getUserDataSyncServiceOverride from '@codingame/monaco-vscode-user-data-sync-service-override'
import getTelemetryServiceOverride from '@codingame/monaco-vscode-telemetry-service-override'
import getMcpServiceOverride from '@codingame/monaco-vscode-mcp-service-override'
import getMeteredConnectionServiceOverride from '@codingame/monaco-vscode-metered-connection-service-override'
import getConfigurationServiceOverride, {
  IStoredWorkspace
} from '@codingame/monaco-vscode-configuration-service-override'
import getDialogsServiceOverride from '@codingame/monaco-vscode-dialogs-service-override'
import getExtensionGalleryServiceOverride from '@codingame/monaco-vscode-extension-gallery-service-override'
import getDebugServiceOverride from '@codingame/monaco-vscode-debug-service-override'
import getMarkersServiceOverride from '@codingame/monaco-vscode-markers-service-override'
import getTestingServiceOverride from '@codingame/monaco-vscode-testing-service-override'
import getTimelineServiceOverride from '@codingame/monaco-vscode-timeline-service-override'
import getGithubServiceOverride from '@codingame/monaco-vscode-github-service-override'
import getTitleBarServiceOverride from '@codingame/monaco-vscode-view-title-bar-service-override'
import {
  createHTMLFileSystemProvider,
  initFile,
  RegisteredFileSystemProvider,
  RegisteredMemoryFile,
  RegisteredReadOnlyFile,
  registerFileSystemOverlay,
  registerHTMLFileSystemProvider
} from '@codingame/monaco-vscode-files-service-override'
import * as vscode from 'vscode'

export const remotePath =
  remoteAuthority != null ? (params.get('remotePath') ?? undefined) : undefined
const workspaceFile = vscode.Uri.file('/workspace.code-workspace')
export const useHtmlFileSystemProvider = params.has('htmlFileSystemProvider')
export const resetLayout = params.has('resetLayout')
params.delete('resetLayout')
let workspace: IWorkspace = {
  workspaceUri: workspaceFile
}

if (useHtmlFileSystemProvider) {
  const workspaceFile = vscode.Uri.from({ scheme: 'tmp', path: '/test.code-workspace' })
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
  workspace = {
    workspaceUri: workspaceFile
  }
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
  workspace = {
    workspaceUri: workspaceFile
  }

  fileSystemProvider.registerFile(
    new RegisteredMemoryFile(
      vscode.Uri.file('/workspace/.vscode/extensions.json'),
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

  const htmlFileProvider = createHTMLFileSystemProvider()
  htmlFileProvider.registerDirectoryHandle(
    await (await navigator.storage.getDirectory()).getDirectoryHandle('workspace', { create: true })
  )
  registerFileSystemOverlay(2, htmlFileProvider)
}

export const constructOptions = {
  ..._constructOptions,
  workspaceProvider: {
    trusted: true,
    async open() {
      window.open(window.location.href)
      return true
    },
    workspace:
      remotePath == null
        ? workspace
        : {
            folderUri: vscode.Uri.from({
              scheme: 'vscode-remote',
              path: remotePath,
              authority: remoteAuthority
            })
          }
  },
  defaultLayout: {
    editors: useHtmlFileSystemProvider
      ? undefined
      : [
          {
            uri: vscode.Uri.file('/workspace/test.js'),
            viewColumn: 1
          },
          {
            uri: vscode.Uri.file('/workspace/test.md'),
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
  }
}
export const commonServices: IEditorOverrideServices = {
  ..._commonService,
  ...getOutlineServiceOverride(), // session REMOVED
  ...getSnippetServiceOverride(),
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
      accountName: 'unused',
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
  ...getWalkThroughServiceOverride(),
  ...getWelcomeServiceOverride(),
  ...getTelemetryServiceOverride(),
  ...getMcpServiceOverride(),
  ...getMeteredConnectionServiceOverride(),

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
