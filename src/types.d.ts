declare const VSCODE_VERSION: string
declare const VSCODE_REF: string

declare module '*.wasm' {
  const url: string
  export default url
}
