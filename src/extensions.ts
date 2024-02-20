import type * as vscode from 'vscode'
import { ExtensionType, IExtension, IExtensionContributions, IExtensionManifest, TargetPlatform } from 'vs/platform/extensions/common/extensions'
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions'
import { URI } from 'vs/base/common/uri'
import { getExtensionId } from 'vs/platform/extensionManagement/common/extensionManagementUtil'
import { DisposableStore, IDisposable } from 'vs/base/common/lifecycle'
import { ITranslations } from 'vs/platform/extensionManagement/common/extensionNls'
import { joinPath } from 'vs/base/common/resources'
import { FileAccess, Schemas } from 'vs/base/common/network'
import { ExtensionHostKind } from 'vs/workbench/services/extensions/common/extensionHostKind'
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService'
import { parse } from 'vs/base/common/json'
import { IFileService } from 'vs/platform/files/common/files'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { IWorkbenchExtensionEnablementService } from 'vs/workbench/services/extensionManagement/common/extensionManagement'
import { IExtensionWithExtHostKind, ExtensionServiceOverride } from './service-override/extensions'
import { CustomSchemas, registerExtensionFile } from './service-override/files'
import { getService } from './services'
import { ExtensionManifestTranslator } from './tools/l10n'
import { throttle, memoized } from './tools'
import { setDefaultApi } from './extension.api'

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

function registerExtensionFileUrl (extensionLocation: URI, filePath: string, url: string, mimeType?: string): IDisposable {
  const fileDisposable = new DisposableStore()
  fileDisposable.add(FileAccess.registerStaticBrowserUri(joinPath(extensionLocation, filePath), URI.parse(url)))

  fileDisposable.add(registerExtensionFile(extensionLocation, filePath, memoized(async () => {
    const response = await fetch(url, {
      headers: mimeType != null
        ? {
            Accept: mimeType
          }
        : {}
    })
    if (response.status !== 200) {
      throw new Error(response.statusText)
    }
    return new Uint8Array(await response.arrayBuffer())
  })))
  return fileDisposable
}

interface ExtensionDelta {
  toAdd: IExtensionWithExtHostKind[]
  toRemove: IExtension[]
}
const deltaExtensions = throttle(async ({ toAdd, toRemove }: ExtensionDelta) => {
  const extensionService = await getService(IExtensionService) as ExtensionServiceOverride
  await extensionService.deltaExtensions(toAdd, toRemove)
}, (a, b) => ({ toAdd: [...a.toAdd, ...b.toAdd], toRemove: [...a.toRemove, ...b.toRemove] }), 0)

export async function registerRemoteExtension (directory: string): Promise<RegisterRemoteExtensionResult> {
  const fileService = await getService(IFileService)
  const remoteAuthority = (await getService(IWorkbenchEnvironmentService)).remoteAuthority
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
    const remoteAuthority = (await getService(IWorkbenchEnvironmentService)).remoteAuthority
    let realLocation = location
    if (extHostKind === ExtensionHostKind.Remote) {
      realLocation = URI.from({ scheme: Schemas.vscodeRemote, authority: remoteAuthority, path })
    }

    const instantiationService = await getService(IInstantiationService)
    const translator = instantiationService.createInstance(ExtensionManifestTranslator)

    const localizedManifest = await translator.translateManifest(realLocation, manifest)

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
    const extensionEnablementService = await getService(IWorkbenchExtensionEnablementService)
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
      const extensionEnablementService = await getService(IWorkbenchExtensionEnablementService)
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
    function registerFileUrl (path: string, url: string, mimeType?: string) {
      return registerExtensionFileUrl(location, path, url, mimeType)
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
      return apiFactory(id)
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
  ExtensionHostKind
}
