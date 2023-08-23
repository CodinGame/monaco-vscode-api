import { StandaloneKeybindingService, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ITextResourceConfigurationService } from 'vs/editor/common/services/textResourceConfiguration'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { IStandaloneEditorConstructionOptions, StandaloneDiffEditor, StandaloneEditor } from 'vs/editor/standalone/browser/standaloneCodeEditor'
import { IEditorOptions } from 'vs/editor/common/config/editorOptions'
import { IEditorConfiguration } from 'vs/workbench/browser/parts/editor/textEditor'
import { isObject } from 'vs/base/common/types'
import { deepClone, distinct } from 'vs/base/common/objects'
import { CodeEditorWidget } from 'vs/editor/browser/widget/codeEditorWidget'
import type { create as createEditor, createDiffEditor } from 'vs/editor/standalone/browser/standaloneEditor'
import { errorHandler } from 'vs/base/common/errors'
import { FoldingModel, setCollapseStateForMatchingLines } from 'vs/editor/contrib/folding/browser/foldingModel'
import { FoldingController } from 'vs/editor/contrib/folding/browser/folding'
import { DisposableStore, IDisposable, IReference } from 'vs/base/common/lifecycle'
import { Registry } from 'vs/platform/registry/common/platform'
import { IJSONContributionRegistry, Extensions as JsonExtensions } from 'vs/platform/jsonschemas/common/jsonContributionRegistry'
import { CommandsRegistry, ICommandService } from 'vs/platform/commands/common/commands'
import { IJSONSchema } from 'vs/base/common/jsonSchema'
import { Extensions as ConfigurationExtensions } from 'vs/platform/configuration/common/configurationRegistry'
import { EditorOptionsUtil } from 'vscode/vs/editor/browser/config/editorConfiguration'
import { registerColor } from 'vs/platform/theme/common/colorRegistry'
import { URI } from 'vs/base/common/uri'
import { ITextModelService } from 'vs/editor/common/services/resolverService'
import { IFileDeleteOptions, IFileService } from 'vs/platform/files/common/files'
import { VSBuffer } from 'vs/base/common/buffer'
import { JSONValidationExtensionPoint } from 'vs/workbench/api/common/jsonValidationExtensionPoint'
import { IWorkbenchContribution, IWorkbenchContributionsRegistry, Extensions as WorkbenchExtensions } from 'vs/workbench/common/contributions'
import { ColorExtensionPoint } from 'vs/workbench/services/themes/common/colorExtensionPoint'
import { LifecyclePhase } from 'vs/workbench/services/lifecycle/common/lifecycle'
import { ITextFileEditorModel } from 'vs/workbench/services/textfile/common/textfiles'
import { ServiceCollection } from 'vs/platform/instantiation/common/serviceCollection'
import { IQuickInputService } from 'vs/platform/quickinput/common/quickInput'
import { StandaloneQuickInputService } from 'vs/editor/standalone/browser/quickInput/standaloneQuickInputService'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry'
import { INotificationService } from 'vs/platform/notification/common/notification'
import { ILogService } from 'vs/platform/log/common/log'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding'
import { KeybindingResolver } from 'vs/platform/keybinding/common/keybindingResolver'
import { ResolvedKeybindingItem } from 'vs/platform/keybinding/common/resolvedKeybindingItem'
import { createInjectedClass } from './tools/injection'
// Selectively comes from vs/workbench/contrib/codeEditor/browser/codeEditor.contribution.ts
import 'vs/workbench/contrib/codeEditor/browser/workbenchReferenceSearch'
import 'vs/workbench/contrib/codeEditor/browser/menuPreventer'
import 'vs/workbench/contrib/codeEditor/browser/diffEditorHelper'
import 'vs/workbench/contrib/codeEditor/browser/largeFileOptimizations'
import 'vs/workbench/contrib/codeEditor/browser/inspectEditorTokens/inspectEditorTokens'
import 'vs/workbench/contrib/codeEditor/browser/saveParticipants'
import 'vs/workbench/contrib/codeEditor/browser/toggleMinimap'
import 'vs/workbench/contrib/codeEditor/browser/toggleMultiCursorModifier'
import 'vs/workbench/contrib/codeEditor/browser/toggleRenderControlCharacter'
import 'vs/workbench/contrib/codeEditor/browser/toggleWordWrap'
import 'vs/workbench/contrib/codeEditor/browser/toggleRenderWhitespace'
import 'vs/workbench/contrib/codeEditor/browser/editorLineNumberMenu'

