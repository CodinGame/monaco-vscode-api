import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { DialogService } from 'vs/workbench/services/dialogs/common/dialogService'
import { IDialogService, IFileDialogService } from 'vs/platform/dialogs/common/dialogs.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { FileDialogService } from 'vs/workbench/services/dialogs/browser/fileDialogService'
import type { IFileSystemProvider } from 'vs/platform/files/common/files'
import { HTMLFileSystemProvider } from 'vs/platform/files/browser/htmlFileSystemProvider'
import 'vs/workbench/browser/parts/dialogs/dialog.web.contribution'
import 'vs/workbench/contrib/welcomeDialog/browser/welcomeDialog.contribution'

function isHTMLFileSystemProvider(
  provider: IFileSystemProvider
): provider is HTMLFileSystemProvider {
  return (provider as HTMLFileSystemProvider).directories != null
}

class DialogServiceOverride extends FileDialogService {
  protected override shouldUseSimplified(scheme: string): boolean {
    return !isHTMLFileSystemProvider(super.fileSystemProvider) || super.shouldUseSimplified(scheme)
  }
}

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IDialogService.toString()]: new SyncDescriptor(DialogService, undefined, true),
    [IFileDialogService.toString()]: new SyncDescriptor(DialogServiceOverride, undefined, true)
  }
}
