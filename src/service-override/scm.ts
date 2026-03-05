import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ISCMService, ISCMViewService } from 'vs/workbench/contrib/scm/common/scm.service'
import { SCMService } from 'vs/workbench/contrib/scm/common/scmService'
import { SCMViewService } from 'vs/workbench/contrib/scm/browser/scmViewService'
import { IQuickDiffService } from 'vs/workbench/contrib/scm/common/quickDiff.service'
import { QuickDiffService } from 'vs/workbench/contrib/scm/common/quickDiffService'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IQuickDiffModelService } from 'vs/workbench/contrib/scm/browser/quickDiffModel.service'
import { QuickDiffModelService } from 'vs/workbench/contrib/scm/browser/quickDiffModel'
import { IGitService } from 'vs/workbench/contrib/git/common/gitService.service'
import { GitService } from 'vs/workbench/contrib/git/browser/gitService'
import 'vs/workbench/contrib/scm/browser/scm.contribution'
import 'vs/workbench/contrib/git/browser/git.contributions.js'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [ISCMService.toString()]: new SyncDescriptor(SCMService, [], true),
    [ISCMViewService.toString()]: new SyncDescriptor(SCMViewService, [], true),
    [IQuickDiffService.toString()]: new SyncDescriptor(QuickDiffService, [], true),
    [IQuickDiffModelService.toString()]: new SyncDescriptor(QuickDiffModelService, [], true),
    [IGitService.toString()]: new SyncDescriptor(GitService, [], true)
  }
}
