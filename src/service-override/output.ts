import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { LogLevel } from 'vs/platform/log/common/log'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { OutputService } from 'vs/workbench/contrib/output/browser/outputServices'
import { IOutputService } from 'vs/workbench/services/output/common/output.service'
import getLogServiceOverride from './log'
import 'vs/workbench/contrib/output/browser/output.contribution'

function getServiceOverride(): IEditorOverrideServices
/**
 * @deprecated Provide logLevel via the services `initialize` function `configuration.developmentOptions.logLevel` parameter
 */
function getServiceOverride(logLevel?: LogLevel): IEditorOverrideServices

function getServiceOverride(logLevel?: LogLevel): IEditorOverrideServices {
  return {
    ...getLogServiceOverride(logLevel),
    [IOutputService.toString()]: new SyncDescriptor(OutputService, [], true)
  }
}

export default getServiceOverride
