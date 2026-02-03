import type { Plugin } from 'rollup'

export default (): Plugin => ({
  name: 'dynamic-import-polyfill',
  renderDynamicImport({ targetModuleId }): { left: string; right: string } | undefined {
    // Hack for @vscode/tree-sitter-wasm that doesn't export its parser correctly (as default instead of a named export, in commonjs)
    if (targetModuleId === '@vscode/tree-sitter-wasm') {
      return {
        left: 'import(',
        right: ').then(module => ({ Parser: module.default ?? module }))'
      }
    }

    return undefined
  }
})
