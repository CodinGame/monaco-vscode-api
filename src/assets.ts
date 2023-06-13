let assetUrls: Record<string, string> = {}
export function registerAssets (assets: Record<string, string>): void {
  assetUrls = {
    ...assetUrls,
    ...assets
  }
}

function toUrl (name: string): string | undefined {
  const url = assetUrls[name] ?? assetUrls[name.replace(/[/.]/g, '_')]
  return new URL(url!, window.location.href).toString()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).monacoRequire = {
  toUrl
}
