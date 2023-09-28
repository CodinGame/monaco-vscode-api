import '../missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { WorkbenchKeybindingService } from 'vs/workbench/services/keybinding/browser/keybindingService'
import { IKeybindingService, IKeyboardEvent, IUserFriendlyKeybinding } from 'vs/platform/keybinding/common/keybinding'
import { VSBuffer } from 'vs/base/common/buffer'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile'
import { IKeyboardLayoutService } from 'vs/platform/keyboardLayout/common/keyboardLayout'
import { BrowserKeyboardLayoutService } from 'vs/workbench/services/keybinding/browser/keyboardLayoutService'
import { IFileService } from 'vs/platform/files/common/files'
import { ICommandService } from 'vs/platform/commands/common/commands'
import { CommandService } from 'vs/workbench/services/commands/common/commandService'
import { ResolvedKeybindingItem } from 'vs/platform/keybinding/common/resolvedKeybindingItem'
import { toDisposable } from 'vs/base/common/lifecycle'
import { KeybindingResolver } from 'vs/platform/keybinding/common/keybindingResolver'
import { IContextKeyService, IContextKeyServiceTarget } from 'vs/platform/contextkey/common/contextkey'
import { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry'
import { INotificationService } from 'vs/platform/notification/common/notification'
import { IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile'
import { IHostService } from 'vs/workbench/services/host/browser/host'
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions'
import { ILogService } from 'vs/platform/log/common/log'
import getFileServiceOverride from './files'
import { DynamicKeybindingService } from '../monaco'
import 'vs/workbench/browser/workbench.contribution'
import 'vs/workbench/contrib/keybindings/browser/keybindings.contribution'

async function updateUserKeybindings (keybindingsJson: string): Promise<void> {
  const userDataProfilesService: IUserDataProfilesService = StandaloneServices.get(IUserDataProfilesService)
  await StandaloneServices.get(IFileService).writeFile(userDataProfilesService.defaultProfile.keybindingsResource, VSBuffer.fromString(keybindingsJson))
}

class DynamicWorkbenchKeybindingService extends WorkbenchKeybindingService implements DynamicKeybindingService {
  private keybindingProviders: (() => ResolvedKeybindingItem[])[] = []

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

  public registerKeybindingProvider (provider: () => ResolvedKeybindingItem[]) {
    this.keybindingProviders.push(provider)
    this.updateResolver()

    return toDisposable(() => {
      const idx = this.keybindingProviders.indexOf(provider)
      if (idx >= 0) {
        this.keybindingProviders.splice(idx, 1)
        this.updateResolver()
      }
    })
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
    return [...super.getUserKeybindingItems(), ...this.keybindingProviders.flatMap(provider => provider())]
  }
}

interface KeybindingsProps {
  shouldUseGlobalKeybindings?: () => boolean
}

export default function getServiceOverride ({ shouldUseGlobalKeybindings = () => false }: KeybindingsProps = {}): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [IKeybindingService.toString()]: new SyncDescriptor(DynamicWorkbenchKeybindingService, [shouldUseGlobalKeybindings], false),
    [IKeyboardLayoutService.toString()]: new SyncDescriptor(BrowserKeyboardLayoutService, undefined, true),
    [ICommandService.toString()]: new SyncDescriptor(CommandService, [], true)
  }
}

export {
  updateUserKeybindings,
  IUserFriendlyKeybinding
}
