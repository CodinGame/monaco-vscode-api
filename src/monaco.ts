import { StandaloneKeybindingService, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ITextResourceConfigurationService } from 'vs/editor/common/services/textResourceConfiguration'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { IStandaloneDiffEditorConstructionOptions, IStandaloneEditorConstructionOptions, StandaloneCodeEditor, StandaloneDiffEditor2, StandaloneEditor } from 'vs/editor/standalone/browser/standaloneCodeEditor'
import { IDiffEditorOptions, IEditorOptions } from 'vs/editor/common/config/editorOptions'
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
import { MenuRegistry, MenuId } from 'vs/platform/actions/common/actions'
import { KeybindingsRegistry } from 'vs/platform/keybinding/common/keybindingsRegistry'
import { IJSONSchema } from 'vs/base/common/jsonSchema'
import { Extensions as ConfigurationExtensions } from 'vs/platform/configuration/common/configurationRegistry'
import { EditorOptionsUtil } from 'vscode/src/vs/editor/browser/config/editorConfiguration'
import { registerColor } from 'vs/platform/theme/common/colorRegistry'
import { URI } from 'vs/base/common/uri'
import { ITextModelService } from 'vs/editor/common/services/resolverService'
import { IFileDeleteOptions, IFileService } from 'vs/platform/files/common/files'
import { VSBuffer } from 'vs/base/common/buffer'
import { ITextFileEditorModel } from 'vs/workbench/services/textfile/common/textfiles'
import { ServiceCollection } from 'vs/platform/instantiation/common/serviceCollection'
import { IQuickInputService } from 'vs/platform/quickinput/common/quickInput'
import { StandaloneQuickInputService } from 'vs/editor/standalone/browser/quickInput/standaloneQuickInputService'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IContextKeyService, ContextKeyExpr, RawContextKey } from 'vs/platform/contextkey/common/contextkey'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry'
import { INotificationService } from 'vs/platform/notification/common/notification'
import { ILogService } from 'vs/platform/log/common/log'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { IKeybindingService, IKeyboardEvent } from 'vs/platform/keybinding/common/keybinding'
import { KeybindingResolver } from 'vs/platform/keybinding/common/keybindingResolver'
import { ResolvedKeybindingItem } from 'vs/platform/keybinding/common/resolvedKeybindingItem'
import { Keybinding, ResolvedKeybinding } from 'vs/base/common/keybindings'
import { Emitter, Event } from 'vs/base/common/event'
import { createInjectedClass } from './tools/injection'

function computeConfiguration (configuration: IEditorConfiguration, overrides?: Readonly<IEditorOptions>): IEditorOptions {
  const editorConfiguration: IEditorOptions = isObject(configuration.editor) ? deepClone(configuration.editor) : Object.create(null)
  Object.assign(editorConfiguration, deepClone(overrides))
  return editorConfiguration
}

function computeDiffConfiguration (configuration: IEditorConfiguration, overrides?: Readonly<IEditorOptions>): IDiffEditorOptions {
  const editorConfiguration: IDiffEditorOptions = computeConfiguration(configuration)

  if (isObject(configuration.diffEditor)) {
    const diffEditorConfiguration: IDiffEditorOptions = deepClone(configuration.diffEditor)

    // User settings defines `diffEditor.codeLens`, but here we rename that to `diffEditor.diffCodeLens` to avoid collisions with `editor.codeLens`.
    diffEditorConfiguration.diffCodeLens = diffEditorConfiguration.codeLens
    delete diffEditorConfiguration.codeLens

    // User settings defines `diffEditor.wordWrap`, but here we rename that to `diffEditor.diffWordWrap` to avoid collisions with `editor.wordWrap`.
    diffEditorConfiguration.diffWordWrap = <'off' | 'on' | 'inherit' | undefined>diffEditorConfiguration.wordWrap
    delete diffEditorConfiguration.wordWrap

    Object.assign(editorConfiguration, diffEditorConfiguration)
  }

  editorConfiguration.accessibilityVerbose = configuration.accessibility?.verbosity?.diffEditor ?? false

  Object.assign(editorConfiguration, deepClone(overrides))

  return editorConfiguration
}

/**
 * A StandaloneEditor which is plugged on the `textResourceConfigurationService` for its options
 * So instead of just taking the options given by the user via the `updateOptions` method,
 * it fallbacks on the current configurationService configuration
 */
