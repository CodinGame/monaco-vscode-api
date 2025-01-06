import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import {
  type ILanguagePackItem,
  LanguagePackBaseService
} from 'vs/platform/languagePacks/common/languagePacks'
import { ILanguagePackService } from 'vs/platform/languagePacks/common/languagePacks.service'
import { ILocaleService } from 'vs/workbench/services/localization/common/locale.service'
import { IDialogService } from 'vs/platform/dialogs/common/dialogs.service'
import { IHostService } from 'vs/workbench/services/host/browser/host.service'
import { IProductService } from 'vs/platform/product/common/productService.service'
import { URI } from 'vs/base/common/uri'
import { AbstractLocaleService } from 'vs/workbench/services/localization/browser/localeService'
import { IExtensionGalleryService } from 'vs/platform/extensionManagement/common/extensionManagement.service'
import { getBuiltInExtensionTranslationsUris, setAvailableLocales } from '../l10n'
import 'vs/workbench/contrib/localization/browser/localization.contribution'

export interface AvailableLanguage {
  locale: string
  languageName?: string
}

export interface LocalizationOptions {
  setLocale(id: string): Promise<void>
  clearLocale(): Promise<void>
  availableLanguages: AvailableLanguage[]
}

class LocaleService extends AbstractLocaleService {
  constructor(
    private options: LocalizationOptions,
    @IDialogService dialogService: IDialogService,
    @IHostService hostService: IHostService,
    @IProductService productService: IProductService
  ) {
    super(dialogService, hostService, productService)
  }

  override async storeLocale(locale: string | undefined): Promise<void> {
    if (locale == null) {
      await this.options.clearLocale()
    } else {
      await this.options.setLocale(locale)
    }
  }

  override async clearLocale(): Promise<void> {
    await this.options.clearLocale()
  }
}

class LanguagePackService extends LanguagePackBaseService implements ILanguagePackService {
  constructor(
    private options: LocalizationOptions,
    @IExtensionGalleryService extensionGalleryService: IExtensionGalleryService
  ) {
    super(extensionGalleryService)
    setAvailableLocales(new Set(options.availableLanguages.map((lang) => lang.locale)))
  }

  override async getAvailableLanguages(): Promise<ILanguagePackItem[]> {
    return this.options.availableLanguages.map(({ locale, languageName }) => {
      return this.createQuickPickItem(locale, languageName)
    })
  }

  async getInstalledLanguages(): Promise<ILanguagePackItem[]> {
    return []
  }

  async getBuiltInExtensionTranslationsUri(id: string, language: string): Promise<URI | undefined> {
    const uri = getBuiltInExtensionTranslationsUris(language)?.[id]
    return uri != null ? URI.parse(uri) : undefined
  }
}

export default function getServiceOverride(options: LocalizationOptions): IEditorOverrideServices {
  return {
    [ILocaleService.toString()]: new SyncDescriptor(LocaleService, [options], true), // maybe custom impl
    [ILanguagePackService.toString()]: new SyncDescriptor(LanguagePackService, [options], true)
  }
}
