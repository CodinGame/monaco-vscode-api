import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IQuickInputService } from 'vs/platform/quickinput/common/quickInput.service'
import type {
  IInputBox,
  IInputOptions,
  IPickOptions,
  IQuickInput,
  IQuickInputButton,
  IQuickNavigateConfiguration,
  IQuickPick,
  IQuickPickItem,
  IQuickWidget,
  QuickPickInput
} from 'vs/platform/quickinput/common/quickInput'
import { CancellationToken } from 'vs/base/common/cancellation'
import { StandaloneQuickInputService } from 'vs/editor/standalone/browser/quickInput/standaloneQuickInputService'
import {
  type IEditorOverrideServices,
  StandaloneServices
} from 'vs/editor/standalone/browser/standaloneServices'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { QuickInputController } from 'vs/platform/quickinput/browser/quickInputController'
import type { IQuickAccessController } from 'vs/platform/quickinput/common/quickAccess'
import { QuickInputService } from 'vs/workbench/services/quickinput/browser/quickInputService'
import { ICodeEditorService } from 'vs/editor/browser/services/codeEditorService.service'
import { StandaloneCodeEditor } from 'vs/editor/standalone/browser/standaloneCodeEditor'
import { CommandsQuickAccessProvider } from 'vs/workbench/contrib/quickaccess/browser/commandsQuickAccess'
import 'vs/workbench/contrib/codeEditor/browser/quickaccess/gotoLineQuickAccess'
import 'vs/workbench/contrib/codeEditor/browser/quickaccess/gotoSymbolQuickAccess'
import 'vs/workbench/browser/actions/quickAccessActions'
import 'vs/workbench/contrib/quickaccess/browser/quickAccess.contribution'
import 'vs/workbench/contrib/url/browser/url.contribution'
// required for the workbench.commandPalette.preserveInput config key
import 'vs/workbench/browser/workbench.contribution'
import type { ICodeEditor } from 'vs/editor/browser/editorBrowser'

let isKeybindingConfigurationVisible = () => {
  return false
}
let shouldUseGlobalPicker: (
  activeCodeEditor: ICodeEditor | null,
  activeCodeEditorStandalone: boolean
) => boolean = () => {
  return false
}

const original = CommandsQuickAccessProvider.prototype['getCommandPicks']
CommandsQuickAccessProvider.prototype['getCommandPicks'] = async function (
  this: CommandsQuickAccessProvider,
  token: CancellationToken
) {
  let result = await original.call(this, token)
  if (!isKeybindingConfigurationVisible()) {
    result = result.map((picks) => ({
      ...picks,
      buttons: undefined
    }))
  }
  return result
}

class DelegateQuickInputService implements IQuickInputService {
  declare readonly _serviceBrand: undefined

  private workbenchQuickInputService: IQuickInputService
  private standaloneQuickInputService?: StandaloneQuickInputService
  constructor(@IInstantiationService private instantiationService: IInstantiationService) {
    this.workbenchQuickInputService = instantiationService.createInstance(QuickInputService)
  }

  toggleHover(): void {
    return this.activeService.toggleHover()
  }

  private get activeService(): IQuickInputService {
    const activeCodeEditor = StandaloneServices.get(ICodeEditorService).getFocusedCodeEditor()

    if (
      activeCodeEditor == null ||
      shouldUseGlobalPicker(activeCodeEditor, activeCodeEditor instanceof StandaloneCodeEditor)
    ) {
      return this.workbenchQuickInputService
    }

    this.standaloneQuickInputService ??= this.instantiationService.createInstance(
      StandaloneQuickInputService
    )
    return this.standaloneQuickInputService
  }

  get currentQuickInput(): IQuickInput | undefined {
    return this.activeService.currentQuickInput
  }

  get quickAccess(): IQuickAccessController {
    return this.activeService.quickAccess
  }

  get backButton(): IQuickInputButton {
    return this.activeService.backButton
  }

  get onShow() {
    return this.activeService.onShow
  }

  get onHide() {
    return this.activeService.onHide
  }

  createQuickWidget(): IQuickWidget {
    return this.activeService.createQuickWidget()
  }

  pick<T extends IQuickPickItem, O extends IPickOptions<T>>(
    picks: Promise<QuickPickInput<T>[]> | QuickPickInput<T>[],
    options: O = <O>{},
    token: CancellationToken = CancellationToken.None
  ): Promise<(O extends { canPickMany: true } ? T[] : T) | undefined> {
    return (this.activeService as unknown as QuickInputController) /* TS fail */
      .pick(picks, options, token)
  }

  input(
    options?: IInputOptions | undefined,
    token?: CancellationToken | undefined
  ): Promise<string | undefined> {
    return this.activeService.input(options, token)
  }

  createQuickPick<T extends IQuickPickItem>(options: {
    useSeparators: true
  }): IQuickPick<T, { useSeparators: true }>

  createQuickPick<T extends IQuickPickItem>(options?: {
    useSeparators: boolean
  }): IQuickPick<T, { useSeparators: false }>

  createQuickPick<T extends IQuickPickItem>(
    options: { useSeparators: boolean } = { useSeparators: false }
  ): IQuickPick<T, { useSeparators: boolean }> {
    return this.activeService.createQuickPick(options)
  }

  createInputBox(): IInputBox {
    return this.activeService.createInputBox()
  }

  focus(): void {
    return this.activeService.focus()
  }

  toggle(): void {
    return this.activeService.toggle()
  }

  navigate(next: boolean, quickNavigate?: IQuickNavigateConfiguration | undefined): void {
    return this.activeService.navigate(next, quickNavigate)
  }

  accept(): Promise<void> {
    return this.activeService.accept()
  }

  back(): Promise<void> {
    return this.activeService.back()
  }

  cancel(): Promise<void> {
    return this.activeService.cancel()
  }

  setAlignment(alignment: 'top' | 'center' | { top: number; left: number }): void {
    return this.activeService.setAlignment(alignment)
  }
}

interface QuickAccessProps {
  isKeybindingConfigurationVisible?: () => boolean
  shouldUseGlobalPicker?: (
    activeCodeEditor: ICodeEditor | null,
    activeCodeEditorStandalone: boolean
  ) => boolean
}

export default function getServiceOverride({
  isKeybindingConfigurationVisible: _isKeybindingConfigurationVisible,
  shouldUseGlobalPicker: _shouldUseGlobalPicker
}: QuickAccessProps = {}): IEditorOverrideServices {
  if (_isKeybindingConfigurationVisible != null) {
    isKeybindingConfigurationVisible = _isKeybindingConfigurationVisible
  }
  if (_shouldUseGlobalPicker != null) {
    shouldUseGlobalPicker = _shouldUseGlobalPicker
  }
  return {
    [IQuickInputService.toString()]: new SyncDescriptor(DelegateQuickInputService, [], true)
  }
}
