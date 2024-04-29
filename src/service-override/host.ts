import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IHostService } from 'vs/workbench/services/host/browser/host.service'
import { IHostColorSchemeService } from 'vs/workbench/services/themes/common/hostColorSchemeService.service'
import { BrowserHostService } from 'vs/workbench/services/host/browser/browserHostService'
import { BrowserHostColorSchemeService } from 'vs/workbench/services/themes/browser/browserHostColorSchemeService'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IHostService.toString()]: new SyncDescriptor(BrowserHostService, [], true),
    [IHostColorSchemeService.toString()]: new SyncDescriptor(BrowserHostColorSchemeService, [], true)
  }
}
