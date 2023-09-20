/// <reference path="../../vscode.proposed.fileSearchProvider.d.ts" />
/// <reference path="../../vscode.proposed.textSearchProvider.d.ts" />
import { ExtensionHostKind, registerExtension } from 'vscode/extensions'
import * as monaco from 'monaco-editor'

const { getApi } = registerExtension({
  name: 'searchProvider',
  publisher: 'codingame',
  version: '1.0.0',
  engines: {
    vscode: '*'
  },
  enabledApiProposals: ['fileSearchProvider', 'textSearchProvider']
}, ExtensionHostKind.LocalProcess)

const api = await getApi()

api.workspace.registerFileSearchProvider('file', {
  async provideFileSearchResults () {
    return monaco.editor.getModels().map(model => model.uri).filter(uri => uri.scheme === 'file')
  }
})
api.workspace.registerTextSearchProvider('file', {
  async provideTextSearchResults (query, _, progress) {
    for (const model of monaco.editor.getModels()) {
      const matches = model.findMatches(query.pattern, false, query.isRegExp ?? false, query.isCaseSensitive ?? false, query.isWordMatch ?? false ? ' ' : null, true)
      if (matches.length > 0) {
        const ranges = matches.map(match => new api.Range(match.range.startLineNumber, match.range.startColumn, match.range.endLineNumber, match.range.endColumn))
        progress.report({
          uri: model.uri,
          ranges,
          preview: {
            text: model.getValue(),
            matches: ranges
          }
        })
      }
    }
    return {}
  }
})
