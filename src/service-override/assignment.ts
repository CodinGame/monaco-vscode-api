import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration.service'
import { IEnvironmentService } from 'vs/platform/environment/common/environment.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IWorkbenchAssignmentService } from 'vs/workbench/services/assignment/common/assignmentService.service'

export interface Treatments {
  'extensions.gallery.useResourceApi'?: 'unpkg' | 'marketplace'
  useLatestPrereleaseAndStableVersionFlag?: boolean
  chatAgentMaxRequestsFree?: number
  chatAgentMaxRequestsPro?: number
  'chat.defaultModeFree'?: string
  'chat.defaultMode'?: string
  'chat.defaultLanguageModelFree'?: string
  'chat.defaultLanguageModel'?: string
  [key: `gettingStarted.overrideCategory.${string}.${string}.when`]: string
  [key: string]: unknown
}

class AssignmentService implements IWorkbenchAssignmentService {
  _serviceBrand: undefined

  private experimentsEnabled: boolean
  constructor(
    private experiments: string[],
    private treatments: Record<string, unknown>,
    @IConfigurationService private configurationService: IConfigurationService,
    @IEnvironmentService environmentService: IEnvironmentService
  ) {
    this.experimentsEnabled = !environmentService.disableExperiments
  }

  async getCurrentExperiments(): Promise<string[] | undefined> {
    if (!this.experimentsEnabled) {
      return undefined
    }
    return this.experiments
  }
  async getTreatment<T extends string | number | boolean>(name: string): Promise<T | undefined> {
    const override = this.configurationService.getValue<T>(`experiments.override.${name}`)
    if (override !== undefined) {
      return override
    }

    if (!this.experimentsEnabled) {
      return undefined
    }

    return this.treatments[name] as T | undefined
  }
}

export default function getServiceOverride({
  experiments = [],
  treatments = {}
}: {
  experiments?: string[]
  treatments?: Treatments
} = {}): IEditorOverrideServices {
  return {
    [IWorkbenchAssignmentService.toString()]: new SyncDescriptor(
      AssignmentService,
      [experiments, treatments],
      true
    )
  }
}
