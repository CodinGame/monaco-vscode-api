import '../vscode-services/missing-services'
import { IEditorOverrideServices, StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { FileService } from 'vs/platform/files/common/fileService'
import { ILogService } from 'vs/platform/log/common/log'
import { InMemoryFileSystemProvider } from 'vs/platform/files/common/inMemoryFilesystemProvider'
import { URI } from 'vs/base/common/uri'
import { FileChangeType, FilePermission, FileSystemProviderCapabilities, FileType } from 'vscode/vs/platform/files/common/files'
import { createFileSystemProviderError, FileSystemProviderError, FileSystemProviderErrorCode, IFileChange, IFileDeleteOptions, IFileOverwriteOptions, IFileService, IFileSystemProviderWithFileReadWriteCapability, IFileWriteOptions, IStat, IWatchOptions } from 'vs/platform/files/common/files'
import { DisposableStore, IDisposable, Disposable } from 'vs/base/common/lifecycle'
import { extUri, joinPath } from 'vs/base/common/resources'
import { Emitter, Event } from 'vs/base/common/event'
import { HTMLFileSystemProvider } from 'vs/platform/files/browser/htmlFileSystemProvider'
import * as path from 'vs/base/common/path'
import 'vs/workbench/contrib/files/browser/files.contribution'

class StaticFile implements IStat {
  ctime: number
  mtime: number
  size: number
  type: FileType
  constructor (public getContent: () => Promise<string | Uint8Array>, public setContent?: (content: string) => Promise<void>) {
    this.ctime = Date.now()
    this.mtime = Date.now()
    this.size = 0
    this.type = FileType.File
  }
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()
class RegisteredFileSystemProvider extends Disposable implements IFileSystemProviderWithFileReadWriteCapability {
  private files: Map<string, StaticFile>
  capabilities: number
  constructor (private readonly: boolean) {
    super()
    this.files = new Map<string, StaticFile>()
    this.capabilities = FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.PathCaseSensitive
    if (readonly) {
      this.capabilities |= FileSystemProviderCapabilities.Readonly
    }
  }

  onDidChangeCapabilities = Event.None
  _onDidChangeFile = new Emitter<readonly IFileChange[]>()
  onDidChangeFile = this._onDidChangeFile.event

  public registerFile (resource: URI, getContent: () => Promise<string | Uint8Array>, setContent?: (content: string) => Promise<void>): IDisposable {
    this.files.set(resource.toString(), new StaticFile(getContent, setContent))
    this._onDidChangeFile.fire([{
      resource,
      type: FileChangeType.ADDED
    }])
    return {
      dispose: () => {
        this.files.delete(resource.toString())
        this._onDidChangeFile.fire([{
          resource,
          type: FileChangeType.DELETED
        }])
      }
    }
  }

  async stat (resource: URI): Promise<IStat> {
    const resourceUri = resource.toString()

    const file = this.files.get(resourceUri)
    if (file != null) {
      return {
        ctime: Date.now(),
        mtime: Date.now(),
        size: 0,
        type: FileType.File,
        permissions: file.setContent == null || this.readonly ? FilePermission.Readonly : undefined
      }
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
      .map(uri => path.relative(resource.path, URI.parse(uri).path))
      .filter(path => !path.startsWith('..'))

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
      const data = await file.getContent()
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
    if (file?.setContent != null) {
      await file.setContent(decoder.decode(content))
      this._onDidChangeFile.fire([{
        resource,
        type: FileChangeType.UPDATED
      }])
      return
    }
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  async mkdir (): Promise<never> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  async delete (): Promise<never> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  async rename (): Promise<never> {
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

  private async writeToDelegates (resource: URI, caller: (delegate: IFileSystemProviderWithFileReadWriteCapability) => Promise<void>): Promise<void> {
    for (const provider of this.delegates) {
      if ((provider.capabilities & FileSystemProviderCapabilities.Readonly) > 0) {
        continue
      }
      try {
        const stats = await provider.stat(resource)
        if (((stats.permissions ?? 0) & FilePermission.Readonly) > 0) {
          continue
        }
      } catch (err) {
        // ignore
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
    const results = await Promise.allSettled(this.delegates.map(delegate => delegate.readdir(resource)))
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
    await this.writeToDelegates(resource, delegate => delegate.writeFile(resource, content, opts))
  }

  async mkdir (resource: URI): Promise<void> {
    await this.writeToDelegates(resource, delegate => delegate.mkdir(resource))
  }

  async delete (resource: URI, opts: IFileDeleteOptions): Promise<void> {
    await this.writeToDelegates(resource, delegate => delegate.delete(resource, opts))
  }

  async rename (from: URI, to: URI, opts: IFileOverwriteOptions): Promise<void> {
    await this.writeToDelegates(from, delegate => delegate.rename(from, to, opts))
  }
}

class MkdirpOnWriteInMemoryFileSystemProvider extends InMemoryFileSystemProvider {
  override async writeFile (resource: URI, content: Uint8Array, opts: IFileWriteOptions): Promise<void> {
    // when using overlay providers, the fileservice won't be able to detect that the parent directory doesn't exist
    // if another provider has this directory. So it won't create the parent directories on this memory file system.
    // So let's do it ourself
    // eslint-disable-next-line dot-notation
    await (StandaloneServices.get(IFileService) as FileService)['mkdirp'](this, extUri.dirname(resource))

    return super.writeFile(resource, content, opts)
  }
}

const fileSystemProvider = new OverlayFileSystemProvider()
fileSystemProvider.register(0, new MkdirpOnWriteInMemoryFileSystemProvider())

const extensionFileSystemProvider = new RegisteredFileSystemProvider(true)
class MemoryFileService extends FileService {
  constructor (@ILogService logService: ILogService) {
    super(logService)

    const userMemoryFileSystem = new InMemoryFileSystemProvider()

    this.registerProvider('user', userMemoryFileSystem)
    this.registerProvider('extension', extensionFileSystemProvider)
    this.registerProvider('cache', new InMemoryFileSystemProvider())
    this.registerProvider('logs', new InMemoryFileSystemProvider())
    let fileSystemProviderDisposable = this.registerProvider('file', fileSystemProvider)
    fileSystemProvider.onDidChangeOverlays(() => {
      fileSystemProviderDisposable.dispose()
      fileSystemProviderDisposable = this.registerProvider('file', fileSystemProvider)
    })
  }
}

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IFileService.toString()]: new SyncDescriptor(MemoryFileService)
  }
}

export function registerExtensionFile (extensionLocation: URI, path: string, getContent: () => Promise<string | Uint8Array>): IDisposable {
  return extensionFileSystemProvider.registerFile(joinPath(extensionLocation, path), getContent)
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
  return fileSystemProvider.register(priority, provider)
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
  RegisteredFileSystemProvider
}
