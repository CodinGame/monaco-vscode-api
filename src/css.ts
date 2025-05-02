const sheets: CSSStyleSheet[] = []

export function registerCss(module: unknown) {
  const exportedValue = (module as { default?: string | CSSStyleSheet }).default

  let sheet = undefined
  if (typeof exportedValue === 'string') {
    sheet = new CSSStyleSheet()
    sheet.replaceSync(exportedValue)
  } else if (exportedValue instanceof CSSStyleSheet) {
    sheet = exportedValue
  }
  if (sheet != null) {
    // Font face rules should be added in the root of the page, they are ignored in shadow roots
    const fontFaces = Array.from(sheet.cssRules)
      .filter((rule) => rule instanceof CSSFontFaceRule)
      .map((r) => r.cssText)

    if (fontFaces.length > 0) {
      const fontFaceStyleSheet = new CSSStyleSheet()
      for (const fontFace of fontFaces) {
        fontFaceStyleSheet.insertRule(fontFace)
      }
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, fontFaceStyleSheet]
    }
    sheets.push(sheet)
  }
}
function getInjectElement(target: HTMLElement) {
  const root = target.getRootNode()
  if (root instanceof ShadowRoot) {
    return root
  }
  return document
}
export function injectCss(target: HTMLElement) {
  const root = getInjectElement(target)
  if (root instanceof ShadowRoot && sheets.length === 0) {
    console.error(
      "@codingame/monaco-vscode-api was loaded inside a shadow dom, but it's unable to load the css into it because the bundler configuration wasn't applied properly: imported css files should export their content as default"
    )
  }

  root.adoptedStyleSheets = [...root.adoptedStyleSheets, ...sheets]
}
