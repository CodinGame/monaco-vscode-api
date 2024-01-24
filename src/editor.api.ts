import { editor as baseEditor } from 'vs/editor/editor.api'
import { createConfiguredEditor, createConfiguredDiffEditor, createModelReference, writeFile } from './monaco'
export * from 'vs/editor/editor.api'

// Override monaco api to replace editor creation functions and add model/file management functions
export const editor = {
  ...baseEditor,
  create: createConfiguredEditor as unknown as typeof baseEditor.create,
  createDiffEditor: createConfiguredDiffEditor as unknown as typeof baseEditor.createDiffEditor,
  createModelReference,
  writeFile
}
