import type * as vscode from 'vscode'
import { ExtensionType, IExtension, IExtensionContributions, IExtensionDescription, IExtensionManifest, TargetPlatform } from 'vs/platform/extensions/common/extensions'
import { ExtensionMessageCollector, ExtensionPoint, ExtensionsRegistry, IExtensionPointUser } from 'vs/workbench/services/extensions/common/extensionsRegistry'
import { IExtensionService, IMessage, toExtensionDescription } from 'vs/workbench/services/extensions/common/extensions'
import { URI } from 'vs/base/common/uri'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { getExtensionId } from 'vs/platform/extensionManagement/common/extensionManagementUtil'
import { IDisposable } from 'vs/base/common/lifecycle'
import Severity from 'vs/base/common/severity'
import { ITranslations, localizeManifest } from 'vs/platform/extensionManagement/common/extensionNls'
import { joinPath } from 'vs/base/common/resources'
import { FileAccess } from 'monaco-editor/esm/vs/base/common/network.js'
import { ImplicitActivationEvents } from 'vs/platform/extensionManagement/common/implicitActivationEvents'
import { IActivationEventsReader, LockableExtensionDescriptionRegistry } from 'vs/workbench/services/extensions/common/extensionDescriptionRegistry'
import { registerExtensionFile } from './service-override/files'
import { initialize as initializeExtHostServices, onExtHostInitialized } from './extHost'
import { setDefaultExtension } from './default-extension'
import { SimpleExtensionService } from './missing-services'
import createApi from './createApi'

export function consoleExtensionMessageHandler (msg: IMessage): void {
  if (msg.type === Severity.Error) {
    console.error(msg)
  } else if (msg.type === Severity.Warning) {
    console.warn(msg)
  } else {
    // eslint-disable-next-line no-console
    console.log(msg)
  }
}

export async function initialize (extension?: IExtensionDescription): Promise<void> {
  if (extension != null) {
    setDefaultExtension(extension)
  }

  await initializeExtHostServices()
}

const hasOwnProperty = Object.hasOwnProperty
function handleExtensionPoint<T extends IExtensionContributions[keyof IExtensionContributions]> (extensionPoint: ExtensionPoint<T>, availableExtensions: IExtensionDescription[], messageHandler: (msg: IMessage) => void): void {
  const users: IExtensionPointUser<T>[] = []
  for (const desc of availableExtensions) {
    if ((desc.contributes != null) && hasOwnProperty.call(desc.contributes, extensionPoint.name)) {
      users.push({
        description: desc,
        value: desc.contributes[extensionPoint.name as keyof typeof desc.contributes] as T,
        collector: new ExtensionMessageCollector(messageHandler, desc, extensionPoint.name)
      })
    }
  }
  extensionPoint.acceptUsers(users)
}

class ImplicitActivationAwareReader implements IActivationEventsReader {
  public readActivationEvents (extensionDescription: IExtensionDescription): string[] {
    return ImplicitActivationEvents.readActivationEvents(extensionDescription)
  }
}
const registry = new LockableExtensionDescriptionRegistry(new ImplicitActivationAwareReader())
function doHandleExtensionPoints (affectedExtensions: IExtensionDescription[]): void {
  const affectedExtensionPoints: { [extPointName: string]: boolean } = Object.create(null)
  for (const extensionDescription of affectedExtensions) {
    if (extensionDescription.contributes != null) {
      for (const extPointName in extensionDescription.contributes) {
        if (hasOwnProperty.call(extensionDescription.contributes, extPointName)) {
          affectedExtensionPoints[extPointName] = true
        }
      }
    }
  }

  const availableExtensions = registry.getAllExtensionDescriptions()
  const extensionPoints = ExtensionsRegistry.getExtensionPoints()
  for (const extensionPoint of extensionPoints) {
    if (affectedExtensionPoints[extensionPoint.name] ?? false) {
      handleExtensionPoint(extensionPoint, availableExtensions, consoleExtensionMessageHandler)
    }
  }
}

async function updateExtensionsOnExtHosts (toAdd: IExtensionDescription[], toRemove: IExtensionDescription[]) {
  await (StandaloneServices.get(IExtensionService) as SimpleExtensionService).deltaExtensions({
    toRemove: toRemove.map(ext => ext.identifier),
    toAdd,
    addActivationEvents: ImplicitActivationEvents.createActivationEventsMap(toAdd),
    myToRemove: toRemove.map(ext => ext.identifier),
    myToAdd: toAdd.map(ext => ext.identifier)
  })
}

async function deltaExtensions (toAdd: IExtensionDescription[], toRemove: IExtensionDescription[]) {
  const lock = await registry.acquireLock('handleDeltaExtensions')
  try {
    registry.deltaExtensions(lock, toAdd, toRemove.map(e => e.identifier))
    doHandleExtensionPoints((<IExtensionDescription[]>[]).concat(toAdd).concat(toRemove))

    await updateExtensionsOnExtHosts(toAdd, toRemove)
  } finally {
    lock.dispose()
  }
}

let toAdd: IExtensionDescription[] = []
let toRemove: IExtensionDescription[] = []
let deltaExtensionTimeout: number | undefined

function deltaExtensionsDebounced (_toAdd: IExtensionDescription[], _toRemove: IExtensionDescription[]) {
  toAdd.push(..._toAdd)
  toRemove.push(..._toRemove)
  if (deltaExtensionTimeout != null) {
    window.clearTimeout(deltaExtensionTimeout)
    deltaExtensionTimeout = undefined
  }
  deltaExtensionTimeout = window.setTimeout(() => {
    deltaExtensionTimeout = undefined
    void deltaExtensions(toAdd, toRemove)
    toAdd = []
    toRemove = []
  }, 0)
}

interface RegisterExtensionResult extends IDisposable {
  api: typeof vscode
  registerFile: (path: string, getContent: () => Promise<Uint8Array | string>) => IDisposable
  registerSyncFile: (path: string, content: Uint8Array | string) => IDisposable
  dispose (): void
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

export function registerExtension (manifest: IExtensionManifest, defaultNLS?: ITranslations): RegisterExtensionResult {
  const localizedManifest = defaultNLS != null ? localizeManifest(manifest, defaultNLS) : manifest

  const id = getExtensionId(localizedManifest.publisher, localizedManifest.name)
  const location = URI.from({ scheme: 'extension', authority: id, path: '/' })

  const extension: IExtension = {
    manifest: localizedManifest,
    type: ExtensionType.User,
    isBuiltin: false,
    identifier: { id },
    location,
    targetPlatform: TargetPlatform.WEB,
    isValid: true,
    validations: []
  }
  const extensionDescription = toExtensionDescription(extension)

  void deltaExtensionsDebounced([extensionDescription], [])

  const api = createApi(extensionDescription)

  const disposables = new DisposableStore()

  return {
    api,
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
    }
  }
}

export {
  IExtensionManifest,
  ITranslations,
  IExtensionContributions,
  onExtHostInitialized
}
