import { editor, languages } from 'vs/editor/editor.api'
import {
  createConfiguredEditor,
  createConfiguredDiffEditor,
  createModelReference,
  writeFile
} from './monaco'
import { withReadyServices } from './services'
import type {
  IInternalWebWorkerOptions,
  MonacoWebWorker
} from 'vs/editor/standalone/browser/standaloneWebWorker'
import { URI } from 'vs/base/common/uri'
import type { IWebWorkerDescriptor } from 'vs/base/browser/webWorkerFactory'
export * from 'vs/editor/editor.api'
import { createWebWorker as actualCreateWebWorker } from 'vs/editor/standalone/browser/standaloneEditor.js'

declare module 'vs/editor/editor.api' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace editor {
    export { createModelReference, writeFile }
  }
}

const originalOnLanguage = languages.onLanguage
languages.onLanguage = (languageId: string, callback: () => void) =>
  withReadyServices(() => originalOnLanguage(languageId, callback))
const originalOnLanguageEncountered = languages.onLanguage
languages.onLanguageEncountered = (languageId: string, callback: () => void) =>
  withReadyServices(() => originalOnLanguageEncountered(languageId, callback))
editor.create = createConfiguredEditor as unknown as typeof editor.create
editor.createDiffEditor = createConfiguredDiffEditor as unknown as typeof editor.createDiffEditor
editor.createModelReference = createModelReference
editor.writeFile = writeFile

/**
 * Make the `createWebWorker` method backward compatible, until the monaco standalone workers are updated
 */
export interface IWebWorkerOptions {
  /**
   * The AMD moduleId to load.
   * It should export a function `create` that should return the exported proxy.
   */
  moduleId: string
  /**
   * The data to send over when calling create on the module.
   */
  createData?: unknown
  /**
   * A label to be used to identify the web worker for debugging purposes.
   */
  label?: string
  /**
   * An object that can be used by the web worker to make calls back to the main thread.
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  host?: Record<string, Function>
  /**
   * Keep idle models.
   * Defaults to false, which means that idle models will stop syncing after a while.
   */
  keepIdleModels?: boolean
}

let id = 0
function getWorker(descriptor: IWebWorkerDescriptor): Worker {
  const label = descriptor.label || 'anonymous' + ++id

  // Option for hosts to overwrite the worker script (used in the standalone editor)
  interface IMonacoEnvironment {
    getWorker?(moduleId: string, label: string): Worker
    getWorkerUrl?(moduleId: string, label: string): string
  }
  const monacoEnvironment: IMonacoEnvironment | undefined = (
    globalThis as unknown as { MonacoEnvironment: IMonacoEnvironment }
  ).MonacoEnvironment
  if (monacoEnvironment) {
    if (typeof monacoEnvironment.getWorker === 'function') {
      return monacoEnvironment.getWorker('workerMain.js', label)
    }
    if (typeof monacoEnvironment.getWorkerUrl === 'function') {
      const workerUrl = monacoEnvironment.getWorkerUrl('workerMain.js', label)
      return new Worker(workerUrl, { name: label, type: 'module' })
    }
  }

  throw new Error(
    `You must define a function MonacoEnvironment.getWorkerUrl or MonacoEnvironment.getWorker`
  )
}

function isIWebWorkerOptions(
  options: IWebWorkerOptions | IInternalWebWorkerOptions
): options is IWebWorkerOptions {
  return 'moduleId' in options
}

const originalCreateWebWorker = editor.createWebWorker
export function createWebWorker<T extends object>(
  options: IWebWorkerOptions | IInternalWebWorkerOptions
): MonacoWebWorker<T> {
  if (isIWebWorkerOptions(options)) {
    const worker = getWorker({
      esmModuleLocation: URI.parse(options.moduleId),
      label: options.label
    })

    const webworker = actualCreateWebWorker<T>({
      worker,
      host: options.host,
      keepIdleModels: options.keepIdleModels
    })

    void (async () => {
      const proxy = await webworker.getProxy()
      ;(proxy as { $initialize: (data: unknown) => Promise<void> }).$initialize(options.createData)
    })()

    return webworker
  } else {
    return originalCreateWebWorker(options)
  }
}

editor.createWebWorker = createWebWorker
