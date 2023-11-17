import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { WorkspaceService } from 'vs/workbench/services/configuration/browser/configurationService'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration'
import { ITextResourceConfigurationService } from 'vs/editor/common/services/textResourceConfiguration'
import { TextResourceConfigurationService } from 'vs/editor/common/services/textResourceConfigurationService'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ConfigurationScope } from 'vscode/src/vs/platform/configuration/common/configurationRegistry'
import { IConfigurationRegistry, Extensions as ConfigurationExtensions, IConfigurationNode, IConfigurationDefaults } from 'vs/platform/configuration/common/configurationRegistry'
import { Registry } from 'vs/platform/registry/common/platform'
import { VSBuffer } from 'vs/base/common/buffer'
import { IFileService, IFileWriteOptions } from 'vs/platform/files/common/files'
import { ILogService } from 'vs/platform/log/common/log'
import { IColorCustomizations, IThemeScopedColorCustomizations } from 'vs/workbench/services/themes/common/workbenchThemeService'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile'
import { IPolicyService } from 'vs/platform/policy/common/policy'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import type * as vscode from 'vscode'
import { IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService'
import { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity'
import { ConfigurationCache } from 'vs/workbench/services/configuration/common/configurationCache'
import { Schemas } from 'vs/base/common/network'
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService'
import { IAnyWorkspaceIdentifier, IEmptyWorkspaceIdentifier, ISingleFolderWorkspaceIdentifier, IWorkspaceContextService, IWorkspaceIdentifier } from 'vs/platform/workspace/common/workspace'
import { LabelService } from 'vs/workbench/services/label/common/labelService'
import { ILabelService } from 'vs/platform/label/common/label'
import { generateUuid } from 'vs/base/common/uuid'
import { IWorkspacesService, IWorkspaceFolderCreationData } from 'vs/platform/workspaces/common/workspaces'
import { BrowserWorkspacesService } from 'vs/workbench/services/workspaces/browser/workspacesService'
import { IWorkspaceEditingService } from 'vs/workbench/services/workspaces/common/workspaceEditing'
import { AbstractWorkspaceEditingService } from 'vs/workbench/services/workspaces/browser/abstractWorkspaceEditingService'
import { URI } from 'vs/base/common/uri'
import 'vs/workbench/api/common/configurationExtensionPoint'
import { IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService'
import getFileServiceOverride, { initFile } from './files'
import { memoizedConstructor, unsupported } from '../tools'
import { registerServiceInitializePreParticipant } from '../lifecycle'
import { getService } from '../services'
import { getWorkspaceIdentifier } from '../workbench'

// This is the default value, but can be overriden by overriding the Environment or UserDataProfileService service
const defaultUserConfigurationFile = URI.from({ scheme: Schemas.vscodeUserData, path: '/User/settings.json' })

/**
 * Should be called only BEFORE the service are initialized to initialize the file on the filesystem before the configuration service initializes
 */
async function initUserConfiguration (configurationJson: string, options?: Partial<IFileWriteOptions>, file: URI = defaultUserConfigurationFile): Promise<void> {
  await initFile(file, configurationJson, options)
}

/**
 * Can be called at any time after the services are initialized to update the user configuration
 */
async function updateUserConfiguration (configurationJson: string): Promise<void> {
  const userDataProfilesService = await getService(IUserDataProfilesService)
  await StandaloneServices.get(IFileService).writeFile(userDataProfilesService.defaultProfile.settingsResource, VSBuffer.fromString(configurationJson))
}

async function getUserConfiguration (): Promise<string> {
  const userDataProfilesService = StandaloneServices.get(IUserDataProfilesService)
  return (await StandaloneServices.get(IFileService).readFile(userDataProfilesService.defaultProfile.settingsResource)).value.toString()
}

function onUserConfigurationChange (callback: () => void): vscode.Disposable {
  const userDataProfilesService = StandaloneServices.get(IUserDataProfilesService)
  return StandaloneServices.get(IFileService).onDidFilesChange(e => {
    if (e.affects(userDataProfilesService.defaultProfile.settingsResource)) {
      callback()
    }
  })
}

const configurationRegistry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration)

class InjectedConfigurationService extends WorkspaceService {
  constructor (
    @IWorkbenchEnvironmentService workbenchEnvironmentService: IBrowserWorkbenchEnvironmentService,
    @IUserDataProfileService userDataProfileService: IUserDataProfileService,
    @IUserDataProfilesService userDataProfilesService: IUserDataProfilesService,
    @IFileService fileService: IFileService,
    @IRemoteAgentService remoteAgentService: IRemoteAgentService,
    @IUriIdentityService uriIdentityService: IUriIdentityService,
    @ILogService logService: ILogService,
    @IPolicyService policyService: IPolicyService
  ) {
    const configurationCache = new ConfigurationCache([Schemas.file, Schemas.vscodeUserData, Schemas.tmp], workbenchEnvironmentService, fileService)
    super({ configurationCache }, workbenchEnvironmentService, userDataProfileService, userDataProfilesService, fileService, remoteAgentService, uriIdentityService, logService, policyService)
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
      await fileService.writeFile(configPath, VSBuffer.fromString(JSON.stringify({
        folders: [
          {
            path: workspace.path
          }
        ]
      })))
    } catch (err) {
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

export async function reinitializeWorkspace (workspace: IAnyWorkspaceIdentifier): Promise<void> {
  const workspaceService = StandaloneServices.get(IWorkspaceContextService) as WorkspaceService
  await workspaceService.initialize(workspace)
}

function getServiceOverride (): IEditorOverrideServices
/**
 * @deprecated Provide workspace via the services `initialize` function `configuration.workspaceProvider` parameter
 */
function getServiceOverride (defaultWorkspace?: URI | IAnyWorkspaceIdentifier): IEditorOverrideServices

function getServiceOverride (defaultWorkspace?: URI | IAnyWorkspaceIdentifier): IEditorOverrideServices {
  _defaultWorkspace = defaultWorkspace

  return {
    ...getFileServiceOverride(),
    [ILabelService.toString()]: new SyncDescriptor(LabelService, undefined, true),
    [IConfigurationService.toString()]: new SyncDescriptor(MemoizedInjectedConfigurationService, [], true),
    [IWorkspaceContextService.toString()]: new SyncDescriptor(MemoizedInjectedConfigurationService, [], true),
    [ITextResourceConfigurationService.toString()]: new SyncDescriptor(TextResourceConfigurationService, [], true),
    [IWorkspaceEditingService.toString()]: new SyncDescriptor(MonacoWorkspaceEditingService, [], true),
    [IWorkspacesService.toString()]: new SyncDescriptor(BrowserWorkspacesService, undefined, true)
  }
}

export default getServiceOverride

export {
  defaultUserConfigurationFile,
  initUserConfiguration,
  updateUserConfiguration,
  getUserConfiguration,
  onUserConfigurationChange,
  configurationRegistry,
  ConfigurationScope,
  IThemeScopedColorCustomizations,
  IColorCustomizations,
  IConfigurationNode,
  IConfigurationDefaults,
  IAnyWorkspaceIdentifier,
  IWorkspaceIdentifier,
  ISingleFolderWorkspaceIdentifier,
  IEmptyWorkspaceIdentifier,
  IWorkspaceFolderCreationData
}
