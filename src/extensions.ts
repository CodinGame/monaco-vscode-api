// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./types.d.ts" />
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../vscode/src/vscode-dts/vscode.d.ts" />
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../vscode/src/vscode-dts/vscode.proposed.d.ts" />

import type * as vscode from 'vscode'
import {
  ExtensionType,
  type IExtension,
  type IExtensionContributions,
  type IExtensionManifest,
  TargetPlatform
} from 'vs/platform/extensions/common/extensions'
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions.service'
import { URI } from 'vs/base/common/uri'
import { getExtensionId } from 'vs/platform/extensionManagement/common/extensionManagementUtil'
import { DisposableStore, type IDisposable } from 'vs/base/common/lifecycle'
import type { ITranslations } from 'vs/platform/extensionManagement/common/extensionNls'
import { joinPath } from 'vs/base/common/resources'
import { FileAccess, Schemas } from 'vs/base/common/network'
import { ExtensionHostKind } from 'vs/workbench/services/extensions/common/extensionHostKind'
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService.service'
import { parse } from 'vs/base/common/json'
import { IFileService } from 'vs/platform/files/common/files.service'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { IWorkbenchExtensionEnablementService } from 'vs/workbench/services/extensionManagement/common/extensionManagement.service'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import {
  ExtensionManifestTranslator,
  type NlsConfiguration
} from 'vs/platform/extensionManagement/common/extensionsScannerService'
import * as platform from 'vs/base/common/platform'
import { ExtensionServiceOverride } from './service-override/extensions'
import {
  CustomSchemas,
  type ExtensionFileMetadata,
  RegisteredUriFile,
  registerExtensionFile
} from './service-override/files'
import { servicesInitialized, waitServicesReady } from './lifecycle'
import { throttle } from './tools'
import { getBuiltInExtensionTranslationsUris, getLocalizationManifest } from './l10n'
import { toExtensionDescription } from 'vs/workbench/services/extensions/common/extensions'

export type ApiFactory = (extensionId?: string) => Promise<typeof vscode>

let apiFactory: ApiFactory | undefined
export function registerLocalApiFactory(_apiFactory: ApiFactory): void {
  apiFactory = _apiFactory
}

let defaultApiHandler: ((api: typeof vscode) => void) | undefined
export function registerDefaultApiHandler(handler: (api: typeof vscode) => void): void {
  defaultApiHandler = handler
}

export interface RegisterExtensionParams {
  path?: string
  system?: boolean
  readmePath?: string
  changelogPath?: string
}

export interface RegisterRemoteExtensionParams extends RegisterExtensionParams {
  path: string
}

export interface RegisterExtensionResult {
  id: string
  dispose(): Promise<void>
  whenReady(): Promise<void>
  isEnabled(): Promise<boolean>
}

export type RegisterRemoteExtensionResult = RegisterExtensionResult

export interface RegisterLocalExtensionResult extends RegisterExtensionResult {
  registerFileUrl: (path: string, url: string) => IDisposable
}

export interface RegisterLocalProcessExtensionResult extends RegisterLocalExtensionResult {
  getApi(): Promise<typeof vscode>
  setAsDefaultApi(): Promise<void>
}

function registerExtensionFileUrl(
  extensionLocation: URI,
  filePath: string,
  url: string,
  metadataOrMimeType?: string | ExtensionFileMetadata
): IDisposable {
  const fileDisposable = new DisposableStore()
  fileDisposable.add(
    FileAccess.registerStaticBrowserUri(joinPath(extensionLocation, filePath), URI.parse(url))
  )

  const metadata: ExtensionFileMetadata | undefined =
    typeof metadataOrMimeType === 'string' ? { mimeType: metadataOrMimeType } : metadataOrMimeType
  fileDisposable.add(
    registerExtensionFile(
      new RegisteredUriFile(joinPath(extensionLocation, filePath), url, metadata)
    )
  )
  return fileDisposable
}

interface ExtensionDelta {
  toAdd: IExtension[]
  toRemove: IExtension[]
}
const deltaExtensions = throttle(
  async ({ toAdd, toRemove }: ExtensionDelta) => {
    await waitServicesReady()
    const extensionService = StandaloneServices.get(IExtensionService) as ExtensionServiceOverride
    await extensionService.deltaExtensions(toAdd, toRemove)
  },
  (a, b) => ({ toAdd: [...a.toAdd, ...b.toAdd], toRemove: [...a.toRemove, ...b.toRemove] }),
  0
)

export async function registerRemoteExtension(
  directory: string
): Promise<RegisterRemoteExtensionResult> {
  await waitServicesReady()
  const fileService = StandaloneServices.get(IFileService)
  const remoteAuthority = StandaloneServices.get(IWorkbenchEnvironmentService).remoteAuthority
  const content = await fileService.readFile(
    joinPath(
      URI.from({ scheme: Schemas.vscodeRemote, authority: remoteAuthority, path: directory }),
      'package.json'
    )
  )
  const manifest: IExtensionManifest = parse(content.value.toString())

  return registerExtension(manifest, ExtensionHostKind.Remote, { path: directory })
}

const forcedExtensionHostKinds = new Map<string, ExtensionHostKind>()
const builtinExtensions: IExtension[] = []
export function getBuiltinExtensions(): IExtension[] {
  return builtinExtensions
}
export function getForcedExtensionHostKind(id: string): ExtensionHostKind | undefined {
  return forcedExtensionHostKinds.get(id)
}

