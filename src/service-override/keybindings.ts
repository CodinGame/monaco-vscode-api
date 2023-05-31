import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { WorkbenchKeybindingService } from 'vs/workbench/services/keybinding/browser/keybindingService'
import { IKeybindingService, IUserFriendlyKeybinding } from 'vs/platform/keybinding/common/keybinding'
import { VSBuffer } from 'vs/base/common/buffer'
import { Registry } from 'vs/platform/registry/common/platform'
import { Extensions, QuickAccessRegistry } from 'vs/platform/quickinput/common/quickAccess'
import { StandaloneCommandsQuickAccessProvider } from 'vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess'
import { CommandsQuickAccessProvider } from 'vs/workbench/contrib/quickaccess/browser/commandsQuickAccess'
import { CancellationToken } from 'vs/base/common/cancellation'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile'
import { IKeyboardLayoutService } from 'vs/platform/keyboardLayout/common/keyboardLayout'
import { BrowserKeyboardLayoutService } from 'vs/workbench/services/keybinding/browser/keyboardLayoutService'
import { localize } from 'vs/nls'
import { IConfigurationRegistry, Extensions as ConfigurationExtensions } from 'vs/platform/configuration/common/configurationRegistry'
import { IFileService } from 'vs/platform/files/common/files'
import getFileServiceOverride from './files'

// Replace StandaloneCommandsQuickAccessProvider by vscode CommandsQuickAccessProvider so the extension commands are displayed in the picker
const quickAccessRegistry = Registry.as<QuickAccessRegistry>(Extensions.Quickaccess)
const provider = quickAccessRegistry.getQuickAccessProviders().find(provider => provider.ctor === StandaloneCommandsQuickAccessProvider)
if (provider != null) {
  // eslint-disable-next-line dot-notation, @typescript-eslint/no-explicit-any
  (provider as any).ctor = class extends CommandsQuickAccessProvider {
    override get defaultFilterValue () { return undefined }
    override async getCommandPicks (token: CancellationToken) {
      // Remove keybinding settings button
      return (await super.getCommandPicks(token)).map(pick => {
        pick.buttons = []
        return pick
      })
    }
  }
}

// required for CommandsQuickAccessProvider
const configurationRegistry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration)
configurationRegistry.registerConfiguration({
  properties: {
    'workbench.commandPalette.history': {
      type: 'number',
      description: localize('commandHistory', 'Controls the number of recently used commands to keep in history for the command palette. Set to 0 to disable command history.'),
      default: 50,
      minimum: 0
    },
    'workbench.commandPalette.preserveInput': {
      type: 'boolean',
      description: localize('preserveInput', 'Controls whether the last typed input to the command palette should be restored when opening it the next time.'),
      default: false
    },
    'workbench.commandPalette.experimental.suggestCommands': {
      type: 'boolean',
      description: localize('suggestCommands', 'Controls whether the command palette should have a list of commonly used commands.'),
      default: false
    }
  }
})

async function updateUserKeybindings (keybindingsJson: string): Promise<void> {
  const userDataProfilesService: IUserDataProfilesService = StandaloneServices.get(IUserDataProfilesService)
  await StandaloneServices.get(IFileService).writeFile(userDataProfilesService.defaultProfile.keybindingsResource, VSBuffer.fromString(keybindingsJson))
}

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [IKeybindingService.toString()]: new SyncDescriptor(WorkbenchKeybindingService),
    [IKeyboardLayoutService.toString()]: new SyncDescriptor(BrowserKeyboardLayoutService, undefined, true)
  }
}

export {
  updateUserKeybindings,
  IUserFriendlyKeybinding
}
