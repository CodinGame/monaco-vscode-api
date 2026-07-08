import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IOnboardingScenarioService } from 'vs/workbench/contrib/onboarding/common/onboardingScenarioService.service'
import { OnboardingScenarioService } from 'vs/workbench/contrib/onboarding/browser/onboardingService'
import { IOnboardingService } from 'vs/workbench/contrib/welcomeOnboarding/common/onboardingService.service'
import { OnboardingVariationA } from 'vs/workbench/contrib/welcomeOnboarding/browser/onboardingVariationA'
import 'vs/workbench/contrib/onboarding/browser/onboarding.contribution'
import 'vs/workbench/contrib/welcomeViews/common/viewsWelcome.contribution'
import 'vs/workbench/contrib/welcomeViews/common/newFile.contribution'
import 'vs/workbench/contrib/welcomeOnboarding/browser/welcomeOnboarding.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IOnboardingService.toString()]: new SyncDescriptor(OnboardingVariationA, [], true),
    [IOnboardingScenarioService.toString()]: new SyncDescriptor(OnboardingScenarioService, [], true)
  }
}
