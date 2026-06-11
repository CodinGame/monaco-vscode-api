import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import {
  IIssueFormService,
  IWorkbenchIssueService
} from 'vs/workbench/contrib/issue/common/issue.service'
import { TroubleshootIssueService } from 'vs/workbench/contrib/issue/browser/issueTroubleshoot'
import { ITroubleshootIssueService } from 'vs/workbench/contrib/issue/browser/issueTroubleshoot.service'
import { BrowserIssueService } from 'vs/workbench/contrib/issue/browser/issueService'
import { IssueFormService } from 'vs/workbench/contrib/issue/browser/issueFormService'
import { IScreenshotService } from 'vs/workbench/contrib/issue/browser/screenshotService.service'
import { BrowserScreenshotService } from 'vs/workbench/contrib/issue/browser/screenshotService'
import { IRecordingService } from 'vs/workbench/contrib/issue/browser/recordingService.service'
import { BrowserRecordingService } from 'vs/workbench/contrib/issue/browser/recordingService'
import { IGitHubUploadService } from 'vs/workbench/contrib/issue/browser/githubUploadService.service'
import { BrowserGitHubUploadService } from 'vs/workbench/contrib/issue/browser/githubUploadService'
import 'vs/workbench/contrib/issue/browser/issue.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IWorkbenchIssueService.toString()]: new SyncDescriptor(BrowserIssueService, [], false),
    [ITroubleshootIssueService.toString()]: new SyncDescriptor(TroubleshootIssueService, [], false),
    [IIssueFormService.toString()]: new SyncDescriptor(IssueFormService, [], false),
    [IScreenshotService.toString()]: new SyncDescriptor(BrowserScreenshotService, [], false),
    [IRecordingService.toString()]: new SyncDescriptor(BrowserRecordingService, [], false),
    [IGitHubUploadService.toString()]: new SyncDescriptor(BrowserGitHubUploadService, [], false)
  }
}
