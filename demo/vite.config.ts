import { defineConfig } from 'vite'
import * as fs from 'fs'

const cdnDomain = 'http://127.0.0.2:5173'

export default defineConfig({
  build: {
    target: 'esnext'
  },
  plugins: [
    {
      // For the *-language-features extensions which use SharedArrayBuffer
      name: 'configure-response-headers',
      apply: 'serve',
      configureServer: server => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
          next()
        })
      }
    },
    {
      // prevent vite from trying to inject code into an extension file du to an `import()` in that file
      name: 'hack-prevent-transform-javascript',
      apply: 'serve',
      load (source) {
        if (source.includes('tsserver.web.js')) {
          return `eval(${JSON.stringify(fs.readFileSync(source).toString('utf-8'))})`
        }
      }
    }
  ],
  optimizeDeps: {
    // This is require because vscode is a local dependency
    // and vite doesn't want to optimize it and the number of modules makes chrome hang
    include: [
      'vscode', 'vscode/extensions', 'vscode/services', 'vscode/monaco', 'vscode/service-override/model', 'vscode/service-override/editor',
      'vscode/service-override/extensions', 'vscode/service-override/notifications', 'vscode/service-override/bulkEdit', 'vscode/service-override/dialogs', 'vscode/service-override/configuration',
      'vscode/service-override/keybindings', 'vscode/service-override/textmate', 'vscode/service-override/theme', 'vscode/service-override/languages',
      'vscode/service-override/audioCue', 'vscode/service-override/views', 'vscode/service-override/quickaccess', 'vscode/service-override/debug',
      'vscode/service-override/preferences', 'vscode/service-override/snippets', 'vscode/service-override/files', 'vscode/service-override/output',
      'vscode/service-override/terminal', 'vscode/service-override/search', 'vscode/service-override/markers', 'vscode/service-override/accessibility',
      'vscode/default-extensions/theme-defaults', 'vscode/default-extensions/javascript', 'vscode/default-extensions/json', 'vscode/default-extensions/theme-seti',
      'vscode/default-extensions/references-view', 'vscode/default-extensions/typescript-basics', 'vscode/default-extensions/search-result',
      'vscode/default-extensions/typescript-language-features', 'vscode/default-extensions/markdown-language-features',
      'vscode/default-extensions/json-language-features', 'vscode/default-extensions/css-language-features',
      'vscode/default-extensions/npm', 'vscode/default-extensions/css', 'vscode/default-extensions/markdown-basics', 'vscode/default-extensions/html',
      'vscode/default-extensions/html-language-features', 'vscode/default-extensions/configuration-editing', 'vscode/default-extensions/media-preview', 'vscode/default-extensions/markdown-math',
      'vscode/workers/extensionHost.worker'
    ],
    esbuildOptions: {
      plugins: [{
        name: 'import.meta.url',
        setup ({ onLoad }) {
          // Help vite that bundles/move files in dev mode without touching `import.meta.url` which breaks asset urls
          onLoad({ filter: /.*\.js/, namespace: 'file' }, args => {
            let code = fs.readFileSync(args.path, 'utf8')
            code = code.replace(
              /\bimport\.meta\.url\b/g,
              `new URL('${cdnDomain}/@fs${args.path}', window.location.origin)`
            )
            return { contents: code }
          })
        }
      }]
    }
  },
  server: {
    port: 5173,
    origin: cdnDomain,
    host: '0.0.0.0',
    fs: {
      allow: ['../'] // allow to load codicon.ttf from monaco-editor in the parent folder
    }
  },
  resolve: {
    dedupe: ['monaco-editor']
  }
})
