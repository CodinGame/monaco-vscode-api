import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { BrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService'
import { IEnvironmentService } from 'vs/platform/environment/common/environment.service'
import { IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService.service'
import { IProductService } from 'vs/platform/product/common/productService.service'
import type { IWorkbenchConstructionOptions } from 'vs/workbench/browser/web.api'
import { getWorkbenchConstructionOptions, getWorkspaceIdentifier, logsPath } from '../workbench'
import type { URI } from 'vs/base/common/uri'

export interface WorkbenchEnvironmentServiceOverrides {
  windowLogsPath?: URI
  logFile?: URI
  userRoamingDataHome?: URI
  argvResource?: URI
  cacheHome?: URI
  workspaceStorageHome?: URI
  localHistoryHome?: URI
  stateResource?: URI
}

class InjectedBrowserWorkbenchEnvironmentService
  extends BrowserWorkbenchEnvironmentService
  implements IBrowserWorkbenchEnvironmentService
{
  constructor(
    workspaceId: string = getWorkspaceIdentifier().id,
    private overrides: WorkbenchEnvironmentServiceOverrides = {},
    @IProductService productService: IProductService
  ) {
    super(workspaceId, logsPath, getWorkbenchConstructionOptions(), productService)
  }

  override get windowLogsPath() {
    return this.overrides.windowLogsPath ?? super.windowLogsPath
  }
  override get logFile() {
    return this.overrides.logFile ?? super.logFile
  }
  override get userRoamingDataHome() {
    return this.overrides.userRoamingDataHome ?? super.userRoamingDataHome
  }
  override get argvResource() {
    return this.overrides.argvResource ?? super.argvResource
  }
  override get cacheHome() {
    return this.overrides.cacheHome ?? super.cacheHome
  }
  override get workspaceStorageHome() {
    return this.overrides.workspaceStorageHome ?? super.workspaceStorageHome
  }
  override get localHistoryHome() {
    return this.overrides.localHistoryHome ?? super.localHistoryHome
  }
  override get stateResource() {
    return this.overrides.stateResource ?? super.stateResource
  }
}

function getServiceOverride(
  overrides?: WorkbenchEnvironmentServiceOverrides
): IEditorOverrideServices {
  return {
    [IEnvironmentService.toString()]: new SyncDescriptor(
      InjectedBrowserWorkbenchEnvironmentService,
      [undefined, overrides],
      true
    )
  }
}

export default getServiceOverride

export type { IWorkbenchConstructionOptions }
