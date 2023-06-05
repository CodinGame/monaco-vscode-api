import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'esnext'
  },
  worker: {
    format: 'es'
  },
  // This is require because vscode is a local dependency
  // and vite doesn't want to optimize it and the number of modules makes chrome hang
  optimizeDeps: {
    include: [
      'vscode', 'vscode/extensions', 'vscode/services', 'vscode/monaco', 'vscode/service-override/model', 'vscode/service-override/editor',
      'vscode/service-override/notifications', 'vscode/service-override/dialogs', 'vscode/service-override/configuration',
      'vscode/service-override/keybindings', 'vscode/service-override/textmate', 'vscode/service-override/theme', 'vscode/service-override/languages',
      'vscode/service-override/audioCue', 'vscode/service-override/views', 'vscode/service-override/quickaccess', 'vscode/service-override/debug',
      'vscode/service-override/preferences', 'vscode/service-override/snippets', 'vscode/service-override/files', 'vscode/service-override/output',
      'vscode/default-extensions/theme-defaults', 'vscode/default-extensions/javascript', 'vscode/default-extensions/json', 'vscode/default-extensions/theme-seti',
      'vscode/default-extensions/references-view', 'vscode/default-extensions/typescript-basics'
    ]
  },
  server: {
    port: 5173,
    fs: {
      allow: ['../'] // allow to load codicon.ttf from monaco-editor in the parent folder
    }
  },
  resolve: {
    dedupe: ['monaco-editor']
  },
  assetsInclude: ['**/*.wasm']
})
