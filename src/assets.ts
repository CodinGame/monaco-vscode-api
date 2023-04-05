
let assetUrls: Record<string, string> = {}
export function registerAssets (assets: Record<string, string>): void {
  assetUrls = {
    ...assetUrls,
    ...assets
  }
}

function toUrl (name: string): string | undefined {
  return assetUrls[name] ?? assetUrls[name.replace(/[/.]/g, '_')]
}

const customRequire = {
  toUrl
}

export default customRequire
