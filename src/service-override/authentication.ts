import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IAuthenticationService } from 'vs/workbench/services/authentication/common/authentication'
import { AuthenticationService } from 'vs/workbench/services/authentication/browser/authenticationService'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IAuthenticationService.toString()]: new SyncDescriptor(AuthenticationService, [], true)
  }
}
