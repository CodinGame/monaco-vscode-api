import '../polyfill'
import '../vscode-services/missing-services'
import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { FileService } from 'vs/platform/files/common/fileService'
import { ILogService } from 'vs/platform/log/common/log'
import { InMemoryFileSystemProvider } from 'vs/platform/files/common/inMemoryFilesystemProvider'
import { URI } from 'vs/base/common/uri'
import { createFileSystemProviderError, FileChangeType, FileSystemProviderCapabilities, FileSystemProviderError, FileSystemProviderErrorCode, FileType, IFileChange, IFileDeleteOptions, IFileOverwriteOptions, IFileService, IFileSystemProviderWithFileReadWriteCapability, IFileWriteOptions, IStat, IWatchOptions } from 'vs/platform/files/common/files'
import { DisposableStore, IDisposable, Disposable } from 'vs/base/common/lifecycle'
import { ITextFileService } from 'vs/workbench/services/textfile/common/textfiles'
import { BrowserTextFileService } from 'vs/workbench/services/textfile/browser/browserTextFileService'
import { joinPath } from 'vs/base/common/resources'
import { Emitter, Event } from 'vs/base/common/event'
import 'vs/workbench/contrib/files/browser/files.contribution'

class File implements IStat {
  ctime: number
  mtime: number
  size: number
  type: FileType
  constructor (public getContent: () => Promise<string>) {
    this.ctime = Date.now()
    this.mtime = Date.now()
    this.size = 0
    this.type = FileType.File
  }
}
const encoder = new TextEncoder()
const decoder = new TextDecoder()

abstract class SimpleTextFileSystemProvider implements IFileSystemProviderWithFileReadWriteCapability {
  onDidChangeCapabilities = Event.None
  capabilities = FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.PathCaseSensitive

  protected abstract getFileContent (resource: URI): Promise<string | undefined>

  protected abstract setFileContent (resource: URI, content: string, opts: IFileWriteOptions): Promise<void>

  onDidChangeFile: Event<readonly IFileChange[]> = Event.None

  async readFile (resource: URI): Promise<Uint8Array> {
    try {
      const content = await this.getFileContent(resource)
      if (content != null) {
        return encoder.encode(content)
      }
    } catch (err) {
      throw createFileSystemProviderError(err as Error, FileSystemProviderErrorCode.Unknown)
    }
    throw createFileSystemProviderError('file not found', FileSystemProviderErrorCode.FileNotFound)
  }

  async writeFile (resource: URI, content: Uint8Array, opts: IFileWriteOptions): Promise<void> {
    try {
      await this.setFileContent(resource, decoder.decode(content), opts)
    } catch (err) {
      throw createFileSystemProviderError(err as Error, FileSystemProviderErrorCode.Unknown)
    }
  }

  watch (): IDisposable {
    // ignore, fires for all changes...
    return Disposable.None
  }

  async stat (resource: URI): Promise<IStat> {
    try {
      const content = await this.getFileContent(resource)
      if (content != null) {
        return {
          type: FileType.File,
          size: encoder.encode(content).length,
          ctime: Date.now(),
          mtime: Date.now()
        }
      }
    } catch (err) {
      throw createFileSystemProviderError(err as Error, FileSystemProviderErrorCode.Unknown)
    }
    throw createFileSystemProviderError('file not found', FileSystemProviderErrorCode.FileNotFound)
  }

  async mkdir (): Promise<void> {
    // Do nothing
  }

  readdir (): Promise<[string, FileType][]> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  delete (): Promise<void> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  rename (): Promise<void> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  onDidWatchError = Event.None
}

class ExtensionFileSystemProviderWithFileReadWriteCapability implements IFileSystemProviderWithFileReadWriteCapability {
  capabilities = FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.PathCaseSensitive | FileSystemProviderCapabilities.Readonly

  private files: Map<string, File>
  constructor () {
    this.files = new Map<string, File>()
  }

  async stat (resource: URI): Promise<IStat> {
    const file = this.files.get(resource.toString())
    if (file != null) {
      return file
    }
    throw FileSystemProviderError.create('file not found', FileSystemProviderErrorCode.FileNotFound)
  }

  async readFile (resource: URI): Promise<Uint8Array> {
    const file = this.files.get(resource.toString())
    if (file != null) {
      return encoder.encode(await file.getContent())
    }

    throw FileSystemProviderError.create('file not found', FileSystemProviderErrorCode.FileNotFound)
  }

  watch (): IDisposable {
    // ignore, fires for all changes...
    return Disposable.None
  }

  public registerFile (resource: URI, getContent: () => Promise<string>): IDisposable {
    this.files.set(resource.toString(), new File(getContent))
    return {
      dispose: () => {
        this.files.delete(resource.toString())
      }
    }
  }

  onDidChangeFile = Event.None
  onDidChangeCapabilities = Event.None

