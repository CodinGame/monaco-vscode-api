import type { WorkerConfig } from '@codingame/monaco-vscode-extensions-service-override'
import { Worker } from './fakeWorker'

const fakeWorker = new Worker(new URL('vscode/workers/extensionHost.worker', import.meta.url), {
  type: 'module'
})

export const workerConfig: WorkerConfig = {
  url: fakeWorker.url.toString(),
  options: fakeWorker.options
}
