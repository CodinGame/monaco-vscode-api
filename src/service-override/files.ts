import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { FileService, mkdirp } from 'vs/platform/files/common/fileService'
import { LogLevel } from 'vs/platform/log/common/log'
import { ILogService } from 'vs/platform/log/common/log.service'
import { InMemoryFileSystemProvider } from 'vs/platform/files/common/inMemoryFilesystemProvider'
import { URI } from 'vs/base/common/uri'
import { IFileService } from 'vs/platform/files/common/files.service'
import { FileChangeType, FilePermission, FileSystemProviderCapabilities, FileType, IFileSystemProvider, createFileSystemProviderError, FileSystemProviderError, FileSystemProviderErrorCode, IFileChange, IFileDeleteOptions, IFileOverwriteOptions, IFileSystemProviderWithFileReadWriteCapability, IFileWriteOptions, IStat, IWatchOptions } from 'vs/platform/files/common/files'
import { DisposableStore, IDisposable, Disposable, toDisposable } from 'vs/base/common/lifecycle'
import { extUri, joinPath } from 'vs/base/common/resources'
import { Emitter, Event } from 'vs/base/common/event'
import { HTMLFileSystemProvider } from 'vs/platform/files/browser/htmlFileSystemProvider'
import { Schemas } from 'vs/base/common/network'
import { IndexedDBFileSystemProvider, IndexedDBFileSystemProviderErrorData, IndexedDBFileSystemProviderErrorDataClassification } from 'vs/platform/files/browser/indexedDBFileSystemProvider'
import { IndexedDB } from 'vs/base/browser/indexedDB'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry.service'
import { BufferLogger } from 'vs/platform/log/common/bufferLog'
import { ITextFileService } from 'vs/workbench/services/textfile/common/textfiles.service'
import { BrowserTextFileService } from 'vs/workbench/services/textfile/browser/browserTextFileService'
import { FilesConfigurationService } from 'vs/workbench/services/filesConfiguration/common/filesConfigurationService'
import { IFilesConfigurationService } from 'vs/workbench/services/filesConfiguration/common/filesConfigurationService.service'
import { BrowserElevatedFileService } from 'vs/workbench/services/files/browser/elevatedFileService'
import { IElevatedFileService } from 'vs/workbench/services/files/common/elevatedFileService.service'
import { checkServicesNotInitialized, registerServiceInitializePreParticipant } from '../lifecycle'
import { logsPath } from '../workbench'
import 'vs/workbench/contrib/files/browser/files.contribution._configuration.js'

abstract class RegisteredFile {
  protected ctime: number
  protected mtime: number
  public readonly type: FileType

  protected _onDidChange = new Emitter<void>()
  public onDidChange = this._onDidChange.event

  protected _onDidDelete = new Emitter<void>()
  public onDidDelete = this._onDidDelete.event

  protected _onDidRename = new Emitter<{ from: URI, to: URI }>()
  public onDidRename = this._onDidRename.event

  constructor (public uri: URI, private readonly: boolean) {
    this.ctime = Date.now()
    this.mtime = Date.now()
    this.type = FileType.File

    this.onDidChange(() => {
      this.mtime = Date.now()
    })
  }

  async stats (): Promise<IStat> {
    return {
      ctime: this.ctime,
      mtime: this.mtime,
      size: await this.getSize(),
      type: FileType.File,
      permissions: this.readonly ? FilePermission.Readonly : undefined
    }
  }

  async getSize (): Promise<number> {
    return (await this.read()).length
  }

  public abstract read (): Promise<string | Uint8Array>
  public abstract write (content: string): Promise<void>

  public async delete (): Promise<void> {
    this._onDidDelete.fire()
  }

  public async rename (to: URI): Promise<void> {
    const previousUri = this.uri
    this.uri = to
    this._onDidRename.fire({ from: previousUri, to })
  }
}

class RegisteredReadOnlyFile extends RegisteredFile {
  constructor (uri: URI, public override read: () => Promise<string | Uint8Array>) {
    super(uri, true)
  }

  public override write (): Promise<void> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.FileWriteLocked)
  }

  override async delete (): Promise<void> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.FileWriteLocked)
  }

  override async rename (): Promise<void> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.FileWriteLocked)
  }
}

