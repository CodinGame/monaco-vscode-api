/** PROPOSED-type-references */
import type * as vscode from 'vscode'
import { ExtensionType, IExtension, IExtensionContributions, IExtensionManifest, TargetPlatform } from 'vs/platform/extensions/common/extensions'
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions.service'
import { URI } from 'vs/base/common/uri'
import { getExtensionId } from 'vs/platform/extensionManagement/common/extensionManagementUtil'
import { DisposableStore, IDisposable } from 'vs/base/common/lifecycle'
import { ITranslations } from 'vs/platform/extensionManagement/common/extensionNls'
import { joinPath } from 'vs/base/common/resources'
import { FileAccess, Schemas } from 'vs/base/common/network'
import { ExtensionHostKind } from 'vs/workbench/services/extensions/common/extensionHostKind'
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService.service'
import { parse } from 'vs/base/common/json'
import { IFileService } from 'vs/platform/files/common/files.service'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { IWorkbenchExtensionEnablementService } from 'vs/workbench/services/extensionManagement/common/extensionManagement.service'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ExtensionManifestTranslator, NlsConfiguration } from 'vs/platform/extensionManagement/common/extensionsScannerService'
import * as platform from 'vs/base/common/platform'
import { IExtensionWithExtHostKind, ExtensionServiceOverride } from './service-override/extensions'
import { CustomSchemas, ExtensionFileMetadata, RegisteredUriFile, registerExtensionFile } from './service-override/files'
import { waitServicesReady } from './lifecycle'
import { throttle } from './tools'
import { setDefaultApi } from './extension.api'
import { getBuiltInExtensionTranslationsUris } from './l10n'

export type ApiFactory = (extensionId?: string) => Promise<typeof vscode>

let apiFactory: ApiFactory | undefined
export function registerLocalApiFactory (_apiFactory: ApiFactory): void {
  apiFactory = _apiFactory
}

interface RegisterExtensionParams {
  path?: string
  system?: boolean
  readmePath?: string
  changelogPath?: string
}

interface RegisterRemoteExtensionParams extends RegisterExtensionParams {
  path: string
}

interface RegisterExtensionResult {
  id: string
  dispose (): Promise<void>
  whenReady(): Promise<void>
  isEnabled(): Promise<boolean>
}

interface RegisterRemoteExtensionResult extends RegisterExtensionResult {
}

interface RegisterLocalExtensionResult extends RegisterExtensionResult {
  registerFileUrl: (path: string, url: string) => IDisposable
}

interface RegisterLocalProcessExtensionResult extends RegisterLocalExtensionResult {
  getApi (): Promise<typeof vscode>
  setAsDefaultApi (): Promise<void>
}

function registerExtensionFileUrl (extensionLocation: URI, filePath: string, url: string, metadataOrMimeType?: string | ExtensionFileMetadata): IDisposable {
  const fileDisposable = new DisposableStore()
  fileDisposable.add(FileAccess.registerStaticBrowserUri(joinPath(extensionLocation, filePath), URI.parse(url)))

  const metadata: ExtensionFileMetadata | undefined = typeof metadataOrMimeType === 'string' ? { mimeType: metadataOrMimeType } : metadataOrMimeType
  fileDisposable.add(registerExtensionFile(new RegisteredUriFile(joinPath(extensionLocation, filePath), url, metadata)))
  return fileDisposable
}

interface ExtensionDelta {
  toAdd: IExtensionWithExtHostKind[]
  toRemove: IExtension[]
}
const deltaExtensions = throttle(async ({ toAdd, toRemove }: ExtensionDelta) => {
  await waitServicesReady()
  const extensionService = StandaloneServices.get(IExtensionService) as ExtensionServiceOverride
  await extensionService.deltaExtensions(toAdd, toRemove)
}, (a, b) => ({ toAdd: [...a.toAdd, ...b.toAdd], toRemove: [...a.toRemove, ...b.toRemove] }), 0)

export async function registerRemoteExtension (directory: string): Promise<RegisterRemoteExtensionResult> {
  await waitServicesReady()
  const fileService = StandaloneServices.get(IFileService)
  const remoteAuthority = StandaloneServices.get(IWorkbenchEnvironmentService).remoteAuthority
  const content = await fileService.readFile(joinPath(URI.from({ scheme: Schemas.vscodeRemote, authority: remoteAuthority, path: directory }), 'package.json'))
  const manifest: IExtensionManifest = parse(content.value.toString())

  return registerExtension(manifest, ExtensionHostKind.Remote, { path: directory })
}

const forcedExtensionHostKinds = new Map<string, ExtensionHostKind>()
const extensions: IExtension[] = []
export function getExtensionManifests (): IExtension[] {
  return extensions
}
export function getForcedExtensionHostKind (id: string): ExtensionHostKind | undefined {
  return forcedExtensionHostKinds.get(id)
}

