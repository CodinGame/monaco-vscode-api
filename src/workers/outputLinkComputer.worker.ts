import { SimpleWorkerServer } from 'vs/base/common/worker/simpleWorker'
import { create } from 'vs/workbench/contrib/output/common/outputLinkComputer'

const simpleWorker = new SimpleWorkerServer((msg) => {
  globalThis.postMessage(msg)
}, create)

globalThis.onmessage = (e: MessageEvent) => {
  simpleWorker.onmessage(e.data)
}
