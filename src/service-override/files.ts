import {
  IEditorOverrideServices,
  StandaloneServices
} from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { FileService, mkdirp } from 'vs/platform/files/common/fileService'
import { LogLevel } from 'vs/platform/log/common/log'
import { ILogService } from 'vs/platform/log/common/log.service'
import { InMemoryFileSystemProvider } from 'vs/platform/files/common/inMemoryFilesystemProvider'
import { URI } from 'vs/base/common/uri'
import { IFileService } from 'vs/platform/files/common/files.service'
import {
  FileChangeType,
  FilePermission,
  FileSystemProviderCapabilities,
  FileType,
  IFileSystemProvider,
  createFileSystemProviderError,
  FileSystemProviderError,
  FileSystemProviderErrorCode,
  IFileChange,
  IFileDeleteOptions,
  IFileOverwriteOptions,
  IFileSystemProviderWithFileReadWriteCapability,
  IFileWriteOptions,
  IStat,
  IWatchOptions,
  IFileSystemProviderWithOpenReadWriteCloseCapability,
  IFileSystemProviderWithFileReadStreamCapability,
  IFileReadStreamOptions,
  IFileSystemProviderWithFileAtomicReadCapability,
  IFileSystemProviderWithFileAtomicWriteCapability,
  IFileSystemProviderWithFileAtomicDeleteCapability,
  hasFileReadStreamCapability
} from 'vs/platform/files/common/files'
import { DisposableStore, IDisposable, Disposable, toDisposable } from 'vs/base/common/lifecycle'
import { extUri } from 'vs/base/common/resources'
import { Emitter, Event } from 'vs/base/common/event'
import { HTMLFileSystemProvider } from 'vs/platform/files/browser/htmlFileSystemProvider'
import { Schemas } from 'vs/base/common/network'
import {
  IndexedDBFileSystemProvider,
  IndexedDBFileSystemProviderErrorData,
  IndexedDBFileSystemProviderErrorDataClassification
} from 'vs/platform/files/browser/indexedDBFileSystemProvider'
import { IndexedDB } from 'vs/base/browser/indexedDB'
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry.service'
import { BufferLogger } from 'vs/platform/log/common/bufferLog'
import { ITextFileService } from 'vs/workbench/services/textfile/common/textfiles.service'
import { BrowserTextFileService } from 'vs/workbench/services/textfile/browser/browserTextFileService'
import { FilesConfigurationService } from 'vs/workbench/services/filesConfiguration/common/filesConfigurationService'
import { IFilesConfigurationService } from 'vs/workbench/services/filesConfiguration/common/filesConfigurationService.service'
import { BrowserElevatedFileService } from 'vs/workbench/services/files/browser/elevatedFileService'
import { IElevatedFileService } from 'vs/workbench/services/files/common/elevatedFileService.service'
import * as resources from 'vs/base/common/resources'
import { VSBuffer } from 'vs/base/common/buffer'
import { ReadableStreamEvents, listenStream, newWriteableStream } from 'vs/base/common/stream'
import { CancellationToken } from 'vs/base/common/cancellation'
import { checkServicesNotInitialized, registerServiceInitializePreParticipant } from '../lifecycle'
import { logsPath } from '../workbench'
import 'vs/workbench/contrib/files/browser/files.contribution._configuration.js'

interface _RegisteredNode {
  type: FileType
  stats(): Promise<IStat>
  onDidDelete: Event<void>
  onDidChange: Event<void>
}

interface RegisteredFileNode extends _RegisteredNode {
  type: FileType.File
  uri: URI

  read(): Promise<Uint8Array>
  readStream?(): Promise<ReadableStream<Uint8Array>>
  write(content: Uint8Array): Promise<void>
  delete(): void
}

interface RegisteredDirectoryNode extends _RegisteredNode {
  type: FileType.Directory

  addChild(name: string, node: RegisteredNode): IDisposable
  deleteChild(name: string): boolean
  getChildren(name: string): RegisteredNode | undefined
  read(): [string, FileType][]
}

type RegisteredNode = RegisteredFileNode | RegisteredDirectoryNode

class RegisteredDirectory implements RegisteredDirectoryNode {
  public ctime: number
  public mtime: number
  public readonly type = FileType.Directory
  private readonly entries: Map<string, RegisteredNode>

