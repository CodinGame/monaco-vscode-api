import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { AgenticPaneCompositePartService } from 'vs/sessions/browser/paneCompositePartService'
import { SessionsDiffEditorCommandsService } from 'vs/sessions/contrib/editor/browser/diffEditor.sessions.contribution'
import { IDiffEditorCommandsService } from 'vs/workbench/browser/parts/editor/diffEditorCommandsService.service'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite.service'
import getBulkEditServiceOverride from '../bulkEdit/session.js'
import getCommonServiceOverride, {
  type ViewCommonServiceOverrideOptions,
  type WebviewBrowserUriMode
} from './common'

export type { ViewCommonServiceOverrideOptions, WebviewBrowserUriMode }

export default function getServiceOverride(
  options?: ViewCommonServiceOverrideOptions
): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride(options),
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
