import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ISearchService } from 'vs/workbench/services/search/common/search.service'
import { SearchService } from 'vs/workbench/services/search/common/searchService'
import { SearchViewModelWorkbenchService } from 'vs/workbench/contrib/search/browser/searchModel'
import { ISearchViewModelWorkbenchService } from 'vs/workbench/contrib/search/browser/searchModel.service'
import { SearchHistoryService } from 'vs/workbench/contrib/search/common/searchHistoryService'
import { ISearchHistoryService } from 'vs/workbench/contrib/search/common/searchHistoryService.service'
import { IReplaceService } from 'vs/workbench/contrib/search/browser/replace.service'
import { ReplaceService } from 'vs/workbench/contrib/search/browser/replaceService'
import { RemoteSearchService } from 'vs/workbench/services/search/browser/searchService'
import 'vs/workbench/contrib/search/browser/search.contribution'
import 'vs/workbench/contrib/searchEditor/browser/searchEditor.contribution'

interface SearchServiceOverrideProps {
  /**
   * Is an `HTMLFileSystemProvider` is used as only provider for the `file` scheme directly (without overlay)
   * Enable this option to enable searching local filesystem
   */
  useHtmlFileSystemProvider?: boolean
}

export default function getServiceOverride ({ useHtmlFileSystemProvider = false }: SearchServiceOverrideProps = {}): IEditorOverrideServices {
  return {
    [ISearchService.toString()]: useHtmlFileSystemProvider ? new SyncDescriptor(RemoteSearchService, [], true) : new SyncDescriptor(SearchService, [], true),
    [ISearchViewModelWorkbenchService.toString()]: new SyncDescriptor(SearchViewModelWorkbenchService, [], true),
    [ISearchHistoryService.toString()]: new SyncDescriptor(SearchHistoryService, [], true),
    [IReplaceService.toString()]: new SyncDescriptor(ReplaceService, [], true)
  }
}
