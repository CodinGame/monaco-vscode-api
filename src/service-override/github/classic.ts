import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { WorkbenchGitHubService } from 'vs/workbench/services/github/browser/githubService'
import { IGitHubService } from 'vs/platform/github/common/githubService.service'
import 'vs/workbench/contrib/github/browser/githubLinkPresentation.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IGitHubService.toString()]: new SyncDescriptor(WorkbenchGitHubService, [], true)
  }
}
