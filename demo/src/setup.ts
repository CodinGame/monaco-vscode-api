import 'monaco-editor/esm/vs/editor/editor.all.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js'
import { IDialogService, initialize as initializeMonacoService } from 'vscode/services'
import { registerExtension, initialize as initializeVscodeExtensions } from 'vscode/extensions'
import getModelServiceOverride from 'vscode/service-override/model'
import getNotificationServiceOverride from 'vscode/service-override/notifications'
import getDialogsServiceOverride from 'vscode/service-override/dialogs'
import getConfigurationServiceOverride from 'vscode/service-override/configuration'
import getKeybindingsServiceOverride from 'vscode/service-override/keybindings'
import getTextmateServiceOverride from 'vscode/service-override/textmate'
import getThemeServiceOverride from 'vscode/service-override/theme'
import getLanguagesServiceOverride from 'vscode/service-override/languages'
import getAudioCueServiceOverride from 'vscode/service-override/audioCue'
import getViewsServiceOverride, { renderSidebarPart, renderActivitybarPar, renderEditorPart, renderPanelPart, renderStatusBarPart, registerCustomView, ViewContainerLocation, IResolvedTextEditorModel, IReference, OpenEditor } from 'vscode/service-override/views'
import getDebugServiceOverride from 'vscode/service-override/debug'
import getPreferencesServiceOverride from 'vscode/service-override/preferences'
import getSnippetServiceOverride from 'vscode/service-override/snippets'
import getQuickAccessServiceOverride from 'vscode/service-override/quickaccess'
import getOutputServiceOverride from 'vscode/service-override/output'
import getTerminalServiceOverride, { SimpleTerminalBackend, SimpleTerminalProcess } from 'vscode/service-override/terminal'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker'
import TypescriptWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker.js?worker'
import TextMateWorker from 'vscode/workers/textMate.worker?worker'
import OutputLinkComputerWorker from 'vscode/workers/outputLinkComputer.worker?worker'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import { createConfiguredEditor } from 'vscode/monaco'
import ansiColors from 'ansi-colors'
import 'vscode/default-extensions/theme-defaults'
import 'vscode/default-extensions/javascript'
import 'vscode/default-extensions/typescript-basics'
import 'vscode/default-extensions/json'
import 'vscode/default-extensions/theme-seti'
import 'vscode/default-extensions/references-view'
import * as vscode from 'vscode'
import iconUrl from './Visual_Studio_Code_1.35_icon.svg?url'

registerCustomView({
  id: 'custom-view',
  name: 'Custom demo view',
  renderBody: function (container: HTMLElement): monaco.IDisposable {
    container.style.display = 'flex'
    container.style.alignItems = 'center'
    container.style.justifyContent = 'center'
    container.innerHTML = 'This is a custom view<br />You can render anything you want here'

    return {
      dispose () {
      }
    }
  },
  location: ViewContainerLocation.Panel,
  icon: new URL(iconUrl, window.location.href).toString(),
  actions: [{
    id: 'custom-action',
    title: 'Custom action',
    render (element) {
      const button = document.createElement('button')
      button.innerText = 'Ugly button'
      button.style.height = '30px'
      button.onclick = () => {
        alert('What did you expect?')
      }
      element.append(button)
    }
  }, {
    id: 'custom-action2',
    title: 'Custom action2',
    icon: 'dialogInfo',
    async run (accessor) {
      accessor.get(IDialogService).info('This is a custom view action button')
    }
  }]
})

// Workers
interface WorkerConstructor {
  new(): Worker
}
export type WorkerLoader = () => WorkerConstructor | Promise<WorkerConstructor>
const workerLoaders: Partial<Record<string, WorkerLoader>> = {
  editorWorkerService: () => EditorWorker,
  textMateWorker: () => TextMateWorker,
  json: () => JsonWorker,
  javascript: () => TypescriptWorker,
  typescript: () => TypescriptWorker,
  outputLinkComputer: () => OutputLinkComputerWorker
}
window.MonacoEnvironment = {
  getWorker: async function (moduleId, label) {
    const workerFactory = workerLoaders[label]
    if (workerFactory != null) {
      const Worker = await workerFactory()
      return new Worker()
    }
    throw new Error(`Unimplemented worker ${label} (${moduleId})`)
  }
}

let currentEditor: ({
  modelRef: IReference<IResolvedTextEditorModel>
  editor: monaco.editor.IStandaloneCodeEditor
} & monaco.IDisposable) | null = null
const openNewCodeEditor: OpenEditor = async (modelRef) => {
  if (currentEditor != null) {
    currentEditor.dispose()
    currentEditor = null
  }
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
  container.style.top = container.style.bottom = container.style.left = container.style.right = '0'
  container.style.cursor = 'pointer'

  const editorElem = document.createElement('div')
  editorElem.style.position = 'absolute'
  editorElem.style.top = editorElem.style.bottom = editorElem.style.left = editorElem.style.right = '0'
  editorElem.style.margin = 'auto'
  editorElem.style.width = '80%'
  editorElem.style.height = '80%'

  container.appendChild(editorElem)

  document.body.appendChild(container)
  try {
    const editor = createConfiguredEditor(
      editorElem,
      {
        model: modelRef.object.textEditorModel,
        readOnly: true,
        automaticLayout: true
      }
    )

    currentEditor = {
      dispose: () => {
        editor.dispose()
        modelRef.dispose()
        document.body.removeChild(container)
        currentEditor = null
      },
      modelRef,
      editor
    }

    editor.onDidBlurEditorWidget(() => {
      currentEditor?.dispose()
    })
    container.addEventListener('mousedown', (event) => {
      if (event.target !== container) {
        return
      }

      currentEditor?.dispose()
    })

    return editor
  } catch (error) {
    document.body.removeChild(container)
    currentEditor = null
    throw error
  }
}

