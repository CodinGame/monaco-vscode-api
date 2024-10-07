/**
 * In mainThreadDocumentsAndEditors.js, AbstractTextEditor is imported only to run `instanceof` on it
 * This file implements a weak import feature so the file is not imported if nothing else does
 */

let AbstractTextEditor = class {}
class FakeAbstractTextEditor {
  static [Symbol.hasInstance](instance) {
    return AbstractTextEditor != null && instance instanceof AbstractTextEditor
  }
}

export function setAbstractTextEditor(_AbstractTextEditor) {
  AbstractTextEditor = _AbstractTextEditor
}

export { FakeAbstractTextEditor as AbstractTextEditor }
