import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    fs: {
      allow: ['../'] // allow to load codicon.tss from monaco-editor in the parent folder
    }
  }
})
