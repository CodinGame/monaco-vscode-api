import './style.css'
import * as monaco from 'monaco-editor'
import { registerFileSystemOverlay, HTMLFileSystemProvider } from '@codingame/monaco-vscode-files-service-override'
import { ILogService, StandaloneServices } from 'vscode/services'
import './setup.common'
import './features/output'
import './features/debugger'
import './features/search'
import './features/intellisense'
import './features/notifications'
import './features/terminal'
import './features/scm'
import './features/testing'
import './features/ai'
import '@codingame/monaco-vscode-clojure-default-extension'
import '@codingame/monaco-vscode-coffeescript-default-extension'
import '@codingame/monaco-vscode-cpp-default-extension'
import '@codingame/monaco-vscode-csharp-default-extension'
import '@codingame/monaco-vscode-css-default-extension'
import '@codingame/monaco-vscode-diff-default-extension'
import '@codingame/monaco-vscode-fsharp-default-extension'
import '@codingame/monaco-vscode-go-default-extension'
import '@codingame/monaco-vscode-groovy-default-extension'
import '@codingame/monaco-vscode-html-default-extension'
import '@codingame/monaco-vscode-java-default-extension'
import '@codingame/monaco-vscode-javascript-default-extension'
import '@codingame/monaco-vscode-json-default-extension'
import '@codingame/monaco-vscode-julia-default-extension'
import '@codingame/monaco-vscode-lua-default-extension'
import '@codingame/monaco-vscode-markdown-basics-default-extension'
import '@codingame/monaco-vscode-objective-c-default-extension'
import '@codingame/monaco-vscode-perl-default-extension'
import '@codingame/monaco-vscode-php-default-extension'
import '@codingame/monaco-vscode-powershell-default-extension'
import '@codingame/monaco-vscode-python-default-extension'
import '@codingame/monaco-vscode-r-default-extension'
import '@codingame/monaco-vscode-ruby-default-extension'
import '@codingame/monaco-vscode-rust-default-extension'
import '@codingame/monaco-vscode-scss-default-extension'
import '@codingame/monaco-vscode-shellscript-default-extension'
import '@codingame/monaco-vscode-sql-default-extension'
import '@codingame/monaco-vscode-swift-default-extension'
import '@codingame/monaco-vscode-typescript-basics-default-extension'
import '@codingame/monaco-vscode-vb-default-extension'
import '@codingame/monaco-vscode-xml-default-extension'
import '@codingame/monaco-vscode-yaml-default-extension'
import '@codingame/monaco-vscode-theme-defaults-default-extension'
import '@codingame/monaco-vscode-theme-seti-default-extension'
import '@codingame/monaco-vscode-references-view-default-extension'
import '@codingame/monaco-vscode-search-result-default-extension'
import '@codingame/monaco-vscode-configuration-editing-default-extension'
import '@codingame/monaco-vscode-markdown-math-default-extension'
import '@codingame/monaco-vscode-npm-default-extension'
import '@codingame/monaco-vscode-media-preview-default-extension'
import '@codingame/monaco-vscode-ipynb-default-extension'
import { ExtensionHostKind, registerExtension } from 'vscode/extensions'

const { getApi } = registerExtension({
  name: 'demo-main',
  publisher: 'codingame',
  version: '1.0.0',
  engines: {
    vscode: '*'
  }
}, ExtensionHostKind.LocalProcess)

void getApi().then(async vscode => {
  const mainModelUri = vscode.Uri.file('/tmp/test.js')
  await Promise.all([
    vscode.workspace.openTextDocument(mainModelUri),
    vscode.workspace.openTextDocument(monaco.Uri.file('/tmp/test_readonly.js')) // open the file so vscode sees it's locked
  ])

  const diagnostics = vscode.languages.createDiagnosticCollection('demo')
  diagnostics.set(mainModelUri, [{
    range: new vscode.Range(2, 9, 2, 12),
    severity: vscode.DiagnosticSeverity.Error,
    message: 'This is not a real error, just a demo, don\'t worry',
    source: 'Demo',
    code: 42
  }])

  const locale = new URLSearchParams(window.location.search).get('locale') ?? ''
  const select: HTMLSelectElement = document.querySelector('#localeSelect')!
  select.value = locale
  select.addEventListener('change', () => {
    const url = new URL(window.location.href)
    if (select.value !== '') {
      url.searchParams.set('locale', select.value)
    } else {
      url.searchParams.delete('locale')
    }
    window.location.href = url.toString()
  })

  document.querySelector('#toggleFullWorkbench')!.addEventListener('click', async () => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('mode') === 'full-workbench') {
      url.searchParams.delete('mode')
    } else {
      url.searchParams.set('mode', 'full-workbench')
    }
    window.location.href = url.toString()
  })

  document.querySelector('#resetLayout')!.addEventListener('click', async () => {
    const url = new URL(window.location.href)
    url.searchParams.set('resetLayout', 'true')
    window.location.href = url.toString()
  })

  document.querySelector('#filesystem')!.addEventListener('click', async () => {
    const dirHandle = await window.showDirectoryPicker()

    const htmlFileSystemProvider = new HTMLFileSystemProvider(undefined, 'unused', StandaloneServices.get(ILogService))
    await htmlFileSystemProvider.registerDirectoryHandle(dirHandle)
    registerFileSystemOverlay(1, htmlFileSystemProvider)

    vscode.workspace.updateWorkspaceFolders(0, 0, {
      uri: vscode.Uri.file(dirHandle.name)
    })
  })
})
