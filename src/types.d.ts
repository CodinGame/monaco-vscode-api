declare const VSCODE_VERSION: string

declare module '*.wasm' {
  const url: string
  export default url
}
