import type * as vscode from 'vscode'
import { ExtensionIdentifier, ExtensionType, IExtension, IExtensionContributions, IExtensionDescription, IExtensionManifest, TargetPlatform } from 'vs/platform/extensions/common/extensions'
import { ExtensionMessageCollector, ExtensionPoint, ExtensionsRegistry, IExtensionPointUser } from 'vs/workbench/services/extensions/common/extensionsRegistry'
import { IMessage, toExtensionDescription } from 'vs/workbench/services/extensions/common/extensions'
import { generateUuid } from 'vs/base/common/uuid'
import { URI } from 'vs/base/common/uri'
import { IExtHostExtensionService } from 'vs/workbench/api/common/extHostExtensionService'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { getExtensionId } from 'vs/platform/extensionManagement/common/extensionManagementUtil'
import { IDisposable } from 'vs/base/common/lifecycle'
import Severity from 'vs/base/common/severity'
import { localize } from 'vs/nls'
import { Registry } from 'vs/platform/registry/common/platform'
import { ConfigurationScope, IConfigurationRegistry, Extensions as ConfigurationExtensions } from 'vs/platform/configuration/common/configurationRegistry'
import { ITranslations, localizeManifest } from 'vs/platform/extensionManagement/common/extensionNls'
import { joinPath, originalFSPath } from 'vs/base/common/resources'
import { FileAccess } from 'monaco-editor/esm/vs/base/common/network.js'
import { ExtensionKind, ExtensionMode } from 'vs/workbench/api/common/extHostTypes'
import { ExtensionGlobalMemento, ExtensionMemento } from 'vs/workbench/api/common/extHostMemento'
import { IExtensionModule } from 'vs/workbench/api/common/extHostExtensionActivator'
import * as path from 'vs/base/common/path'
import { IFileService } from 'vs/platform/files/common/files'
import * as api from './api'
import { registerExtensionFile } from './service-override/files'
import createL10nApi from './vscode-services/l10n'
import createLanguagesApi from './vscode-services/languages'
import createCommandsApi from './vscode-services/commands'
import createWorkspaceApi from './vscode-services/workspace'
import createWindowApi from './vscode-services/window'
import createEnvApi from './vscode-services/env'
import createDebugApi from './vscode-services/debug'
import createExtensionsApi from './vscode-services/extensions'
import { initialize as initializeExtHostServices, onExtHostInitialized, getExtHostServices } from './vscode-services/extHost'
import { unsupported } from './tools'

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

// Required or it crashed on extensions with activationEvents
const configurationRegistry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration)
configurationRegistry.registerConfiguration({
  properties: {
    'search.useIgnoreFiles': {
      type: 'boolean',
      markdownDescription: localize('useIgnoreFiles', 'Controls whether to use `.gitignore` and `.ignore` files when searching for files.'),
      default: true,
      scope: ConfigurationScope.RESOURCE
    }
  }
})

let DEFAULT_EXTENSION: IExtensionDescription = {
  identifier: new ExtensionIdentifier('monaco'),
  isBuiltin: true,
  isUserBuiltin: true,
  isUnderDevelopment: false,
  extensionLocation: URI.from({ scheme: 'extension', path: '/' }),
  name: 'monaco',
  publisher: 'microsoft',
  version: '1.0.0',
  engines: {
    vscode: VSCODE_VERSION
  },
  targetPlatform: TargetPlatform.WEB
}

export function getDefaultExtension (): IExtensionDescription {
  return DEFAULT_EXTENSION
}

export async function initialize (extension?: IExtensionDescription): Promise<void> {
  if (extension != null) {
    DEFAULT_EXTENSION = extension
  }

  await initializeExtHostServices()
}

