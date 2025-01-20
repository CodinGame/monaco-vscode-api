import { VSBuffer } from 'vs/base/common/buffer'
import type { IDisposable } from 'vs/base/common/lifecycle'
import { Schemas } from 'vs/base/common/network'
import { URI } from 'vs/base/common/uri'
import { generateUuid } from 'vs/base/common/uuid'
import {
  ITextResourceConfigurationService,
  ITextResourcePropertiesService
} from 'vs/editor/common/services/textResourceConfiguration'
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
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { ILogService } from 'vs/platform/log/common/log.service'
import { IPolicyService } from 'vs/platform/policy/common/policy.service'
import { Registry } from 'vs/platform/registry/common/platform'
import { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity.service'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile.service'
import type {
  IAnyWorkspaceIdentifier,
  IEmptyWorkspaceIdentifier,
  ISingleFolderWorkspaceIdentifier,
  IWorkspaceIdentifier
} from 'vs/platform/workspace/common/workspace'
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace.service'
import type {
  IStoredWorkspace,
  IWorkspaceFolderCreationData
} from 'vs/platform/workspaces/common/workspaces'
import { IWorkspacesService } from 'vs/platform/workspaces/common/workspaces.service'
import 'vs/workbench/api/common/configurationExtensionPoint'
import 'vs/workbench/contrib/workspaces/browser/workspaces.contribution'
import { WorkspaceService } from 'vs/workbench/services/configuration/browser/configurationService'
import { ConfigurationCache } from 'vs/workbench/services/configuration/common/configurationCache'
import { IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService.service'
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService.service'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService.service'
import { TextResourcePropertiesService } from 'vs/workbench/services/textresourceProperties/common/textResourcePropertiesService'
import type {
  IColorCustomizations,
  IThemeScopedColorCustomizations
} from 'vs/workbench/services/themes/common/workbenchThemeService'
import { IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile.service'
import { AbstractWorkspaceEditingService } from 'vs/workbench/services/workspaces/browser/abstractWorkspaceEditingService'
import { BrowserWorkspacesService } from 'vs/workbench/services/workspaces/browser/workspacesService'
import { IWorkspaceEditingService } from 'vs/workbench/services/workspaces/common/workspaceEditing.service'
import { ConfigurationResolverService } from 'vs/workbench/services/configurationResolver/browser/configurationResolverService'
import { IConfigurationResolverService } from 'vs/workbench/services/configurationResolver/common/configurationResolver.service'
import getFileServiceOverride, { initFile } from './files'
import { registerServiceInitializePreParticipant } from '../lifecycle'
import { getService, withReadyServices } from '../services'
import { memoizedConstructor, unsupported } from '../tools'
import { getWorkspaceIdentifier } from '../workbench'

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

class InjectedConfigurationService extends WorkspaceService {
  constructor(
    @IWorkbenchEnvironmentService workbenchEnvironmentService: IBrowserWorkbenchEnvironmentService,
    @IUserDataProfileService userDataProfileService: IUserDataProfileService,
    @IUserDataProfilesService userDataProfilesService: IUserDataProfilesService,
    @IFileService fileService: IFileService,
    @IRemoteAgentService remoteAgentService: IRemoteAgentService,
    @IUriIdentityService uriIdentityService: IUriIdentityService,
    @ILogService logService: ILogService,
    @IPolicyService policyService: IPolicyService
  ) {
    const configurationCache = new ConfigurationCache(
      [Schemas.file, Schemas.vscodeUserData, Schemas.tmp],
      workbenchEnvironmentService,
      fileService
    )
    super(
      { configurationCache },
      workbenchEnvironmentService,
      userDataProfileService,
      userDataProfilesService,
      fileService,
      remoteAgentService,
      uriIdentityService,
      logService,
      policyService
    )
  }
}

class MonacoWorkspaceEditingService extends AbstractWorkspaceEditingService {
  enterWorkspace = unsupported
}

/**
 * @deprecated
 */
let _defaultWorkspace: URI | IAnyWorkspaceIdentifier | undefined
registerServiceInitializePreParticipant(async (accessor) => {
  const workspaceService = accessor.get(IWorkspaceContextService) as WorkspaceService
  workspaceService.acquireInstantiationService(accessor.get(IInstantiationService))

  const workspace = _defaultWorkspace ?? getWorkspaceIdentifier()
  if (URI.isUri(workspace)) {
    const configPath = workspace.with({ path: '/workspace.code-workspace' })
    try {
      const fileService = accessor.get(IFileService)
      // Create the directory in the memory filesystem to prevent a warn log
      await fileService.createFolder(workspace)
      await fileService.writeFile(
        configPath,
        VSBuffer.fromString(
          JSON.stringify(<IStoredWorkspace>{
            folders: [
              {
                path: workspace.path
              }
            ]
          })
        )
      )
    } catch {
      // ignore
    }

    await workspaceService.initialize(<IWorkspaceIdentifier>{
      id: generateUuid(),
      configPath
    })
  } else {
    await workspaceService.initialize(workspace)
  }
})

const MemoizedInjectedConfigurationService = memoizedConstructor(InjectedConfigurationService)

export async function reinitializeWorkspace(workspace: IAnyWorkspaceIdentifier): Promise<void> {
  const workspaceService = (await getService(IWorkspaceContextService)) as WorkspaceService
  await workspaceService.initialize(workspace)
}

function getServiceOverride(): IEditorOverrideServices
/**
 * @deprecated Provide workspace via the services `initialize` function `configuration.workspaceProvider` parameter
 */
function getServiceOverride(
  defaultWorkspace?: URI | IAnyWorkspaceIdentifier
): IEditorOverrideServices

function getServiceOverride(
  defaultWorkspace?: URI | IAnyWorkspaceIdentifier
): IEditorOverrideServices {
  _defaultWorkspace = defaultWorkspace

  return {
    ...getFileServiceOverride(),
    [IConfigurationService.toString()]: new SyncDescriptor(
      MemoizedInjectedConfigurationService,
      [],
      true
    ),
    [IWorkspaceContextService.toString()]: new SyncDescriptor(
      MemoizedInjectedConfigurationService,
      [],
      true
    ),
    [ITextResourceConfigurationService.toString()]: new SyncDescriptor(
      TextResourceConfigurationService,
      [],
      true
    ),
    [IWorkspaceEditingService.toString()]: new SyncDescriptor(
      MonacoWorkspaceEditingService,
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