class RegisteredMemoryFile extends RegisteredFile {
  constructor (uri: URI, private content: string) {
    super(uri, false)
  }

  public override async read (): Promise<string | Uint8Array> {
    return this.content
  }

  public override async write (content: string): Promise<void> {
    this.content = content
    this._onDidChange.fire()
  }
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()
class RegisteredFileSystemProvider extends Disposable implements IFileSystemProviderWithFileReadWriteCapability {
  private files: Map<string, RegisteredFile>
  capabilities: number
  constructor (readonly: boolean) {
    super()
    this.files = new Map<string, RegisteredFile>()
    this.capabilities = FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.PathCaseSensitive
    if (readonly) {
      this.capabilities |= FileSystemProviderCapabilities.Readonly
    }
  }

  onDidChangeCapabilities = Event.None
  _onDidChangeFile = new Emitter<readonly IFileChange[]>()
  onDidChangeFile = this._onDidChangeFile.event

  public registerFile (file: RegisteredFile): IDisposable {
    this.files.set(file.uri.toString(), file)
    this._onDidChangeFile.fire([{
      resource: file.uri,
      type: FileChangeType.ADDED
    }])
    const disposableStore = new DisposableStore()
    disposableStore.add(toDisposable(() => {
      if (this.files.get(file.uri.toString()) === file) {
        this.files.delete(file.uri.toString())
        this._onDidChangeFile.fire([{
          resource: file.uri,
          type: FileChangeType.DELETED
        }])
      }
    }))
    disposableStore.add(file.onDidDelete(() => {
      disposableStore.dispose()
    }))
    disposableStore.add(file.onDidChange(() => {
      this._onDidChangeFile.fire([{
        resource: file.uri,
        type: FileChangeType.UPDATED
      }])
    }))
    disposableStore.add(file.onDidRename(({ from, to }) => {
      if (this.files.get(from.toString()) === file) {
        this.files.delete(from.toString())
        this.files.set(to.toString(), file)
        this._onDidChangeFile.fire([{
          resource: from,
          type: FileChangeType.DELETED
        }, {
          resource: to,
          type: FileChangeType.ADDED
        }])
      }
    }))
    return disposableStore
  }

  async stat (resource: URI): Promise<IStat> {
    const resourceUri = resource.toString()

    const file = this.files.get(resourceUri)
    if (file != null) {
      return file.stats()
    }
    const handledUris = Array.from(this.files.keys())
    for (const handledUri of handledUris) {
      if (handledUri.startsWith(resourceUri + '/')) {
        return {
          ctime: Date.now(),
          mtime: Date.now(),
          size: 0,
          type: FileType.Directory
        }
      }
    }

    throw createFileSystemProviderError('file not found', FileSystemProviderErrorCode.FileNotFound)
  }

  public async readdir (resource: URI): Promise<[string, FileType][]> {
    const includedPaths = Array.from(this.files.keys())
      .map(uri => URI.parse(uri))
      .filter(uri => uri.path.startsWith(resource.path))
      .map(uri => extUri.relativePath(resource, uri)!)

    const files = includedPaths.filter(path => !path.includes('/'))
    const directories = includedPaths.filter(path => path.includes('/')).map(path => path.slice(0, path.indexOf('/')))

    return <[string, FileType][]>[
      ...files.map(path => [
        path,
        FileType.File
      ]),
      ...directories.map(path => [
        path,
        FileType.Directory
      ])
    ]
  }

  async readFile (resource: URI): Promise<Uint8Array> {
    const file = this.files.get(resource.toString())
    if (file != null) {
      const data = await file.read()
      if (data instanceof Uint8Array) {
        return data
      } else {
        return encoder.encode(data)
      }
    }

    throw FileSystemProviderError.create('file not found', FileSystemProviderErrorCode.FileNotFound)
  }

  watch (): IDisposable {
    return Disposable.None
  }

