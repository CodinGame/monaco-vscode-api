import { isInitialized } from 'vs/nls'

const extensionTranslationsUri: Record<string, Record<string, string>> = {}
let currentLocaleExtensionId: string | undefined
let availableLocales: Set<string> = new Set()

function setAvailableLocales (locales: Set<string>): void {
  availableLocales = locales
}

function isLocaleAvailable (locale: string): boolean {
  return availableLocales.has(locale)
}

declare global {
  /**
   * All NLS messages produced by `localize` and `localize2` calls
   * under `src/vs` translated to the language as indicated by
   * `_VSCODE_NLS_LANGUAGE`.
   */
  // eslint-disable-next-line no-var
  var _VSCODE_NLS_MESSAGES: string[]
  /**
   * The actual language of the NLS messages (e.g. 'en', de' or 'pt-br').
   */
  // eslint-disable-next-line no-var
  var _VSCODE_NLS_LANGUAGE: string | undefined
}

function registerLocalization (extensionId: string, language: string, main: string[], extensionTranslationsUris: Record<string, string>): void {
  if (isInitialized()) {
    console.error('Some parts of VSCode are already initialized, make sure the language pack is loaded before anything else or some translations will be missing')
  }
  globalThis._VSCODE_NLS_MESSAGES = main
  globalThis._VSCODE_NLS_LANGUAGE = language

  extensionTranslationsUri[language] = extensionTranslationsUris
  currentLocaleExtensionId = extensionId
}

function getBuiltInExtensionTranslationsUris (language: string): Record<string, string> | undefined {
  return extensionTranslationsUri[language]
}

function getExtensionIdProvidingCurrentLocale (): string | undefined {
  return currentLocaleExtensionId
}

export {
  registerLocalization,
  getBuiltInExtensionTranslationsUris,
  getExtensionIdProvidingCurrentLocale,
  setAvailableLocales,
  isLocaleAvailable
}
