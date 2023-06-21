import * as vscode from 'vscode'
import 'monaco-editor/esm/vs/language/json/monaco.contribution.js'
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution.js'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import { registerTypescriptWorkerFileProvider, synchronizeJsonSchemas } from 'vscode/monaco'
import { onExtHostInitialized } from 'vscode/extensions'
import typescriptGlobal from '../../node_modules/@types/node/globals.d.ts?raw'
import typescriptConsole from '../../node_modules/@types/node/console.d.ts?raw'
import typescriptProcess from '../../node_modules/@types/node/process.d.ts?raw'

registerTypescriptWorkerFileProvider()

await new Promise<void>(resolve => onExtHostInitialized(resolve))

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

const compilerOptions: Parameters<typeof monaco.languages.typescript.typescriptDefaults.setCompilerOptions>[0] = {
  target: monaco.languages.typescript.ScriptTarget.ES2016,
  allowNonTsExtensions: true,
  moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  module: monaco.languages.typescript.ModuleKind.CommonJS,
  noEmit: true,
  lib: ['es2020']
}

monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions)
monaco.languages.typescript.typescriptDefaults.addExtraLib(typescriptGlobal, 'node/globals.d.ts')
monaco.languages.typescript.typescriptDefaults.addExtraLib(typescriptConsole, 'node/console.d.ts')
monaco.languages.typescript.typescriptDefaults.addExtraLib(typescriptProcess, 'node/process.d.ts')
monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions)
monaco.languages.typescript.javascriptDefaults.addExtraLib(typescriptGlobal, 'node/globals.d.ts')
monaco.languages.typescript.javascriptDefaults.addExtraLib(typescriptConsole, 'node/console.d.ts')
monaco.languages.typescript.javascriptDefaults.addExtraLib(typescriptProcess, 'node/process.d.ts')

monaco.languages.json.jsonDefaults.setModeConfiguration({
  ...monaco.languages.json.jsonDefaults.modeConfiguration,
  tokens: false // Disable monarch tokenizer as we use TextMate here
})

synchronizeJsonSchemas()

vscode.languages.registerDefinitionProvider('javascript', {
  provideDefinition (document, position) {
    const wordRange = document.getWordRangeAtPosition(position)
    if (wordRange != null && document.getText(wordRange) === 'anotherfile') {
      return {
        range: wordRange,
        uri: vscode.Uri.file('/tmp/test2.js')
      }
    }
    return []
  }
})
