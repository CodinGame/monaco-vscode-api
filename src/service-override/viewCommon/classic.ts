import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import getCommonServiceOverride from './common'
import { PaneCompositePartService } from 'vs/workbench/browser/parts/paneCompositePartService'
import { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import 'vs/workbench/contrib/modernUI/browser/modernUI.contribution'

export default function getServiceOverride(
  _webviewIframeAlternateDomains?: string
): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride(_webviewIframeAlternateDomains),
    [IPaneCompositePartService.toString()]: new SyncDescriptor(PaneCompositePartService, [], true)
  }
}
