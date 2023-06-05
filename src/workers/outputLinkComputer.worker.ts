import { IWorkerContext } from 'vs/editor/common/services/editorSimpleWorker'
import { initialize } from 'vs/editor/editor.worker'
import { ICreateData, OutputLinkComputer } from 'vs/workbench/contrib/output/common/outputLinkComputer'

initialize((ctx: IWorkerContext, createData: ICreateData) => new OutputLinkComputer(ctx, createData))