  protected _onDidChange = new Emitter<void>()
  public onDidChange = this._onDidChange.event

  protected _onDidDelete = new Emitter<void>()
  public onDidDelete = this._onDidDelete.event

  constructor() {
    this.ctime = Date.now()
    this.mtime = Date.now()
    this.type = FileType.Directory
    this.entries = new Map()
  }

  async stats(): Promise<IStat> {
    return {
      ctime: this.ctime,
      mtime: this.mtime,
      size: 0,
      type: FileType.Directory
    }
  }

  public delete(): void {
    this._onDidDelete.fire()
  }

  public addChild(name: string, node: RegisteredNode): IDisposable {
    this.entries.set(name, node)
    this._onDidChange.fire()

    const disposable = {
      dispose: () => {
        this.deleteChild(name)
      }
    }

    node.onDidDelete(() => {
      disposable.dispose()
    })

    return disposable
  }

  public deleteChild(name: string): boolean {
    if (this.entries.delete(name)) {
      this.mtime = Date.now()
      this._onDidChange.fire()
      if (this.entries.size === 0) {
        this.delete()
      }
      return true
    }
    return false
  }

  public getChildren(name: string): RegisteredNode | undefined {
    return this.entries.get(name)
  }

  public read(): [string, FileType][] {
    return Array.from(this.entries.entries()).map(([name, child]) => [name, child.type])
  }
}

abstract class RegisteredFile implements RegisteredFileNode {
  protected ctime: number
  protected mtime: number
  public readonly type = FileType.File

  protected _onDidChange = new Emitter<void>()
  public onDidChange = this._onDidChange.event

  protected _onDidDelete = new Emitter<void>()
  public onDidDelete = this._onDidDelete.event

  constructor(
    public uri: URI,
    private readonly: boolean
  ) {
    this.ctime = Date.now()
    this.mtime = Date.now()

    this.onDidChange(() => {
      this.mtime = Date.now()
    })
  }

  async stats(): Promise<IStat> {
    return {
      ctime: this.ctime,
      mtime: this.mtime,
      size: await this.getSize(),
      type: FileType.File,
      permissions: this.readonly ? FilePermission.Readonly : undefined
    }
  }

  abstract getSize(): Promise<number>

  public async delete(): Promise<void> {
    if (this.readonly) {
      throw createFileSystemProviderError(
        'Not allowed',
        FileSystemProviderErrorCode.FileWriteLocked
      )
    }
    this._onDidDelete.fire()
  }

  public abstract read(): Promise<Uint8Array>
  public abstract write(content: Uint8Array): Promise<void>
}

class RegisteredReadOnlyFile extends RegisteredFile {
  constructor(
    uri: URI,
    public override read: () => Promise<Uint8Array>,
    private size: number
  ) {
    super(uri, true)
  }

  override async getSize(): Promise<number> {
    return this.size
  }

  public override write(): Promise<void> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.FileWriteLocked)
  }

  override async delete(): Promise<void> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.FileWriteLocked)
  }
}

export interface ExtensionFileMetadata {
  mimeType?: string
  size?: number
}

class RegisteredUriFile extends RegisteredFile {
  constructor(
    location: URI,
    private url: string,
    private metadata?: ExtensionFileMetadata
  ) {
    super(location, true)
  }

  private async fetch() {
    const response = await fetch(this.url, {
      headers:
        this.metadata?.mimeType != null
          ? {
              Accept: this.metadata.mimeType
            }
          : {}
    })
    if (response.status !== 200) {
      throw new Error(response.statusText)
    }
    return response
  }

  public override async getSize(): Promise<number> {
    return this.metadata?.size ?? 0
  }

  public override async read(): Promise<Uint8Array> {
    const response = await this.fetch()
    return new Uint8Array(await response.arrayBuffer())
  }

  public async readStream(): Promise<ReadableStream<Uint8Array>> {
    const response = await this.fetch()
    return response.body!
  }

  public override write(): Promise<void> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.FileWriteLocked)
  }

  override async delete(): Promise<void> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.FileWriteLocked)
  }
}

const encoder = new TextEncoder()
function encode(data: string | Uint8Array) {
  if (data instanceof Uint8Array) {
    return data
  } else {
    return encoder.encode(data)
  }
}
class RegisteredMemoryFile extends RegisteredFile {
  private content: Uint8Array
  constructor(uri: URI, content: string | Uint8Array) {
    super(uri, false)
    this.content = encode(content)
  }

