import { BaseWorkspaceSearchProvider } from '../search-utils/base-provider'
import { fuzzyContains, splitLines } from 'vs/base/common/strings'
import type { URI } from 'vs/base/common/uri'
import * as glob from 'vs/base/common/glob'
import type {
  ISearchResultProvider,
  IFileQuery,
  ITextQuery,
  ISearchComplete,
  ISearchProgressItem,
  ITextSearchResult,
  ITextSearchCompleteMessage
} from 'vs/workbench/services/search/common/search'
import {
  FileMatch,
  SearchError,
  SearchErrorCode,
  deserializeSearchError,
  TextSearchCompleteMessageType,
  TextSearchMatch
} from 'vs/workbench/services/search/common/search'
import { Range } from 'vs/editor/common/core/range'
import { CancellationToken } from 'vs/base/common/cancellation'
import { SearchCompletionExitCode } from 'vs/workbench/services/search/common/search'

/**
 * Checks if a file path matches a pattern using fuzzy or exact matching
 * @param path - The file path to check
 * @param filePatternToUse - The pattern to match against
 * @param fuzzy - Whether to use fuzzy matching
 * @returns True if the path matches the pattern
 */
function isFilePatternMatch(path: string, filePatternToUse: string, fuzzy = true): boolean {
  return fuzzy ? fuzzyContains(path, filePatternToUse) : glob.match(filePatternToUse, path)
}

/**
 * Workspace search provider implementation that integrates with VSCode's native search system.
 * Uses VSCode's TextSearchMatch class and follows the exact same patterns as the native ripgrep engine.
 */
