import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'esnext'
  },
  worker: {
    format: 'es'
  },
  base: 'https://codingame.github.io/monaco-vscode-api',
  resolve: {
    dedupe: ['monaco-editor']
  }
})
