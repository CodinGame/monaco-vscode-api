import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IUpdateService } from 'vs/platform/update/common/update.service'
import { BrowserUpdateService } from 'vs/workbench/services/update/browser/updateService'
import 'vs/workbench/contrib/update/browser/update.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IUpdateService.toString()]: new SyncDescriptor(BrowserUpdateService, [], true)
  }
}
