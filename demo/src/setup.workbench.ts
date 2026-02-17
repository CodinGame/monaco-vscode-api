import {
  IStorageService,
  IWorkbenchLayoutService,
  StorageScope,
  getService,
  initialize as initializeMonacoService
} from '@codingame/monaco-vscode-api'
import getWorkbenchServiceOverride, {
  Parts
} from '@codingame/monaco-vscode-workbench-service-override'
import getQuickAccessServiceOverride from '@codingame/monaco-vscode-quickaccess-service-override'
import getStorageServiceOverride, {
  BrowserStorageService,
  ExternalStorage
} from '@codingame/monaco-vscode-storage-service-override'
import { ExtensionHostKind } from '@codingame/monaco-vscode-extensions-service-override'
import { registerExtension } from '@codingame/monaco-vscode-api/extensions'
import './features/customView.workbench'
import {
  commonServices,
  constructOptions,
  envOptions,
  remoteAuthority,
  userDataProvider,
  disableShadowDom
} from './setup.common'
import {
  InMemoryFileSystemProvider,
  registerWorkspaceUserDataFileSystemProvider
} from '@codingame/monaco-vscode-files-service-override'
import {
  Directory,
  File
} from '@codingame/monaco-vscode-api/vscode/vs/platform/files/common/inMemoryFilesystemProvider'
import { Uri } from 'vscode'

let container = window.vscodeContainer

if (container == null) {
  container = document.createElement('div')
  container.style.height = '100vh'

  document.body.replaceChildren(container)

  if (!disableShadowDom) {
    const shadowRoot = container.attachShadow({
      mode: 'open'
    })

    const workbenchElement = document.createElement('div')
    workbenchElement.style.height = '100vh'
    shadowRoot.appendChild(workbenchElement)
    container = workbenchElement
  }
}

const buttons = document.createElement('div')
buttons.innerHTML = `
<button id="toggleHTMLFileSystemProvider">Toggle HTML filesystem provider</button>
<button id="toggleShadowDom">Toggle Shadow Dom usage</button>
<button id="customEditorPanel">Open custom editor panel</button>
<button id="clearStorage">Clear user data</button>
<button id="resetLayout">Reset layout</button>
<button id="toggleFullWorkbench">Switch to custom rendering mode</button>
<br />
<button id="togglePanel">Toggle Panel</button>
<button id="toggleAuxiliary">Toggle Secondary Panel</button>
<button id="toggleSandbox">Switch to sandbox rendering mode</button>
`
document.body.append(buttons)

const test = new InMemoryFileSystemProvider()

