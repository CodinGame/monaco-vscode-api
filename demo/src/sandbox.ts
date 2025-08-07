import './style.css'

const searchParams = new URLSearchParams()
searchParams.set('mode', 'full-workbench')
searchParams.set('sandboxed', '')

const container = document.createElement('div')
container.style.height = '100vh'
container.style.display = 'flex'
container.style.flexDirection = 'column'

document.body.appendChild(container)

function load(): Disposable {
  const wrapper = document.createElement('div')
  wrapper.style.flex = '1'
  wrapper.style.display = 'flex'
  container.append(wrapper)
  const shadowRoot = wrapper.attachShadow({
    mode: 'open'
  })

  const workbenchElement = document.createElement('div')
  workbenchElement.style.position = 'relative'
  workbenchElement.style.flex = '1'
  workbenchElement.style.maxWidth = '100%'
  shadowRoot.appendChild(workbenchElement)

  const loader = document.createElement('div')
  loader.style.position = 'absolute'
  loader.style.left = '0'
  loader.style.right = '0'
  loader.style.bottom = '0'
  loader.style.top = '0'
  loader.style.display = 'flex'
  loader.style.alignItems = 'center'
  loader.style.justifyContent = 'center'
  loader.style.border = '1px solid red'
  loader.textContent = 'Loading...'
  workbenchElement.appendChild(loader)

  const iframe = document.createElement('iframe')
  iframe.src = window.location.origin + '?' + searchParams?.toString()
  iframe.loading = 'eager'
  iframe.style.display = 'none'
  document.body.appendChild(iframe)

  window.addEventListener('message', (event) => {
    if (event.data === 'WAITING' && event.source === iframe.contentWindow) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(iframe.contentWindow as any)?.start(workbenchElement)
    }
  })

  return {
    [Symbol.dispose]() {
      iframe.remove()
      wrapper.remove()
      document.querySelectorAll('[data-vscode]').forEach((el) => el.remove())
    }
  }
}

let disposable = load()

function reload() {
  console.log('reloading...')
  disposable[Symbol.dispose]()
  disposable = load()
}

const buttons = document.createElement('div')

const serverUrlInput = document.createElement('input')
serverUrlInput.style.width = '350px'
serverUrlInput.type = 'text'
serverUrlInput.placeholder = 'remoteAuthority/remotePath?'
serverUrlInput.addEventListener('change', () => {
  searchParams.delete('remotePath')
  searchParams.delete('remoteAuthority')
  if (serverUrlInput.value.trim().length > 0) {
    const url = new URL('ws://' + serverUrlInput.value)
    searchParams.append('remoteAuthority', url.host)
    if (url.pathname.length > 0) {
      searchParams.append('remotePath', url.pathname)
    }
  }
  reload()
})
buttons.appendChild(serverUrlInput)

const reinitializeButton = document.createElement('button')
reinitializeButton.textContent = 'Reinitialize the workbench'
reinitializeButton.addEventListener('click', reload)
buttons.appendChild(reinitializeButton)

container.prepend(buttons)

const header = document.createElement('h1')
header.textContent = 'Sandbox mode: reinitialize the workbench without reloading the page'
container.prepend(header)
