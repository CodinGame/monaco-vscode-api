import { QuickInputController } from 'vs/platform/quickinput/browser/quickInput'
// @ts-ignore Creating a d.ts is not worth it
import { VSBuffer as MonacoVSBuffer } from 'monaco-editor/esm/vs/base/common/buffer.js'
import { VSBuffer as VScodeVSBuffer } from 'vscode/vs/base/common/buffer.js'
// @ts-ignore Creating a d.ts is not worth it
import { Themable as MonacoThemable } from 'monaco-editor/esm/vs/platform/theme/common/themeService.js'
import { Extensions as ThemeExtensions, IThemingRegistry, Themable as VScodeThemable } from 'vscode/vs/platform/theme/common/themeService.js'
import { Extensions as JsonExtensions, IJSONContributionRegistry } from 'vscode/vs/platform/jsonschemas/common/jsonContributionRegistry.js'
// @ts-ignore Creating a d.ts is not worth it
import { ProgressBar as MonacoProgressBar } from 'monaco-editor/esm/vs/base/browser/ui/progressbar/progressbar.js'
import { ProgressBar as VScodeProgressBar } from 'vscode/vs/base/browser/ui/progressbar/progressbar.js'
import { getSingletonServiceDescriptors } from 'vs/platform/instantiation/common/extensions'
import { ILabelService } from 'vs/platform/label/common/label'
import { Emitter, Event } from 'vs/base/common/event'
import { IQuickInput, IQuickPick } from 'vs/platform/quickinput/common/quickInput'
// @ts-ignore Creating a d.ts is not worth it
import { LanguageService as MonacoLanguageService } from 'monaco-editor/esm/vs/editor/common/services/languageService.js'
import { LanguageService as VScodeLanguageService } from 'vscode/vs/editor/common/services/languageService.js'
// @ts-ignore Creating a d.ts is not worth it
import { NoOpNotification as MonacoNoOpNotification } from 'monaco-editor/esm/vs/platform/notification/common/notification.js'
import { NoOpNotification as VScodeNoOpNotification } from 'vscode/vs/platform/notification/common/notification.js'
import { Registry } from 'vs/platform/registry/common/platform'
import { Extensions as ConfigurationExtensions, IConfigurationRegistry } from 'vs/platform/configuration/common/configurationRegistry'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
// @ts-ignore Creating a d.ts is not worth it
import { StandaloneConfigurationService as MonacoStandaloneConfigurationService } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js'
import { StandaloneConfigurationService as VScodeStandaloneConfigurationService } from 'vscode/vs/editor/standalone/browser/standaloneServices.js'
// @ts-ignore Creating a d.ts is not worth it
import { TernarySearchTree as MonacoTernarySearchTree } from 'monaco-editor/esm/vs/base/common/ternarySearchTree.js'
import { TernarySearchTree as VScodeTernarySearchTree } from 'vscode/vs/base/common/ternarySearchTree.js'
// @ts-ignore Creating a d.ts is not worth it
import { Configuration as MonacoConfiguration } from 'monaco-editor/esm/vs/platform/configuration/common/configurationModels.js'
import { Configuration as VScodeConfiguration } from 'vscode/vs/platform/configuration/common/configurationModels.js'
// @ts-ignore Creating a d.ts is not worth it
import { RawContextKey as MonacoRawContextKey, ContextKeyExpr as MonacoContextKeyExpr } from 'monaco-editor/esm/vs/platform/contextkey/common/contextkey.js'
import { RawContextKey as VScodeRawContextKey, ContextKeyExpr as VScodeContextKeyExpr } from 'vscode/vs/platform/contextkey/common/contextkey.js'
// @ts-ignore Creating a d.ts is not worth it
import { ErrorHandler as MonacoErrorHandler } from 'monaco-editor/esm/vs/base/common/errors.js'
import { ErrorHandler as VScodeErrorHandler } from 'vscode/vs/base/common/errors.js'
// @ts-ignore Creating a d.ts is not worth it
import { LanguagesRegistry as MonacoLanguagesRegistry } from 'monaco-editor/esm/vs/editor/common/services/languagesRegistry.js'
import { LanguagesRegistry as VScodeLanguagesRegistry } from 'vscode/vs/editor/common/services/languagesRegistry.js'
// @ts-ignore Creating a d.ts is not worth it
import { WorkspaceFolder as MonacoWorkspaceFolder } from 'monaco-editor/esm/vs/platform/workspace/common/workspace.js'
import { IWorkspaceContextService, WorkbenchState, WorkspaceFolder as VScodeWorkspaceFolder } from 'vscode/vs/platform/workspace/common/workspace.js'
// @ts-ignore Creating a d.ts is not worth it
import { List as MonacoList } from 'monaco-editor/esm/vs/base/browser/ui/list/listWidget.js'
import { List as VScodeList } from 'vscode/vs/base/browser/ui/list/listWidget.js'
// @ts-ignore Creating a d.ts is not worth it
import { Color as MonacoColor, RGBA as MonacoRGBA } from 'monaco-editor/esm/vs/base/common/color.js'
import { Color as VScodeColor, RGBA as VScodeRGBA } from 'vscode/vs/base/common/color.js'
// @ts-ignore Creating a d.ts is not worth it
import { LogService as MonacoLogService } from 'monaco-editor/esm/vs/platform/log/common/logService.js'
import { LogService as VScodeLogService } from 'vscode/vs/platform/log/common/logService.js'
// @ts-ignore Creating a d.ts is not worth it
import { SnippetParser } from 'monaco-editor/esm/vs/editor/contrib/snippet/browser/snippetParser.js'
// @ts-ignore Creating a d.ts is not worth it
import { DefaultConfiguration as MonacoDefaultConfiguration } from 'monaco-editor/esm/vs/platform/configuration/common/configurations.js'
import { DefaultConfiguration as VScodeDefaultConfiguration } from 'vscode/vs/platform/configuration/common/configurations.js'
// @ts-ignore Creating a d.ts is not worth it
import { Keybinding as MonacoKeybinding, KeyCodeChord as MonacoKeyCodeChord } from 'monaco-editor/esm/vs/base/common/keybindings.js'
import { Keybinding as VScodeKeybinding, KeyCodeChord as VScodeKeyCodeChord } from 'vscode/vs/base/common/keybindings.js'
// @ts-ignore Creating a d.ts is not worth it
import { DisposableMap as MonacoDisposableMap } from 'monaco-editor/esm/vs/base/common/lifecycle.js'
import { DisposableMap as VScodeDisposableMap } from 'vscode/vs/base/common/lifecycle.js'
// @ts-ignore Creating a d.ts is not worth it
import { FileAccess as MonacoFileAccess } from 'monaco-editor/esm/vs/base/common/network.js'
import { FileAccess as VScodeFileAccess } from 'vscode/vs/base/common/network.js'
import { GhostTextController } from 'vs/editor/contrib/inlineCompletions/browser/ghostTextController'
// @ts-ignore Creating a d.ts is not worth it
import { AsyncDataTree as MonacoAsyncDataTree } from 'monaco-editor/esm/vs/base/browser/ui/tree/asyncDataTree.js'
import { AsyncDataTree as VScodeAsyncDataTree } from 'vscode/vs/base/browser/ui/tree/asyncDataTree.js'
// @ts-ignore Creating a d.ts is not worth it
import { AbstractTree as MonacoAbstractTree } from 'monaco-editor/esm/vs/base/browser/ui/tree/abstractTree.js'
import { AbstractTree as VScodeAbstractTree } from 'vscode/vs/base/browser/ui/tree/abstractTree.js'
// @ts-ignore Creating a d.ts is not worth it
import { AbstractCodeEditorService as MonacoAbstractCodeEditorService } from 'monaco-editor/esm/vs/editor/browser/services/abstractCodeEditorService.js'
import { AbstractCodeEditorService as VScodeAbstractCodeEditorService } from 'vscode/vs/editor/browser/services/abstractCodeEditorService.js'
// @ts-ignore Creating a d.ts is not worth it
import { CodeEditorWidget as MonacoCodeEditorWidget } from 'monaco-editor/esm/vs/editor/browser/widget/codeEditorWidget.js'
import { CodeEditorWidget as VScodeCodeEditorWidget } from 'vscode/vs/editor/browser/widget/codeEditorWidget.js'
// @ts-ignore Creating a d.ts is not worth it
import { PieceTreeTextBufferBuilder as MonacoPieceTreeTextBufferBuilder } from 'monaco-editor/esm/vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder.js'
import { PieceTreeTextBufferBuilder as VScodePieceTreeTextBufferBuilder } from 'vscode/vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder.js'
// @ts-ignore Creating a d.ts is not worth it
import { PieceTreeTextBuffer as MonacoPieceTreeTextBuffer } from 'monaco-editor/esm/vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBuffer.js'
import { PieceTreeTextBuffer as VScodePieceTreeTextBuffer } from 'vscode/vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBuffer.js'
// @ts-ignore Creating a d.ts is not worth it
import { ModelService as MonacoModelService } from 'monaco-editor/esm/vs/editor/common/services/modelService.js'
import { ModelService as VScodeModelService } from 'vscode/vs/editor/common/services/modelService.js'
// @ts-ignore Creating a d.ts is not worth it
import { AbstractContextKeyService as MonacoAbstractContextKeyService } from 'monaco-editor/esm/vs/platform/contextkey/browser/contextKeyService.js'
import { AbstractContextKeyService as VScodeAbstractContextKeyService } from 'vscode/vs/platform/contextkey/browser/contextKeyService.js'
// @ts-ignore Creating a d.ts is not worth it
import { ListView as MonacoListView } from 'monaco-editor/esm/vs/base/browser/ui/list/listView.js'
import { ListView as VScodeListView } from 'vscode/vs/base/browser/ui/list/listView.js'
// @ts-ignore Creating a d.ts is not worth it
import { CallbackIterable as MonacoCallbackIterable } from 'monaco-editor/esm/vs/base/common/arrays.js'
import { CallbackIterable as VScodeCallbackIterable } from 'vscode/vs/base/common/arrays.js'
// @ts-ignore Creating a d.ts is not worth it
import { SelectActionViewItem as MonacoSelectActionViewItem } from 'monaco-editor/esm/vs/base/browser/ui/actionbar/actionViewItems.js'
import { SelectActionViewItem as VScodeSelectActionViewItem } from 'vscode/vs/base/browser/ui/actionbar/actionViewItems.js'
// @ts-ignore Creating a d.ts is not worth it
import { QuickInputService as MonacoQuickInputService } from 'monaco-editor/esm/vs/platform/quickinput/browser/quickInputService.js'
import { QuickInputService as VScodeQuickInputService } from 'vscode/vs/platform/quickinput/browser/quickInputService.js'
// @ts-ignore Creating a d.ts is not worth it
import { TextModel as MonacoTextModel } from 'monaco-editor/esm/vs/editor/common/model/textModel.js'
import { ITextBuffer } from 'vs/editor/common/model'
import { AudioCue } from 'vs/platform/audioCues/browser/audioCueService'
import { onServicesInitialized } from './service-override/tools'

