const styles: string[] = []

export function registerCss(module: unknown) {
  const cssContent = (module as { default?: string }).default
  if (typeof cssContent === 'string') {
    // Font faces should always be added outside of the shadow dom
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(cssContent)
    const fontFaces = Array.from(sheet.cssRules)
      .filter((rule) => rule instanceof CSSFontFaceRule)
      .map((r) => r.cssText)
    if (fontFaces.length > 0) {
      const fontFaceStyle = document.createElement('style')
      fontFaceStyle.setAttribute('type', 'text/css')
      fontFaceStyle.appendChild(document.createTextNode(fontFaces.join('\n')))
      document.head.insertBefore(fontFaceStyle, document.head.firstChild)
    }

    styles.push(cssContent)
  }
}

function getInjectElement(target: HTMLElement) {
  const root = target.getRootNode()
  if (root instanceof ShadowRoot) {
    return root
  }
  return document.head
}

export function injectCss(target: HTMLElement) {
  const root = getInjectElement(target)

  if (root instanceof ShadowRoot && styles.length === 0) {
    console.error(
      "@codingame/monaco-vscode-api was loaded inside a shadow dom, but it's unable to load the css into it because the bundler configuration wasn't applied properly: imported css files should export their content as default"
    )
  }

  for (const style of styles) {
    const styleEl = document.createElement('style')
    styleEl.appendChild(document.createTextNode(style))
    root.appendChild(styleEl)
  }
}
