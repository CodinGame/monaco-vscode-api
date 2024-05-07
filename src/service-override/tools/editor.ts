import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { isPreferredGroup, PreferredGroup, SIDE_GROUP } from 'vs/workbench/services/editor/common/editorService'
import { IEditorService } from 'vs/workbench/services/editor/common/editorService.service'
import { EditorCloseContext, EditorInputWithOptions, GroupModelChangeKind, IActiveEditorChangeEvent, IEditorCloseEvent, IEditorControl, IEditorPane, IEditorWillOpenEvent, IResourceDiffEditorInput, isEditorInput, isResourceEditorInput, ITextDiffEditorPane, IUntitledTextResourceEditorInput, IUntypedEditorInput, IVisibleEditorPane } from 'vs/workbench/common/editor'
import { EditorInput } from 'vs/workbench/common/editor/editorInput'
import { IEditorOptions, IResourceEditorInput, ITextResourceEditorInput } from 'vs/platform/editor/common/editor'
import { applyTextEditorOptions } from 'vs/workbench/common/editor/editorOptions'
import { ScrollType } from 'vs/editor/common/editorCommon'
import { ICodeEditor, IDiffEditor } from 'vs/editor/browser/editorBrowser'
import { IEditorGroupView, DEFAULT_EDITOR_MAX_DIMENSIONS, DEFAULT_EDITOR_MIN_DIMENSIONS } from 'vs/workbench/browser/parts/editor/editor'
import { IResolvedTextEditorModel, ITextModelService } from 'vs/editor/common/services/resolverService'
import { IStandaloneCodeEditor, StandaloneCodeEditor, StandaloneEditor } from 'vs/editor/standalone/browser/standaloneCodeEditor'
import { Disposable, IDisposable, IReference } from 'vs/base/common/lifecycle'
import { EditorService } from 'vs/workbench/services/editor/browser/editorService'
import { IAuxiliaryEditorPart, IEditorDropTargetDelegate, IEditorPart, IActiveEditorActions, IEditorGroup, IEditorWorkingSet } from 'vs/workbench/services/editor/common/editorGroupsService'
import { IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService.service'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration.service'
import { IWorkspaceTrustRequestService } from 'vs/platform/workspace/common/workspaceTrust.service'
import { IEditorResolverService } from 'vs/workbench/services/editor/common/editorResolverService.service'
import { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity.service'
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace.service'
import { IFileService } from 'vs/platform/files/common/files.service'
import { ITextEditorService } from 'vs/workbench/services/textfile/common/textEditorService.service'
import { IHostService } from 'vs/workbench/services/host/browser/host.service'
import { Emitter, Event } from 'vs/base/common/event'
import { TextResourceEditorInput } from 'vs/workbench/common/editor/textResourceEditorInput'
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey.service'
import { URI } from 'vs/base/common/uri'
import { IGroupModelChangeEvent } from 'vs/workbench/common/editor/editorGroupModel'
import { EditorLayoutInfo } from 'vs/editor/common/config/editorOptions'
import { IRectangle } from 'vs/platform/window/common/window'
import { mainWindow } from 'vs/base/browser/window'
import { unsupported } from '../../tools'

export type OpenEditor = (modelRef: IReference<IResolvedTextEditorModel>, options: IEditorOptions | undefined, sideBySide?: boolean) => Promise<ICodeEditor | undefined>

class EmptyEditorGroup implements IEditorGroup, IEditorGroupView {
  isTransient = () => false
  windowId = mainWindow.vscodeWindowId
  get groupsView () {
    return unsupported()
  }

  notifyLabelChanged (): void {}
  createEditorActions = unsupported
  onDidFocus = Event.None
  onDidOpenEditorFail = Event.None
  whenRestored = Promise.resolve()
  get titleHeight () {
    return unsupported()
  }

  disposed = false
  setActive = unsupported
  notifyIndexChanged = unsupported
  relayout = unsupported
  dispose = unsupported
  toJSON = unsupported
  preferredWidth?: number | undefined
  preferredHeight?: number | undefined
  get element () {
    return unsupported()
  }

  minimumWidth = 0
  maximumWidth = Number.POSITIVE_INFINITY
  minimumHeight = 0
  maximumHeight = Number.POSITIVE_INFINITY
  onDidChange = Event.None
  layout = unsupported
  onDidModelChange = Event.None
  onWillDispose = Event.None
  onDidActiveEditorChange = Event.None
  onWillCloseEditor = Event.None
  onDidCloseEditor = Event.None
  onWillMoveEditor = Event.None
  onWillOpenEditor = Event.None
  id = 0
  index = 0
  label = 'main'
  ariaLabel = 'main'
  activeEditorPane = undefined
  activeEditor = null
  previewEditor = null
  count = 0
  isEmpty = false
  isLocked = false
  stickyCount = 0
  editors = []
  get scopedContextKeyService (): IContextKeyService { return StandaloneServices.get(IContextKeyService) }
  getEditors = () => []
  findEditors = () => []
  getEditorByIndex = () => undefined
  getIndexOfEditor = unsupported
  openEditor = unsupported
  openEditors = unsupported
  isPinned = () => false
  isSticky = () => false
  isActive = () => false
  contains = () => false
  moveEditor = unsupported
  moveEditors = unsupported
  copyEditor = unsupported
  copyEditors = unsupported
  closeEditor = unsupported
  closeEditors = unsupported
  closeAllEditors = unsupported
  replaceEditors = unsupported
  pinEditor = () => {}
  stickEditor = () => {}
  unstickEditor = () => {}
  lock = () => {}
  focus (): void {
    // ignore
  }

  isFirst = unsupported
  isLast = unsupported
}

export const fakeActiveGroup = new EmptyEditorGroup()

class SimpleEditorPane implements IEditorPane {
  constructor (private editor?: ICodeEditor) {}

  onDidChangeControl = Event.None
  onDidChangeSizeConstraints = Event.None
  onDidFocus = Event.None
  onDidBlur = Event.None
  input = undefined
  options = undefined
  group = fakeActiveGroup
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

    if (resource == null || !textModelService.canHandleResource(resource)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return defaultBehavior(editor as any, optionsOrPreferredGroup as any, preferredGroup)
    }

    let modelEditor: ICodeEditor | undefined

    // If the model is already existing, try to find an associated editor
    const codeEditors = StandaloneServices.get(ICodeEditorService).listCodeEditors()
    modelEditor = codeEditors.find(editor => editor instanceof StandaloneEditor && editor.getModel() != null && editor.getModel()!.uri.toString() === resource.toString())

    if (modelEditor == null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const defaultBehaviorResult = await defaultBehavior(editor as any, optionsOrPreferredGroup as any, preferredGroup)
      if (defaultBehaviorResult != null) {
        return defaultBehaviorResult
      }

      const modelRef = await textModelService.createModelReference(resource)
      modelEditor = await fallbackBahavior?.(modelRef, options, preferredGroup === SIDE_GROUP)
      if (modelEditor == null) {
        // Dispose the newly created model if `openEditor` wasn't able to open it
        modelRef.dispose()
        return undefined
      }
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

export class MonacoEditorService extends EditorService {
  constructor (
    _openEditorFallback: OpenEditor | undefined,
    private _isEditorPartVisible: () => boolean,
    @IEditorGroupsService _editorGroupService: IEditorGroupsService,
    @IInstantiationService instantiationService: IInstantiationService,
    @IFileService fileService: IFileService,
    @IConfigurationService configurationService: IConfigurationService,
    @IWorkspaceContextService contextService: IWorkspaceContextService,
    @IUriIdentityService uriIdentityService: IUriIdentityService,
    @IEditorResolverService editorResolverService: IEditorResolverService,
    @IWorkspaceTrustRequestService workspaceTrustRequestService: IWorkspaceTrustRequestService,
    @IHostService hostService: IHostService,
    @ITextEditorService textEditorService: ITextEditorService,
    @ITextModelService textModelService: ITextModelService
  ) {
    super(
      undefined,
      _editorGroupService,
      instantiationService,
      fileService,
      configurationService,
      contextService,
      uriIdentityService,
      editorResolverService,
      workspaceTrustRequestService,
      hostService,
      textEditorService
    )

    this.openEditor = wrapOpenEditor(textModelService, this.openEditor.bind(this), _openEditorFallback)
  }

  override get activeTextEditorControl (): ICodeEditor | IDiffEditor | undefined {
    // By default, only the editor inside the EditorPart can be "active" here, hack it so the active editor is now the focused editor if it exists
    // It is required for the editor.addAction to be able to add an entry in the editor action menu
    const focusedCodeEditor = StandaloneServices.get(ICodeEditorService).getFocusedCodeEditor()
    if (focusedCodeEditor != null && focusedCodeEditor instanceof StandaloneCodeEditor) {
      return focusedCodeEditor
    }

    return super.activeTextEditorControl
  }

  // Override openEditor to fallback on user function is the EditorPart is not visible
  override openEditor(editor: EditorInput, options?: IEditorOptions, group?: PreferredGroup): Promise<IEditorPane | undefined>
  override openEditor(editor: IUntypedEditorInput, group?: PreferredGroup): Promise<IEditorPane | undefined>
  override openEditor(editor: IResourceEditorInput, group?: PreferredGroup): Promise<IEditorPane | undefined>
  override openEditor(editor: ITextResourceEditorInput | IUntitledTextResourceEditorInput, group?: PreferredGroup): Promise<IEditorPane | undefined>
  override openEditor(editor: IResourceDiffEditorInput, group?: PreferredGroup): Promise<ITextDiffEditorPane | undefined>
  override openEditor(editor: EditorInput | IUntypedEditorInput, optionsOrPreferredGroup?: IEditorOptions | PreferredGroup, preferredGroup?: PreferredGroup): Promise<IEditorPane | undefined>
  override async openEditor (editor: EditorInput | IUntypedEditorInput, optionsOrPreferredGroup?: IEditorOptions | PreferredGroup, preferredGroup?: PreferredGroup): Promise<IEditorPane | undefined> {
    // Do not try to open the file if the editor part is not displayed, let the fallback happen
    if (!this._isEditorPartVisible()) {
      return undefined
    }

    return super.openEditor(editor, optionsOrPreferredGroup, preferredGroup)
  }
}

class StandaloneEditorPane implements IVisibleEditorPane {
  constructor (public readonly editor: IStandaloneCodeEditor, public input: TextResourceEditorInput, public group: IEditorGroup) {
  }

  onDidChangeControl = Event.None

  options = undefined
  minimumWidth = 0
  maximumWidth = Number.POSITIVE_INFINITY
  minimumHeight = 0
  maximumHeight = Number.POSITIVE_INFINITY
  onDidChangeSizeConstraints = Event.None
  scopedContextKeyService = undefined
  getControl (): IEditorControl | undefined {
    return this.editor
  }

  getViewState (): object | undefined {
    return undefined
  }

  isVisible (): boolean {
    return true
  }

  onDidFocus = this.editor.onDidFocusEditorWidget
  onDidBlur = this.editor.onDidBlurEditorWidget
  hasFocus (): boolean {
    return this.editor.hasWidgetFocus()
  }

  getId (): string {
    return this.editor.getId()
  }

  getTitle (): string | undefined {
    return undefined
  }

  focus (): void {
    this.editor.focus()
  }
}

class StandaloneEditorGroup extends Disposable implements IEditorGroup, IEditorGroupView {
  private static idCounter = 0

  private pane: StandaloneEditorPane | undefined
  public active: boolean = false
  constructor (
    public editor: IStandaloneCodeEditor,
    @IInstantiationService instantiationService: IInstantiationService,
    @IContextKeyService public scopedContextKeyService: IContextKeyService
  ) {
    super()
    const onNewModel = (uri: URI) => {
      const editorInput = instantiationService.createInstance(TextResourceEditorInput, uri, undefined, undefined, undefined, undefined)

      this._onWillOpenEditor.fire({
        editor: editorInput,
        groupId: this.id
      })

      this.pane = new StandaloneEditorPane(editor, editorInput, this)

      this._onDidModelChange.fire({
        kind: GroupModelChangeKind.EDITOR_OPEN,
        editor: editorInput,
        editorIndex: 0
      })

      this._onDidActiveEditorChange.fire({
        editor: editorInput
      })
    }
    const onRemovedModel = (uri: URI) => {
      if (this.pane != null && this.pane.input.resource.toString() === uri.toString()) {
        const pane = this.pane
        this.pane = undefined
        this._onDidModelChange.fire({
          kind: GroupModelChangeKind.EDITOR_CLOSE,
          editorIndex: 0
        })

        this._onDidActiveEditorChange.fire({
          editor: undefined
        })

        this._onDidCloseEditor.fire({
          context: EditorCloseContext.UNKNOWN,
          editor: pane.input,
          groupId: this.id,
          index: 0,
          sticky: false
        })
      }
    }

    editor.onDidChangeModel((e) => {
      if (e.oldModelUrl != null) {
        onRemovedModel(e.oldModelUrl)
      }
      if (e.newModelUrl != null) {
        onNewModel(e.newModelUrl)
      }
    })
    this._register({
      dispose: () => {
        const model = editor.getModel()
        if (model != null) {
          onRemovedModel(model.uri)
        }
      }
    })
    const currentModel = editor.getModel()
    if (currentModel != null) {
      const editorInput = instantiationService.createInstance(TextResourceEditorInput, currentModel.uri, undefined, undefined, undefined, undefined)
      this.pane = new StandaloneEditorPane(editor, editorInput, this)
    }
  }

  isTransient = () => false

  windowId = mainWindow.vscodeWindowId

  get groupsView () {
    return unsupported()
  }

  notifyLabelChanged (): void {}

  createEditorActions (): IActiveEditorActions {
    return {
      actions: {
        primary: [],
        secondary: []
      },
      onDidChange: Event.None
    }
  }

  onDidFocus = this.editor.onDidFocusEditorWidget
  onDidOpenEditorFail = Event.None
  whenRestored = Promise.resolve()
  get titleHeight () { return unsupported() }
  disposed = false
  setActive (isActive: boolean) {
    this.active = isActive
  }

  notifyIndexChanged = unsupported
  relayout = unsupported
  toJSON = unsupported
  get element () {
    return this.editor.getContainerDomNode()
  }

  minimumWidth = 0
  maximumWidth = Number.POSITIVE_INFINITY
  minimumHeight = 0
  maximumHeight = Number.POSITIVE_INFINITY
  onDidChange: Event<EditorLayoutInfo> = this.editor.onDidLayoutChange
  layout = () => this.editor.layout()

  _onDidModelChange = new Emitter<IGroupModelChangeEvent>()
  onDidModelChange = this._onDidModelChange.event

  onWillDispose = this.editor.onDidDispose
  _onDidActiveEditorChange = new Emitter<IActiveEditorChangeEvent>()
  onDidActiveEditorChange = this._onDidActiveEditorChange.event

  onWillCloseEditor = Event.None

  _onDidCloseEditor = new Emitter<IEditorCloseEvent>()
  onDidCloseEditor = this._onDidCloseEditor.event

  onWillMoveEditor = Event.None

  _onWillOpenEditor = new Emitter<IEditorWillOpenEvent>()
  onWillOpenEditor = this._onWillOpenEditor.event

  readonly id = --StandaloneEditorGroup.idCounter
  index = -1
  label = `standalone editor ${-this.id}`
  ariaLabel = `standalone editor ${-this.id}`
  get activeEditorPane () {
    return this.pane
  }

  get activeEditor () {
    return this.pane?.input ?? null
  }

  previewEditor = null
  get count () {
    return this.pane != null ? 1 : 0
  }

  get isEmpty () {
    return this.pane == null
  }

  isLocked = true
  stickyCount = 0
  get editors () {
    return this.pane != null ? [this.pane.input] : []
  }

  getEditors = () => this.editors
  findEditors = (resource: URI) => this.pane != null && resource.toString() === this.pane.input.resource.toString() ? [this.pane.input] : []
  getEditorByIndex = (index: number) => this.pane != null && index === 0 ? this.pane.input : undefined
  getIndexOfEditor = (editorInput: EditorInput) => this.pane != null && this.pane.input === editorInput ? 0 : -1
  openEditor = async (editor: EditorInput): Promise<IEditorPane | undefined> => {
    if (editor.isDisposed()) {
      return undefined
    }

    if (editor instanceof TextResourceEditorInput && editor.resource.toString() === this.pane?.input.resource.toString()) {
      this.focus()
      return this.pane
    }
    return undefined
  }

  openEditors = async (editors: EditorInputWithOptions[]): Promise<IEditorPane | undefined> => {
    if (editors.length === 1) {
      return this.openEditor(editors[0]!.editor)
    }
    return undefined
  }

  isPinned = () => false
  isSticky = () => false
  isActive = () => this.editor.hasWidgetFocus()
  contains = (candidate: EditorInput | IUntypedEditorInput) => {
    return this.pane != null && this.pane.input === candidate
  }

  moveEditor = unsupported
  moveEditors = unsupported
  copyEditor = unsupported
  copyEditors = unsupported
  closeEditor = unsupported
  closeEditors = unsupported
  closeAllEditors = unsupported
  replaceEditors = unsupported
  pinEditor = () => {}
  stickEditor = () => {}
  unstickEditor = () => {}
  lock = () => {}
  focus (): void {
    this.editor.focus()
    this.editor.getContainerDomNode().scrollIntoView()
  }

  isFirst = unsupported
  isLast = unsupported
}

export class MonacoDelegateEditorGroupsService<D extends IEditorGroupsService> extends Disposable implements IEditorGroupsService {
  readonly _serviceBrand = undefined

  public additionalGroups: StandaloneEditorGroup[] = []
  public activeGroupOverride: StandaloneEditorGroup | undefined = undefined

  constructor (protected delegate: D, emptyDelegate: boolean, @IInstantiationService instantiationService: IInstantiationService) {
    super()
    setTimeout(() => {
      const codeEditorService = StandaloneServices.get(ICodeEditorService)

      const handleCodeEditor = (editor: ICodeEditor) => {
        if (editor instanceof StandaloneEditor) {
          let timeout: number | undefined
          const updateActiveGroup = (editor: StandaloneEditor | undefined) => {
            const newActiveGroup = editor != null ? this.additionalGroups.find(group => group.editor === editor) : undefined
            if (this.activeGroupOverride !== newActiveGroup) {
              this.activeGroupOverride = newActiveGroup
              this._onDidChangeActiveGroup.fire(this.activeGroup)
            }
          }
          const remoteActiveGroup = (editor: StandaloneEditor | undefined) => {
            if (!emptyDelegate && this.activeGroupOverride === this.additionalGroups.find(group => group.editor === editor)) {
              updateActiveGroup(undefined)
            }
          }

          const onEditorFocused = () => {
            if (timeout != null) window.clearTimeout(timeout)
            updateActiveGroup(editor)
          }
          const onEditorBlurred = () => {
            if (timeout != null) window.clearTimeout(timeout)
            // Do it in a timeout to be able to ignore short blur followed by focus
            // It happens when the focus goes from the editor itself to the overflow widgets dom node
            timeout = window.setTimeout(() => {
              timeout = undefined
              remoteActiveGroup(editor)
            }, 100)
          }
          editor.onDidDispose(() => {
            remoteActiveGroup(editor)
          })
          editor.onDidFocusEditorText(onEditorFocused)
          editor.onDidFocusEditorWidget(onEditorFocused)
          editor.onDidBlurEditorText(onEditorBlurred)
          editor.onDidBlurEditorWidget(onEditorBlurred)
          if (editor.hasWidgetFocus()) {
            onEditorFocused()
          }

          const newGroup = instantiationService.createInstance(StandaloneEditorGroup, editor)
          this.additionalGroups.push(newGroup)
          this._onDidAddGroup.fire(newGroup)
        }
      }
      const handleCodeEditorRemoved = (editor: ICodeEditor) => {
        if (editor instanceof StandaloneEditor) {
          const removedGroup = this.additionalGroups.find(group => group.editor === editor)
          if (removedGroup != null) {
            removedGroup.dispose()
            if (this.activeGroupOverride === removedGroup) {
              this.activeGroupOverride = undefined
              this._onDidChangeActiveGroup.fire(this.activeGroup)
            }
            this.additionalGroups = this.additionalGroups.filter(group => group !== removedGroup)
            this._onDidRemoveGroup.fire(removedGroup)
          }
        }
      }
      this._register(codeEditorService.onCodeEditorAdd(handleCodeEditor))
      this._register(codeEditorService.onCodeEditorRemove(handleCodeEditorRemoved))
      codeEditorService.listCodeEditors().forEach(handleCodeEditor)
    })
  }

  saveWorkingSet (name: string): IEditorWorkingSet {
    return this.delegate.saveWorkingSet(name)
  }

  getWorkingSets (): IEditorWorkingSet[] {
    return this.delegate.getWorkingSets()
  }

  applyWorkingSet (workingSet: IEditorWorkingSet | 'empty'): Promise<boolean> {
    return this.delegate.applyWorkingSet(workingSet)
  }

  deleteWorkingSet (workingSet: IEditorWorkingSet): void {
    return this.delegate.deleteWorkingSet(workingSet)
  }

  get isReady (): IEditorGroupsService['isReady'] {
    return this.delegate.isReady
  }

  get whenReady (): IEditorGroupsService['whenReady'] {
    return this.delegate.whenReady
  }

  get whenRestored (): IEditorGroupsService['whenRestored'] {
    return this.delegate.whenRestored
  }

  get hasRestorableState (): IEditorGroupsService['hasRestorableState'] {
    return this.delegate.hasRestorableState
  }

  onDidCreateAuxiliaryEditorPart = this.delegate.onDidCreateAuxiliaryEditorPart
  get parts (): IEditorGroupsService['parts'] { return this.delegate.parts }
  createAuxiliaryEditorPart (options?: { bounds?: Partial<IRectangle> | undefined } | undefined): Promise<IAuxiliaryEditorPart> {
    return this.delegate.createAuxiliaryEditorPart(options)
  }

  get mainPart (): IEditorGroupsService['mainPart'] { return this.delegate.mainPart }
  onDidChangeGroupMaximized = this.delegate.onDidChangeGroupMaximized
  getPart(group: number | IEditorGroup): IEditorPart
  getPart(container: unknown): IEditorPart | undefined
  getPart (container: unknown): IEditorPart | undefined {
    return this.delegate.getPart(container)
  }

  toggleMaximizeGroup (group?: number | IEditorGroup | undefined): void {
    return this.delegate.toggleMaximizeGroup(group)
  }

  toggleExpandGroup (group?: number | IEditorGroup | undefined): void {
    return this.delegate.toggleExpandGroup(group)
  }

  createEditorDropTarget (container: unknown, delegate: IEditorDropTargetDelegate): IDisposable {
    return this.delegate.createEditorDropTarget(container, delegate)
  }

  public get groups (): IEditorGroup[] {
    return [...this.additionalGroups, ...this.delegate.groups]
  }

  public get activeGroup (): IEditorGroup {
    return this.activeGroupOverride ?? this.delegate.activeGroup
  }

  _onDidChangeActiveGroup = new Emitter<IEditorGroup>()
  onDidChangeActiveGroup = Event.any(this._onDidChangeActiveGroup.event, this.delegate.onDidChangeActiveGroup)

  _onDidAddGroup = new Emitter<IEditorGroup>()
  onDidAddGroup = Event.any(this._onDidAddGroup.event, this.delegate.onDidAddGroup)

  _onDidRemoveGroup = new Emitter<IEditorGroup>()
  onDidRemoveGroup = Event.any(this._onDidRemoveGroup.event, this.delegate.onDidRemoveGroup)

  onDidMoveGroup = this.delegate.onDidMoveGroup
  onDidActivateGroup = this.delegate.onDidActivateGroup
  onDidChangeGroupIndex = this.delegate.onDidChangeGroupIndex
  onDidChangeGroupLocked = this.delegate.onDidChangeGroupLocked
  get sideGroup (): IEditorGroupsService['sideGroup'] { return this.delegate.sideGroup }
  get count (): IEditorGroupsService['count'] { return this.delegate.count + this.additionalGroups.length }
  get orientation (): IEditorGroupsService['orientation'] { return this.delegate.orientation }
  get partOptions (): IEditorGroupsService['partOptions'] { return this.delegate.partOptions }

  getLayout: IEditorGroupsService['getLayout'] = () => {
    return this.delegate.getLayout()
  }

  getGroups: IEditorGroupsService['getGroups'] = (order) => {
    return [...this.delegate.getGroups(order), ...this.additionalGroups]
  }

  getGroup: IEditorGroupsService['getGroup'] = (identifier) => {
    return this.delegate.getGroup(identifier) ?? this.additionalGroups.find(group => group.id === identifier)
  }

  activateGroup: IEditorGroupsService['activateGroup'] = (...args) => {
    return this.delegate.activateGroup(...args)
  }

  getSize: IEditorGroupsService['getSize'] = (...args) => {
    return this.delegate.getSize(...args)
  }

  setSize: IEditorGroupsService['setSize'] = (...args) => {
    return this.delegate.setSize(...args)
  }

  arrangeGroups: IEditorGroupsService['arrangeGroups'] = (...args) => {
    return this.delegate.arrangeGroups(...args)
  }

  applyLayout: IEditorGroupsService['applyLayout'] = (...args) => {
    return this.delegate.applyLayout(...args)
  }

  setGroupOrientation: IEditorGroupsService['setGroupOrientation'] = (...args) => {
    return this.delegate.setGroupOrientation(...args)
  }

  findGroup: IEditorGroupsService['findGroup'] = (...args) => {
    return this.delegate.findGroup(...args)
  }

  addGroup: IEditorGroupsService['addGroup'] = (...args) => {
    return this.delegate.addGroup(...args)
  }

  removeGroup: IEditorGroupsService['removeGroup'] = (...args) => {
    return this.delegate.removeGroup(...args)
  }

  moveGroup: IEditorGroupsService['moveGroup'] = (...args) => {
    return this.delegate.moveGroup(...args)
  }

  mergeGroup: IEditorGroupsService['mergeGroup'] = (...args) => {
    return this.delegate.mergeGroup(...args)
  }

  mergeAllGroups: IEditorGroupsService['mergeAllGroups'] = (...args) => {
    return this.delegate.mergeAllGroups(...args)
  }

  copyGroup: IEditorGroupsService['copyGroup'] = (...args) => {
    return this.delegate.copyGroup(...args)
  }

  onDidChangeEditorPartOptions = this.delegate.onDidChangeEditorPartOptions
}
