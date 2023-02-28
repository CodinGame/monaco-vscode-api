import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /vscode\/service-override\/([0-9a-zA-z\-_]*)/,
        replacement: resolve(__dirname, './dist/$1.js')
      },
      {
        find: /vscode\/([0-9a-zA-z\-_]*)/,
        replacement: resolve(__dirname, './dist/$1.js')
      },
      {
        find: 'vscode',
        replacement: resolve(__dirname, './dist/api.js')
      },
      {
        find: 'webpack-loader',
        replacement: resolve(__dirname, './dist/webpack-loader..js')
      }
    ]
  }
})
