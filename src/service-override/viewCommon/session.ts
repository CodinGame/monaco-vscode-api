import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import getCommonServiceOverride from './common'
import { AgenticPaneCompositePartService } from 'vs/sessions/browser/paneCompositePartService'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite.service'

export default function getServiceOverride(
  _webviewIframeAlternateDomains?: string
): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride(_webviewIframeAlternateDomains),
    [IPaneCompositePartService.toString()]: new SyncDescriptor(
      AgenticPaneCompositePartService,
      [],
      true
    )
  }
}
