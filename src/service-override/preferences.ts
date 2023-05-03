import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IPreferencesService } from 'vs/workbench/services/preferences/common/preferences'
import { PreferencesService } from 'vs/workbench/services/preferences/browser/preferencesService'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IPreferencesService.toString()]: new SyncDescriptor(PreferencesService)
  }
}
