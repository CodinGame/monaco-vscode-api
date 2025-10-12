import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ILogService } from 'vs/platform/log/common/log.service'
import { IStorageService } from 'vs/platform/storage/common/storage.service'
import { BrowserLifecycleService } from 'vs/workbench/services/lifecycle/browser/lifecycleService'
import { StartupKind } from 'vs/workbench/services/lifecycle/common/lifecycle'
import { ILifecycleService } from 'vs/workbench/services/lifecycle/common/lifecycle.service'
import { TimerService } from 'vs/workbench/services/timer/browser/timerService'
import { ITimerService } from 'vs/workbench/services/timer/browser/timerService.service'

interface StartupKindResolver {
  (resolveDefault: () => StartupKind | undefined): StartupKind | undefined
}
export interface LifecycleServiceParams {
  /**
   * Allows to force the startup kind
   */
  resolveStartupKind?: StartupKindResolver
  shouldAttemptTaskReconnection?: (startupKind: StartupKind) => boolean | undefined
}

const DEFAULT_RESOLVE_STARTUP_KIND: StartupKindResolver = (resolveDefault) => resolveDefault()

export default function getServiceOverride(
  params: LifecycleServiceParams = {}
): IEditorOverrideServices {
  class BrowserLifecycleServiceOverride extends BrowserLifecycleService {
    constructor(
      @ILogService logService: ILogService,
      @IStorageService storageService: IStorageService
    ) {
      super(logService, storageService)
    }

    protected override doResolveStartupKind(): StartupKind | undefined {
      return (params.resolveStartupKind ?? DEFAULT_RESOLVE_STARTUP_KIND)(() =>
        super.doResolveStartupKind()
      )
    }

    override get shouldAttemptTaskReconnection(): boolean {
      return (
        params.shouldAttemptTaskReconnection?.(this.startupKind) ??
        super.shouldAttemptTaskReconnection
      )
    }
  }

  return {
    [ILifecycleService.toString()]: new SyncDescriptor(BrowserLifecycleServiceOverride),
    [ITimerService.toString()]: new SyncDescriptor(TimerService)
  }
}

export { StartupKind }
