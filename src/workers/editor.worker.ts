import type { IWorkerContext } from 'vs/editor/common/services/editorWebWorker'
import 'vs/editor/common/services/editorWebWorkerMain.js'
import * as worker from 'vs/editor/editor.worker.start'

type CreateFunction<D, R extends object = object> = (ctx: IWorkerContext<object>, data: D) => R

let initialized = false
function isWorkerInitialized() {
  return initialized
}
function initialize<D, R extends object>(createFn: CreateFunction<D, R>) {
  initialized = true
  self.onmessage = (m) => {
    worker.start((ctx) => {
      return createFn(ctx, m.data)
    })
  }
}

self.onmessage = () => {
  if (!isWorkerInitialized()) {
    worker.start(() => {
      return {}
    })
  }
}
export { initialize }
