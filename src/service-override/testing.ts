import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { TestProfileService } from 'vs/workbench/contrib/testing/common/testProfileService'
import { ITestProfileService } from 'vs/workbench/contrib/testing/common/testProfileService.service'
import { TestResultService } from 'vs/workbench/contrib/testing/common/testResultService'
import { ITestResultService } from 'vs/workbench/contrib/testing/common/testResultService.service'
import { TestResultStorage } from 'vs/workbench/contrib/testing/common/testResultStorage'
import { ITestResultStorage } from 'vs/workbench/contrib/testing/common/testResultStorage.service'
import { ITestService } from 'vs/workbench/contrib/testing/common/testService.service'
import { TestService } from 'vs/workbench/contrib/testing/common/testServiceImpl'
import { ITestingDecorationsService } from 'vs/workbench/contrib/testing/common/testingDecorations.service'
import { TestingDecorationService } from 'vs/workbench/contrib/testing/browser/testingDecorations'
import { ITestingPeekOpener } from 'vs/workbench/contrib/testing/common/testingPeekOpener.service'
import { TestingContinuousRunService } from 'vs/workbench/contrib/testing/common/testingContinuousRunService'
import { ITestingContinuousRunService } from 'vs/workbench/contrib/testing/common/testingContinuousRunService.service'
import { TestExplorerFilterState } from 'vs/workbench/contrib/testing/common/testExplorerFilterState'
import { ITestExplorerFilterState } from 'vs/workbench/contrib/testing/common/testExplorerFilterState.service'
import { TestingPeekOpener } from 'vs/workbench/contrib/testing/browser/testingOutputPeek'
import { TestCoverageService } from 'vs/workbench/contrib/testing/common/testCoverageService'
import { ITestCoverageService } from 'vs/workbench/contrib/testing/common/testCoverageService.service'
import getTerminalServiceOverride from './terminal'
import 'vs/workbench/contrib/testing/browser/testing.contribution'
import 'vs/workbench/contrib/testing/browser/testingConfigurationUi'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    ...getTerminalServiceOverride(),
    [ITestService.toString()]: new SyncDescriptor(TestService, [], true),
    [ITestResultStorage.toString()]: new SyncDescriptor(TestResultStorage, [], true),
    [ITestProfileService.toString()]: new SyncDescriptor(TestProfileService, [], true),
    [ITestCoverageService.toString()]: new SyncDescriptor(TestCoverageService, [], true),
    [ITestingContinuousRunService.toString()]: new SyncDescriptor(
      TestingContinuousRunService,
      [],
      true
    ),
    [ITestResultService.toString()]: new SyncDescriptor(TestResultService, [], true),
    [ITestExplorerFilterState.toString()]: new SyncDescriptor(TestExplorerFilterState, [], true),
    [ITestingPeekOpener.toString()]: new SyncDescriptor(TestingPeekOpener, [], true),
    [ITestingDecorationsService.toString()]: new SyncDescriptor(TestingDecorationService, [], true)
  }
}
