import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { GitHubService } from 'vs/sessions/contrib/github/browser/githubService'
import { IGitHubService } from 'vs/sessions/contrib/github/browser/githubService.service'
import 'vs/sessions/contrib/github/browser/github.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IGitHubService.toString()]: new SyncDescriptor(GitHubService, [], true)
  }
}
