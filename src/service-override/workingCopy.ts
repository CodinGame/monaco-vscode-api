import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IWorkingCopyBackupService } from 'vs/workbench/services/workingCopy/common/workingCopyBackup.service'
import { WorkingCopyService } from 'vs/workbench/services/workingCopy/common/workingCopyService'
import { IWorkingCopyService } from 'vs/workbench/services/workingCopy/common/workingCopyService.service'
import { WorkingCopyEditorService } from 'vs/workbench/services/workingCopy/common/workingCopyEditorService'
import { IWorkingCopyEditorService } from 'vs/workbench/services/workingCopy/common/workingCopyEditorService.service'
import { IWorkingCopyHistoryService } from 'vs/workbench/services/workingCopy/common/workingCopyHistory.service'
import { BrowserWorkingCopyHistoryService } from 'vs/workbench/services/workingCopy/browser/workingCopyHistoryService'
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace.service'
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService.service'
import { IFileService } from 'vs/platform/files/common/files.service'
import { ILogService } from 'vs/platform/log/common/log.service'
import { joinPath } from 'vs/base/common/resources'
import { WorkingCopyBackupService } from 'vs/workbench/services/workingCopy/common/workingCopyBackupService'
import getFileServiceOverride from './files'

class BrowserWorkingCopyBackupService extends WorkingCopyBackupService {
  constructor(
    memory: boolean,
    @IWorkspaceContextService contextService: IWorkspaceContextService,
    @IWorkbenchEnvironmentService environmentService: IWorkbenchEnvironmentService,
    @IFileService fileService: IFileService,
    @ILogService logService: ILogService
  ) {
    super(
      memory
        ? undefined
        : joinPath(
            environmentService.userRoamingDataHome,
            'Backups',
            contextService.getWorkspace().id
          ),
      fileService,
      logService
    )
  }
}

interface WorkingCopyServiceOptions {
  storage?: 'memory' | 'userData' | null
}

export default function getServiceOverride({
  storage = 'userData'
}: WorkingCopyServiceOptions = {}): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    ...(storage != null
      ? {
          [IWorkingCopyBackupService.toString()]: new SyncDescriptor(
            BrowserWorkingCopyBackupService,
            [storage === 'memory'],
            false
          )
        }
      : {}),
    [IWorkingCopyService.toString()]: new SyncDescriptor(WorkingCopyService, [], false),
    [IWorkingCopyEditorService.toString()]: new SyncDescriptor(WorkingCopyEditorService, [], false),
    [IWorkingCopyHistoryService.toString()]: new SyncDescriptor(
      BrowserWorkingCopyHistoryService,
      [],
      false
    )
  }
}
