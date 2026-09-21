import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import getCommonServiceOverride from './common'
import { PaneCompositePartService } from 'vs/workbench/browser/parts/paneCompositePartService'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IDiffEditorCommandsService } from 'vs/workbench/browser/parts/editor/diffEditorCommandsService.service'
import { DiffEditorCommandsService } from 'vs/workbench/browser/parts/editor/diffEditorCommandsService'
import 'vs/workbench/contrib/modernUI/browser/modernUI.contribution'
import { IEditorService } from 'vs/workbench/services/editor/common/editorService.service'
import { EditorService } from 'vs/workbench/services/editor/browser/editorService'

export default function getServiceOverride(
  _webviewIframeAlternateDomains?: string
): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride(_webviewIframeAlternateDomains),
    [IPaneCompositePartService.toString()]: new SyncDescriptor(PaneCompositePartService, [], true),
    [IDiffEditorCommandsService.toString()]: new SyncDescriptor(
      DiffEditorCommandsService,
      [],
      true
    ),
    [IEditorService.toString()]: new SyncDescriptor(EditorService, [undefined], false)
  }
}
