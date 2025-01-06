import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ITreeSitterParserService } from 'vs/editor/common/services/treeSitterParserService'
import { TreeSitterTextModelService } from 'vs/editor/browser/services/treeSitter/treeSitterParserService'
import { ITreeSitterTokenizationFeature } from 'vs/workbench/services/treeSitter/browser/treeSitterTokenizationFeature.service'
import { TreeSitterTokenizationFeature } from 'vs/workbench/services/treeSitter/browser/treeSitterTokenizationFeature'
import { registerAssets } from '../assets'
import 'vs/workbench/services/treeSitter/browser/treeSitterTokenizationFeature.contribution'

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
    [ITreeSitterParserService.toString()]: new SyncDescriptor(
      TreeSitterTextModelService,
      [],
      false
    ),
    [ITreeSitterTokenizationFeature.toString()]: new SyncDescriptor(
      TreeSitterTokenizationFeature,
      [],
      false
    )
  }
}
