import { IWorkerContext } from 'vs/editor/common/services/editorSimpleWorker'
import { ICreateData, TextMateTokenizationWorker } from 'vs/workbench/services/textMate/browser/worker/textMate.worker'
import { TextMateWorkerHost } from 'vs/workbench/services/textMate/browser/workerHost/textMateWorkerHost'
import { initialize } from 'vs/editor/editor.worker'

initialize((ctx: IWorkerContext<TextMateWorkerHost>, createData: ICreateData) => new TextMateTokenizationWorker(ctx, createData))
