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
    [IUserActivityService.toString()]: new SyncDescriptor(UserActivityService, [], true)
  }
}