  override async getSize(): Promise<number> {
    return this.content.length
  }

  public override async read(): Promise<Uint8Array> {
    return this.content
  }

  public override async write(content: Uint8Array): Promise<void> {
    this.content = content
    this._onDidChange.fire()
  }
}

class RegisteredFileSystemProvider
  extends Disposable
  implements
    IFileSystemProviderWithFileReadWriteCapability,
    IFileSystemProviderWithOpenReadWriteCloseCapability,
    IFileSystemProviderWithFileReadStreamCapability,
    IFileSystemProviderWithFileAtomicReadCapability,
    IFileSystemProviderWithFileAtomicWriteCapability,
    IFileSystemProviderWithFileAtomicDeleteCapability
{
  private memoryFdCounter = 0
  private readonly fdMemory = new Map<number, Uint8Array>()
  private rootByAuthority: Map<string, RegisteredDirectoryNode>
  onDidChangeCapabilities = Event.None
  _onDidChangeFile = new Emitter<readonly IFileChange[]>()
  onDidChangeFile = this._onDidChangeFile.event

  capabilities: number
  constructor(readonly: boolean) {
    super()
    this.rootByAuthority = new Map()
    this.capabilities =
      FileSystemProviderCapabilities.FileReadWrite |
      FileSystemProviderCapabilities.PathCaseSensitive |
      FileSystemProviderCapabilities.FileReadStream
    if (readonly) {
      this.capabilities |= FileSystemProviderCapabilities.Readonly
    }
  }

  // file open/read/write/close
  async open(resource: URI): Promise<number> {
    const data = await this.readFile(resource)
    const fd = this.memoryFdCounter++
    this.fdMemory.set(fd, data)
    return fd
  }

  async close(fd: number): Promise<void> {
    this.fdMemory.delete(fd)
  }

  async read(
    fd: number,
    pos: number,
    data: Uint8Array,
    offset: number,
    length: number
  ): Promise<number> {
    const memory = this.fdMemory.get(fd)
    if (memory == null) {
      throw createFileSystemProviderError(
        'No file with that descriptor open',
        FileSystemProviderErrorCode.Unavailable
      )
    }

    const toWrite = VSBuffer.wrap(memory).slice(pos, pos + length)
    data.set(toWrite.buffer, offset)
    return toWrite.byteLength
  }

  write(
    fd: number,
    pos: number,
    data: Uint8Array,
    offset: number,
    length: number
  ): Promise<number> {
    const memory = this.fdMemory.get(fd)
    if (memory == null) {
      throw createFileSystemProviderError(
        'No file with that descriptor open',
        FileSystemProviderErrorCode.Unavailable
      )
    }

    const toWrite = VSBuffer.wrap(data).slice(offset, offset + length)
    memory.set(toWrite.buffer, pos)
    return Promise.resolve(toWrite.byteLength)
  }

  private _lookupRoot(authority: string) {
    const _authority = authority.toLowerCase()
    let root = this.rootByAuthority.get(_authority)
    if (root == null) {
      root = new RegisteredDirectory()
      this.rootByAuthority.set(_authority, root)
    }
    return root
  }

  private _lookup(uri: URI, silent: false): RegisteredNode
  private _lookup(uri: URI, silent: boolean): RegisteredNode | undefined
  private _lookup(uri: URI, silent: boolean): RegisteredNode | undefined {
    const parts = uri.path.split('/')
    const root = this._lookupRoot(uri.authority)

    let entry: RegisteredNode = root
    for (const part of parts) {
      if (part.length === 0) {
        continue
      }
      let child: RegisteredNode | undefined
      if (entry instanceof RegisteredDirectory) {
        child = entry.getChildren(part)
      }
      if (child == null) {
        if (!silent) {
          throw createFileSystemProviderError(
            'file not found',
            FileSystemProviderErrorCode.FileNotFound
          )
        } else {
          return undefined
        }
      }
      entry = child
    }
    return entry
  }

  private _lookupAsDirectory(uri: URI, silent: boolean): RegisteredDirectory {
    const entry = this._lookup(uri, silent)
    if (entry instanceof RegisteredDirectory) {
      return entry
    }
    throw createFileSystemProviderError(
      'file not a directory',
      FileSystemProviderErrorCode.FileNotADirectory
    )
  }

  private _lookupAsFile(uri: URI, silent: boolean): RegisteredFileNode {
    const entry = this._lookup(uri, silent)
    if (entry != null && entry.type === FileType.File) {
      return entry
    }
    throw createFileSystemProviderError(
      'file is a directory',
      FileSystemProviderErrorCode.FileIsADirectory
    )
  }

  public registerFile(file: RegisteredFileNode): IDisposable {
    // Create parent directory
    const parts = file.uri.path.split('/')
    let directory = this._lookupRoot(file.uri.authority)
    let uri = file.uri.with({ path: '/' })
    for (const part of parts.slice(0, -1)) {
      if (part === '') {
        continue
      }
      uri = extUri.joinPath(uri, part)

      let children = directory.getChildren(part)
      if (children == null) {
        const newDirectory = this.mkdirSync(uri)
        children = newDirectory
      }
      if (!(children instanceof RegisteredDirectory)) {
        throw new Error(`file '${uri.toString()}' is not a directory`)
      }
      directory = children
    }

    const name = parts[parts.length - 1]!
    if (directory.getChildren(name) != null) {
      throw new Error(`file '${extUri.joinPath(uri, name).toString()}/' already exists`)
    }
    const disposableStore = new DisposableStore()
    disposableStore.add(
      toDisposable(() => {
        this._fireSoon({
          resource: file.uri,
          type: FileChangeType.DELETED
        })
      })
    )
    disposableStore.add(
      file.onDidDelete(() => {
        disposableStore.dispose()
      })
    )
    disposableStore.add(
      file.onDidChange(() => {
        this._fireSoon({
          resource: file.uri,
          type: FileChangeType.UPDATED
        })
      })
    )
    disposableStore.add(directory.addChild(name, file))

    this._fireSoon({
      resource: file.uri,
      type: FileChangeType.ADDED
    })
    return disposableStore
  }

  async stat(resource: URI): Promise<IStat> {
    const node = this._lookup(resource, false)
    return await node.stats()
  }

  public readdirSync(resource: URI): [string, FileType][] {
    const directory = this._lookupAsDirectory(resource, false)
    return directory.read()
  }

  public async readdir(resource: URI): Promise<[string, FileType][]> {
    return this.readdirSync(resource)
  }

  async readFile(resource: URI): Promise<Uint8Array> {
    const file = this._lookupAsFile(resource, false)
    return await file.read()
  }

  readFileStream(
    resource: URI,
    opts: IFileReadStreamOptions,
    token: CancellationToken
  ): ReadableStreamEvents<Uint8Array> {
    const file = this._lookupAsFile(resource, false)

    // This function is greatly inspired from HtmlFileSystemProvider from VSCode
    const stream = newWriteableStream<Uint8Array>(
      (data) => VSBuffer.concat(data.map((data) => VSBuffer.wrap(data))).buffer,
      {
        highWaterMark: 10
      }
    )

    void (async () => {
      try {
        if (
          file.readStream == null ||
          typeof opts.length === 'number' ||
          typeof opts.position === 'number'
        ) {
          let buffer = await file.read()

          if (typeof opts.position === 'number' || typeof opts.length === 'number') {
            buffer = buffer.slice(opts.position ?? 0, opts.length)
          }

          stream.end(buffer)
        } else {
          const reader: ReadableStreamDefaultReader<Uint8Array> = (
            await file.readStream()
          ).getReader()

          let res = await reader.read()
          while (!res.done) {
            if (token.isCancellationRequested) {
              break
            }

            await stream.write(res.value)

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (token.isCancellationRequested) {
              break
            }

            res = await reader.read()
          }
          stream.end(undefined)
        }
      } catch (error) {
        stream.error(
          createFileSystemProviderError(error as Error, FileSystemProviderErrorCode.Unknown)
        )
        stream.end()
      }
    })()

    return stream
  }

  watch(): IDisposable {
    return Disposable.None
  }

  async writeFile(resource: URI, content: Uint8Array, opts: IFileWriteOptions): Promise<void> {
    const node = this._lookup(resource, true)
    if (node != null && !(node instanceof RegisteredFile)) {
      throw createFileSystemProviderError(
        'file is directory',
        FileSystemProviderErrorCode.FileIsADirectory
      )
    }
    if (node == null) {
      throw createFileSystemProviderError(
        'file not found',
        FileSystemProviderErrorCode.FileNotFound
      )
    }
    if (!opts.overwrite) {
      throw createFileSystemProviderError(
        'file exists already',
        FileSystemProviderErrorCode.FileExists
      )
    }
    await node.write(content)
  }

  async rename(): Promise<void> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  mkdirSync(resource: URI): RegisteredDirectoryNode {
    if (this._lookup(resource, true) != null) {
      throw createFileSystemProviderError(
        'file exists already',
        FileSystemProviderErrorCode.FileExists
      )
    }

    const basename = resources.basename(resource)
    const dirname = resources.dirname(resource)
    const parent = this._lookupAsDirectory(dirname, false)

    const directory = new RegisteredDirectory()
    const disposable = new DisposableStore()
    disposable.add(
      directory.onDidDelete(() => {
        disposable.dispose()
        this._fireSoon({
          resource,
          type: FileChangeType.DELETED
        })
      })
    )
    disposable.add(
      directory.onDidChange(() => {
        this._fireSoon({
          resource,
          type: FileChangeType.UPDATED
        })
      })
    )
    parent.addChild(basename, directory)
    this._fireSoon({ type: FileChangeType.ADDED, resource })
    return directory
  }

  async mkdir(): Promise<void> {
    throw createFileSystemProviderError(
      "Can' create a directory",
      FileSystemProviderErrorCode.NoPermissions
    )
  }

  private deleteSync(resource: URI): void {
    const node = this._lookup(resource, true)
    if (node == null) {
      throw createFileSystemProviderError('Not found', FileSystemProviderErrorCode.FileNotFound)
    } else if (node.type === FileType.Directory) {
      throw createFileSystemProviderError(
        "Can't delete a directory",
        FileSystemProviderErrorCode.NoPermissions
      )
    }
    node.delete()
  }

  async delete(resource: URI): Promise<void> {
    this.deleteSync(resource)
  }

  private _bufferedChanges: IFileChange[] = []
  private _fireSoonHandle?: number
  private _fireSoon(...changes: IFileChange[]): void {
    this._bufferedChanges.push(...changes)

    if (this._fireSoonHandle != null) {
      clearTimeout(this._fireSoonHandle)
      this._fireSoonHandle = undefined
    }

    this._fireSoonHandle = window.setTimeout(() => {
      this._onDidChangeFile.fire(this._bufferedChanges)
      this._bufferedChanges.length = 0
    }, 5)
  }
}

