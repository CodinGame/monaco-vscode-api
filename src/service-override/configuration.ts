import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ConfigurationService } from 'vs/platform/configuration/common/configurationService'
import { ConfigurationTarget, IConfigurationService, IConfigurationUpdateOverrides, isConfigurationOverrides, isConfigurationUpdateOverrides } from 'vs/platform/configuration/common/configuration'
import { ITextResourceConfigurationService } from 'vs/editor/common/services/textResourceConfiguration'
import { TextResourceConfigurationService } from 'vs/editor/common/services/textResourceConfigurationService'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IConfigurationRegistry, Extensions as ConfigurationExtensions, ConfigurationScope, IConfigurationNode, IConfigurationDefaults, keyFromOverrideIdentifiers } from 'vs/platform/configuration/common/configurationRegistry'
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
import { setProperty } from 'vs/base/common/jsonEdit'
import { createTextBuffer, TextModel } from 'vs/editor/common/model/textModel'
import { URI } from 'vs/base/common/uri'
import getWorkspaceContextServiceOverride from './workspaceContext'
import getFileServiceOverride from './files'
import { onServicesInitialized } from './tools'
import { IModelService } from '../services'

async function updateUserConfiguration (configurationJson: string): Promise<void> {
  const userDataProfilesService: IUserDataProfilesService = StandaloneServices.get(IUserDataProfilesService)
  await StandaloneServices.get(IFileService).writeFile(userDataProfilesService.defaultProfile.settingsResource, VSBuffer.fromString(configurationJson))
}

async function getUserConfiguration (): Promise<string> {
  const userDataProfilesService: IUserDataProfilesService = StandaloneServices.get(IUserDataProfilesService)
  return (await StandaloneServices.get(IFileService).readFile(userDataProfilesService.defaultProfile.settingsResource)).value.toString()
}

const configurationRegistry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration)

function updateJsonValue (jsonValue: string, jsonPath: string[], value: unknown, configFileUrl: URI) {
  const creationOptions = StandaloneServices.get(IModelService).getCreationOptions('json', configFileUrl, true)
  const { textBuffer, disposable: bufferDisposable } = createTextBuffer(jsonValue, creationOptions.defaultEOL)
  try {
    const options = TextModel.resolveOptions(textBuffer, creationOptions)
    const edits = setProperty(jsonValue, jsonPath, value, options)
    return edits.reduce((config, edit) => {
      return `${config.slice(0, edit.offset)}${edit.content}${config.slice(edit.offset + edit.length)}`
    }, jsonValue)
  } finally {
    bufferDisposable.dispose()
  }
}

class InjectedConfigurationService extends ConfigurationService {
  constructor (
    @IUserDataProfilesService private userDataProfilesService: IUserDataProfilesService,
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
  override async updateValue (key: string, value: any, arg3?: any, arg4?: any): Promise<void> {
    const overrides: IConfigurationUpdateOverrides | undefined = isConfigurationUpdateOverrides(arg3)
      ? arg3
      : isConfigurationOverrides(arg3) ? { resource: arg3.resource, overrideIdentifiers: arg3.overrideIdentifier != null ? [arg3.overrideIdentifier] : undefined } : undefined
    const target: ConfigurationTarget = (overrides != null ? arg4 : arg3) ?? ConfigurationTarget.USER

    if (target === ConfigurationTarget.MEMORY) {
      // eslint-disable-next-line dot-notation
      return (this['configuration'] as Configuration).updateValue(key, value, overrides)
    }
    if (target === ConfigurationTarget.USER) {
      const userConfiguration = await getUserConfiguration()
      const jsonPath = overrides?.overrideIdentifiers != null && overrides.overrideIdentifiers.length > 0 ? [keyFromOverrideIdentifiers(overrides.overrideIdentifiers), key] : [key]
      const newConfiguration = updateJsonValue(userConfiguration, jsonPath, value, this.userDataProfilesService.defaultProfile.settingsResource)
      await updateUserConfiguration(newConfiguration)
      return
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
  getUserConfiguration,
  configurationRegistry,
  ConfigurationScope,
  IThemeScopedColorCustomizations,
  IColorCustomizations,
  IConfigurationNode,
  IConfigurationDefaults
}
