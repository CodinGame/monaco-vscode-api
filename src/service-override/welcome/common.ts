import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IOnboardingScenarioService } from 'vs/workbench/contrib/onboarding/common/onboardingScenarioService.service'
import { OnboardingScenarioService } from 'vs/workbench/contrib/onboarding/browser/onboardingService'
import 'vs/workbench/contrib/onboarding/browser/onboarding.contribution'
import 'vs/workbench/contrib/welcomeViews/common/viewsWelcome.contribution'
import 'vs/workbench/contrib/welcomeViews/common/newFile.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IOnboardingScenarioService.toString()]: new SyncDescriptor(OnboardingScenarioService, [], true)
  }
}
