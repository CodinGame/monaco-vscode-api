const url = new URL(document.location.href)
export const params = url.searchParams
export const remoteAuthority = params.get('remoteAuthority') ?? undefined
export const connectionToken = params.get('connectionToken') ?? undefined
export const disableShadowDom = params.has('disableShadowDom')

window.history.replaceState({}, document.title, url.href)
