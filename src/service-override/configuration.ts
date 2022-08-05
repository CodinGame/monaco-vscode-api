import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ConfigurationService } from 'vs/platform/configuration/common/configurationService'
import { ConfigurationTarget, IConfigurationService, IConfigurationUpdateOverrides, isConfigurationOverrides, isConfigurationUpdateOverrides } from 'vs/platform/configuration/common/configuration'
import { ITextResourceConfigurationService } from 'vs/editor/common/services/textResourceConfiguration'
import { TextResourceConfigurationService } from 'vs/editor/common/services/textResourceConfigurationService'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IConfigurationRegistry, Extensions as ConfigurationExtensions } from 'vs/platform/configuration/common/configurationRegistry'
import { Registry } from 'vs/platform/registry/common/platform'
import { IEnvironmentService } from 'vs/platform/environment/common/environment'
import { VSBuffer } from 'vs/base/common/buffer'
import { IFileService } from 'vs/platform/files/common/files'
import { ILogService } from 'vs/platform/log/common/log'
import { Configuration } from 'vs/platform/configuration/common/configurationModels'
import getFileServiceOverride from './files'

function updateUserConfiguration (configurationJson: string): void {
  const environmentService: IEnvironmentService = StandaloneServices.get(IEnvironmentService)
  void StandaloneServices.get(IFileService).writeFile(environmentService.settingsResource, VSBuffer.fromString(configurationJson))
}

const configurationRegistry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration)

class InjectedConfigurationService extends ConfigurationService {
  constructor (@IEnvironmentService environmentService: IEnvironmentService, @IFileService fileService: IFileService, @ILogService logService: ILogService) {
    super(environmentService.settingsResource, fileService)

    this.initialize().catch(error => {
      logService.error(error)
    })
  }

  // For some reasons, the default implementation just throw a not supported error
  // Override it so editor.updateOptions still works
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override updateValue (key: string, value: any, arg3?: any, arg4?: any): Promise<void> {
    const overrides: IConfigurationUpdateOverrides | undefined = isConfigurationUpdateOverrides(arg3)
      ? arg3
      : isConfigurationOverrides(arg3) ? { resource: arg3.resource, overrideIdentifiers: arg3.overrideIdentifier != null ? [arg3.overrideIdentifier] : undefined } : undefined
    const target: ConfigurationTarget | undefined = overrides != null ? arg4 : arg3

    if (target === ConfigurationTarget.MEMORY) {
      // eslint-disable-next-line dot-notation
      return Promise.resolve((this['configuration'] as Configuration).updateValue(key, value, overrides))
    }
    return Promise.reject(new Error('not supported'))
  }
}

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getFileServiceOverride(),
    [IConfigurationService.toString()]: new SyncDescriptor(InjectedConfigurationService),
    [ITextResourceConfigurationService.toString()]: new SyncDescriptor(TextResourceConfigurationService)
  }
}

export {
  updateUserConfiguration,
  configurationRegistry
}
