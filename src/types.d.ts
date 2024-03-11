declare const VSCODE_VERSION: string
declare const VSCODE_REF: string

declare module 'vs/platform/accessibilitySignal/browser/media/*.mp3' {
  const assets: Record<string, string>
  export default assets
}

declare module 'vs/workbench/contrib/debug/browser/media/*.png' {
  const assets: Record<string, string>
  export default assets
}

declare module 'vs/workbench/browser/parts/editor/media/*.png' {
  const assets: Record<string, string>
  export default assets
}

declare module 'vs/workbench/contrib/welcomeGettingStarted/common/media/*.svg' {
  const assets: Record<string, string>
  export default assets
}

declare module 'vs/workbench/contrib/welcomeGettingStarted/common/media/*.png' {
  const assets: Record<string, string>
  export default assets
}
