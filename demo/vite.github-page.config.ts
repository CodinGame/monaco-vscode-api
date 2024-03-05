import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import pkg from './package.json' assert { type: 'json' }

const localDependencies = Object.entries(pkg.dependencies).filter(([, version]) => version.startsWith('file:../')).map(([name]) => name)

export default defineConfig({
  build: {
    target: 'esnext'
  },
  worker: {
    format: 'es'
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'coi-serviceworker.js',
          dest: './'
        }
      ]
    })
  ],
  base: 'https://codingame.github.io/monaco-vscode-api',
  resolve: {
    dedupe: ['vscode', ...localDependencies]
  }
})
