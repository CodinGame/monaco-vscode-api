import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import getCommonServiceOverride from './common'
import { AgenticPaneCompositePartService } from 'vs/sessions/browser/paneCompositePartService'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite.service'
import { IDiffEditorCommandsService } from 'vs/workbench/browser/parts/editor/diffEditorCommandsService.service'
import { SessionsDiffEditorCommandsService } from 'vs/sessions/contrib/editor/browser/diffEditor.sessions.contribution'
import { IEditorService } from 'vs/workbench/services/editor/common/editorService.service'
import { EditorParts } from 'vs/sessions/browser/parts/editorParts'

export default function getServiceOverride(
  _webviewIframeAlternateDomains?: string
): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride(_webviewIframeAlternateDomains),
    [IPaneCompositePartService.toString()]: new SyncDescriptor(
      AgenticPaneCompositePartService,
      [],
      true
    ),
    [IDiffEditorCommandsService.toString()]: new SyncDescriptor(
      SessionsDiffEditorCommandsService,
      [],
      true
    ),
    [IEditorService.toString()]: new SyncDescriptor(EditorParts, [], true)
  }
}