  async writeFile () {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  async mkdir () {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  readdir (): Promise<[string, FileType][]> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  async delete () {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  async rename () {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }
}
const extensionFileSystemProvider = new ExtensionFileSystemProviderWithFileReadWriteCapability()

class OverlayFileSystemProvider implements IFileSystemProviderWithFileReadWriteCapability {
  private others: IFileSystemProviderWithFileReadWriteCapability[] = []
  constructor (private _default: IFileSystemProviderWithFileReadWriteCapability) {
    _default.onDidChangeFile((e) => {
      this._onDidChangeFile.fire(e)
    })
  }

  public register (delegate: IFileSystemProviderWithFileReadWriteCapability) {
    this.others.push(delegate)

    const disposableStore = new DisposableStore()
    disposableStore.add(delegate.onDidChangeFile(e => {
      this._onDidChangeFile.fire(e)
    }))
    disposableStore.add({
      dispose: () => {
        const index = this.others.indexOf(delegate)
        if (index >= 0) {
          this.others.splice(index, 1)
        }
      }
    })
    return disposableStore
  }

  get delegates (): IFileSystemProviderWithFileReadWriteCapability[] {
    return [this._default, ...this.others]
  }

  onDidChangeCapabilities = Event.any(...this.delegates.map(delegate => delegate.onDidChangeCapabilities))

  _onDidChangeFile = new Emitter<readonly IFileChange[]>()
  onDidChangeFile = Event.any(this._default.onDidChangeFile, this._onDidChangeFile.event)

  capabilities = FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.PathCaseSensitive

  private async readFromDelegates<T> (caller: (delegate: IFileSystemProviderWithFileReadWriteCapability) => Promise<T>) {
    for (const delegate of this.delegates) {
      try {
        return await caller(delegate)
      } catch (err) {
        if (err instanceof FileSystemProviderError && err.code === FileSystemProviderErrorCode.FileNotFound) {
          continue
        }
        throw err
      }
    }
    throw createFileSystemProviderError('No file system registered', FileSystemProviderErrorCode.FileNotFound)
  }

  private async writeToDelegates (caller: (delegate: IFileSystemProviderWithFileReadWriteCapability) => Promise<void>) {
    await Promise.all(this.delegates.map(async delegate => {
      if ((delegate.capabilities & FileSystemProviderCapabilities.Readonly) === 0) {
        await caller(delegate)
      }
    }))
  }

  async stat (resource: URI): Promise<IStat> {
    return this.readFromDelegates(delegate => delegate.stat(resource))
  }

  async readFile (resource: URI): Promise<Uint8Array> {
    return this.readFromDelegates(delegate => delegate.readFile(resource))
  }

  async readdir (resource: URI): Promise<[string, FileType][]> {
    return this.readFromDelegates(delegate => delegate.readdir(resource))
  }

  watch (resource: URI, opts: IWatchOptions): IDisposable {
    const store = new DisposableStore()
    for (const delegate of this.delegates) {
      store.add(delegate.watch(resource, opts))
    }
    return store
  }

  async writeFile (resource: URI, content: Uint8Array, opts: IFileWriteOptions): Promise<void> {
    await this.writeToDelegates(delegate => delegate.writeFile(resource, content, opts))
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

const fileSystemProvider = new OverlayFileSystemProvider(new InMemoryFileSystemProvider())

class MemoryFileService extends FileService {
  constructor (@ILogService logService: ILogService) {
    super(logService)

    const userMemoryFileSystem = new InMemoryFileSystemProvider()

    this.registerProvider('user', userMemoryFileSystem)
    this.registerProvider('extension', extensionFileSystemProvider)
    this.registerProvider('cache', new InMemoryFileSystemProvider())
    this.registerProvider('logs', new InMemoryFileSystemProvider())
    this.registerProvider('file', fileSystemProvider)
  }
}

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [IFileService.toString()]: new SyncDescriptor(MemoryFileService),
    [ITextFileService.toString()]: new SyncDescriptor(BrowserTextFileService)
  }
}

export function registerExtensionFile (extensionLocation: URI, path: string, getContent: () => Promise<string>): IDisposable {
  return extensionFileSystemProvider.registerFile(joinPath(extensionLocation, path), getContent)
}

export function registerFileSystemOverlay (provider: IFileSystemProviderWithFileReadWriteCapability): IDisposable {
  return fileSystemProvider.register(provider)
}

export {
  IFileSystemProviderWithFileReadWriteCapability,
  FileSystemProviderCapabilities,
  IStat,
  IWatchOptions,
  IFileWriteOptions,
  IFileDeleteOptions,
  IFileOverwriteOptions,
  FileSystemProviderError,
  SimpleTextFileSystemProvider,
  FileSystemProviderErrorCode,
  IFileChange,
  FileChangeType
}
