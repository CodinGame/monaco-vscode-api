import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { registerAssets } from '../assets'
import { ITreeSitterThemeService } from 'vs/editor/common/services/treeSitter/treeSitterThemeService.service'
import { TreeSitterThemeService } from 'vs/workbench/services/treeSitter/browser/treeSitterThemeService'
import { ITreeSitterLibraryService } from 'vs/editor/common/services/treeSitter/treeSitterLibraryService.service'
import { TreeSitterLibraryService } from 'vs/workbench/services/treeSitter/browser/treeSitterLibraryService'
import treeSitterAssets from '@vscode/tree-sitter-wasm/wasm/tree-sitter-*.wasm'
import treeSitterScmAssets from 'vs/editor/common/languages/highlights/*.scm'
import { nodeModulesPath } from 'vs/base/common/network'

registerAssets({
  [`${nodeModulesPath}/@vscode/tree-sitter-wasm/wasm/tree-sitter.wasm`]: new URL(
    '@vscode/tree-sitter-wasm/wasm/tree-sitter.wasm',
    import.meta.url
  ).href,
  ...Object.fromEntries(
    Object.entries(treeSitterAssets).map(([key, value]) => [`${nodeModulesPath}/${key}`, value])
  ),
  ...treeSitterScmAssets
})

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [ITreeSitterThemeService.toString()]: new SyncDescriptor(TreeSitterThemeService, [], false),
    [ITreeSitterLibraryService.toString()]: new SyncDescriptor(TreeSitterLibraryService, [], false)
  }
}
