import { defineConfig } from 'vite'

export default defineConfig({
  base: 'https://codingame.github.io/monaco-vscode-api',
  assetsInclude: ['**/*.wasm']
})
