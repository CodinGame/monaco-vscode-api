import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ITestProfileService, TestProfileService } from 'vs/workbench/contrib/testing/common/testProfileService'
import { ITestResultService, TestResultService } from 'vs/workbench/contrib/testing/common/testResultService'
import { ITestResultStorage, TestResultStorage } from 'vs/workbench/contrib/testing/common/testResultStorage'
import { ITestService } from 'vs/workbench/contrib/testing/common/testService'
import { TestService } from 'vs/workbench/contrib/testing/common/testServiceImpl'
import { ITestingDecorationsService } from 'vs/workbench/contrib/testing/common/testingDecorations'
import { TestingDecorationService } from 'vs/workbench/contrib/testing/browser/testingDecorations'
import { ITestingPeekOpener } from 'vs/workbench/contrib/testing/common/testingPeekOpener'
import { ITestingContinuousRunService, TestingContinuousRunService } from 'vs/workbench/contrib/testing/common/testingContinuousRunService'
import { ITestExplorerFilterState, TestExplorerFilterState } from 'vs/workbench/contrib/testing/common/testExplorerFilterState'
import { TestingPeekOpener } from 'vs/workbench/contrib/testing/browser/testingOutputPeek'
import { ITestCoverageService, TestCoverageService } from 'vs/workbench/contrib/testing/common/testCoverageService'
import 'vs/workbench/contrib/testing/browser/testing.contribution'
import 'vs/workbench/contrib/testing/browser/testingConfigurationUi'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [ITestService.toString()]: new SyncDescriptor(TestService, [], true),
    [ITestResultStorage.toString()]: new SyncDescriptor(TestResultStorage, [], true),
    [ITestProfileService.toString()]: new SyncDescriptor(TestProfileService, [], true),
    [ITestCoverageService.toString()]: new SyncDescriptor(TestCoverageService, [], true),
    [ITestingContinuousRunService.toString()]: new SyncDescriptor(TestingContinuousRunService, [], true),
    [ITestResultService.toString()]: new SyncDescriptor(TestResultService, [], true),
    [ITestExplorerFilterState.toString()]: new SyncDescriptor(TestExplorerFilterState, [], true),
    [ITestingPeekOpener.toString()]: new SyncDescriptor(TestingPeekOpener, [], true),
    [ITestingDecorationsService.toString()]: new SyncDescriptor(TestingDecorationService, [], true)
  }
}
