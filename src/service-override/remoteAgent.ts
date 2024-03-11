import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService'
import { RemoteAgentService } from 'vs/workbench/services/remote/browser/remoteAgentService'
import { IRemoteSocketFactoryService, RemoteSocketFactoryService } from 'vs/platform/remote/common/remoteSocketFactoryService'
import { IRemoteAuthorityResolverService, RemoteConnectionType } from 'vs/platform/remote/common/remoteAuthorityResolver'
import { RemoteAuthorityResolverService } from 'vs/platform/remote/browser/remoteAuthorityResolverService'
import { BrowserSocketFactory } from 'vs/platform/remote/browser/browserSocketFactory'
import { RemoteFileSystemProviderClient } from 'vs/workbench/services/remote/common/remoteFileSystemProviderClient'
import { BrowserWorkbenchEnvironmentService, IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService'
import { IFileService } from 'vs/platform/files/common/files'
import { ILogService } from 'vs/platform/log/common/log'
import { IRemoteExplorerService, RemoteExplorerService } from 'vs/workbench/services/remote/common/remoteExplorerService'
import { ExternalUriOpenerService, IExternalUriOpenerService } from 'vs/workbench/contrib/externalUriOpener/common/externalUriOpenerService'
import { RemoteExtensionsScannerService } from 'vs/workbench/services/remote/common/remoteExtensionsScanner'
import { IRemoteExtensionsScannerService } from 'vs/platform/remote/common/remoteExtensionsScanner'
import { IProductService } from 'vs/platform/product/common/productService'
import { IEnvironmentService } from 'vs/platform/environment/common/environment'
import { BrowserRemoteResourceLoader } from 'vs/workbench/services/remote/browser/browserRemoteResourceHandler'
import { IWorkbenchEnvironmentService } from 'vs/workbench/services/environment/common/environmentService'
import { IRemoteUserDataProfilesService } from 'vs/workbench/services/userDataProfile/common/remoteUserDataProfiles'
import { IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile'
import { IActiveLanguagePackService } from 'vs/workbench/services/localization/common/locale'
import { IExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { ITunnelService } from 'vs/platform/tunnel/common/tunnel'
import { TunnelService } from 'vs/workbench/services/tunnel/browser/tunnelService'
import getEnvironmentServiceOverride from './environment'
import { getWorkbenchConstructionOptions } from '../workbench'
import { registerServiceInitializePreParticipant } from '../lifecycle'
import 'vs/workbench/contrib/remote/common/remote.contribution'
import 'vs/workbench/contrib/remote/browser/remote.contribution'
import 'vs/workbench/contrib/remote/browser/remoteStartEntry.contribution'

class CustomRemoteSocketFactoryService extends RemoteSocketFactoryService {
  constructor (@IBrowserWorkbenchEnvironmentService browserWorkbenchEnvironmentService: IBrowserWorkbenchEnvironmentService) {
    super()
    this.register(RemoteConnectionType.WebSocket, new BrowserSocketFactory(browserWorkbenchEnvironmentService.options?.webSocketFactory))
  }
}

class InjectedRemoteAuthorityResolverService extends RemoteAuthorityResolverService {
  constructor (
    @IEnvironmentService environmentService: BrowserWorkbenchEnvironmentService,
    @IProductService productService: IProductService,
    @ILogService logService: ILogService,
    @IFileService fileService: IFileService
  ) {
    const configuration = getWorkbenchConstructionOptions()
    const connectionToken = environmentService.options.connectionToken
    const remoteResourceLoader = configuration.remoteResourceProvider != null ? new BrowserRemoteResourceLoader(fileService, configuration.remoteResourceProvider) : undefined
    const resourceUriProvider = configuration.resourceUriProvider ?? remoteResourceLoader?.getResourceUriProvider()
    super(!environmentService.expectsResolverExtension, connectionToken, resourceUriProvider, productService, logService)
  }
}

class CustomRemoteExtensionsScannerService extends RemoteExtensionsScannerService {
  constructor (
    private scanRemoteExtensions: boolean,
    @IRemoteAgentService remoteAgentService: IRemoteAgentService,
    @IWorkbenchEnvironmentService environmentService: IWorkbenchEnvironmentService,
    @IUserDataProfileService userDataProfileService: IUserDataProfileService,
    @IRemoteUserDataProfilesService remoteUserDataProfilesService: IRemoteUserDataProfilesService,
    @ILogService logService: ILogService,
    @IActiveLanguagePackService activeLanguagePackService: IActiveLanguagePackService
  ) {
    super(remoteAgentService, environmentService, userDataProfileService, remoteUserDataProfilesService, logService, activeLanguagePackService)
  }

  override async scanExtensions (): Promise<IExtensionDescription[]> {
    if (!this.scanRemoteExtensions) {
      return []
    }
    return super.scanExtensions()
  }
}

registerServiceInitializePreParticipant(async (serviceAccessor) => {
  RemoteFileSystemProviderClient.register(serviceAccessor.get(IRemoteAgentService), serviceAccessor.get(IFileService), serviceAccessor.get(ILogService))
})

export interface RemoteAgentServiceOverrideParams {
  /**
   * if true, the default extensions on the remote agent will be scanned and added
   * @default false
   */
  scanRemoteExtensions?: boolean
}

export default function getServiceOverride ({ scanRemoteExtensions = false }: RemoteAgentServiceOverrideParams = {}): IEditorOverrideServices {
  return {
    ...getEnvironmentServiceOverride(),
    [IRemoteAgentService.toString()]: new SyncDescriptor(RemoteAgentService, [], true),
    [IRemoteSocketFactoryService.toString()]: new SyncDescriptor(CustomRemoteSocketFactoryService, [], true),
    [IRemoteAuthorityResolverService.toString()]: new SyncDescriptor(InjectedRemoteAuthorityResolverService, []),
    [IRemoteExplorerService.toString()]: new SyncDescriptor(RemoteExplorerService, [], true),
    [IExternalUriOpenerService.toString()]: new SyncDescriptor(ExternalUriOpenerService, [], true),
    [IRemoteExtensionsScannerService.toString()]: new SyncDescriptor(CustomRemoteExtensionsScannerService, [scanRemoteExtensions], true),
    [ITunnelService.toString()]: new SyncDescriptor(TunnelService, [], true)
  }
}
