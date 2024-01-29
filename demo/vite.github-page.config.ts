import { defineConfig } from 'vite'
import pkg from './package.json' assert { type: 'json' }

const localDependencies = Object.entries(pkg.dependencies).filter(([, version]) => version.startsWith('file:../')).map(([name]) => name)

export default defineConfig({
  build: {
    target: 'esnext'
  },
  worker: {
    format: 'es'
  },
  base: 'https://codingame.github.io/monaco-vscode-api',
  resolve: {
    dedupe: ['vscode', ...localDependencies]
  }
})
