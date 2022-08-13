import * as monacoSuggest from 'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggest.js'

export * from 'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggest.js'

// the function is removed in monaco-editor by treeshaking
// There is no way to hack or workaround it
// So let's just check if the method exists until https://github.com/microsoft/vscode/pull/156120 is merged and released
// @codingame/monaco-editor@~0.34 can be used in the meantime (the only change from official monaco-editor is the export of setSnippetSuggestSupport)
export function setSnippetSuggestSupport (support) {
  if (monacoSuggest.setSnippetSuggestSupport != null) {
    monacoSuggest.setSnippetSuggestSupport(support)
  } else {
    console.error('setSnippetSuggestSupport does not exist in monaco-editor')
  }
}
