import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IOnboardingService } from 'vs/workbench/contrib/welcomeOnboarding/common/onboardingService.service'
import { OnboardingVariationA } from 'vs/workbench/contrib/welcomeOnboarding/browser/onboardingVariationA'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import 'vs/workbench/contrib/welcomeViews/common/viewsWelcome.contribution'
import 'vs/workbench/contrib/welcomeViews/common/newFile.contribution'
import 'vs/workbench/contrib/welcomeOnboarding/browser/welcomeOnboarding.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IOnboardingService.toString()]: new SyncDescriptor(OnboardingVariationA, [], true)
  }
}
