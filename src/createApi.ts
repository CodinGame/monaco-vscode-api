import type * as vscode from 'vscode'
import { IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import * as api from './api'
import createL10nApi from './vscode-apis/l10n'
import createLanguagesApi from './vscode-apis/languages'
import createCommandsApi from './vscode-apis/commands'
import createWorkspaceApi from './vscode-apis/workspace'
import createWindowApi from './vscode-apis/window'
import createEnvApi from './vscode-apis/env'
import createDebugApi from './vscode-apis/debug'
import createExtensionsApi from './vscode-apis/extensions'

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
