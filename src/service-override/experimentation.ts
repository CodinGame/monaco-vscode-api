import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { CoreExperimentationService } from 'vs/workbench/services/coreExperimentation/common/coreExperimentationService'
import { ICoreExperimentationService } from 'vs/workbench/services/coreExperimentation/common/coreExperimentationService.service'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [ICoreExperimentationService.toString()]: new SyncDescriptor(
      CoreExperimentationService,
      [],
      false
    )
  }
}