const files = {
  'chatSessions/b881ccf7-2aa1-4851-b4bb-91e2cbc0fd1d.jsonl': {
    mtime: 1771352254999,
    ctime: 1771352254999,
    data: '{"kind":0,"v":{"version":3,"creationDate":1771350469673,"initialLocation":"panel","responderUsername":"toto","sessionId":"b881ccf7-2aa1-4851-b4bb-91e2cbc0fd1d","hasPendingEdits":false,"requests":[],"pendingRequests":[],"inputState":{"attachments":[],"mode":{"id":"agent","kind":"agent"},"inputText":"","selections":[{"startLineNumber":1,"startColumn":1,"endLineNumber":1,"endColumn":1,"selectionStartLineNumber":1,"selectionStartColumn":1,"positionLineNumber":1,"positionColumn":1}],"contrib":{"chatDynamicVariableModel":[]}}}}\n{"kind":1,"k":["inputState","inputText"],"v":"Hey"}\n{"kind":1,"k":["inputState","selections"],"v":[{"startLineNumber":1,"startColumn":4,"endLineNumber":1,"endColumn":4,"selectionStartLineNumber":1,"selectionStartColumn":4,"positionLineNumber":1,"positionColumn":4}]}\n{"kind":2,"k":["requests"],"v":[{"requestId":"request_d99649ce-1c30-43fd-a669-67b7f288b690","timestamp":1771351804162,"agent":{"extensionId":{"value":"codingame.aiDemo","_lower":"codingame.aidemo"},"extensionVersion":"1.0.0","publisherDisplayName":"codingame","extensionPublisherId":"codingame","extensionDisplayName":"aiDemo","id":"toto","metadata":{},"name":"toto","fullName":"toto","isDefault":true,"locations":["panel"],"modes":["ask","agent"],"slashCommands":[],"disambiguation":[]},"responseId":"response_004c345d-d5e9-4a54-97c7-cc46bf5a7107","result":{"timings":{"firstProgress":2026,"totalElapsed":2026}},"responseMarkdownInfo":[],"followups":[],"modelState":{"value":1,"completedAt":1771351806234},"contentReferences":[],"codeCitations":[],"timeSpentWaiting":1771351804163,"response":[{"kind":"mcpServersStarting","didStartServerIds":[]},{"kind":"progressMessage","content":{"value":"Thinking about \\"Heyyy (:\\" with ...","uris":{}}},{"kind":"progressMessage","content":{"value":"Calling the model toto...","uris":{}}},{"value":"Model answer: Response from model toto","supportThemeIcons":false,"supportHtml":false,"supportAlertSyntax":false,"uris":{}}],"message":{"text":"Heyyy (:","parts":[{"range":{"start":0,"endExclusive":8},"editorRange":{"startLineNumber":1,"startColumn":1,"endLineNumber":1,"endColumn":9},"text":"Heyyy (:","kind":"text"}]},"variableData":{"variables":[]}}]}\n{"kind":1,"k":["inputState","selectedModel"],"v":{"identifier":"toto/toto","metadata":{"extension":{"value":"codingame.aiDemo","_lower":"codingame.aidemo"},"id":"toto","vendor":"toto","name":"Toto","family":"toto","version":"1.0.0","maxInputTokens":1000000,"maxOutputTokens":1000000,"isDefaultForLocation":{"panel":true,"terminal":true,"notebook":true,"editor":true},"isUserSelectable":true,"modelPickerCategory":{"label":"Other Models","order":9007199254740991},"capabilities":{"toolCalling":false,"agentMode":false}}}}\n{"kind":1,"k":["inputState","inputText"],"v":""}\n{"kind":1,"k":["inputState","selections"],"v":[{"startLineNumber":1,"startColumn":1,"endLineNumber":1,"endColumn":1,"selectionStartLineNumber":1,"selectionStartColumn":1,"positionLineNumber":1,"positionColumn":1}]}\n'
  },
  'chatEditingSessions/b881ccf7-2aa1-4851-b4bb-91e2cbc0fd1d/state.json': {
    mtime: 1771352560131,
    ctime: 1771352254999,
    data: '{"version":2,"initialFileContents":[],"timeline":{"checkpoints":[{"checkpointId":"ffdb3b9a-9d85-47f7-a81c-dbe461db304f","epoch":0,"label":"Initial State","description":"Starting point before any edits"},{"checkpointId":"31ea7d31-949e-4fa8-9423-b74246790ae7","requestId":"request_d99649ce-1c30-43fd-a669-67b7f288b690","epoch":1,"label":"Request request_d99649ce-1c30-43fd-a669-67b7f288b690"}],"currentEpoch":2,"fileBaselines":[],"operations":[],"epochCounter":2},"recentSnapshot":{"entries":[]}}'
  },
  'chatEditingSessions/8c9e8ad6-0737-43f8-b368-d38513d01cb2/state.json': {
    mtime: 1771352263540,
    ctime: 1771352260064,
    data: '{"version":2,"initialFileContents":[],"timeline":{"checkpoints":[{"checkpointId":"8e06da2e-ae82-4a54-b114-ee091ce9b7c1","epoch":0,"label":"Initial State","description":"Starting point before any edits"}],"currentEpoch":1,"fileBaselines":[],"operations":[],"epochCounter":1},"recentSnapshot":{"entries":[]}}'
  },
  'state.json': {
    mtime: 1771352254999,
    ctime: 1771352254999,
    data: '{"version":2,"initialFileContents":[],"timeline":{"checkpoints":[{"checkpointId":"d6de8728-3b6a-40a5-9252-4c1f83ea280e","epoch":0,"label":"Initial State","description":"Starting point before any edits"}],"currentEpoch":1,"fileBaselines":[],"operations":[],"epochCounter":1},"recentSnapshot":{"entries":[]}}'
  }
}

