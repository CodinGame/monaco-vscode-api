import {
  DEFAULT_CONFIG,
  MAX_CACHED_FILES,
  MAX_DIRECTORY_DEPTH,
  type SearchConfig,
  getSearchConfigFromVSCode
} from './config'
import type { IFileService } from 'vs/platform/files/common/files.service'
import type { ILogService } from 'vs/platform/log/common/log.service'
import type { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace.service'
import { IConfigurationService } from 'vs/platform/configuration/common/configuration.service'
import type { FileChangesEvent, IFileStat } from 'vs/platform/files/common/files'
import * as glob from 'vs/base/common/glob'
import { URI } from 'vs/base/common/uri'

/**
 * Base class providing common functionality for workspace search providers.
 * Handles file indexing, caching, and change tracking across workspace folders.
 */
export abstract class BaseWorkspaceSearchProvider {
  protected readonly config: SearchConfig
  protected readonly cachedFiles: Set<URI> = new Set()
  protected readonly fileService: IFileService
  protected readonly logger: ILogService
  protected readonly workspaceFolders: URI[] = []
  protected isInitialized = false

  /**
   * Creates a new BaseWorkspaceSearchProvider instance
   * @param fileService - File service for file operations
   * @param logger - Logger service for diagnostic messages
   * @param workspaceContextService - Optional workspace context service
   * @param config - Optional partial configuration to override defaults
   * @param configurationService - Optional VS Code configuration service for getting exclude patterns
   */
  constructor(
    fileService: IFileService,
    logger: ILogService,
    workspaceContextService?: IWorkspaceContextService,
    config?: Partial<SearchConfig>,
    configurationService?: IConfigurationService
  ) {
    this.fileService = fileService
    this.logger = logger

    // Extract workspace folders first
    this.workspaceFolders = this.extractWorkspaceFolders(workspaceContextService)

    // Get configuration from VS Code where available
    const resource = this.workspaceFolders.length > 0 ? this.workspaceFolders[0] : undefined
    const vscodeConfig = getSearchConfigFromVSCode(configurationService, resource)

    this.config = {
      ...DEFAULT_CONFIG,
      ...vscodeConfig, // Apply VS Code configuration first
      ...config // Then apply any explicit overrides
    }

    this.initializeProvider()
  }

  /**
   * Extracts workspace folders from the context service
   * @param workspaceContextService - The workspace context service
   * @returns Array of workspace folder URIs
   */
  private extractWorkspaceFolders(workspaceContextService?: IWorkspaceContextService): URI[] {
    if (!workspaceContextService) {
      return []
    }

    try {
      const workspace = workspaceContextService.getWorkspace()
      return workspace?.folders?.map((folder) => folder.uri) ?? []
    } catch (error) {
      this.logger.warn('Failed to get workspace folders from context service:', error as Error)
      return []
    }
  }

  /**
   * Initializes the search provider by setting up the file cache and event listeners
   */
  protected async initializeProvider(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      await this.initializeFileCache()
      this.setupFileChangeListener()
      this.isInitialized = true
    } catch (error) {
      this.logger.error('Failed to initialize search provider', error as Error)
      throw new Error('Failed to initialize search provider')
    }
  }

  /**
   * Initializes the file cache by indexing all workspace folders
   */
  protected async initializeFileCache(): Promise<void> {
    this.cachedFiles.clear()

    if (this.workspaceFolders.length === 0) {
      return
    }

    try {
      await this.indexWorkspaceFolders()
    } catch (error) {
      this.logger.error('Error indexing folders:', error as Error)
    }
  }

  /**
   * Indexes all workspace folders concurrently
   */
  private async indexWorkspaceFolders(): Promise<void> {
    const indexingPromises = this.workspaceFolders.map((folderUri) => this.indexFolder(folderUri))
    await Promise.all(indexingPromises)
  }

  /**
   * Sets up the file change event listener
   */
  private setupFileChangeListener(): void {
    this.fileService.onDidFilesChange(this.handleFileChanges, this)
  }

  /**
   * Resolves a directory and collects its files
   * @param dirUri - The directory URI to resolve
   * @param depth - Current directory depth for recursion limiting
   */
  protected async resolveAndCollectDirectory(dirUri: URI, depth: number = 0): Promise<void> {
    if (!this.isValidUri(dirUri)) {
      return
    }

    try {
      const stats = await this.fileService.resolve(dirUri)

      if (!stats) {
        return
      }

      await this.collectFiles(stats, depth)
    } catch (error) {
      this.logger.warn(`Failed to resolve directory ${dirUri?.fsPath || 'unknown'}`, error as Error)
    }
  }

  /**
   * Indexes a specific folder by resolving and collecting its files
   * @param folderUri - The folder URI to index
   */
  protected async indexFolder(folderUri: URI): Promise<void> {
    if (!this.isValidUri(folderUri)) {
      return
    }

    try {
      const stats = await this.fileService.resolve(folderUri)

      if (!stats) {
        return
      }

      await this.collectFiles(stats, 0)
    } catch (error) {
      this.logger.warn(`Failed to index folder ${folderUri?.fsPath || 'unknown'}`, error as Error)
    }
  }

  /**
   * Recursively collects files from a directory entry
   * @param entry - The file stat entry to process
   * @param depth - Current recursion depth
   */
  protected async collectFiles(entry: IFileStat, depth: number = 0): Promise<void> {
    try {
      if (!this.shouldProcessEntry(entry, depth)) {
        return
      }

      if (entry.isFile) {
        await this.processFileEntry(entry)
      } else {
        await this.processDirectoryEntry(entry, depth)
      }
    } catch (error) {
      const path = entry?.resource?.fsPath || 'unknown'
      this.logger.error(`Error collecting file ${path}`, error as Error)
    }
  }

  /**
   * Determines if an entry should be processed based on limits and filters
   * @param entry - The file stat entry
   * @param depth - Current recursion depth
   * @returns True if the entry should be processed
   */
  private shouldProcessEntry(entry: IFileStat, depth: number): boolean {
    if (depth > MAX_DIRECTORY_DEPTH) {
      return false
    }

    if (this.cachedFiles.size > MAX_CACHED_FILES) {
      return false
    }

    if (!entry?.resource) {
      return false
    }

    if (this.shouldExclude(entry.resource.fsPath, this.config.excludePatterns)) {
      return false
    }

    if (!this.config.includeHiddenFiles && this.isHiddenFile(entry.resource)) {
      return false
    }

    return true
  }

  /**
   * Processes a file entry and adds it to cache if valid
   * @param entry - The file stat entry
   */
  private async processFileEntry(entry: IFileStat): Promise<void> {
    if (!this.isValidFileEntry(entry)) {
      return
    }

    if (entry.resource!.scheme !== 'file') {
      return
    }

    if (this.isWithinFileSizeLimit(entry)) {
      this.cachedFiles.add(entry.resource!)
    }
  }

  /**
   * Processes a directory entry and recursively collects its children
   * @param entry - The directory stat entry
   * @param depth - Current recursion depth
   */
  private async processDirectoryEntry(entry: IFileStat, depth: number): Promise<void> {
    if (!entry.resource || !entry.children) {
      return
    }

    const childProcessingPromises = entry.children.map(async (child) => {
      if (child.isDirectory && child.resource) {
        await this.resolveAndCollectDirectory(child.resource, depth + 1)
      } else {
        await this.collectFiles(child, depth)
      }
    })

    await Promise.all(childProcessingPromises)
  }

  /**
   * Validates if a URI is properly formed
   * @param uri - The URI to validate
   * @returns True if the URI is valid
   */
  private isValidUri(uri: URI): boolean {
    return Boolean(uri && uri.fsPath && uri.scheme)
  }

  /**
   * Validates if a file entry has required properties
   * @param entry - The file stat entry
   * @returns True if the file entry is valid
   */
  private isValidFileEntry(entry: IFileStat): boolean {
    return Boolean(entry.resource?.fsPath && entry.resource?.scheme)
  }

  /**
   * Checks if a file is within the configured size limit
   * @param entry - The file stat entry
   * @returns True if the file is within size limits
   */
  private isWithinFileSizeLimit(entry: IFileStat): boolean {
    if (!entry.size) {
      return true
    }

    return entry.size <= this.config.maxFileSize
  }

  /**
   * Determines if a file is hidden based on its name
   * @param uri - The file URI
   * @returns True if the file is hidden
   */
  protected isHiddenFile(uri: URI): boolean {
    const pathParts = uri.fsPath.split(/[/\\]/)
    const fileName = pathParts[pathParts.length - 1]
    return fileName?.startsWith('.') ?? false
  }

  /**
   * Handles file system change events
   * @param e - The file changes event
   */
  protected handleFileChanges = (e: FileChangesEvent): void => {
    this.processFileChanges(e)
  }

  /**
   * Processes file system changes and updates the cache accordingly
   * @param e - The file changes event
   */
  protected processFileChanges(e: FileChangesEvent): void {
    const totalChanges = this.calculateTotalChanges(e)
    if (totalChanges === 0) return

    this.processFileChangesByType(e)
  }

  /**
   * Calculates the total number of file changes
   * @param e - The file changes event
   * @returns Total number of changes
   */
  private calculateTotalChanges(e: FileChangesEvent): number {
    return (e.rawAdded?.length || 0) + (e.rawUpdated?.length || 0) + (e.rawDeleted?.length || 0)
  }

  /**
   * Processes file changes by type (added, updated, deleted)
   * @param e - The file changes event
   */
  private processFileChangesByType(e: FileChangesEvent): void {
    this.processAddedFiles(e.rawAdded)
    this.processUpdatedFiles(e.rawUpdated)
    this.processDeletedFiles(e.rawDeleted)
  }

  /**
   * Processes newly added files
   * @param uris - Array of added file URIs
   */
  private processAddedFiles(uris?: URI[]): void {
    this.processFilesByScheme(uris, 'add', (uri) => {
      if (this.shouldIncludeFile(uri)) {
        this.cachedFiles.add(uri)
      }
    })
  }

  /**
   * Processes updated files
   * @param uris - Array of updated file URIs
   */
  private processUpdatedFiles(uris?: URI[]): void {
    this.processFilesByScheme(uris, 'update', (uri) => {
      if (this.cachedFiles.has(uri)) {
        if (this.shouldExclude(uri.fsPath, this.config.excludePatterns)) {
          this.cachedFiles.delete(uri)
        }
      } else if (this.shouldIncludeFile(uri)) {
        this.cachedFiles.add(uri)
      }
    })
  }

  /**
   * Processes deleted files
   * @param uris - Array of deleted file URIs
   */
  private processDeletedFiles(uris?: URI[]): void {
    this.processFilesByScheme(uris, 'delete', (uri) => {
      if (this.cachedFiles.has(uri)) {
        this.cachedFiles.delete(uri)
      }
    })
  }

  /**
   * Processes files by filtering for file scheme and applying an action
   * @param uris - Array of URIs to process
   * @param operation - The operation being performed
   * @param action - The action to apply to each URI
   */
  private processFilesByScheme(
    uris: URI[] | undefined,
    operation: string,
    action: (uri: URI) => void
  ): void {
    uris
      ?.filter((uri) => uri.scheme === 'file')
      .forEach((uri) => {
        this.executeFileOperation(uri, operation, action)
      })
  }

  /**
   * Safely executes a file operation with error handling
   * @param uri - The file URI
   * @param operation - The operation name for logging
   * @param action - The action to execute
   */
  private executeFileOperation(uri: URI, operation: string, action: (uri: URI) => void): void {
    try {
      action(uri)
    } catch (error) {
      this.logger.error(`Error processing ${operation} file ${uri.fsPath}`, error as Error)
    }
  }

  /**
   * Determines if a file should be included in the cache
   * @param uri - The file URI
   * @returns True if the file should be included
   */
  private shouldIncludeFile(uri: URI): boolean {
    if (uri.scheme !== 'file') {
      return false
    }

    return (
      !this.shouldExclude(uri.fsPath, this.config.excludePatterns) &&
      (this.config.includeHiddenFiles || !this.isHiddenFile(uri))
    )
  }

  /**
   * Determines if a path should be excluded based on glob patterns
   * @param path - The file path to check
   * @param excludePatterns - Array of glob patterns
   * @returns True if the path should be excluded
   */
  protected shouldExclude(path: string, excludePatterns: string[]): boolean {
    return excludePatterns.some((pattern) => glob.match(pattern, path))
  }
}
