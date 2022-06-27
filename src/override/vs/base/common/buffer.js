import { VSBuffer as MonacoVSBuffer } from 'monaco-editor/esm/vs/base/common/buffer.js'
import { VSBuffer as VScodeVSBuffer } from 'vscode/vs/base/common/buffer.js'
export * from 'vs/base/common/buffer'

// A lot of methods from VSBuffer are treeshaked out of monaco editor, we need to restore them here
// Also we cannot just use the VSCode impl because:
// - The vscode code received instances created inside monaco code
// - VSCode does `instanceof` on instances that need to work

function toVSCodeVSBuffer (value) {
  if (value instanceof MonacoVSBuffer) {
    return new VScodeVSBuffer(value.buffer)
  }
  return value
}
function toMonacoVSBuffer (value) {
  if (value instanceof VScodeVSBuffer) {
    return new MonacoVSBuffer(value.buffer)
  }
  return value
}

for (const key of Object.getOwnPropertyNames(VScodeVSBuffer)) {
  if (!Object.hasOwnProperty.call(MonacoVSBuffer, key)) {
    MonacoVSBuffer[key] = function (...args) {
      return toMonacoVSBuffer(VScodeVSBuffer[key].call(MonacoVSBuffer, ...args.map(toVSCodeVSBuffer)))
    }
  }
}
for (const key of Object.getOwnPropertyNames(VScodeVSBuffer.prototype)) {
  if (!Object.hasOwnProperty.call(MonacoVSBuffer.prototype, key)) {
    MonacoVSBuffer.prototype[key] = function (...args) {
      return toMonacoVSBuffer(VScodeVSBuffer.prototype[key].call(this, ...args.map(toVSCodeVSBuffer)))
    }
  }
}

export {
  MonacoVSBuffer as VSBuffer
}
