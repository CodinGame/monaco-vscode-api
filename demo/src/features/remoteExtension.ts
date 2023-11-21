import { registerRemoteExtension } from 'vscode/extensions'

declare global {
  interface Window {
    rootDirectory?: string
  }
}

if (window.rootDirectory != null) {
  void registerRemoteExtension(`${window.rootDirectory}/src/features/remoteExtensionExample/`)
}