function isFullfiled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
  return result.status === 'fulfilled'
}

class OverlayFileSystemProvider
  implements
    IFileSystemProviderWithFileReadWriteCapability,
    IFileSystemProviderWithFileReadStreamCapability,
    IFileSystemProviderWithFileAtomicReadCapability,
    IFileSystemProviderWithFileAtomicWriteCapability,
    IFileSystemProviderWithFileAtomicDeleteCapability
{
  private providers: {
    priority: number
    provider: IFileSystemProviderWithFileReadWriteCapability
  }[] = []

  public register(
    priority: number,
    provider: IFileSystemProviderWithFileReadWriteCapability
  ): IDisposable {
    const item = { priority, provider }
    this.providers.push(item)
    this.providers.sort((a, b) => b.priority - a.priority)

    const disposableStore = new DisposableStore()
    disposableStore.add(
      provider.onDidChangeFile((e) => {
        this._onDidChangeFile.fire(e)
      })
    )
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

  get delegates(): IFileSystemProviderWithFileReadWriteCapability[] {
    return this.providers.map(({ provider }) => provider)
  }

  onDidChangeCapabilities = Event.None
  _onDidChangeFile = new Emitter<readonly IFileChange[]>()
  onDidChangeFile = this._onDidChangeFile.event

  _onDidChangeOverlays = new Emitter<void>()
  onDidChangeOverlays = this._onDidChangeOverlays.event

  capabilities =
    FileSystemProviderCapabilities.FileReadWrite |
    FileSystemProviderCapabilities.PathCaseSensitive |
    FileSystemProviderCapabilities.FileReadStream

  private async readFromDelegates<T>(
    caller: (delegate: IFileSystemProviderWithFileReadWriteCapability) => Promise<T>,
    token?: CancellationToken
  ) {
    if (this.delegates.length === 0) {
      throw createFileSystemProviderError('No delegate', FileSystemProviderErrorCode.Unavailable)
    }
    let firstError: unknown | undefined
    for (const delegate of this.delegates) {
      if (token != null && token.isCancellationRequested) {
        throw new Error('Cancelled')
      }
      try {
        return await caller(delegate)
      } catch (err) {
        firstError ??= err
        if (
          err instanceof FileSystemProviderError &&
          [
            FileSystemProviderErrorCode.NoPermissions,
            FileSystemProviderErrorCode.FileNotFound,
            FileSystemProviderErrorCode.Unavailable
          ].includes(err.code)
        ) {
          continue
        }
        throw err
      }
    }
    throw firstError
  }

  private async writeToDelegates(
    caller: (delegate: IFileSystemProviderWithFileReadWriteCapability) => Promise<void>
  ): Promise<void> {
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
        if (
          err instanceof FileSystemProviderError &&
          [
            FileSystemProviderErrorCode.NoPermissions,
            FileSystemProviderErrorCode.FileNotFound,
            FileSystemProviderErrorCode.Unavailable
          ].includes(err.code)
        ) {
          continue
        }
        throw err
      }
    }
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  async stat(resource: URI): Promise<IStat> {
    return await this.readFromDelegates(async (delegate) => {
      const result = await delegate.stat(resource)

      const readOnly = (delegate.capabilities & FileSystemProviderCapabilities.Readonly) > 0
      return {
        ...result,
        permissions: result.permissions ?? (readOnly ? FilePermission.Readonly : undefined)
      }
    })
  }

  async readFile(resource: URI): Promise<Uint8Array> {
    return await this.readFromDelegates((delegate) => delegate.readFile(resource))
  }

  readFileStream(
    resource: URI,
    opts: IFileReadStreamOptions,
    token: CancellationToken
  ): ReadableStreamEvents<Uint8Array> {
    const writableStream = newWriteableStream<Uint8Array>(
      (data) => VSBuffer.concat(data.map((data) => VSBuffer.wrap(data))).buffer
    )
    this.readFromDelegates(async (delegate) => {
      if (hasFileReadStreamCapability(delegate)) {
        const stream = delegate.readFileStream(resource, opts, token)
        await new Promise<void>((resolve, reject) => {
          let dataReceived = false
          listenStream(
            stream,
            {
              onData(data) {
                dataReceived = true
                void writableStream.write(data)
              },
              onEnd() {
                writableStream.end()
                resolve()
              },
              onError(err) {
                if (!dataReceived) {
                  reject(err)
                } else {
                  writableStream.error(err)
                }
              }
            },
            token
          )
        })
      } else {
        let data = await this.readFile(resource)
        if (typeof opts.position === 'number' || typeof opts.length === 'number') {
          data = data.slice(opts.position ?? 0, opts.length)
        }
        return writableStream.end(data)
      }
    }, token).catch((err) => {
      writableStream.error(err)
    })

    return writableStream
  }

  async readdir(resource: URI): Promise<[string, FileType][]> {
    const results = await Promise.allSettled(
      this.delegates.map(async (delegate) => await delegate.readdir(resource))
    )
    if (!results.some(isFullfiled)) {
      throw (results[0] as PromiseRejectedResult).reason
    }
    return Object.entries(
      Object.fromEntries(
        results
          .filter(isFullfiled)
          .map((result) => result.value)
          .flat()
      )
    )
  }

  watch(resource: URI, opts: IWatchOptions): IDisposable {
    const store = new DisposableStore()
    for (const delegate of this.delegates) {
      store.add(delegate.watch(resource, opts))
    }
    return store
  }

  async writeFile(resource: URI, content: Uint8Array, opts: IFileWriteOptions): Promise<void> {
    await this.writeToDelegates(async (delegate) => {
      let stats: IStat | undefined
      try {
        stats = await delegate.stat(resource)
      } catch (err) {
        // ignore
      }
      if (stats != null && ((stats.permissions ?? 0) & FilePermission.Readonly) > 0) {
        throw createFileSystemProviderError(
          'Not allowed',
          FileSystemProviderErrorCode.NoPermissions
        )
      }
      return await delegate.writeFile(resource, content, opts)
    })
  }

  async mkdir(resource: URI): Promise<void> {
    await this.writeToDelegates((delegate) => delegate.mkdir(resource))
  }

  async delete(resource: URI, opts: IFileDeleteOptions): Promise<void> {
    await this.writeToDelegates((delegate) => delegate.delete(resource, opts))
  }

  async rename(from: URI, to: URI, opts: IFileOverwriteOptions): Promise<void> {
    await this.writeToDelegates((delegate) => delegate.rename(from, to, opts))
  }
}

