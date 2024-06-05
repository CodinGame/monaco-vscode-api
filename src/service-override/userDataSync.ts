import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IUserDataAutoSyncService, IUserDataSyncEnablementService, IUserDataSyncLocalStoreService, IUserDataSyncLogService, IUserDataSyncResourceProviderService, IUserDataSyncService, IUserDataSyncStoreManagementService, IUserDataSyncStoreService, IUserDataSyncUtilService } from 'vs/platform/userDataSync/common/userDataSync.service'
import { UserDataSyncAccountService } from 'vs/platform/userDataSync/common/userDataSyncAccount'
import { IUserDataSyncAccountService } from 'vs/platform/userDataSync/common/userDataSyncAccount.service'
import { UserDataSyncMachinesService } from 'vs/platform/userDataSync/common/userDataSyncMachines'
import { IUserDataSyncMachinesService } from 'vs/platform/userDataSync/common/userDataSyncMachines.service'
import { UserDataSyncStoreManagementService, UserDataSyncStoreService } from 'vs/platform/userDataSync/common/userDataSyncStoreService'
import { UserDataAutoSyncService } from 'vs/platform/userDataSync/common/userDataAutoSyncService'
import { WebUserDataSyncEnablementService } from 'vs/workbench/services/userDataSync/browser/webUserDataSyncEnablementService'
import { UserDataSyncService } from 'vs/platform/userDataSync/common/userDataSyncService'
import { UserDataSyncLogService } from 'vs/platform/userDataSync/common/userDataSyncLog'
import { UserDataSyncResourceProviderService } from 'vs/platform/userDataSync/common/userDataSyncResourceProvider'
import { UserDataSyncLocalStoreService } from 'vs/platform/userDataSync/common/userDataSyncLocalStoreService'
import { UserDataSyncWorkbenchService } from 'vs/workbench/services/userDataSync/browser/userDataSyncWorkbenchService'
import { IUserDataSyncWorkbenchService } from 'vs/workbench/services/userDataSync/common/userDataSync.service'
import { UserDataSyncUtilService } from 'vs/workbench/services/userDataSync/common/userDataSyncUtil'
import getUserDataProfileServiceOverride from './userDataProfile'
import 'vs/workbench/contrib/userDataSync/browser/userDataSync.contribution'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getUserDataProfileServiceOverride(),
    [IUserDataAutoSyncService.toString()]: new SyncDescriptor(UserDataAutoSyncService, [], true),
    [IUserDataSyncStoreManagementService.toString()]: new SyncDescriptor(UserDataSyncStoreManagementService, [], true),
    [IUserDataSyncStoreService.toString()]: new SyncDescriptor(UserDataSyncStoreService, [], true),
    [IUserDataSyncEnablementService.toString()]: new SyncDescriptor(WebUserDataSyncEnablementService, [], true),
    [IUserDataSyncService.toString()]: new SyncDescriptor(UserDataSyncService, [], true),
    [IUserDataSyncLogService.toString()]: new SyncDescriptor(UserDataSyncLogService, [], true),
    [IUserDataSyncAccountService.toString()]: new SyncDescriptor(UserDataSyncAccountService, [], true),
    [IUserDataSyncMachinesService.toString()]: new SyncDescriptor(UserDataSyncMachinesService, [], true),
    [IUserDataSyncResourceProviderService.toString()]: new SyncDescriptor(UserDataSyncResourceProviderService, [], true),
    [IUserDataSyncLocalStoreService.toString()]: new SyncDescriptor(UserDataSyncLocalStoreService, [], true),
    [IUserDataSyncWorkbenchService.toString()]: new SyncDescriptor(UserDataSyncWorkbenchService, [], true),
    [IUserDataSyncUtilService.toString()]: new SyncDescriptor(UserDataSyncUtilService, [], true)
  }
}
