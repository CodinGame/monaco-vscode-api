import { editor, languages } from 'vs/editor/editor.api'
import { createConfiguredEditor, createConfiguredDiffEditor, createModelReference, writeFile } from './monaco'
import { withReadyServices } from './services'
export * from 'vs/editor/editor.api'

declare module 'vs/editor/editor.api' {
  export namespace editor {
    export {
      createModelReference,
      writeFile
    }
  }
}

const originalOnLanguage = languages.onLanguage
languages.onLanguage = (languageId: string, callback: () => void) => withReadyServices(() => originalOnLanguage(languageId, callback))
const originalOnLanguageEncountered = languages.onLanguage
languages.onLanguageEncountered = (languageId: string, callback: () => void) => withReadyServices(() => originalOnLanguageEncountered(languageId, callback))
editor.create = createConfiguredEditor as unknown as typeof editor.create
editor.createDiffEditor = createConfiguredDiffEditor as unknown as typeof editor.createDiffEditor
editor.createModelReference = createModelReference
editor.writeFile = writeFile
