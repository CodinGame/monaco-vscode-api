import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ILanguagePackItem, ILanguagePackService } from 'vs/platform/languagePacks/common/languagePacks'
import { ILocaleService } from 'vs/workbench/services/localization/common/locale'
import { URI } from 'vs/workbench/workbench.web.main'
import { IDialogService } from 'vs/platform/dialogs/common/dialogs'
import { IHostService } from 'vs/workbench/services/host/browser/host'
import { IProductService } from 'vs/platform/product/common/productService'
import { localize, localizeWithPath } from 'vs/nls'
import { Language, language } from 'vs/base/common/platform'
import { getBuiltInExtensionTranslationsUris, setAvailableLocales } from '../l10n'
import 'vs/workbench/contrib/localization/common/localization.contribution'

interface AvailableLanguage {
  locale: string
  languageName?: string
}

interface LocalizationOptions {
  setLocale (id: string): Promise<void>
  clearLocale(): Promise<void>
  availableLanguages: AvailableLanguage[]
}

class LocaleService implements ILocaleService {
  _serviceBrand: undefined

  constructor (
    private options: LocalizationOptions,
    @IDialogService private readonly dialogService: IDialogService,
    @IHostService private readonly hostService: IHostService,
    @IProductService private readonly productService: IProductService
  ) {
  }

  async setLocale (languagePackItem: ILanguagePackItem): Promise<void> {
    const locale = languagePackItem.id

    if (locale === Language.value() || (locale == null && Language.value() === navigator.language.toLowerCase())) {
      return
    }

    if (locale == null) {
      await this.options.clearLocale()
    } else {
      await this.options.setLocale(locale)
    }

    const restartDialog = await this.dialogService.confirm({
      type: 'info',
      message: localizeWithPath('vs/workbench/services/localization/browser/localeService', 'relaunchDisplayLanguageMessage', 'To change the display language, {0} needs to reload', this.productService.nameLong),
      detail: localizeWithPath('vs/workbench/services/localization/browser/localeService', 'relaunchDisplayLanguageDetail', 'Press the reload button to refresh the page and set the display language to {0}.', languagePackItem.label),
      primaryButton: localize({ key: 'reload', comment: ['&& denotes a mnemonic character'] }, '&&Reload')
    })

    if (restartDialog.confirmed) {
      await this.hostService.restart()
    }
  }

  async clearLocalePreference (): Promise<void> {
    await this.options.clearLocale()

    const restartDialog = await this.dialogService.confirm({
      type: 'info',
      message: localizeWithPath('vs/workbench/services/localization/browser/localeService', 'clearDisplayLanguageMessage', 'To change the display language, {0} needs to reload', this.productService.nameLong),
      detail: localizeWithPath('vs/workbench/services/localization/browser/localeService', 'clearDisplayLanguageDetail', "Press the reload button to refresh the page and use your browser's language."),
      primaryButton: localize({ key: 'reload', comment: ['&& denotes a mnemonic character'] }, '&&Reload')
    })

    if (restartDialog.confirmed) {
      await this.hostService.restart()
    }
  }
}

class LanguagePackService implements ILanguagePackService {
  _serviceBrand: undefined

  constructor (
    private options: LocalizationOptions
  ) {
    setAvailableLocales(new Set(options.availableLanguages.map(lang => lang.locale)))
  }

  async getAvailableLanguages (): Promise<ILanguagePackItem[]> {
    return this.options.availableLanguages.map(({ locale, languageName }) => {
      const label = languageName ?? locale
      let description: string | undefined
      if (label !== locale) {
        description = `(${locale})`
      }

      if (locale.toLowerCase() === language.toLowerCase()) {
        description ??= ''
        description += localizeWithPath('vs/platform/languagePacks/common/languagePacks', 'currentDisplayLanguage', ' (Current)')
      }

      return {
        id: locale,
        label,
        description
      }
    })
  }

  async getInstalledLanguages (): Promise<ILanguagePackItem[]> {
    return []
  }

  async getBuiltInExtensionTranslationsUri (id: string, language: string): Promise<URI | undefined> {
    const uri = getBuiltInExtensionTranslationsUris(language)?.[id]
    return uri != null ? URI.parse(uri) : undefined
  }
}

export default function getServiceOverride (options: LocalizationOptions): IEditorOverrideServices {
  return {
    [ILocaleService.toString()]: new SyncDescriptor(LocaleService, [options], true), // maybe custom impl
    [ILanguagePackService.toString()]: new SyncDescriptor(LanguagePackService, [options], true)
  }
}
