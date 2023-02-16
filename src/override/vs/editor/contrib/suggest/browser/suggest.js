import * as monacoSuggest from 'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggest.js'

export * from 'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggest.js'

// the function is removed in monaco-editor by the treeshaking process
// So let's just check if the method exists until https://github.com/microsoft/vscode/pull/156120 is merged and released
export function setSnippetSuggestSupport (support) {
  if (monacoSuggest.setSnippetSuggestSupport != null) {
    monacoSuggest.setSnippetSuggestSupport(support)
  } else {
    console.error(
`setSnippetSuggestSupport does not exist in monaco-editor.
It's treeshaked out of monaco editor and needs to be reintroduced.
If you're using webpack, you can add a loader that will polyfill it:
\`\`\`
{
  test: /node_modules\\/monaco-editor\\//,
  loader: 'vscode/webpack-loader'
}
\`\`\`
`)
  }
}
