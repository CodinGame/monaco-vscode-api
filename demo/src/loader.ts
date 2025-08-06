const searchParams = new URLSearchParams(window.location.search)
const locale = searchParams.get('locale')

const localeLoader: Partial<Record<string, () => Promise<void>>> = {
  cs: async () => {
    await import('@codingame/monaco-vscode-language-pack-cs')
  },
  de: async () => {
    await import('@codingame/monaco-vscode-language-pack-de')
  },
  es: async () => {
    await import('@codingame/monaco-vscode-language-pack-es')
  },
  fr: async () => {
    await import('@codingame/monaco-vscode-language-pack-fr')
  },
  it: async () => {
    await import('@codingame/monaco-vscode-language-pack-it')
  },
  ja: async () => {
    await import('@codingame/monaco-vscode-language-pack-ja')
  },
  ko: async () => {
    await import('@codingame/monaco-vscode-language-pack-ko')
  },
  pl: async () => {
    await import('@codingame/monaco-vscode-language-pack-pl')
  },
  'pt-br': async () => {
    await import('@codingame/monaco-vscode-language-pack-pt-br')
  },
  'qps-ploc': async () => {
    await import('@codingame/monaco-vscode-language-pack-qps-ploc')
  },
  ru: async () => {
    await import('@codingame/monaco-vscode-language-pack-ru')
  },
  tr: async () => {
    await import('@codingame/monaco-vscode-language-pack-tr')
  },
  'zh-hans': async () => {
    await import('@codingame/monaco-vscode-language-pack-zh-hans')
  },
  'zh-hant': async () => {
    await import('@codingame/monaco-vscode-language-pack-zh-hant')
  }
}

if (locale != null) {
  const loader = localeLoader[locale]
  if (loader != null) {
    await loader()
  } else {
    console.error(`Unknown locale ${locale}`)
  }
}

const mode = searchParams.get('mode')
const sandboxed = searchParams.has('sandboxed')

;(async () => {
  if (sandboxed) {
    window.vscodeContainer = await new Promise<HTMLElement>((resolve) => {
      window.start = resolve
      window.parent.postMessage('WAITING')
    })
    window.vscodeWindow = window.vscodeContainer.ownerDocument.defaultView!
  }
  if (mode === 'full-workbench') {
    await import('./main.workbench')
  } else {
    await import('./main.views')
  }
})()

declare global {
  var vscodeContainer: HTMLElement
  var start: (container: HTMLElement) => void
}

export {}
