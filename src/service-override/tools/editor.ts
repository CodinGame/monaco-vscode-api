import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { IEditorService, isPreferredGroup, PreferredGroup, SIDE_GROUP } from 'vs/workbench/services/editor/common/editorService'
import { IEditorControl, IEditorPane, IResourceDiffEditorInput, isEditorInput, isResourceEditorInput, ITextDiffEditorPane, IUntitledTextResourceEditorInput, IUntypedEditorInput } from 'vs/workbench/common/editor'
import { EditorInput } from 'vs/workbench/common/editor/editorInput'
import { IEditorOptions, IResourceEditorInput, ITextResourceEditorInput } from 'vs/platform/editor/common/editor'
import { applyTextEditorOptions } from 'vs/workbench/common/editor/editorOptions'
import { ScrollType } from 'vs/editor/common/editorCommon'
import { ICodeEditor } from 'vs/editor/browser/editorBrowser'
import { Event } from 'vs/base/common/event'
import { DEFAULT_EDITOR_MAX_DIMENSIONS, DEFAULT_EDITOR_MIN_DIMENSIONS } from 'vs/workbench/browser/parts/editor/editor'
import { IResolvedTextEditorModel, ITextModelService } from 'vs/editor/common/services/resolverService'
import { StandaloneEditor } from 'vs/editor/standalone/browser/standaloneCodeEditor'
import { IReference } from 'vs/base/common/lifecycle'
import { unsupported } from '../../tools'

export type OpenEditor = (modelRef: IReference<IResolvedTextEditorModel>, options: IEditorOptions | undefined, sideBySide?: boolean) => Promise<ICodeEditor | undefined>

class SimpleEditorPane implements IEditorPane {
  constructor (private editor?: ICodeEditor) {}

  onDidChangeControl = Event.None
  onDidChangeSizeConstraints = Event.None
  onDidFocus = Event.None
  onDidBlur = Event.None
  input = undefined
  options = undefined
  group = undefined
  scopedContextKeyService = undefined
  get minimumWidth () { return DEFAULT_EDITOR_MIN_DIMENSIONS.width }
  get maximumWidth () { return DEFAULT_EDITOR_MAX_DIMENSIONS.width }
  get minimumHeight () { return DEFAULT_EDITOR_MIN_DIMENSIONS.height }
  get maximumHeight () { return DEFAULT_EDITOR_MAX_DIMENSIONS.height }
  getViewState = unsupported
  isVisible = unsupported
  hasFocus = unsupported
  getId = unsupported
  getTitle = unsupported
  focus = unsupported

  getControl (): IEditorControl | undefined {
    return this.editor
  }
}

export function wrapOpenEditor (textModelService: ITextModelService, defaultBehavior: IEditorService['openEditor'], fallbackBahavior?: OpenEditor): IEditorService['openEditor'] {
  function openEditor(editor: EditorInput, options?: IEditorOptions, group?: PreferredGroup): Promise<IEditorPane | undefined>
  function openEditor(editor: IUntypedEditorInput, group?: PreferredGroup): Promise<IEditorPane | undefined>
  function openEditor(editor: IResourceEditorInput, group?: PreferredGroup): Promise<IEditorPane | undefined>
  function openEditor(editor: ITextResourceEditorInput | IUntitledTextResourceEditorInput, group?: PreferredGroup): Promise<IEditorPane | undefined>
  function openEditor(editor: IResourceDiffEditorInput, group?: PreferredGroup): Promise<ITextDiffEditorPane | undefined>
  function openEditor(editor: EditorInput | IUntypedEditorInput, optionsOrPreferredGroup?: IEditorOptions | PreferredGroup, preferredGroup?: PreferredGroup): Promise<IEditorPane | undefined>
  async function openEditor (editor: EditorInput | IUntypedEditorInput, optionsOrPreferredGroup?: IEditorOptions | PreferredGroup, preferredGroup?: PreferredGroup): Promise<IEditorPane | undefined> {
    const options = isEditorInput(editor) ? optionsOrPreferredGroup as IEditorOptions : editor.options

    if (isPreferredGroup(optionsOrPreferredGroup)) {
      preferredGroup = optionsOrPreferredGroup
    }

    const resource = isResourceEditorInput(editor) || isEditorInput(editor) ? editor.resource : undefined

    if (resource == null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return defaultBehavior(editor as any, optionsOrPreferredGroup as any, preferredGroup)
    }

    let modelEditor: ICodeEditor | undefined

    // The model doesn't exist, resolve it
    const modelRef = await textModelService.createModelReference(resource)

    // If the model is already existing, try to find an associated editor
    const codeEditors = StandaloneServices.get(ICodeEditorService).listCodeEditors()
    modelEditor = codeEditors.find(editor => editor instanceof StandaloneEditor && editor.getModel() === modelRef.object.textEditorModel)

    if (modelEditor == null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const defaultBehaviorResult = await defaultBehavior(editor as any, optionsOrPreferredGroup as any, preferredGroup)
      if (defaultBehaviorResult != null) {
        modelRef.dispose()
        return defaultBehaviorResult
      }

      modelEditor = await fallbackBahavior?.(modelRef, options, preferredGroup === SIDE_GROUP)
    }

    if (modelEditor == null) {
      // Dispose the newly created model if `openEditor` wasn't able to open it
      modelRef.dispose()
      return undefined
    }

    // Otherwise, let the user destroy the model, never destroy the reference

    if (options != null) {
      // Apply selection
      applyTextEditorOptions(options, modelEditor, ScrollType.Immediate)
    }

    if (!(options?.preserveFocus ?? false)) {
      modelEditor.focus()
      modelEditor.getContainerDomNode().scrollIntoView()
    }

    // Return a very simple editor pane, only the `getControl` method is used
    return new SimpleEditorPane(modelEditor)
  }

  return openEditor
}
