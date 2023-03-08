import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { DialogHandlerContribution } from 'vs/workbench/browser/parts/dialogs/dialog.web.contribution'
import { DialogService } from 'vs/workbench/services/dialogs/common/dialogService'
import { IDialogService } from 'vs/platform/dialogs/common/dialogs'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import getLayoutServiceOverride from './layout'
import { onServicesInitialized } from './tools'

function initialize (instantiationService: IInstantiationService) {
  setTimeout(() => {
    instantiationService.createInstance(DialogHandlerContribution)
  })
}

export default function getServiceOverride (container?: HTMLElement): IEditorOverrideServices {
  onServicesInitialized(initialize)

  return {
    [IDialogService.toString()]: new SyncDescriptor(DialogService),
    ...getLayoutServiceOverride(container)
  }
}
