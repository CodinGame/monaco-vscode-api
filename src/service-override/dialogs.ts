import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import 'vs/workbench/browser/parts/dialogs/dialog.web.contribution'
import { DialogService } from 'vs/workbench/services/dialogs/common/dialogService'
import { IDialogService } from 'vs/platform/dialogs/common/dialogs'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import getLayoutServiceOverride from './layout'

export default function getServiceOverride (container?: HTMLElement): IEditorOverrideServices {
  return {
    [IDialogService.toString()]: new SyncDescriptor(DialogService, undefined, true),
    ...getLayoutServiceOverride(container)
  }
}
