import { editor } from 'vs/editor/editor.api'
import { createConfiguredEditor, createConfiguredDiffEditor, createModelReference, writeFile } from './monaco'
export * from 'vs/editor/editor.api'

declare module 'vs/editor/editor.api' {
  export namespace editor {
    export {
      createModelReference,
      writeFile
    }
  }
}

editor.create = createConfiguredEditor as unknown as typeof editor.create
editor.createDiffEditor = createConfiguredDiffEditor as unknown as typeof editor.createDiffEditor
editor.createModelReference = createModelReference
editor.writeFile = writeFile
