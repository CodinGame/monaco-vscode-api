import type * as vscode from 'vscode'
import '@codingame/monaco-vscode-json-language-features-default-extension'
import '@codingame/monaco-vscode-typescript-language-features-default-extension'
import '@codingame/monaco-vscode-html-language-features-default-extension'
import '@codingame/monaco-vscode-css-language-features-default-extension'
import '@codingame/monaco-vscode-markdown-language-features-default-extension'
import '@codingame/monaco-vscode-emmet-default-extension'
import { ExtensionHostKind, registerExtension } from 'vscode/extensions'

const { getApi } = registerExtension({
  name: 'fake-intellisense',
  publisher: 'codingame',
  version: '1.0.0',
  engines: {
    vscode: '*'
  }
}, ExtensionHostKind.LocalProcess)

void getApi().then(async api => {
  api.languages.registerCallHierarchyProvider('javascript', {
    prepareCallHierarchy: function (): vscode.ProviderResult<vscode.CallHierarchyItem | vscode.CallHierarchyItem[]> {
      return {
        name: 'Fake call hierarchy',
        kind: api.SymbolKind.Class,
        uri: api.Uri.file('/workspace/test.js'),
        range: new api.Range(0, 0, 0, 10),
        selectionRange: new api.Range(0, 0, 0, 10)
      }
    },
    provideCallHierarchyIncomingCalls: function (): vscode.ProviderResult<vscode.CallHierarchyIncomingCall[]> {
      return [{
        from: {
          name: 'Fake incomming call',
          kind: api.SymbolKind.Class,
          uri: api.Uri.file('/workspace/test.js'),
          range: new api.Range(0, 0, 0, 10),
          selectionRange: new api.Range(0, 0, 0, 10)
        },
        fromRanges: [new api.Range(2, 0, 2, 10)]
      }]
    },
    provideCallHierarchyOutgoingCalls: function (): vscode.ProviderResult<vscode.CallHierarchyOutgoingCall[]> {
      return []
    }
  })

  api.languages.registerHoverProvider('javascript', {
    async provideHover (document, position) {
      return {
        contents: [
          '# Hello',
        `This is a hover on ${document.uri.toString()} at position ${position.line}:${position.character}`
        ]
      }
    }
  })

  api.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems () {
      return [{
        label: 'Demo completion',
        detail: 'This is a demo completion registered via the vscode api',
        insertText: 'hello world'
      }]
    }
  })

  api.languages.registerDefinitionProvider('javascript', {
    provideDefinition (document, position) {
      const wordRange = document.getWordRangeAtPosition(position)
      if (wordRange != null && document.getText(wordRange) === 'anotherfile') {
        return {
          range: wordRange,
          uri: api.Uri.file('/workspace/test_readonly.js')
        }
      }
      return []
    }
  })
})
