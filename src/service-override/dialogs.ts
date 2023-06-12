import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import 'vs/workbench/browser/parts/dialogs/dialog.web.contribution'
import { DialogService } from 'vs/workbench/services/dialogs/common/dialogService'
import { IDialogService, IFileDialogService } from 'vs/platform/dialogs/common/dialogs'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { AbstractFileDialogService } from 'vs/workbench/services/dialogs/browser/abstractFileDialogService'
import getLayoutServiceOverride from './layout'
import { unsupported } from '../tools'

class FileDialogService extends AbstractFileDialogService {
  override pickFileFolderAndOpen = unsupported
  override pickFileAndOpen = unsupported
  override pickFolderAndOpen = unsupported
  override pickWorkspaceAndOpen = unsupported
  override showSaveDialog = unsupported
  override showOpenDialog = unsupported
  override pickFileToSave = unsupported
}

export default function getServiceOverride (container?: HTMLElement): IEditorOverrideServices {
  return {
    [IDialogService.toString()]: new SyncDescriptor(DialogService, undefined, true),
    [IFileDialogService.toString()]: new SyncDescriptor(FileDialogService, undefined, true),
    ...getLayoutServiceOverride(container)
  }
}