import 'vs/workbench/contrib/format/browser/format.contribution'
import 'vs/workbench/contrib/folding/browser/folding.contribution'
import 'vs/workbench/contrib/inlayHints/browser/inlayHintsAccessibilty'
import 'vs/workbench/contrib/codeActions/browser/codeActions.contribution'
import 'vs/workbench/contrib/list/browser/list.contribution'

class ExtensionPoints implements IWorkbenchContribution {
  constructor (
    @IInstantiationService private readonly instantiationService: IInstantiationService
  ) {
    this.instantiationService.createInstance(JSONValidationExtensionPoint)
    this.instantiationService.createInstance(ColorExtensionPoint)
  }
}
Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench).registerWorkbenchContribution(ExtensionPoints, LifecyclePhase.Starting)

function computeConfiguration (configuration: IEditorConfiguration, isDiffEditor: boolean, overrides?: Readonly<IEditorOptions>): IEditorOptions {
  const editorConfiguration: IEditorOptions = isObject(configuration.editor) ? deepClone(configuration.editor) : Object.create(null)
  if (isDiffEditor && isObject(configuration.diffEditor)) {
    Object.assign(editorConfiguration, deepClone(configuration.diffEditor))
  }
  Object.assign(editorConfiguration, deepClone(overrides))
  return editorConfiguration
}

/**
 * A StandaloneEditor which is plugged on the `textResourceConfigurationService` for its options
 * So instead of just taking the options given by the user via the `updateOptions` method,
 * it fallbacks on the current configurationService configuration
 */
class ConfiguredStandaloneEditor extends createInjectedClass(StandaloneEditor) {
  // use createInjectedClass because StandaloneEditor has a lot of injected services and it would be a pain to inject them all here to be able to forward them
  // Also, the injected services may vary so relying on the annotations is more robust (and useful for @codingame/monaco-editor which removes a service from the list)

  private optionsOverrides: Readonly<IEditorOptions> = {}
  private lastAppliedEditorOptions?: IEditorOptions

  constructor (
    domElement: HTMLElement,
    private isDiffEditor: boolean,
    _options: Readonly<IStandaloneEditorConstructionOptions> = {},
    @IInstantiationService instantiationService: IInstantiationService,
    @ITextResourceConfigurationService private textResourceConfigurationService: ITextResourceConfigurationService
  ) {
    // Remove Construction specific options
    const { theme, autoDetectHighContrast, model, value, language, accessibilityHelpUrl, ariaContainerElement, overflowWidgetsDomNode, dimension, ...options } = _options
    const computedOptions = computeConfiguration(textResourceConfigurationService.getValue<IEditorConfiguration>(_options.model?.uri), isDiffEditor, options)
    super(instantiationService, domElement, { ...computedOptions, overflowWidgetsDomNode, dimension, theme, autoDetectHighContrast, model, value, language, accessibilityHelpUrl, ariaContainerElement })
    this.lastAppliedEditorOptions = computedOptions

    this.optionsOverrides = options
    this._register(textResourceConfigurationService.onDidChangeConfiguration(() => this.updateEditorConfiguration()))
    this._register(this.onDidChangeModelLanguage(() => this.updateEditorConfiguration()))
    this._register(this.onDidChangeModel(() => this.updateEditorConfiguration()))
    this.updateEditorConfiguration()
  }

  /**
   * This method is widely inspired from vs/workbench/browser/parts/editor/textEditor
   */
  private updateEditorConfiguration (): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!this.hasModel() || this.textResourceConfigurationService == null) {
      // textResourceConfigurationService can be null if this method is called by the constructor of StandaloneEditor
      return
    }
    const resource = this.getModel()!.uri
    const configuration = this.textResourceConfigurationService.getValue<IEditorConfiguration | undefined>(resource)
    if (configuration == null) {
      return
    }

    const editorConfiguration = computeConfiguration(configuration, this.isDiffEditor, this.optionsOverrides)

    // Try to figure out the actual editor options that changed from the last time we updated the editor.
    // We do this so that we are not overwriting some dynamic editor settings (e.g. word wrap) that might
    // have been applied to the editor directly.
    let editorSettingsToApply = editorConfiguration
    if (this.lastAppliedEditorOptions != null) {
      editorSettingsToApply = distinct(this.lastAppliedEditorOptions, editorSettingsToApply)
    }

    if (Object.keys(editorSettingsToApply).length > 0) {
      this.lastAppliedEditorOptions = editorConfiguration

      super.updateOptions(editorSettingsToApply)
    }
  }

  override updateOptions (newOptions: Readonly<IEditorOptions>): void {
    // it can be null if this method is called by the constructor of StandaloneEditor
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    this.optionsOverrides ??= {}
    const didChange = EditorOptionsUtil.applyUpdate(this.optionsOverrides, newOptions)
    if (!didChange) {
      return
    }

    this.updateEditorConfiguration()
  }
}

