import type * as vscode from 'vscode'
import { ExtensionType, IExtension, IExtensionContributions, IExtensionManifest, TargetPlatform } from 'vs/platform/extensions/common/extensions'
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions'
import { URI } from 'vs/base/common/uri'
import { getExtensionId } from 'vs/platform/extensionManagement/common/extensionManagementUtil'
import { DisposableStore, IDisposable } from 'vs/base/common/lifecycle'
import { ITranslations, localizeManifest } from 'vs/platform/extensionManagement/common/extensionNls'
import { joinPath } from 'vs/base/common/resources'
import { FileAccess } from 'monaco-editor/esm/vs/base/common/network.js'
import { Barrier } from 'vs/base/common/async'
import { ExtensionHostKind } from 'vs/workbench/services/extensions/common/extensionHostKind'
import { IExtensionWithExtHostKind, SimpleExtensionService, getLocalExtHostExtensionService } from './service-override/extensions'
import { registerExtensionFile } from './service-override/files'
import { setDefaultApi } from './api'
import { getService } from './services'

const defaultApiInitializeBarrier = new Barrier()
export async function initialize (): Promise<void> {
  await getLocalExtHostExtensionService().then(async (extHostExtensionService) => {
    setDefaultApi(await extHostExtensionService.getApi())
    defaultApiInitializeBarrier.open()
  })
}

interface RegisterExtensionResult {
  id: string
  registerFileUrl: (path: string, url: string) => IDisposable
  dispose (): Promise<void>
}

interface RegisterLocalProcessExtensionResult extends RegisterExtensionResult {
  getApi (): Promise<typeof vscode>
  setAsDefaultApi (): Promise<void>
  registerFileGetter: (path: string, getter: () => Promise<Uint8Array>) => IDisposable
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

let _toAdd: IExtension[] = []
let _toRemove: IExtension[] = []
let lastPromise: Promise<void> | undefined
async function deltaExtensions (toAdd: IExtensionWithExtHostKind[], toRemove: IExtension[]) {
  _toAdd.push(...toAdd)
  _toRemove.push(...toRemove)

  if (lastPromise == null) {
    const extensionService = await getService(IExtensionService) as SimpleExtensionService
    lastPromise = new Promise(resolve => setTimeout(resolve)).then(async () => {
      await extensionService.deltaExtensions(_toAdd, _toRemove)
      _toAdd = []
      _toRemove = []
      lastPromise = undefined
    })
  }
  await lastPromise
}

export function registerExtension (manifest: IExtensionManifest, extHostKind: ExtensionHostKind.LocalProcess, defaultNLS?: ITranslations, builtin?: boolean): RegisterLocalProcessExtensionResult
export function registerExtension (manifest: IExtensionManifest, extHostKind?: ExtensionHostKind, defaultNLS?: ITranslations, builtin?: boolean): RegisterExtensionResult
export function registerExtension (manifest: IExtensionManifest, extHostKind?: ExtensionHostKind, defaultNLS?: ITranslations, builtin: boolean = manifest.publisher === 'vscode'): RegisterExtensionResult {
  const disposableStore = new DisposableStore()
  const localizedManifest = defaultNLS != null ? localizeManifest(manifest, defaultNLS) : manifest

  const id = getExtensionId(localizedManifest.publisher, localizedManifest.name)
  const location = URI.from({ scheme: 'extension', authority: id, path: '/' })

  const extension: IExtensionWithExtHostKind = {
    manifest: localizedManifest,
    type: builtin ? ExtensionType.System : ExtensionType.User,
    isBuiltin: builtin,
    identifier: { id },
    location,
    targetPlatform: TargetPlatform.WEB,
    isValid: true,
    validations: [],
    extHostKind
  }

  const addExtensionPromise = deltaExtensions([extension], [])

  const api: RegisterExtensionResult = {
    id: extension.identifier.id,
    registerFileUrl: (path: string, url: string, mimeType?: string) => {
      return registerExtensionFileUrl(extension.location, path, url, mimeType)
    },
    async dispose () {
      await deltaExtensions([], [extension])
      disposableStore.dispose()
    }
  }

  if (extHostKind === ExtensionHostKind.LocalProcess) {
    async function getApi () {
      await addExtensionPromise
      return (await getLocalExtHostExtensionService()).getApi(id)
    }

    return <RegisterLocalProcessExtensionResult>{
      ...api,
      getApi,
      async setAsDefaultApi () {
        setDefaultApi(await getApi())
      },
      registerFileGetter (path, getter) {
        return registerExtensionFile(extension.location, path, getter)
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