const textEncoder = new TextEncoder()
await test.mkdir(Uri.file('chatSessions'))
await test.mkdir(Uri.file('chatEditingSessions'))
await test.mkdir(Uri.file('chatEditingSessions/b881ccf7-2aa1-4851-b4bb-91e2cbc0fd1d'))
await test.mkdir(Uri.file('chatEditingSessions/8c9e8ad6-0737-43f8-b368-d38513d01cb2'))
for (const [name, file] of Object.entries(files)) {
  console.log('writeFile', name, file.data.length)
  await test.writeFile(Uri.file(name), textEncoder.encode(file.data), {
    create: true,
    overwrite: true,
    unlock: false,
    atomic: false
  })
}

let storage = new Map([
  [
    '__$__targetStorageMarker',
    '{"custom-view.state":1,"workbench.panel.output":1,"terminal":1,"workbench.panel.markers":1,"workbench.scm.views.state":1,"workbench.view.search.state":1,"workbench.explorer.views.state":1,"workbench.panel.chat":1,"debug.selectedroot":1,"output.activechannel":1,"agentSessions.readDateBaseline2":1,"workbench.view.debug.state":1,"workbench.panel.repl":1,"debug.uxstate":1,"workbench.activity.viewletsWorkspaceState":1,"workbench.panel.viewContainersWorkspaceState":1,"workbench.auxiliarybar.viewContainersWorkspaceState":1,"workbench.view.extension.test.state":1,"workbench.explorer.treeViewState":1,"extensionStorage.migrate.codingame.aidemo-codingame.aiDemo":1,"history.entries":1,"comments.continueOnComments":0,"agentSessions.model.cache":1,"agentSessions.state.cache":1,"workbench.editor.centered":1,"workbench.zenMode.active":1,"workbench.zenMode.exitInfo":1,"workbench.panel.wasLastMaximized":1,"workbench.auxiliaryBar.wasLastMaximized":1,"workbench.auxiliaryBar.lastNonMaximizedVisibility":1,"workbench.sideBar.position":1,"workbench.panel.position":1,"workbench.activityBar.hidden":1,"workbench.sideBar.hidden":1,"workbench.editor.hidden":1,"workbench.panel.hidden":1,"workbench.auxiliaryBar.hidden":1,"workbench.statusBar.hidden":1,"workbench.view.explorer.numberOfVisibleViews":1,"chat.customModes":1,"memento/interactive-session-view-copilot":1,"workbench.panel.chat.numberOfVisibleViews":1,"chat.ChatSessionStore.index":1,"scm:view:visibleRepositories":1,"chat.disabledClaudeHooks.notification":0,"memento/interactive-session":1,"chat.untitledInputState":0,"workspace.trust.startupPrompt.shown":1,"memento/workbench.parts.editor":0,"workbench.editor.languageDetectionOpenedLanguages.workspace":1,"memento/workbench.editors.files.textFileEditor":1}'
  ],
  ['custom-view.state', '{"custom-view":{"collapsed":false,"isHidden":true}}'],
  ['workbench.panel.output', '{"workbench.panel.output":{"collapsed":false,"isHidden":true}}'],
  ['terminal', '{"terminal":{"collapsed":false,"isHidden":true}}'],
  [
    'workbench.panel.markers',
    '{"workbench.panel.markers.view":{"collapsed":false,"isHidden":true}}'
  ],
  [
    'workbench.scm.views.state',
    '{"workbench.scm.repositories":{"collapsed":false,"isHidden":true},"workbench.scm":{"collapsed":false,"isHidden":true},"workbench.scm.history":{"collapsed":false,"isHidden":true}}'
  ],
  ['workbench.view.search.state', '{"workbench.view.search":{"collapsed":false,"isHidden":true}}'],
  [
    'workbench.explorer.views.state',
    '{"outline":{"collapsed":true,"isHidden":true,"size":22},"timeline":{"collapsed":true,"isHidden":true,"size":22},"workbench.explorer.openEditorsView":{"collapsed":false,"isHidden":true},"workbench.explorer.fileView":{"collapsed":false,"isHidden":true,"size":1191},"npm":{"collapsed":true,"isHidden":true}}'
  ],
  [
    'workbench.panel.chat',
    '{"workbench.panel.chat.view.copilot":{"collapsed":false,"isHidden":true,"size":1235}}'
  ],
  ['debug.selectedroot', 'file:///workspace/.vscode/launch.json'],
  ['output.activechannel', 'tasks'],
  ['agentSessions.readDateBaseline2', '1770745665415'],
  [
    'workbench.view.debug.state',
    '{"workbench.debug.welcome":{"collapsed":false,"isHidden":true},"workbench.debug.variablesView":{"collapsed":false,"isHidden":true},"workbench.debug.watchExpressionsView":{"collapsed":false,"isHidden":true},"workbench.debug.callStackView":{"collapsed":false,"isHidden":true},"workbench.debug.loadedScriptsView":{"collapsed":true,"isHidden":true},"workbench.debug.breakPointsView":{"collapsed":false,"isHidden":true}}'
  ],
  ['workbench.panel.repl', '{"workbench.panel.repl.view":{"collapsed":false,"isHidden":true}}'],
  ['debug.uxstate', 'simple'],
  [
    'workbench.activity.viewletsWorkspaceState',
    '[{"id":"workbench.view.explorer","visible":true},{"id":"workbench.view.search","visible":true},{"id":"workbench.view.scm","visible":true},{"id":"workbench.view.debug","visible":true},{"id":"workbench.view.remote","visible":false},{"id":"workbench.view.extensions","visible":true},{"id":"workbench.view.extension.test","visible":true},{"id":"workbench.view.extension.references-view","visible":false}]'
  ],
  [
    'workbench.panel.viewContainersWorkspaceState',
    '[{"id":"workbench.panel.markers","visible":true},{"id":"custom-view","visible":true},{"id":"workbench.panel.output","visible":true},{"id":"workbench.panel.repl","visible":true},{"id":"workbench.panel.testResults","visible":false},{"id":"terminal","visible":true},{"id":"refactorPreview","visible":false}]'
  ],
  [
    'workbench.auxiliarybar.viewContainersWorkspaceState',
    '[{"id":"workbench.panel.chat","visible":true}]'
  ],
  [
    'workbench.view.extension.test.state',
    '{"workbench.view.testing":{"collapsed":false,"isHidden":true},"workbench.view.testCoverage":{"collapsed":false,"isHidden":true}}'
  ],
  [
    'workbench.explorer.treeViewState',
    '{"focus":["file:///workspace::file:///workspace/test.customeditor"],"selection":["file:///workspace::file:///workspace/test.customeditor"],"expanded":["file:///workspace::file:///workspace"],"scrollTop":0}'
  ],
  ['extensionStorage.migrate.codingame.aidemo-codingame.aiDemo', 'true'],
  [
    'history.entries',
    '[{"editor":{"resource":"file:///workspace/test.customeditor"}},{"editor":{"resource":"file:///workspace/index.html","forceFile":true,"options":{"override":"default"}}}]'
  ],
  ['comments.continueOnComments', '[]'],
  [
    'agentSessions.model.cache',
    '[{"providerType":"local","providerLabel":"Local","resource":"vscode-chat-session://local/Yjg4MWNjZjctMmFhMS00ODUxLWI0YmItOTFlMmNiYzBmZDFk","icon":"vm","label":"Heyyy (:","status":1,"timing":{"created":1771350469673,"lastRequestStarted":1771351804162,"lastRequestEnded":1771351806234}}]'
  ],
  [
    'agentSessions.state.cache',
    '[{"resource":"vscode-chat-session://local/Yjg4MWNjZjctMmFhMS00ODUxLWI0YmItOTFlMmNiYzBmZDFk","read":1771352263505}]'
  ],
  ['workbench.editor.centered', 'false'],
  ['workbench.zenMode.active', 'false'],
  [
    'workbench.zenMode.exitInfo',
    '{"transitionedToCenteredEditorLayout":false,"transitionedToFullScreen":false,"handleNotificationsDoNotDisturbMode":false,"wasVisible":{"auxiliaryBar":false,"panel":false,"sideBar":false}}'
  ],
  ['workbench.panel.wasLastMaximized', 'false'],
  ['workbench.auxiliaryBar.wasLastMaximized', 'false'],
  [
    'workbench.auxiliaryBar.lastNonMaximizedVisibility',
    '{"sideBarVisible":false,"editorVisible":false,"panelVisible":false,"auxiliaryBarVisible":false}'
  ],
  ['workbench.sideBar.position', '0'],
  ['workbench.panel.position', '2'],
  ['workbench.activityBar.hidden', 'false'],
  ['workbench.sideBar.hidden', 'false'],
  ['workbench.editor.hidden', 'false'],
  ['workbench.panel.hidden', 'true'],
  ['workbench.auxiliaryBar.hidden', 'false'],
  ['workbench.statusBar.hidden', 'false'],
  ['workbench.view.explorer.numberOfVisibleViews', '3'],
  ['chat.customModes', '[]'],
  [
    'memento/interactive-session-view-copilot',
    '{"sessionId":"b881ccf7-2aa1-4851-b4bb-91e2cbc0fd1d","inputText":"","attachments":[],"mode":{"id":"agent","kind":"agent"},"selectedModel":{"identifier":"toto/toto","metadata":{"extension":{"value":"codingame.aiDemo","_lower":"codingame.aidemo"},"id":"toto","vendor":"toto","name":"Toto","family":"toto","version":"1.0.0","maxInputTokens":1000000,"maxOutputTokens":1000000,"isDefaultForLocation":{"panel":true,"terminal":true,"notebook":true,"editor":true},"isUserSelectable":true,"modelPickerCategory":{"label":"Other Models","order":9007199254740991},"capabilities":{"toolCalling":false,"agentMode":false}}},"selections":[{"startLineNumber":1,"startColumn":1,"endLineNumber":1,"endColumn":1,"selectionStartLineNumber":1,"selectionStartColumn":1,"positionLineNumber":1,"positionColumn":1}],"contrib":{"chatDynamicVariableModel":[]}}'
  ],
  ['workbench.panel.chat.numberOfVisibleViews', '1'],
  [
    'chat.ChatSessionStore.index',
    '{"version":1,"entries":{"b881ccf7-2aa1-4851-b4bb-91e2cbc0fd1d":{"sessionId":"b881ccf7-2aa1-4851-b4bb-91e2cbc0fd1d","title":"Heyyy (:","lastMessageDate":1771351804162,"timing":{"created":1771350469673,"lastRequestStarted":1771351804162,"lastRequestEnded":1771351806234},"initialLocation":"panel","hasPendingEdits":false,"isEmpty":false,"isExternal":false,"lastResponseState":1}}}'
  ],
  [
    'scm:view:visibleRepositories',
    '{"all":["demo-source-control:Demo Source Control:file:///workspace"],"visible":[0],"sortKey":"discoveryTime"}'
  ],
  ['chat.disabledClaudeHooks.notification', 'true'],
  [
    'memento/interactive-session',
    '{"history":{"copilot":[{"inputText":"Coucou :)","attachments":[],"mode":{"id":"agent","kind":"agent"},"selections":[{"startLineNumber":1,"startColumn":10,"endLineNumber":1,"endColumn":10,"selectionStartLineNumber":1,"selectionStartColumn":10,"positionLineNumber":1,"positionColumn":10}],"contrib":{"chatDynamicVariableModel":[]}},{"inputText":"Heyyy (:","attachments":[],"mode":{"id":"agent","kind":"agent"},"selections":[{"startLineNumber":1,"startColumn":9,"endLineNumber":1,"endColumn":9,"selectionStartLineNumber":1,"selectionStartColumn":9,"positionLineNumber":1,"positionColumn":9}],"contrib":{"chatDynamicVariableModel":[]}}]}}'
  ],
  [
    'chat.untitledInputState',
    '{"inputText":"","attachments":[],"mode":{"id":"agent","kind":"agent"},"selections":[{"startLineNumber":1,"startColumn":1,"endLineNumber":1,"endColumn":1,"selectionStartLineNumber":1,"selectionStartColumn":1,"positionLineNumber":1,"positionColumn":1}],"contrib":{"chatDynamicVariableModel":[]}}'
  ],
  ['workspace.trust.startupPrompt.shown', 'true'],
  [
    'memento/workbench.parts.editor',
    '{"editorpart.state":{"serializedGrid":{"root":{"type":"branch","data":[{"type":"leaf","data":{"id":0,"editors":[{"id":"workbench.editors.files.fileEditorInput","value":"{\\"resourceJSON\\":{\\"$mid\\":1,\\"fsPath\\":\\"/workspace/index.html\\",\\"external\\":\\"file:///workspace/index.html\\",\\"path\\":\\"/workspace/index.html\\",\\"scheme\\":\\"file\\"},\\"encoding\\":\\"utf8\\"}"}],"mru":[0]},"size":605},{"type":"leaf","data":{"id":1,"editors":[{"id":"workbench.editors.customEditor","value":"{\\"resourceJSON\\":{\\"$mid\\":1,\\"fsPath\\":\\"/workspace/test.customeditor\\",\\"external\\":\\"file:///workspace/test.customeditor\\",\\"path\\":\\"/workspace/test.customeditor\\",\\"scheme\\":\\"file\\"}}"}],"mru":[0]},"size":606}],"size":1270},"orientation":1,"width":1211,"height":1270},"activeGroup":1,"mostRecentActiveGroups":[1,0]}}'
  ],
  ['workbench.editor.languageDetectionOpenedLanguages.workspace', '[["html",true]]'],
  [
    'memento/workbench.editors.files.textFileEditor',
    '{"textEditorViewState":[["file:///workspace/index.html",{"0":{"cursorState":[{"inSelectionMode":false,"selectionStart":{"lineNumber":1,"column":1},"position":{"lineNumber":1,"column":1}}],"viewState":{"scrollLeft":0,"firstPosition":{"lineNumber":1,"column":1},"firstPositionDeltaTop":0},"contributionsState":{"editor.contrib.folding":{"lineCount":18,"provider":"syntax","foldedImports":false},"editor.contrib.wordHighlighter":false}}}]]}'
  ]
])

