import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import getCommonServiceOverride, {
  type IAnyWorkspaceIdentifier,
  type IStoredWorkspace,
  type IWorkspaceIdentifier
} from './common'
import { URI } from 'vs/base/common/uri'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace.service'
import { IWorkspaceEditingService } from 'vs/workbench/services/workspaces/common/workspaceEditing.service'
import { memoizedConstructor, unsupported } from '../../tools'
import { getService } from '../../services'
import { generateUuid } from 'vs/base/common/uuid'
import type { IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService.service'
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService.service'
import { IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile.service'
import { AbstractWorkspaceEditingService } from 'vs/workbench/services/workspaces/browser/abstractWorkspaceEditingService'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService.service'
import { WorkspaceService } from 'vs/workbench/services/configuration/browser/configurationService'
import { ConfigurationCache } from 'vs/workbench/services/configuration/common/configurationCache'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile.service'
import { IFileService } from 'vs/platform/files/common/files.service'
import { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity.service'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { ILogService } from 'vs/platform/log/common/log.service'
import { IPolicyService } from 'vs/platform/policy/common/policy.service'
import { Schemas } from 'vs/base/common/network'
import { getWorkbenchConstructionOptions, getWorkspaceIdentifier } from '../../workbench'
import { registerServiceInitializePreParticipant } from '../../lifecycle'
import { VSBuffer } from 'vs/base/common/buffer'
export * from './common'

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
      { configurationCache, remoteAuthority: getWorkbenchConstructionOptions().remoteAuthority },
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
    ...getCommonServiceOverride(),
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
    [IWorkspaceEditingService.toString()]: new SyncDescriptor(
      MonacoWorkspaceEditingService,
      [],
      true
    )
  }
}

export default getServiceOverride
