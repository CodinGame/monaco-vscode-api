import { defineConfig } from 'vite'
import * as fs from 'fs'
import url from 'url'

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
    }
  ],
  optimizeDeps: {
    // This is require because vscode is a local dependency
    // and vite doesn't want to optimize it and the number of modules makes chrome hang
    include: [
      'vscode', 'vscode/extensions', 'vscode/services', 'vscode/monaco', '@codingame/monaco-vscode-model-service-override', '@codingame/monaco-vscode-editor-service-override',
      '@codingame/monaco-vscode-extensions-service-override', '@codingame/monaco-vscode-notifications-service-override', '@codingame/monaco-vscode-bulk-edit-service-override', '@codingame/monaco-vscode-dialogs-service-override', '@codingame/monaco-vscode-configuration-service-override',
      '@codingame/monaco-vscode-keybindings-service-override', '@codingame/monaco-vscode-textmate-service-override', '@codingame/monaco-vscode-theme-service-override', '@codingame/monaco-vscode-languages-service-override',
      '@codingame/monaco-vscode-audio-cue-service-override', '@codingame/monaco-vscode-views-service-override', '@codingame/monaco-vscode-quickaccess-service-override', '@codingame/monaco-vscode-debug-service-override',
      '@codingame/monaco-vscode-preferences-service-override', '@codingame/monaco-vscode-snippets-service-override', '@codingame/monaco-vscode-files-service-override', '@codingame/monaco-vscode-output-service-override',
      '@codingame/monaco-vscode-terminal-service-override', '@codingame/monaco-vscode-search-service-override', '@codingame/monaco-vscode-markers-service-override', '@codingame/monaco-vscode-accessibility-service-override', '@codingame/monaco-vscode-storage-service-override',
      '@codingame/monaco-vscode-language-detection-worker-service-override', '@codingame/monaco-vscode-remote-agent-service-override', '@codingame/monaco-vscode-environment-service-override', '@codingame/monaco-vscode-lifecycle-service-override',
      '@codingame/monaco-vscode-clojure-default-extension', '@codingame/monaco-vscode-coffeescript-default-extension', '@codingame/monaco-vscode-cpp-default-extension',
      '@codingame/monaco-vscode-csharp-default-extension', '@codingame/monaco-vscode-css-default-extension', '@codingame/monaco-vscode-diff-default-extension', '@codingame/monaco-vscode-fsharp-default-extension', '@codingame/monaco-vscode-go-default-extension',
      '@codingame/monaco-vscode-groovy-default-extension', '@codingame/monaco-vscode-html-default-extension', '@codingame/monaco-vscode-java-default-extension', '@codingame/monaco-vscode-javascript-default-extension',
      '@codingame/monaco-vscode-json-default-extension', '@codingame/monaco-vscode-julia-default-extension', '@codingame/monaco-vscode-lua-default-extension', '@codingame/monaco-vscode-markdown-basics-default-extension',
      '@codingame/monaco-vscode-objective-c-default-extension', '@codingame/monaco-vscode-perl-default-extension', '@codingame/monaco-vscode-php-default-extension', '@codingame/monaco-vscode-powershell-default-extension',
      '@codingame/monaco-vscode-python-default-extension', '@codingame/monaco-vscode-r-default-extension', '@codingame/monaco-vscode-ruby-default-extension', '@codingame/monaco-vscode-rust-default-extension',
      '@codingame/monaco-vscode-scss-default-extension', '@codingame/monaco-vscode-shellscript-default-extension', '@codingame/monaco-vscode-sql-default-extension', '@codingame/monaco-vscode-swift-default-extension',
      '@codingame/monaco-vscode-typescript-basics-default-extension', '@codingame/monaco-vscode-vb-default-extension', '@codingame/monaco-vscode-xml-default-extension', '@codingame/monaco-vscode-yaml-default-extension',
      '@codingame/monaco-vscode-theme-defaults-default-extension', '@codingame/monaco-vscode-theme-seti-default-extension',
      '@codingame/monaco-vscode-references-view-default-extension', '@codingame/monaco-vscode-typescript-basics-default-extension', '@codingame/monaco-vscode-search-result-default-extension',
      '@codingame/monaco-vscode-typescript-language-features-default-extension', '@codingame/monaco-vscode-markdown-language-features-default-extension',
      '@codingame/monaco-vscode-json-language-features-default-extension', '@codingame/monaco-vscode-css-language-features-default-extension',
      '@codingame/monaco-vscode-npm-default-extension', '@codingame/monaco-vscode-css-default-extension', '@codingame/monaco-vscode-markdown-basics-default-extension', '@codingame/monaco-vscode-html-default-extension',
      '@codingame/monaco-vscode-html-language-features-default-extension', '@codingame/monaco-vscode-configuration-editing-default-extension', '@codingame/monaco-vscode-media-preview-default-extension', '@codingame/monaco-vscode-markdown-math-default-extension'
    ],
    esbuildOptions: {
      plugins: [{
        name: 'import.meta.url',
        setup ({ onLoad }) {
          // Help vite that bundles/move files in dev mode without touching `import.meta.url` which breaks asset urls
          onLoad({ filter: /.*\.js/, namespace: 'file' }, async args => {
            const code = fs.readFileSync(args.path, 'utf8')

            const assetImportMetaUrlRE = /\bnew\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*(?:,\s*)?\)/g
            let i = 0
            let newCode = ''
            for (let match = assetImportMetaUrlRE.exec(code); match != null; match = assetImportMetaUrlRE.exec(code)) {
              newCode += code.slice(i, match.index)

              const path = match[1].slice(1, -1)
              const resolved = await import.meta.resolve!(path, url.pathToFileURL(args.path))

              newCode += `new URL(${JSON.stringify(url.fileURLToPath(resolved))}, import.meta.url)`

              i = assetImportMetaUrlRE.lastIndex
            }
            newCode += code.slice(i)

            return { contents: newCode }
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
  define: {
    rootDirectory: JSON.stringify(__dirname)
  },
  resolve: {
    dedupe: ['monaco-editor', 'vscode']
  }
})
