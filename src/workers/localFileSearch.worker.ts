import { create } from 'vs/workbench/services/search/worker/localFileSearch'
import { SimpleWorkerServer } from 'vs/base/common/worker/simpleWorker'

const simpleWorker = new SimpleWorkerServer((msg) => {
  globalThis.postMessage(msg)
}, create)

globalThis.onmessage = (e: MessageEvent) => {
  simpleWorker.onmessage(e.data)
}
