import { clearStorage } from './setup.workbench.session'
import './main.common'

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