  async writeFile (resource: URI, content: Uint8Array): Promise<void> {
    const file = this.files.get(resource.toString())
    if (file?.write != null) {
      await file.write(decoder.decode(content))
      return
    }
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  async delete (resource: URI): Promise<void> {
    const file = this.files.get(resource.toString())
    if (file != null) {
      await file.delete()
      return
    }

    throw createFileSystemProviderError('File not found', FileSystemProviderErrorCode.FileNotFound)
  }

  async rename (from: URI, to: URI): Promise<void> {
    const file = this.files.get(from.toString())
    if (file != null) {
      await file.rename(to)
      return
    }

    throw createFileSystemProviderError('File not found', FileSystemProviderErrorCode.FileNotFound)
  }

  async mkdir (): Promise<never> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }
}

function isFullfiled<T> (result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled'
}

class OverlayFileSystemProvider implements IFileSystemProviderWithFileReadWriteCapability {
  private providers: { priority: number, provider: IFileSystemProviderWithFileReadWriteCapability }[] = []

  public register (priority: number, provider: IFileSystemProviderWithFileReadWriteCapability): IDisposable {
    const item = { priority, provider }
    this.providers.push(item)
    this.providers.sort((a, b) => b.priority - a.priority)

    const disposableStore = new DisposableStore()
    disposableStore.add(provider.onDidChangeFile(e => {
      this._onDidChangeFile.fire(e)
    }))
    disposableStore.add({
      dispose: () => {
        const index = this.providers.indexOf(item)
        if (index >= 0) {
          this.providers.splice(index, 1)
          this._onDidChangeOverlays.fire()
        }
      }
    })
    this._onDidChangeOverlays.fire()
    return disposableStore
  }

  get delegates (): IFileSystemProviderWithFileReadWriteCapability[] {
    return this.providers.map(({ provider }) => provider)
  }

  onDidChangeCapabilities = Event.None
  _onDidChangeFile = new Emitter<readonly IFileChange[]>()
  onDidChangeFile = this._onDidChangeFile.event

  _onDidChangeOverlays = new Emitter<void>()
  onDidChangeOverlays = this._onDidChangeOverlays.event

  capabilities = FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.PathCaseSensitive

  private async readFromDelegates<T> (caller: (delegate: IFileSystemProviderWithFileReadWriteCapability) => Promise<T>) {
    if (this.delegates.length === 0) {
      throw createFileSystemProviderError('No delegate', FileSystemProviderErrorCode.Unavailable)
    }
    let firstError: unknown | undefined
    for (const delegate of this.delegates) {
      try {
        return await caller(delegate)
      } catch (err) {
        firstError ??= err
        if (err instanceof FileSystemProviderError && [
          FileSystemProviderErrorCode.NoPermissions,
          FileSystemProviderErrorCode.FileNotFound,
          FileSystemProviderErrorCode.Unavailable
        ].includes(err.code)) {
          continue
        }
        throw err
      }
    }
    throw firstError
  }

