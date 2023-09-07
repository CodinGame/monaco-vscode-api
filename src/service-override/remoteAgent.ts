import '../missing-services'
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
import getEnvironmentServiceOverride from './environment'
import { registerServiceInitializePreParticipant } from '../lifecycle'
import { IFileService, ILogService } from '../services'
import 'vs/workbench/contrib/remote/common/remote.contribution'

class CustomRemoteSocketFactoryService extends RemoteSocketFactoryService {
  constructor (@IBrowserWorkbenchEnvironmentService browserWorkbenchEnvironmentService: IBrowserWorkbenchEnvironmentService) {
    super()
    this.register(RemoteConnectionType.WebSocket, new BrowserSocketFactory(browserWorkbenchEnvironmentService.options?.webSocketFactory))
  }
}

registerServiceInitializePreParticipant(async (serviceAccessor) => {
  RemoteFileSystemProviderClient.register(serviceAccessor.get(IRemoteAgentService), serviceAccessor.get(IFileService), serviceAccessor.get(ILogService))
})

export default function getServiceOverride (connectionToken?: Promise<string> | string, resourceUriProvider?: ((uri: URI) => URI)): IEditorOverrideServices {
  return {
    ...getEnvironmentServiceOverride(),
    [IRemoteAgentService.toString()]: new SyncDescriptor(RemoteAgentService),
    [IRemoteSocketFactoryService.toString()]: new SyncDescriptor(CustomRemoteSocketFactoryService),
    [IRemoteAuthorityResolverService.toString()]: new SyncDescriptor(RemoteAuthorityResolverService, [true, connectionToken, resourceUriProvider])
  }
}
