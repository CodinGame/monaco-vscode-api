import '../missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ITerminalBackend, ITerminalBackendRegistry, ITerminalProfileResolverService, ITerminalProfileService, TerminalExtensions } from 'vs/workbench/contrib/terminal/common/terminal'
import { ITerminalEditorService, ITerminalGroupService, ITerminalInstanceService, ITerminalService } from 'vs/workbench/contrib/terminal/browser/terminal'
import { TerminalService } from 'vs/workbench/contrib/terminal/browser/terminalService'
import { TerminalEditorService } from 'vs/workbench/contrib/terminal/browser/terminalEditorService'
import { TerminalGroupService } from 'vs/workbench/contrib/terminal/browser/terminalGroupService'
import { TerminalInstanceService } from 'vs/workbench/contrib/terminal/browser/terminalInstanceService'
import { TerminalProfileService } from 'vs/workbench/contrib/terminal/browser/terminalProfileService'
import { ITerminalContributionService, TerminalContributionService } from 'vs/workbench/contrib/terminal/common/terminalExtensionPoints'
import { ITerminalLinkProviderService } from 'vs/workbench/contrib/terminalContrib/links/browser/links'
import { TerminalLinkProviderService } from 'vs/workbench/contrib/terminalContrib/links/browser/terminalLinkProviderService'
import { ElectronTerminalProfileResolverService } from 'vs/workbench/contrib/terminal/electron-sandbox/terminalProfileResolverService'
import { EnvironmentVariableService } from 'vs/workbench/contrib/terminal/common/environmentVariableService'
import { IEnvironmentVariableService } from 'vs/workbench/contrib/terminal/common/environmentVariable'
import { ITerminalQuickFixService } from 'vs/workbench/contrib/terminalContrib/quickFix/browser/quickFix'
import { TerminalQuickFixService } from 'vs/workbench/contrib/terminalContrib/quickFix/browser/terminalQuickFixService'
import { Emitter, Event } from 'vs/base/common/event'
import { Registry } from 'vs/platform/registry/common/platform'
import { IProcessReadyEvent, ITerminalChildProcess, ITerminalLaunchError, ITerminalProfile, ITerminalsLayoutInfo } from 'vs/platform/terminal/common/terminal'
import { IProcessEnvironment } from 'vs/base/common/platform'
import { unsupported } from '../tools'
import 'vs/workbench/contrib/terminal/browser/terminal.contribution'

abstract class SimpleTerminalBackend implements ITerminalBackend {
  remoteAuthority = undefined
  onPtyHostUnresponsive = Event.None
  onPtyHostResponsive = Event.None
  onPtyHostRestart = Event.None
  onDidRequestDetach = Event.None
  attachToProcess = unsupported
  attachToRevivedProcess = unsupported
  listProcesses = unsupported
  getProfiles = async (): Promise<ITerminalProfile[]> => []
  getWslPath = unsupported
  getEnvironment = async (): Promise<IProcessEnvironment> => ({})
  getShellEnvironment = async (): Promise<IProcessEnvironment | undefined> => undefined
  setTerminalLayoutInfo = async (): Promise<void> => {}
  updateTitle = async (): Promise<void> => {}
  updateIcon = async (): Promise<void> => {}
  getTerminalLayoutInfo = async (): Promise<ITerminalsLayoutInfo | undefined> => undefined
  reduceConnectionGraceTime = unsupported
  requestDetachInstance = unsupported
  acceptDetachInstanceReply = unsupported
  persistTerminalState = unsupported

  abstract getDefaultSystemShell: ITerminalBackend['getDefaultSystemShell']
  abstract createProcess: ITerminalBackend['createProcess']
}

abstract class SimpleTerminalProcess implements ITerminalChildProcess {
  private onReady = new Emitter<IProcessReadyEvent>()
  constructor (
    readonly id: number,
    readonly pid: number,
    readonly cwd: string,
    readonly onData: Event<string>
  ) {
    setTimeout(() => {
      this.onReady.fire({
        cwd,
        pid
      })
    })
  }

  abstract start(): Promise<ITerminalLaunchError | { injectedArgs: string[] } | undefined>

  abstract shutdown (immediate: boolean): void

  abstract input (data: string): void

  abstract resize (cols: number, rows: number): void

  shouldPersist = false
  onProcessData = this.onData
  onProcessReady = this.onReady.event
  onDidChangeProperty = Event.None
  onProcessExit = Event.None
  processBinary = unsupported
  acknowledgeDataEvent (): void {
  }

  async setUnicodeVersion (): Promise<void> {
  }

  async getInitialCwd (): Promise<string> {
    return this.cwd
  }

  async getCwd (): Promise<string> {
    return this.cwd
  }

  async getLatency (): Promise<number> {
    return 0
  }

  refreshProperty = async (): Promise<never> => undefined as never

  async updateProperty (): Promise<void> {
  }
}

export default function getServiceOverride (backend: ITerminalBackend): IEditorOverrideServices {
  Registry.as<ITerminalBackendRegistry>(TerminalExtensions.Backend).registerTerminalBackend(backend)
  return {
    [ITerminalService.toString()]: new SyncDescriptor(TerminalService),
    [ITerminalEditorService.toString()]: new SyncDescriptor(TerminalEditorService),
    [ITerminalGroupService.toString()]: new SyncDescriptor(TerminalGroupService),
    [ITerminalInstanceService.toString()]: new SyncDescriptor(TerminalInstanceService),
    [ITerminalProfileService.toString()]: new SyncDescriptor(TerminalProfileService),
    [ITerminalContributionService.toString()]: new SyncDescriptor(TerminalContributionService),
    [ITerminalLinkProviderService.toString()]: new SyncDescriptor(TerminalLinkProviderService),
    [ITerminalProfileResolverService.toString()]: new SyncDescriptor(ElectronTerminalProfileResolverService),
    [IEnvironmentVariableService.toString()]: new SyncDescriptor(EnvironmentVariableService),
    [ITerminalQuickFixService.toString()]: new SyncDescriptor(TerminalQuickFixService)
  }
}

export {
  ITerminalBackend,
  ITerminalChildProcess,
  SimpleTerminalBackend,
  SimpleTerminalProcess
}
