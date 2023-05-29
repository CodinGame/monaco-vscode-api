import './style.css'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import './setup'
// json contribution should be imported/run AFTER the services are initialized (in setup.ts)
import 'monaco-editor/esm/vs/language/json/monaco.contribution.js'
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution.js'
import { createConfiguredEditor, synchronizeJsonSchemas, createModelReference } from 'vscode/monaco'
import { SimpleTextFileSystemProvider, registerFileSystemOverlay, FileType, HTMLFileSystemProvider } from 'vscode/service-override/files'
import * as vscode from 'vscode'
import { ILogService, LogLevel, StandaloneServices } from 'vscode/services'

StandaloneServices.get(ILogService).setLevel(LogLevel.Off)

vscode.languages.registerCallHierarchyProvider('javascript', {
  prepareCallHierarchy: function (): vscode.ProviderResult<vscode.CallHierarchyItem | vscode.CallHierarchyItem[]> {
    return {
      name: 'Fake call hierarchy',
      kind: vscode.SymbolKind.Class,
      uri: vscode.Uri.file('/tmp/test.js'),
      range: new vscode.Range(0, 0, 0, 10),
      selectionRange: new vscode.Range(0, 0, 0, 10)
    }
  },
  provideCallHierarchyIncomingCalls: function (): vscode.ProviderResult<vscode.CallHierarchyIncomingCall[]> {
    return [{
      from: {
        name: 'Fake incomming call',
        kind: vscode.SymbolKind.Class,
        uri: vscode.Uri.file('/tmp/test.js'),
        range: new vscode.Range(0, 0, 0, 10),
        selectionRange: new vscode.Range(0, 0, 0, 10)
      },
      fromRanges: [new vscode.Range(2, 0, 2, 10)]
    }]
  },
  provideCallHierarchyOutgoingCalls: function (): vscode.ProviderResult<vscode.CallHierarchyOutgoingCall[]> {
    return []
  }
})

vscode.languages.registerHoverProvider('javascript', {
  async provideHover (document, position) {
    return {
      contents: [
        '# Hello',
        `This is a hover on ${document.uri.toString()} at position ${position.line}:${position.character}`
      ]
    }
  }
})

vscode.languages.registerCompletionItemProvider('javascript', {
  provideCompletionItems () {
    return [{
      label: 'Demo completion',
      detail: 'This is a demo completion registered via the vscode api',
      insertText: 'hello world'
    }]
  }
})

monaco.languages.json.jsonDefaults.setModeConfiguration({
  ...monaco.languages.json.jsonDefaults.modeConfiguration,
  tokens: false // Disable monarch tokenizer as we use TextMate here
})

synchronizeJsonSchemas()

const otherModelUri = vscode.Uri.file('/tmp/test2.js')
vscode.languages.registerDefinitionProvider('javascript', {
  provideDefinition (document, position) {
    const wordRange = document.getWordRangeAtPosition(position)
    if (wordRange != null && document.getText(wordRange) === 'anotherfile') {
      return {
        range: wordRange,
        uri: otherModelUri
      }
    }
    return []
  }
})

class FakeFileSystem extends SimpleTextFileSystemProvider {
  private files: Record<string, string> = {
    [otherModelUri.toString(true)]: 'This is another file'
  }

  protected override async getFileContent (resource: monaco.Uri): Promise<string | undefined> {
    return this.files[resource.toString(true)]
  }

  protected override async setFileContent (resource: monaco.Uri, content: string): Promise<void> {
    this.files[resource.toString(true)] = content
  }

  override async delete (): Promise<void> {
  }

  override async readdir (directory: monaco.Uri): Promise<[string, FileType][]> {
    if (directory.path === '/tmp') {
      return [['test2.js', FileType.File]]
    }
    return []
  }
}

registerFileSystemOverlay(new FakeFileSystem())

void vscode.window.showInformationMessage('Hello', {
  detail: 'Welcome to the monaco-vscode-api demo',
  modal: true
}).then(() => {
  void vscode.window.showInformationMessage('Try to change the settings or the configuration, the changes will be applied to all 3 editors')
})

async function createEditors () {
  const modelRef = await createModelReference(monaco.Uri.file('/tmp/test.js'), `// import anotherfile
let variable = 1
function inc () {
  variable++
}

while (variable < 5000) {
  inc()
  console.log('Hello world', variable);
}`)

  createConfiguredEditor(document.getElementById('editor')!, {
    model: modelRef.object.textEditorModel
  })

  const diagnostics = vscode.languages.createDiagnosticCollection('demo')
  diagnostics.set(modelRef.object.textEditorModel!.uri, [{
    range: new vscode.Range(2, 9, 2, 12),
    severity: vscode.DiagnosticSeverity.Error,
    message: 'This is not a real error, just a demo, don\'t worry',
    source: 'Demo',
    code: 42
  }])

  const settingsModelReference = await createModelReference(monaco.Uri.from({ scheme: 'user', path: '/settings.json' }), `{
  "workbench.colorTheme": "Default Dark+",
  "workbench.iconTheme": "vs-seti",
  "editor.autoClosingBrackets": "languageDefined",
  "editor.autoClosingQuotes": "languageDefined",
  "editor.scrollBeyondLastLine": true,
  "editor.mouseWheelZoom": true,
  "editor.wordBasedSuggestions": false,
  "editor.acceptSuggestionOnEnter": "on",
  "editor.foldingHighlight": false,
  "editor.semanticHighlighting.enabled": true,
  "editor.bracketPairColorization.enabled": false,
  "editor.fontSize": 12,
  "audioCues.lineHasError": "on",
  "audioCues.onDebugBreak": "on",
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "debug.toolBarLocation": "docked"
}`)
  createConfiguredEditor(document.getElementById('settings-editor')!, {
    model: settingsModelReference.object.textEditorModel
  })

  const keybindingsModelReference = await createModelReference(monaco.Uri.from({ scheme: 'user', path: '/keybindings.json' }), `[
  {
    "key": "ctrl+p",
    "command": "editor.action.quickCommand",
    "when": "editorTextFocus"
  },
  {
    "key": "ctrl+d",
    "command": "editor.action.deleteLines",
    "when": "editorTextFocus"
  }
]`)
  createConfiguredEditor(document.getElementById('keybindings-editor')!, {
    model: keybindingsModelReference.object.textEditorModel
  })
}

void createEditors()
setTimeout(() => {
  vscode.workspace.onDidChangeConfiguration(() => {
    void vscode.window.showInformationMessage('The configuration was changed')
  })
}, 1000)

document.querySelector('#filesystem')!.addEventListener('click', async () => {
  const dirHandle = await window.showDirectoryPicker()

  const htmlFileSystemProvider = new HTMLFileSystemProvider(undefined, 'unused', StandaloneServices.get(ILogService))
  await htmlFileSystemProvider.registerDirectoryHandle(dirHandle)
  registerFileSystemOverlay(htmlFileSystemProvider)

  vscode.workspace.updateWorkspaceFolders(0, 0, {
    uri: vscode.Uri.file(dirHandle.name)
  })
})

document.querySelector('#run')!.addEventListener('click', () => {
  void vscode.debug.startDebugging(undefined, {
    name: 'Test',
    request: 'attach',
    type: 'javascript'
  })
})