  private async writeToDelegates (caller: (delegate: IFileSystemProviderWithFileReadWriteCapability) => Promise<void>): Promise<void> {
    if (this.delegates.length === 0) {
      throw createFileSystemProviderError('No delegate', FileSystemProviderErrorCode.Unavailable)
    }
    for (const provider of this.delegates) {
      if ((provider.capabilities & FileSystemProviderCapabilities.Readonly) > 0) {
        continue
      }
      try {
        return await caller(provider)
      } catch (err) {
        if (err instanceof FileSystemProviderError && [
          FileSystemProviderErrorCode.NoPermissions,
          FileSystemProviderErrorCode.FileNotFound,
          FileSystemProviderErrorCode.Unavailable
        ].includes(err.code)) {
          continue
        }
        throw err
      }
    }
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  async stat (resource: URI): Promise<IStat> {
    return this.readFromDelegates(async delegate => {
      const result = await delegate.stat(resource)

      const readOnly = (delegate.capabilities & FileSystemProviderCapabilities.Readonly) > 0
      return {
        ...result,
        permissions: result.permissions ?? (readOnly ? FilePermission.Readonly : undefined)
      }
    })
  }

  async readFile (resource: URI): Promise<Uint8Array> {
    return this.readFromDelegates(delegate => delegate.readFile(resource))
  }

  async readdir (resource: URI): Promise<[string, FileType][]> {
    const results = await Promise.allSettled(this.delegates.map(async delegate => delegate.readdir(resource)))
    if (!results.some(isFullfiled)) {
      throw (results[0] as PromiseRejectedResult).reason
    }
    return Object.entries(Object.fromEntries(results.filter(isFullfiled).map(result => result.value).flat()))
  }

  watch (resource: URI, opts: IWatchOptions): IDisposable {
    const store = new DisposableStore()
    for (const delegate of this.delegates) {
      store.add(delegate.watch(resource, opts))
    }
    return store
  }

  async writeFile (resource: URI, content: Uint8Array, opts: IFileWriteOptions): Promise<void> {
    await this.writeToDelegates(async delegate => {
      let stats: IStat | undefined
      try {
        stats = await delegate.stat(resource)
      } catch (err) {
        // ignore
      }
      if (stats != null && ((stats.permissions ?? 0) & FilePermission.Readonly) > 0) {
        throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
      }
      return delegate.writeFile(resource, content, opts)
    })
  }

  async mkdir (resource: URI): Promise<void> {
    await this.writeToDelegates(delegate => delegate.mkdir(resource))
  }

  async delete (resource: URI, opts: IFileDeleteOptions): Promise<void> {
    await this.writeToDelegates(delegate => delegate.delete(resource, opts))
  }

  async rename (from: URI, to: URI, opts: IFileOverwriteOptions): Promise<void> {
    await this.writeToDelegates(delegate => delegate.rename(from, to, opts))
  }
}

class MkdirpOnWriteInMemoryFileSystemProvider extends InMemoryFileSystemProvider {
  override async writeFile (resource: URI, content: Uint8Array, opts: IFileWriteOptions): Promise<void> {
    // when using overlay providers, the fileservice won't be able to detect that the parent directory doesn't exist
    // if another provider has this directory. So it won't create the parent directories on this memory file system.
    await mkdirp(extUri, this, extUri.dirname(resource))

    return super.writeFile(resource, content, opts)
  }
}

class DelegateFileSystemProvider implements IFileSystemProvider {
  constructor (private options: {
    delegate: IFileSystemProvider
    toDelegate: (uri: URI) => URI
    fromDeletate: (uri: URI) => URI
  }) {}

  get capabilities (): FileSystemProviderCapabilities { return this.options.delegate.capabilities }
  onDidChangeCapabilities = this.options.delegate.onDidChangeCapabilities
  onDidChangeFile = Event.map(this.options.delegate.onDidChangeFile, changes => changes.map(change => ({
    type: change.type,
    resource: this.options.fromDeletate(change.resource)
  })))

  readFile = this.options.delegate.readFile != null
    ? (resource: URI): Promise<Uint8Array> => {
        return this.options.delegate.readFile!(this.options.toDelegate(resource))
      }
    : undefined

  writeFile = this.options.delegate.writeFile != null
    ? (resource: URI, content: Uint8Array, opts: IFileWriteOptions): Promise<void> => {
        return this.options.delegate.writeFile!(this.options.toDelegate(resource), content, opts)
      }
    : undefined

  watch (resource: URI, opts: IWatchOptions): IDisposable {
    return this.options.delegate.watch(this.options.toDelegate(resource), opts)
  }

  stat (resource: URI): Promise<IStat> {
    return this.options.delegate.stat(this.options.toDelegate(resource))
  }

  mkdir (resource: URI): Promise<void> {
    return this.options.delegate.mkdir(this.options.toDelegate(resource))
  }

  readdir (resource: URI): Promise<[string, FileType][]> {
    return this.options.delegate.readdir(this.options.toDelegate(resource))
  }

  delete (resource: URI, opts: IFileDeleteOptions): Promise<void> {
    return this.options.delegate.delete(this.options.toDelegate(resource), opts)
  }

  rename (from: URI, to: URI, opts: IFileOverwriteOptions): Promise<void> {
    return this.options.delegate.rename(this.options.toDelegate(from), this.options.toDelegate(to), opts)
  }
}

class EmptyFileSystemProvider implements IFileSystemProviderWithFileReadWriteCapability {
  async readFile (): Promise<Uint8Array> {
    throw createFileSystemProviderError('Not found', FileSystemProviderErrorCode.FileNotFound)
  }

  async writeFile (): Promise<void> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  capabilities = FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.PathCaseSensitive
  onDidChangeCapabilities = Event.None
  onDidChangeFile = Event.None
  watch (): IDisposable {
    return Disposable.None
  }

