import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { Event } from 'vs/base/common/event'
import type { IResolvedTextEditorModel } from 'vs/editor/common/services/resolverService'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { CodeEditorService } from 'vs/workbench/services/editor/browser/codeEditorService'
import { IEditorService } from 'vs/workbench/services/editor/common/editorService.service'
import type { IEditorOptions } from 'vs/platform/editor/common/editor'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import type { IReference } from 'vs/base/common/lifecycle'
import { TextEditorService } from 'vs/workbench/services/textfile/common/textEditorService'
import { ITextEditorService } from 'vs/workbench/services/textfile/common/textEditorService.service'
import {
  GroupOrientation,
  type IEditorPart
} from 'vs/workbench/services/editor/common/editorGroupsService'
import { IEditorGroupsService } from 'vs/workbench/services/editor/common/editorGroupsService.service'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { DEFAULT_EDITOR_PART_OPTIONS } from 'vs/workbench/browser/parts/editor/editor'
import { mainWindow } from 'vs/base/browser/window'
import {
  MonacoDelegateEditorGroupsService,
  MonacoEditorService,
  type OpenEditor,
  fakeActiveGroup
} from './tools/editor'
import { unsupported } from '../tools'
import 'vs/workbench/browser/parts/editor/editor.contribution._autosave.js'
import 'vs/workbench/contrib/files/browser/files.contribution._fileEditorFactory.js'
import 'vs/workbench/contrib/files/browser/fileCommands._save.js'

class EmptyEditorPart implements IEditorPart {
  onWillDispose = Event.None
  hasMaximizedGroup = () => false
  windowId = mainWindow.vscodeWindowId
  onDidLayout = Event.None
  onDidScroll = Event.None
  get contentDimension(): never {
    return unsupported()
  }

  isReady = true
  whenReady = Promise.resolve()
  whenRestored = Promise.resolve()
  hasRestorableState = false
  centerLayout = unsupported
  isLayoutCentered = unsupported
  enforcePartOptions = unsupported
  onDidChangeActiveGroup = Event.None
  onDidAddGroup = Event.None
  onDidRemoveGroup = Event.None
  onDidMoveGroup = Event.None
  onDidActivateGroup = Event.None
  onDidChangeGroupIndex = Event.None
  onDidChangeGroupLocked = Event.None
  onDidChangeGroupMaximized = Event.None
  activeGroup = fakeActiveGroup
  get sideGroup(): never {
    return unsupported()
  }

  groups = [fakeActiveGroup]
  count = 0
  orientation = GroupOrientation.HORIZONTAL
  getGroups = () => []
  getGroup = () => undefined
  activateGroup = unsupported
  getSize = unsupported
  setSize = unsupported
  arrangeGroups = unsupported
  toggleMaximizeGroup = unsupported
  toggleExpandGroup = unsupported
  applyLayout = unsupported
  getLayout = unsupported
  setGroupOrientation = unsupported
  findGroup = () => undefined
  addGroup = unsupported
  removeGroup = unsupported
  moveGroup = unsupported
  mergeGroup = unsupported
  mergeAllGroups = unsupported
  copyGroup = unsupported
  partOptions = DEFAULT_EDITOR_PART_OPTIONS

  onDidChangeEditorPartOptions = Event.None
  createEditorDropTarget = unsupported
}

class EmptyEditorGroupsService implements IEditorGroupsService {
  getScopedInstantiationService = unsupported
  registerContextKeyProvider = unsupported
  saveWorkingSet = unsupported
  getWorkingSets = unsupported
  applyWorkingSet = unsupported
  deleteWorkingSet = unsupported
  onDidCreateAuxiliaryEditorPart = Event.None

  mainPart = new EmptyEditorPart()
  activePart = this.mainPart
  parts = [this.mainPart]

  getPart = unsupported
  createAuxiliaryEditorPart = unsupported
  onDidChangeGroupMaximized = Event.None
  toggleMaximizeGroup = unsupported
  toggleExpandGroup = unsupported
  partOptions = DEFAULT_EDITOR_PART_OPTIONS

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
  get contentDimension(): never {
    return unsupported()
  }

  activeGroup = fakeActiveGroup
  get sideGroup(): never {
    return unsupported()
  }

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
  constructor(@IInstantiationService instantiationService: IInstantiationService) {
    super(instantiationService.createInstance(EmptyEditorGroupsService), true, instantiationService)
  }
}

export default function getServiceOverride(openEditor: OpenEditor): IEditorOverrideServices {
  return {
    [ICodeEditorService.toString()]: new SyncDescriptor(CodeEditorService, undefined, true),
    [IEditorService.toString()]: new SyncDescriptor(
      MonacoEditorService,
      [openEditor, () => false],
      true
    ),
    [ITextEditorService.toString()]: new SyncDescriptor(TextEditorService, [], false),
    [IEditorGroupsService.toString()]: new SyncDescriptor(MonacoEditorGroupsService)
  }
}

export { MonacoEditorService }
export type { OpenEditor, IEditorOptions, IResolvedTextEditorModel, IReference }
