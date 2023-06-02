import '../vscode-services/missing-services'
import { CommandsQuickAccessProvider } from 'vs/workbench/contrib/quickaccess/browser/commandsQuickAccess'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IInputBox, IInputOptions, IPickOptions, IQuickInputButton, IQuickInputService, IQuickNavigateConfiguration, IQuickPick, IQuickPickItem, QuickPickInput } from 'vs/platform/quickinput/common/quickInput'
import { CancellationToken } from 'vs/base/common/cancellation'
import { StandaloneQuickInputService } from 'vs/editor/standalone/browser/quickInput/standaloneQuickInputService'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { QuickInputController } from 'vs/platform/quickinput/browser/quickInput'
import { IQuickAccessController } from 'vs/platform/quickinput/common/quickAccess'
import { QuickInputService } from 'vs/workbench/services/quickinput/browser/quickInputService'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService'
import { StandaloneCodeEditor } from 'vs/editor/standalone/browser/standaloneCodeEditor'
import 'vs/workbench/contrib/codeEditor/browser/quickaccess/gotoLineQuickAccess'
import 'vs/workbench/contrib/codeEditor/browser/quickaccess/gotoSymbolQuickAccess'
import 'vs/workbench/browser/actions/quickAccessActions'
import 'vs/workbench/contrib/quickaccess/browser/quickAccess.contribution'
import 'vs/workbench/contrib/search/browser/search.contribution'

// Remote "Configur Keybinding" from command menu
// eslint-disable-next-line dot-notation
const originalGetCommandPicks = CommandsQuickAccessProvider.prototype['getCommandPicks']
// eslint-disable-next-line dot-notation
CommandsQuickAccessProvider.prototype['getCommandPicks'] = async function (token) {
  return (await originalGetCommandPicks.call(this, token)).map(pick => {
    pick.buttons = []
    return pick
  })
}

class DelegateQuickInputService implements IQuickInputService {
  declare readonly _serviceBrand: undefined

  private workbenchQuickInputService: IQuickInputService
  private standaloneQuickInputService?: StandaloneQuickInputService
  constructor (
    @IInstantiationService private instantiationService: IInstantiationService
  ) {
    this.workbenchQuickInputService = instantiationService.createInstance(QuickInputService)
  }

  private get activeService (): IQuickInputService {
    const activeCodeEditor = StandaloneServices.get(ICodeEditorService).getFocusedCodeEditor()
    if (!(activeCodeEditor instanceof StandaloneCodeEditor)) {
      return this.workbenchQuickInputService
    }

    this.standaloneQuickInputService ??= this.instantiationService.createInstance(StandaloneQuickInputService)
    return this.standaloneQuickInputService
  }

  get quickAccess (): IQuickAccessController { return this.activeService.quickAccess }

  get backButton (): IQuickInputButton { return this.activeService.backButton }

  get onShow () { return this.activeService.onShow }
  get onHide () { return this.activeService.onHide }

  pick<T extends IQuickPickItem, O extends IPickOptions<T>> (picks: Promise<QuickPickInput<T>[]> | QuickPickInput<T>[], options: O = <O>{}, token: CancellationToken = CancellationToken.None): Promise<(O extends { canPickMany: true } ? T[] : T) | undefined> {
    return (this.activeService as unknown as QuickInputController /* TS fail */).pick(picks, options, token)
  }

  input (options?: IInputOptions | undefined, token?: CancellationToken | undefined): Promise<string | undefined> {
    return this.activeService.input(options, token)
  }

  createQuickPick<T extends IQuickPickItem> (): IQuickPick<T> {
    return this.activeService.createQuickPick()
  }

  createInputBox (): IInputBox {
    return this.activeService.createInputBox()
  }

  focus (): void {
    return this.activeService.focus()
  }

  toggle (): void {
    return this.activeService.toggle()
  }

  navigate (next: boolean, quickNavigate?: IQuickNavigateConfiguration | undefined): void {
    return this.activeService.navigate(next, quickNavigate)
  }

  accept (): Promise<void> {
    return this.activeService.accept()
  }

  back (): Promise<void> {
    return this.activeService.back()
  }

  cancel (): Promise<void> {
    return this.activeService.cancel()
  }
}

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IQuickInputService.toString()]: new SyncDescriptor(DelegateQuickInputService)
  }
}
