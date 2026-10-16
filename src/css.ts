import { mainWindow } from 'vs/base/browser/window'

const sheets: { sheet: CSSStyleSheet; order: number }[] = []

// On Firefox, a constructed sheet stays "still-loading" until its replace() promise settles, and
// reading its cssRules throws an InvalidAccessError. Browser extensions proxying adoptedStyleSheets
// (e.g. Dark Reader) read cssRules from the setter, so sheets are only adopted once all are loaded.
const sheetPromises: Promise<CSSStyleSheet>[] = []
function whenSheetsLoaded(): Promise<unknown> {
  return Promise.allSettled(sheetPromises)
}

export function registerCss(
  module: { default?: string | CSSStyleSheet } | undefined,
  order: number = 0
) {
  const exportedValue = module?.default

  let sheet: CSSStyleSheet | undefined = undefined
  let sheetPromise: Promise<CSSStyleSheet> | undefined = undefined
  if (typeof exportedValue === 'string') {
    sheet = new mainWindow.CSSStyleSheet()
    sheetPromise = sheet.replace(exportedValue)
  } else if (exportedValue instanceof CSSStyleSheet) {
    // Duplicate the CSSStyleSheet for the mainWindow
    // CSSStyleSheet can't be shared between different windows
    // (mainWindow is different from window when using the sandbox mode)
    sheet = new mainWindow.CSSStyleSheet()
    sheetPromise = sheet.replace(
      Array.from(exportedValue.cssRules)
        .map((r) => r.cssText)
        .join('\n')
    )
  }
  if (sheetPromise != null) {
    sheetPromises.push(sheetPromise)
    sheetPromise.then((sheet) => {
      // Font face rules should be added in the root of the page, they are ignored in shadow roots
      const fontFaces = Array.from(sheet.cssRules)
        .filter((rule) => rule instanceof mainWindow.CSSFontFaceRule)
        .map((r) => r.cssText)

      if (fontFaces.length > 0) {
        const fontFaceStyleSheet = new mainWindow.CSSStyleSheet()
        for (const fontFace of fontFaces) {
          fontFaceStyleSheet.insertRule(fontFace)
        }
        void whenSheetsLoaded().then(() => {
          mainWindow.document.adoptedStyleSheets = [
            ...mainWindow.document.adoptedStyleSheets,
            fontFaceStyleSheet
          ]
        })
      }
    })
  }
  if (sheet != null) {
    sheets.push({ sheet, order })
  }
}
function getInjectElement(target: HTMLElement) {
  const root = target.getRootNode()
  if (root instanceof mainWindow.ShadowRoot) {
    return root
  }

  return target.ownerDocument
}
export async function injectCss(target: HTMLElement): Promise<void> {
  const root = getInjectElement(target)
  if (root instanceof mainWindow.ShadowRoot && sheets.length === 0) {
    console.error(
      "@codingame/monaco-vscode-api was loaded inside a shadow dom, but it's unable to load the css into it because the bundler configuration wasn't applied properly: imported css files should export their content as default"
    )
  }

  await whenSheetsLoaded()

  sheets.sort((a, b) => a.order - b.order)

  root.adoptedStyleSheets = [...root.adoptedStyleSheets, ...sheets.map((s) => s.sheet)]
}
