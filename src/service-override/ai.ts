import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { AiRelatedInformationService } from 'vs/workbench/services/aiRelatedInformation/common/aiRelatedInformationService'
import { IAiRelatedInformationService } from 'vs/workbench/services/aiRelatedInformation/common/aiRelatedInformation'
import { IAiEmbeddingVectorService } from 'vs/workbench/services/aiEmbeddingVector/common/aiEmbeddingVectorService'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IAiRelatedInformationService.toString()]: new SyncDescriptor(AiRelatedInformationService, [], true),
    [IAiEmbeddingVectorService.toString()]: new SyncDescriptor(AiRelatedInformationService, [], true)
  }
}
