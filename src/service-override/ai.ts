import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IAiEmbeddingVectorService } from 'vs/workbench/services/aiEmbeddingVector/common/aiEmbeddingVectorService.service'
import { IAiRelatedInformationService } from 'vs/workbench/services/aiRelatedInformation/common/aiRelatedInformation.service'
import { AiRelatedInformationService } from 'vs/workbench/services/aiRelatedInformation/common/aiRelatedInformationService'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IAiRelatedInformationService.toString()]: new SyncDescriptor(
      AiRelatedInformationService,
      [],
      true
    ),
    [IAiEmbeddingVectorService.toString()]: new SyncDescriptor(
      AiRelatedInformationService,
      [],
      true
    )
  }
}
