import * as vscode from 'vscode'
import '@codingame/monaco-vscode-json-language-features-default-extension'
import '@codingame/monaco-vscode-typescript-language-features-default-extension'
import '@codingame/monaco-vscode-html-language-features-default-extension'
import '@codingame/monaco-vscode-css-language-features-default-extension'
import '@codingame/monaco-vscode-markdown-language-features-default-extension'
import '../setup' // import setup file to wait for services initialization

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
