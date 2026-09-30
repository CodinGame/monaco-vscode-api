import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SearchViewModelWorkbenchService } from 'vs/workbench/contrib/search/browser/searchTreeModel/searchModel'
import { ISearchViewModelWorkbenchService } from 'vs/workbench/contrib/search/browser/searchTreeModel/searchViewModelWorkbenchService.service'
import getCommonServiceOverride from './common'
import 'vs/workbench/contrib/search/browser/search.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride(),
    [ISearchViewModelWorkbenchService.toString()]: new SyncDescriptor(
      SearchViewModelWorkbenchService,
      [],
      true
    )
  }
}
