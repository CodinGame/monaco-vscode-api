import Severity from 'vs/base/common/severity'
import type * as vscode from 'vscode'
import type { IProgressService } from 'vs/platform/progress/common/progress'
import { IExtensionDescription } from 'vs/platform/extensions/common/extensions'

export {
  Severity
}

export interface Window {
  createOutputChannel?(name: string): vscode.OutputChannel
  withProgress?: IProgressService['withProgress']
}

export interface Workspace {
  rootPath?: string
  workspaceFolders?: typeof vscode.workspace.workspaceFolders
  updateWorkspaceFolders?: typeof vscode.workspace.updateWorkspaceFolders
  onDidChangeWorkspaceFolders?: typeof vscode.workspace.onDidChangeWorkspaceFolders
  getConfiguration?: typeof vscode.workspace.getConfiguration
  onDidChangeConfiguration?: vscode.Event<vscode.ConfigurationChangeEvent>
  onWillSaveTextDocument?: vscode.Event<vscode.TextDocumentWillSaveEvent>
  onDidSaveTextDocument?: vscode.Event<vscode.TextDocument>
  createFileSystemWatcher?: typeof vscode.workspace.createFileSystemWatcher
}

export interface Services {
  extension?: IExtensionDescription
  workspace?: Workspace
  window?: Window
}

let services: Services | undefined
export namespace Services {
  export type Provider = () => Services
  export const get: Provider = () => {
    if (services == null) {
      throw new Error('Services has not been installed')
    }
    return services
  }
  export function install (_services: Services): vscode.Disposable {
    if (services != null) {
      console.warn('Services have been overridden')
    }
    services = _services

    return {
      dispose: () => {
        if (services === _services) {
          services = undefined
        }
      }
    }
  }
}

// Export all services as monaco doesn't export them
export { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'

export { ICommandService } from 'vs/platform/commands/common/commands'
export { INotificationService } from 'vs/platform/notification/common/notification'
export { IBulkEditService } from 'vs/editor/browser/services/bulkEditService'
export { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
export { ILanguageService } from 'vs/editor/common/languages/language'
export { ILanguageConfigurationService } from 'vs/editor/common/languages/languageConfigurationRegistry'
export { IEditorWorkerService } from 'vs/editor/common/services/editorWorker'
export { ILanguageFeaturesService } from 'vs/editor/common/services/languageFeatures'
export { IModelService } from 'vs/editor/common/services/model'
export { ITextModelService } from 'vs/editor/common/services/resolverService'
export { IClipboardService } from 'vs/platform/clipboard/common/clipboardService'
export { IDialogService } from 'vs/platform/dialogs/common/dialogs'
export { IFileService } from 'vs/platform/files/common/files'
export { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
export { IMarkerService } from 'vs/platform/markers/common/markers'
export { IOpenerService } from 'vs/platform/opener/common/opener'
export { IProductService } from 'vs/platform/product/common/productService'
export { IQuickInputService } from 'vs/platform/quickinput/common/quickInput'
export { ITelemetryService } from 'vs/platform/telemetry/common/telemetry'
export { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity'
export { IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService'
export { IEditorService } from 'vs/workbench/services/editor/common/editorService'
export { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService'
export { IHostService } from 'vs/workbench/services/host/browser/host'
export { ILanguageStatusService } from 'vs/workbench/services/languageStatus/common/languageStatusService'
export { IPaneCompositePartService } from 'vs/workbench/services/panecomposite/browser/panecomposite'
export { IPathService } from 'vs/workbench/services/path/common/pathService'
export { ITextFileService } from 'vs/workbench/services/textfile/common/textfiles'
export { IWorkingCopyFileService } from 'vs/workbench/services/workingCopy/common/workingCopyFileService'
