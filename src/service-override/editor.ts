import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IResolvedTextEditorModel, ITextModelService } from 'vs/editor/common/services/resolverService'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { CodeEditorService } from 'vs/workbench/services/editor/browser/codeEditorService'
import { IEditorService, IRevertAllEditorsOptions, ISaveAllEditorsOptions, ISaveEditorsOptions, ISaveEditorsResult, PreferredGroup, SIDE_GROUP_TYPE } from 'vs/workbench/services/editor/common/editorService'
import { EditorsOrder, IEditorIdentifier, IEditorPane, IFindEditorOptions, IResourceDiffEditorInput, IRevertOptions, ITextDiffEditorPane, IUntitledTextResourceEditorInput, IUntypedEditorInput } from 'vs/workbench/common/editor'
import { Emitter, Event } from 'vs/base/common/event'
import { EditorInput } from 'vs/workbench/common/editor/editorInput'
import { IEditorOptions, IResourceEditorInput, IResourceEditorInputIdentifier, ITextResourceEditorInput } from 'vs/platform/editor/common/editor'
import { IEditor } from 'vs/editor/common/editorCommon'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { Disposable, IReference } from 'vs/base/common/lifecycle'
import { ICodeEditor } from 'vs/editor/browser/editorBrowser'
import { ITextEditorService, TextEditorService } from 'vs/workbench/services/textfile/common/textEditorService'
import { ICloseEditorOptions } from 'vs/workbench/services/editor/common/editorGroupsService'
import { URI } from 'vs/base/common/uri'
import { OpenEditor, wrapOpenEditor } from './tools/editor'
import { unsupported } from '../tools'
import 'vs/workbench/browser/parts/editor/editor.contribution'

class EditorService extends Disposable implements IEditorService {
  public activeTextEditorControl: IEditor | undefined
  private _onDidActiveEditorChange = this._register(new Emitter<void>())

  constructor (
    _openEditor: OpenEditor,
    @ITextModelService textModelService: ITextModelService
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

    this.openEditor = wrapOpenEditor(textModelService, this.openEditor.bind(this), _openEditor)
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
  getEditors: (order: EditorsOrder, options?: { excludeSticky?: boolean
}) => readonly IEditorIdentifier[] = () => []

  openEditor(editor: EditorInput, options?: IEditorOptions, group?: PreferredGroup): Promise<IEditorPane | undefined>
  openEditor(editor: IUntypedEditorInput, group?: PreferredGroup): Promise<IEditorPane | undefined>
  openEditor(editor: IResourceEditorInput, group?: PreferredGroup): Promise<IEditorPane | undefined>
  openEditor(editor: ITextResourceEditorInput | IUntitledTextResourceEditorInput, group?: PreferredGroup): Promise<IEditorPane | undefined>
  openEditor(editor: IResourceDiffEditorInput, group?: PreferredGroup): Promise<ITextDiffEditorPane | undefined>
  openEditor(editor: EditorInput | IUntypedEditorInput, optionsOrPreferredGroup?: IEditorOptions | PreferredGroup, preferredGroup?: PreferredGroup): Promise<IEditorPane | undefined>
  async openEditor (): Promise<IEditorPane | undefined> {
    return undefined
  }

  openEditors = unsupported
  replaceEditors = unsupported
  isOpened: (editor: IResourceEditorInputIdentifier) => boolean = () => false
  isVisible: (editor: EditorInput) => boolean = () => false
  findEditors(resource: URI, options?: IFindEditorOptions): readonly IEditorIdentifier[]
  findEditors(editor: IResourceEditorInputIdentifier, options?: IFindEditorOptions): readonly IEditorIdentifier[]
  findEditors (): readonly IEditorIdentifier[] { return [] }
  save: (editors: IEditorIdentifier | IEditorIdentifier[], options?: ISaveEditorsOptions) => Promise<ISaveEditorsResult> = async () => ({ success: true, editors: [] })
  saveAll: (options?: ISaveAllEditorsOptions) => Promise<ISaveEditorsResult> = async () => ({ success: true, editors: [] })
  revert: (editors: IEditorIdentifier | IEditorIdentifier[], options?: IRevertOptions) => Promise<boolean> = unsupported
  revertAll: (options?: IRevertAllEditorsOptions) => Promise<boolean> = unsupported
  closeEditor: (editor: IEditorIdentifier, options?: ICloseEditorOptions) => Promise<void> = unsupported
  closeEditors: (editors: readonly IEditorIdentifier[], options?: ICloseEditorOptions) => Promise<void> = unsupported
}

export default function getServiceOverride (openEditor: OpenEditor): IEditorOverrideServices {
  return {
    [ICodeEditorService.toString()]: new SyncDescriptor(CodeEditorService, undefined, true),
    [IEditorService.toString()]: new SyncDescriptor(EditorService, [openEditor]),
    [ITextEditorService.toString()]: new SyncDescriptor(TextEditorService)
  }
}

export {
  OpenEditor,
  IEditorOptions,
  IResolvedTextEditorModel,
  IReference,
  EditorService as SimpleEditorService
}
