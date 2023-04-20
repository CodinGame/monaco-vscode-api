import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { WorkspaceService } from 'vs/workbench/services/configuration/browser/configurationService'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration'
import { ITextResourceConfigurationService } from 'vs/editor/common/services/textResourceConfiguration'
import { TextResourceConfigurationService } from 'vs/editor/common/services/textResourceConfigurationService'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IConfigurationRegistry, Extensions as ConfigurationExtensions, ConfigurationScope, IConfigurationNode, IConfigurationDefaults } from 'vs/platform/configuration/common/configurationRegistry'
import { Registry } from 'vs/platform/registry/common/platform'
import { VSBuffer } from 'vs/base/common/buffer'
import { IFileService } from 'vs/platform/files/common/files'
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
import { IAnyWorkspaceIdentifier, ISingleFolderWorkspaceIdentifier, IWorkspaceContextService } from 'vs/platform/workspace/common/workspace'
import { LabelService } from 'vs/workbench/services/label/common/labelService'
import { ILabelService } from 'vs/platform/label/common/label'
import { generateUuid } from 'vs/base/common/uuid'
import { IWorkspacesService, IWorkspaceFolderCreationData } from 'vs/platform/workspaces/common/workspaces'
import { BrowserWorkspacesService } from 'vs/workbench/services/workspaces/browser/workspacesService'
import { IWorkspaceEditingService } from 'vs/workbench/services/workspaces/common/workspaceEditing'
import { AbstractWorkspaceEditingService } from 'vs/workbench/services/workspaces/browser/abstractWorkspaceEditingService'
import { URI } from 'vs/base/common/uri'
import 'vs/workbench/api/common/configurationExtensionPoint'
import getFileServiceOverride from './files'
import { memoizedConstructor } from '../tools'
import { registerServiceInitializeParticipant } from '../services'

async function updateUserConfiguration (configurationJson: string): Promise<void> {
  const userDataProfilesService = StandaloneServices.get(IUserDataProfilesService)
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
    @IWorkbenchEnvironmentService workbenchEnvironmentService: IWorkbenchEnvironmentService,
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
  async enterWorkspace (): Promise<void> {
    // do nothing
  }
}

let _defaultWorkspaceUri = URI.file('/workspace')
registerServiceInitializeParticipant(async (accessor) => {
  const workspaceService = accessor.get(IWorkspaceContextService) as WorkspaceService
  workspaceService.acquireInstantiationService(accessor.get(IInstantiationService))
  try {
    // Create the directory in the memory filesystem to prevent a warn log
    await accessor.get(IFileService).createFolder(_defaultWorkspaceUri)
  } catch (err) {
    // ignore
  }
  await workspaceService.initialize(<ISingleFolderWorkspaceIdentifier>{
    id: generateUuid(),
    uri: _defaultWorkspaceUri
  })
})

const MemoizedInjectedConfigurationService = memoizedConstructor(InjectedConfigurationService)

export default function getServiceOverride (defaultWorkspaceUri: URI): IEditorOverrideServices {
  _defaultWorkspaceUri = defaultWorkspaceUri

  return {
    ...getFileServiceOverride(),
    [ILabelService.toString()]: new SyncDescriptor(LabelService, undefined, true),
    [IConfigurationService.toString()]: new SyncDescriptor(MemoizedInjectedConfigurationService),
    [IWorkspaceContextService.toString()]: new SyncDescriptor(MemoizedInjectedConfigurationService),
    [ITextResourceConfigurationService.toString()]: new SyncDescriptor(TextResourceConfigurationService),
    [IWorkspaceEditingService.toString()]: new SyncDescriptor(MonacoWorkspaceEditingService),
    [IWorkspacesService.toString()]: new SyncDescriptor(BrowserWorkspacesService, undefined, true)
  }
}

export {
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
  IWorkspaceFolderCreationData
}
