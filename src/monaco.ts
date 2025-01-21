import {
  StandaloneKeybindingService,
  StandaloneServices
} from 'vs/editor/standalone/browser/standaloneServices'
import { ITextResourceConfigurationService } from 'vs/editor/common/services/textResourceConfiguration'
import {
  IInstantiationService,
  type ServicesAccessor
} from 'vs/platform/instantiation/common/instantiation'
import {
  type IStandaloneDiffEditorConstructionOptions,
  type IStandaloneEditorConstructionOptions,
  StandaloneCodeEditor,
  StandaloneDiffEditor2,
  StandaloneEditor
} from 'vs/editor/standalone/browser/standaloneCodeEditor'
import type { IDiffEditorOptions, IEditorOptions } from 'vs/editor/common/config/editorOptions'
import type { IEditorConfiguration } from 'vs/workbench/browser/parts/editor/textEditor'
import { isObject } from 'vs/base/common/types'
import { deepClone, distinct } from 'vs/base/common/objects'
import { CodeEditorWidget } from 'vs/editor/browser/widget/codeEditor/codeEditorWidget'
import type {
  create as createEditor,
  createDiffEditor
} from 'vs/editor/standalone/browser/standaloneEditor'
import { errorHandler, setUnexpectedErrorHandler } from 'vs/base/common/errors'
import {
  FoldingModel,
  setCollapseStateForMatchingLines
} from 'vs/editor/contrib/folding/browser/foldingModel'
import { FoldingController } from 'vs/editor/contrib/folding/browser/folding'
import { DisposableStore, type IDisposable, type IReference } from 'vs/base/common/lifecycle'
import { Registry } from 'vs/platform/registry/common/platform'
import {
  type IJSONContributionRegistry,
  Extensions as JsonExtensions
} from 'vs/platform/jsonschemas/common/jsonContributionRegistry'
import { CommandsRegistry } from 'vs/platform/commands/common/commands'
import { MenuRegistry, MenuId } from 'vs/platform/actions/common/actions'
import { KeybindingsRegistry } from 'vs/platform/keybinding/common/keybindingsRegistry'
import type { IJSONSchema } from 'vs/base/common/jsonSchema'
import { Extensions as ConfigurationExtensions } from 'vs/platform/configuration/common/configurationRegistry'
import { EditorOptionsUtil } from 'vscode/src/vs/editor/browser/config/editorConfiguration'
import { registerColor } from 'vs/platform/theme/common/colorRegistry'
import { URI } from 'vs/base/common/uri'
import { ITextModelService } from 'vs/editor/common/services/resolverService'
import type { IFileDeleteOptions } from 'vs/platform/files/common/files'
import { VSBuffer } from 'vs/base/common/buffer'
import type { ITextFileEditorModel } from 'vs/workbench/services/textfile/common/textfiles'
import { ServiceCollection } from 'vs/platform/instantiation/common/serviceCollection'
import { StandaloneQuickInputService } from 'vs/editor/standalone/browser/quickInput/standaloneQuickInputService'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ContextKeyExpr, RawContextKey } from 'vs/platform/contextkey/common/contextkey'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import type {
  IKeyboardEvent,
  KeybindingsSchemaContribution
} from 'vs/platform/keybinding/common/keybinding'
import { KeybindingResolver } from 'vs/platform/keybinding/common/keybindingResolver'
import { ResolvedKeybindingItem } from 'vs/platform/keybinding/common/resolvedKeybindingItem'
import { Keybinding, ResolvedKeybinding } from 'vs/base/common/keybindings'
import { Event } from 'vs/base/common/event'
import { IFileService } from 'vs/platform/files/common/files.service'
import { ResourceContextKey } from 'vs/workbench/common/contextkeys'
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey.service'
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding.service'
import { ICommandService } from 'vs/platform/commands/common/commands.service'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry.service'
import { INotificationService } from 'vs/platform/notification/common/notification.service'
import { ILogService } from 'vs/platform/log/common/log.service'
import { IQuickInputService } from 'vs/platform/quickinput/common/quickInput.service'
import { createInjectedClass } from './tools/injection'
import { getService } from './services'
export {
  EditorContributionInstantiation,
  registerEditorAction,
  registerEditorContribution,
  registerDiffEditorContribution,
  registerMultiEditorAction,
  EditorAction,
  EditorCommand
} from 'vs/editor/browser/editorExtensions'
export type { IEditorContribution, IDiffEditorContribution } from 'vs/editor/common/editorCommon'

