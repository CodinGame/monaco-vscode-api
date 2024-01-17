import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { BrowserWorkingCopyBackupService } from 'vs/workbench/services/workingCopy/browser/workingCopyBackupService'
import { IWorkingCopyBackupService } from 'vs/workbench/services/workingCopy/common/workingCopyBackup'
import { IWorkingCopyService, WorkingCopyService } from 'vs/workbench/services/workingCopy/common/workingCopyService'
import { IWorkingCopyEditorService, WorkingCopyEditorService } from 'vs/workbench/services/workingCopy/common/workingCopyEditorService'
import { IWorkingCopyHistoryService } from 'vs/workbench/services/workingCopy/common/workingCopyHistory'
import { BrowserWorkingCopyHistoryService } from 'vs/workbench/services/workingCopy/browser/workingCopyHistoryService'
import getFileServiceOverride from './files'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [IWorkingCopyBackupService.toString()]: new SyncDescriptor(BrowserWorkingCopyBackupService, [], false),
    [IWorkingCopyService.toString()]: new SyncDescriptor(WorkingCopyService, [], false),
    [IWorkingCopyEditorService.toString()]: new SyncDescriptor(WorkingCopyEditorService, [], false),
    [IWorkingCopyHistoryService.toString()]: new SyncDescriptor(BrowserWorkingCopyHistoryService, [], false)

  }
}
