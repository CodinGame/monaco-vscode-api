import { IResolvedTextEditorModel, IReference, OpenEditor } from '@codingame/monaco-vscode-views-service-override'
import * as monaco from 'monaco-editor'

let currentEditor: ({
  modelRef: IReference<IResolvedTextEditorModel>
  editor: monaco.editor.IStandaloneCodeEditor
} & monaco.IDisposable) | null = null
export const openNewCodeEditor: OpenEditor = async (modelRef) => {
  if (currentEditor != null) {
    currentEditor.dispose()
    currentEditor = null
  }
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
  container.style.top = container.style.bottom = container.style.left = container.style.right = '0'
  container.style.cursor = 'pointer'

  const editorElem = document.createElement('div')
  editorElem.style.position = 'absolute'
  editorElem.style.top = editorElem.style.bottom = editorElem.style.left = editorElem.style.right = '0'
  editorElem.style.margin = 'auto'
  editorElem.style.width = '80%'
  editorElem.style.height = '80%'

  container.appendChild(editorElem)

  document.body.appendChild(container)
  try {
    const editor = monaco.editor.create(
      editorElem,
      {
        model: modelRef.object.textEditorModel,
        readOnly: true,
        automaticLayout: true
      }
    )

    currentEditor = {
      dispose: () => {
        editor.dispose()
        modelRef.dispose()
        document.body.removeChild(container)
        currentEditor = null
      },
      modelRef,
      editor
    }

    editor.onDidBlurEditorWidget(() => {
      currentEditor?.dispose()
    })
    container.addEventListener('mousedown', (event) => {
      if (event.target !== container) {
        return
      }

      currentEditor?.dispose()
    })

    return editor
  } catch (error) {
    document.body.removeChild(container)
    currentEditor = null
    throw error
  }
}
