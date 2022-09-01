
import { QuickInputController } from 'vs/base/parts/quickinput/browser/quickInput'
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
import { Event } from 'vs/base/common/event'
import { IQuickInput, IQuickPick } from 'vs/base/parts/quickinput/common/quickInput'
// @ts-ignore Creating a d.ts is not worth it
import { LanguageService as MonacoLanguageService } from 'monaco-editor/esm/vs/editor/common/services/languageService.js'
import { LanguageService as VScodeLanguageService } from 'vscode/vs/editor/common/services/languageService.js'
// @ts-ignore Creating a d.ts is not worth it
import { NoOpNotification as MonacoNoOpNotification } from 'monaco-editor/esm/vs/platform/notification/common/notification.js'
import { NoOpNotification as VScodeNoOpNotification } from 'vscode/vs/platform/notification/common/notification.js'
import { Registry } from 'vs/platform/registry/common/platform'
import { Extensions as ConfigurationExtensions, IConfigurationRegistry } from 'vs/platform/configuration/common/configurationRegistry'
// @ts-ignore Creating a d.ts is not worth it
import { StandaloneConfigurationService as MonacoStandaloneConfigurationService } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js'
import { StandaloneConfigurationService as VScodeStandaloneConfigurationService } from 'vscode/vs/editor/standalone/browser/standaloneServices.js'
// @ts-ignore Creating a d.ts is not worth it
import { TernarySearchTree as MonacoTernarySearchTree } from 'monaco-editor/esm/vs/base/common/map.js'
import { TernarySearchTree as VScodeTernarySearchTree } from 'vscode/vs/base/common/map.js'
// @ts-ignore Creating a d.ts is not worth it
import { Configuration as MonacoConfiguration } from 'monaco-editor/esm/vs/platform/configuration/common/configurationModels.js'
import { Configuration as VScodeConfiguration } from 'vscode/vs/platform/configuration/common/configurationModels.js'
// @ts-ignore Creating a d.ts is not worth it
import { RawContextKey as MonacoRawContextKey } from 'monaco-editor/esm/vs/platform/contextkey/common/contextkey.js'
import { RawContextKey as VScodeRawContextKey } from 'vscode/vs/platform/contextkey/common/contextkey.js'
// @ts-ignore Creating a d.ts is not worth it
import { ErrorHandler as MonacoErrorHandler } from 'monaco-editor/esm/vs/base/common/errors.js'
import { ErrorHandler as VScodeErrorHandler } from 'vscode/vs/base/common/errors.js'
// @ts-ignore Creating a d.ts is not worth it
import { LanguagesRegistry as MonacoLanguagesRegistry } from 'monaco-editor/esm/vs/editor/common/services/languagesRegistry.js'
import { LanguagesRegistry as VScodeLanguagesRegistry } from 'vscode/vs/editor/common/services/languagesRegistry.js'
// @ts-ignore Creating a d.ts is not worth it
import { WorkspaceFolder as MonacoWorkspaceFolder } from 'monaco-editor/esm/vs/platform/workspace/common/workspace.js'
import { WorkspaceFolder as VScodeWorkspaceFolder } from 'vscode/vs/platform/workspace/common/workspace.js'
// @ts-ignore Creating a d.ts is not worth it
import { List as MonacoList } from 'monaco-editor/esm/vs/base/browser/ui/list/listWidget.js'
import { List as VScodeList } from 'vscode/vs/base/browser/ui/list/listWidget.js'
// @ts-ignore Creating a d.ts is not worth it
import { Color as MonacoColor } from 'monaco-editor/esm/vs/base/common/color.js'
import { Color as VScodeColor } from 'vscode/vs/base/common/color.js'
// @ts-ignore Creating a d.ts is not worth it
import { LogService as MonacoLogService } from 'monaco-editor/esm/vs/platform/log/common/log.js'
import { LogService as VScodeLogService } from 'vscode/vs/platform/log/common/log.js'
// @ts-ignore Creating a d.ts is not worth it
import { SnippetParser } from 'monaco-editor/esm/vs/editor/contrib/snippet/browser/snippetParser.js'

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
  Object.defineProperties(a, Object.getOwnPropertyDescriptors(b))
}

/**
 * Sometime, the simple prototype is not enough
 * It can happens if the function are returning or taking as parameter instances of the said class
 * In that case, we need to transform parameters to VSCode instances and result back to a monaco instance
 */
function polyfillPrototype<T> (a: Partial<T>, b: T, toA: (i: unknown) => unknown, toB: (i: unknown) => unknown) {
  for (const key of Object.getOwnPropertyNames(b)) {
    if (!Object.hasOwnProperty.call(a, key)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a as any)[key] = function (...args: any[]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return toA((b as any)[key].call(this, ...args.map(toB)))
      }
    }
  }
}

polyfillPrototypeSimple(MonacoLogService.prototype, VScodeLogService.prototype)
polyfillPrototypeSimple(MonacoList.prototype, VScodeList.prototype)
polyfillPrototypeSimple(MonacoWorkspaceFolder.prototype, VScodeWorkspaceFolder.prototype)
polyfillPrototypeSimple(MonacoLanguagesRegistry.prototype, VScodeLanguagesRegistry.prototype)
polyfillPrototypeSimple(MonacoErrorHandler.prototype, VScodeErrorHandler.prototype)
polyfillPrototypeSimple(MonacoRawContextKey.prototype, VScodeRawContextKey.prototype)
polyfillPrototypeSimple(MonacoConfiguration.prototype, VScodeConfiguration.prototype)
polyfillPrototypeSimple(MonacoTernarySearchTree.prototype, VScodeTernarySearchTree.prototype)
polyfillPrototypeSimple(MonacoStandaloneConfigurationService.prototype, VScodeStandaloneConfigurationService.prototype)
polyfillPrototypeSimple(MonacoLanguageService.prototype, VScodeLanguageService.prototype)
polyfillPrototypeSimple(MonacoNoOpNotification.prototype, VScodeNoOpNotification.prototype)
polyfillPrototypeSimple(MonacoThemable.prototype, VScodeThemable.prototype)
polyfillPrototypeSimple(MonacoProgressBar.prototype, VScodeProgressBar.prototype)

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

polyfillPrototype(MonacoVSBuffer.prototype, VScodeVSBuffer.prototype, toMonacoVSBuffer, toVSCodeVSBuffer)

// Some methods of the Color class need to be restored, but they sometime return an instance of the Color class
// We need the returned instance to be an instance of the monaco Color class (and not the VSCode one) because there is some `instanceof` in the monaco code
// So we transform the returned VSCode Color instance to monaco Color instance in polyfilled methods
function toMonacoColor (value: unknown) {
  if (value instanceof VScodeColor) {
    return new MonacoColor(value.rgba)
  }
  return value
}
function toVSCodeColor (value: unknown) {
  if (value instanceof MonacoColor) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new VScodeColor((value as any).rgba)
  }
  return value
}
polyfillPrototype(MonacoColor.prototype, VScodeColor.prototype, toMonacoColor, toVSCodeColor)
