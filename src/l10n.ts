import { setLocale } from 'vs/nls'

const extensionTranslationsUri: Record<string, Record<string, string>> = {}

function registerLocalization (language: string, main: Record<string, Record<string, string>>, extensionTranslationsUris: Record<string, string>): void {
  setLocale(language, main)

  extensionTranslationsUri[language] = extensionTranslationsUris
}

function getBuiltInExtensionTranslationsUris (language: string): Record<string, string> | undefined {
  return extensionTranslationsUri[language]
}

export {
  registerLocalization,
  getBuiltInExtensionTranslationsUris
}
