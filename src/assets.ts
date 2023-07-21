let assetUrls: Record<string, string | (() => string)> = {}
export function registerAssets (assets: Record<string, string | (() => string)>): void {
  assetUrls = {
    ...assetUrls,
    ...assets
  }
}

function toUrl (name: string): string | undefined {
  let url = assetUrls[name] ?? assetUrls[name.replace(/[/.]/g, '_')]
  if (typeof url === 'function') {
    url = url()
  }
  return new URL(url!, window.location.href).toString()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).monacoRequire = {
  toUrl
}
