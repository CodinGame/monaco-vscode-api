import {
  IStorageService,
  IWorkbenchLayoutService,
  getService,
  initialize as initializeMonacoService
} from 'vscode/services'
import getQuickAccessServiceOverride from '@codingame/monaco-vscode-quickaccess-service-override'
import { BrowserStorageService } from '@codingame/monaco-vscode-storage-service-override'
import { ExtensionHostKind } from '@codingame/monaco-vscode-extensions-service-override'
import { registerExtension } from 'vscode/extensions'
import getViewsServiceOverride, {
  isEditorPartVisible,
  Parts,
  onPartVisibilityChange,
  isPartVisibile,
  attachPart,
  getSideBarPosition,
  onDidChangeSideBarPosition,
  Position
} from '@codingame/monaco-vscode-views-service-override'
import { setUnexpectedErrorHandler } from 'vscode/monaco'
import { openNewCodeEditor } from './features/editor'
import './features/customView.views'
import {
  commonServices,
  constructOptions,
  envOptions,
  remoteAuthority,
  userDataProvider
} from './setup.common'

const container = document.createElement('div')
container.id = 'app'
container.innerHTML = `
<div id="workbench-container">
<div id="titleBar"></div>
<div id="banner"></div>
<div id="workbench-top">
  <div style="display: flex; flex: none; border: 1px solid var(--vscode-editorWidget-border)">
    <div id="activityBar"></div>
    <div id="sidebar" style="width: 400px"></div>
    <div id="auxiliaryBar-left" style="max-width: 300px"></div>
  </div>
  <div style="flex: 1; min-width: 0">
    <h1>Editor</h1>
    <div id="editors"></div>

    <button id="toggleHTMLFileSystemProvider">Toggle HTML filesystem provider</button>
    <button id="customEditorPanel">Open custom editor panel</button>
    <button id="clearStorage">Clear user data</button>
    <button id="resetLayout">Reset layout</button>
    <button id="toggleFullWorkbench">Switch to full workbench mode</button>
    <br />
    <button id="togglePanel">Toggle Panel</button>
    <button id="toggleAuxiliary">Toggle Secondary Panel</button>
  </div>
  <div style="display: flex; flex: none; border: 1px solid var(--vscode-editorWidget-border);">
    <div id="sidebar-right" style="max-width: 500px"></div>
    <div id="activityBar-right"></div>
    <div id="auxiliaryBar" style="max-width: 300px"></div>
  </div>
</div>

<div id="panel"></div>

<div id="statusBar"></div>
</div>

<h1>Settings<span id="settings-dirty">●</span></h1>
<button id="settingsui">Open settings UI</button>
<button id="resetsettings">Reset settings</button>
<div id="settings-editor" class="standalone-editor"></div>
<h1>Keybindings<span id="keybindings-dirty">●</span></h1>
<button id="keybindingsui">Open keybindings UI</button>
<button id="resetkeybindings">Reset keybindings</button>
<div id="keybindings-editor" class="standalone-editor"></div>`

document.body.append(container)

// Override services
await initializeMonacoService(
  {
    ...commonServices,
    ...getViewsServiceOverride(openNewCodeEditor, undefined),

    ...getQuickAccessServiceOverride({
      isKeybindingConfigurationVisible: isEditorPartVisible,
      shouldUseGlobalPicker: (_editor, isStandalone) => !isStandalone && isEditorPartVisible()
    })
  },
  document.body,
  constructOptions,
  envOptions
)

setUnexpectedErrorHandler((e) => {
  // eslint-disable-next-line no-console
  console.info('Unexpected error', e)
})

for (const config of [
  { part: Parts.TITLEBAR_PART, element: '#titleBar' },
  { part: Parts.BANNER_PART, element: '#banner' },
  {
    part: Parts.SIDEBAR_PART,
    get element() {
      return getSideBarPosition() === Position.LEFT ? '#sidebar' : '#sidebar-right'
    },
    onDidElementChange: onDidChangeSideBarPosition
  },
  {
    part: Parts.ACTIVITYBAR_PART,
    get element() {
      return getSideBarPosition() === Position.LEFT ? '#activityBar' : '#activityBar-right'
    },
    onDidElementChange: onDidChangeSideBarPosition
  },
  { part: Parts.PANEL_PART, element: '#panel' },
  { part: Parts.EDITOR_PART, element: '#editors' },
  { part: Parts.STATUSBAR_PART, element: '#statusBar' },
  {
    part: Parts.AUXILIARYBAR_PART,
    get element() {
      return getSideBarPosition() === Position.LEFT ? '#auxiliaryBar' : '#auxiliaryBar-left'
    },
    onDidElementChange: onDidChangeSideBarPosition
  }
]) {
  attachPart(config.part, document.querySelector<HTMLDivElement>(config.element)!)

  config.onDidElementChange?.(() => {
    attachPart(config.part, document.querySelector<HTMLDivElement>(config.element)!)
  })

  if (!isPartVisibile(config.part)) {
    document.querySelector<HTMLDivElement>(config.element)!.style.display = 'none'
  }

  onPartVisibilityChange(config.part, (visible) => {
    document.querySelector<HTMLDivElement>(config.element)!.style.display = visible
      ? 'block'
      : 'none'
  })
}

const layoutService = await getService(IWorkbenchLayoutService)
document.querySelector('#togglePanel')!.addEventListener('click', async () => {
  layoutService.setPartHidden(layoutService.isVisible(Parts.PANEL_PART, window), Parts.PANEL_PART)
})

document.querySelector('#toggleAuxiliary')!.addEventListener('click', async () => {
  layoutService.setPartHidden(
    layoutService.isVisible(Parts.AUXILIARYBAR_PART, window),
    Parts.AUXILIARYBAR_PART
  )
})

export async function clearStorage(): Promise<void> {
  await userDataProvider.reset()
  await ((await getService(IStorageService)) as BrowserStorageService).clear()
}

await registerExtension(
  {
    name: 'demo',
    publisher: 'codingame',
    version: '1.0.0',
    engines: {
      vscode: '*'
    }
  },
  ExtensionHostKind.LocalProcess
).setAsDefaultApi()

export { remoteAuthority }
