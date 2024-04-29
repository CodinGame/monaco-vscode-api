import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IPreferencesService } from 'vs/workbench/services/preferences/common/preferences.service'
import { PreferencesService } from 'vs/workbench/services/preferences/browser/preferencesService'
import { IPreferencesSearchService } from 'vs/workbench/contrib/preferences/common/preferences.service'
import { PreferencesSearchService } from 'vs/workbench/contrib/preferences/browser/preferencesSearch'
import { KeybindingsEditingService } from 'vs/workbench/services/keybinding/common/keybindingEditing'
import { IKeybindingEditingService } from 'vs/workbench/services/keybinding/common/keybindingEditing.service'
import 'vs/workbench/contrib/preferences/browser/preferences.contribution'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IPreferencesService.toString()]: new SyncDescriptor(PreferencesService, [], true),
    [IPreferencesSearchService.toString()]: new SyncDescriptor(PreferencesSearchService, [], true),
    [IKeybindingEditingService.toString()]: new SyncDescriptor(KeybindingsEditingService, [], true)
  }
}
