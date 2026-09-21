import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import {
  NullTestProfileService,
  NullTestResultService,
  NullTestService
} from 'vs/workbench/contrib/testing/common/nullTestingService'
import { ITestProfileService } from 'vs/workbench/contrib/testing/common/testProfileService.service'
import { ITestResultService } from 'vs/workbench/contrib/testing/common/testResultService.service'
import { ITestService } from 'vs/workbench/contrib/testing/common/testService.service'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [ITestService.toString()]: new SyncDescriptor(NullTestService, [], true),
    [ITestProfileService.toString()]: new SyncDescriptor(NullTestProfileService, [], true),
    [ITestResultService.toString()]: new SyncDescriptor(NullTestResultService, [], true)
  }
}