export function createApi (extension: IExtensionDescription): typeof vscode {
  const workspace = createWorkspaceApi(() => extension)
  return {
    ...api,
    extensions: createExtensionsApi(() => extension),
    debug: createDebugApi(() => extension),
    env: createEnvApi(() => extension),
    commands: createCommandsApi(() => extension),
    window: createWindowApi(() => extension, workspace),
    workspace: createWorkspaceApi(() => extension),
    languages: createLanguagesApi(() => extension),
    l10n: createL10nApi(() => extension)
  }
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

function deltaExtensions (toAdd: IExtensionDescription[], toRemove: IExtensionDescription[]) {
  void StandaloneServices.get(IExtHostExtensionService).getExtensionRegistry().then(extensionRegistry => {
    const affectedExtensions = (<IExtensionDescription[]>[]).concat(toAdd).concat(toRemove)
    const affectedExtensionPoints: { [extPointName: string]: boolean } = Object.create(null)
    for (const extensionDescription of affectedExtensions) {
      for (const extPointName in extensionDescription.contributes) {
        if (hasOwnProperty.call(extensionDescription.contributes, extPointName)) {
          affectedExtensionPoints[extPointName] = true
        }
      }
    }

    extensionRegistry.deltaExtensions(toAdd, toRemove.map(ext => ext.identifier))
    const availableExtensions = extensionRegistry.getAllExtensionDescriptions()

    const extensionPoints = ExtensionsRegistry.getExtensionPoints()
    for (const extensionPoint of extensionPoints) {
      if (affectedExtensionPoints[extensionPoint.name] ?? false) {
        handleExtensionPoint(extensionPoint, availableExtensions, consoleExtensionMessageHandler)
      }
    }
  })
}

interface RegisterExtensionResult extends IDisposable {
  api: typeof vscode
  runCode(): Promise<void>
  registerFile: (path: string, getContent: () => Promise<Uint8Array | string>) => IDisposable
  registerSyncFile: (path: string, content: Uint8Array | string) => IDisposable
  dispose (): void
}

const extensionFileBlobUrls = new Map<string, string>()
function registerExtensionFileBlob (extensionLocation: URI, filePath: string, content: string | Uint8Array, mimeType?: string) {
  const blob = new Blob([content instanceof Uint8Array ? content : new TextEncoder().encode(content)], {
    type: mimeType
  })
  extensionFileBlobUrls.set(joinPath(extensionLocation, filePath).toString(), URL.createObjectURL(blob))
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

async function createExtensionContext (extensionDescription: IExtensionDescription): Promise<vscode.ExtensionContext> {
  const { extHostStorage, extHostInitData } = getExtHostServices()

  const globalState = new ExtensionGlobalMemento(extensionDescription, extHostStorage)
  const workspaceState = new ExtensionMemento(extensionDescription.identifier.value, false, extHostStorage)

  await Promise.all([
    globalState.whenReady,
    workspaceState.whenReady
  ])

  return {
    globalState,
    workspaceState,
    get secrets () { return unsupported() },
    subscriptions: [],
    get extensionUri () { return extensionDescription.extensionLocation },
    get extensionPath () { return extensionDescription.extensionLocation.fsPath },
    asAbsolutePath (relativePath: string) { return path.join(extensionDescription.extensionLocation.fsPath, relativePath) },
    get storagePath () { return unsupported() },
    get globalStoragePath () { return unsupported() },
    get logPath () { return path.join(extHostInitData.logsLocation.fsPath, extensionDescription.identifier.value) },
    get logUri () { return URI.joinPath(extHostInitData.logsLocation, extensionDescription.identifier.value) },
    get storageUri () { return unsupported() },
    get globalStorageUri () { return unsupported() },
    extensionMode: ExtensionMode.Production,
    extension: {
      activate: unsupported,
      id: extensionDescription.identifier.value,
      extensionUri: extensionDescription.extensionLocation,
      extensionPath: path.normalize(originalFSPath(extensionDescription.extensionLocation)),
      isActive: true,
      packageJSON: extensionDescription,
      extensionKind: ExtensionKind.UI,
      exports: null
    },
    get environmentVariableCollection () { return unsupported() }
  }
}

export function runExtensionCode (api: typeof vscode, code: string): IExtensionModule {
  // eslint-disable-next-line no-new-func
  const initFn = new Function('module', 'exports', 'require', code)

  const _exports = {}
  const _module = { exports: _exports }
  const _require = (request: string) => {
    if (request === 'vscode') {
      return api
    }
    throw new Error(`Cannot load module '${request}'`)
  }

  initFn(_module, _exports, _require)
  const module: IExtensionModule = (_module.exports !== _exports ? _module.exports : _exports)
  return module
}

export function registerExtension (manifest: IExtensionManifest, defaultNLS?: ITranslations): RegisterExtensionResult {
  const uuid = generateUuid()
  const location = URI.from({ scheme: 'extension', path: `/${uuid}` })

  const localizedManifest = defaultNLS != null ? localizeManifest(manifest, defaultNLS) : manifest

  const extension: IExtension = {
    manifest: localizedManifest,
    type: ExtensionType.User,
    isBuiltin: false,
    identifier: {
      id: getExtensionId(localizedManifest.publisher, localizedManifest.name),
      uuid
    },
    location,
    targetPlatform: TargetPlatform.WEB,
    isValid: true,
    validations: []
  }
  const extensionDescription = toExtensionDescription(extension)

  deltaExtensions([extensionDescription], [])

  const api = createApi(extensionDescription)

  return {
    api,
    async runCode () {
      if (extension.manifest.browser == null) {
        return
      }
      let module = joinPath(location, extension.manifest.browser)
      module = module.with({ path: ensureSuffix(module.path, '.js') })
      const content = (await StandaloneServices.get(IFileService).readFile(module)).value.toString()
      const extensionModule = runExtensionCode(api, content)

      const context = await createExtensionContext(extensionDescription)

      await extensionModule.activate?.(context)
    },
    registerFile: (path: string, getContent: () => Promise<string | Uint8Array>) => {
      return registerExtensionFile(location, path, getContent)
    },
    registerSyncFile: (path: string, content: string | Uint8Array, mimeType?: string) => {
      registerExtensionFileBlob(location, path, content, mimeType)

      return registerExtensionFile(location, path, async () => content)
    },
    dispose () {
      deltaExtensions([], [extensionDescription])
    }
  }
}

function ensureSuffix (path: string, suffix: string): string {
  return path.endsWith(suffix) ? path : path + suffix
}

export {
  IExtensionManifest,
  ITranslations,
  IExtensionContributions,
  onExtHostInitialized
}
