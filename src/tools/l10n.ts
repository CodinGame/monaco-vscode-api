import { localize } from 'vs/nls'
import { ParseError, getNodeType, parse } from 'vs/base/common/json'
import { joinPath } from 'vs/base/common/resources'
import { URI } from 'vs/base/common/uri'
import { IExtensionManifest } from 'vs/platform/extensions/common/extensions'
import { IFileService } from 'vs/platform/files/common/files'
import { ILogService } from 'vs/platform/log/common/log'
import { localizeManifest } from 'vs/platform/extensionManagement/common/extensionNls'
import { getParseErrorMessage } from 'vs/base/common/jsonErrorMessages'
import * as platform from 'vs/base/common/platform'
import { getBuiltInExtensionTranslationsUris } from '../l10n'

/**
 * The code below is extracted from vs/platform/extensionManagement/common/extensionsScannerService.ts
 */
interface Translations {
  [id: string]: string
}
type NlsConfiguration = {
  language: string | undefined
  pseudo: boolean
  devMode: boolean
  translations: Translations
}
interface MessageBag {
  [key: string]: string | { message: string, comment: string[] }
}
interface TranslationBundle {
  contents?: {
    package: MessageBag
  }
}
interface LocalizedMessages {
  values: MessageBag | undefined
  default: URI | null
}

export class ExtensionManifestTranslator {
  constructor (
    @IFileService protected readonly fileService: IFileService,
    @ILogService protected readonly logService: ILogService
  ) {
  }

  /**
   * Parses original message bundle, returns null if the original message bundle is null.
   */
  private async resolveOriginalMessageBundle (originalMessageBundle: URI | null, errors: ParseError[]): Promise<{ [key: string]: string } | undefined> {
    if (originalMessageBundle != null) {
      try {
        const originalBundleContent = (await this.fileService.readFile(originalMessageBundle)).value.toString()
        return parse(originalBundleContent, errors)
      } catch (error) {
        /* Ignore Error */
      }
    }
    return undefined
  }

  private findMessageBundles (extensionLocation: URI, nlsConfiguration: NlsConfiguration): Promise<{ localized: URI, original: URI | null }> {
    return new Promise<{ localized: URI, original: URI | null }>((resolve) => {
      const loop = (locale: string): void => {
        const toCheck = joinPath(extensionLocation, `package.nls.${locale}.json`)
        void this.fileService.exists(toCheck).then(exists => {
          if (exists) {
            resolve({ localized: toCheck, original: joinPath(extensionLocation, 'package.nls.json') })
          }
          const index = locale.lastIndexOf('-')
          if (index === -1) {
            resolve({ localized: joinPath(extensionLocation, 'package.nls.json'), original: null })
          } else {
            locale = locale.substring(0, index)
            loop(locale)
          }
        })
      }
      if (nlsConfiguration.devMode || nlsConfiguration.pseudo || nlsConfiguration.language == null) {
        return resolve({ localized: joinPath(extensionLocation, 'package.nls.json'), original: null })
      }
      loop(nlsConfiguration.language)
    })
  }

  private formatMessage (extensionLocation: URI, message: string): string {
    return `[${extensionLocation.path}]: ${message}`
  }

  public async translateManifest (extensionLocation: URI, extensionManifest: IExtensionManifest): Promise<IExtensionManifest> {
    const nlsConfiguration: NlsConfiguration = {
      devMode: false,
      language: platform.language,
      pseudo: platform.language === 'pseudo',
      translations: getBuiltInExtensionTranslationsUris(platform.language) ?? {}
    }

    const localizedMessages = await this.getLocalizedMessages(extensionLocation, extensionManifest, nlsConfiguration)
    if (localizedMessages != null) {
      try {
        const errors: ParseError[] = []
        // resolveOriginalMessageBundle returns null if localizedMessages.default === undefined;
        const defaults = await this.resolveOriginalMessageBundle(localizedMessages.default, errors)
        if (errors.length > 0) {
          errors.forEach((error) => {
            this.logService.error(this.formatMessage(extensionLocation, localize('jsonsParseReportErrors', 'Failed to parse {0}: {1}.', localizedMessages.default?.path, getParseErrorMessage(error.error))))
          })
          return extensionManifest
        } else if (getNodeType(localizedMessages) !== 'object') {
          this.logService.error(this.formatMessage(extensionLocation, localize('jsonInvalidFormat', 'Invalid format {0}: JSON object expected.', localizedMessages.default?.path)))
          return extensionManifest
        }
        const localized = localizedMessages.values ?? Object.create(null)
        return localizeManifest(this.logService, extensionManifest, localized, defaults)
      } catch (error) {
        /* Ignore Error */
      }
    }
    return extensionManifest
  }

  private async getLocalizedMessages (extensionLocation: URI, extensionManifest: IExtensionManifest, nlsConfiguration: NlsConfiguration): Promise<LocalizedMessages | undefined> {
    const defaultPackageNLS = joinPath(extensionLocation, 'package.nls.json')
    const reportErrors = (localized: URI | null, errors: ParseError[]): void => {
      errors.forEach((error) => {
        this.logService.error(this.formatMessage(extensionLocation, localize('jsonsParseReportErrors', 'Failed to parse {0}: {1}.', localized?.path, getParseErrorMessage(error.error))))
      })
    }
    const reportInvalidFormat = (localized: URI | null): void => {
      this.logService.error(this.formatMessage(extensionLocation, localize('jsonInvalidFormat', 'Invalid format {0}: JSON object expected.', localized?.path)))
    }

    const translationId = `${extensionManifest.publisher}.${extensionManifest.name}`
    const translationUri = nlsConfiguration.translations[translationId]

    if (translationUri != null) {
      try {
        const translationResource = URI.parse(translationUri)
        const content = (await this.fileService.readFile(translationResource)).value.toString()
        const errors: ParseError[] = []
        const translationBundle: TranslationBundle = parse(content, errors)
        if (errors.length > 0) {
          reportErrors(translationResource, errors)
          return { values: undefined, default: defaultPackageNLS }
        } else if (getNodeType(translationBundle) !== 'object') {
          reportInvalidFormat(translationResource)
          return { values: undefined, default: defaultPackageNLS }
        } else {
          const values = translationBundle.contents?.package
          return { values, default: defaultPackageNLS }
        }
      } catch (error) {
        return { values: undefined, default: defaultPackageNLS }
      }
    } else {
      const exists = await this.fileService.exists(defaultPackageNLS)
      if (!exists) {
        return undefined
      }
      let messageBundle
      try {
        messageBundle = await this.findMessageBundles(extensionLocation, nlsConfiguration)
      } catch (error) {
        return undefined
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (messageBundle.localized == null) {
        return { values: undefined, default: messageBundle.original }
      }
      try {
        const messageBundleContent = (await this.fileService.readFile(messageBundle.localized)).value.toString()
        const errors: ParseError[] = []
        const messages: MessageBag = parse(messageBundleContent, errors)
        if (errors.length > 0) {
          reportErrors(messageBundle.localized, errors)
          return { values: undefined, default: messageBundle.original }
        } else if (getNodeType(messages) !== 'object') {
          reportInvalidFormat(messageBundle.localized)
          return { values: undefined, default: messageBundle.original }
        }
        return { values: messages, default: messageBundle.original }
      } catch (error) {
        return { values: undefined, default: messageBundle.original }
      }
    }
  }
}
