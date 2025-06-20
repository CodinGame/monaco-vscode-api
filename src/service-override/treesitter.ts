import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { registerAssets } from '../assets'
import { ITreeSitterThemeService } from 'vs/editor/common/services/treeSitter/treeSitterThemeService.service'
import { TreeSitterThemeService } from 'vs/workbench/services/treeSitter/browser/treeSitterThemeService'
import { ITreeSitterLibraryService } from 'vs/editor/common/services/treeSitter/treeSitterLibraryService.service'
import { TreeSitterLibraryService } from 'vs/workbench/services/treeSitter/browser/treeSitterLibraryService'

registerAssets({
  'vs/../../node_modules/@vscode/tree-sitter-wasm/wasm/tree-sitter.wasm': new URL(
    '@vscode/tree-sitter-wasm/wasm/tree-sitter.wasm',
    import.meta.url
  ).href,
  'vs/../../node_modules/@vscode/tree-sitter-wasm/wasm/tree-sitter-typescript.wasm': new URL(
    '@vscode/tree-sitter-wasm/wasm/tree-sitter-typescript.wasm',
    import.meta.url
  ).href,
  'vs/editor/common/languages/highlights/typescript.scm': new URL(
    '../../vscode/src/vs/editor/common/languages/highlights/typescript.scm',
    import.meta.url
  ).href
})

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [ITreeSitterThemeService.toString()]: new SyncDescriptor(TreeSitterThemeService, [], false),
    [ITreeSitterLibraryService.toString()]: new SyncDescriptor(TreeSitterLibraryService, [], false)
  }
}
