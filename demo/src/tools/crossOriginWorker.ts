/**
 * Cross origin workers don't work
 * The workaround used by vscode is to start a worker on a blob url containing a short script calling 'importScripts'
 * importScripts accepts to load the code inside the blob worker
 */
class CrossOriginWorker extends Worker {
  constructor(url: string | URL, options: WorkerOptions = {}) {
    const fullUrl = new URL(url, window.location.href).href
    const js = options.type === 'module' ? `import '${fullUrl}';` : `importScripts('${fullUrl}');`
    const blob = new Blob([js], { type: 'application/javascript' })
    super(URL.createObjectURL(blob), options)
  }
}

export { CrossOriginWorker as Worker }
