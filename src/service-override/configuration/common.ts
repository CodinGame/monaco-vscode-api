import { VSBuffer } from 'vs/base/common/buffer'
import type { IDisposable } from 'vs/base/common/lifecycle'
import { Schemas } from 'vs/base/common/network'
import { URI } from 'vs/base/common/uri'
import {
  ITextResourceConfigurationService,
  ITextResourcePropertiesService
} from 'vs/editor/common/services/textResourceConfiguration.service'
import { TextResourceConfigurationService } from 'vs/editor/common/services/textResourceConfigurationService'
import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import {
  Extensions as ConfigurationExtensions,
  ConfigurationScope,
  type IConfigurationDefaults,
  type IConfigurationNode,
  type IConfigurationRegistry
} from 'vs/platform/configuration/common/configurationRegistry'
import type { IFileWriteOptions } from 'vs/platform/files/common/files'
import { IFileService } from 'vs/platform/files/common/files.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { Registry } from 'vs/platform/registry/common/platform'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile.service'
import type {
  IAnyWorkspaceIdentifier,
  IEmptyWorkspaceIdentifier,
  ISingleFolderWorkspaceIdentifier,
  IWorkspaceIdentifier
} from 'vs/platform/workspace/common/workspace'
import type {
  IStoredWorkspace,
  IWorkspaceFolderCreationData
} from 'vs/platform/workspaces/common/workspaces'
import { IWorkspacesService } from 'vs/platform/workspaces/common/workspaces.service'
import { ConfigurationResolverService } from 'vs/workbench/services/configurationResolver/browser/configurationResolverService'
import { IConfigurationResolverService } from 'vs/workbench/services/configurationResolver/common/configurationResolver.service'
import { TextResourcePropertiesService } from 'vs/workbench/services/textresourceProperties/common/textResourcePropertiesService'
import type {
  IColorCustomizations,
  IThemeScopedColorCustomizations
} from 'vs/workbench/services/themes/common/workbenchThemeService'
import { BrowserWorkspacesService } from 'vs/workbench/services/workspaces/browser/workspacesService'
import { getService, withReadyServices } from '../../services'
import getFileServiceOverride, { initFile } from '../files'
import 'vs/workbench/api/common/configurationExtensionPoint'
import 'vs/workbench/contrib/workspaces/browser/workspaces.contribution'

// This is the default value, but can be overriden by overriding the Environment or UserDataProfileService service
const defaultUserConfigurationFile = URI.from({
  scheme: Schemas.vscodeUserData,
  path: '/User/settings.json'
})

/**
 * Should be called only BEFORE the service are initialized to initialize the file on the filesystem before the configuration service initializes
 */
async function initUserConfiguration(
  configurationJson: string,
  options?: Partial<IFileWriteOptions>,
  file: URI = defaultUserConfigurationFile
): Promise<void> {
  await initFile(file, configurationJson, options)
}

/**
 * Can be called at any time after the services are initialized to update the user configuration
 */
async function updateUserConfiguration(configurationJson: string): Promise<void> {
  const userDataProfilesService = await getService(IUserDataProfilesService)
  const fileService = await getService(IFileService)
  await fileService.writeFile(
    userDataProfilesService.defaultProfile.settingsResource,
    VSBuffer.fromString(configurationJson)
  )
}

async function getUserConfiguration(): Promise<string> {
  const userDataProfilesService = await getService(IUserDataProfilesService)
  const fileService = await getService(IFileService)
  return (
    await fileService.readFile(userDataProfilesService.defaultProfile.settingsResource)
  ).value.toString()
}

function onUserConfigurationChange(callback: () => void): IDisposable {
  return withReadyServices((accessor) => {
    const userDataProfilesService = accessor.get(IUserDataProfilesService)
    return accessor.get(IFileService).onDidFilesChange((e) => {
      if (e.affects(userDataProfilesService.defaultProfile.settingsResource)) {
        callback()
      }
    })
  })
}

const configurationRegistry = Registry.as<IConfigurationRegistry>(
  ConfigurationExtensions.Configuration
)

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [ITextResourceConfigurationService.toString()]: new SyncDescriptor(
      TextResourceConfigurationService,
      [],
      true
    ),
    [IWorkspacesService.toString()]: new SyncDescriptor(BrowserWorkspacesService, [], true),
    [ITextResourcePropertiesService.toString()]: new SyncDescriptor(
      TextResourcePropertiesService,
      [],
      true
    ),
    [IConfigurationResolverService.toString()]: new SyncDescriptor(
      ConfigurationResolverService,
      [],
      true
    )
  }
}

export {
  configurationRegistry,
  ConfigurationScope,
  defaultUserConfigurationFile,
  getUserConfiguration,
  initUserConfiguration,
  onUserConfigurationChange,
  updateUserConfiguration
}
export type {
  IAnyWorkspaceIdentifier,
  IColorCustomizations,
  IConfigurationDefaults,
  IConfigurationNode,
  IEmptyWorkspaceIdentifier,
  ISingleFolderWorkspaceIdentifier,
  IStoredWorkspace,
  IThemeScopedColorCustomizations,
  IWorkspaceFolderCreationData,
  IWorkspaceIdentifier
}
