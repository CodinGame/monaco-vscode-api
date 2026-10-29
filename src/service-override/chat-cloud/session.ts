import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import getCommonServiceOverride from './common.js'
export * from './common.js'
import 'vs/sessions/contrib/providers/copilotChatSessions/browser/copilotChatSessions.contribution'
import 'vs/sessions/contrib/providers/remoteAgentHost/browser/cloudSandboxAgentHost.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return getCommonServiceOverride()
}
