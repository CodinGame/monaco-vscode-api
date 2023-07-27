export * from 'vscode/vs/workbench/browser/parts/editor/textEditor.js'

import { AbstractTextEditor } from 'vscode/vs/workbench/browser/parts/editor/textEditor.js'
import { setAbstractTextEditor } from './textEditor.weak.js'
setAbstractTextEditor(AbstractTextEditor)