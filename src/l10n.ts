import { setLocale, isInitialized } from 'vs/nls'

const extensionTranslationsUri: Record<string, Record<string, string>> = {}
let currentLocaleExtensionId: string | undefined

function registerLocalization (extensionId: string, language: string, main: Record<string, Record<string, string>>, extensionTranslationsUris: Record<string, string>): void {
  if (isInitialized()) {
    console.error('Some parts of VSCode are already initialized, make sure the language pack is loaded before anything else or some translations will be missing')
  }
  setLocale(language, main)

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
  getExtensionIdProvidingCurrentLocale
}
