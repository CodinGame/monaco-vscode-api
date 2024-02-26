import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IMultiDiffSourceResolverService, MultiDiffSourceResolverService } from 'vs/workbench/contrib/multiDiffEditor/browser/multiDiffSourceResolverService'
import 'vs/workbench/contrib/multiDiffEditor/browser/multiDiffEditor.contribution'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IMultiDiffSourceResolverService.toString()]: new SyncDescriptor(MultiDiffSourceResolverService, [], true)
  }
}
