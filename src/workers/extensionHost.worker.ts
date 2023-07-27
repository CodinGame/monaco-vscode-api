import { create } from 'vs/workbench/api/worker/extensionHostWorker'

const messageHandler = create()

globalThis.onmessage = (e: MessageEvent) => messageHandler.onmessage(e.data)
