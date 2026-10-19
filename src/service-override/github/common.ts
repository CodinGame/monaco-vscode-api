import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { WorkbenchGitHubService } from 'vs/workbench/services/github/browser/githubService'
import { IWorkbenchGitHubService } from 'vs/workbench/services/github/common/githubService.service'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IWorkbenchGitHubService.toString()]: new SyncDescriptor(WorkbenchGitHubService, [], true)
  }
}