// Monaco build process treeshaking is very aggressive and everything that is not used in monaco is removed
// Unfortunately, it makes some class not respect anymore the interface they are supposed to implement
// In this file we are restoring some method that are treeshaked out of monaco-editor but that are needed in this library

if (SnippetParser.prototype.text == null) {
  SnippetParser.prototype.text = function (value: string) {
    return this.parse(value).toString()
  }
} else {
  console.warn('Useless polyfill: SnippetParser')
}

/**
 * Assign all properties of b to A
 */
function polyfillPrototypeSimple<T> (a: Partial<T>, b: T) {
  const entries = Object.getOwnPropertyDescriptors(b)
  if (Object.keys(Object.getOwnPropertyDescriptors(a)).length === Object.keys(entries).length) {
    console.warn('useless polyfill on ', a)
  }
  delete entries.prototype
  Object.defineProperties(a, entries)
}

/**
 * Sometime, the simple prototype is not enough
 * It can happens if the function are returning or taking as parameter instances of the said class
 * In that case, we need to transform parameters to VSCode instances and result back to a monaco instance
 */
function polyfillPrototype<T> (a: Partial<T>, b: T, toA: (i: unknown) => unknown, toB: (i: unknown) => unknown) {
  let useful = false
  for (const key of Object.getOwnPropertyNames(b)) {
    if (!Object.hasOwnProperty.call(a, key)) {
      useful = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a as any)[key] = function (...args: any[]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return toA((b as any)[key].call(this, ...args.map(toB)))
      }
    }
  }
  if (!useful) {
    console.warn('useless polyfill on ', a)
  }
}

