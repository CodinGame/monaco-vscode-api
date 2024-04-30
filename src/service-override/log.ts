import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IFileService } from 'vs/platform/files/common/files.service'
import { ILogger, LogLevel, ConsoleLogger, getLogLevel } from 'vs/platform/log/common/log'
import { ILogService, ILoggerService } from 'vs/platform/log/common/log.service'
import { FileLoggerService } from 'vs/platform/log/common/fileLog'
import { LogService } from 'vs/platform/log/common/logService'
import { IEnvironmentService } from 'vs/platform/environment/common/environment.service'
import { windowLogId } from 'vs/workbench/services/log/common/logConstants'
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService.service'
import { IDisposable, toDisposable } from 'vs/base/common/lifecycle'
import { DefaultLogLevelsService } from 'vs/workbench/contrib/logs/common/defaultLogLevels'
import { IDefaultLogLevelsService } from 'vs/workbench/contrib/logs/common/defaultLogLevels.service'
import getEnvironmentServiceOverride from './environment'
import { logsPath } from '../workbench'
import { checkServicesNotInitialized } from '../lifecycle'
import 'vs/workbench/contrib/logs/common/logs.contribution'

class _FileLoggerService extends FileLoggerService {
  constructor (logLevel: LogLevel | undefined, @IFileService fileService: IFileService, @IEnvironmentService environmentService: IEnvironmentService) {
    super(logLevel ?? getLogLevel(environmentService), logsPath, fileService)
  }
}

const otherLoggers: ILogger[] = []
class _LogService extends LogService {
  constructor (@ILoggerService loggerService: ILoggerService, @IWorkbenchEnvironmentService environmentService: IWorkbenchEnvironmentService) {
    const logger = loggerService.createLogger(environmentService.logFile, { id: windowLogId, name: 'Window' })
    super(logger, otherLoggers)
  }
}

function getServiceOverride (): IEditorOverrideServices
/**
 * @deprecated Provide logLevel via the services `initialize` function `configuration.developmentOptions.logLevel` parameter
 */
function getServiceOverride (logLevel?: LogLevel): IEditorOverrideServices

function getServiceOverride (logLevel?: LogLevel): IEditorOverrideServices {
  return {
    ...getEnvironmentServiceOverride(),
    [ILoggerService.toString()]: new SyncDescriptor(_FileLoggerService, [logLevel], true),
    [ILogService.toString()]: new SyncDescriptor(_LogService, [], true),
    [IDefaultLogLevelsService.toString()]: new SyncDescriptor(DefaultLogLevelsService, [], true)
  }
}

export default getServiceOverride

export function registerAdditionalLogger (logger: ILogger): IDisposable {
  checkServicesNotInitialized()
  otherLoggers.push(logger)

  return toDisposable(() => {
    const idx = otherLoggers.indexOf(logger)
    if (idx >= 0) {
      otherLoggers.splice(idx, 1)
    }
  })
}

export {
  ILogger,
  ConsoleLogger
}
