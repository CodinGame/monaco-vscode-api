import type { RawLoaderDefinitionFunction } from 'webpack'

const monacoPolyfillLoader: RawLoaderDefinitionFunction = function (source) {
  if (this.resourcePath.endsWith('monaco-editor/esm/vs/editor/contrib/suggest/browser/suggest.js')) {
    return `${source}
export function setSnippetSuggestSupport(support) {
  const old = _snippetSuggestSupport;
  _snippetSuggestSupport = support;
  return old;
}
`
  }
  return source
}

export default monacoPolyfillLoader
