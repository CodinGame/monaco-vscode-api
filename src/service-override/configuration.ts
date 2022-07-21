import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ConfigurationService } from 'vs/platform/configuration/common/configurationService'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration'
import { URI } from 'vs/base/common/uri'
import { Emitter } from 'vs/base/common/event'
import { FileService } from 'vs/platform/files/common/fileService'
import { ILogService } from 'vs/platform/log/common/log'
import { Schemas } from 'vs/base/common/network'
import { ITextResourceConfigurationService } from 'vs/editor/common/services/textResourceConfiguration'
import { TextResourceConfigurationService } from 'vs/editor/common/services/textResourceConfigurationService'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IConfigurationRegistry, Extensions as ConfigurationExtensions } from 'vs/platform/configuration/common/configurationRegistry'
import { Registry } from 'vs/platform/registry/common/platform'
import { createConfigurationFileSystemProvider } from './tools'

let userConfigurationJson: string = '{}'
const userConfigurationChangeEmitter = new Emitter<void>()
function updateUserConfiguration (configurationJson: string): void {
  userConfigurationJson = configurationJson
  userConfigurationChangeEmitter.fire(undefined)
}

const configurationRegistry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration)

export default function getServiceOverride (settingsResource: URI = URI.file('/userSettings.json')): IEditorOverrideServices {
  const logService = StandaloneServices.get(ILogService)
  const fileService = new FileService(logService)
  fileService.registerProvider(Schemas.file, createConfigurationFileSystemProvider(settingsResource, () => userConfigurationJson, userConfigurationChangeEmitter.event))

  const configurationService = new ConfigurationService(settingsResource, fileService)
  configurationService.initialize().catch(error => {
    logService.error(error)
  })

  return {
    [IConfigurationService.toString()]: configurationService,
    [ITextResourceConfigurationService.toString()]: new SyncDescriptor(TextResourceConfigurationService)
  }
}

export {
  updateUserConfiguration,
  configurationRegistry
}
