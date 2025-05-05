import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { WorkbenchKeybindingService } from 'vs/workbench/services/keybinding/browser/keybindingService'
import type {
  IKeyboardEvent,
  IUserFriendlyKeybinding
} from 'vs/platform/keybinding/common/keybinding'
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding.service'
import { VSBuffer } from 'vs/base/common/buffer'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile.service'
import { IKeyboardLayoutService } from 'vs/platform/keyboardLayout/common/keyboardLayout.service'
import { BrowserKeyboardLayoutService } from 'vs/workbench/services/keybinding/browser/keyboardLayoutService'
import type { IFileWriteOptions } from 'vs/platform/files/common/files'
import { IFileService } from 'vs/platform/files/common/files.service'
import { ICommandService } from 'vs/platform/commands/common/commands.service'
import { CommandService } from 'vs/workbench/services/commands/common/commandService'
import { DisposableStore, toDisposable } from 'vs/base/common/lifecycle'
import { KeybindingResolver } from 'vs/platform/keybinding/common/keybindingResolver'
import type { IContextKeyServiceTarget } from 'vs/platform/contextkey/common/contextkey'
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey.service'
import { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity.service'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry.service'
import { INotificationService } from 'vs/platform/notification/common/notification.service'
import { IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile.service'
import { IHostService } from 'vs/workbench/services/host/browser/host.service'
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions.service'
import { ILogService } from 'vs/platform/log/common/log.service'
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
import { getService } from '../services'
import { ILayoutService } from 'vs/platform/layout/browser/layoutService.service'

// This is the default value, but can be overriden by overriding the Environment or UserDataProfileService service
const defaultUserKeybindindsFile = URI.from({
  scheme: Schemas.vscodeUserData,
  path: '/User/keybindings.json'
})

/**
 * Should be called only BEFORE the service are initialized to initialize the file on the filesystem before the keybindings service initializes
 */
async function initUserKeybindings(
  configurationJson: string,
  options?: Partial<IFileWriteOptions>,
  file: URI = defaultUserKeybindindsFile
): Promise<void> {
  await initFile(file, configurationJson, options)
}

/**
 * Can be called at any time after the services are initialized to update the user configuration
 */

async function updateUserKeybindings(keybindingsJson: string): Promise<void> {
  const userDataProfilesService: IUserDataProfilesService =
    await getService(IUserDataProfilesService)
  const fileService = await getService(IFileService)
  await fileService.writeFile(
    userDataProfilesService.defaultProfile.keybindingsResource,
    VSBuffer.fromString(keybindingsJson)
  )
}

class DynamicWorkbenchKeybindingService
  extends WorkbenchKeybindingService
  implements DynamicKeybindingService
{
  private keybindingProviders: KeybindingProvider[] = []

  constructor(
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
    @IKeyboardLayoutService keyboardLayoutService: IKeyboardLayoutService,
    @ILayoutService layoutService: ILayoutService
  ) {
    super(
      contextKeyService,
      commandService,
      telemetryService,
      notificationService,
      userDataProfileService,
      hostService,
      extensionService,
      fileService,
      uriIdentityService,
      logService,
      keyboardLayoutService,
      layoutService
    )
  }

  public registerKeybindingProvider(provider: KeybindingProvider) {
    this.keybindingProviders.push(provider)
    this.updateResolver()

    const store = new DisposableStore()
    store.add(
      provider.onDidChangeKeybindings(() => {
        this.updateResolver()
      })
    )

    store.add(
      toDisposable(() => {
        const idx = this.keybindingProviders.indexOf(provider)
        if (idx >= 0) {
          this.keybindingProviders.splice(idx, 1)
          this.updateResolver()
        }
      })
    )

    return store
  }

  public override _getResolver(): KeybindingResolver {
    return super._getResolver()
  }

  protected override _dispatch(e: IKeyboardEvent, target: IContextKeyServiceTarget): boolean {
    if (!this.shouldUseGlobalKeybindings()) {
      return false
    }
    return super._dispatch(e, target)
  }

  protected override getUserKeybindingItems() {
    return [
      ...super.getUserKeybindingItems(),
      ...this.keybindingProviders.flatMap((provider) => provider.provideKeybindings())
    ]
  }
}

interface KeybindingsProps {
  shouldUseGlobalKeybindings?: () => boolean
}

onRenderWorkbench((accessor) => {
  accessor.get(IInstantiationService).createInstance(WorkbenchContextKeysHandler)
})

export default function getServiceOverride({
  shouldUseGlobalKeybindings = () => false
}: KeybindingsProps = {}): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [IKeybindingService.toString()]: new SyncDescriptor(
      DynamicWorkbenchKeybindingService,
      [shouldUseGlobalKeybindings],
      false
    ),
    [IKeyboardLayoutService.toString()]: new SyncDescriptor(BrowserKeyboardLayoutService, [], true),
    [ICommandService.toString()]: new SyncDescriptor(CommandService, [], true)
  }
}

export { defaultUserKeybindindsFile, initUserKeybindings, updateUserKeybindings }
export type { IUserFriendlyKeybinding }
