import { IFileService } from '@codingame/monaco-vscode-api'
import {
  FileChangeType,
  IFileStat
} from '@codingame/monaco-vscode-api/vscode/vs/platform/files/common/files'
import * as vscode from 'vscode'
import {
  SearchConfig,
  FileChange,
  DEFAULT_CONFIG,
  MAX_CACHED_FILES,
  MAX_DIRECTORY_DEPTH
} from './types'
import { PatternMatcher } from './pattern-matcher'
import { SearchError, SearchLogger } from './errors'

/**
 * Base class for common functionality shared between search providers
 */
export abstract class BaseWorkspaceSearchProvider {
  protected config: SearchConfig
  protected cachedFiles: Set<vscode.Uri> = new Set()
  protected fileService: IFileService
  protected isInitialized = false
  protected changeBuffer: FileChange[] = []
  protected debounceTimer?: NodeJS.Timeout

  constructor(fileService: IFileService, config: Partial<SearchConfig> = {}) {
    this.fileService = fileService
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initializeProvider()
  }

  protected async initializeProvider(): Promise<void> {
    // Prevent multiple initializations
    if (this.isInitialized) {
      SearchLogger.debug('Search provider already initialized, skipping')
      return
    }

    try {
      SearchLogger.info('Initializing search provider...')
      await this.initCache()
      this.isInitialized = true
      this.fileService.onDidFilesChange(this.handleFileChanges, this)
      SearchLogger.info('Search provider initialized successfully')
    } catch (error) {
      SearchLogger.error('Failed to initialize search provider', error as Error)
      throw new SearchError('Failed to initialize search provider', 'INIT_FAILED', error as Error)
    }
  }

  protected async initCache(): Promise<void> {
    SearchLogger.debug('Initializing file cache')
    this.cachedFiles.clear()

    // Safely access workspace folders with additional checks
    let folders: readonly vscode.WorkspaceFolder[] = []
    try {
      folders = vscode.workspace.workspaceFolders || []
      SearchLogger.debug(`Found ${folders.length} workspace folders`)
    } catch (error) {
      SearchLogger.error('Error accessing workspace folders:', error as Error)
      return
    }

    if (folders.length === 0) {
      SearchLogger.warn('No workspace folders found')
      return
    }

    try {
      await Promise.all(folders.map((folder) => this.indexFolder(folder.uri)))
      SearchLogger.info(`Cache initialized with ${this.cachedFiles.size} files`)
    } catch (error) {
      SearchLogger.error('Error indexing folders:', error as Error)
    }
  }

  protected async resolveAndCollectDirectory(dirUri: vscode.Uri, depth: number = 0): Promise<void> {
    try {
      if (!dirUri) {
        SearchLogger.warn('Invalid directory URI provided for resolution')
        return
      }

      SearchLogger.debug(`Resolving directory: ${dirUri.fsPath}`)
      const stats = await this.fileService.resolve(dirUri)

      if (!stats) {
        SearchLogger.warn(`Could not resolve directory: ${dirUri.fsPath}`)
        return
      }

      this.collectFiles(stats, depth)
      SearchLogger.debug(`Successfully resolved directory: ${dirUri.fsPath}`)
    } catch (error) {
      SearchLogger.warn(
        `Failed to resolve directory ${dirUri?.fsPath || 'unknown'}`,
        error as Error
      )
    }
  }

  protected async indexFolder(folderUri: vscode.Uri): Promise<void> {
    try {
      if (!folderUri) {
        SearchLogger.warn('Invalid folder URI provided for indexing')
        return
      }

      SearchLogger.debug(`Indexing folder: ${folderUri.fsPath}`)
      const stats = await this.fileService.resolve(folderUri)

      if (!stats) {
        SearchLogger.warn(`Could not resolve folder: ${folderUri.fsPath}`)
        return
      }

      this.collectFiles(stats, 0)
      SearchLogger.debug(`Successfully indexed folder: ${folderUri.fsPath}`)
    } catch (error) {
      SearchLogger.warn(`Failed to index folder ${folderUri?.fsPath || 'unknown'}`, error as Error)
    }
  }

