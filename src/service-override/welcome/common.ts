import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IOnboardingScenarioService } from 'vs/workbench/contrib/onboarding/common/onboardingScenarioService.service'
import { OnboardingScenarioService } from 'vs/workbench/contrib/onboarding/browser/onboardingService'
import { OnboardingTryoutService } from 'vs/workbench/contrib/onboarding/browser/onboardingTryoutService'
import { IOnboardingTryoutService } from 'vs/workbench/contrib/onboarding/common/onboardingTryout.service'
import 'vs/workbench/contrib/codeEditor/browser/diffEditorTryout.contribution'
import 'vs/workbench/contrib/onboarding/browser/onboardingTryout.contribution'
import 'vs/workbench/contrib/onboarding/browser/onboarding.contribution'
import 'vs/workbench/contrib/welcomeViews/common/viewsWelcome.contribution'
import 'vs/workbench/contrib/welcomeViews/common/newFile.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IOnboardingScenarioService.toString()]: new SyncDescriptor(
      OnboardingScenarioService,
      [],
      true
    ),
    [IOnboardingTryoutService.toString()]: new SyncDescriptor(OnboardingTryoutService, [], true)
  }
}
