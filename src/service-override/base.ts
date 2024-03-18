import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IRequestService } from 'vs/platform/request/common/request'
import { IDecorationsService } from 'vs/workbench/services/decorations/common/decorations'
import { IJSONEditingService } from 'vs/workbench/services/configuration/common/jsonEditing'
import { ITreeViewsDnDService } from 'vs/editor/common/services/treeViewsDndService'
import { ITreeViewsService } from 'vs/workbench/services/views/browser/treeViewsService'
import { TreeViewsDnDService } from 'vs/editor/common/services/treeViewsDnd'
import { IURLService } from 'vs/platform/url/common/url'
import { JSONEditingService } from 'vs/workbench/services/configuration/common/jsonEditingService'
import { DecorationsService } from 'vs/workbench/services/decorations/browser/decorationsService'
import { BrowserRequestService } from 'vs/workbench/services/request/browser/requestService'
import { BrowserURLService } from 'vs/workbench/services/url/browser/urlService'
import { TreeviewsService } from 'vs/workbench/services/views/common/treeViewsService'
import { CanonicalUriService } from 'vs/workbench/services/workspaces/common/canonicalUriService'
import { ICanonicalUriService } from 'vs/platform/workspace/common/canonicalUri'
import { IUserActivityService, UserActivityService } from 'vs/workbench/services/userActivity/common/userActivityService'
import { IDownloadService } from 'vs/platform/download/common/download'
import { DownloadService } from 'vs/platform/download/common/downloadService'
import { IPathService, AbstractPathService } from 'vs/workbench/services/path/common/pathService'
import { IWorkingCopyFileService, WorkingCopyFileService } from 'vs/workbench/services/workingCopy/common/workingCopyFileService'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService'
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService'
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace'
import { guessLocalUserHome } from 'vs/workbench/services/path/browser/pathService'
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
    [ITreeViewsService.toString()]: new SyncDescriptor(TreeviewsService, [], true),
    [IURLService.toString()]: new SyncDescriptor(BrowserURLService, [], true),
    [ICanonicalUriService.toString()]: new SyncDescriptor(CanonicalUriService, [], false),
    [IUserActivityService.toString()]: new SyncDescriptor(UserActivityService, [], true),
    [IWorkingCopyFileService.toString()]: new SyncDescriptor(WorkingCopyFileService, [], false),
    [IPathService.toString()]: new SyncDescriptor(BrowserPathServiceOverride, [], true)
  }
}