class MkdirpOnWriteInMemoryFileSystemProvider extends InMemoryFileSystemProvider {
  override async writeFile(
    resource: URI,
    content: Uint8Array,
    opts: IFileWriteOptions
  ): Promise<void> {
    // when using overlay providers, the fileservice won't be able to detect that the parent directory doesn't exist
    // if another provider has this directory. So it won't create the parent directories on this memory file system.
    await mkdirp(extUri, this, extUri.dirname(resource))

    return await super.writeFile(resource, content, opts)
  }
}

class DelegateFileSystemProvider implements IFileSystemProvider {
  constructor(
    private options: {
      delegate: IFileSystemProvider
      toDelegate: (uri: URI) => URI
      fromDeletate: (uri: URI) => URI
    }
  ) {}

  get capabilities(): FileSystemProviderCapabilities {
    return this.options.delegate.capabilities
  }

  onDidChangeCapabilities = this.options.delegate.onDidChangeCapabilities
  onDidChangeFile = Event.map(this.options.delegate.onDidChangeFile, (changes) =>
    changes.map((change) => ({
      type: change.type,
      resource: this.options.fromDeletate(change.resource)
    }))
  )

  readFile =
    this.options.delegate.readFile != null
      ? (resource: URI): Promise<Uint8Array> => {
          return this.options.delegate.readFile!(this.options.toDelegate(resource))
        }
      : undefined

