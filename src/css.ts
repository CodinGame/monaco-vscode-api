import { mainWindow } from 'vs/base/browser/window'

const sheets: CSSStyleSheet[] = []

export function registerCss(module: { default?: string | CSSStyleSheet } | undefined) {
  const exportedValue = module?.default

  let sheet = undefined
  if (typeof exportedValue === 'string') {
    sheet = new mainWindow.CSSStyleSheet()
    sheet.replaceSync(exportedValue)
  } else if (exportedValue instanceof CSSStyleSheet) {
    // Duplicate the CSSStyleSheet for the mainWindow
    // CSSStyleSheet can't be shared between different windows
    // (mainWindow is different from window when using the sandbox mode)
    sheet = new mainWindow.CSSStyleSheet()
    sheet.replaceSync(
      Array.from(exportedValue.cssRules)
        .map((r) => r.cssText)
        .join('\n')
    )
  }
  if (sheet != null) {
    // Font face rules should be added in the root of the page, they are ignored in shadow roots
    const fontFaces = Array.from(sheet.cssRules)
      .filter((rule) => rule instanceof mainWindow.CSSFontFaceRule)
      .map((r) => r.cssText)

    if (fontFaces.length > 0) {
      const fontFaceStyleSheet = new mainWindow.CSSStyleSheet()
      for (const fontFace of fontFaces) {
        fontFaceStyleSheet.insertRule(fontFace)
      }
      mainWindow.document.adoptedStyleSheets = [
        ...mainWindow.document.adoptedStyleSheets,
        fontFaceStyleSheet
      ]
    }
    sheets.push(sheet)
  }
}
function getInjectElement(target: HTMLElement) {
  const root = target.getRootNode()
  if (root instanceof mainWindow.ShadowRoot) {
    return root
  }

  return target.ownerDocument
}
export function injectCss(target: HTMLElement) {
  const root = getInjectElement(target)
  if (root instanceof mainWindow.ShadowRoot && sheets.length === 0) {
    console.error(
      "@codingame/monaco-vscode-api was loaded inside a shadow dom, but it's unable to load the css into it because the bundler configuration wasn't applied properly: imported css files should export their content as default"
    )
  }

  root.adoptedStyleSheets = [...root.adoptedStyleSheets, ...sheets]
}
