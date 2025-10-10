import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import {
  type ITerminalsLayoutInfo,
  type IProcessReadyEvent,
  type ITerminalBackend,
  type ITerminalBackendRegistry,
  type ITerminalChildProcess,
  type ITerminalLaunchError,
  type ITerminalProfile,
  TerminalExtensions,
  type IPtyHostLatencyMeasurement
} from 'vs/platform/terminal/common/terminal'
import { ITerminalLogService } from 'vs/platform/terminal/common/terminal.service'
import {
  ITerminalProfileResolverService,
  ITerminalProfileService
} from 'vs/workbench/contrib/terminal/common/terminal.service'
import {
  ITerminalConfigurationService,
  ITerminalEditingService,
  ITerminalEditorService,
  ITerminalGroupService,
  ITerminalInstanceService,
  ITerminalService
} from 'vs/workbench/contrib/terminal/browser/terminal.service'
import { TerminalService } from 'vs/workbench/contrib/terminal/browser/terminalService'
import { TerminalEditorService } from 'vs/workbench/contrib/terminal/browser/terminalEditorService'
import { TerminalGroupService } from 'vs/workbench/contrib/terminal/browser/terminalGroupService'
import { TerminalInstanceService } from 'vs/workbench/contrib/terminal/browser/terminalInstanceService'
import { TerminalProfileService } from 'vs/workbench/contrib/terminal/browser/terminalProfileService'
import { TerminalContributionService } from 'vs/workbench/contrib/terminal/common/terminalExtensionPoints'
import { ITerminalContributionService } from 'vs/workbench/contrib/terminal/common/terminalExtensionPoints.service'
import { ITerminalLinkProviderService } from 'vs/workbench/contrib/terminalContrib/links/browser/links.service'
import { TerminalLinkProviderService } from 'vs/workbench/contrib/terminalContrib/links/browser/terminalLinkProviderService'
import { ElectronTerminalProfileResolverService } from 'vs/workbench/contrib/terminal/electron-browser/terminalProfileResolverService'
import { EnvironmentVariableService } from 'vs/workbench/contrib/terminal/common/environmentVariableService'
import { IEnvironmentVariableService } from 'vs/workbench/contrib/terminal/common/environmentVariable.service'
import { ITerminalQuickFixService } from 'vs/workbench/contrib/terminalContrib/quickFix/browser/quickFix.service'
import { TerminalLogService } from 'vs/platform/terminal/common/terminalLogService'
import { TerminalQuickFixService } from 'vs/workbench/contrib/terminalContrib/quickFix/browser/terminalQuickFixService'
import { Emitter, Event } from 'vs/base/common/event'
import { Registry } from 'vs/platform/registry/common/platform'
import type { IProcessEnvironment } from 'vs/base/common/platform'
import type { PerformanceMark } from 'vs/base/common/performance'
import { DeferredPromise } from 'vs/base/common/async'
import { EmbedderTerminalService } from 'vs/workbench/services/terminal/common/embedderTerminalService'
import { IEmbedderTerminalService } from 'vs/workbench/services/terminal/common/embedderTerminalService.service'
import { TerminalConfigurationService } from 'vs/workbench/contrib/terminal/browser/terminalConfigurationService'
import { ITerminalCompletionService } from 'vs/workbench/contrib/terminalContrib/suggest/browser/terminalCompletionService.service'
import { TerminalCompletionService } from 'vs/workbench/contrib/terminalContrib/suggest/browser/terminalCompletionService'
import { unsupported } from '../tools.js'
import type { ISerializedCommandDetectionCapability } from 'vs/platform/terminal/common/capabilities/capabilities'
import { TerminalEditingService } from 'vs/workbench/contrib/terminal/browser/terminalEditingService'
export {
  ITerminalService,
  ITerminalInstanceService
} from 'vs/workbench/contrib/terminal/browser/terminal.service'
import 'vs/workbench/contrib/terminal/terminal.contribution'
import 'vs/workbench/contrib/externalTerminal/browser/externalTerminal.contribution'
import 'vs/workbench/contrib/terminal/browser/terminal.web.contribution'

