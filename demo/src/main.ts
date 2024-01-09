import './style.css'
import * as monaco from 'monaco-editor'
import { createConfiguredEditor, createModelReference } from 'vscode/monaco'
import { registerFileSystemOverlay, HTMLFileSystemProvider } from '@codingame/monaco-vscode-files-service-override'
import * as vscode from 'vscode'
import { ILogService, StandaloneServices, IPreferencesService, IEditorService, IDialogService, getService, createInstance } from 'vscode/services'
import { Parts, isPartVisibile, setPartVisibility } from '@codingame/monaco-vscode-views-service-override'
import { defaultUserConfigurationFile, updateUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override'
import { defaultUserKeybindindsFile, updateUserKeybindings } from '@codingame/monaco-vscode-keybindings-service-override'
import './features/filesystem'
import { clearStorage, remoteAuthority } from './setup'
import { CustomEditorInput } from './features/customView'
import { anotherFakeOutputChannel } from './features/output'
import defaultConfiguration from './user/configuration.json?raw'
import defaultKeybindings from './user/keybindings.json?raw'
import './features/debugger'
import './features/search'
import './features/intellisense'
import './features/notifications'
import './features/terminal'
import './features/scm'
import './features/testing'
import '@codingame/monaco-vscode-clojure-default-extension'
import '@codingame/monaco-vscode-coffeescript-default-extension'
import '@codingame/monaco-vscode-cpp-default-extension'
import '@codingame/monaco-vscode-csharp-default-extension'
import '@codingame/monaco-vscode-css-default-extension'
import '@codingame/monaco-vscode-diff-default-extension'
import '@codingame/monaco-vscode-fsharp-default-extension'
import '@codingame/monaco-vscode-go-default-extension'
import '@codingame/monaco-vscode-groovy-default-extension'
import '@codingame/monaco-vscode-html-default-extension'
import '@codingame/monaco-vscode-java-default-extension'
import '@codingame/monaco-vscode-javascript-default-extension'
import '@codingame/monaco-vscode-json-default-extension'
import '@codingame/monaco-vscode-julia-default-extension'
import '@codingame/monaco-vscode-lua-default-extension'
import '@codingame/monaco-vscode-markdown-basics-default-extension'
import '@codingame/monaco-vscode-objective-c-default-extension'
import '@codingame/monaco-vscode-perl-default-extension'
import '@codingame/monaco-vscode-php-default-extension'
import '@codingame/monaco-vscode-powershell-default-extension'
import '@codingame/monaco-vscode-python-default-extension'
import '@codingame/monaco-vscode-r-default-extension'
import '@codingame/monaco-vscode-ruby-default-extension'
import '@codingame/monaco-vscode-rust-default-extension'
import '@codingame/monaco-vscode-scss-default-extension'
import '@codingame/monaco-vscode-shellscript-default-extension'
import '@codingame/monaco-vscode-sql-default-extension'
import '@codingame/monaco-vscode-swift-default-extension'
import '@codingame/monaco-vscode-typescript-basics-default-extension'
import '@codingame/monaco-vscode-vb-default-extension'
import '@codingame/monaco-vscode-xml-default-extension'
import '@codingame/monaco-vscode-yaml-default-extension'

import '@codingame/monaco-vscode-theme-defaults-default-extension'
import '@codingame/monaco-vscode-theme-seti-default-extension'
import '@codingame/monaco-vscode-references-view-default-extension'
import '@codingame/monaco-vscode-search-result-default-extension'
import '@codingame/monaco-vscode-configuration-editing-default-extension'
import '@codingame/monaco-vscode-markdown-math-default-extension'
import '@codingame/monaco-vscode-npm-default-extension'
import '@codingame/monaco-vscode-media-preview-default-extension'
import '@codingame/monaco-vscode-ipynb-default-extension'

if (remoteAuthority != null) {
  import('./features/remoteExtension')
}

const modelRef = await createModelReference(monaco.Uri.file('/tmp/test.js'))

const [mainDocument] = await Promise.all([
  vscode.workspace.openTextDocument(modelRef.object.textEditorModel!.uri),
  vscode.workspace.openTextDocument(monaco.Uri.file('/tmp/test_readonly.js')) // open the file so vscode sees it's locked
])

anotherFakeOutputChannel.replace(mainDocument.getText())
vscode.workspace.onDidChangeTextDocument((e) => {
  if (e.document === mainDocument && e.contentChanges.length > 0) {
    anotherFakeOutputChannel.replace(e.document.getText())
  }
})

const diagnostics = vscode.languages.createDiagnosticCollection('demo')
diagnostics.set(modelRef.object.textEditorModel!.uri, [{
  range: new vscode.Range(2, 9, 2, 12),
  severity: vscode.DiagnosticSeverity.Error,
  message: 'This is not a real error, just a demo, don\'t worry',
  source: 'Demo',
  code: 42
}])
const settingsModelReference = await createModelReference(defaultUserConfigurationFile)
function updateSettingsDirty () {
  document.getElementById('settings-dirty')!.style.display = settingsModelReference.object.isDirty() ? 'inline' : 'none'
}
updateSettingsDirty()
settingsModelReference.object.onDidChangeDirty(updateSettingsDirty)
const settingEditor = createConfiguredEditor(document.getElementById('settings-editor')!, {
  model: settingsModelReference.object.textEditorModel,
  automaticLayout: true
})

settingEditor.addAction({
  id: 'custom-action',
  async run () {
    void (await getService(IDialogService)).info('Custom action executed!')
  },
  label: 'Custom action visible in the command palette',
  keybindings: [
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK
  ],
  contextMenuGroupId: 'custom'
})

const keybindingsModelReference = await createModelReference(defaultUserKeybindindsFile)
function updateKeydinbingsDirty () {
  document.getElementById('keybindings-dirty')!.style.display = keybindingsModelReference.object.isDirty() ? 'inline' : 'none'
}
updateKeydinbingsDirty()
keybindingsModelReference.object.onDidChangeDirty(updateKeydinbingsDirty)

createConfiguredEditor(document.getElementById('keybindings-editor')!, {
  model: keybindingsModelReference.object.textEditorModel,
  automaticLayout: true
})

document.querySelector('#filesystem')!.addEventListener('click', async () => {
  const dirHandle = await window.showDirectoryPicker()

  const htmlFileSystemProvider = new HTMLFileSystemProvider(undefined, 'unused', StandaloneServices.get(ILogService))
  await htmlFileSystemProvider.registerDirectoryHandle(dirHandle)
  registerFileSystemOverlay(1, htmlFileSystemProvider)

  vscode.workspace.updateWorkspaceFolders(0, 0, {
    uri: vscode.Uri.file(dirHandle.name)
  })
})

document.querySelector('#run')!.addEventListener('click', () => {
  void vscode.debug.startDebugging(undefined, {
    name: 'Test',
    request: 'attach',
    type: 'javascript'
  })
})

document.querySelector('#settingsui')!.addEventListener('click', async () => {
  await StandaloneServices.get(IPreferencesService).openUserSettings()
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

document.querySelector('#resetsettings')!.addEventListener('click', async () => {
  await updateUserConfiguration(defaultConfiguration)
})

document.querySelector('#resetkeybindings')!.addEventListener('click', async () => {
  await updateUserKeybindings(defaultKeybindings)
})

document.querySelector('#keybindingsui')!.addEventListener('click', async () => {
  await StandaloneServices.get(IPreferencesService).openGlobalKeybindingSettings(false)
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

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

document.querySelector('#togglePanel')!.addEventListener('click', async () => {
  setPartVisibility(Parts.PANEL_PART, !isPartVisibile(Parts.PANEL_PART))
})

document.querySelector('#toggleAuxiliary')!.addEventListener('click', async () => {
  setPartVisibility(Parts.AUXILIARYBAR_PART, !isPartVisibile(Parts.AUXILIARYBAR_PART))
})

const locale = new URLSearchParams(window.location.search).get('locale') ?? ''
const select: HTMLSelectElement = document.querySelector('#localeSelect')!
select.value = locale
select.addEventListener('change', () => {
  const url = new URL(window.location.href)
  if (select.value !== '') {
    url.searchParams.set('locale', select.value)
  } else {
    url.searchParams.delete('locale')
  }
  window.location.href = url.toString()
})
