import { IEditorService, StandaloneServices, createInstance } from '@codingame/monaco-vscode-api'
import { clearStorage, remoteAuthority } from './setup.workbench'
import { CustomEditorInput } from './features/customView.workbench'
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

document.querySelector('#toggleShadowDom')!.addEventListener('click', async () => {
  const url = new URL(window.location.href)
  if (url.searchParams.has('disableShadowDom')) {
    url.searchParams.delete('disableShadowDom')
  } else {
    url.searchParams.set('disableShadowDom', 'true')
  }
  window.location.href = url.toString()
})