function computeConfiguration(
  configuration: IEditorConfiguration,
  overrides?: Readonly<IEditorOptions>
): IEditorOptions {
  const editorConfiguration: IEditorOptions = isObject(configuration.editor)
    ? deepClone(configuration.editor)
    : Object.create(null)
  Object.assign(editorConfiguration, deepClone(overrides))
  return editorConfiguration
}

function computeDiffConfiguration(
  configuration: IEditorConfiguration,
  overrides?: Readonly<IEditorOptions>
): IDiffEditorOptions {
  const editorConfiguration: IDiffEditorOptions = computeConfiguration(configuration)

  if (isObject(configuration.diffEditor)) {
    const diffEditorConfiguration: IDiffEditorOptions = deepClone(configuration.diffEditor)

    // User settings defines `diffEditor.codeLens`, but here we rename that to `diffEditor.diffCodeLens` to avoid collisions with `editor.codeLens`.
    diffEditorConfiguration.diffCodeLens = diffEditorConfiguration.codeLens
    delete diffEditorConfiguration.codeLens

    // User settings defines `diffEditor.wordWrap`, but here we rename that to `diffEditor.diffWordWrap` to avoid collisions with `editor.wordWrap`.
    diffEditorConfiguration.diffWordWrap = <'off' | 'on' | 'inherit' | undefined>(
      diffEditorConfiguration.wordWrap
    )
    delete diffEditorConfiguration.wordWrap

    Object.assign(editorConfiguration, diffEditorConfiguration)
  }

  editorConfiguration.accessibilityVerbose =
    configuration.accessibility?.verbosity?.diffEditor ?? false

  Object.assign(editorConfiguration, deepClone(overrides))

  return editorConfiguration
}

/**
 * A StandaloneEditor which is plugged on the `textResourceConfigurationService` for its options
 * So instead of just taking the options given by the user via the `updateOptions` method,
 * it fallbacks on the current configurationService configuration
 */
