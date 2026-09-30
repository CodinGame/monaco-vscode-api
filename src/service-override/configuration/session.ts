import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import getCommonServiceOverride from './common'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration.service'
import { SessionsWorkspaceContextService } from 'vs/sessions/services/workspace/browser/workspaceContextService'
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace.service'
import { IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService.service'
import { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity.service'
import { getWorkspaceIdentifier } from '../../workbench'
import { isWorkspaceIdentifier } from 'vs/platform/workspace/common/workspace'
import { memoizedConstructor } from '../../tools'
import { IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile.service'
import { IFileService } from 'vs/platform/files/common/files.service'
import { IPolicyService } from 'vs/platform/policy/common/policy.service'
import { ConfigurationCache } from 'vs/workbench/services/configuration/common/configurationCache'
import { ILogService } from 'vs/platform/log/common/log.service'
import { Schemas } from 'vs/base/common/network'
import { ConfigurationService } from 'vs/sessions/services/configuration/browser/configurationService'
import { IWorkspaceEditingService } from 'vs/workbench/services/workspaces/common/workspaceEditing.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
export * from './common'
import 'vs/sessions/contrib/configuration/browser/configuration.contribution'
import { registerServiceInitializePreParticipant } from '../../lifecycle'

class InjectedSessionsWorkspaceContextService extends SessionsWorkspaceContextService {
  constructor(@IUriIdentityService uriIdentityService: IUriIdentityService) {
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

registerServiceInitializePreParticipant(async (accessor) => {
  await (accessor.get(IConfigurationService) as ConfigurationService).initialize()
})

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride(),
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
    )
  }
}
