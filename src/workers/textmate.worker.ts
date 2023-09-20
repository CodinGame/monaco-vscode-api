import { IWorkerContext } from 'vs/editor/common/services/editorSimpleWorker'
import { ICreateData, ITextMateWorkerHost, TextMateTokenizationWorker } from 'vs/workbench/services/textMate/browser/backgroundTokenization/worker/textMateTokenizationWorker.worker'
import { initialize } from 'vs/editor/editor.worker'

initialize((ctx: IWorkerContext<ITextMateWorkerHost>, createData: ICreateData) => new TextMateTokenizationWorker(ctx, createData))