// function printTree(dir: Directory): string[] {
//   return Array.from(dir.entries.values()).flatMap((entry, index, list) => {
//     const lastItem = index === list.length - 1
//     if (entry instanceof Directory) {
//       return [
//         (lastItem ? '├──' : '└──') + entry.name,
//         ...printTree(entry).map((line) => '│  ' + line)
//       ]
//     } else {
//       return [(lastItem ? '├──' : '└──') + entry.name + '(file: ' + entry.size + ' bytes)']
//     }
//   })
// }

interface IFile {
  mtime: number
  ctime: number
  data: string
}
function dumpFiles(path: string[], dir: Directory): Record<string, IFile> {
  function test(entry: File | Directory) {
    if (entry instanceof Directory) {
      return Object.entries(dumpFiles([...path, entry.name], entry))
    } else {
      return [
        <[string, IFile]>[
          [...path, entry.name].join('/'),
          {
            mtime: entry.mtime,
            ctime: entry.ctime,
            data: new TextDecoder().decode(entry.data)
            // data: encodeBase64(VSBuffer.wrap(entry.data!))
          }
        ]
      ]
    }
  }
  return Object.fromEntries(Array.from(dir.entries.values()).flatMap(test))
}

setInterval(() => {
  console.log(dumpFiles([], test.root), storage)
}, 5000)

