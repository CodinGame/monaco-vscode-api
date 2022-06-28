
// @ts-ignore
import { VSBuffer as MonacoVSBuffer } from 'monaco-editor/esm/vs/base/common/buffer.js'
import { VSBuffer as VScodeVSBuffer } from 'vscode/vs/base/common/buffer.js'

// A lot of methods from VSBuffer are treeshaked out of monaco editor, we need to restore them here
// Also we cannot just use the VSCode impl because:
// - The vscode code received instances created inside monaco code
// - VSCode does `instanceof` on instances that need to work

function toVSCodeVSBuffer (value: unknown) {
  if (value instanceof MonacoVSBuffer) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return VScodeVSBuffer.wrap((value as any).buffer)
  }
  return value
}
function toMonacoVSBuffer (value: unknown) {
  if (value instanceof VScodeVSBuffer) {
    return MonacoVSBuffer.wrap(value.buffer)
  }
  return value
}

for (const key of Object.getOwnPropertyNames(VScodeVSBuffer)) {
  if (!Object.hasOwnProperty.call(MonacoVSBuffer, key)) {
    MonacoVSBuffer[key] = function (...args: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return toMonacoVSBuffer((VScodeVSBuffer as any)[key].call(MonacoVSBuffer, ...args.map(toVSCodeVSBuffer)))
    }
  }
}
for (const key of Object.getOwnPropertyNames(VScodeVSBuffer.prototype)) {
  if (!Object.hasOwnProperty.call(MonacoVSBuffer.prototype, key)) {
    MonacoVSBuffer.prototype[key] = function (...args: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return toMonacoVSBuffer((VScodeVSBuffer.prototype as any)[key].call(this, ...args.map(toVSCodeVSBuffer)))
    }
  }
}
