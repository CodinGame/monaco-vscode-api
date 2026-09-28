import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import getCommonServiceOverride from './common'
import { PaneCompositePartService } from 'vs/workbench/browser/parts/paneCompositePartService'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IDiffEditorCommandsService } from 'vs/workbench/browser/parts/editor/diffEditorCommandsService.service'
import { DiffEditorCommandsService } from 'vs/workbench/browser/parts/editor/diffEditorCommandsService'
import getBulkEditServiceOverride from '../bulkEdit/classic.js'
// Import it from here to force the bundler to put it in this service-override package
import 'vs/workbench/browser/parts/editor/editorParts'
import 'vs/workbench/contrib/modernUI/browser/modernUI.contribution'

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
    ...getBulkEditServiceOverride()
  }
}
