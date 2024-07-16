import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ITextModelService } from 'vs/editor/common/services/resolverService'
import { TextModelResolverService } from 'vs/workbench/services/textmodelResolver/common/textModelResolverService'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [ITextModelService.toString()]: new SyncDescriptor(TextModelResolverService, [], true)
  }
}
