import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import 'vs/workbench/browser/parts/dialogs/dialog.web.contribution'
import { DialogService } from 'vs/workbench/services/dialogs/common/dialogService'
import { IDialogService, IFileDialogService, IOpenDialogOptions, IPickAndOpenOptions, ISaveDialogOptions } from 'vs/platform/dialogs/common/dialogs'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { AbstractFileDialogService } from 'vs/workbench/services/dialogs/browser/abstractFileDialogService'
import { URI } from 'vs/base/common/uri'
import getLayoutServiceOverride from './layout'
import { unsupported } from '../tools'

class FileDialogService extends AbstractFileDialogService {
  override pickWorkspaceAndOpen = unsupported

  async pickFileFolderAndOpen (options: IPickAndOpenOptions): Promise<void> {
    const schema = this.getFileSystemSchema(options)

    if (options.defaultUri == null) {
      options.defaultUri = await this.defaultFilePath(schema)
    }

    return super.pickFileFolderAndOpenSimplified(schema, options, false)
  }

  async pickFolderAndOpen (options: IPickAndOpenOptions): Promise<void> {
    const schema = this.getFileSystemSchema(options)

    if (options.defaultUri == null) {
      options.defaultUri = await this.defaultFolderPath(schema)
    }

    return super.pickFolderAndOpenSimplified(schema, options)
  }

  async pickFileAndOpen (options: IPickAndOpenOptions): Promise<void> {
    const schema = this.getFileSystemSchema(options)

    if (options.defaultUri == null) {
      options.defaultUri = await this.defaultFilePath(schema)
    }

    return super.pickFileAndOpenSimplified(schema, options, false)
  }

  async showSaveDialog (options: ISaveDialogOptions): Promise<URI | undefined> {
    const schema = this.getFileSystemSchema(options)

    return super.showSaveDialogSimplified(schema, options)
  }

  async showOpenDialog (options: IOpenDialogOptions): Promise<URI[] | undefined> {
    const schema = this.getFileSystemSchema(options)

    return super.showOpenDialogSimplified(schema, options)
  }

  async pickFileToSave (defaultUri: URI, availableFileSystems?: string[]): Promise<URI | undefined> {
    const schema = this.getFileSystemSchema({ defaultUri, availableFileSystems })
    const options = this.getPickFileToSaveDialogOptions(defaultUri, availableFileSystems)
    return super.pickFileToSaveSimplified(schema, options)
  }
}

export default function getServiceOverride (container?: HTMLElement): IEditorOverrideServices {
  return {
    [IDialogService.toString()]: new SyncDescriptor(DialogService, undefined, true),
    [IFileDialogService.toString()]: new SyncDescriptor(FileDialogService, undefined, true),
    ...getLayoutServiceOverride(container)
  }
}
