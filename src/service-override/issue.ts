import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IWorkbenchIssueService } from 'vs/workbench/contrib/issue/common/issue.service'
import { TroubleshootIssueService } from 'vs/workbench/contrib/issue/browser/issueTroubleshoot'
import { ITroubleshootIssueService } from 'vs/workbench/contrib/issue/browser/issueTroubleshoot.service'
import { BrowserIssueService } from 'vs/workbench/contrib/issue/browser/issueService'
import { IIssueMainService } from 'vs/platform/issue/common/issue.service'
import { IssueFormService } from 'vs/workbench/contrib/issue/browser/issueFormService'
import 'vs/workbench/contrib/issue/browser/issue.contribution'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IWorkbenchIssueService.toString()]: new SyncDescriptor(BrowserIssueService, [], false),
    [ITroubleshootIssueService.toString()]: new SyncDescriptor(TroubleshootIssueService, [], false),
    [IIssueMainService.toString()]: new SyncDescriptor(IssueFormService, [], false)
  }
}
