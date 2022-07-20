import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ConfigurationService } from 'vs/platform/configuration/common/configurationService'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration'
import { URI } from 'vs/base/common/uri'
import { Emitter, Event } from 'vs/base/common/event'
import { FileChangeType, FileSystemProviderCapabilities, FileType, IFileChange, IFileSystemProviderWithFileReadWriteCapability } from 'vs/platform/files/common/files'
import { FileService } from 'vs/platform/files/common/fileService'
import { ILogService } from 'vs/platform/log/common/log'
import { Schemas } from 'vs/base/common/network'
import { unsupported } from '../tools'

function createConfigurationFileSystemProvider (settingsResource: URI, readConfiguration: () => string, onChange: Event<void>) {
  const onDidFilesChange = new Emitter<IFileChange[]>()
  onChange(() => {
    onDidFilesChange.fire([{
      type: FileChangeType.UPDATED,
      resource: settingsResource
    }])
  })

  const textEncoder = new TextEncoder()

  const provider: IFileSystemProviderWithFileReadWriteCapability = {
    capabilities: FileSystemProviderCapabilities.FileReadWrite,
    onDidChangeCapabilities: Event.None,
    onDidChangeFile: onDidFilesChange.event,
    watch: function () {
      // Ignore, the file will always be watched
      return {
        dispose () { }
      }
    },
    stat: async (resource) => {
      if (resource.toString() !== settingsResource.toString()) {
        unsupported()
      }
      return {
        type: FileType.File,
        mtime: 0,
        ctime: 0,
        size: textEncoder.encode(readConfiguration()).length
      }
    },
    mkdir: unsupported,
    readdir: unsupported,
    delete: unsupported,
    rename: unsupported,
    writeFile: unsupported,
    readFile: async (resource) => {
      if (resource.toString() !== settingsResource.toString()) {
        unsupported()
      }
      return textEncoder.encode(readConfiguration())
    }
  }
  return provider
}

export default function getServiceOverride (readConfiguration: () => string, onChange: Event<void>, settingsResource: URI = URI.file('/userSettings.json')): IEditorOverrideServices {
  const logService = StandaloneServices.get(ILogService)
  const fileService = new FileService(logService)
  fileService.registerProvider(Schemas.file, createConfigurationFileSystemProvider(settingsResource, readConfiguration, onChange))

  const configurationService = new ConfigurationService(settingsResource, fileService)
  configurationService.initialize().catch(error => {
    logService.error(error)
  })

  return {
    [IConfigurationService.toString()]: configurationService
  }
}
