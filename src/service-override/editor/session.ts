import { IEditorService } from 'vs/workbench/services/editor/common/editorService.service.js'
import getCommonServiceOverride, { type OpenEditor } from './common.js'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors.js'
import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices.js'
import { MonacoEditorService } from '../tools/editor.js'
import { EditorParts } from 'vs/sessions/browser/parts/editorParts.js'
import { IDiffEditorCommandsService } from 'vs/workbench/browser/parts/editor/diffEditorCommandsService.service.js'
import { SessionsDiffEditorCommandsService } from 'vs/sessions/contrib/editor/browser/diffEditor.sessions.contribution.js'
export type { OpenEditor, IEditorOptions, IResolvedTextEditorModel, IReference } from './common.js'

export default function getServiceOverride(openEditor: OpenEditor): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride(openEditor),
    [IEditorService.toString()]: new SyncDescriptor(EditorParts, [], true),
    [IDiffEditorCommandsService.toString()]: new SyncDescriptor(
      SessionsDiffEditorCommandsService,
      [],
      true
    )
  }
}

export { MonacoEditorService }
