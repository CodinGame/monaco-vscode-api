import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { registerAssets } from '../assets'
import { ITreeSitterThemeService } from 'vs/editor/common/services/treeSitter/treeSitterThemeService.service'
import { TreeSitterThemeService } from 'vs/workbench/services/treeSitter/browser/treeSitterThemeService'
import { ITreeSitterLibraryService } from 'vs/editor/common/services/treeSitter/treeSitterLibraryService.service'
import { TreeSitterLibraryService } from 'vs/workbench/services/treeSitter/browser/treeSitterLibraryService'
import treeSitterAssets from '@vscode/tree-sitter-wasm/wasm/tree-sitter-*.wasm'
// @ts-expect-error -- `declare module` syntax doesn't support escaping `*` in the path not having more than one wildcard
import treeSitterScmAssets from 'vs/editor/common/languages/**/*.scm'
import { nodeModulesPath } from 'vs/base/common/network'
import { FileAccess } from 'vs/base/common/network'

// Don't use registerAssets for tree-sitter assets, because we also need to return an unresolvable url for files that doesn't exists
FileAccess.registerAppResourceLoader((moduleId) => {
  if (moduleId.startsWith('vs/editor/common/languages/') && moduleId.endsWith('.scm')) {
    return treeSitterScmAssets[moduleId] ?? `not-found:///${moduleId}`
  }
})

registerAssets({
  [`${nodeModulesPath}/@vscode/tree-sitter-wasm/wasm/tree-sitter.wasm`]: new URL(
    '@vscode/tree-sitter-wasm/wasm/tree-sitter.wasm',
    import.meta.url
  ).href,
  ...Object.fromEntries(
    Object.entries(treeSitterAssets).map(([key, value]) => [`${nodeModulesPath}/${key}`, value])
  )
})

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [ITreeSitterThemeService.toString()]: new SyncDescriptor(TreeSitterThemeService, [], false),
    [ITreeSitterLibraryService.toString()]: new SyncDescriptor(TreeSitterLibraryService, [], false)
  }
}
