import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { Event } from 'vs/base/common/event'
import { IResolvedTextEditorModel } from 'vs/editor/common/services/resolverService'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { CodeEditorService } from 'vs/workbench/services/editor/browser/codeEditorService'
import { IEditorService } from 'vs/workbench/services/editor/common/editorService'
import { EditorExtensions, IEditorFactoryRegistry, IFileEditorInput } from 'vs/workbench/common/editor'
import { IEditorOptions } from 'vs/platform/editor/common/editor'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IReference } from 'vs/base/common/lifecycle'
import { ITextEditorService, TextEditorService } from 'vs/workbench/services/textfile/common/textEditorService'
import { Registry } from 'vs/platform/registry/common/platform'
import { FILE_EDITOR_INPUT_ID } from 'vs/workbench/contrib/files/common/files'
import { GroupOrientation, IEditorGroup, IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey'
import { IEditorGroupView } from 'vs/workbench/browser/parts/editor/editor'
import { MonacoDelegateEditorGroupsService, MonacoEditorService, OpenEditor } from './tools/editor'
import { unsupported } from '../tools'
import 'vs/workbench/browser/parts/editor/editor.contribution'

class EmptyEditorGroup implements IEditorGroup, IEditorGroupView {
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

const fakeActiveGroup = new EmptyEditorGroup()

class EmptyEditorGroupsService implements IEditorGroupsService {
  onDidCreateAuxiliaryEditorPart = Event.None
  parts = []
  get activePart () {
    return unsupported()
  }

  get mainPart () {
    return unsupported()
  }

  getPart = unsupported
  createAuxiliaryEditorPart = unsupported
  onDidChangeGroupMaximized = Event.None
  toggleMaximizeGroup = unsupported
  toggleExpandGroup = unsupported
  get partOptions () {
    return unsupported()
  }

  createEditorDropTarget = unsupported
  readonly _serviceBrand = undefined
  getLayout = unsupported
  onDidChangeActiveGroup = Event.None
  onDidAddGroup = Event.None
  onDidRemoveGroup = Event.None
  onDidMoveGroup = Event.None
  onDidActivateGroup = Event.None
  onDidLayout = Event.None
  onDidScroll = Event.None
  onDidChangeGroupIndex = Event.None
  onDidChangeGroupLocked = Event.None
  get contentDimension (): never { return unsupported() }
  activeGroup = fakeActiveGroup
  get sideGroup (): never { return unsupported() }
  groups = [fakeActiveGroup]
  count = 0
  orientation = GroupOrientation.HORIZONTAL
  isReady = false
  whenReady = Promise.resolve()
  whenRestored = Promise.resolve()
  hasRestorableState = false
  getGroups = (): never[] => []
  getGroup = (): undefined => undefined
  activateGroup = unsupported
  getSize = unsupported
  setSize = unsupported
  arrangeGroups = unsupported
  applyLayout = unsupported
  centerLayout = unsupported
  isLayoutCentered = (): boolean => false
  setGroupOrientation = unsupported
  findGroup = (): undefined => undefined
  addGroup = unsupported
  removeGroup = unsupported
  moveGroup = unsupported
  mergeGroup = unsupported
  mergeAllGroups = unsupported
  copyGroup = unsupported
  onDidChangeEditorPartOptions = Event.None
  enforcePartOptions = unsupported
}

class MonacoEditorGroupsService extends MonacoDelegateEditorGroupsService<EmptyEditorGroupsService> {
  constructor (@IInstantiationService instantiationService: IInstantiationService) {
    super(
      instantiationService.createInstance(EmptyEditorGroupsService),
      instantiationService
    )
  }
}

/**
 * Register a fake file editor factory
 * The code check that there is a registered factory even if it's not used
 */
Registry.as<IEditorFactoryRegistry>(EditorExtensions.EditorFactory).registerFileEditorFactory({
  typeId: FILE_EDITOR_INPUT_ID,
  createFileEditor: unsupported,
  isFileEditor: (obj): obj is IFileEditorInput => false
})

export default function getServiceOverride (openEditor: OpenEditor): IEditorOverrideServices {
  return {
    [ICodeEditorService.toString()]: new SyncDescriptor(CodeEditorService, undefined, true),
    [IEditorService.toString()]: new SyncDescriptor(MonacoEditorService, [openEditor, () => false], true),
    [ITextEditorService.toString()]: new SyncDescriptor(TextEditorService, [], false),
    [IEditorGroupsService.toString()]: new SyncDescriptor(MonacoEditorGroupsService)
  }
}

export {
  OpenEditor,
  IEditorOptions,
  IResolvedTextEditorModel,
  IReference,
  MonacoEditorService
}