abstract class SimpleTerminalBackend implements ITerminalBackend {
  installAutoReply = async (): Promise<void> => {}

  uninstallAllAutoReplies = async (): Promise<void> => {}

  getLatency = async (): Promise<IPtyHostLatencyMeasurement[]> => []
  isResponsive = true

  private readonly _whenConnected = new DeferredPromise<void>()
  get whenReady(): Promise<void> {
    return this._whenConnected.p
  }

  setReady(): void {
    void this._whenConnected.complete()
  }

  async getPerformanceMarks(): Promise<PerformanceMark[]> {
    return []
  }

  restartPtyHost = unsupported
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
  constructor(
    readonly id: number,
    readonly pid: number,
    readonly cwd: string,
    readonly onData: Event<string>
  ) {
    setTimeout(() => {
      this.onReady.fire({
        cwd,
        pid,
        windowsPty: undefined
      })
    })
  }
  onProcessReplayComplete?: Event<void> | undefined
  onRestoreCommands?: Event<ISerializedCommandDetectionCapability> | undefined

  abstract sendSignal(signal: string): void

  abstract clearBuffer(): void | Promise<void>

  abstract start(): Promise<ITerminalLaunchError | { injectedArgs: string[] } | undefined>

  abstract shutdown(immediate: boolean): void

  abstract input(data: string): void

  abstract resize(cols: number, rows: number): void

  shouldPersist = false
  onProcessData = this.onData
  onProcessReady = this.onReady.event
  onDidChangeProperty = Event.None
  onProcessExit = Event.None
  processBinary = unsupported
  acknowledgeDataEvent(): void {}

  async setUnicodeVersion(): Promise<void> {}

  async getInitialCwd(): Promise<string> {
    return this.cwd
  }

  async getCwd(): Promise<string> {
    return this.cwd
  }

  async getLatency(): Promise<number> {
    return 0
  }

  refreshProperty = async (): Promise<never> => undefined as never

  async updateProperty(): Promise<void> {}
}

export default function getServiceOverride(backend?: ITerminalBackend): IEditorOverrideServices {
  if (backend != null) {
    Registry.as<ITerminalBackendRegistry>(TerminalExtensions.Backend).registerTerminalBackend(
      backend
    )
  }
  return {
    [ITerminalService.toString()]: new SyncDescriptor(TerminalService, [], true),
    [ITerminalLogService.toString()]: new SyncDescriptor(TerminalLogService, [], true),
    [ITerminalEditorService.toString()]: new SyncDescriptor(TerminalEditorService, [], true),
    [ITerminalGroupService.toString()]: new SyncDescriptor(TerminalGroupService, [], true),
    [ITerminalInstanceService.toString()]: new SyncDescriptor(TerminalInstanceService, [], true),
    [ITerminalProfileService.toString()]: new SyncDescriptor(TerminalProfileService, [], true),
    [ITerminalContributionService.toString()]: new SyncDescriptor(
      TerminalContributionService,
      [],
      true
    ),
    [ITerminalLinkProviderService.toString()]: new SyncDescriptor(
      TerminalLinkProviderService,
      [],
      true
    ),
    [ITerminalProfileResolverService.toString()]: new SyncDescriptor(
      ElectronTerminalProfileResolverService,
      [],
      true
    ),
    [IEnvironmentVariableService.toString()]: new SyncDescriptor(
      EnvironmentVariableService,
      [],
      true
    ),
    [ITerminalQuickFixService.toString()]: new SyncDescriptor(TerminalQuickFixService, [], true),
    [IEmbedderTerminalService.toString()]: new SyncDescriptor(EmbedderTerminalService, [], true),
    [ITerminalConfigurationService.toString()]: new SyncDescriptor(
      TerminalConfigurationService,
      [],
      true
    ),
    [ITerminalCompletionService.toString()]: new SyncDescriptor(
      TerminalCompletionService,
      [],
      true
    ),
    [ITerminalEditingService.toString()]: new SyncDescriptor(TerminalEditingService, [], true)
  }
}

export { SimpleTerminalBackend, SimpleTerminalProcess }
export type { ITerminalBackend, ITerminalChildProcess }
