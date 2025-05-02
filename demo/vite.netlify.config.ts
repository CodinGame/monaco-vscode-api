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
  plugins: [
    {
      name: 'load-vscode-css-as-string',
      enforce: 'pre',
      async resolveId(source, importer, options) {
        const resolved = (await this.resolve(source, importer, options))!
        if (
          resolved.id.match(
            /node_modules\/(@codingame\/monaco-vscode|vscode|monaco-editor).*\.css$/
          )
        ) {
          return {
            ...resolved,
            id: resolved.id + '?inline'
          }
        }
        return undefined
      }
    }
  ],
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
