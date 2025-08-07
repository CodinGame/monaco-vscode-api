const searchParams = new URLSearchParams(window.location.search)

const sandbox = searchParams.has('sandbox')
if (sandbox) {
  ;(async () => {
    await import('./sandbox')
  })()
} else {
  ;(async () => {
    await import('./loader')
  })()
}
