import type * as vscode from 'vscode'
import { Event } from 'vs/base/common/event'
import { URI } from 'vs/base/common/uri'
import { matchesScheme } from 'vs/platform/opener/common/opener'
import { Schemas } from 'vs/base/common/network'
import { ExtHostTelemetryLogger } from 'vs/workbench/api/common/extHostTelemetry'
import { IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { getExtHostServices } from '../extHost'

export default function create (getExtension: () => IExtensionDescription): typeof vscode.env {
  return {
    get machineId () { return getExtHostServices().extHostInitData.telemetryInfo.machineId },
    get sessionId () { return getExtHostServices().extHostInitData.telemetryInfo.sessionId },
    get language () { return getExtHostServices().extHostInitData.environment.appLanguage },
    get appName () { return getExtHostServices().extHostInitData.environment.appName },
    get appRoot () { return getExtHostServices().extHostInitData.environment.appRoot?.fsPath ?? '' },
    get appHost () { return getExtHostServices().extHostInitData.environment.appHost },
    get uriScheme () { return getExtHostServices().extHostInitData.environment.appUriScheme },

    get clipboard () {
      const { extHostClipboard } = getExtHostServices()
      return extHostClipboard.value
    },
    remoteName: undefined,
    get shell () {
      const { extHostTerminalService } = getExtHostServices()
      return extHostTerminalService.getDefaultShell(false)
    },
    get uiKind () {
      return getExtHostServices().extHostInitData.uiKind
    },
    async asExternalUri (uri: URI) {
      const { extHostWindow } = getExtHostServices()
      try {
        return await extHostWindow.asExternalUri(uri, { allowTunneling: false })
      } catch (err) {
        if (matchesScheme(uri, Schemas.http) || matchesScheme(uri, Schemas.https)) {
          return uri
        }

        throw err
      }
    },
    openExternal: async (uri: vscode.Uri, options?: { allowContributedOpeners?: boolean | string}) => {
      const { extHostWindow } = getExtHostServices()
      return extHostWindow.openUri(uri, {
        allowTunneling: false,
        allowContributedOpeners: options?.allowContributedOpeners
      })
    },
    isNewAppInstall: false,
    get isTelemetryEnabled () {
      const { extHostTelemetry } = getExtHostServices()
      return extHostTelemetry.getTelemetryConfiguration()
    },
    get onDidChangeTelemetryEnabled (): Event<boolean> {
      const { extHostTelemetry } = getExtHostServices()
      return extHostTelemetry.onDidChangeTelemetryEnabled
    },
    createTelemetryLogger (sender: vscode.TelemetrySender): vscode.TelemetryLogger {
      const { extHostTelemetry } = getExtHostServices()

      ExtHostTelemetryLogger.validateSender(sender)
      return extHostTelemetry.instantiateLogger(getExtension(), sender)
    },
    get logLevel () {
      const { extHostLogService } = getExtHostServices()
      return extHostLogService.getLevel()
    },
    get onDidChangeLogLevel () {
      const { extHostLogService } = getExtHostServices()
      return extHostLogService.onDidChangeLogLevel
    }
  }
}
