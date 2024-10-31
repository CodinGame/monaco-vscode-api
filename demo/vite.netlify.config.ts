import { defineConfig } from 'vite'
import * as fs from 'fs'
const pkg = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url).pathname).toString()
)

const localDependencies = Object.entries(pkg.dependencies as Record<string, string>)
  .filter(([, version]) => version.startsWith('file:../'))
  .map(([name]) => name)

export default defineConfig({
  build: {
    target: 'esnext',
    assetsInlineLimit: 0
  },
  worker: {
    format: 'es'
  },
  esbuild: {
    minifySyntax: false
  },
  resolve: {
    dedupe: ['vscode', ...localDependencies]
  }
})