export function registerExtension (manifest: IExtensionManifest, extHostKind: ExtensionHostKind.LocalProcess, params?: RegisterExtensionParams): RegisterLocalProcessExtensionResult
export function registerExtension (manifest: IExtensionManifest, extHostKind: ExtensionHostKind.LocalWebWorker, params?: RegisterExtensionParams): RegisterLocalExtensionResult
export function registerExtension (manifest: IExtensionManifest, extHostKind: ExtensionHostKind.Remote, params?: RegisterRemoteExtensionParams): RegisterRemoteExtensionResult
export function registerExtension (manifest: IExtensionManifest, extHostKind?: ExtensionHostKind, params?: RegisterExtensionParams): RegisterExtensionResult
export function registerExtension (manifest: IExtensionManifest, extHostKind?: ExtensionHostKind, { path = '/', system = false, readmePath, changelogPath }: RegisterExtensionParams = {}): RegisterExtensionResult {
  const id = getExtensionId(manifest.publisher, manifest.name)
  const location = URI.from({ scheme: CustomSchemas.extensionFile, authority: id, path })

  const addExtensionPromise = (async () => {
    await waitServicesReady()
    const remoteAuthority = StandaloneServices.get(IWorkbenchEnvironmentService).remoteAuthority
    let realLocation = location
    if (extHostKind === ExtensionHostKind.Remote) {
      realLocation = URI.from({ scheme: Schemas.vscodeRemote, authority: remoteAuthority, path })
    }

    const instantiationService = StandaloneServices.get(IInstantiationService)
    const translator = instantiationService.createInstance(ExtensionManifestTranslator)

    const nlsConfiguration: NlsConfiguration = {
      devMode: false,
      language: platform.language,
      pseudo: platform.language === 'pseudo',
      translations: getBuiltInExtensionTranslationsUris(platform.language) ?? {}
    }
    const localizedManifest = await translator.translateManifest(realLocation, manifest, nlsConfiguration)

    const extension: IExtensionWithExtHostKind = {
      manifest: localizedManifest,
      type: system ? ExtensionType.System : ExtensionType.User,
      isBuiltin: true,
      identifier: { id },
      location: realLocation,
      targetPlatform: TargetPlatform.WEB,
      isValid: true,
      validations: [],
      extHostKind,
      readmeUrl: readmePath != null ? URI.joinPath(realLocation, readmePath) : undefined,
      changelogUrl: changelogPath != null ? URI.joinPath(realLocation, changelogPath) : undefined
    }

    if (extHostKind != null) {
      forcedExtensionHostKinds.set(id, extHostKind)
    }
    if (extHostKind !== ExtensionHostKind.Remote) {
      extensions.push(extension)
    }

    // Wait for extension to be enabled
    const extensionEnablementService = StandaloneServices.get(IWorkbenchExtensionEnablementService)
    if (extensionEnablementService.isEnabled(extension)) {
      await deltaExtensions({ toAdd: [extension], toRemove: [] })
    }

    return extension
  })()

  let api: RegisterExtensionResult = {
    id,
    async whenReady () {
      await addExtensionPromise
    },
    async isEnabled () {
      await waitServicesReady()
      const extensionEnablementService = StandaloneServices.get(IWorkbenchExtensionEnablementService)
      const extension = await addExtensionPromise
      return extensionEnablementService.isEnabled(extension)
    },
    async dispose () {
      const extension = await addExtensionPromise

      const index = extensions.indexOf(extension)
      if (index >= 0) {
        extensions.splice(extensions.indexOf(extension), 1)
      }
      forcedExtensionHostKinds.delete(id)

      await deltaExtensions({ toAdd: [], toRemove: [extension] })
    }
  }

  if (extHostKind !== ExtensionHostKind.Remote) {
    function registerFileUrl (path: string, url: string, metadataOrMimeType?: string | ExtensionFileMetadata) {
      return registerExtensionFileUrl(location, path, url, metadataOrMimeType)
    }
    api = <RegisterLocalExtensionResult>{
      ...api,
      registerFileUrl
    }
  }

  if (extHostKind === ExtensionHostKind.LocalProcess) {
    async function getApi () {
      await addExtensionPromise
      if (apiFactory == null) {
        throw new Error('The local api can\'t be used without registering the local extension host by importing `vscode/localExtensionHost`')
      }
      return await apiFactory(id)
    }

    api = <RegisterLocalProcessExtensionResult>{
      ...api,
      getApi,
      async setAsDefaultApi () {
        setDefaultApi(await getApi())
      }
    }
  }

  return api
}

export {
  IExtensionManifest,
  ITranslations,
  IExtensionContributions,
  ExtensionHostKind,
  ExtensionFileMetadata
}
