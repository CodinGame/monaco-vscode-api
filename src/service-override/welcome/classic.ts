import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IOnboardingService } from 'vs/workbench/contrib/welcomeOnboarding/common/onboardingService.service'
import { OnboardingVariationA } from 'vs/workbench/contrib/welcomeOnboarding/browser/onboardingVariationA'
import getCommonServiceOverride from './common'
import 'vs/workbench/contrib/welcomeOnboarding/browser/welcomeOnboarding.contribution'
import 'vs/workbench/contrib/welcomeAgentSessions/browser/agentSessionsWelcome.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    ...getCommonServiceOverride(),
    [IOnboardingService.toString()]: new SyncDescriptor(OnboardingVariationA, [], true)
  }
}