class TerminalBackend extends SimpleTerminalBackend {
  getDefaultSystemShell = async (): Promise<string> => 'fake'
  createProcess = async () => {
    const dataEmitter = new vscode.EventEmitter<string>()
    const propertyEmitter = new vscode.EventEmitter<{
      type: string
      value: string
    }>()
    class FakeTerminalProcess extends SimpleTerminalProcess {
      private column = 0
      async start (): Promise<undefined> {
        ansiColors.enabled = true
        dataEmitter.fire(`This is a fake terminal\r\n${ansiColors.green('$')} `)
        setTimeout(() => {
          dataEmitter.fire('\u001B]0;Fake terminal title\u0007')
        }, 0)
        this.column = 2

        return undefined
      }

      onDidChangeProperty = propertyEmitter.event

      shutdown (immediate: boolean): void {
        console.log('shutdown', immediate)
      }

      input (data: string): void {
        for (const c of data) {
          if (c.charCodeAt(0) === 13) {
            dataEmitter.fire(`\r\n${ansiColors.green('$')} `)
            this.column = 2
          } else if (c.charCodeAt(0) === 127) {
            if (this.column > 2) {
              dataEmitter.fire('\b \b')
              this.column--
            }
          } else {
            dataEmitter.fire(c)
            this.column++
          }
        }
      }

      resize (cols: number, rows: number): void {
        console.log('resize', cols, rows)
      }
    }
    return new FakeTerminalProcess(1, 1, '/tmp', dataEmitter.event)
  }
}

// Override services
await initializeMonacoService({
  ...getModelServiceOverride(),
  ...getNotificationServiceOverride(),
  ...getDialogsServiceOverride(),
  ...getConfigurationServiceOverride(monaco.Uri.file('/tmp')),
  ...getKeybindingsServiceOverride(),
  ...getTextmateServiceOverride(),
  ...getThemeServiceOverride(),
  ...getLanguagesServiceOverride(),
  ...getAudioCueServiceOverride(),
  ...getDebugServiceOverride(),
  ...getPreferencesServiceOverride(),
  ...getViewsServiceOverride(openNewCodeEditor),
  ...getSnippetServiceOverride(),
  ...getQuickAccessServiceOverride(),
  ...getOutputServiceOverride(),
  ...getTerminalServiceOverride(new TerminalBackend())
})
await initializeVscodeExtensions()

renderSidebarPart(document.querySelector<HTMLDivElement>('#sidebar')!)
renderActivitybarPar(document.querySelector<HTMLDivElement>('#activityBar')!)
renderPanelPart(document.querySelector<HTMLDivElement>('#panel')!)
renderEditorPart(document.querySelector<HTMLDivElement>('#editors')!)
renderStatusBarPart(document.querySelector<HTMLDivElement>('#statusBar')!)

const debuggerExtension = {
  name: 'debugger',
  publisher: 'codingame',
  version: '1.0.0',
  engines: {
    vscode: '*'
  },
  contributes: {
    debuggers: [{
      type: 'javascript',
      label: 'Test',
      languages: ['javascript']
    }],
    breakpoints: [{
      language: 'javascript'
    }]
  }
}

const { api: debuggerVscodeApi } = registerExtension(debuggerExtension)

class WebsocketDebugAdapter implements vscode.DebugAdapter {
  constructor (private websocket: WebSocket) {
    websocket.onmessage = (message) => {
      this._onDidSendMessage.fire(JSON.parse(message.data))
    }
  }

  _onDidSendMessage = new debuggerVscodeApi.EventEmitter<vscode.DebugProtocolMessage>()
  onDidSendMessage = this._onDidSendMessage.event

  handleMessage (message: vscode.DebugProtocolMessage): void {
    this.websocket.send(JSON.stringify(message))
  }

  dispose () {
    this.websocket.close()
  }
}

debuggerVscodeApi.debug.registerDebugAdapterDescriptorFactory('javascript', {
  async createDebugAdapterDescriptor () {
    const websocket = new WebSocket('ws://localhost:5555')

    await new Promise((resolve, reject) => {
      websocket.onopen = resolve
      websocket.onerror = () => reject(new Error('Unable to connect to debugger server. Run `npm run start:debugServer`'))
    })

    websocket.send(JSON.stringify({
      main: '/tmp/test.js',
      files: {
        '/tmp/test.js': new TextDecoder().decode(await vscode.workspace.fs.readFile(vscode.Uri.file('/tmp/test.js')))
      }
    }))

    const adapter = new WebsocketDebugAdapter(websocket)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adapter.onDidSendMessage((message: any) => {
      if (message.type === 'event' && message.event === 'output') {
        // eslint-disable-next-line no-console
        console.log('OUTPUT', message.body.output)
      }
    })
    return new debuggerVscodeApi.DebugAdapterInlineImplementation(adapter)
  }
})
