import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { BrowserLifecycleService } from 'vs/workbench/services/lifecycle/browser/lifecycleService'
import { ILifecycleService } from 'vs/workbench/services/lifecycle/common/lifecycle.service'
import { TimerService } from 'vs/workbench/services/timer/browser/timerService'
import { ITimerService } from 'vs/workbench/services/timer/browser/timerService.service'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [ILifecycleService.toString()]: new SyncDescriptor(BrowserLifecycleService),
    [ITimerService.toString()]: new SyncDescriptor(TimerService)
  }
}
