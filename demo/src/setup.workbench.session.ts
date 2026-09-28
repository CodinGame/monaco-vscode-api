import {
  IStorageService,
  getService,
  initialize as initializeMonacoService
} from '@codingame/monaco-vscode-api'
import { registerExtension } from '@codingame/monaco-vscode-api/extensions'
import { ExtensionHostKind } from '@codingame/monaco-vscode-extensions-service-override'
import getQuickAccessServiceOverride from '@codingame/monaco-vscode-quickaccess-service-override'
import { BrowserStorageService } from '@codingame/monaco-vscode-storage-service-override'
import getWorkbenchServiceOverride from '@codingame/monaco-vscode-workbench-service-override/session'
import './features/customView.workbench'
import {
  alternateDomainPattern,
  commonServices,
  constructOptions,
  disableShadowDom,
  envOptions,
  remoteAuthority,
  userDataProvider
} from './setup.common.session'

let container = window.vscodeContainer

if (container == null) {
  container = document.createElement('div')
  container.style.height = '100vh'

  document.body.replaceChildren(container)

  if (!disableShadowDom) {
    const shadowRoot = container.attachShadow({
      mode: 'open'
    })

    const workbenchElement = document.createElement('div')
    workbenchElement.style.height = '100vh'
    shadowRoot.appendChild(workbenchElement)
    container = workbenchElement
  }
}

const buttons = document.createElement('div')
buttons.innerHTML = `
<button id="toggleHTMLFileSystemProvider">Toggle HTML filesystem provider</button>
<button id="toggleShadowDom">Toggle Shadow Dom usage</button>
<button id="clearStorage">Clear user data</button>
<button id="resetLayout">Reset layout</button>
<button id="toggleFullWorkbench">Switch to full workbench mode</button>
<br />
<button id="toggleSandbox">Switch to sandbox rendering mode</button>
`
document.body.append(buttons)

// Override services
await initializeMonacoService(
  {
    ...commonServices,
    ...getWorkbenchServiceOverride(undefined, alternateDomainPattern),
    ...getQuickAccessServiceOverride({
      isKeybindingConfigurationVisible: () => true,
      shouldUseGlobalPicker: () => true
    })
  },
  container,
  constructOptions,
  envOptions
)

document.querySelector('#toggleSandbox')!.addEventListener('click', async () => {
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.append('sandbox', '')
  window.location.href = url.toString()
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
