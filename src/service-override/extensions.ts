import { IFileService } from 'vs/platform/files/common/files'
import { ILifecycleService, LifecyclePhase } from 'vs/workbench/services/lifecycle/common/lifecycle'
import { ExtensionHostExtensions, ExtensionHostStartup, IExtensionHost, IExtensionService, toExtensionDescription } from 'vs/workbench/services/extensions/common/extensions'
import { ILogService } from 'vs/platform/log/common/log'
import { IExtension, IRelaxedExtensionDescription } from 'vs/platform/extensions/common/extensions'
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace'
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation'
import { INotificationService } from 'vs/platform/notification/common/notification'
import { AbstractExtensionService, DeltaExtensionsQueueItem, IExtensionHostFactory, ResolvedExtensions } from 'vs/workbench/services/extensions/common/abstractExtensionService'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry'
import { IDialogService } from 'vs/platform/dialogs/common/dialogs'
import { IRemoteAuthorityResolverService, ResolverResult } from 'vs/platform/remote/common/remoteAuthorityResolver'
import { IRemoteExtensionsScannerService } from 'vs/platform/remote/common/remoteExtensionsScanner'
import { IRemoteAgentService } from 'vs/workbench/services/remote/common/remoteAgentService'
import { IWorkbenchExtensionEnablementService, IWorkbenchExtensionManagementService } from 'vs/workbench/services/extensionManagement/common/extensionManagement'
import { ExtensionManifestPropertiesService, IExtensionManifestPropertiesService } from 'vs/workbench/services/extensions/common/extensionManifestPropertiesService'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration'
import { IProductService } from 'vs/platform/product/common/productService'
import { IBrowserWorkbenchEnvironmentService } from 'vs/workbench/services/environment/browser/environmentService'
import { ExtensionsProposedApi } from 'vs/workbench/services/extensions/common/extensionsProposedApi'
import { ExtensionHostKind, IExtensionHostKindPicker } from 'vs/workbench/services/extensions/common/extensionHostKind'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ExtensionRunningLocation, LocalProcessRunningLocation } from 'vs/workbench/services/extensions/common/extensionRunningLocation'
import { IMessagePassingProtocol } from 'vs/base/parts/ipc/common/ipc'
import { Event } from 'vs/base/common/event'
import { ExtensionRunningLocationTracker } from 'vs/workbench/services/extensions/common/extensionRunningLocationTracker'
import { extHostMessagePassingProtocol } from '../extHost'

class SimpleExtensionHost implements IExtensionHost {
  public runningLocation = new LocalProcessRunningLocation(0)
  remoteAuthority = null
  startup = ExtensionHostStartup.EagerAutoStart
  public readonly extensions = new ExtensionHostExtensions()
  onExit = Event.None

  async start (): Promise<IMessagePassingProtocol> {
    return extHostMessagePassingProtocol
  }

  getInspectPort = (): undefined => undefined
  enableInspectPort = async (): Promise<boolean> => false
  dispose (): void {
  }
}

class SimpleExtensionHostFactory implements IExtensionHostFactory {
  createExtensionHost (runningLocations: ExtensionRunningLocationTracker, runningLocation: ExtensionRunningLocation): IExtensionHost | null {
    if (runningLocation.kind === ExtensionHostKind.LocalProcess) {
      return new SimpleExtensionHost()
    }
    return null
  }
}

class SimpleExtensionHostKindPicker implements IExtensionHostKindPicker {
  pickExtensionHostKind (): ExtensionHostKind | null {
    return ExtensionHostKind.LocalProcess
  }
}

export class SimpleExtensionService extends AbstractExtensionService implements IExtensionService {
  constructor (
    @IInstantiationService instantiationService: IInstantiationService,
    @INotificationService notificationService: INotificationService,
    @IBrowserWorkbenchEnvironmentService browserEnvironmentService: IBrowserWorkbenchEnvironmentService,
    @ITelemetryService telemetryService: ITelemetryService,
    @IWorkbenchExtensionEnablementService extensionEnablementService: IWorkbenchExtensionEnablementService,
    @IFileService fileService: IFileService,
    @IProductService productService: IProductService,
    @IWorkbenchExtensionManagementService extensionManagementService: IWorkbenchExtensionManagementService,
    @IWorkspaceContextService contextService: IWorkspaceContextService,
    @IConfigurationService configurationService: IConfigurationService,
    @IExtensionManifestPropertiesService extensionManifestPropertiesService: IExtensionManifestPropertiesService,
    @ILogService logService: ILogService,
    @IRemoteAgentService remoteAgentService: IRemoteAgentService,
    @IRemoteExtensionsScannerService remoteExtensionsScannerService: IRemoteExtensionsScannerService,
    @ILifecycleService lifecycleService: ILifecycleService,
    @IRemoteAuthorityResolverService remoteAuthorityResolverService: IRemoteAuthorityResolverService,
    @IDialogService dialogService: IDialogService
  ) {
    const extensionsProposedApi = instantiationService.createInstance(ExtensionsProposedApi)
    const extensionHostFactory = new SimpleExtensionHostFactory()
    super(
      extensionsProposedApi,
      extensionHostFactory,
      new SimpleExtensionHostKindPicker(),
      instantiationService,
      notificationService,
      browserEnvironmentService,
      telemetryService,
      extensionEnablementService,
      fileService,
      productService,
      extensionManagementService,
      contextService,
      configurationService,
      extensionManifestPropertiesService,
      logService,
      remoteAgentService,
      remoteExtensionsScannerService,
      lifecycleService,
      remoteAuthorityResolverService,
      dialogService
    )

    // Initialize installed extensions first and do it only after workbench is ready
    void lifecycleService.when(LifecyclePhase.Ready).then(async () => {
      return this._initialize()
    })
  }

  public async deltaExtensions (toAdd: IExtension[], toRemove: IExtension[]): Promise<void> {
    await this._handleDeltaExtensions(new DeltaExtensionsQueueItem(toAdd, toRemove))
  }

  protected override async _resolveExtensions (): Promise<ResolvedExtensions> {
    return new ResolvedExtensions([], [], false, false)
  }

  protected override async _scanSingleExtension (extension: IExtension): Promise<Readonly<IRelaxedExtensionDescription> | null> {
    return toExtensionDescription(extension)
  }

  protected override _onExtensionHostExit (): void {
  }

  protected override _resolveAuthority (remoteAuthority: string): Promise<ResolverResult> {
    return this._resolveAuthorityOnExtensionHosts(ExtensionHostKind.LocalProcess, remoteAuthority)
  }
}

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IExtensionService.toString()]: new SyncDescriptor(SimpleExtensionService),
    [IExtensionManifestPropertiesService.toString()]: new SyncDescriptor(ExtensionManifestPropertiesService)
  }
}