  async stat (): Promise<IStat> {
    throw createFileSystemProviderError('Not found', FileSystemProviderErrorCode.FileNotFound)
  }

  async mkdir (): Promise<void> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  async readdir (): Promise<[string, FileType][]> {
    throw createFileSystemProviderError('Not found', FileSystemProviderErrorCode.FileNotFound)
  }

  async delete (): Promise<void> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  async rename (): Promise<void> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }
}

const overlayFileSystemProvider = new OverlayFileSystemProvider()
overlayFileSystemProvider.register(0, new MkdirpOnWriteInMemoryFileSystemProvider())

const extensionFileSystemProvider = new RegisteredFileSystemProvider(true)
const userDataFileSystemProvider = new InMemoryFileSystemProvider()

// Initialize /User/ folder to be able to write configuration and keybindings in it before the fileService is initialized
// The `mkdirp` logic is inside the service, and the provider will just fail if asked to write a file in a non-existent directory
void userDataFileSystemProvider.mkdir(URI.from({ scheme: Schemas.vscodeUserData, path: '/User/' }))

export namespace CustomSchemas {
  /**
   * A schema that is used for models that exist in memory
   * only and that have no correspondence on a server or such.
   */
  export const extensionFile = 'extension-file'
}

const providers: Record<string, IFileSystemProvider> = {
  [CustomSchemas.extensionFile]: extensionFileSystemProvider,
  [logsPath.scheme]: new InMemoryFileSystemProvider(),
  [Schemas.vscodeUserData]: userDataFileSystemProvider,
  [Schemas.tmp]: new InMemoryFileSystemProvider(),
  [Schemas.file]: overlayFileSystemProvider
}

class FileServiceOverride extends FileService {
  constructor (logService: ILogService, @ITelemetryService telemetryService: ITelemetryService) {
    super(logService)

    for (const [scheme, provider] of Object.entries(providers)) {
      let disposable = this.registerProvider(scheme, provider)
      if (provider instanceof OverlayFileSystemProvider) {
        provider.onDidChangeOverlays(() => {
          disposable.dispose()
          disposable = this.registerProvider(scheme, provider)
        })
      }

      if (provider instanceof IndexedDBFileSystemProvider) {
        this._register(provider.onReportError(e => telemetryService.publicLog2<IndexedDBFileSystemProviderErrorData, IndexedDBFileSystemProviderErrorDataClassification>('indexedDBFileSystemProviderError', e)))
      }
    }
  }
}

// Set the logger of the fileLogger after the log service is ready.
// This is to avoid cyclic dependency
const fileLogger = new BufferLogger()
registerServiceInitializePreParticipant(async (accessor) => {
  fileLogger.logger = accessor.get(ILogService)
})

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IFileService.toString()]: new SyncDescriptor(FileServiceOverride, [fileLogger], true),
    [ITextFileService.toString()]: new SyncDescriptor(BrowserTextFileService, [], true),
    [IFilesConfigurationService.toString()]: new SyncDescriptor(FilesConfigurationService, [], true),
    [IElevatedFileService.toString()]: new SyncDescriptor(BrowserElevatedFileService, [], true)
  }
}

/**
 * Register a custom file system provider for the given scheme. This allows us to override
 * the default file system provider for a given scheme.
 */
export function registerCustomProvider (scheme: string, provider: IFileSystemProvider): void {
  checkServicesNotInitialized()
  providers[scheme] = provider
}

export function registerExtensionFile (extensionLocation: URI, filePath: string, getContent: () => Promise<string | Uint8Array>): IDisposable {
  return extensionFileSystemProvider.registerFile(new RegisteredReadOnlyFile(joinPath(extensionLocation, filePath), getContent))
}

/**
 * Can be used to create a file before the fileService is initialized
 */
export async function initFile (file: URI, content: Uint8Array | string, options?: Partial<IFileWriteOptions>): Promise<void> {
  checkServicesNotInitialized()
  const provider = providers[file.scheme]
  if (provider == null || provider.writeFile == null) {
    throw new Error(`${file.scheme} provider doesn't exist or doesn't support writing files`)
  }
  if (!(options?.overwrite ?? false)) {
    try {
      await provider.stat(file)
      // The file already exists, do nothing
      return
    } catch (error) {
    }
  }

  await provider.writeFile(file, content instanceof Uint8Array ? content : encoder.encode(content), {
    atomic: false,
    create: true,
    overwrite: false,
    unlock: false,
    ...options
  })
}

