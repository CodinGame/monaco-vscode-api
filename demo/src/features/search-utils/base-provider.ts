import { IFileService, ILogService } from '@codingame/monaco-vscode-api'
import {
  FileChangeType,
  IFileStat,
  IFileChange
} from '@codingame/monaco-vscode-api/vscode/vs/platform/files/common/files'
import * as glob from '@codingame/monaco-vscode-api/vscode/vs/base/common/glob'
import { URI } from '@codingame/monaco-vscode-api/vscode/vs/base/common/uri'
import * as vscode from 'vscode'
import { SearchConfig, DEFAULT_CONFIG, MAX_CACHED_FILES, MAX_DIRECTORY_DEPTH } from './types'

/**
 * Base class for common functionality shared between search providers
 */
export abstract class BaseWorkspaceSearchProvider {
  protected config: SearchConfig
  protected cachedFiles: Set<vscode.Uri> = new Set()
  protected fileService: IFileService
  protected isInitialized = false
  protected changeBuffer: IFileChange[] = []
  protected debounceTimer?: NodeJS.Timeout

  constructor(
    fileService: IFileService,
    protected logger: ILogService,
    config: Partial<SearchConfig> = {}
  ) {
    this.fileService = fileService
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initializeProvider()
  }

  protected async initializeProvider(): Promise<void> {
    if (this.isInitialized) {
      this.logger.debug('Search provider already initialized, skipping')
      return
    }

    try {
      this.logger.info('Initializing search provider...')
      await this.initCache()
      this.isInitialized = true
      this.fileService.onDidFilesChange(this.handleFileChanges, this)
      this.logger.info('Search provider initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize search provider', error as Error)
      throw new Error('Failed to initialize search provider')
    }
  }

  protected async initCache(): Promise<void> {
    this.logger.debug('Initializing file cache')
    this.cachedFiles.clear()

    let folders: readonly vscode.WorkspaceFolder[] = []
    try {
      folders = vscode.workspace.workspaceFolders || []
      this.logger.debug(`Found ${folders.length} workspace folders`)
    } catch (error) {
      this.logger.error('Error accessing workspace folders:', error as Error)
      return
    }

    if (folders.length === 0) {
      this.logger.warn('No workspace folders found')
      return
    }

    try {
      await Promise.all(folders.map((folder) => this.indexFolder(folder.uri)))
      this.logger.info(`Cache initialized with ${this.cachedFiles.size} files`)
    } catch (error) {
      this.logger.error('Error indexing folders:', error as Error)
    }
  }

  protected async resolveAndCollectDirectory(dirUri: vscode.Uri, depth: number = 0): Promise<void> {
    try {
      if (!dirUri) {
        this.logger.warn('Invalid directory URI provided for resolution')
        return
      }

      this.logger.debug(`Resolving directory: ${dirUri.fsPath}`)
      const stats = await this.fileService.resolve(dirUri)

      if (!stats) {
        this.logger.warn(`Could not resolve directory: ${dirUri.fsPath}`)
        return
      }

      this.collectFiles(stats, depth)
    } catch (error) {
      this.logger.warn(`Failed to resolve directory ${dirUri?.fsPath || 'unknown'}`, error as Error)
    }
  }

  protected async indexFolder(folderUri: vscode.Uri): Promise<void> {
    try {
      if (!folderUri) {
        this.logger.warn('Invalid folder URI provided for indexing')
        return
      }

      this.logger.debug(`Indexing folder: ${folderUri.fsPath}`)
      const stats = await this.fileService.resolve(folderUri)

      if (!stats) {
        this.logger.warn(`Could not resolve folder: ${folderUri.fsPath}`)
        return
      }

      this.collectFiles(stats, 0)
    } catch (error) {
      this.logger.warn(`Failed to index folder ${folderUri?.fsPath || 'unknown'}`, error as Error)
    }
  }