registerWorkspaceUserDataFileSystemProvider(test)

// Override services
await initializeMonacoService(
  {
    ...commonServices,
    ...getWorkbenchServiceOverride(),
    ...getQuickAccessServiceOverride({
      isKeybindingConfigurationVisible: () => true,
      shouldUseGlobalPicker: () => true
    }),
    ...getStorageServiceOverride({
      fallbackOverride: {
        'workbench.activity.showAccounts': false
      },
      storageOverride: {
        [StorageScope.WORKSPACE]: new ExternalStorage({
          read(): Map<string, string> | undefined {
            return storage
          },
          async write(data: Map<string, string>): Promise<void> {
            storage = data
          }
        })
      }
    })
  },
  container,
  constructOptions,
  envOptions
)

const layoutService = await getService(IWorkbenchLayoutService)
document.querySelector('#togglePanel')!.addEventListener('click', async () => {
  layoutService.setPartHidden(layoutService.isVisible(Parts.PANEL_PART, window), Parts.PANEL_PART)
})

document.querySelector('#toggleAuxiliary')!.addEventListener('click', async () => {
  layoutService.setPartHidden(
    layoutService.isVisible(Parts.AUXILIARYBAR_PART, window),
    Parts.AUXILIARYBAR_PART
  )
})

document.querySelector('#toggleSandbox')!.addEventListener('click', async () => {
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.append('sandbox', '')
  window.location.href = url.toString()
})

export async function clearStorage(): Promise<void> {
  await userDataProvider.reset()
  await ((await getService(IStorageService)) as BrowserStorageService).clear()
}

await registerExtension(
  {
    name: 'demo',
    publisher: 'codingame',
    version: '1.0.0',
    engines: {
      vscode: '*'
    }
  },
  ExtensionHostKind.LocalProcess
).setAsDefaultApi()

export { remoteAuthority }
