let assetUrls: Record<string, string | (() => string)> = {}
export function registerAssets (assets: Record<string, string | (() => string)>): void {
  assetUrls = {
    ...assetUrls,
    ...assets
  }
}

function toUrl (name: string): string | undefined {
  let url = assetUrls[name]
  if (typeof url === 'function') {
    url = url()
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return new URL(url ?? '', globalThis.location?.href ?? import.meta.url).toString()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).monacoRequire = {
  toUrl
}
