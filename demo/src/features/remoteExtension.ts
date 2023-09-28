import { ExtensionHostKind, registerExtension } from 'vscode/extensions'
import manifest from './remoteExtensionExample/package.json'

declare global {
  interface Window {
    rootDirectory?: string
  }
}

if (window.rootDirectory != null) {
  registerExtension(manifest, ExtensionHostKind.Remote, {
    path: `${window.rootDirectory}/src/features/remoteExtensionExample/`
  })
}
