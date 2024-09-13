import { create } from 'vs/workbench/services/textMate/browser/backgroundTokenization/worker/textMateTokenizationWorker.worker'
import { SimpleWorkerServer } from 'vs/base/common/worker/simpleWorker'

const simpleWorker = new SimpleWorkerServer((msg) => {
  globalThis.postMessage(msg)
}, create)

globalThis.onmessage = (e: MessageEvent) => {
  simpleWorker.onmessage(e.data)
}