polyfillPrototypeSimple(MonacoLogService.prototype, VScodeLogService.prototype)
polyfillPrototypeSimple(MonacoList.prototype, VScodeList.prototype)
polyfillPrototypeSimple(MonacoWorkspaceFolder.prototype, VScodeWorkspaceFolder.prototype)
polyfillPrototypeSimple(MonacoLanguagesRegistry.prototype, VScodeLanguagesRegistry.prototype)
polyfillPrototypeSimple(MonacoErrorHandler.prototype, VScodeErrorHandler.prototype)
polyfillPrototypeSimple(MonacoRawContextKey.prototype, VScodeRawContextKey.prototype)
polyfillPrototypeSimple(MonacoContextKeyExpr, VScodeContextKeyExpr)
polyfillPrototypeSimple(MonacoConfiguration.prototype, VScodeConfiguration.prototype)
polyfillPrototypeSimple(MonacoTernarySearchTree.prototype, VScodeTernarySearchTree.prototype)
polyfillPrototypeSimple(MonacoStandaloneConfigurationService.prototype, VScodeStandaloneConfigurationService.prototype)
polyfillPrototypeSimple(MonacoLanguageService.prototype, VScodeLanguageService.prototype)
polyfillPrototypeSimple(MonacoNoOpNotification.prototype, VScodeNoOpNotification.prototype)
polyfillPrototypeSimple(MonacoThemable.prototype, VScodeThemable.prototype)
polyfillPrototypeSimple(MonacoProgressBar.prototype, VScodeProgressBar.prototype)
polyfillPrototypeSimple(MonacoDefaultConfiguration.prototype, VScodeDefaultConfiguration.prototype)
polyfillPrototypeSimple(MonacoKeybinding.prototype, VScodeKeybinding.prototype)
polyfillPrototypeSimple(MonacoKeyCodeChord.prototype, VScodeKeyCodeChord.prototype)
polyfillPrototypeSimple(MonacoDisposableMap.prototype, VScodeDisposableMap.prototype)
polyfillPrototypeSimple(MonacoFileAccess.constructor.prototype, VScodeFileAccess.constructor.prototype)
polyfillPrototypeSimple(MonacoAsyncDataTree.prototype, VScodeAsyncDataTree.prototype)
polyfillPrototypeSimple(MonacoAbstractTree.prototype, VScodeAbstractTree.prototype)
polyfillPrototypeSimple(MonacoAbstractCodeEditorService.prototype, VScodeAbstractCodeEditorService.prototype)
polyfillPrototypeSimple(MonacoCodeEditorWidget.prototype, VScodeCodeEditorWidget.prototype)
polyfillPrototypeSimple(MonacoModelService.prototype, VScodeModelService.prototype)
polyfillPrototypeSimple(MonacoPieceTreeTextBuffer.prototype, VScodePieceTreeTextBuffer.prototype)
polyfillPrototypeSimple(MonacoAbstractContextKeyService.prototype, VScodeAbstractContextKeyService.prototype)
polyfillPrototypeSimple(MonacoListView.prototype, VScodeListView.prototype)
polyfillPrototypeSimple(MonacoCallbackIterable.prototype, VScodeCallbackIterable.prototype)
polyfillPrototypeSimple(MonacoSelectActionViewItem.prototype, VScodeSelectActionViewItem.prototype)
polyfillPrototypeSimple(MonacoQuickInputService.prototype, VScodeQuickInputService.prototype)

