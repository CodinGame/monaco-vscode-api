import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IUserDataSyncStoreManagementService } from 'vs/platform/userDataSync/common/userDataSync.service'
import { BrowserUserDataProfilesService } from 'vs/platform/userDataProfile/browser/userDataProfile'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile.service'
import { IUserDataInitializer, UserDataInitializationService } from 'vs/workbench/services/userData/browser/userDataInit'
import { IUserDataInitializationService } from 'vs/workbench/services/userData/browser/userDataInit.service'
import { UserDataSyncInitializer } from 'vs/workbench/services/userDataSync/browser/userDataSyncInit'
import { UserDataProfileInitializer } from 'vs/workbench/services/userDataProfile/browser/userDataProfileInit'
import { IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService.service'
import { ISecretStorageService } from 'vs/platform/secrets/common/secrets.service'
import { IFileService } from 'vs/platform/files/common/files.service'
import { IStorageService } from 'vs/platform/storage/common/storage.service'
import { IProductService } from 'vs/platform/product/common/productService.service'
import { IRequestService } from 'vs/platform/request/common/request.service'
import { ILogService } from 'vs/platform/log/common/log.service'
import { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity.service'
import { IUserDataProfileImportExportService, IUserDataProfileManagementService, IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile.service'
import { mark } from 'vs/base/common/performance'
import type { WorkspaceService } from 'vs/workbench/services/configuration/browser/configurationService'
import { timeout } from 'vs/base/common/async'
import { IWorkbenchConfigurationService } from 'vs/workbench/services/configuration/common/configuration.service'
import { UserDataProfileImportExportService } from 'vs/workbench/services/userDataProfile/browser/userDataProfileImportExportService'
import { UserDataProfileManagementService } from 'vs/workbench/services/userDataProfile/browser/userDataProfileManagement'
import { IUserDataProfileStorageService } from 'vs/platform/userDataProfile/common/userDataProfileStorageService.service'
import { UserDataProfileStorageService } from 'vs/workbench/services/userDataProfile/browser/userDataProfileStorageService'
import { UserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfileService'
import { IAnyWorkspaceIdentifier } from 'vs/platform/workspace/common/workspace'
import { IUserDataProfile } from 'vs/platform/userDataProfile/common/userDataProfile'
import { registerServiceInitializePostParticipant } from '../lifecycle'
import { getWorkspaceIdentifier } from '../workbench'
import 'vs/workbench/contrib/userDataProfile/browser/userDataProfile.contribution'

function isWorkspaceService (configurationService: IWorkbenchConfigurationService): configurationService is WorkspaceService {
  return 'reloadLocalUserConfiguration' in configurationService
}

async function initializeUserData (userDataInitializationService: UserDataInitializationService, configurationService: IWorkbenchConfigurationService) {
  if (await userDataInitializationService.requiresInitialization()) {
    mark('code/willInitRequiredUserData')

    // Initialize required resources - settings & global state
    await userDataInitializationService.initializeRequiredResources()

    // Important: Reload only local user configuration after initializing
    // Reloading complete configuration blocks workbench until remote configuration is loaded.
    if (isWorkspaceService(configurationService)) {
      await configurationService.reloadLocalUserConfiguration()
    }

    mark('code/didInitRequiredUserData')
  }
}

registerServiceInitializePostParticipant(async accessor => {
  try {
    await Promise.race([
      // Do not block more than 5s
      timeout(5000),
      initializeUserData(accessor.get(IUserDataInitializationService) as UserDataInitializationService, accessor.get(IWorkbenchConfigurationService))]
    )
  } catch (error) {
    accessor.get(ILogService).error(error as Error)
  }
})

class InjectedUserDataInitializationService extends UserDataInitializationService {
  constructor (
    @IBrowserWorkbenchEnvironmentService environmentService: IBrowserWorkbenchEnvironmentService,
    @ISecretStorageService secretStorageService: ISecretStorageService,
    @IUserDataSyncStoreManagementService userDataSyncStoreManagementService: IUserDataSyncStoreManagementService,
    @IFileService fileService: IFileService,
    @IUserDataProfilesService userDataProfilesService: IUserDataProfilesService,
    @IStorageService storageService: IStorageService,
    @IProductService productService: IProductService,
    @IRequestService requestService: IRequestService,
    @ILogService logService: ILogService,
    @IUriIdentityService uriIdentityService: IUriIdentityService,
    @IUserDataProfileService userDataProfileService: IUserDataProfileService
  ) {
    const userDataInitializers: IUserDataInitializer[] = []
    userDataInitializers.push(new UserDataSyncInitializer(environmentService, secretStorageService, userDataSyncStoreManagementService, fileService, userDataProfilesService, storageService, productService, requestService, logService, uriIdentityService))
    if (environmentService.options?.profile != null) {
      userDataInitializers.push(new UserDataProfileInitializer(environmentService, fileService, userDataProfileService, storageService, logService, uriIdentityService, requestService))
    }

    super(userDataInitializers)
  }
}

function getCurrentProfile (workspace: IAnyWorkspaceIdentifier, userDataProfilesService: BrowserUserDataProfilesService, environmentService: IBrowserWorkbenchEnvironmentService): IUserDataProfile {
  if (environmentService.options?.profile != null) {
    const profile = userDataProfilesService.profiles.find(p => p.name === environmentService.options?.profile?.name)
    if (profile != null) {
      return profile
    }
    return userDataProfilesService.defaultProfile
  }
  return userDataProfilesService.getProfileForWorkspace(workspace) ?? userDataProfilesService.defaultProfile
}

class InjectedUserDataProfileService extends UserDataProfileService {
  constructor (
    @IBrowserWorkbenchEnvironmentService environmentService: IBrowserWorkbenchEnvironmentService,
    @IUserDataProfilesService userDataProfilesService: BrowserUserDataProfilesService,
    @ILogService logService: ILogService
  ) {
    const workspace = getWorkspaceIdentifier()
    const profile = getCurrentProfile(workspace, userDataProfilesService, environmentService)
    super(profile)

    if (profile === userDataProfilesService.defaultProfile && environmentService.options?.profile != null) {
      userDataProfilesService.createNamedProfile(environmentService.options.profile.name, undefined, workspace).then(async (profile) => {
        await this.updateCurrentProfile(profile)
      }).catch(err => {
        logService.error(err)
      })
    }
  }
}

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IUserDataProfileService.toString()]: new SyncDescriptor(InjectedUserDataProfileService, [], true),
    [IUserDataProfilesService.toString()]: new SyncDescriptor(BrowserUserDataProfilesService, [], true),
    [IUserDataInitializationService.toString()]: new SyncDescriptor(InjectedUserDataInitializationService, [], true),
    [IUserDataProfileImportExportService.toString()]: new SyncDescriptor(UserDataProfileImportExportService, [], true),
    [IUserDataProfileManagementService.toString()]: new SyncDescriptor(UserDataProfileManagementService, [], true),
    [IUserDataProfileStorageService.toString()]: new SyncDescriptor(UserDataProfileStorageService, [], true)
  }
}
