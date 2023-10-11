import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ISearchService } from 'vs/workbench/services/search/common/search'
import { SearchService } from 'vs/workbench/services/search/common/searchService'
import { ISearchViewModelWorkbenchService, SearchViewModelWorkbenchService } from 'vs/workbench/contrib/search/browser/searchModel'
import { ISearchHistoryService, SearchHistoryService } from 'vs/workbench/contrib/search/common/searchHistoryService'
import { IReplaceService } from 'vs/workbench/contrib/search/browser/replace'
import { ReplaceService } from 'vs/workbench/contrib/search/browser/replaceService'
import 'vs/workbench/contrib/search/browser/search.contribution'
import 'vs/workbench/contrib/searchEditor/browser/searchEditor.contribution'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [ISearchService.toString()]: new SyncDescriptor(SearchService, [], true),
    [ISearchViewModelWorkbenchService.toString()]: new SyncDescriptor(SearchViewModelWorkbenchService, [], true),
    [ISearchHistoryService.toString()]: new SyncDescriptor(SearchHistoryService, [], true),
    [IReplaceService.toString()]: new SyncDescriptor(ReplaceService, [], true)
  }
}