MonacoTextModel.prototype.equalsTextBuffer = function (other: ITextBuffer): boolean {
  this._assertNotDisposed()
  return this._buffer.equals(other)
}

Object.defineProperty(MonacoListView.prototype, 'onDidChangeContentHeight', {
  get () {
    if (this.__onDidChangeContentHeight == null) {
      this.__onDidChangeContentHeight = Event.latch(this._onDidChangeContentHeight.event, undefined, this.disposables)
    }
    return this.__onDidChangeContentHeight
  }
})
Object.defineProperty(MonacoAbstractCodeEditorService.prototype, '_onDecorationTypeRegistered', {
  get () {
    if (this.__onDecorationTypeRegistered == null) {
      this.__onDecorationTypeRegistered = this._register(new Emitter())
    }
    return this.__onDecorationTypeRegistered
  }
})

Object.defineProperty(MonacoDefaultConfiguration.prototype, '_onDidChangeConfiguration', {
  get () {
    if (this.__onDidChangeConfiguration == null) {
      this.__onDidChangeConfiguration = this._register(new Emitter())
    }
    return this.__onDidChangeConfiguration
  }
})
Object.defineProperty(MonacoDefaultConfiguration.prototype, 'onDidChangeConfiguration', {
  get () {
    return this._onDidChangeConfiguration.event
  }
})

