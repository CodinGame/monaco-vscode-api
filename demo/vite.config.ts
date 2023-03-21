import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    origin: 'http://localhost:5173',
    fs: {
      allow: ['../'] // allow to load codicon.ttf from monaco-editor in the parent folder
    }
  },
  assetsInclude: ['**/*.wasm']
})
