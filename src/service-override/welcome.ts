import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import 'vs/workbench/contrib/welcomeViews/common/viewsWelcome.contribution'
import 'vs/workbench/contrib/welcomeViews/common/newFile.contribution'
import { IGettingStartedExperimentService } from 'vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedExpService.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { GettingStartedExperimentService } from 'vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedExpService'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IGettingStartedExperimentService.toString()]: new SyncDescriptor(
      GettingStartedExperimentService,
      [],
      true
    )
  }
}