let indexedDB: IndexedDB | undefined
const userDataStore = 'vscode-userdata-store'
const logsStore = 'vscode-logs-store'
const handlesStore = 'vscode-filehandles-store'
/**
 * Can be used to replace memory providers by indexeddb providers before the fileService is initialized
 */
export async function createIndexedDBProviders (): Promise<IndexedDBFileSystemProvider> {
  indexedDB = await IndexedDB.create('vscode-web-db', 3, [userDataStore, logsStore, handlesStore])

  // Logger
  registerCustomProvider(logsPath.scheme, new IndexedDBFileSystemProvider(logsPath.scheme, indexedDB, logsStore, false))

  const userDataProvider = new IndexedDBFileSystemProvider(Schemas.vscodeUserData, indexedDB, userDataStore, true)
  registerCustomProvider(Schemas.vscodeUserData, userDataProvider)

  return userDataProvider
}

/**
 * Can be used to replace the default filesystem provider by the HTMLFileSystemProvider before the fileService is initialized
 * Should be called "after" createIndexedDBProviders if used
 */
export function registerHTMLFileSystemProvider (): void {
  class LazyLogService implements ILogService {
    _serviceBrand: undefined
    get onDidChangeLogLevel () {
      return StandaloneServices.get(ILogService).onDidChangeLogLevel
    }

    getLevel (): LogLevel {
      return StandaloneServices.get(ILogService).getLevel()
    }

    setLevel (level: LogLevel): void {
      StandaloneServices.get(ILogService).setLevel(level)
    }

    trace (message: string, ...args: any[]): void {
      StandaloneServices.get(ILogService).trace(message, ...args)
    }

    debug (message: string, ...args: any[]): void {
      StandaloneServices.get(ILogService).debug(message, ...args)
    }

    info (message: string, ...args: any[]): void {
      StandaloneServices.get(ILogService).info(message, ...args)
    }

    warn (message: string, ...args: any[]): void {
      StandaloneServices.get(ILogService).warn(message, ...args)
    }

    error (message: string | Error, ...args: any[]): void {
      StandaloneServices.get(ILogService).error(message, ...args)
    }

    flush (): void {
      StandaloneServices.get(ILogService).flush()
    }

    dispose (): void {
      StandaloneServices.get(ILogService).dispose()
    }
  }
  registerCustomProvider(Schemas.file, new HTMLFileSystemProvider(indexedDB, handlesStore, new LazyLogService()))
}

/**
 * Register a file system overlay
 *
 * By default, a memory filesystem is used to read and write file
 *
 * This method allows to register another fileSystemProvider in front OR behind the default memory one.
 *
 * The default one is registered as priority: 0, so:
 * - any provider registered with a positive priority will be in front of the default one
 * - any provider registered with a negative priority will be behind the default one
 */
export function registerFileSystemOverlay (priority: number, provider: IFileSystemProviderWithFileReadWriteCapability): IDisposable {
  const overlayProvider = providers.file
  if (!(overlayProvider instanceof OverlayFileSystemProvider)) {
    throw new Error('The overlay filesystem provider was replaced')
  }
  return overlayProvider.register(priority, provider)
}

export {
  IFileSystemProviderWithFileReadWriteCapability,
  FileSystemProviderCapabilities,
  FileType,
  IStat,
  IWatchOptions,
  IFileWriteOptions,
  IFileDeleteOptions,
  IFileOverwriteOptions,
  FileSystemProviderError,
  FileSystemProviderErrorCode,
  IFileChange,
  FileChangeType,
  FilePermission,
  HTMLFileSystemProvider,
  InMemoryFileSystemProvider,
  IndexedDB,
  IndexedDBFileSystemProvider,
  RegisteredFileSystemProvider,
  RegisteredFile,
  RegisteredReadOnlyFile,
  RegisteredMemoryFile,
  DelegateFileSystemProvider,
  OverlayFileSystemProvider,
  EmptyFileSystemProvider
}
