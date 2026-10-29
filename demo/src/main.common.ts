import './style.css'

document.querySelector('#toggleFullWorkbench')!.addEventListener('click', async () => {
  const url = new URL(window.location.href)
  if (url.searchParams.get('mode') === 'full-workbench') {
    url.searchParams.delete('mode')
  } else {
    url.searchParams.set('mode', 'full-workbench')
  }
  window.location.href = url.toString()
})

document.querySelector('#resetLayout')!.addEventListener('click', async () => {
  const url = new URL(window.location.href)
  url.searchParams.set('resetLayout', 'true')
  window.location.href = url.toString()
})

document.querySelector('#toggleHTMLFileSystemProvider')!.addEventListener('click', async () => {
  const url = new URL(window.location.href)
  if (url.searchParams.has('htmlFileSystemProvider')) {
    url.searchParams.delete('htmlFileSystemProvider')
  } else {
    url.searchParams.set('htmlFileSystemProvider', 'true')
  }
  window.location.href = url.toString()
})
