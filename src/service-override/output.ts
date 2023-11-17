import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IFileService } from 'vs/platform/files/common/files'
import { ILoggerService, LogLevel, getLogLevel } from 'vs/platform/log/common/log'
import { FileLoggerService } from 'vs/platform/log/common/fileLog'
import 'vs/workbench/contrib/output/browser/output.contribution'
import { IEnvironmentService } from 'vs/platform/environment/common/environment'
import { logsPath } from '../workbench'

class _FileLoggerService extends FileLoggerService {
  constructor (logLevel: LogLevel | undefined, @IFileService fileService: IFileService, @IEnvironmentService environmentService: IEnvironmentService) {
    super(logLevel ?? getLogLevel(environmentService), logsPath, fileService)
  }
}

function getServiceOverride (): IEditorOverrideServices
/**
 * @deprecated Provide logLevel via the services `initialize` function `configuration.developmentOptions.logLevel` parameter
 */
function getServiceOverride (logLevel?: LogLevel): IEditorOverrideServices

function getServiceOverride (logLevel?: LogLevel): IEditorOverrideServices {
  return {
    [ILoggerService.toString()]: new SyncDescriptor(_FileLoggerService, [logLevel], true)
  }
}

export default getServiceOverride
