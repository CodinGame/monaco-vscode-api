
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

const customRequire = {
  toUrl
}

export default customRequire