function createConfiguredEditorClass(
  impl: new (
    instantiationService: IInstantiationService,
    domElement: HTMLElement,
    _options: Readonly<IStandaloneEditorConstructionOptions>
  ) => StandaloneCodeEditor
) {
  class ConfiguredStandaloneEditor extends impl {
    private optionsOverrides: Readonly<IEditorOptions> = {}
    private lastAppliedEditorOptions?: IEditorOptions

    constructor(
      domElement: HTMLElement,
      _options: Readonly<IStandaloneEditorConstructionOptions> = {},
      @IInstantiationService instantiationService: IInstantiationService,
      @ITextResourceConfigurationService
      private textResourceConfigurationService: ITextResourceConfigurationService
    ) {
      // Remove Construction specific options
      const {
        theme,
        autoDetectHighContrast,
        model,
        value,
        language,
        accessibilityHelpUrl,
        ariaContainerElement,
        overflowWidgetsDomNode,
        dimension,
        ...options
      } = _options
      const computedOptions = computeConfiguration(
        textResourceConfigurationService.getValue<IEditorConfiguration>(_options.model?.uri),
        options
      )
      super(instantiationService, domElement, {
        ...computedOptions,
        overflowWidgetsDomNode,
        dimension,
        theme,
        autoDetectHighContrast,
        model,
        value,
        language,
        accessibilityHelpUrl,
        ariaContainerElement
      })
      this.lastAppliedEditorOptions = computedOptions

      this.optionsOverrides = options
      this._register(
        textResourceConfigurationService.onDidChangeConfiguration((e) => {
          const resource = this.getModel()?.uri
          if (resource != null && e.affectsConfiguration(resource, 'editor')) {
            this.updateEditorConfiguration()
          }
        })
      )
      this._register(this.onDidChangeModelLanguage(() => this.updateEditorConfiguration()))
      this._register(this.onDidChangeModel(() => this.updateEditorConfiguration()))
      this.updateEditorConfiguration()

      const scopedInstantiationService = instantiationService.createChild(
        new ServiceCollection([IContextKeyService, this._contextKeyService])
      )
      const resourceContext = this._register(
        scopedInstantiationService.createInstance(ResourceContextKey)
      )
      this.onDidChangeModel((e) => {
        resourceContext.set(e.newModelUrl)
      })
      resourceContext.set(this.getModel()?.uri)
    }

    /**
     * This method is widely inspired from vs/workbench/browser/parts/editor/textEditor
     */
    private updateEditorConfiguration(): void {
      if (!this.hasModel() || this.textResourceConfigurationService == null) {
        // textResourceConfigurationService can be null if this method is called by the constructor of StandaloneEditor
        return
      }
      const resource = this.getModel()!.uri
      const configuration = this.textResourceConfigurationService.getValue<
        IEditorConfiguration | undefined
      >(resource)
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

    override updateOptions(newOptions: Readonly<IEditorOptions>): void {
      // it can be null if this method is called by the constructor of StandaloneEditor
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

const ConfiguredStandaloneCodeEditor = createConfiguredEditorClass(
  createInjectedClass(StandaloneCodeEditor)
)
const ConfiguredStandaloneEditor = createConfiguredEditorClass(
  createInjectedClass(StandaloneEditor)
)

class ConfiguredStandaloneDiffEditor extends createInjectedClass(StandaloneDiffEditor2) {
  private optionsOverrides: Readonly<IEditorOptions> = {}
  private lastAppliedEditorOptions?: IEditorOptions
  constructor(
    domElement: HTMLElement,
    _options: Readonly<IStandaloneDiffEditorConstructionOptions> = {},
    @IInstantiationService instantiationService: IInstantiationService,
    @ITextResourceConfigurationService
    private textResourceConfigurationService: ITextResourceConfigurationService
  ) {
    // Remove Construction specific options
    const {
      theme,
      autoDetectHighContrast,
      modifiedAriaLabel,
      originalAriaLabel,
      overflowWidgetsDomNode,
      dimension,
      ...options
    } = _options
    const computedOptions = computeDiffConfiguration(
      textResourceConfigurationService.getValue<IEditorConfiguration>(undefined),
      options
    )
    super(instantiationService, domElement, {
      ...computedOptions,
      overflowWidgetsDomNode,
      dimension,
      theme,
      autoDetectHighContrast,
      modifiedAriaLabel,
      originalAriaLabel
    })
    this.lastAppliedEditorOptions = computedOptions

    this.optionsOverrides = options
    this._register(
      textResourceConfigurationService.onDidChangeConfiguration((e) => {
        const resource = this._targetEditor.getModel()?.uri
        if (
          resource != null &&
          (e.affectsConfiguration(resource, 'editor') ||
            e.affectsConfiguration(resource, 'diffEditor') ||
            e.affectsConfiguration(resource, 'accessibility.verbosity.diffEditor'))
        ) {
          this.updateEditorConfiguration()
        }
      })
    )
    this._register(
      this._targetEditor.onDidChangeModelLanguage(() => this.updateEditorConfiguration())
    )
    this._register(this.onDidChangeModel(() => this.updateEditorConfiguration()))
    this.updateEditorConfiguration()
  }

  /**
   * This method is widely inspired from vs/workbench/browser/parts/editor/textEditor
   */
  private updateEditorConfiguration(): void {
    if (this.getModel() == null || this.textResourceConfigurationService == null) {
      // textResourceConfigurationService can be null if this method is called by the constructor of StandaloneEditor
      return
    }
    const resource = this._targetEditor.getModel()?.uri
    const configuration = this.textResourceConfigurationService.getValue<
      IEditorConfiguration | undefined
    >(resource)
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

  override updateOptions(newOptions: Readonly<IEditorOptions>): void {
    // it can be null if this method is called by the constructor of StandaloneEditor
    this.optionsOverrides ??= {}

    this.optionsOverrides = {
      ...this.optionsOverrides,
      ...newOptions
    }

    this.updateEditorConfiguration()
  }

  protected override _createInnerEditor(
    instantiationService: IInstantiationService,
    container: HTMLElement,
    options: Readonly<IEditorOptions>
  ): CodeEditorWidget {
    return instantiationService.createInstance(ConfiguredStandaloneCodeEditor, container, options)
  }
}

export async function writeFile(uri: URI, content: string): Promise<void> {
  const fileService = await getService(IFileService)
  await fileService.writeFile(uri, VSBuffer.fromString(content))
}

export async function deleteFile(uri: URI, options?: Partial<IFileDeleteOptions>): Promise<void> {
  const fileService = await getService(IFileService)
  await fileService.del(uri, options)
}

export async function createModelReference(
  resource: URI,
  content?: string
): Promise<IReference<ITextFileEditorModel>> {
  if (content != null) {
    await writeFile(resource, content)
  }
  const textModelService = await getService(ITextModelService)
  return (await textModelService.createModelReference(resource)) as IReference<ITextFileEditorModel>
}

export interface KeybindingProvider {
  provideKeybindings(): ResolvedKeybindingItem[]
  onDidChangeKeybindings: Event<void>
}

export interface DynamicKeybindingService extends IKeybindingService {
  registerKeybindingProvider(provider: KeybindingProvider): IDisposable
  _getResolver(): KeybindingResolver
}

function isDynamicKeybindingService(keybindingService: IKeybindingService) {
  return (keybindingService as DynamicKeybindingService).registerKeybindingProvider != null
}

// This class use useful so editor.addAction and editor.addCommand still work
// Monaco do an `instanceof` on the KeybindingService so we need it to extends `StandaloneKeybindingService`
class DelegateStandaloneKeybindingService extends StandaloneKeybindingService {
  constructor(
    private delegate: DynamicKeybindingService,
    @IContextKeyService contextKeyService: IContextKeyService,
    @ICommandService commandService: ICommandService,
    @ITelemetryService telemetryService: ITelemetryService,
    @INotificationService notificationService: INotificationService,
    @ILogService logService: ILogService,
    @ICodeEditorService codeEditorService: ICodeEditorService
  ) {
    super(
      contextKeyService,
      commandService,
      telemetryService,
      notificationService,
      logService,
      codeEditorService
    )

    this._register(
      delegate.registerKeybindingProvider({
        provideKeybindings: () => {
          return this.getUserKeybindingItems()
        },
        onDidChangeKeybindings: this.onDidUpdateKeybindings
      })
    )
  }

  protected override _getResolver(): KeybindingResolver {
    return this.delegate._getResolver()
  }

  override resolveKeyboardEvent(keyboardEvent: IKeyboardEvent): ResolvedKeybinding {
    return this.delegate.resolveKeyboardEvent(keyboardEvent)
  }

  override resolveKeybinding(keybinding: Keybinding): ResolvedKeybinding[] {
    return this.delegate.resolveKeybinding(keybinding)
  }

  public override resolveUserBinding(userBinding: string): ResolvedKeybinding[] {
    return this.delegate.resolveUserBinding(userBinding)
  }

  public override _dumpDebugInfo(): string {
    return this.delegate._dumpDebugInfo()
  }

  public override _dumpDebugInfoJSON(): string {
    return this.delegate._dumpDebugInfoJSON()
  }

  public override registerSchemaContribution(contribution: KeybindingsSchemaContribution): void {
    return this.delegate.registerSchemaContribution(contribution)
  }

  public override enableKeybindingHoldMode(commandId: string): Promise<void> | undefined {
    return this.delegate.enableKeybindingHoldMode(commandId)
  }
}

let standaloneEditorInstantiationService: IInstantiationService | null = null
function getStandaloneEditorInstantiationService(accessor: ServicesAccessor) {
  if (standaloneEditorInstantiationService == null) {
    const serviceCollection = new ServiceCollection()
    serviceCollection.set(
      IQuickInputService,
      new SyncDescriptor(StandaloneQuickInputService, [], true)
    )
    const keybindingService = accessor.get(IKeybindingService)
    if (
      !(keybindingService instanceof StandaloneKeybindingService) &&
      isDynamicKeybindingService(keybindingService)
    ) {
      serviceCollection.set(
        IKeybindingService,
        new SyncDescriptor(DelegateStandaloneKeybindingService, [keybindingService], true)
      )
    }
    standaloneEditorInstantiationService = accessor
      .get(IInstantiationService)
      .createChild(serviceCollection)
  }
  return standaloneEditorInstantiationService
}

export const createConfiguredEditor: typeof createEditor = (domElement, options, override) => {
  const instantiationService = StandaloneServices.initialize(override ?? {})
  return instantiationService
    .invokeFunction(getStandaloneEditorInstantiationService)
    .createInstance(ConfiguredStandaloneEditor, domElement, options)
}

export const createConfiguredDiffEditor: typeof createDiffEditor = (
  domElement,
  options,
  override
) => {
  const instantiationService = StandaloneServices.initialize(override ?? {})
  return instantiationService
    .invokeFunction(getStandaloneEditorInstantiationService)
    .createInstance(ConfiguredStandaloneDiffEditor, domElement, options)
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
  MenuRegistry,
  MenuId,
  KeybindingsRegistry,
  ContextKeyExpr,
  RawContextKey,
  registerColor,
  setUnexpectedErrorHandler
}
export type { IJSONContributionRegistry, IJSONSchema, IReference, ITextFileEditorModel }
