import '../missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { URI } from 'vs/base/common/uri'
import { IFileService } from 'vs/platform/files/common/files'
import { ILoggerService, LogLevel } from 'vs/platform/log/common/log'
import { FileLoggerService } from 'vs/platform/log/common/fileLog'
import 'vs/workbench/contrib/output/browser/output.contribution'

class _FileLoggerService extends FileLoggerService {
  constructor (logLevel: LogLevel, @IFileService fileService: IFileService) {
    super(logLevel, URI.from({ scheme: 'logs', path: '/' }), fileService)
  }
}

export default function getServiceOverride (logLevel: LogLevel = LogLevel.Info): IEditorOverrideServices {
  return {
    [ILoggerService.toString()]: new SyncDescriptor(_FileLoggerService, [logLevel], true)
  }
}
