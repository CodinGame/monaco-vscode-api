import type { PolicyName } from 'vs/base/common/policy'
import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { AbstractPolicyService, type PolicyValue } from 'vs/platform/policy/common/policy'
import { IPolicyService } from 'vs/platform/policy/common/policy.service'

class PolicyService extends AbstractPolicyService {
  constructor(policies: Map<PolicyName, PolicyValue>) {
    super()
    this.policies = policies
  }

  protected override async _updatePolicyDefinitions(): Promise<void> {}
}

export default function getServiceOverride(
  policies: Map<PolicyName, PolicyValue>
): IEditorOverrideServices {
  return {
    [IPolicyService.toString()]: new SyncDescriptor(PolicyService, [policies], true)
  }
}

export type { PolicyName, PolicyValue }