class ConfiguredStandaloneDiffEditor extends StandaloneDiffEditor {
  protected override _createInnerEditor (instantiationService: IInstantiationService, container: HTMLElement, options: Readonly<IEditorOptions>): CodeEditorWidget {
    return instantiationService.createInstance(ConfiguredStandaloneEditor, container, true, options)
  }
}

export async function writeFile (uri: URI, content: string): Promise<void> {
  await StandaloneServices.get(IFileService).writeFile(uri, VSBuffer.fromString(content))
}

export async function deleteFile (uri: URI, options?: Partial<IFileDeleteOptions>): Promise<void> {
  await StandaloneServices.get(IFileService).del(uri, options)
}

export async function createModelReference (resource: URI, content?: string): Promise<IReference<ITextFileEditorModel>> {
  if (content != null) {
    await writeFile(resource, content)
  }
  return (await StandaloneServices.get(ITextModelService).createModelReference(resource)) as IReference<ITextFileEditorModel>
}

export interface DynamicKeybindingService extends IKeybindingService {
  registerKeybindingProvider (provider: () => ResolvedKeybindingItem[]): IDisposable
  _getResolver(): KeybindingResolver
}

function isDynamicKeybindingService (keybindingService: IKeybindingService) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return (keybindingService as DynamicKeybindingService).registerKeybindingProvider != null
}

// This class use useful so editor.addAction and editor.addCommand still work
// Monaco do an `instanceof` on the KeybindingService so we need it to extends `StandaloneKeybindingService`
class DelegateStandaloneKeybindingService extends StandaloneKeybindingService {
  constructor (
    private delegate: DynamicKeybindingService,
    @IContextKeyService contextKeyService: IContextKeyService,
    @ICommandService commandService: ICommandService,
    @ITelemetryService telemetryService: ITelemetryService,
    @INotificationService notificationService: INotificationService,
    @ILogService logService: ILogService,
    @ICodeEditorService codeEditorService: ICodeEditorService
  ) {
    super(contextKeyService, commandService, telemetryService, notificationService, logService, codeEditorService)

    this._register(delegate.registerKeybindingProvider(() => this.getUserKeybindingItems()))
  }

  protected override _getResolver (): KeybindingResolver {
    return this.delegate._getResolver()
  }
}

let standaloneEditorInstantiationService: IInstantiationService | null = null
function getStandaloneEditorInstantiationService () {
  if (standaloneEditorInstantiationService == null) {
    const serviceCollection = new ServiceCollection()
    serviceCollection.set(IQuickInputService, new SyncDescriptor(StandaloneQuickInputService, undefined, true))
    const keybindingService = StandaloneServices.get(IKeybindingService)
    if (!(keybindingService instanceof StandaloneKeybindingService) && isDynamicKeybindingService(keybindingService)) {
      serviceCollection.set(IKeybindingService, new SyncDescriptor(DelegateStandaloneKeybindingService, [keybindingService], true))
    }
    standaloneEditorInstantiationService = StandaloneServices.get(IInstantiationService).createChild(serviceCollection)
  }
  return standaloneEditorInstantiationService
}

export const createConfiguredEditor: typeof createEditor = (domElement, options, override) => {
  StandaloneServices.initialize(override ?? {})
  return getStandaloneEditorInstantiationService().createInstance(ConfiguredStandaloneEditor, domElement, false, options)
}

export const createConfiguredDiffEditor: typeof createDiffEditor = (domElement, options, override) => {
  StandaloneServices.initialize(override ?? {})
  return getStandaloneEditorInstantiationService().createInstance(ConfiguredStandaloneDiffEditor, domElement, options)
}

const Extensions = {
  ...JsonExtensions,
  ...ConfigurationExtensions
}

export {
  errorHandler,
  DisposableStore,

  FoldingController,
  FoldingModel,
  setCollapseStateForMatchingLines,

  Registry,
  CommandsRegistry,
  Extensions,
  IJSONContributionRegistry,
  IJSONSchema,

  registerColor,

  IReference,
  ITextFileEditorModel
}
