import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { DialogService } from 'vs/workbench/services/dialogs/common/dialogService'
import { IDialogService, IFileDialogService, IOpenDialogOptions, IPickAndOpenOptions, ISaveDialogOptions } from 'vs/platform/dialogs/common/dialogs'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { AbstractFileDialogService } from 'vs/workbench/services/dialogs/browser/abstractFileDialogService'
import { FileDialogService } from 'vs/workbench/services/dialogs/browser/fileDialogService'
import { URI } from 'vs/base/common/uri'
import { unsupported } from '../tools'
import 'vs/workbench/browser/parts/dialogs/dialog.web.contribution'
import 'vs/workbench/contrib/welcomeDialog/browser/welcomeDialog.contribution'

class DialogServiceOverride extends AbstractFileDialogService {
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

interface DialogServiceOverrideProps {
  /**
   * Is an `HTMLFileSystemProvider` is used as only provider for the `file` scheme directly (without overlay)
   * Enable this option to enable browser file dialogs
   */
  useHtmlFileSystemProvider?: boolean
}

export default function getServiceOverride ({ useHtmlFileSystemProvider = false }: DialogServiceOverrideProps = {}): IEditorOverrideServices {
  return {
    [IDialogService.toString()]: new SyncDescriptor(DialogService, undefined, true),
    [IFileDialogService.toString()]: useHtmlFileSystemProvider ? new SyncDescriptor(FileDialogService, undefined, true) : new SyncDescriptor(DialogServiceOverride, undefined, true)
  }
}
