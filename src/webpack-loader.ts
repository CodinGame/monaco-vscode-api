import type { RawLoaderDefinitionFunction } from 'webpack'

const monacoPolyfillLoader: RawLoaderDefinitionFunction = function (source) {
  if (this.resourcePath.endsWith('monaco-editor/esm/vs/editor/contrib/suggest/browser/suggest.js')) {
    return `${source.toString()}
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
export const raw = true // for TTFs, see https://stackoverflow.com/questions/48824081/webpack-image-loader-encoding-breaks
