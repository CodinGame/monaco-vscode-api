import { Event } from 'vs/base/common/event'
import type { IDisposable } from 'vs/base/common/lifecycle'
import {
  type IStorage,
  type IStorageDatabase,
  type IStorageItemsChangeEvent,
  type IUpdateRequest,
  Storage
} from 'vs/base/parts/storage/common/storage'
import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { AbstractStorageService, StorageScope } from 'vs/platform/storage/common/storage'
import { IStorageService } from 'vs/platform/storage/common/storage.service'
import { BrowserStorageService } from 'vs/workbench/services/storage/browser/storageService'
import { ILogService } from 'vs/platform/log/common/log.service'
import { IUserDataProfileService } from 'vs/workbench/services/userDataProfile/common/userDataProfile.service'
import { IHostService } from 'vs/workbench/services/host/browser/host.service'
import { ExtensionStorageService } from 'vs/platform/extensionManagement/common/extensionStorage'
import { IExtensionStorageService } from 'vs/platform/extensionManagement/common/extensionStorage.service'
import {
  registerServiceInitializeParticipant,
  registerServiceInitializePreParticipant
} from '../lifecycle'
import { getWorkspaceIdentifier } from '../workbench'

export interface IStorageProvider {
  read(): Map<string, string> | undefined
  write(data: Map<string, string>): Promise<void>
  close?(): Promise<void>
  onDidChange?(listener: (event: IStorageItemsChangeEvent) => void): IDisposable
  optimize?(): Promise<void>
}

export class ExternalStorage extends Storage {
  constructor(provider: IStorageProvider) {
    const items = provider.read()

    super(new ExternalStorageDatabase(provider, items))

    if (items != null) {
      for (const [key, value] of items) {
        this.items.set(key, value)
      }
    }
  }
}

class ExternalStorageDatabase implements IStorageDatabase {
  readonly onDidChangeItemsExternal: Event<IStorageItemsChangeEvent>

  constructor(
    private readonly provider: IStorageProvider,
    private readonly items = new Map<string, string>()
  ) {
    this.onDidChangeItemsExternal = this.provider.onDidChange ?? Event.None
  }

  async getItems(): Promise<Map<string, string>> {
    return this.items
  }

  async updateItems(request: IUpdateRequest): Promise<void> {
    request.insert?.forEach((value, key) => this.items.set(key, value))

    request.delete?.forEach((key) => this.items.delete(key))

    await this.provider.write(this.items)
  }

  async close() {
    return await this.provider.close?.()
  }

  async optimize(): Promise<void> {
    return await this.provider.optimize?.()
  }
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

class InjectedBrowserStorageService extends BrowserStorageService {
  constructor(
    private fallbackOverride: Record<string, unknown> | undefined,
    private storageOverride: Partial<Record<StorageScope, IStorage>> | undefined,
    @IUserDataProfileService userDataProfileService: IUserDataProfileService,
    @ILogService logService: ILogService
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

  protected override getStorage(scope: StorageScope) {
    return this.storageOverride?.[scope] ?? super.getStorage(scope)
  }
}

interface StorageServiceParameters {
  /**
   * Allows to override the storage key default values
   */
  fallbackOverride?: Record<string, unknown>

  /**
   * Allow to override the storage for a specific scope (application, profile, workspace)
   */
  storageOverride?: Partial<Record<StorageScope, IStorage>>
}

export default function getStorageServiceOverride({
  fallbackOverride,
  storageOverride
}: StorageServiceParameters = {}): IEditorOverrideServices {
  return {
    [IStorageService.toString()]: new SyncDescriptor(
      InjectedBrowserStorageService,
      [fallbackOverride, storageOverride],
      true
    ),
    [IExtensionStorageService.toString()]: new SyncDescriptor(ExtensionStorageService, [], true)
  }
}

export { InjectedBrowserStorageService as BrowserStorageService, Storage, StorageScope }
export type { IStorageItemsChangeEvent }
