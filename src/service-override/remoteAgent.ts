import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService'
import { RemoteAgentService } from 'vs/workbench/services/remote/browser/remoteAgentService'
import { IRemoteSocketFactoryService, RemoteSocketFactoryService } from 'vs/platform/remote/common/remoteSocketFactoryService'
import { IRemoteAuthorityResolverService, RemoteConnectionType } from 'vs/platform/remote/common/remoteAuthorityResolver'
import { RemoteAuthorityResolverService } from 'vs/platform/remote/browser/remoteAuthorityResolverService'
import { BrowserSocketFactory } from 'vs/platform/remote/browser/browserSocketFactory'
import { RemoteFileSystemProviderClient } from 'vs/workbench/services/remote/common/remoteFileSystemProviderClient'
import { IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService'
import { URI } from 'vs/base/common/uri'
import { IFileService } from 'vs/platform/files/common/files'
import { ILogService } from 'vs/platform/log/common/log'
import { IRemoteExplorerService, RemoteExplorerService } from 'vs/workbench/services/remote/common/remoteExplorerService'
import { ExternalUriOpenerService, IExternalUriOpenerService } from 'vs/workbench/contrib/externalUriOpener/common/externalUriOpenerService'
import getEnvironmentServiceOverride from './environment'
import { registerServiceInitializePreParticipant } from '../lifecycle'
import 'vs/workbench/contrib/remote/common/remote.contribution'
import 'vs/workbench/contrib/remote/browser/remote.contribution'

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

registerServiceInitializePreParticipant(async (serviceAccessor) => {
  RemoteFileSystemProviderClient.register(serviceAccessor.get(IRemoteAgentService), serviceAccessor.get(IFileService), serviceAccessor.get(ILogService))
})

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    ...getEnvironmentServiceOverride(),
    [IRemoteAgentService.toString()]: new SyncDescriptor(RemoteAgentService, [], true),
    [IRemoteSocketFactoryService.toString()]: new SyncDescriptor(CustomRemoteSocketFactoryService, [], true),
    [IRemoteAuthorityResolverService.toString()]: new SyncDescriptor(InjectedRemoteAuthorityResolverService, []),
    [IRemoteExplorerService.toString()]: new SyncDescriptor(RemoteExplorerService, [], true),
    [IExternalUriOpenerService.toString()]: new SyncDescriptor(ExternalUriOpenerService, [], true)
  }
}
