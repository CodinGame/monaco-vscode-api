import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'esnext'
  },
  base: 'https://codingame.github.io/monaco-vscode-api',
  assetsInclude: ['**/*.wasm'],
  resolve: {
    dedupe: ['monaco-editor']
  }
})
