import * as vscode from 'vscode'
import { onExtHostInitialized } from 'vscode/extensions'
import 'vscode/default-extensions/json-language-features'
import 'vscode/default-extensions/typescript-language-features'
import 'vscode/default-extensions/html-language-features'
import 'vscode/default-extensions/css-language-features'
import 'vscode/default-extensions/markdown-language-features'

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

vscode.languages.registerDefinitionProvider('javascript', {
  provideDefinition (document, position) {
    const wordRange = document.getWordRangeAtPosition(position)
    if (wordRange != null && document.getText(wordRange) === 'anotherfile') {
      return {
        range: wordRange,
        uri: vscode.Uri.file('/tmp/test_readonly.js')
      }
    }
    return []
  }
})
