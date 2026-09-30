import type { PolicyName } from 'vs/base/common/policy'
import { PolicyCategory } from 'vs/base/common/policy'
import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import {
  AbstractPolicyService,
  PolicyValueSource,
  type PolicyValue
} from 'vs/platform/policy/common/policy'
import { IPolicyService } from 'vs/platform/policy/common/policy.service'

class PolicyService extends AbstractPolicyService {
  constructor(defaultPolicies: Map<PolicyName, PolicyValue>) {
    super()
    this.policies = new Map(defaultPolicies)

    this._onDidChange.fire([])
  }

  public updatePolicy(
    name: PolicyName,
    value: PolicyValue | undefined,
    source?: PolicyValueSource
  ): void {
    super.updatePolicyValue(name, value, source)

    this._onDidChange.fire([name])
  }

  protected override async _updatePolicyDefinitions(): Promise<void> {}
}

export default function getServiceOverride(
  defaultPolicies: Map<PolicyName, PolicyValue>
): IEditorOverrideServices {
  return {
    [IPolicyService.toString()]: new SyncDescriptor(PolicyService, [defaultPolicies], true)
  }
}

export type { PolicyCategory, PolicyName, PolicyService, PolicyValue }