  protected collectFiles(entry: IFileStat, depth: number = 0): void {
    try {
      // Check depth limit to prevent infinite recursion
      if (depth > MAX_DIRECTORY_DEPTH) {
        SearchLogger.warn(
          `Maximum directory depth ${MAX_DIRECTORY_DEPTH} reached at ${entry?.resource?.fsPath || 'unknown'}`
        )
        return
      }

      // Check cache size limit
      if (this.cachedFiles.size > MAX_CACHED_FILES) {
        SearchLogger.warn(
          `Maximum cached files limit ${MAX_CACHED_FILES} reached, stopping indexing`
        )
        return
      }

      // Validate entry
      if (!entry || !entry.resource) {
        SearchLogger.warn('Invalid file entry provided to collectFiles')
        return
      }

      // Check exclude patterns first
      if (PatternMatcher.shouldExclude(entry.resource.fsPath, this.config.excludePatterns)) {
        return
      }

      // Skip hidden files if configured
      if (!this.config.includeHiddenFiles && this.isHiddenFile(entry.resource)) {
        return
      }

      if (entry.isFile) {
        // Validate URI before caching
        if (entry.resource && entry.resource.fsPath && entry.resource.scheme) {
          this.cachedFiles.add(entry.resource)
        } else {
          SearchLogger.warn(`Skipping invalid file URI:`, entry.resource)
        }
      } else {
        // Also cache directories so they can be found in searches
        // Only cache if it's a valid directory with proper URI
        if (entry.resource && entry.resource.fsPath && entry.resource.scheme && !entry.isFile) {
          this.cachedFiles.add(entry.resource)
          SearchLogger.debug(`Cached directory: ${entry.resource.fsPath}`)
        } else if (!entry.resource) {
          SearchLogger.warn('Directory entry without resource:', entry)
        }

        if (entry.children) {
          for (const child of entry.children) {
            // For directories, resolve them to get their children
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
      SearchLogger.error(`Error collecting file ${path}`, error as Error)
    }
  }

  protected isHiddenFile(uri: vscode.Uri): boolean {
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
    // Batch file changes for better performance
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
    // Add all added files
    e.rawAdded?.forEach((uri: vscode.Uri) => {
      this.changeBuffer.push({ type: FileChangeType.ADDED, resource: uri })
    })

    // Add all updated files
    e.rawUpdated?.forEach((uri: vscode.Uri) => {
      this.changeBuffer.push({ type: FileChangeType.UPDATED, resource: uri })
    })

    // Add all deleted files
    e.rawDeleted?.forEach((uri: vscode.Uri) => {
      this.changeBuffer.push({ type: FileChangeType.DELETED, resource: uri })
    })
  }

  protected processBufferedChanges(): void {
    if (this.changeBuffer.length === 0) return

    SearchLogger.debug(`Processing ${this.changeBuffer.length} file changes`)

    for (const change of this.changeBuffer) {
      try {
        this.applyFileChange(change)
      } catch (error) {
        SearchLogger.error(
          `Error processing file change for ${change.resource.fsPath}`,
          error as Error
        )
      }
    }

    this.changeBuffer.length = 0 // Clear buffer
    SearchLogger.debug(`File cache updated. Total files: ${this.cachedFiles.size}`)
  }

  protected applyFileChange(change: FileChange): void {
    switch (change.type) {
      case FileChangeType.ADDED:
        // Only add if it matches our inclusion criteria
        if (
          !PatternMatcher.shouldExclude(change.resource.fsPath, this.config.excludePatterns) &&
          (this.config.includeHiddenFiles || !this.isHiddenFile(change.resource))
        ) {
          this.cachedFiles.add(change.resource)
        }
        break

      case FileChangeType.DELETED:
        this.cachedFiles.delete(change.resource)
        break

      case FileChangeType.UPDATED:
        // For updates, we could re-validate the file, but for now just ensure it's still cached
        if (
          this.cachedFiles.has(change.resource) &&
          PatternMatcher.shouldExclude(change.resource.fsPath, this.config.excludePatterns)
        ) {
          this.cachedFiles.delete(change.resource)
        }
        break
    }
  }

  protected isWithinSizeLimit(uri: vscode.Uri): Promise<boolean> {
    return new Promise((resolve) => {
      this.fileService
        .resolve(uri)
        .then((stats) => {
          resolve((stats.size ?? 0) <= this.config.maxFileSize)
        })
        .catch(() => resolve(false))
    })
  }
}
