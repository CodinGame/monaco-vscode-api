import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import {
  IAuthenticationExtensionsService,
  IAuthenticationService
} from 'vs/workbench/services/authentication/common/authentication.service'
import { AuthenticationService } from 'vs/workbench/services/authentication/browser/authenticationService'
import { AuthenticationAccessService } from 'vs/workbench/services/authentication/browser/authenticationAccessService'
import { AuthenticationUsageService } from 'vs/workbench/services/authentication/browser/authenticationUsageService'
import { AuthenticationExtensionsService } from 'vs/workbench/services/authentication/browser/authenticationExtensionsService'
import { IAuthenticationAccessService } from 'vs/workbench/services/authentication/browser/authenticationAccessService.service'
import { IAuthenticationUsageService } from 'vs/workbench/services/authentication/browser/authenticationUsageService.service'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IAuthenticationService.toString()]: new SyncDescriptor(AuthenticationService, [], true),
    [IAuthenticationAccessService.toString()]: new SyncDescriptor(
      AuthenticationAccessService,
      [],
      true
    ),
    [IAuthenticationExtensionsService.toString()]: new SyncDescriptor(
      AuthenticationExtensionsService,
      [],
      true
    ),
    [IAuthenticationUsageService.toString()]: new SyncDescriptor(
      AuthenticationUsageService,
      [],
      true
    )
  }
}
