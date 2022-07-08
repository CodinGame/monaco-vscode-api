import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IResolvedTextEditorModel, ITextModelService } from 'vs/editor/common/services/resolverService'
import { TextModelResolverService } from 'vs/workbench/services/textmodelResolver/common/textModelResolverService'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { CodeEditorService } from 'vs/workbench/services/editor/browser/codeEditorService'
import { IEditorService, isPreferredGroup, PreferredGroup, SIDE_GROUP } from 'vs/workbench/services/editor/common/editorService'
import { IEditorControl, IEditorPane, IResourceDiffEditorInput, isEditorInput, isResourceEditorInput, ITextDiffEditorPane, IUntitledTextResourceEditorInput, IUntypedEditorInput } from 'vs/workbench/common/editor'
import { Event } from 'vs/base/common/event'
import { EditorInput } from 'vs/workbench/common/editor/editorInput'
import { IEditorOptions, IResourceEditorInput, ITextResourceEditorInput } from 'vs/platform/editor/common/editor'
import { DEFAULT_EDITOR_MAX_DIMENSIONS, DEFAULT_EDITOR_MIN_DIMENSIONS } from 'vs/workbench/browser/parts/editor/editor'
import { ICodeEditor } from 'vs/editor/browser/editorBrowser'
import { applyTextEditorOptions } from 'vs/workbench/common/editor/editorOptions'
import { ScrollType } from 'vs/editor/common/editorCommon'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ITextModel } from 'vs/editor/common/model'
import { IReference } from 'vs/base/common/lifecycle'
import { URI } from 'vs/base/common/uri'
import { IModelService } from '../services'
import { unsupported } from '../tools'

type OpenEditor = (model: ITextModel, options: IEditorOptions | undefined, sideBySide?: boolean) => Promise<ICodeEditor | undefined>

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

class EditorService implements IEditorService {
  constructor (
    private _openEditor: OpenEditor,
    @ITextModelService private textModelService: ITextModelService
  ) {}

  readonly _serviceBrand: undefined
  onDidActiveEditorChange = Event.None
  onDidVisibleEditorsChange = Event.None
  onDidEditorsChange = Event.None
  onDidCloseEditor = Event.None
  activeEditorPane: undefined
  activeEditor: undefined
  activeTextEditorControl = undefined
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

    // Try to get the existing model
    const modelService = StandaloneServices.get(IModelService)
    let model = modelService.getModel(resource)

    let newModelRef: IReference<IResolvedTextEditorModel> | undefined
    if (model == null) {
      // The model doesn't exist, resolve it
      const modelRef = await this.textModelService.createModelReference(resource)
      model = modelRef.object.textEditorModel
    } else {
      // If the model was already existing, try to find an associated editor
      const codeEditors = StandaloneServices.get(ICodeEditorService).listCodeEditors()
      modelEditor = codeEditors.find(editor => editor.getModel() === model)
    }

    // If there is no editor associated to the model, try to open a new one
    if (modelEditor == null) {
      modelEditor = await this._openEditor(model, options, preferredGroup === SIDE_GROUP)
    }

    if (modelEditor == null) {
      // Dispose the newly created model if `openEditor` wasn't able to open it
      newModelRef?.dispose()
      return undefined
    }

    if (options != null) {
      // Apply selection
      applyTextEditorOptions(options, modelEditor, ScrollType.Immediate)
    }

    modelEditor.focus()

    // Return a very simple editor pane, only the `getControl` method is used
    return new SimpleEditorPane(modelEditor)
  }

  openEditors = unsupported
  replaceEditors = unsupported
  isOpened = () => false
  isVisible = () => false
  findEditors = () => []
  save = unsupported
  saveAll = unsupported
  revert = unsupported
  revertAll = unsupported
}

/**
 * Vscode manage models by using the EditorInput class
 * The EditorInput class keeps a reference to the model, preventing it from being destroyed
 * With monaco, we don't have this class, but the only way to retrieve a model is to use the createModelReference method which returns a ref
 * We don't want the user to manipulate ref, so we just provide the model to them.
 * The user may want to dispose the model when there is no more usage of it, but doing so doesn't dispose the ref
 * This class just force dispose the refs when the model is disposed
 */
class CustomTextModelResolverService extends TextModelResolverService {
  override async createModelReference (resource: URI) {
    const ref = await super.createModelReference(resource)
    // Dispose the ref when the model is disposed or we'll get a disposed model next time
    ref.object.textEditorModel.onWillDispose(() => {
      ref.dispose()
    })
    return ref
  }
}

export default function getServiceOverride (openEditor: OpenEditor): IEditorOverrideServices {
  return {
    [ITextModelService.toString()]: new SyncDescriptor(CustomTextModelResolverService),
    [ICodeEditorService.toString()]: new SyncDescriptor(CodeEditorService),
    [IEditorService.toString()]: new SyncDescriptor(EditorService, [openEditor])
  }
}

export {
  OpenEditor,
  IEditorOptions
}
