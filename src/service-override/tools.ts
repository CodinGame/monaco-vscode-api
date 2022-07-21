
import { URI } from 'vs/base/common/uri'
import { Emitter, Event } from 'vs/base/common/event'
import { FileChangeType, FileSystemProviderCapabilities, FileType, IFileChange, IFileSystemProvider, IFileSystemProviderWithFileReadWriteCapability } from 'vs/platform/files/common/files'
import { unsupported } from '../tools'

export function createConfigurationFileSystemProvider (settingsResource: URI, readConfiguration: () => string, onChange: Event<void>): IFileSystemProvider {
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
