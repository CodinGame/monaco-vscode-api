import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { AgenticPaneCompositePartService } from 'vs/sessions/browser/paneCompositePartService'
import { SessionsDiffEditorCommandsService } from 'vs/sessions/contrib/editor/browser/diffEditor.sessions.contribution'
import { IDiffEditorCommandsService } from 'vs/workbench/browser/parts/editor/diffEditorCommandsService.service'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite.service'
import getBulkEditServiceOverride from '../bulkEdit/session.js'
import getCommonServiceOverride from './common'

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
    ...getBulkEditServiceOverride()
  }
}
