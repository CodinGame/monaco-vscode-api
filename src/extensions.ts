import type * as vscode from 'vscode'
import { ExtensionType, IExtension, IExtensionContributions, IExtensionDescription, IExtensionManifest, TargetPlatform } from 'vs/platform/extensions/common/extensions'
import { ExtensionMessageCollector, ExtensionPoint, ExtensionsRegistry, IExtensionPointUser } from 'vs/workbench/services/extensions/common/extensionsRegistry'
import { IMessage, toExtensionDescription } from 'vs/workbench/services/extensions/common/extensions'
import { Disposable } from 'vs/workbench/api/common/extHostTypes'
import { generateUuid } from 'vs/base/common/uuid'
import { URI } from 'vs/base/common/uri'
import { IExtHostExtensionService } from 'vs/workbench/api/common/extHostExtensionService'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { getExtensionId } from 'vs/platform/extensionManagement/common/extensionManagementUtil'
import * as api from './api'
import { consoleExtensionMessageHandler } from './service-override/tools'
import { registerExtensionFile } from './service-override/files'
import createLanguagesApi from './vscode-services/languages'
import createCommandsApi from './vscode-services/commands'
import createWorkspaceApi from './vscode-services/workspace'
import createWindowApi from './vscode-services/window'
import createEnvApi from './vscode-services/env'
import createDebugApi from './vscode-services/debug'
import createExtensionsApi from './vscode-services/extensions'

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
    languages: createLanguagesApi(() => extension)
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

interface RegisterExtensionResult {
  api: typeof vscode
  registerFile: (path: string, getContent: () => Promise<string>) => Disposable
}
export function registerExtension (manifest: IExtensionManifest): RegisterExtensionResult {
  const uuid = generateUuid()
  const location = URI.from({ scheme: 'extension', path: `/${uuid}` })

  const extension: IExtension = {
    manifest,
    type: ExtensionType.User,
    isBuiltin: false,
    identifier: {
      id: getExtensionId(manifest.publisher, manifest.name),
      uuid
    },
    location,
    targetPlatform: TargetPlatform.WEB,
    isValid: true,
    validations: []
  }
  const extensionDescription = toExtensionDescription(extension)

  void StandaloneServices.get(IExtHostExtensionService).getExtensionRegistry().then(extensionRegistry => {
    extensionRegistry.deltaExtensions([extensionDescription], [])

    const availableExtensions = extensionRegistry.getAllExtensionDescriptions()

    const extensionPoints = ExtensionsRegistry.getExtensionPoints()
    for (const extensionPoint of extensionPoints) {
      if (Object.hasOwnProperty.call(extensionDescription.contributes, extensionPoint.name)) {
        handleExtensionPoint(extensionPoint, availableExtensions, consoleExtensionMessageHandler)
      }
    }
  })

  return {
    api: createApi(extensionDescription),
    registerFile: (path: string, getContent: () => Promise<string>) => {
      return registerExtensionFile(location, path, getContent)
    }
  }
}

export {
  IExtensionManifest
}
