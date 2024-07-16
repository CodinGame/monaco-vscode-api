import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IRequestService } from 'vs/platform/request/common/request.service'
import { IDecorationsService } from 'vs/workbench/services/decorations/common/decorations.service'
import { IJSONEditingService } from 'vs/workbench/services/configuration/common/jsonEditing.service'
import { ITreeViewsDnDService } from 'vs/editor/common/services/treeViewsDndService'
import { TreeViewsDnDService } from 'vs/editor/common/services/treeViewsDnd'
import { IURLService } from 'vs/platform/url/common/url.service'
import { JSONEditingService } from 'vs/workbench/services/configuration/common/jsonEditingService'
import { DecorationsService } from 'vs/workbench/services/decorations/browser/decorationsService'
import { BrowserRequestService } from 'vs/workbench/services/request/browser/requestService'
import { BrowserURLService } from 'vs/workbench/services/url/browser/urlService'
import { CanonicalUriService } from 'vs/workbench/services/workspaces/common/canonicalUriService'
import { ICanonicalUriService } from 'vs/platform/workspace/common/canonicalUri.service'
import { IUserActivityService } from 'vs/workbench/services/userActivity/common/userActivityService.service'
import { IDownloadService } from 'vs/platform/download/common/download.service'
import { DownloadService } from 'vs/platform/download/common/downloadService'
import { IPathService } from 'vs/workbench/services/path/common/pathService.service'
import { IWorkingCopyFileService } from 'vs/workbench/services/workingCopy/common/workingCopyFileService.service'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService.service'
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService.service'
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace.service'
import { guessLocalUserHome } from 'vs/workbench/services/path/browser/pathService'
import { AbstractPathService } from 'vs/workbench/services/path/common/pathService'
import { UserActivityService } from 'vs/workbench/services/userActivity/common/userActivityService'
import { WorkingCopyFileService } from 'vs/workbench/services/workingCopy/common/workingCopyFileService'
import { ITrustedDomainService } from 'vs/workbench/contrib/url/browser/trustedDomainService.service'
import { TrustedDomainService } from 'vs/workbench/contrib/url/browser/trustedDomainService'
import { LabelService } from 'vs/workbench/services/label/common/labelService'
import { ILabelService } from 'vs/platform/label/common/label.service'
import { getEnvironmentOverride } from '../workbench'

class BrowserPathServiceOverride extends AbstractPathService {
  constructor (
    @IRemoteAgentService remoteAgentService: IRemoteAgentService,
    @IWorkbenchEnvironmentService environmentService: IWorkbenchEnvironmentService,
    @IWorkspaceContextService contextService: IWorkspaceContextService
  ) {
    super(
      getEnvironmentOverride().userHome ?? guessLocalUserHome(environmentService, contextService),
      remoteAgentService,
      environmentService,
      contextService
    )
  }
}

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IRequestService.toString()]: new SyncDescriptor(BrowserRequestService, [], true),
    [IDownloadService.toString()]: new SyncDescriptor(DownloadService, [], true),
    [IDecorationsService.toString()]: new SyncDescriptor(DecorationsService, [], true),
    [IJSONEditingService.toString()]: new SyncDescriptor(JSONEditingService, [], true),
    [ITreeViewsDnDService.toString()]: new SyncDescriptor(TreeViewsDnDService, [], true),
    [IURLService.toString()]: new SyncDescriptor(BrowserURLService, [], true),
    [ICanonicalUriService.toString()]: new SyncDescriptor(CanonicalUriService, [], false),
    [IUserActivityService.toString()]: new SyncDescriptor(UserActivityService, [], true),
    [IWorkingCopyFileService.toString()]: new SyncDescriptor(WorkingCopyFileService, [], false),
    [IPathService.toString()]: new SyncDescriptor(BrowserPathServiceOverride, [], true),
    [ITrustedDomainService.toString()]: new SyncDescriptor(TrustedDomainService, [], true),
    [ILabelService.toString()]: new SyncDescriptor(LabelService, undefined, true)
  }
}
