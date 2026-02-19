import { VSBuffer } from 'vs/base/common/buffer'
import { Event } from 'vs/base/common/event'
import type { DisposableStore } from 'vs/base/common/lifecycle'
import type { URI } from 'vs/base/common/uri'
import {
  type IStorageDatabase,
  type IStorageItemsChangeEvent,
  type IUpdateRequest,
  Storage
} from 'vs/base/parts/storage/common/storage'
import type { ServicesAccessor } from 'vs/editor/browser/editorExtensions'
import { type IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ExtensionStorageService } from 'vs/platform/extensionManagement/common/extensionStorage'
import { IExtensionStorageService } from 'vs/platform/extensionManagement/common/extensionStorage.service'
import { IFileService } from 'vs/platform/files/common/files.service'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ILogService } from 'vs/platform/log/common/log.service'
import { AbstractStorageService, StorageScope } from 'vs/platform/storage/common/storage'
import { IStorageService } from 'vs/platform/storage/common/storage.service'
import type { IUserDataProfile } from 'vs/platform/userDataProfile/common/userDataProfile'
import type { IAnyWorkspaceIdentifier } from 'vs/platform/workspace/common/workspace'
import { IHostService } from 'vs/workbench/services/host/browser/host.service'
import { BrowserStorageService } from 'vs/workbench/services/storage/browser/storageService'
import { IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile.service'
import {
  registerServiceInitializeParticipant,
  registerServiceInitializePreParticipant
} from '../lifecycle'
import { IInstantiationService } from '../services'
import { getWorkspaceIdentifier } from '../workbench'

export class JsonFileStorageDatabase implements IStorageDatabase {
  onDidChangeItemsExternal = Event.None

  private cache: Map<string, string> | undefined = undefined

  constructor(
    private fileUri: URI,
    @IFileService private fileService: IFileService
  ) {}

  private async init() {
    if (this.cache == null) {
      try {
        const content = await this.fileService.readFile(this.fileUri)

        const data = JSON.parse(content.value.toString()) as Record<string, string>
        this.cache = new Map(Object.entries(data))
      } catch {
        this.cache = new Map()
      }
    }
  }

  async getItems(): Promise<Map<string, string>> {
    await this.init()
    return this.cache!
  }

  async updateItems(request: IUpdateRequest): Promise<void> {
    await this.init()
    for (const [key, value] of request.insert ?? []) {
      this.cache?.set(key, value)
    }
    for (const key of request.delete ?? []) {
      this.cache?.delete(key)
    }
    await this.fileService!.writeFile(
      this.fileUri,
      VSBuffer.fromString(JSON.stringify(Object.fromEntries(this.cache!), null, 2))
    )
  }
  async optimize(): Promise<void> {
    // nothing to do
  }
  async close(): Promise<void> {}
}

registerServiceInitializePreParticipant(async (accessor) => {
  const storageService = accessor.get(IStorageService)
  if (storageService instanceof AbstractStorageService) {
    await storageService.initialize()
  }
})

registerServiceInitializeParticipant(async (accessor) => {
  const hostService = accessor.get(IHostService)
  const storageService = accessor.get(IStorageService)
  hostService.onDidChangeFocus((focus) => {
    if (!focus) {
      void storageService.flush()
    }
  })
})

export interface DatabaseFactories {
  [StorageScope.APPLICATION]?: (
    accessor: ServicesAccessor,
    disposableStore: DisposableStore
  ) => IStorageDatabase
  [StorageScope.PROFILE]?: (
    accessor: ServicesAccessor,
    profile: IUserDataProfile,
    disposableStore: DisposableStore
  ) => IStorageDatabase
  [StorageScope.WORKSPACE]?: (
    accessor: ServicesAccessor,
    workspace: IAnyWorkspaceIdentifier,
    disposableStore: DisposableStore
  ) => IStorageDatabase
}

class InjectedBrowserStorageService extends BrowserStorageService {
  constructor(
    private fallbackOverride: Record<string, unknown> | undefined,
    private databaseFactories: DatabaseFactories = {},
    @IUserDataProfileService userDataProfileService: IUserDataProfileService,
    @ILogService logService: ILogService,
    @IInstantiationService private instantiationService: IInstantiationService
  ) {
    super(getWorkspaceIdentifier(), userDataProfileService, logService)
  }

  override get(key: string, scope: StorageScope, fallbackValue: string): string
  override get(key: string, scope: StorageScope): string | undefined
  override get(key: string, scope: StorageScope, fallbackValue?: string): string | undefined {
    return this.getStorage(scope)?.get(
      key,
      (this.fallbackOverride?.[key] as string | undefined) ?? fallbackValue
    )
  }

  override getBoolean(key: string, scope: StorageScope, fallbackValue: boolean): boolean
  override getBoolean(key: string, scope: StorageScope): boolean | undefined
  override getBoolean(
    key: string,
    scope: StorageScope,
    fallbackValue?: boolean
  ): boolean | undefined {
    return this.getStorage(scope)?.getBoolean(
      key,
      (this.fallbackOverride?.[key] as boolean | undefined) ?? fallbackValue
    )
  }

  override getNumber(key: string, scope: StorageScope, fallbackValue: number): number
  override getNumber(key: string, scope: StorageScope): number | undefined
  override getNumber(key: string, scope: StorageScope, fallbackValue?: number): number | undefined {
    return this.getStorage(scope)?.getNumber(
      key,
      (this.fallbackOverride?.[key] as number | undefined) ?? fallbackValue
    )
  }

  override getObject(key: string, scope: StorageScope, fallbackValue: object): object
  override getObject(key: string, scope: StorageScope): object | undefined
  override getObject(key: string, scope: StorageScope, fallbackValue?: object): object | undefined {
    return this.getStorage(scope)?.getObject(
      key,
      (this.fallbackOverride?.[key] as object | undefined) ?? fallbackValue
    )
  }

  protected override async createWorkspaceStorageDatabase(
    workspace: IAnyWorkspaceIdentifier,
    disposableStore: DisposableStore
  ) {
    const factory = this.databaseFactories[StorageScope.WORKSPACE]
    if (factory != null) {
      return this.instantiationService.invokeFunction(factory, workspace, disposableStore)
    }
    return await super.createWorkspaceStorageDatabase(workspace, disposableStore)
  }

  protected override async createApplicationStorageDatabase(disposableStore: DisposableStore) {
    const factory = this.databaseFactories[StorageScope.APPLICATION]
    if (factory != null) {
      return this.instantiationService.invokeFunction(factory, disposableStore)
    }
    return await super.createApplicationStorageDatabase(disposableStore)
  }

  protected override async createProfileStorageDatabase(
    profile: IUserDataProfile,
    disposableStore: DisposableStore
  ) {
    const factory = this.databaseFactories[StorageScope.PROFILE]
    if (factory != null) {
      return this.instantiationService.invokeFunction(factory, profile, disposableStore)
    }
    return await super.createProfileStorageDatabase(profile, disposableStore)
  }
}

interface StorageServiceParameters {
  /**
   * Allows to override the storage key default values
   */
  fallbackOverride?: Record<string, unknown>

  /**
   * Allow to override the storage database for a specific scope (application, profile, workspace)
   */
  databaseFactories?: DatabaseFactories
}

export default function getStorageServiceOverride({
  fallbackOverride,
  databaseFactories
}: StorageServiceParameters = {}): IEditorOverrideServices {
  return {
    [IStorageService.toString()]: new SyncDescriptor(
      InjectedBrowserStorageService,
      [fallbackOverride, databaseFactories],
      true
    ),
    [IExtensionStorageService.toString()]: new SyncDescriptor(ExtensionStorageService, [], true)
  }
}

export { InjectedBrowserStorageService as BrowserStorageService, Storage, StorageScope }
export type { IStorageItemsChangeEvent }
