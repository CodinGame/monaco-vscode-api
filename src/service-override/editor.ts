import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IResolvedTextEditorModel } from 'vs/editor/common/services/resolverService'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { CodeEditorService } from 'vs/workbench/services/editor/browser/codeEditorService'
import { IEditorService } from 'vs/workbench/services/editor/common/editorService'
import { EditorExtensions, IEditorFactoryRegistry, IFileEditorInput } from 'vs/workbench/common/editor'
import { IEditorOptions } from 'vs/platform/editor/common/editor'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IReference } from 'vs/base/common/lifecycle'
import { ITextEditorService, TextEditorService } from 'vs/workbench/services/textfile/common/textEditorService'
import { Registry } from 'vs/platform/registry/common/platform'
import { FILE_EDITOR_INPUT_ID } from 'vs/workbench/contrib/files/common/files'
import { IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { MonacoDelegateEditorGroupsService, MonacoEditorService, OpenEditor } from './tools/editor'
import { unsupported } from '../tools'
import { EmptyEditorGroupsService } from '../missing-services'
import 'vs/workbench/browser/parts/editor/editor.contribution'

class MonacoEditorGroupsService extends MonacoDelegateEditorGroupsService<EmptyEditorGroupsService> {
  constructor (@IInstantiationService instantiationService: IInstantiationService) {
    super(
      instantiationService.createInstance(EmptyEditorGroupsService),
      instantiationService
    )
  }
}

/**
 * Register a fake file editor factory
 * The code check that there is a registered factory even if it's not used
 */
Registry.as<IEditorFactoryRegistry>(EditorExtensions.EditorFactory).registerFileEditorFactory({
  typeId: FILE_EDITOR_INPUT_ID,
  createFileEditor: unsupported,
  isFileEditor: (obj): obj is IFileEditorInput => false
})

export default function getServiceOverride (openEditor: OpenEditor): IEditorOverrideServices {
  return {
    [ICodeEditorService.toString()]: new SyncDescriptor(CodeEditorService, undefined, true),
    [IEditorService.toString()]: new SyncDescriptor(MonacoEditorService, [openEditor, () => false], true),
    [ITextEditorService.toString()]: new SyncDescriptor(TextEditorService, [], false),
    [IEditorGroupsService.toString()]: new SyncDescriptor(MonacoEditorGroupsService)
  }
}

export {
  OpenEditor,
  IEditorOptions,
  IResolvedTextEditorModel,
  IReference,
  MonacoEditorService
}