  protected collectFiles(entry: IFileStat, depth: number = 0): void {
    try {
      if (depth > MAX_DIRECTORY_DEPTH) {
        this.logger.warn(
          `Maximum directory depth ${MAX_DIRECTORY_DEPTH} reached at ${entry?.resource?.fsPath || 'unknown'}`
        )
        return
      }

      if (this.cachedFiles.size > MAX_CACHED_FILES) {
        this.logger.warn(
          `Maximum cached files limit ${MAX_CACHED_FILES} reached, stopping indexing`
        )
        return
      }

      if (!entry || !entry.resource) {
        this.logger.warn('Invalid file entry provided to collectFiles')
        return
      }

      if (this.shouldExclude(entry.resource.fsPath, this.config.excludePatterns)) {
        return
      }

      if (!this.config.includeHiddenFiles && this.isHiddenFile(entry.resource)) {
        return
      }

      if (entry.isFile) {
        if (entry.resource && entry.resource.fsPath && entry.resource.scheme) {
          this.cachedFiles.add(entry.resource)
        } else {
          this.logger.warn(`Skipping invalid file URI:`, entry.resource)
        }
      } else {
        if (!entry.resource) {
          this.logger.warn('Directory entry without resource:', entry)
        }

        if (entry.children) {
          for (const child of entry.children) {
            if (child.isDirectory && child.resource) {
              this.resolveAndCollectDirectory(child.resource, depth + 1)
            } else {
              this.collectFiles(child, depth)
            }
          }
        }
      }
    } catch (error) {
      const path = entry?.resource?.fsPath || 'unknown'
      this.logger.error(`Error collecting file ${path}`, error as Error)
    }
  }

  protected isHiddenFile(uri: URI): boolean {
    const pathParts = uri.fsPath.split(/[/\\]/)
    const fileName = pathParts[pathParts.length - 1]

    // Only consider the file itself hidden if its name starts with a dot
    // This allows files in hidden directories (like .vscode/settings.json) to be included
    // when includeHiddenFiles is true
    return fileName?.startsWith('.') ?? false
  }

  protected handleFileChanges = (e: {
    rawAdded?: vscode.Uri[]
    rawUpdated?: vscode.Uri[]
    rawDeleted?: vscode.Uri[]
  }): void => {
    this.bufferChanges(e)

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(() => {
      this.processBufferedChanges()
    }, this.config.debounceDelay)
  }

  protected bufferChanges(e: {
    rawAdded?: vscode.Uri[]
    rawUpdated?: vscode.Uri[]
    rawDeleted?: vscode.Uri[]
  }): void {
    e.rawAdded?.forEach((uri: vscode.Uri) => {
      this.changeBuffer.push({ type: FileChangeType.ADDED, resource: URI.parse(uri.toString()) })
    })

    e.rawUpdated?.forEach((uri: vscode.Uri) => {
      this.changeBuffer.push({ type: FileChangeType.UPDATED, resource: URI.parse(uri.toString()) })
    })

    e.rawDeleted?.forEach((uri: vscode.Uri) => {
      this.changeBuffer.push({ type: FileChangeType.DELETED, resource: URI.parse(uri.toString()) })
    })
  }

  protected processBufferedChanges(): void {
    if (this.changeBuffer.length === 0) return

    this.logger.debug(`Processing ${this.changeBuffer.length} file changes`)

    for (const change of this.changeBuffer) {
      try {
        this.applyFileChange(change)
      } catch (error) {
        this.logger.error(
          `Error processing file change for ${change.resource.fsPath}`,
          error as Error
        )
      }
    }

    this.changeBuffer.length = 0 // Clear buffer
    this.logger.debug(`File cache updated. Total files: ${this.cachedFiles.size}`)
  }

  protected applyFileChange(change: IFileChange): void {
    switch (change.type) {
      case FileChangeType.ADDED:
        if (
          !this.shouldExclude(change.resource.fsPath, this.config.excludePatterns) &&
          (this.config.includeHiddenFiles || !this.isHiddenFile(change.resource))
        ) {
          this.cachedFiles.add(vscode.Uri.parse(change.resource.toString()))
        }
        break

      case FileChangeType.DELETED:
        this.cachedFiles.delete(vscode.Uri.parse(change.resource.toString()))
        break

      case FileChangeType.UPDATED: {
        const updatedUri = vscode.Uri.parse(change.resource.toString())
        if (
          this.cachedFiles.has(updatedUri) &&
          this.shouldExclude(change.resource.fsPath, this.config.excludePatterns)
        ) {
          this.cachedFiles.delete(updatedUri)
        }
        break
      }
    }
  }

  protected async isWithinSizeLimit(uri: URI): Promise<boolean> {
    try {
      const stats = await this.fileService.resolve(uri)
      return (stats.size ?? 0) <= this.config.maxFileSize
    } catch {
      return false
    }
  }

  protected shouldExclude(path: string, excludePatterns: string[]): boolean {
    return excludePatterns.some((pattern) => glob.match(pattern, path))
  }
}