  writeFile =
    this.options.delegate.writeFile != null
      ? (resource: URI, content: Uint8Array, opts: IFileWriteOptions): Promise<void> => {
          return this.options.delegate.writeFile!(this.options.toDelegate(resource), content, opts)
        }
      : undefined

  watch(resource: URI, opts: IWatchOptions): IDisposable {
    return this.options.delegate.watch(this.options.toDelegate(resource), opts)
  }

  stat(resource: URI): Promise<IStat> {
    return this.options.delegate.stat(this.options.toDelegate(resource))
  }

  mkdir(resource: URI): Promise<void> {
    return this.options.delegate.mkdir(this.options.toDelegate(resource))
  }

  readdir(resource: URI): Promise<[string, FileType][]> {
    return this.options.delegate.readdir(this.options.toDelegate(resource))
  }

  delete(resource: URI, opts: IFileDeleteOptions): Promise<void> {
    return this.options.delegate.delete(this.options.toDelegate(resource), opts)
  }

  rename(from: URI, to: URI, opts: IFileOverwriteOptions): Promise<void> {
    return this.options.delegate.rename(
      this.options.toDelegate(from),
      this.options.toDelegate(to),
      opts
    )
  }
}

class EmptyFileSystemProvider implements IFileSystemProviderWithFileReadWriteCapability {
  async readFile(): Promise<Uint8Array> {
    throw createFileSystemProviderError('Not found', FileSystemProviderErrorCode.FileNotFound)
  }

