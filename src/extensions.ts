import type * as vscode from 'vscode'
import { ExtensionIdentifier, ExtensionType, IExtension, IExtensionContributions, IExtensionManifest, TargetPlatform } from 'vs/platform/extensions/common/extensions'
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions'
import { URI } from 'vs/base/common/uri'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { getExtensionId } from 'vs/platform/extensionManagement/common/extensionManagementUtil'
import { DisposableStore, IDisposable } from 'vs/base/common/lifecycle'
import { ITranslations, localizeManifest } from 'vs/platform/extensionManagement/common/extensionNls'
import { joinPath } from 'vs/base/common/resources'
import { FileAccess } from 'monaco-editor/esm/vs/base/common/network.js'
import { registerExtensionFile } from './service-override/files'
import { getExtHostExtensionService, initialize as initializeExtHostServices, onExtHostInitialized } from './extHost'
import { SimpleExtensionService } from './service-override/extensions'
import { setDefaultApi } from './api'

export async function initialize (): Promise<void> {
  await initializeExtHostServices()
}

interface RegisterExtensionResult extends IDisposable {
  getApi (): Promise<typeof vscode>
  getExports (): Promise<unknown>
  registerFile: (path: string, getContent: () => Promise<Uint8Array | string>) => IDisposable
  registerSyncFile: (path: string, content: Uint8Array | string) => IDisposable
  dispose (): void
  setDefault (): Promise<void>
}

const extensionFileBlobUrls = new Map<string, string>()
function registerExtensionFileBlob (extensionLocation: URI, filePath: string, content: string | Uint8Array, mimeType?: string): IDisposable {
  const blob = new Blob([content instanceof Uint8Array ? content : new TextEncoder().encode(content)], {
    type: mimeType
  })
  const path = joinPath(extensionLocation, filePath).toString()
  const url = URL.createObjectURL(blob)
  extensionFileBlobUrls.set(path, url)
  return {
    dispose () {
      extensionFileBlobUrls.delete(path)
      URL.revokeObjectURL(url)
    }
  }
}
const original = FileAccess.uriToBrowserUri
FileAccess.uriToBrowserUri = function (uri: URI) {
  if (uri.scheme === 'extension') {
    const extensionFile = extensionFileBlobUrls.get(uri.toString())
    if (extensionFile != null) {
      return URI.parse(extensionFile)
    }
  }
  return original.call(this, uri)
}

let _toAdd: IExtension[] = []
let _toRemove: IExtension[] = []
let lastPromise: Promise<void> | undefined
async function deltaExtensions (toAdd: IExtension[], toRemove: IExtension[]) {
  _toAdd.push(...toAdd)
  _toRemove.push(...toRemove)

  if (lastPromise == null) {
    const extensionService = StandaloneServices.get(IExtensionService) as SimpleExtensionService
    lastPromise = new Promise(resolve => setTimeout(resolve)).then(async () => {
      await extensionService.deltaExtensions(_toAdd, _toRemove)
      _toAdd = []
      _toRemove = []
      lastPromise = undefined
    })
  }
  await lastPromise
}

export function registerExtension (manifest: IExtensionManifest, defaultNLS?: ITranslations, builtin: boolean = manifest.publisher === 'vscode'): RegisterExtensionResult {
  let localizedManifest = defaultNLS != null ? localizeManifest(manifest, defaultNLS) : manifest

  const id = getExtensionId(localizedManifest.publisher, localizedManifest.name)
  const location = URI.from({ scheme: 'extension', authority: id, path: '/' })

  if (localizedManifest.browser == null) {
    localizedManifest = {
      ...localizedManifest,
      browser: './fakeEntryPoint.js'
    }
    registerExtensionFile(location, './fakeEntryPoint.js', async () => 'exports.vscode = require("vscode")')
  }

  const extension: IExtension = {
    manifest: localizedManifest,
    type: builtin ? ExtensionType.System : ExtensionType.User,
    isBuiltin: builtin,
    identifier: { id },
    location,
    targetPlatform: TargetPlatform.WEB,
    isValid: true,
    validations: []
  }

  const addExtensionPromise = deltaExtensions([extension], [])

  const disposables = new DisposableStore()

  async function getExports (): Promise<unknown> {
    const [extHostExtensionService] = await Promise.all([getExtHostExtensionService(), addExtensionPromise])
    const identifier = new ExtensionIdentifier(id)
    await extHostExtensionService.activateByIdWithErrors(identifier, {
      startup: false,
      activationEvent: 'api',
      extensionId: identifier
    })
    const extensionExports = extHostExtensionService.getExtensionExports(identifier)
    return extensionExports
  }

  async function getApi () {
    const extensionExports = (await getExports()) as { vscode: typeof vscode }
    if ('vscode' in extensionExports) {
      return extensionExports.vscode
    }
    throw new Error('You can\' use the extension api if the extension already have an entrypoint defined in the manifest')
  }

  return {
    getApi,
    getExports,
    registerFile: (path: string, getContent: () => Promise<string | Uint8Array>) => {
      const disposable = registerExtensionFile(location, path, getContent)
      disposables.add(disposable)
      return disposable
    },
    registerSyncFile: (path: string, content: string | Uint8Array, mimeType?: string) => {
      const fileDisposable = new DisposableStore()
      fileDisposable.add(registerExtensionFileBlob(location, path, content, mimeType))
      fileDisposable.add(registerExtensionFile(location, path, async () => content))
      disposables.add(fileDisposable)
      return fileDisposable
    },
    dispose () {
      void deltaExtensions([], [extension]).then(() => {
        disposables.dispose()
      })
    },
    async setDefault () {
      setDefaultApi(await getApi())
    }
  }
}

export {
  IExtensionManifest,
  ITranslations,
  IExtensionContributions,
  onExtHostInitialized
}
