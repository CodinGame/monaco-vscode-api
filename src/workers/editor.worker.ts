import 'vs/editor/common/services/editorWebWorkerMain.js'
import { start } from 'vs/editor/editor.worker.start'
import type { IWorkerContext } from 'vs/editor/common/services/editorWebWorker'

/**
 * Make the `initialize` method backward compatible, until the monaco standalone workers are updated
 */

type CreateFunction<D, R extends object = object> = (ctx: IWorkerContext<object>, data: D) => R
export function initialize<D, R extends object>(createFn: CreateFunction<D, R>) {
  let requestHandler: R | undefined
  const foreignModule = new Proxy(
    {},
    {
      get(_target, propKey: PropertyKey) {
        if (propKey === '$initialize') {
          return async (data: D) => {
            if (!requestHandler) {
              requestHandler = createFn(context, data)
            }
          }
        }
        const value = requestHandler?.[propKey as keyof R]

        if (typeof value === 'function') {
          return value.bind(requestHandler);
        }
        return value
      }
    }
  )

  const context = start(foreignModule)
}