export function registerExtension(
  manifest: IExtensionManifest,
  extHostKind: ExtensionHostKind.LocalProcess,
  params?: RegisterExtensionParams
): RegisterLocalProcessExtensionResult
export function registerExtension(
  manifest: IExtensionManifest,
  extHostKind: ExtensionHostKind.LocalWebWorker,
  params?: RegisterExtensionParams
): RegisterLocalExtensionResult
export function registerExtension(
  manifest: IExtensionManifest,
  extHostKind: ExtensionHostKind.Remote,
  params?: RegisterRemoteExtensionParams
): RegisterRemoteExtensionResult
export function registerExtension(
  manifest: IExtensionManifest,
  extHostKind?: ExtensionHostKind,
  params?: RegisterExtensionParams
): RegisterExtensionResult
export function registerExtension(
  manifest: IExtensionManifest,
  extHostKind?: ExtensionHostKind,
  { path = '/extension', system = false, readmePath, changelogPath }: RegisterExtensionParams = {}
): RegisterExtensionResult {
  const id = getExtensionId(manifest.publisher, manifest.name)
  const location = URI.from({ scheme: CustomSchemas.extensionFile, authority: id, path })

  let addExtensionPromise = waitServicesReady()

  // First register the extension in the builtinExtensions that the BuiltinExtensionsScannerService will try to load
  const extension: IExtension = {
    manifest,
    type: system ? ExtensionType.System : ExtensionType.User,
    isBuiltin: true,
    identifier: { id },
    location,
    targetPlatform: TargetPlatform.WEB,
    isValid: true,
    validations: [],
    readmeUrl: readmePath != null ? URI.joinPath(location, readmePath) : undefined,
    changelogUrl: changelogPath != null ? URI.joinPath(location, changelogPath) : undefined,
    preRelease: false
  }

  if (extHostKind != null) {
    forcedExtensionHostKinds.set(id, extHostKind)
  }

  if (!servicesInitialized && extHostKind !== ExtensionHostKind.Remote) {
    builtinExtensions.push(extension)
  } else {
    // If the services were already initialized, BuiltinExtensionsScannerService won't load them, so do it outselves
    addExtensionPromise = addExtensionPromise.then(async () => {
      // Otherwise, register them now
      const instantiationService = StandaloneServices.get(IInstantiationService)
      const extensionEnablementService = StandaloneServices.get(
        IWorkbenchExtensionEnablementService
      )
      const extensionService = StandaloneServices.get(IExtensionService)
      if (
        extensionEnablementService.isEnabled(extension) &&
        extensionService.canAddExtension(toExtensionDescription(extension, false))
      ) {
        const remoteAuthority = StandaloneServices.get(IWorkbenchEnvironmentService).remoteAuthority
        let realLocation = location
        if (extHostKind === ExtensionHostKind.Remote) {
          realLocation = URI.from({
            scheme: Schemas.vscodeRemote,
            authority: remoteAuthority,
            path
          })
        }

        const translator = instantiationService.createInstance(ExtensionManifestTranslator)
        const nlsConfiguration: NlsConfiguration = {
          devMode: false,
          language: platform.language,
          pseudo: platform.language === 'pseudo',
          translations: getBuiltInExtensionTranslationsUris(platform.language) ?? {}
        }
        const localizedExtension: IExtension = {
          ...extension,
          manifest: await translator.translateManifest(realLocation, manifest, nlsConfiguration)
        }
        await deltaExtensions({ toAdd: [localizedExtension], toRemove: [] })
      }
    })
  }

  let api: RegisterExtensionResult = {
    id,
    async whenReady() {
      await addExtensionPromise
    },
    async isEnabled() {
      await waitServicesReady()
      const extensionEnablementService = StandaloneServices.get(
        IWorkbenchExtensionEnablementService
      )
      await addExtensionPromise
      return extensionEnablementService.isEnabled(extension)
    },
    async dispose() {
      await addExtensionPromise

      const index = builtinExtensions.indexOf(extension)
      if (index >= 0) {
        builtinExtensions.splice(builtinExtensions.indexOf(extension), 1)
      }
      forcedExtensionHostKinds.delete(id)

      await deltaExtensions({ toAdd: [], toRemove: [extension] })
    }
  }

  if (extHostKind !== ExtensionHostKind.Remote) {
    function registerFileUrl(
      path: string,
      url: string,
      metadataOrMimeType?: string | ExtensionFileMetadata
    ) {
      return registerExtensionFileUrl(location, path, url, metadataOrMimeType)
    }
    api = <RegisterLocalExtensionResult>{
      ...api,
      registerFileUrl
    }
  }

  if (extHostKind === ExtensionHostKind.LocalProcess) {
    async function getApi() {
      await addExtensionPromise
      if (apiFactory == null) {
        throw new Error(
          "The local api can't be used without registering the local extension host by importing `vscode/localExtensionHost`"
        )
      }
      return await apiFactory(id)
    }

    api = <RegisterLocalProcessExtensionResult>{
      ...api,
      getApi,
      async setAsDefaultApi() {
        defaultApiHandler?.(await getApi())
      }
    }
  }

  return api
}

const localizationManifest = getLocalizationManifest()
if (localizationManifest != null) {
  registerExtension(localizationManifest, ExtensionHostKind.LocalWebWorker, { system: true })
}

export { ExtensionHostKind }
export type { IExtensionManifest, ITranslations, IExtensionContributions, ExtensionFileMetadata }
