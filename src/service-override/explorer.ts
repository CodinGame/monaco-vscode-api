import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ExplorerService } from 'vs/workbench/contrib/files/browser/explorerService'
import { IExplorerService } from 'vs/workbench/contrib/files/browser/files'
import 'vs/workbench/contrib/files/browser/fileCommands'
import 'vs/workbench/contrib/files/browser/fileActions.contribution'
import 'vs/workbench/contrib/files/browser/files.explorer.contribution'

function getServiceOverride (): IEditorOverrideServices {
  return {
    [IExplorerService.toString()]: new SyncDescriptor(ExplorerService, [], true)
  }
}

export default getServiceOverride
