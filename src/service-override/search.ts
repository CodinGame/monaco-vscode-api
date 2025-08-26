import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ISearchService } from 'vs/workbench/services/search/common/search.service'
import { SearchService } from 'vs/workbench/services/search/common/searchService'
import { SearchViewModelWorkbenchService } from 'vs/workbench/contrib/search/browser/searchTreeModel/searchModel'
import { ISearchViewModelWorkbenchService } from 'vs/workbench/contrib/search/browser/searchTreeModel/searchViewModelWorkbenchService.service'
import { SearchHistoryService } from 'vs/workbench/contrib/search/common/searchHistoryService'
import { ISearchHistoryService } from 'vs/workbench/contrib/search/common/searchHistoryService.service'
import { IReplaceService } from 'vs/workbench/contrib/search/browser/replace.service'
import { ReplaceService } from 'vs/workbench/contrib/search/browser/replaceService'
import { LocalFileSearchWorkerClient } from 'vs/workbench/services/search/browser/searchService'
import 'vs/workbench/contrib/search/browser/search.contribution'
import 'vs/workbench/contrib/searchEditor/browser/searchEditor.contribution'
import { IModelService } from 'vs/editor/common/services/model.service'
import { IEditorService } from 'vs/workbench/services/editor/common/editorService.service'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry.service'
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions.service'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { IUriIdentityService } from 'vs/platform/uriIdentity/common/uriIdentity.service'
import { IFileService } from 'vs/platform/files/common/files.service'
import { ILogService } from 'vs/platform/log/common/log.service'
import { SearchProviderType } from 'vs/workbench/services/search/common/search'
import { Schemas } from 'vs/base/common/network'
import type { IFileSystemProvider } from 'vs/platform/files/common/files'
import { HTMLFileSystemProvider } from 'vs/platform/files/browser/htmlFileSystemProvider'
import { WorkspaceSearchProvider } from './tools/search-providers/workspace-search-provider'
import { IWorkspaceContextService } from '../services'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService.service'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration.service'

function isHTMLFileSystemProvider(
  provider: IFileSystemProvider
): provider is HTMLFileSystemProvider {
  return (provider as HTMLFileSystemProvider).directories != null
}

// Custom search service that handles different file system types and remote connections
class CustomSearchService extends SearchService {
  constructor(
    @IModelService modelService: IModelService,
    @IEditorService editorService: IEditorService,
    @ITelemetryService telemetryService: ITelemetryService,
    @ILogService logService: ILogService,
    @IExtensionService extensionService: IExtensionService,
    @IFileService fileService: IFileService,
    @IInstantiationService private readonly instantiationService: IInstantiationService,
    @IUriIdentityService uriIdentityService: IUriIdentityService,
    @IWorkspaceContextService workspaceContextService: IWorkspaceContextService,
    @IRemoteAgentService remoteAgentService: IRemoteAgentService,
    @IConfigurationService configurationService: IConfigurationService
  ) {
    super(
      modelService,
      editorService,
      telemetryService,
      logService,
      extensionService,
      fileService,
      uriIdentityService
    )

    const hasRemoteConnection = remoteAgentService.getConnection() !== null
    if (hasRemoteConnection) {
      // Don't register custom providers to avoid conflicts
      return
    }

    // For local scenarios, choose the appropriate search provider
    if (isHTMLFileSystemProvider(fileService.getProvider(Schemas.file)!)) {
      const searchProvider = this.instantiationService.createInstance(LocalFileSearchWorkerClient)
      this.registerSearchResultProvider(Schemas.file, SearchProviderType.file, searchProvider)
      this.registerSearchResultProvider(Schemas.file, SearchProviderType.text, searchProvider)
    } else {
      const workspaceSearchProvider = new WorkspaceSearchProvider(
        fileService,
        logService,
        workspaceContextService,
        undefined,
        configurationService
      )

      this.registerSearchResultProvider(
        Schemas.file,
        SearchProviderType.file,
        workspaceSearchProvider
      )
      this.registerSearchResultProvider(
        Schemas.file,
        SearchProviderType.text,
        workspaceSearchProvider
      )
    }
  }
}

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [ISearchService.toString()]: new SyncDescriptor(CustomSearchService, [], true),
    [ISearchViewModelWorkbenchService.toString()]: new SyncDescriptor(
      SearchViewModelWorkbenchService,
      [],
      true
    ),
    [ISearchHistoryService.toString()]: new SyncDescriptor(SearchHistoryService, [], true),
    [IReplaceService.toString()]: new SyncDescriptor(ReplaceService, [], true)
  }
}
