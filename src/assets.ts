import { FileAccess } from 'vs/base/common/network'

export function registerAssets(assets: Record<string, string | (() => string)>): void {
  for (const [moduleId, url] of Object.entries(assets)) {
    FileAccess.registerAppResourcePathUrl(moduleId, url)
  }
}
