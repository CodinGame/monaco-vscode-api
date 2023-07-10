import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IResolvedTextEditorModel, ITextModelService } from 'vs/editor/common/services/resolverService'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { CodeEditorService } from 'vs/workbench/services/editor/browser/codeEditorService'
import { IEditorService, IEditorsChangeEvent, IOpenEditorsOptions, IRevertAllEditorsOptions, ISaveAllEditorsOptions, ISaveEditorsOptions, ISaveEditorsResult, IUntypedEditorReplacement, PreferredGroup } from 'vs/workbench/services/editor/common/editorService'
import { EditorInputWithOptions, EditorsOrder, GroupIdentifier, IEditorCloseEvent, IEditorIdentifier, IEditorPane, IFindEditorOptions, IResourceDiffEditorInput, IRevertOptions, ITextDiffEditorPane, IUntitledTextResourceEditorInput, IUntypedEditorInput, IVisibleEditorPane } from 'vs/workbench/common/editor'
import { Emitter, Event } from 'vs/base/common/event'
import { EditorInput } from 'vs/workbench/common/editor/editorInput'
import { IEditorOptions, IResourceEditorInput, IResourceEditorInputIdentifier, ITextResourceEditorInput } from 'vs/platform/editor/common/editor'
import { IEditor } from 'vs/editor/common/editorCommon'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { Disposable, IReference } from 'vs/base/common/lifecycle'
import { ICodeEditor, IDiffEditor } from 'vs/editor/browser/editorBrowser'
import { ITextEditorService, TextEditorService } from 'vs/workbench/services/textfile/common/textEditorService'
import { ICloseEditorOptions, IEditorGroup, IEditorReplacement } from 'vs/workbench/services/editor/common/editorGroupsService'
import { URI } from 'vs/base/common/uri'
import { OpenEditor, wrapOpenEditor } from './tools/editor'
import { unsupported } from '../tools'
import 'vs/workbench/browser/parts/editor/editor.contribution'

class SimpleEditorService extends Disposable implements IEditorService {
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
  onDidActiveEditorChange: Event<void> = this._onDidActiveEditorChange.event
  onDidVisibleEditorsChange: Event<void> = Event.None
  onDidEditorsChange: Event<IEditorsChangeEvent> = Event.None
  onDidCloseEditor: Event<IEditorCloseEvent> = Event.None
  activeEditorPane: IVisibleEditorPane | undefined
  activeEditor: EditorInput | undefined
  activeTextEditorLanguageId: string | undefined
  visibleEditorPanes: IVisibleEditorPane[] = []
  visibleEditors: EditorInput[] = []
  visibleTextEditorControls: Array<ICodeEditor | IDiffEditor> = []
  editors: EditorInput[] = []
  count: number = 0
  getEditors: (order: EditorsOrder, options?: { excludeSticky?: boolean }) => readonly IEditorIdentifier[] = () => []

  openEditor(editor: EditorInput, options?: IEditorOptions, group?: PreferredGroup): Promise<IEditorPane | undefined>
  openEditor(editor: IUntypedEditorInput, group?: PreferredGroup): Promise<IEditorPane | undefined>
  openEditor(editor: IResourceEditorInput, group?: PreferredGroup): Promise<IEditorPane | undefined>
  openEditor(editor: ITextResourceEditorInput | IUntitledTextResourceEditorInput, group?: PreferredGroup): Promise<IEditorPane | undefined>
  openEditor(editor: IResourceDiffEditorInput, group?: PreferredGroup): Promise<ITextDiffEditorPane | undefined>
  openEditor(editor: EditorInput | IUntypedEditorInput, optionsOrPreferredGroup?: IEditorOptions | PreferredGroup, preferredGroup?: PreferredGroup): Promise<IEditorPane | undefined>
  async openEditor (_editor: EditorInput | IUntypedEditorInput, _optionsOrPreferredGroup?: IEditorOptions | PreferredGroup, _preferredGroup?: PreferredGroup): Promise<IEditorPane | undefined> {
    return undefined
  }

  openEditors: (editors: Array<EditorInputWithOptions | IUntypedEditorInput>, preferredGroup?: PreferredGroup, options?: IOpenEditorsOptions) => Promise<IEditorPane[]> = unsupported
  replaceEditors: (replacements: Array<IEditorReplacement | IUntypedEditorReplacement>, group: IEditorGroup | GroupIdentifier) => Promise<void> = unsupported
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
    [IEditorService.toString()]: new SyncDescriptor(SimpleEditorService, [openEditor]),
    [ITextEditorService.toString()]: new SyncDescriptor(TextEditorService)
  }
}

export {
  OpenEditor,
  IEditorOptions,
  IResolvedTextEditorModel,
  IReference,
  SimpleEditorService
}
