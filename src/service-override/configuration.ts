import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ConfigurationService } from 'vs/platform/configuration/common/configurationService'
import { ConfigurationTarget, IConfigurationService, IConfigurationUpdateOverrides, isConfigurationOverrides, isConfigurationUpdateOverrides } from 'vs/platform/configuration/common/configuration'
import { ITextResourceConfigurationService } from 'vs/editor/common/services/textResourceConfiguration'
import { TextResourceConfigurationService } from 'vs/editor/common/services/textResourceConfigurationService'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IConfigurationRegistry, Extensions as ConfigurationExtensions, ConfigurationScope, IConfigurationNode, IConfigurationDefaults } from 'vs/platform/configuration/common/configurationRegistry'
import { Registry } from 'vs/platform/registry/common/platform'
import { VSBuffer } from 'vs/base/common/buffer'
import { IFileService } from 'vs/platform/files/common/files'
import { ILogService } from 'vs/platform/log/common/log'
import { Configuration } from 'vs/platform/configuration/common/configurationModels'
import { IColorCustomizations, IThemeScopedColorCustomizations } from 'vs/workbench/services/themes/common/workbenchThemeService'
import { IUserDataProfilesService } from 'vs/platform/userDataProfile/common/userDataProfile'
import { IPolicyService } from 'vs/platform/policy/common/policy'
import { RegisterConfigurationSchemasContribution } from 'vs/workbench/services/configuration/browser/configurationService'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import getWorkspaceContextServiceOverride from './workspaceContext'
import getFileServiceOverride from './files'
import { onServicesInitialized } from './tools'

async function updateUserConfiguration (configurationJson: string): Promise<void> {
  const userDataProfilesService: IUserDataProfilesService = StandaloneServices.get(IUserDataProfilesService)
  await StandaloneServices.get(IFileService).writeFile(userDataProfilesService.defaultProfile.settingsResource, VSBuffer.fromString(configurationJson))
}

const configurationRegistry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration)

class InjectedConfigurationService extends ConfigurationService {
  constructor (
    @IUserDataProfilesService userDataProfilesService: IUserDataProfilesService,
    @IFileService fileService: IFileService,
    @IPolicyService policyService: IPolicyService,
    @ILogService logService: ILogService
  ) {
    super(userDataProfilesService.defaultProfile.settingsResource, fileService, policyService, logService)

    this.initialize().catch(error => {
      logService.error(error)
    })
  }

  // For some reasons, the default implementation just throw a not supported error
  // Override it so the theme service is able to save the theme in the configuration
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

function initialize (instantiationService: IInstantiationService) {
  instantiationService.createInstance(RegisterConfigurationSchemasContribution)
}

export default function getServiceOverride (): IEditorOverrideServices {
  onServicesInitialized(initialize)
  return {
    ...getFileServiceOverride(),
    ...getWorkspaceContextServiceOverride(),
    [IConfigurationService.toString()]: new SyncDescriptor(InjectedConfigurationService),
    [ITextResourceConfigurationService.toString()]: new SyncDescriptor(TextResourceConfigurationService)
  }
}

export {
  updateUserConfiguration,
  configurationRegistry,
  ConfigurationScope,
  IThemeScopedColorCustomizations,
  IColorCustomizations,
  IConfigurationNode,
  IConfigurationDefaults
}
