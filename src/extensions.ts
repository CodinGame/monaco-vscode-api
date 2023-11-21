import type * as vscode from 'vscode'
import { ExtensionType, IExtension, IExtensionContributions, IExtensionManifest, TargetPlatform } from 'vs/platform/extensions/common/extensions'
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions'
import { URI } from 'vs/base/common/uri'
import { getExtensionId } from 'vs/platform/extensionManagement/common/extensionManagementUtil'
import { DisposableStore, IDisposable } from 'vs/base/common/lifecycle'
import { ITranslations } from 'vs/platform/extensionManagement/common/extensionNls'
import { joinPath } from 'vs/base/common/resources'
import { FileAccess, Schemas } from 'vs/base/common/network'
import { Barrier } from 'vs/base/common/async'
import { ExtensionHostKind } from 'vs/workbench/services/extensions/common/extensionHostKind'
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService'
import { parse } from 'vs/base/common/json'
import { IFileService } from 'vs/platform/files/common/files'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { IExtensionWithExtHostKind, ExtensionServiceOverride, getLocalExtHostExtensionService } from './service-override/extensions'
import { registerExtensionFile } from './service-override/files'
import { setDefaultApi } from './api'
import { getService } from './services'
import { ExtensionManifestTranslator } from './tools/l10n'
import { throttle } from './tools'

const defaultApiInitializeBarrier = new Barrier()
export async function initialize (): Promise<void> {
  await getLocalExtHostExtensionService().then(async (extHostExtensionService) => {
    setDefaultApi(await extHostExtensionService.getApi())
    defaultApiInitializeBarrier.open()
  })
}

interface RegisterExtensionParams {
  builtin?: boolean
  path?: string
}

interface RegisterRemoteExtensionParams extends RegisterExtensionParams {
  path: string
}

interface RegisterExtensionResult {
  id: string
  dispose (): Promise<void>
  whenReady(): Promise<void>
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
  fileDisposable.add(registerExtensionFile(extensionLocation, filePath, async () => {
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
  }))
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

export function registerExtension (manifest: IExtensionManifest, extHostKind: ExtensionHostKind.LocalProcess, params?: RegisterExtensionParams): RegisterLocalProcessExtensionResult
export function registerExtension (manifest: IExtensionManifest, extHostKind: ExtensionHostKind.LocalWebWorker, params?: RegisterExtensionParams): RegisterLocalExtensionResult
export function registerExtension (manifest: IExtensionManifest, extHostKind: ExtensionHostKind.Remote, params?: RegisterRemoteExtensionParams): RegisterRemoteExtensionResult
export function registerExtension (manifest: IExtensionManifest, extHostKind?: ExtensionHostKind, params?: RegisterExtensionParams): RegisterExtensionResult
export function registerExtension (manifest: IExtensionManifest, extHostKind?: ExtensionHostKind, { builtin = manifest.publisher === 'vscode', path = '/' }: RegisterExtensionParams = {}): RegisterExtensionResult {
  const disposableStore = new DisposableStore()
  const id = getExtensionId(manifest.publisher, manifest.name)
  const location = URI.from({ scheme: 'extension-fs', authority: id, path })

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
      type: builtin ? ExtensionType.System : ExtensionType.User,
      isBuiltin: builtin,
      identifier: { id },
      location: realLocation,
      targetPlatform: TargetPlatform.WEB,
      isValid: true,
      validations: [],
      extHostKind
    }

    await deltaExtensions({ toAdd: [extension], toRemove: [] })

    return extension
  })()

  let api: RegisterExtensionResult = {
    id,
    async whenReady () {
      await addExtensionPromise
    },
    async dispose () {
      const extension = await addExtensionPromise
      await deltaExtensions({ toAdd: [], toRemove: [extension] })
      disposableStore.dispose()
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
      return (await getLocalExtHostExtensionService()).getApi(id)
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

function onExtHostInitialized (fct: () => void): void {
  void defaultApiInitializeBarrier.wait().then(fct)
}

export {
  IExtensionManifest,
  ITranslations,
  IExtensionContributions,
  onExtHostInitialized,
  ExtensionHostKind
}
