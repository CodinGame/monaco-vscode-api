import type * as vscode from 'vscode'
import { DebugConfigurationProviderTriggerKind } from 'vs/workbench/contrib/debug/common/debug'
import { IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { getExtHostServices } from '../extHost'

export default function create (getExtension: () => IExtensionDescription): typeof vscode.debug {
  return {
    get activeDebugSession () {
      const { extHostDebugService } = getExtHostServices()
      return extHostDebugService.activeDebugSession
    },
    get activeDebugConsole () {
      const { extHostDebugService } = getExtHostServices()
      return extHostDebugService.activeDebugConsole
    },
    get breakpoints () {
      const { extHostDebugService } = getExtHostServices()
      return extHostDebugService.breakpoints
    },
    onDidStartDebugSession (listener, thisArg?, disposables?) {
      const { extHostDebugService } = getExtHostServices()
      return extHostDebugService.onDidStartDebugSession(listener, thisArg, disposables)
    },
    onDidTerminateDebugSession (listener, thisArg?, disposables?) {
      const { extHostDebugService } = getExtHostServices()
      return extHostDebugService.onDidTerminateDebugSession(listener, thisArg, disposables)
    },
    onDidChangeActiveDebugSession (listener, thisArg?, disposables?) {
      const { extHostDebugService } = getExtHostServices()
      return extHostDebugService.onDidChangeActiveDebugSession(listener, thisArg, disposables)
    },
    onDidReceiveDebugSessionCustomEvent (listener, thisArg?, disposables?) {
      const { extHostDebugService } = getExtHostServices()
      return extHostDebugService.onDidReceiveDebugSessionCustomEvent(listener, thisArg, disposables)
    },
    onDidChangeBreakpoints (listener, thisArgs?, disposables?) {
      const { extHostDebugService } = getExtHostServices()
      return extHostDebugService.onDidChangeBreakpoints(listener, thisArgs, disposables)
    },
    registerDebugConfigurationProvider (debugType: string, provider: vscode.DebugConfigurationProvider, triggerKind?: vscode.DebugConfigurationProviderTriggerKind) {
      const { extHostDebugService } = getExtHostServices()
      return extHostDebugService.registerDebugConfigurationProvider(debugType, provider, triggerKind ?? DebugConfigurationProviderTriggerKind.Initial)
    },
    registerDebugAdapterDescriptorFactory (debugType: string, factory: vscode.DebugAdapterDescriptorFactory) {
      const { extHostDebugService } = getExtHostServices()
      return extHostDebugService.registerDebugAdapterDescriptorFactory(getExtension(), debugType, factory)
    },
    registerDebugAdapterTrackerFactory (debugType: string, factory: vscode.DebugAdapterTrackerFactory) {
      const { extHostDebugService } = getExtHostServices()
      return extHostDebugService.registerDebugAdapterTrackerFactory(debugType, factory)
    },
    startDebugging (folder: vscode.WorkspaceFolder | undefined, nameOrConfig: string | vscode.DebugConfiguration, parentSessionOrOptions?: vscode.DebugSession | vscode.DebugSessionOptions) {
      const { extHostDebugService } = getExtHostServices()
      if ((parentSessionOrOptions == null) || (typeof parentSessionOrOptions === 'object' && 'configuration' in parentSessionOrOptions)) {
        return extHostDebugService.startDebugging(folder, nameOrConfig, { parentSession: parentSessionOrOptions })
      }
      return extHostDebugService.startDebugging(folder, nameOrConfig, parentSessionOrOptions)
    },
    stopDebugging (session?: vscode.DebugSession) {
      const { extHostDebugService } = getExtHostServices()
      return extHostDebugService.stopDebugging(session)
    },
    addBreakpoints (breakpoints: readonly vscode.Breakpoint[]) {
      const { extHostDebugService } = getExtHostServices()
      return extHostDebugService.addBreakpoints(breakpoints)
    },
    removeBreakpoints (breakpoints: readonly vscode.Breakpoint[]) {
      const { extHostDebugService } = getExtHostServices()
      return extHostDebugService.removeBreakpoints(breakpoints)
    },
    asDebugSourceUri (source: vscode.DebugProtocolSource, session?: vscode.DebugSession): vscode.Uri {
      const { extHostDebugService } = getExtHostServices()
      return extHostDebugService.asDebugSourceUri(source, session)
    }
  }
}
