import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneKeybindingService, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { WorkbenchKeybindingService } from 'vs/workbench/services/keybinding/browser/keybindingService'
import { IEnvironmentService } from 'vs/platform/environment/common/environment'
import { IKeybindingService, IUserFriendlyKeybinding } from 'vs/platform/keybinding/common/keybinding'
import { VSBuffer } from 'vs/base/common/buffer'
import { ExtensionMessageCollector } from 'vs/workbench/services/extensions/common/extensionsRegistry'
import { IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { } from 'vs/workbench/services/actions/common/menusExtensionPoint'
import { ILocalizedString } from 'vs/platform/action/common/action'
import { KeybindingResolver } from 'vs/platform/keybinding/common/keybindingResolver'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { AbstractKeybindingService } from 'vs/platform/keybinding/common/abstractKeybindingService'
import { Registry } from 'vs/platform/registry/common/platform'
import { Extensions, QuickAccessRegistry } from 'vs/platform/quickinput/common/quickAccess'
import { StandaloneCommandsQuickAccessProvider } from 'vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess'
import { CommandsQuickAccessProvider } from 'vs/workbench/contrib/quickaccess/browser/commandsQuickAccess'
import { DisposableStore } from 'vs/base/common/lifecycle'
import { CancellationToken } from 'vs/base/common/cancellation'
import getFileServiceOverride from './files'
import { consoleExtensionMessageHandler, getExtensionPoint } from './tools'
import { DEFAULT_EXTENSION } from '../vscode-services/extHost'
import { IFileService, Services } from '../services'
import { createInjectedClass } from '../tools/injection'

// This class use useful so editor.addAction and editor.addCommand still work
// Monaco do an `instanceof` on the KeybindingService so we need it to extends `StandaloneKeybindingService`
class DelegateStandaloneKeybindingService extends createInjectedClass(StandaloneKeybindingService) {
  private _cachedOverridenResolver: KeybindingResolver | null

  private delegate: AbstractKeybindingService

  constructor (@IInstantiationService instantiationService: IInstantiationService) {
    super(instantiationService)
    this.delegate = instantiationService.createInstance(WorkbenchKeybindingService)
    this._cachedOverridenResolver = null

    this.onDidUpdateKeybindings(() => {
      this._cachedOverridenResolver = null
    })
    this.delegate.onDidUpdateKeybindings(() => {
      this._cachedOverridenResolver = null
    })
  }

  protected override _getResolver (): KeybindingResolver {
    // Create a new resolver that uses the keybindings from WorkbenchKeybindingService, overriden by _dynamicKeybindings from StandaloneKeybindingService
    if (this._cachedOverridenResolver == null) {
      // eslint-disable-next-line dot-notation
      const overrides = this['_toNormalizedKeybindingItems'](this['_dynamicKeybindings'], false)
      this._cachedOverridenResolver = new KeybindingResolver(
        // eslint-disable-next-line dot-notation
        [...this.delegate['_getResolver']().getKeybindings()],
        overrides
        , (str) => this._log(str)
      )
    }
    return this._cachedOverridenResolver
  }
}

// Replace StandaloneCommandsQuickAccessProvider by vscode CommandsQuickAccessProvider so the extension commands are displayed in the picker
const quickAccessRegistry = Registry.as<QuickAccessRegistry>(Extensions.Quickaccess)
const provider = quickAccessRegistry.getQuickAccessProviders().find(provider => provider.ctor === StandaloneCommandsQuickAccessProvider)
if (provider != null) {
  // eslint-disable-next-line dot-notation, @typescript-eslint/no-explicit-any
  (provider as any).ctor = class extends CommandsQuickAccessProvider {
    override get defaultFilterValue () { return undefined }
    override async getCommandPicks (disposables: DisposableStore, token: CancellationToken) {
      // Remove keybinding settings button
      return (await super.getCommandPicks(disposables, token)).map(pick => {
        pick.buttons = []
        return pick
      })
    }
  }
}

// The interfaces are not exported
interface ContributedKeyBinding {
  command: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any
  key: string
  when?: string
  mac?: string
  linux?: string
  win?: string
}
interface IUserFriendlyCommand {
  command: string
  title: string | ILocalizedString
  shortTitle?: string | ILocalizedString
  enablement?: string
  category?: string | ILocalizedString
  icon?: string | { light: string, dark: string }
}

const keybindingsExtensionPoint = getExtensionPoint<ContributedKeyBinding | ContributedKeyBinding[]>('keybindings')
const commandsExtensionPoint = getExtensionPoint<IUserFriendlyCommand | IUserFriendlyCommand[]>('commands')

function setKeybindings (grammars: ContributedKeyBinding | ContributedKeyBinding[], extension: IExtensionDescription = Services.get().extension ?? DEFAULT_EXTENSION): void {
  keybindingsExtensionPoint.acceptUsers([{
    description: extension,
    value: grammars,
    collector: new ExtensionMessageCollector(consoleExtensionMessageHandler, extension, keybindingsExtensionPoint.name)
  }])
}

function setCommands (keybindings: IUserFriendlyCommand | IUserFriendlyCommand[], extension: IExtensionDescription = Services.get().extension ?? DEFAULT_EXTENSION): void {
  commandsExtensionPoint.acceptUsers([{
    description: extension,
    value: keybindings,
    collector: new ExtensionMessageCollector(consoleExtensionMessageHandler, extension, keybindingsExtensionPoint.name)
  }])
}

function updateUserKeybindings (keybindingsJson: string): void {
  const environmentService: IEnvironmentService = StandaloneServices.get(IEnvironmentService)
  void StandaloneServices.get(IFileService).writeFile(environmentService.keybindingsResource, VSBuffer.fromString(keybindingsJson))
}

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [IKeybindingService.toString()]: new SyncDescriptor(DelegateStandaloneKeybindingService)
  }
}

export {
  updateUserKeybindings,
  setKeybindings,
  setCommands,
  ContributedKeyBinding,
  IUserFriendlyKeybinding
}
