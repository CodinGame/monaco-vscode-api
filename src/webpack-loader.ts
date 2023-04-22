import type { RawLoaderDefinitionFunction } from 'webpack'
import { sep as s } from 'path'

const monacoPolyfillLoader: RawLoaderDefinitionFunction = function (source) {
  if (this.resourcePath.endsWith(`monaco-editor${s}esm${s}vs${s}editor${s}contrib${s}suggest${s}browser${s}suggest.js`)) {
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
