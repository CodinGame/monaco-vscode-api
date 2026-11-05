import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { WorkbenchGitHubService } from 'vs/workbench/services/github/browser/githubService'
import { IWorkbenchGitHubService } from 'vs/workbench/services/github/common/githubService.service'
import { WorkbenchGitHubCredentialProvider } from 'vs/workbench/services/github/browser/githubCredentialProvider'
import { IGitHubCredentialBroker } from 'vs/platform/github/common/remote/ipc.service'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IWorkbenchGitHubService.toString()]: new SyncDescriptor(WorkbenchGitHubService, [], true),
    [IGitHubCredentialBroker.toString()]: new SyncDescriptor(
      WorkbenchGitHubCredentialProvider,
      [],
      true
    )
  }
}
