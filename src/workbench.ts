import { IAnyWorkspaceIdentifier, UNKNOWN_EMPTY_WINDOW_WORKSPACE } from 'vs/platform/workspace/common/workspace'
import { IWorkspace } from 'vs/workbench/services/host/browser/browserHostService'
import { IWorkbenchConstructionOptions } from 'vs/workbench/browser/web.api'
import { isFolderToOpen, isWorkspaceToOpen } from 'vs/platform/window/common/window'
import { getSingleFolderWorkspaceIdentifier, getWorkspaceIdentifier as getWorkspaceIdentifierFromUri } from 'vs/workbench/services/workspaces/browser/workspaces'
import { URI } from 'vs/base/common/uri'
import { toLocalISOString } from 'vs/base/common/date'

let workbenchContainer: HTMLElement = document.body
let workbenchConstructionOptions: IWorkbenchConstructionOptions = {}
let workspaceIdentifier: IAnyWorkspaceIdentifier = UNKNOWN_EMPTY_WINDOW_WORKSPACE
export const logsPath = URI.file(toLocalISOString(new Date()).replace(/-|:|\.\d+Z$/g, '')).with({ scheme: 'vscode-log' })

export function getWorkbenchContainer (): HTMLElement {
  return workbenchContainer
}

export function getWorkbenchConstructionOptions (): IWorkbenchConstructionOptions {
  return workbenchConstructionOptions
}

export function getWorkspaceIdentifier (): IAnyWorkspaceIdentifier {
  return workspaceIdentifier
}

function resolveWorkspace (configuration: IWorkbenchConstructionOptions): IAnyWorkspaceIdentifier {
  let workspace: IWorkspace | undefined
  if (configuration.workspaceProvider != null) {
    workspace = configuration.workspaceProvider.workspace
  }

  // Multi-root workspace
  if (workspace != null && isWorkspaceToOpen(workspace)) {
    return getWorkspaceIdentifierFromUri(workspace.workspaceUri)
  }

  // Single-folder workspace
  if (workspace != null && isFolderToOpen(workspace)) {
    return getSingleFolderWorkspaceIdentifier(workspace.folderUri)
  }

  // Empty window workspace
  return UNKNOWN_EMPTY_WINDOW_WORKSPACE
}

export function initialize (container: HTMLElement, options: IWorkbenchConstructionOptions): void {
  workbenchContainer = container
  workbenchConstructionOptions = options
  workspaceIdentifier = resolveWorkspace(options)
}
