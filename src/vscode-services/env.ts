import { UIKind } from 'vs/workbench/services/extensions/common/extensionHostProtocol'
import type * as vscode from 'vscode'
import { Event } from 'vs/base/common/event'
import { URI } from 'vs/base/common/uri'
import { matchesScheme } from 'vs/platform/opener/common/opener'
import { Schemas } from 'vs/base/common/network'
import { getExtHostServices } from './extHost'
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
    const { extHostClipboard } = getExtHostServices()
    return extHostClipboard.value
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
  openExternal: async (uri: vscode.Uri, options?: { allowContributedOpeners?: boolean | string }) => {
    const { extHostWindow } = getExtHostServices()
    return extHostWindow.openUri(uri, {
      allowTunneling: false,
      allowContributedOpeners: options?.allowContributedOpeners
    })
  },
  appHost: 'web',
  isNewAppInstall: false,
  isTelemetryEnabled: false,
  onDidChangeTelemetryEnabled: Event.None
}

export default env
