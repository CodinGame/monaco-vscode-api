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
import { IConfigurationService } from 'vs/platform/configuration/common/configuration.service'
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
import { IPolicyService } from 'vs/platform/policy/common/policy.service'
import { Registry } from 'vs/platform/registry/common/platform'
import { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity.service'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile.service'
import {
  isWorkspaceIdentifier,
  type IAnyWorkspaceIdentifier,
  type IEmptyWorkspaceIdentifier,
  type ISingleFolderWorkspaceIdentifier,
  type IWorkspaceIdentifier
} from 'vs/platform/workspace/common/workspace'
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace.service'
import type {
  IStoredWorkspace,
  IWorkspaceFolderCreationData
} from 'vs/platform/workspaces/common/workspaces'
import { IWorkspacesService } from 'vs/platform/workspaces/common/workspaces.service'
import 'vs/workbench/api/common/configurationExtensionPoint'
import 'vs/workbench/contrib/workspaces/browser/workspaces.contribution'
import { IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService.service'
import { TextResourcePropertiesService } from 'vs/workbench/services/textresourceProperties/common/textResourcePropertiesService'
import type {
  IColorCustomizations,
  IThemeScopedColorCustomizations
} from 'vs/workbench/services/themes/common/workbenchThemeService'
import { BrowserWorkspacesService } from 'vs/workbench/services/workspaces/browser/workspacesService'
import { IWorkspaceEditingService } from 'vs/workbench/services/workspaces/common/workspaceEditing.service'
import { ConfigurationResolverService } from 'vs/workbench/services/configurationResolver/browser/configurationResolverService'
import { IConfigurationResolverService } from 'vs/workbench/services/configurationResolver/common/configurationResolver.service'
import getFileServiceOverride, { initFile } from '../files'
import { getService, withReadyServices } from '../../services'
import { memoizedConstructor } from '../../tools'
import { SessionsWorkspaceContextService } from 'vs/sessions/services/workspace/browser/workspaceContextService'
import { getWorkspaceIdentifier } from '../../workbench'
import { ILogService } from 'vs/platform/log/common/log.service'
import { ConfigurationService } from 'vs/sessions/services/configuration/browser/configurationService'
import { ConfigurationCache } from 'vs/workbench/services/configuration/common/configurationCache'
import { IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile.service'
import 'vs/sessions/contrib/configuration/browser/configuration.contribution'

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

class InjectedSessionsWorkspaceContextService extends SessionsWorkspaceContextService {
  constructor(
    @IBrowserWorkbenchEnvironmentService environmentService: IBrowserWorkbenchEnvironmentService,
    @IUriIdentityService uriIdentityService: IUriIdentityService
  ) {
    const workspaceIdentifier = getWorkspaceIdentifier()
    if (!isWorkspaceIdentifier(workspaceIdentifier)) {
      throw new Error(
        'The session configuration can only be loaded from a workspace configuration file'
      )
    }

    super(workspaceIdentifier, uriIdentityService)
  }
}

const MemoizedInjectedSessionsWorkspaceContextService = memoizedConstructor(
  InjectedSessionsWorkspaceContextService
)

class InjectedConfigurationService extends ConfigurationService {
  constructor(
    @IUserDataProfileService userDataProfileService: IUserDataProfileService,
    @IWorkspaceContextService workspaceService: IWorkspaceContextService,
    @IUriIdentityService uriIdentityService: IUriIdentityService,
    @IFileService fileService: IFileService,
    @IPolicyService policyService: IPolicyService,
    @ILogService logService: ILogService,
    @IBrowserWorkbenchEnvironmentService environmentService: IBrowserWorkbenchEnvironmentService
  ) {
    const configurationCache = new ConfigurationCache(
      [Schemas.file, Schemas.vscodeUserData],
      environmentService,
      fileService
    )
    super(
      userDataProfileService,
      workspaceService,
      uriIdentityService,
      fileService,
      policyService,
      logService,
      configurationCache,
      environmentService
    )
  }
}

function getServiceOverride(): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [IConfigurationService.toString()]: new SyncDescriptor(InjectedConfigurationService, [], true),
    [IWorkspaceContextService.toString()]: new SyncDescriptor(
      MemoizedInjectedSessionsWorkspaceContextService,
      [],
      true
    ),
    [IWorkspaceEditingService.toString()]: new SyncDescriptor(
      MemoizedInjectedSessionsWorkspaceContextService,
      [],
      true
    ),
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

export default getServiceOverride

export {
  ConfigurationScope,
  configurationRegistry,
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
