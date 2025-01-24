import { registerRemoteExtension } from '@codingame/monaco-vscode-api/extensions'

declare global {
  interface Window {
    rootDirectory?: string
  }
}

if (window.rootDirectory != null) {
  void registerRemoteExtension(`${window.rootDirectory}/src/features/remoteExtensionExample/`)
}