  async writeFile(): Promise<void> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  capabilities =
    FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.PathCaseSensitive

  onDidChangeCapabilities = Event.None
  onDidChangeFile = Event.None
  watch(): IDisposable {
    return Disposable.None
  }

  async stat(): Promise<IStat> {
    throw createFileSystemProviderError('Not found', FileSystemProviderErrorCode.FileNotFound)
  }

  async mkdir(): Promise<void> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  async readdir(): Promise<[string, FileType][]> {
    throw createFileSystemProviderError('Not found', FileSystemProviderErrorCode.FileNotFound)
  }

  async delete(): Promise<void> {
    throw createFileSystemProviderError('Not allowed', FileSystemProviderErrorCode.NoPermissions)
  }

  async rename(): Promise<void> {
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
  constructor(logService: ILogService, @ITelemetryService telemetryService: ITelemetryService) {
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
        this._register(
          provider.onReportError((e) =>
            telemetryService.publicLog2<
              IndexedDBFileSystemProviderErrorData,
              IndexedDBFileSystemProviderErrorDataClassification
            >('indexedDBFileSystemProviderError', e)
          )
        )
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

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IFileService.toString()]: new SyncDescriptor(FileServiceOverride, [fileLogger], true),
    [ITextFileService.toString()]: new SyncDescriptor(BrowserTextFileService, [], true),
    [IFilesConfigurationService.toString()]: new SyncDescriptor(
      FilesConfigurationService,
      [],
      true
    ),
    [IElevatedFileService.toString()]: new SyncDescriptor(BrowserElevatedFileService, [], true)
  }
}

