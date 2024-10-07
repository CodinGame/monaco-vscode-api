import {
  IDialogService,
  IEditorService,
  IPreferencesService,
  StandaloneServices,
  createInstance,
  getService
} from 'vscode/services'
import * as monaco from 'monaco-editor'
import {
  defaultUserConfigurationFile,
  updateUserConfiguration
} from '@codingame/monaco-vscode-configuration-service-override'
import {
  defaultUserKeybindindsFile,
  updateUserKeybindings
} from '@codingame/monaco-vscode-keybindings-service-override'
import { clearStorage, remoteAuthority } from './setup.views'
import { CustomEditorInput } from './features/customView.views'
import defaultConfiguration from './user/configuration.json?raw'
import defaultKeybindings from './user/keybindings.json?raw'
import './main.common'

if (remoteAuthority != null) {
  void import('./features/remoteExtension')
}

document.querySelector('#customEditorPanel')!.addEventListener('click', async () => {
  const input = await createInstance(CustomEditorInput, undefined)
  let toggle = false
  const interval = window.setInterval(() => {
    const title = toggle ? 'Awesome editor pane' : 'Incredible editor pane'
    input.setTitle(title)
    input.setName(title)
    input.setDescription(title)
    toggle = !toggle
  }, 1000)
  input.onWillDispose(() => {
    window.clearInterval(interval)
  })

  await StandaloneServices.get(IEditorService).openEditor(input, {
    pinned: true
  })
})

document.querySelector('#clearStorage')!.addEventListener('click', async () => {
  await clearStorage()
})

const settingsEditorEl = document.getElementById('settings-editor')!
const settingsModelReference = await monaco.editor.createModelReference(
  defaultUserConfigurationFile
)
function updateSettingsDirty() {
  document.getElementById('settings-dirty')!.style.display = settingsModelReference.object.isDirty()
    ? 'inline'
    : 'none'
}
updateSettingsDirty()
settingsModelReference.object.onDidChangeDirty(updateSettingsDirty)
const settingEditor = monaco.editor.create(settingsEditorEl, {
  model: settingsModelReference.object.textEditorModel,
  automaticLayout: true
})

settingEditor.addAction({
  id: 'custom-action',
  async run() {
    void (await getService(IDialogService)).info('Custom action executed!')
  },
  label: 'Custom action visible in the command palette',
  keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
  contextMenuGroupId: 'custom'
})

const keybindingsEditorEl = document.getElementById('keybindings-editor')!
const keybindingsModelReference = await monaco.editor.createModelReference(
  defaultUserKeybindindsFile
)
function updateKeydinbingsDirty() {
  document.getElementById('keybindings-dirty')!.style.display =
    keybindingsModelReference.object.isDirty() ? 'inline' : 'none'
}
updateKeydinbingsDirty()
keybindingsModelReference.object.onDidChangeDirty(updateKeydinbingsDirty)

monaco.editor.create(keybindingsEditorEl, {
  model: keybindingsModelReference.object.textEditorModel,
  automaticLayout: true
})

document.querySelector('#settingsui')?.addEventListener('click', async () => {
  await StandaloneServices.get(IPreferencesService).openUserSettings()
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

document.querySelector('#resetsettings')?.addEventListener('click', async () => {
  await updateUserConfiguration(defaultConfiguration)
})

document.querySelector('#resetkeybindings')?.addEventListener('click', async () => {
  await updateUserKeybindings(defaultKeybindings)
})

document.querySelector('#keybindingsui')?.addEventListener('click', async () => {
  await StandaloneServices.get(IPreferencesService).openGlobalKeybindingSettings(false)
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
