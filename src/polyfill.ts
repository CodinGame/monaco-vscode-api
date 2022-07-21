
import { QuickInputController } from 'vs/base/parts/quickinput/browser/quickInput'
// @ts-ignore Creating a d.ts is not worth it
import { VSBuffer as MonacoVSBuffer } from 'monaco-editor/esm/vs/base/common/buffer.js'
import { VSBuffer as VScodeVSBuffer } from 'vscode/vs/base/common/buffer.js'
// @ts-ignore Creating a d.ts is not worth it
import { Themable as MonacoThemable } from 'monaco-editor/esm/vs/platform/theme/common/themeService.js'
import { Themable as VScodeThemable } from 'vscode/vs/platform/theme/common/themeService.js'
// @ts-ignore Creating a d.ts is not worth it
import { ProgressBar as MonacoProgressBar } from 'monaco-editor/esm/vs/base/browser/ui/progressbar/progressbar.js'
import { ProgressBar as VScodeProgressBar } from 'vscode/vs/base/browser/ui/progressbar/progressbar.js'
import { getSingletonServiceDescriptors } from 'vs/platform/instantiation/common/extensions'
import { ILabelService } from 'vs/platform/label/common/label'
import { Event } from 'vs/base/common/event'
import { IQuickInput, IQuickPick } from 'vs/base/parts/quickinput/common/quickInput'
// @ts-ignore Creating a d.ts is not worth it
import { LanguageService as MonacoLanguageService } from 'monaco-editor/esm/vs/editor/common/services/languageService.js'
import { LanguageService as VScodeLanguageService } from 'vscode/vs/editor/common/services/languageService.js'
// @ts-ignore Creating a d.ts is not worth it
import { NoOpNotification as MonacoNoOpNotification } from 'monaco-editor/esm/vs/platform/notification/common/notification.js'
import { NoOpNotification as VScodeNoOpNotification } from 'vscode/vs/platform/notification/common/notification.js'
import { Registry } from 'vs/platform/registry/common/platform'
import { Extensions, IConfigurationRegistry } from 'vs/platform/configuration/common/configurationRegistry'
import { StandaloneConfigurationService } from 'vs/editor/standalone/browser/standaloneServices'
import { IConfigurationModel } from 'vs/platform/configuration/common/configuration'
// @ts-ignore Creating a d.ts is not worth it
import { TernarySearchTree as MonacoTernarySearchTree } from 'monaco-editor/esm/vs/base/common/map.js'
import { TernarySearchTree as VScodeTernarySearchTree } from 'vscode/vs/base/common/map.js'
// @ts-ignore Creating a d.ts is not worth it
import { Configuration as MonacoConfiguration } from 'monaco-editor/esm/vs/platform/configuration/common/configurationModels.js'
import { Configuration as VScodeConfiguration } from 'vscode/vs/platform/configuration/common/configurationModels.js'

// Monaco build process treeshaking is very aggressive and everything that is not used in monaco is removed
// Unfortunately, it makes some class not respect anymore the interface they are supposed to implement
// In this file we are restoring some method that are treeshaked out of monaco-editor but that are needed in this library

Object.defineProperties(MonacoConfiguration.prototype, Object.getOwnPropertyDescriptors(VScodeConfiguration.prototype))
Object.defineProperties(MonacoTernarySearchTree.prototype, Object.getOwnPropertyDescriptors(VScodeTernarySearchTree.prototype))

StandaloneConfigurationService.prototype.getConfigurationData ??= () => {
  const emptyModel: IConfigurationModel = {
    contents: {},
    keys: [],
    overrides: []
  }
  return {
    defaults: emptyModel,
    user: emptyModel,
    workspace: emptyModel,
    folders: []
  }
}

const configurationRegistry = Registry.as<IConfigurationRegistry>(Extensions.Configuration)
// @ts-ignore Override of a readonly property
// eslint-disable-next-line @typescript-eslint/no-explicit-any
configurationRegistry.onDidUpdateConfiguration ??= (configurationRegistry as any)._onDidUpdateConfiguration.event

// @ts-ignore Override of a readonly property
MonacoNoOpNotification.prototype.onDidClose ??= Event.None

Object.defineProperties(MonacoNoOpNotification.prototype, Object.getOwnPropertyDescriptors(VScodeNoOpNotification.prototype))

MonacoLanguageService.prototype.getRegisteredLanguageIds ??= VScodeLanguageService.prototype.getRegisteredLanguageIds;

(MonacoProgressBar as typeof VScodeProgressBar).prototype.hide ??= VScodeProgressBar.prototype.hide

// eslint-disable-next-line dot-notation
;(MonacoThemable as typeof VScodeThemable).prototype['getColor'] ??= VScodeThemable.prototype['getColor']

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
for (const key of Object.getOwnPropertyNames(VScodeVSBuffer.prototype)) {
  if (!Object.hasOwnProperty.call(MonacoVSBuffer.prototype, key)) {
    MonacoVSBuffer.prototype[key] = function (...args: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return toMonacoVSBuffer((VScodeVSBuffer.prototype as any)[key].call(this, ...args.map(toVSCodeVSBuffer)))
    }
  }
}