/**
 * Register a custom file system provider for the given scheme. This allows us to override
 * the default file system provider for a given scheme.
 */
export function registerCustomProvider(scheme: string, provider: IFileSystemProvider): void {
  checkServicesNotInitialized()
  providers[scheme] = provider
}

export function registerExtensionFile(file: RegisteredFileNode): IDisposable {
  return extensionFileSystemProvider.registerFile(file)
}

/**
 * Can be used to create a file before the fileService is initialized
 */
export async function initFile(
  file: URI,
  content: Uint8Array | string,
  options?: Partial<IFileWriteOptions>
): Promise<void> {
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
      if (
        !(error instanceof FileSystemProviderError) ||
        error.code !== FileSystemProviderErrorCode.FileNotFound
      ) {
        console.error('Unable to check if file exists', error)
      }
      // File not found, write it
    }
  }

  await provider.writeFile(file, encode(content), {
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
export async function createIndexedDBProviders(): Promise<IndexedDBFileSystemProvider> {
  indexedDB = await IndexedDB.create('vscode-web-db', 3, [userDataStore, logsStore, handlesStore])

  // Logger
  registerCustomProvider(
    logsPath.scheme,
    new IndexedDBFileSystemProvider(logsPath.scheme, indexedDB, logsStore, false)
  )

  const userDataProvider = new IndexedDBFileSystemProvider(
    Schemas.vscodeUserData,
    indexedDB,
    userDataStore,
    true
  )
  registerCustomProvider(Schemas.vscodeUserData, userDataProvider)

  return userDataProvider
}

/**
 * Can be used to replace the default filesystem provider by the HTMLFileSystemProvider before the fileService is initialized
 * Should be called "after" createIndexedDBProviders if used
 */
export function registerHTMLFileSystemProvider(): void {
  class LazyLogService implements ILogService {
    _serviceBrand: undefined
    get onDidChangeLogLevel() {
      return StandaloneServices.get(ILogService).onDidChangeLogLevel
    }

    getLevel(): LogLevel {
      return StandaloneServices.get(ILogService).getLevel()
    }

    setLevel(level: LogLevel): void {
      StandaloneServices.get(ILogService).setLevel(level)
    }

    trace(message: string, ...args: any[]): void {
      StandaloneServices.get(ILogService).trace(message, ...args)
    }

    debug(message: string, ...args: any[]): void {
      StandaloneServices.get(ILogService).debug(message, ...args)
    }

    info(message: string, ...args: any[]): void {
      StandaloneServices.get(ILogService).info(message, ...args)
    }

    warn(message: string, ...args: any[]): void {
      StandaloneServices.get(ILogService).warn(message, ...args)
    }

    error(message: string | Error, ...args: any[]): void {
      StandaloneServices.get(ILogService).error(message, ...args)
    }

    flush(): void {
      StandaloneServices.get(ILogService).flush()
    }

    dispose(): void {
      StandaloneServices.get(ILogService).dispose()
    }
  }
  registerCustomProvider(
    Schemas.file,
    new HTMLFileSystemProvider(indexedDB, handlesStore, new LazyLogService())
  )
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
export function registerFileSystemOverlay(
  priority: number,
  provider: IFileSystemProviderWithFileReadWriteCapability
): IDisposable {
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
  RegisteredUriFile,
  RegisteredMemoryFile,
  DelegateFileSystemProvider,
  OverlayFileSystemProvider,
  EmptyFileSystemProvider
}