function createConfiguredEditorClass (impl: new (instantiationService: IInstantiationService, domElement: HTMLElement, _options: Readonly<IStandaloneEditorConstructionOptions>) => StandaloneCodeEditor) {
  class ConfiguredStandaloneEditor extends impl {
    private optionsOverrides: Readonly<IEditorOptions> = {}
    private lastAppliedEditorOptions?: IEditorOptions

    constructor (
      domElement: HTMLElement,
      _options: Readonly<IStandaloneEditorConstructionOptions> = {},
      @IInstantiationService instantiationService: IInstantiationService,
      @ITextResourceConfigurationService private textResourceConfigurationService: ITextResourceConfigurationService
    ) {
      // Remove Construction specific options
      const { theme, autoDetectHighContrast, model, value, language, accessibilityHelpUrl, ariaContainerElement, overflowWidgetsDomNode, dimension, ...options } = _options
      const computedOptions = computeConfiguration(textResourceConfigurationService.getValue<IEditorConfiguration>(_options.model?.uri), options)
      super(instantiationService, domElement, { ...computedOptions, overflowWidgetsDomNode, dimension, theme, autoDetectHighContrast, model, value, language, accessibilityHelpUrl, ariaContainerElement })
      this.lastAppliedEditorOptions = computedOptions

      this.optionsOverrides = options
      this._register(textResourceConfigurationService.onDidChangeConfiguration((e) => {
        const resource = this.getModel()?.uri
        if (resource != null && e.affectsConfiguration(resource, 'editor')) {
          this.updateEditorConfiguration()
        }
      }))
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

      const editorConfiguration = computeConfiguration(configuration, this.optionsOverrides)

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

  return ConfiguredStandaloneEditor
}

const ConfiguredStandaloneCodeEditor = createConfiguredEditorClass(createInjectedClass(StandaloneCodeEditor))
const ConfiguredStandaloneEditor = createConfiguredEditorClass(createInjectedClass(StandaloneEditor))

class ConfiguredStandaloneDiffEditor extends createInjectedClass(StandaloneDiffEditor2) {
  private optionsOverrides: Readonly<IEditorOptions> = {}
  private lastAppliedEditorOptions?: IEditorOptions
  constructor (
    domElement: HTMLElement,
    _options: Readonly<IStandaloneDiffEditorConstructionOptions> = {},
    @IInstantiationService instantiationService: IInstantiationService,
    @ITextResourceConfigurationService private textResourceConfigurationService: ITextResourceConfigurationService
  ) {
    // Remove Construction specific options
    const { theme, autoDetectHighContrast, modifiedAriaLabel, originalAriaLabel, overflowWidgetsDomNode, dimension, ...options } = _options
    const computedOptions = computeDiffConfiguration(textResourceConfigurationService.getValue<IEditorConfiguration>(undefined), options)
    super(instantiationService, domElement, { ...computedOptions, overflowWidgetsDomNode, dimension, theme, autoDetectHighContrast, modifiedAriaLabel, originalAriaLabel })
    this.lastAppliedEditorOptions = computedOptions

    this.optionsOverrides = options
    this._register(textResourceConfigurationService.onDidChangeConfiguration((e) => {
      const resource = this._targetEditor.getModel()?.uri
      if (resource != null && (e.affectsConfiguration(resource, 'editor') || e.affectsConfiguration(resource, 'diffEditor') || e.affectsConfiguration(resource, 'accessibility.verbosity.diffEditor'))) {
        this.updateEditorConfiguration()
      }
    }))
    this._register(this._targetEditor.onDidChangeModelLanguage(() => this.updateEditorConfiguration()))
    this._register(this.onDidChangeModel(() => this.updateEditorConfiguration()))
    this.updateEditorConfiguration()
  }

  /**
   * This method is widely inspired from vs/workbench/browser/parts/editor/textEditor
   */
  private updateEditorConfiguration (): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this.getModel() == null || this.textResourceConfigurationService == null) {
      // textResourceConfigurationService can be null if this method is called by the constructor of StandaloneEditor
      return
    }
    const resource = this._targetEditor.getModel()?.uri
    const configuration = this.textResourceConfigurationService.getValue<IEditorConfiguration | undefined>(resource)
    if (configuration == null) {
      return
    }

    const editorConfiguration = computeDiffConfiguration(configuration, this.optionsOverrides)

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

    this.optionsOverrides = {
      ...this.optionsOverrides,
      ...newOptions
    }

    this.updateEditorConfiguration()
  }

  protected override _createInnerEditor (instantiationService: IInstantiationService, container: HTMLElement, options: Readonly<IEditorOptions>): CodeEditorWidget {
    return instantiationService.createInstance(ConfiguredStandaloneCodeEditor, container, options)
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

export interface KeybindingProvider {
  provideKeybindings (): ResolvedKeybindingItem[]
  onDidChangeKeybindings: Event<void>
}

export interface DynamicKeybindingService extends IKeybindingService {
  registerKeybindingProvider (provider: KeybindingProvider): IDisposable
  _getResolver(): KeybindingResolver
}

function isDynamicKeybindingService (keybindingService: IKeybindingService) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return (keybindingService as DynamicKeybindingService).registerKeybindingProvider != null
}

// This class use useful so editor.addAction and editor.addCommand still work
// Monaco do an `instanceof` on the KeybindingService so we need it to extends `StandaloneKeybindingService`
class DelegateStandaloneKeybindingService extends StandaloneKeybindingService {
  private _onDidChangeKeybindings = new Emitter<void>()
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

    this._register(delegate.registerKeybindingProvider({
      provideKeybindings: () => {
        return this.getUserKeybindingItems()
      },
      onDidChangeKeybindings: this._onDidChangeKeybindings.event
    }))
  }

  protected override _getResolver (): KeybindingResolver {
    return this.delegate._getResolver()
  }

  protected override updateResolver (): void {
    super.updateResolver()
    this._onDidChangeKeybindings.fire()
  }

  override resolveKeyboardEvent (keyboardEvent: IKeyboardEvent): ResolvedKeybinding {
    return this.delegate.resolveKeyboardEvent(keyboardEvent)
  }

  override resolveKeybinding (keybinding: Keybinding): ResolvedKeybinding[] {
    return this.delegate.resolveKeybinding(keybinding)
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
  return getStandaloneEditorInstantiationService().createInstance(ConfiguredStandaloneEditor, domElement, options)
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

  MenuRegistry,
  MenuId,

  KeybindingsRegistry,

  ContextKeyExpr,
  RawContextKey,

  registerColor,

  IReference,
  ITextFileEditorModel
}
