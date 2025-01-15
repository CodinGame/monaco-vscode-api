import type { Plugin } from 'rollup'
import * as rollup from 'rollup'

export default (): Plugin => {
  return <rollup.Plugin>{
    name: 'resolve-asset-url',
    resolveFileUrl(options) {
      let relativePath = options.relativePath
      if (!relativePath.startsWith('.')) {
        relativePath = `./${options.relativePath}`
      }
      return `'${relativePath}'`
    }
  }
}