// To polyfill PieceTreeTextBufferFactory
MonacoPieceTreeTextBufferBuilder.prototype.finish = VScodePieceTreeTextBufferBuilder.prototype.finish

const jsonContributionRegistry = Registry.as<IJSONContributionRegistry>(JsonExtensions.JSONContribution)
jsonContributionRegistry.getSchemaContributions ??= () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schemas: (jsonContributionRegistry as any).schemasById
})
// @ts-ignore Override of a readonly property
// eslint-disable-next-line @typescript-eslint/no-explicit-any
jsonContributionRegistry.onDidChangeSchema ??= (jsonContributionRegistry as any)._onDidChangeSchema.event

const themeRegistry = Registry.as<IThemingRegistry>(ThemeExtensions.ThemingContribution)
// @ts-ignore Override of a readonly property
// eslint-disable-next-line @typescript-eslint/no-explicit-any
themeRegistry.onThemingParticipantAdded ??= (themeRegistry as any).onThemingParticipantAddedEmitter.event

const configurationRegistry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration)
// @ts-ignore Override of a readonly property
// eslint-disable-next-line @typescript-eslint/no-explicit-any
configurationRegistry.onDidUpdateConfiguration ??= (configurationRegistry as any)._onDidUpdateConfiguration.event
// @ts-ignore Override of a readonly property
// eslint-disable-next-line @typescript-eslint/no-explicit-any
configurationRegistry.onDidSchemaChange ??= (configurationRegistry as any)._onDidSchemaChange.event

configurationRegistry.notifyConfigurationSchemaUpdated ??= () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (configurationRegistry as any)._onDidSchemaChange.fire()
}

// @ts-ignore Override of a readonly property
MonacoNoOpNotification.prototype.onDidClose ??= Event.None

Object.defineProperty(GhostTextController.prototype, 'onActiveModelDidChange', {
  get () {
    return this.activeModelDidChangeEmitter.event
  }
})

