import { UIKind } from 'vs/workbench/services/extensions/common/extensionHostProtocol'
import type * as vscode from 'vscode'
import { Event } from 'vs/base/common/event'
import { Services } from '../services'
import { unsupported } from '../tools'

const env: typeof vscode.env = {
  appName: 'Monaco',
  appRoot: '',
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  language: window.navigator.language ?? 'en-US',
  get uriScheme () {
    return unsupported()
  },
  get clipboard () {
    return unsupported()
  },
  get machineId () {
    return unsupported()
  },
  get sessionId () {
    return unsupported()
  },
  remoteName: undefined,
  shell: '',
  uiKind: UIKind.Web,
  asExternalUri: unsupported,
  openExternal: async (uri: vscode.Uri) => {
    const { env } = Services.get()

    if ((env != null) && (env.openExternal != null)) {
      return env.openExternal(uri)
    }
    return false
  },
  appHost: 'web',
  isNewAppInstall: false,
  isTelemetryEnabled: false,
  onDidChangeTelemetryEnabled: Event.None
}

export default env
