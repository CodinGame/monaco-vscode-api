import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { INotebookService } from 'vs/workbench/contrib/notebook/common/notebookService.service'
import { NotebookService } from 'vs/workbench/contrib/notebook/browser/services/notebookServiceImpl'
import { INotebookEditorModelResolverService } from 'vs/workbench/contrib/notebook/common/notebookEditorModelResolverService.service'
import { INotebookEditorWorkerService } from 'vs/workbench/contrib/notebook/common/services/notebookWorkerService.service'
import { NotebookEditorWorkerServiceImpl } from 'vs/workbench/contrib/notebook/browser/services/notebookWorkerServiceImpl'
import { INotebookCellStatusBarService } from 'vs/workbench/contrib/notebook/common/notebookCellStatusBarService.service'
import { NotebookCellStatusBarService } from 'vs/workbench/contrib/notebook/browser/services/notebookCellStatusBarServiceImpl'
import { INotebookEditorService } from 'vs/workbench/contrib/notebook/browser/services/notebookEditorService.service'
import { NotebookEditorWidgetService } from 'vs/workbench/contrib/notebook/browser/services/notebookEditorServiceImpl'
import { NotebookModelResolverServiceImpl } from 'vs/workbench/contrib/notebook/common/notebookEditorModelResolverServiceImpl'
import {
  INotebookKernelHistoryService,
  INotebookKernelService
} from 'vs/workbench/contrib/notebook/common/notebookKernelService.service'
import { NotebookKernelService } from 'vs/workbench/contrib/notebook/browser/services/notebookKernelServiceImpl'
import { NotebookRendererMessagingService } from 'vs/workbench/contrib/notebook/browser/services/notebookRendererMessagingServiceImpl'
import { INotebookRendererMessagingService } from 'vs/workbench/contrib/notebook/common/notebookRendererMessagingService.service'
import { NotebookExecutionStateService } from 'vs/workbench/contrib/notebook/browser/services/notebookExecutionStateServiceImpl'
import { NotebookExecutionService } from 'vs/workbench/contrib/notebook/browser/services/notebookExecutionServiceImpl'
import { INotebookExecutionService } from 'vs/workbench/contrib/notebook/common/notebookExecutionService.service'
import { INotebookKeymapService } from 'vs/workbench/contrib/notebook/common/notebookKeymapService.service'
import { NotebookKeymapService } from 'vs/workbench/contrib/notebook/browser/services/notebookKeymapServiceImpl'
import { INotebookExecutionStateService } from 'vs/workbench/contrib/notebook/common/notebookExecutionStateService.service'
import { NotebookKernelHistoryService } from 'vs/workbench/contrib/notebook/browser/services/notebookKernelHistoryServiceImpl'
import { INotebookLoggingService } from 'vs/workbench/contrib/notebook/common/notebookLoggingService.service'
import { NotebookLoggingService } from 'vs/workbench/contrib/notebook/browser/services/notebookLoggingServiceImpl'
import { INotebookSearchService } from 'vs/workbench/contrib/search/common/notebookSearch.service'
import { NotebookSearchService } from 'vs/workbench/contrib/search/browser/notebookSearch/notebookSearchService'
import { NotebookDocumentWorkbenchService } from 'vs/workbench/services/notebook/common/notebookDocumentService'
import { INotebookDocumentService } from 'vs/workbench/services/notebook/common/notebookDocumentService.service'
import { INotebookOriginalCellModelFactory } from 'vs/workbench/contrib/notebook/browser/diff/inlineDiff/notebookOriginalCellModelFactory.service'
import { INotebookOriginalModelReferenceFactory } from 'vs/workbench/contrib/notebook/browser/diff/inlineDiff/notebookOriginalModelRefFactory.service'
import { OriginalNotebookCellModelFactory } from 'vs/workbench/contrib/notebook/browser/diff/inlineDiff/notebookOriginalCellModelFactory'
import { NotebookOriginalModelReferenceFactory } from 'vs/workbench/contrib/notebook/browser/diff/inlineDiff/notebookOriginalModelRefFactory'
import { INotebookCellOutlineDataSourceFactory } from 'vs/workbench/contrib/notebook/browser/viewModel/notebookOutlineDataSourceFactory.service'
import { NotebookCellOutlineDataSourceFactory } from 'vs/workbench/contrib/notebook/browser/viewModel/notebookOutlineDataSourceFactory'
import { NotebookOutlineEntryFactory } from 'vs/workbench/contrib/notebook/browser/viewModel/notebookOutlineEntryFactory'
import { INotebookOutlineEntryFactory } from 'vs/workbench/contrib/notebook/browser/viewModel/notebookOutlineEntryFactory.service'
import 'vs/workbench/contrib/replNotebook/browser/repl.contribution'
import 'vs/workbench/contrib/notebook/browser/notebook.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [INotebookService.toString()]: new SyncDescriptor(NotebookService, [], true),
    [INotebookEditorWorkerService.toString()]: new SyncDescriptor(
      NotebookEditorWorkerServiceImpl,
      [],
      true
    ),
    [INotebookEditorModelResolverService.toString()]: new SyncDescriptor(
      NotebookModelResolverServiceImpl,
      [],
      true
    ),
    [INotebookCellStatusBarService.toString()]: new SyncDescriptor(
      NotebookCellStatusBarService,
      [],
      true
    ),
    [INotebookEditorService.toString()]: new SyncDescriptor(NotebookEditorWidgetService, [], true),
    [INotebookKernelService.toString()]: new SyncDescriptor(NotebookKernelService, [], true),
    [INotebookKernelHistoryService.toString()]: new SyncDescriptor(
      NotebookKernelHistoryService,
      [],
      true
    ),
    [INotebookExecutionService.toString()]: new SyncDescriptor(NotebookExecutionService, [], true),
    [INotebookExecutionStateService.toString()]: new SyncDescriptor(
      NotebookExecutionStateService,
      [],
      true
    ),
    [INotebookRendererMessagingService.toString()]: new SyncDescriptor(
      NotebookRendererMessagingService,
      [],
      true
    ),
    [INotebookKeymapService.toString()]: new SyncDescriptor(NotebookKeymapService, [], true),
    [INotebookLoggingService.toString()]: new SyncDescriptor(NotebookLoggingService, [], true),
    [INotebookSearchService.toString()]: new SyncDescriptor(NotebookSearchService, [], true),
    [INotebookDocumentService.toString()]: new SyncDescriptor(
      NotebookDocumentWorkbenchService,
      [],
      true
    ),
    [INotebookOriginalCellModelFactory.toString()]: new SyncDescriptor(
      OriginalNotebookCellModelFactory,
      [],
      true
    ),
    [INotebookOriginalModelReferenceFactory.toString()]: new SyncDescriptor(
      NotebookOriginalModelReferenceFactory,
      [],
      true
    ),
    [INotebookCellOutlineDataSourceFactory.toString()]: new SyncDescriptor(
      NotebookCellOutlineDataSourceFactory,
      [],
      true
    ),
    [INotebookOutlineEntryFactory.toString()]: new SyncDescriptor(
      NotebookOutlineEntryFactory,
      [],
      true
    )
  }
}
