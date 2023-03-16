import type * as vscode from 'vscode'
import { Event } from 'vs/base/common/event'
import { URI } from 'vs/base/common/uri'
import { matchesScheme } from 'vs/platform/opener/common/opener'
import { Schemas } from 'vs/base/common/network'
import { ExtHostTelemetryLogger } from 'vs/workbench/api/common/extHostTelemetry'
import { DEFAULT_EXTENSION, getExtHostServices, initData } from './extHost'
import { Services } from '../services'
import { unsupported } from '../tools'

const env: typeof vscode.env = {
  get machineId () { return initData.telemetryInfo.machineId },
  get sessionId () { return initData.telemetryInfo.sessionId },
  get language () { return initData.environment.appLanguage },
  get appName () { return initData.environment.appName },
  get appRoot () { return initData.environment.appRoot?.fsPath ?? '' },
  get appHost () { return initData.environment.appHost },
  get uriScheme () { return initData.environment.appUriScheme },

  get clipboard () {
    const { extHostClipboard } = getExtHostServices()
    return extHostClipboard.value
  },
  remoteName: undefined,
  get shell () { return unsupported() },
  get uiKind () {
    return initData.uiKind
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
    const extension = Services.get().extension ?? DEFAULT_EXTENSION

    ExtHostTelemetryLogger.validateSender(sender)
    return extHostTelemetry.instantiateLogger(extension, sender)
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

export default env
