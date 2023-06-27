import type * as vscode from 'vscode'

async function getRealUrl (url: string): Promise<string> {
  if (url.startsWith('extension:')) {
    const { workspace, Uri }: typeof vscode = require('vscode')
    const value = await workspace.fs.readFile(Uri.parse(url))
    const source = new TextDecoder().decode(value)
    const sourceURL = `${url}#vscode-extension-worker`
    const fullSource = `${source}\n//# sourceURL=${sourceURL}`
    const blob = new Blob([fullSource])
    return URL.createObjectURL(blob)
  }
  return url
}

export default class ExtensionWorker implements Worker {
  private workerPromise: Promise<Worker>
  constructor (scriptURL: string | URL, options?: WorkerOptions) {
    this.workerPromise = getRealUrl(scriptURL instanceof URL ? scriptURL.toString() : scriptURL).then(url => {
      return new Worker(url, options)
    })
  }

  private _onmessage: Worker['onmessage'] = null
  set onmessage (cb: Worker['onmessage']) {
    this._onmessage = cb
    this.workerPromise.then(worker => {
      worker.onmessage = cb
    }, console.error)
  }

  get onmessage (): Worker['onmessage'] {
    return this._onmessage
  }

  private _onmessageerror: Worker['onmessageerror'] = null
  set onmessageerror (cb: Worker['onmessageerror']) {
    this._onmessageerror = cb
    this.workerPromise.then(worker => {
      worker.onmessageerror = cb
    }, console.error)
  }

  get onmessageerror (): Worker['onmessageerror'] {
    return this._onmessageerror
  }

  private _onerror: Worker['onerror'] = null
  set onerror (cb: Worker['onerror']) {
    this._onerror = cb
    this.workerPromise.then(worker => {
      worker.onerror = cb
    }, console.error)
  }

  get onerror (): Worker['onerror'] {
    return this._onerror
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postMessage (message: unknown, options?: any): void {
    this.workerPromise.then(worker => {
      worker.postMessage(message, options)
    }, console.error)
  }

  terminate (): void {
    this.workerPromise.then(worker => {
      worker.terminate()
    }, console.error)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addEventListener (type: any, listener: any, options?: any): void {
    this.workerPromise.then(worker => {
      worker.addEventListener(type, listener, options)
    }, console.error)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeEventListener (type: any, listener: any, options?: any): void {
    this.workerPromise.then(worker => {
      worker.removeEventListener(type, listener, options)
    }, console.error)
  }

  dispatchEvent (event: Event): boolean {
    this.workerPromise.then(worker => {
      worker.dispatchEvent(event)
    }, console.error)
    return false
  }
}
