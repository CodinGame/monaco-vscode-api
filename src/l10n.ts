import { isInitialized } from 'vs/nls'
import type { IExtensionManifest } from './extensions'

const extensionTranslationsUri: Record<string, Record<string, string>> = {}
let currentLocaleExtensionId: string | undefined
let availableLocales: Set<string> = new Set()

function setAvailableLocales(locales: Set<string>): void {
  availableLocales = locales
}

function isLocaleAvailable(locale: string): boolean {
  return availableLocales.has(locale)
}

declare global {
  /**
   * All NLS messages produced by `localize` and `localize2` calls
   * under `src/vs` translated to the language as indicated by
   * `_VSCODE_NLS_LANGUAGE`.
   */
  var _VSCODE_NLS_MESSAGES: string[]
  /**
   * The actual language of the NLS messages (e.g. 'en', de' or 'pt-br').
   */
  var _VSCODE_NLS_LANGUAGE: string | undefined
}

let localizationManifest: IExtensionManifest | undefined
function registerLocalization(
  manifest: IExtensionManifest,
  language: string,
  main: string[],
  extensionTranslationsUris: Record<string, string>
): void {
  if (isInitialized()) {
    console.error(
      'Some parts of VSCode are already initialized, make sure the language pack is loaded before anything else or some translations will be missing'
    )
  }
  globalThis._VSCODE_NLS_MESSAGES = main
  globalThis._VSCODE_NLS_LANGUAGE = language

  extensionTranslationsUri[language] = extensionTranslationsUris
  currentLocaleExtensionId = `${manifest.publisher}.${manifest.name}`

  localizationManifest = manifest
}

function getBuiltInExtensionTranslationsUris(language: string): Record<string, string> | undefined {
  return extensionTranslationsUri[language]
}

function getExtensionIdProvidingCurrentLocale(): string | undefined {
  return currentLocaleExtensionId
}

function getLocalizationManifest(): IExtensionManifest | undefined {
  return localizationManifest
}

export {
  registerLocalization,
  getBuiltInExtensionTranslationsUris,
  getExtensionIdProvidingCurrentLocale,
  getLocalizationManifest,
  setAvailableLocales,
  isLocaleAvailable
}
