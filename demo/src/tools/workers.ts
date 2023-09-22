import type { WorkerConfig } from '@codingame/monaco-vscode-extensions-service-override'

/**
 * Cross origin workers don't work
 * The workaround used by vscode is to start a worker on a blob url containing a short script calling 'importScripts'
 * importScripts accepts to load the code inside the blob worker
 */
class CrossOriginWorker extends Worker {
  constructor (url: string | URL, options: WorkerOptions = {}) {
    const fullUrl = new URL(url, window.location.href).href
    const js = options.type === 'module' ? `import '${fullUrl}';` : `importScripts('${fullUrl}');`
    const blob = new Blob([js], { type: 'application/javascript' })
    super(URL.createObjectURL(blob), options)
  }
}
class FakeWorker {
  constructor (public url: string | URL, public options?: WorkerOptions) {
  }
}
/**
 * The only way to load workers in vite is using the `?worker` import which return a worker constructor
 * We need to hack it to get the generated code and either transform it to a CrossOrigin worker for regular workers
 * or extract the url and options for the extensionHost worker
 */
export function toCrossOriginWorker (viteWorker: new () => Worker): new () => Worker {
  // eslint-disable-next-line no-new-func
  return new Function('Worker', `return ${viteWorker.toString()}`)(CrossOriginWorker)
}

export function toWorkerConfig (viteWorker: new () => Worker): WorkerConfig {
  // eslint-disable-next-line no-new-func
  const fakeWorker: FakeWorker = new Function('Worker', `return ${viteWorker.toString()}`)(FakeWorker)()
  return {
    url: fakeWorker.url.toString(),
    options: fakeWorker.options
  }
}
