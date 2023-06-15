import type * as vscode from 'vscode'
import { IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import * as api from './api'
import createL10nApi from './vscode-services/l10n'
import createLanguagesApi from './vscode-services/languages'
import createCommandsApi from './vscode-services/commands'
import createWorkspaceApi from './vscode-services/workspace'
import createWindowApi from './vscode-services/window'
import createEnvApi from './vscode-services/env'
import createDebugApi from './vscode-services/debug'
import createExtensionsApi from './vscode-services/extensions'

export default function createApi (extension: IExtensionDescription): typeof vscode {
  const workspace = createWorkspaceApi(() => extension)
  return {
    ...api,
    extensions: createExtensionsApi(() => extension),
    debug: createDebugApi(() => extension),
    env: createEnvApi(() => extension),
    commands: createCommandsApi(() => extension),
    window: createWindowApi(() => extension, workspace),
    workspace: createWorkspaceApi(() => extension),
    languages: createLanguagesApi(() => extension),
    l10n: createL10nApi(() => extension)
  }
}
