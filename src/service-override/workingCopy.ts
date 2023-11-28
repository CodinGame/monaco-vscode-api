import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { BrowserWorkingCopyBackupService } from 'vs/workbench/services/workingCopy/browser/workingCopyBackupService'
import { IWorkingCopyBackupService } from 'vs/workbench/services/workingCopy/common/workingCopyBackup'
import getFileServiceOverride from './files'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [IWorkingCopyBackupService.toString()]: new SyncDescriptor(BrowserWorkingCopyBackupService, [], false)
  }
}