export class WorkspaceSearchProvider
  extends BaseWorkspaceSearchProvider
  implements ISearchResultProvider
{
  /**
   * Gets the AI search provider name
   * @returns Promise resolving to undefined as this provider doesn't support AI search
   */
  async getAIName(): Promise<string | undefined> {
    return undefined
  }

  /**
   * Performs text search across the workspace using VSCode's native search patterns.
   * Uses the exact same approach as VSCode's ripgrep engine for maximum compatibility.
   * @param query - The text search query
   * @param onProgress - Progress callback for real-time updates
   * @param token - Cancellation token for search interruption
   * @returns Promise resolving to search results
   */
  async textSearch(
    query: ITextQuery,
    onProgress?: (p: ISearchProgressItem) => void,
    token?: CancellationToken
  ): Promise<ISearchComplete> {
    if (!this.isInitialized) {
      throw new Error('Search provider not initialized')
    }

    if (!this.fileService) {
      this.logger.error('File service not available for text search')
      throw new Error('File service not available')
    }

    const resultsLimit = query.maxResults || this.config.maxResults
    let resultsCount = 0
    const fileMatches: Array<{ resource: URI; results: ITextSearchResult[] }> = []
    const messages: ITextSearchCompleteMessage[] = []

    if (!query || !query.contentPattern || typeof query.contentPattern.pattern !== 'string') {
      this.logger.error('Invalid query parameters for text search')
      messages.push({
        text: `Invalid query parameters: ${!query ? 'query is null' : !query.contentPattern ? 'contentPattern is null' : 'pattern is not a string'}`,
        type: TextSearchCompleteMessageType.Warning
      })
      return {
        results: [],
        limitHit: false,
        messages,
        stats: {
          type: 'textSearchProvider' as const
        },
        exit: SearchCompletionExitCode.Normal
      }
    }

    if (onProgress) {
      try {
        onProgress({
          message: `Searching ${Array.from(this.cachedFiles).length} files for "${query.contentPattern.pattern}"`
        })
      } catch (progressError) {
        this.logger.warn('Error sending progress message', progressError)
      }
    }

    try {
      const regexp = this.createSearchRegex(query.contentPattern)

      for (const uri of this.cachedFiles) {
        if (token?.isCancellationRequested) {
          break
        }

        if (!this.isValidWorkspaceFile(uri)) {
          messages.push({
            text: `Skipping invalid file: ${uri.fsPath}`,
            type: TextSearchCompleteMessageType.Warning
          })
          continue
        }

        try {
          const textResults = await this.searchInFile(uri, regexp, query, token)

          if (textResults && textResults.length > 0) {
            const validResults = textResults.filter(
              (result) =>
                result &&
                typeof result === 'object' &&
                'rangeLocations' in result &&
                'previewText' in result
            )

            if (validResults.length > 0) {
              fileMatches.push({
                resource: uri,
                results: validResults
              })

              if (onProgress && validResults.length > 0) {
                try {
                  const fileMatch = new FileMatch(uri)
                  fileMatch.results = validResults
                  onProgress(fileMatch)
                } catch (progressError) {
                  this.logger.warn(`Error reporting progress for ${uri.fsPath}:`, progressError)
                }
              }

              resultsCount += validResults.length
              if (resultsCount >= resultsLimit) {
                return this.createSearchComplete(fileMatches, true)
              }
            }
          }
        } catch (error) {
          this.logger.warn(`Error reading file ${uri.fsPath}`, error as Error)
          messages.push({
            text: `Could not read file: ${uri.fsPath} - ${(error as Error).message}`,
            type: TextSearchCompleteMessageType.Warning
          })
        }
      }
    } catch (error) {
      if (token?.isCancellationRequested) {
        const searchError = new SearchError('Search cancelled', SearchErrorCode.canceled)
        throw searchError
      }

      const searchError = deserializeSearchError(error as Error)
      this.logger.error(`Text search failed: ${searchError.message}`, searchError)
      throw searchError
    }

    if (resultsCount > 0) {
      messages.push({
        text: `Search completed. Found ${resultsCount} matches in ${fileMatches.length} files.`,
        type: TextSearchCompleteMessageType.Information
      })
    } else {
      messages.push({
        text: `Search completed. No matches found for "${query.contentPattern.pattern}".`,
        type: TextSearchCompleteMessageType.Information
      })
    }

    return this.createSearchComplete(fileMatches, false, messages)
  }

  /**
   * Performs file search across the workspace
   * @param query - The file search query
   * @param token - Cancellation token
   * @returns Promise resolving to search results
   */
  async fileSearch(query: IFileQuery, token?: CancellationToken): Promise<ISearchComplete> {
    if (!this.isInitialized) {
      throw new Error('Search provider not initialized')
    }

    const startTime = Date.now()
    const maxResults = query.maxResults || this.config.maxResults
    const results: URI[] = []
    const searchPattern = query.filePattern || ''

    for (const uri of this.cachedFiles) {
      if (token?.isCancellationRequested) {
        break
      }

      try {
        if (this.matchesFilePattern(uri.fsPath, searchPattern) && this.isValidWorkspaceFile(uri)) {
          results.push(uri)

          if (results.length >= maxResults) {
            break
          }
        }
      } catch {
        continue
      }
    }

    const providerTime = Date.now() - startTime
    const filteredResults = this.filterWorkspaceResults(results)
    const postProcessTime = Date.now() - startTime - providerTime

    return {
      results: filteredResults.map((uri) => ({
        resource: uri,
        results: []
      })),
      limitHit: results.length >= maxResults,
      messages: [],
      stats: {
        type: 'fileSearchProvider' as const,
        fromCache: true,
        detailStats: {
          providerTime,
          postProcessTime
        },
        resultCount: filteredResults.length
      },
      exit: SearchCompletionExitCode.Normal
    }
  }

  /**
   * Clears search cache
   * @param cacheKey - The cache key to clear
   */
  async clearCache(cacheKey: string): Promise<void> {
    try {
      this.cachedFiles.clear()

      if (this.isInitialized) {
        await this.initializeFileCache()
      }
    } catch (error) {
      this.logger.error(`Error clearing cache for key ${cacheKey}`, error as Error)
      throw new Error(`Failed to clear search cache: ${(error as Error).message}`)
    }
  }

  /**
   * Creates a regex from the content pattern
   * @param contentPattern - The content pattern configuration
   * @returns The compiled regex
   */
  private createSearchRegex(contentPattern: ITextQuery['contentPattern']): RegExp {
    try {
      return new RegExp(
        contentPattern.pattern || '',
        (contentPattern.isCaseSensitive ? 'g' : 'gi') +
          (contentPattern.isMultiline ? 'm' : '') +
          (contentPattern.isUnicode ? 'u' : '')
      )
    } catch (regexError) {
      this.logger.error(`Invalid regex pattern: ${contentPattern.pattern}`, regexError as Error)
      const searchError = new SearchError(
        `Invalid search pattern: ${contentPattern.pattern}`,
        SearchErrorCode.regexParseError
      )
      throw searchError
    }
  }

  /**
   * Searches for matches within a single file
   * @param uri - The file URI to search
   * @param regexp - The compiled regex pattern
   * @param token - Cancellation token
   * @returns Array of text search results
   */
  private async searchInFile(
    uri: URI,
    regexp: RegExp,
    query: ITextQuery,
    token?: CancellationToken
  ): Promise<ITextSearchResult[]> {
    try {
      if (!this.fileService) {
        return []
      }

      const fileReadResult = await this.fileService.readFile(uri)

      if (!fileReadResult || !fileReadResult.value) {
        return []
      }

      const fullText = fileReadResult.value.toString()
      if (!fullText || typeof fullText !== 'string') {
        return []
      }

      const results: ITextSearchResult[] = []
      let match

      try {
        regexp.lastIndex = 0

        while ((match = regexp.exec(fullText)) !== null) {
          if (token?.isCancellationRequested) break

          const lines = splitLines(fullText)
          const lineNumber = this.getLineNumber(fullText, match.index)
          const lineContent = lines[lineNumber] || ''

          const searchRange = new Range(
            lineNumber,
            this.getColumnNumber(fullText, match.index),
            this.getLineNumber(fullText, match.index + match[0].length),
            this.getColumnNumber(fullText, match.index + match[0].length)
          )

          const textSearchMatch = new TextSearchMatch(
            lineContent,
            searchRange,
            query.previewOptions
          )
          results.push(textSearchMatch)

          if (match[0].length === 0) {
            regexp.lastIndex++
          }

          if (results.length >= (query.maxResults || 10000)) {
            break
          }
        }
      } catch (regexError) {
        this.logger.warn(`Regex execution error for ${uri.fsPath}`, regexError as Error)
        return []
      }

      return results
    } catch {
      return []
    }
  }

  /**
   * Converts a character index to line number (0-based)
   * @param content - The full file content
   * @param index - The character index
   * @returns The line number (0-based)
   */
  private getLineNumber(content: string, index: number): number {
    const lines = content.substring(0, index).split('\n')
    return lines.length - 1
  }

  /**
   * Converts a character index to column number (0-based)
   * @param content - The full file content
   * @param index - The character index
   * @returns The column number (0-based)
   */
  private getColumnNumber(content: string, index: number): number {
    const lines = content.substring(0, index).split('\n')
    return lines[lines.length - 1]?.length || 0
  }

  /**
   * Validates if a URI is a valid workspace file
   * @param uri - The URI to validate
   * @returns True if the URI is valid
   */
  private isValidWorkspaceFile(uri: URI): boolean {
    return Boolean(uri && uri.fsPath && uri.scheme === 'file')
  }

  /**
   * Filters results to only include URIs with proper workspace folder context
   * @param results - The results to filter
   * @returns Filtered results
   */
  private filterWorkspaceResults(results: URI[]): URI[] {
    return results.filter((uri) => {
      try {
        if (uri.scheme !== 'file') {
          return false
        }

        const workspaceFolders = this.workspaceFolders || []
        return workspaceFolders.some((folder) => {
          return uri.fsPath.startsWith(folder.fsPath)
        })
      } catch {
        return false
      }
    })
  }

  /**
   * Creates a search completion result with proper FileMatch objects.
   * @param fileMatches - Array of file matches with their results
   * @param limitHit - Whether the search hit the result limit
   * @param messages - Optional messages to include in the result
   * @returns The formatted search completion result
   */
  private createSearchComplete(
    fileMatches: Array<{ resource: URI; results: ITextSearchResult[] }>,
    limitHit: boolean,
    messages: ITextSearchCompleteMessage[] = []
  ): ISearchComplete {
    const fileMatchObjects = fileMatches.map((fileMatch) => {
      const fileMatchObj = new FileMatch(fileMatch.resource)
      fileMatchObj.results = fileMatch.results
      return fileMatchObj
    })

    return {
      results: fileMatchObjects,
      limitHit,
      messages,
      stats: {
        type: 'textSearchProvider' as const
      },
      exit: SearchCompletionExitCode.Normal
    }
  }

  /**
   * Checks if a file path matches a given pattern
   * @param path - The file path to check
   * @param pattern - The pattern to match against
   * @returns True if the path matches the pattern
   */
  private matchesFilePattern(path: string, pattern: string): boolean {
    if (!pattern) {
      return true
    }

    return isFilePatternMatch(path, pattern)
  }
}
