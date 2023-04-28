import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IResolvedTextEditorModel, ITextModelService } from 'vs/editor/common/services/resolverService'
import { TextModelResolverService } from 'vs/workbench/services/textmodelResolver/common/textModelResolverService'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { CodeEditorService } from 'vs/workbench/services/editor/browser/codeEditorService'
import { IEditorService, isPreferredGroup, PreferredGroup, SIDE_GROUP } from 'vs/workbench/services/editor/common/editorService'
import { IEditorControl, IEditorPane, IResourceDiffEditorInput, isEditorInput, isResourceEditorInput, ITextDiffEditorPane, IUntitledTextResourceEditorInput, IUntypedEditorInput } from 'vs/workbench/common/editor'
import { Emitter, Event } from 'vs/base/common/event'
import { EditorInput } from 'vs/workbench/common/editor/editorInput'
import { IEditorOptions, IResourceEditorInput, ITextResourceEditorInput } from 'vs/platform/editor/common/editor'
import { DEFAULT_EDITOR_MAX_DIMENSIONS, DEFAULT_EDITOR_MIN_DIMENSIONS } from 'vs/workbench/browser/parts/editor/editor'
import { applyTextEditorOptions } from 'vs/workbench/common/editor/editorOptions'
import { IEditor, ScrollType } from 'vs/editor/common/editorCommon'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { Disposable, IReference } from 'vs/base/common/lifecycle'
import { ICodeEditor } from 'vs/editor/browser/editorBrowser'
import { ITextEditorService, TextEditorService } from 'vs/workbench/services/textfile/common/textEditorService'
import 'vs/workbench/browser/parts/editor/editor.contribution'
import { unsupported } from '../tools'

type OpenEditor = (modelRef: IReference<IResolvedTextEditorModel>, options: IEditorOptions | undefined, sideBySide?: boolean) => Promise<ICodeEditor | undefined>

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

class EditorService extends Disposable implements IEditorService {
  public activeTextEditorControl: IEditor | undefined
  private _onDidActiveEditorChange = this._register(new Emitter<void>())

  constructor (
    private _openEditor: OpenEditor,
    @ITextModelService private textModelService: ITextModelService
  ) {
    super()

    setTimeout(() => {
      const codeEditorService = StandaloneServices.get(ICodeEditorService)
      this.activeTextEditorControl = codeEditorService.getFocusedCodeEditor() ?? undefined
      const handleCodeEditor = (editor: ICodeEditor) => {
        const onEditorFocused = () => {
          const newFocusedEditor = codeEditorService.getFocusedCodeEditor()
          if (newFocusedEditor !== this.activeTextEditorControl) {
            this.activeTextEditorControl = newFocusedEditor ?? undefined
            this._onDidActiveEditorChange.fire()
          }
        }
        editor.onDidFocusEditorText(onEditorFocused)
        editor.onDidFocusEditorWidget(onEditorFocused)
      }
      this._register(codeEditorService.onCodeEditorAdd(handleCodeEditor))
      codeEditorService.listCodeEditors().forEach(handleCodeEditor)
    })
  }

  readonly _serviceBrand: undefined
  onDidActiveEditorChange = this._onDidActiveEditorChange.event
  onDidVisibleEditorsChange = Event.None
  onDidEditorsChange = Event.None
  onDidCloseEditor = Event.None
  activeEditorPane: undefined
  activeEditor: undefined
  activeTextEditorLanguageId = undefined
  visibleEditorPanes = []
  visibleEditors = []
  visibleTextEditorControls = []
  editors = []
  count = 0
  getEditors = () => []

  openEditor(editor: EditorInput, options?: IEditorOptions, group?: PreferredGroup): Promise<IEditorPane | undefined>
  openEditor(editor: IUntypedEditorInput, group?: PreferredGroup): Promise<IEditorPane | undefined>
  openEditor(editor: IResourceEditorInput, group?: PreferredGroup): Promise<IEditorPane | undefined>
  openEditor(editor: ITextResourceEditorInput | IUntitledTextResourceEditorInput, group?: PreferredGroup): Promise<IEditorPane | undefined>
  openEditor(editor: IResourceDiffEditorInput, group?: PreferredGroup): Promise<ITextDiffEditorPane | undefined>
  openEditor(editor: EditorInput | IUntypedEditorInput, optionsOrPreferredGroup?: IEditorOptions | PreferredGroup, preferredGroup?: PreferredGroup): Promise<IEditorPane | undefined>
  async openEditor (editor: EditorInput | IUntypedEditorInput, optionsOrPreferredGroup?: IEditorOptions | PreferredGroup, preferredGroup?: PreferredGroup): Promise<IEditorPane | undefined> {
    const options = isEditorInput(editor) ? optionsOrPreferredGroup as IEditorOptions : editor.options

    if (isPreferredGroup(optionsOrPreferredGroup)) {
      preferredGroup = optionsOrPreferredGroup
    }

    const resource = isResourceEditorInput(editor) || isEditorInput(editor) ? editor.resource : undefined

    if (resource == null) {
      throw new Error('Diff editors not supported')
    }

    let modelEditor: ICodeEditor | undefined

    // The model doesn't exist, resolve it
    const modelRef = await this.textModelService.createModelReference(resource)

    // If the model was already existing, try to find an associated editor
    const codeEditors = StandaloneServices.get(ICodeEditorService).listCodeEditors()
    modelEditor = codeEditors.find(editor => editor.getModel() === modelRef.object.textEditorModel)

    // If there is no editor associated to the model, try to open a new one
    if (modelEditor == null) {
      modelEditor = await this._openEditor(modelRef, options, preferredGroup === SIDE_GROUP)
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
    }

    // Return a very simple editor pane, only the `getControl` method is used
    return new SimpleEditorPane(modelEditor)
  }

  openEditors = unsupported
  replaceEditors = unsupported
  isOpened = () => false
  isVisible = () => false
  findEditors = () => []
  save = async () => true
  saveAll = async () => true
  revert = unsupported
  revertAll = unsupported
  closeEditor = unsupported
  closeEditors = unsupported
}

export default function getServiceOverride (openEditor: OpenEditor): IEditorOverrideServices {
  return {
    [ITextModelService.toString()]: new SyncDescriptor(TextModelResolverService, undefined, true),
    [ICodeEditorService.toString()]: new SyncDescriptor(CodeEditorService, undefined, true),
    [IEditorService.toString()]: new SyncDescriptor(EditorService, [openEditor]),
    [ITextEditorService.toString()]: new SyncDescriptor(TextEditorService)
  }
}

export {
  OpenEditor,
  IEditorOptions,
  IResolvedTextEditorModel,
  IReference
}
