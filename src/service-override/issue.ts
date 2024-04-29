import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IWorkbenchIssueService } from 'vs/workbench/services/issue/common/issue.service'
import { WebIssueService } from 'vs/workbench/services/issue/browser/issueService'
import { TroubleshootIssueService } from 'vs/workbench/services/issue/browser/issueTroubleshoot'
import { ITroubleshootIssueService } from 'vs/workbench/services/issue/browser/issueTroubleshoot.service'
import 'vs/workbench/contrib/issue/browser/issue.contribution'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IWorkbenchIssueService.toString()]: new SyncDescriptor(WebIssueService, [], false),
    [ITroubleshootIssueService.toString()]: new SyncDescriptor(TroubleshootIssueService, [], false)
  }
}
