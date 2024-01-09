import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { INotebookService } from 'vs/workbench/contrib/notebook/common/notebookService'
import { NotebookService } from 'vs/workbench/contrib/notebook/browser/services/notebookServiceImpl'
import { INotebookEditorModelResolverService } from 'vs/workbench/contrib/notebook/common/notebookEditorModelResolverService'
import { INotebookEditorWorkerService } from 'vs/workbench/contrib/notebook/common/services/notebookWorkerService'
import { NotebookEditorWorkerServiceImpl } from 'vs/workbench/contrib/notebook/browser/services/notebookWorkerServiceImpl'
import { INotebookCellStatusBarService } from 'vs/workbench/contrib/notebook/common/notebookCellStatusBarService'
import { NotebookCellStatusBarService } from 'vs/workbench/contrib/notebook/browser/services/notebookCellStatusBarServiceImpl'
import { INotebookEditorService } from 'vs/workbench/contrib/notebook/browser/services/notebookEditorService'
import { NotebookEditorWidgetService } from 'vs/workbench/contrib/notebook/browser/services/notebookEditorServiceImpl'
import { NotebookModelResolverServiceImpl } from 'vs/workbench/contrib/notebook/common/notebookEditorModelResolverServiceImpl'
import { INotebookKernelHistoryService, INotebookKernelService } from 'vs/workbench/contrib/notebook/common/notebookKernelService'
import { NotebookKernelService } from 'vs/workbench/contrib/notebook/browser/services/notebookKernelServiceImpl'
import { NotebookRendererMessagingService } from 'vs/workbench/contrib/notebook/browser/services/notebookRendererMessagingServiceImpl'
import { INotebookRendererMessagingService } from 'vs/workbench/contrib/notebook/common/notebookRendererMessagingService'
import { NotebookExecutionStateService } from 'vs/workbench/contrib/notebook/browser/services/notebookExecutionStateServiceImpl'
import { NotebookExecutionService } from 'vs/workbench/contrib/notebook/browser/services/notebookExecutionServiceImpl'
import { INotebookExecutionService } from 'vs/workbench/contrib/notebook/common/notebookExecutionService'
import { INotebookKeymapService } from 'vs/workbench/contrib/notebook/common/notebookKeymapService'
import { NotebookKeymapService } from 'vs/workbench/contrib/notebook/browser/services/notebookKeymapServiceImpl'
import { INotebookExecutionStateService } from 'vs/workbench/contrib/notebook/common/notebookExecutionStateService'
import { NotebookKernelHistoryService } from 'vs/workbench/contrib/notebook/browser/services/notebookKernelHistoryServiceImpl'
import { INotebookLoggingService } from 'vs/workbench/contrib/notebook/common/notebookLoggingService'
import { NotebookLoggingService } from 'vs/workbench/contrib/notebook/browser/services/notebookLoggingServiceImpl'
import 'vs/workbench/contrib/notebook/browser/notebook.contribution'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [INotebookService.toString()]: new SyncDescriptor(NotebookService, [], true),
    [INotebookEditorWorkerService.toString()]: new SyncDescriptor(NotebookEditorWorkerServiceImpl, [], true),
    [INotebookEditorModelResolverService.toString()]: new SyncDescriptor(NotebookModelResolverServiceImpl, [], true),
    [INotebookCellStatusBarService.toString()]: new SyncDescriptor(NotebookCellStatusBarService, [], true),
    [INotebookEditorService.toString()]: new SyncDescriptor(NotebookEditorWidgetService, [], true),
    [INotebookKernelService.toString()]: new SyncDescriptor(NotebookKernelService, [], true),
    [INotebookKernelHistoryService.toString()]: new SyncDescriptor(NotebookKernelHistoryService, [], true),
    [INotebookExecutionService.toString()]: new SyncDescriptor(NotebookExecutionService, [], true),
    [INotebookExecutionStateService.toString()]: new SyncDescriptor(NotebookExecutionStateService, [], true),
    [INotebookRendererMessagingService.toString()]: new SyncDescriptor(NotebookRendererMessagingService, [], true),
    [INotebookKeymapService.toString()]: new SyncDescriptor(NotebookKeymapService, [], true),
    [INotebookLoggingService.toString()]: new SyncDescriptor(NotebookLoggingService, [], true)
  }
}