function polyfillQuickInput<T extends IQuickInput> (fn: () => T): () => T {
  return function (this: QuickInputController) {
    const quickInput = fn.call(this)
    // @ts-ignore Override of a readonly property
    quickInput.onDidTriggerButton ??= quickInput.onDidTriggerButtonEmitter.event
    return quickInput
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
QuickInputController.prototype.createQuickPick = polyfillQuickInput<IQuickPick<any>>(QuickInputController.prototype.createQuickPick)
QuickInputController.prototype.createInputBox = polyfillQuickInput(QuickInputController.prototype.createInputBox)

const StandaloneUriLabelService = getSingletonServiceDescriptors().find(([id]) => id === ILabelService)![1].ctor
StandaloneUriLabelService.prototype.onDidChangeFormatters ??= Event.None
StandaloneUriLabelService.prototype.getWorkspaceLabel ??= () => ''

// A lot of methods from VSBuffer are treeshaked out of monaco editor, we need to restore them here
// Also we cannot just use the VSCode impl because:
// - The vscode code receives instances created inside monaco code
// - VSCode does `instanceof` on instances that need to work

function toVSCodeVSBuffer (value: unknown) {
  if (value instanceof MonacoVSBuffer) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return VScodeVSBuffer.wrap((value as any).buffer)
  }
  return value
}
function toMonacoVSBuffer (value: unknown) {
  if (value instanceof VScodeVSBuffer) {
    return MonacoVSBuffer.wrap(value.buffer)
  }
  return value
}

for (const key of Object.getOwnPropertyNames(VScodeVSBuffer)) {
  if (!Object.hasOwnProperty.call(MonacoVSBuffer, key)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const method = (VScodeVSBuffer as any)[key];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (VScodeVSBuffer as any)[key] = MonacoVSBuffer[key] = function (...args: any[]) {
      return toMonacoVSBuffer(method.call(MonacoVSBuffer, ...args.map(toVSCodeVSBuffer)))
    }
  }
}

polyfillPrototype(MonacoVSBuffer.prototype, VScodeVSBuffer.prototype, toMonacoVSBuffer, toVSCodeVSBuffer)

// Some methods of the Color class need to be restored, but they sometime return an instance of the Color class
// We need the returned instance to be an instance of the monaco Color class (and not the VSCode one) because there is some `instanceof` in the monaco code
// So we transform the returned VSCode Color instance to monaco Color instance in polyfilled methods
function toMonacoColor (value: unknown) {
  if (value instanceof VScodeColor) {
    const rgba = value.rgba
    return new MonacoColor(new MonacoRGBA(rgba.r, rgba.g, rgba.g, rgba.a))
  }
  return value
}
function toVSCodeColor (value: unknown) {
  if (value instanceof MonacoColor) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rgba = (value as any).rgba
    return new VScodeColor(new VScodeRGBA(rgba.r, rgba.g, rgba.g, rgba.a))
  }
  return value
}
polyfillPrototype(MonacoColor.prototype, VScodeColor.prototype, toMonacoColor, toVSCodeColor)
Object.defineProperty(AudioCue, 'allAudioCues', {
  get () {
    return [...this._audioCues]
  }
})

onServicesInitialized(() => {
  // polyfill for StandaloneWorkspaceContextService
  const workspaceContextService = StandaloneServices.get(IWorkspaceContextService)
  workspaceContextService.getCompleteWorkspace ??= function (this: IWorkspaceContextService) {
    return Promise.resolve(this.getWorkspace())
  }.bind(workspaceContextService)

  // @ts-ignore
  workspaceContextService.onDidChangeWorkspaceFolders ??= Event.None
  // @ts-ignore
  workspaceContextService.onDidChangeWorkbenchState ??= Event.None
  workspaceContextService.getWorkbenchState ??= () => WorkbenchState.EMPTY
})
