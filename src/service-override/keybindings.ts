import '../missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { WorkbenchKeybindingService } from 'vs/workbench/services/keybinding/browser/keybindingService'
import { IKeybindingService, IUserFriendlyKeybinding } from 'vs/platform/keybinding/common/keybinding'
import { VSBuffer } from 'vs/base/common/buffer'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile'
import { IKeyboardLayoutService } from 'vs/platform/keyboardLayout/common/keyboardLayout'
import { BrowserKeyboardLayoutService } from 'vs/workbench/services/keybinding/browser/keyboardLayoutService'
import { IFileService } from 'vs/platform/files/common/files'
import { ICommandService } from 'vs/platform/commands/common/commands'
import { CommandService } from 'vs/workbench/services/commands/common/commandService'
import getFileServiceOverride from './files'
import 'vs/workbench/browser/workbench.contribution'

async function updateUserKeybindings (keybindingsJson: string): Promise<void> {
  const userDataProfilesService: IUserDataProfilesService = StandaloneServices.get(IUserDataProfilesService)
  await StandaloneServices.get(IFileService).writeFile(userDataProfilesService.defaultProfile.keybindingsResource, VSBuffer.fromString(keybindingsJson))
}

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [IKeybindingService.toString()]: new SyncDescriptor(WorkbenchKeybindingService),
    [IKeyboardLayoutService.toString()]: new SyncDescriptor(BrowserKeyboardLayoutService, undefined, true),
    [ICommandService.toString()]: new SyncDescriptor(CommandService)
  }
}

export {
  updateUserKeybindings,
  IUserFriendlyKeybinding
}
