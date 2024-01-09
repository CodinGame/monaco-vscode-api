import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { WorkbenchKeybindingService } from 'vs/workbench/services/keybinding/browser/keybindingService'
import { IKeybindingService, IKeyboardEvent, IUserFriendlyKeybinding } from 'vs/platform/keybinding/common/keybinding'
import { VSBuffer } from 'vs/base/common/buffer'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile'
import { IKeyboardLayoutService } from 'vs/platform/keyboardLayout/common/keyboardLayout'
import { BrowserKeyboardLayoutService } from 'vs/workbench/services/keybinding/browser/keyboardLayoutService'
import { IFileService, IFileWriteOptions } from 'vs/platform/files/common/files'
import { ICommandService } from 'vs/platform/commands/common/commands'
import { CommandService } from 'vs/workbench/services/commands/common/commandService'
import { DisposableStore, toDisposable } from 'vs/base/common/lifecycle'
import { KeybindingResolver } from 'vs/platform/keybinding/common/keybindingResolver'
import { IContextKeyService, IContextKeyServiceTarget } from 'vs/platform/contextkey/common/contextkey'
import { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry'
import { INotificationService } from 'vs/platform/notification/common/notification'
import { IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile'
import { IHostService } from 'vs/workbench/services/host/browser/host'
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions'
import { ILogService } from 'vs/platform/log/common/log'
import { WorkbenchContextKeysHandler } from 'vs/workbench/browser/contextkeys'
import { Schemas } from 'vs/base/common/network'
import { URI } from 'vs/base/common/uri'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import getFileServiceOverride, { initFile } from './files'
import type { DynamicKeybindingService, KeybindingProvider } from '../monaco'
import { onRenderWorkbench } from '../lifecycle'
import 'vs/workbench/browser/workbench.contribution'
import 'vs/workbench/contrib/keybindings/browser/keybindings.contribution'
import 'vs/workbench/contrib/preferences/browser/keybindingsEditorContribution'
import 'vs/workbench/contrib/commands/common/commands.contribution'

// This is the default value, but can be overriden by overriding the Environment or UserDataProfileService service
const defaultUserKeybindindsFile = URI.from({ scheme: Schemas.vscodeUserData, path: '/User/keybindings.json' })

/**
 * Should be called only BEFORE the service are initialized to initialize the file on the filesystem before the keybindings service initializes
 */
async function initUserKeybindings (configurationJson: string, options?: Partial<IFileWriteOptions>, file: URI = defaultUserKeybindindsFile): Promise<void> {
  await initFile(file, configurationJson, options)
}

/**
 * Can be called at any time after the services are initialized to update the user configuration
 */

async function updateUserKeybindings (keybindingsJson: string): Promise<void> {
  const userDataProfilesService: IUserDataProfilesService = StandaloneServices.get(IUserDataProfilesService)
  await StandaloneServices.get(IFileService).writeFile(userDataProfilesService.defaultProfile.keybindingsResource, VSBuffer.fromString(keybindingsJson))
}

class DynamicWorkbenchKeybindingService extends WorkbenchKeybindingService implements DynamicKeybindingService {
  private keybindingProviders: KeybindingProvider[] = []

  constructor (
    private shouldUseGlobalKeybindings: () => boolean,
    @IContextKeyService contextKeyService: IContextKeyService,
    @ICommandService commandService: ICommandService,
    @ITelemetryService telemetryService: ITelemetryService,
    @INotificationService notificationService: INotificationService,
    @IUserDataProfileService userDataProfileService: IUserDataProfileService,
    @IHostService hostService: IHostService,
    @IExtensionService extensionService: IExtensionService,
    @IFileService fileService: IFileService,
    @IUriIdentityService uriIdentityService: IUriIdentityService,
    @ILogService logService: ILogService,
    @IKeyboardLayoutService keyboardLayoutService: IKeyboardLayoutService
  ) {
    super(contextKeyService, commandService, telemetryService, notificationService, userDataProfileService, hostService, extensionService, fileService, uriIdentityService, logService, keyboardLayoutService)
  }

  public registerKeybindingProvider (provider: KeybindingProvider) {
    this.keybindingProviders.push(provider)
    this.updateResolver()

    const store = new DisposableStore()
    store.add(provider.onDidChangeKeybindings(() => {
      this.updateResolver()
    }))

    store.add(toDisposable(() => {
      const idx = this.keybindingProviders.indexOf(provider)
      if (idx >= 0) {
        this.keybindingProviders.splice(idx, 1)
        this.updateResolver()
      }
    }))

    return store
  }

  public override _getResolver (): KeybindingResolver {
    return super._getResolver()
  }

  protected override _dispatch (e: IKeyboardEvent, target: IContextKeyServiceTarget): boolean {
    if (!this.shouldUseGlobalKeybindings()) {
      return false
    }
    return super._dispatch(e, target)
  }

  protected override getUserKeybindingItems () {
    return [...super.getUserKeybindingItems(), ...this.keybindingProviders.flatMap(provider => provider.provideKeybindings())]
  }
}

interface KeybindingsProps {
  shouldUseGlobalKeybindings?: () => boolean
}

onRenderWorkbench((accessor) => {
  accessor.get(IInstantiationService).createInstance(WorkbenchContextKeysHandler)
})

export default function getServiceOverride ({ shouldUseGlobalKeybindings = () => false }: KeybindingsProps = {}): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [IKeybindingService.toString()]: new SyncDescriptor(DynamicWorkbenchKeybindingService, [shouldUseGlobalKeybindings], false),
    [IKeyboardLayoutService.toString()]: new SyncDescriptor(BrowserKeyboardLayoutService, undefined, true),
    [ICommandService.toString()]: new SyncDescriptor(CommandService, [], true)
  }
}

export {
  defaultUserKeybindindsFile,
  initUserKeybindings,
  updateUserKeybindings,
  IUserFriendlyKeybinding
}
