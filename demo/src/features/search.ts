import { ExtensionHostKind, registerExtension } from '@codingame/monaco-vscode-api/extensions'
import { IFileService, getService } from '@codingame/monaco-vscode-api'
import * as vscode from 'vscode'

// Import utilities from separate modules
import { PatternMatcher } from './search-utils/pattern-matcher'
import { SearchError, SearchLogger } from './search-utils/errors'
import { BaseWorkspaceSearchProvider } from './search-utils/base-provider'
import { MAX_SEARCH_TIME_MS } from './search-utils/types'

export class WorkspaceFileSearchProvider
  extends BaseWorkspaceSearchProvider
  implements vscode.FileSearchProvider
{
  async provideFileSearchResults(
    query: vscode.FileSearchQuery,
    options: vscode.FileSearchOptions,
    token: vscode.CancellationToken
  ): Promise<vscode.Uri[]> {
    if (!this.isInitialized) {
      throw new SearchError('Search provider not initialized', 'NOT_INITIALIZED')
    }

    const maxResults = options.maxResults || this.config.maxResults
    const results: vscode.Uri[] = []
    const searchPattern = query.pattern
    const searchStartTime = Date.now()

    SearchLogger.debug(`Starting file search with pattern: ${searchPattern}`)

    for (const uri of this.cachedFiles) {
      // Check for search timeout
      if (Date.now() - searchStartTime > MAX_SEARCH_TIME_MS) {
        SearchLogger.warn(
          `Search timeout (${MAX_SEARCH_TIME_MS}ms) reached for pattern: ${searchPattern}`
        )
        break
      }
      if (token.isCancellationRequested) {
        SearchLogger.debug('File search cancelled')
        break
      }

      try {
        const matches = this.matchesFilePattern(uri.fsPath, searchPattern)

        if (matches) {
          // Validate URI before adding to results
          try {
            if (!uri || !uri.fsPath || !uri.scheme) {
              continue // Skip this iteration, not exit the function
            }

            results.push(uri)
          } catch {
            continue
          }

          if (results.length >= maxResults) {
            SearchLogger.debug(`File search hit result limit of ${maxResults}`)
            break
          }
        }
      } catch {
        continue
      }
    }

    SearchLogger.info(`File search completed. Found ${results.length} matches`)

    // Filter results to only include URIs with proper workspace folder context
    // This prevents Monaco integration errors with URIs that don't have workspace folder info
    const filteredResults = results.filter((uri) => {
      try {
        // Only include file:// URIs that are within workspace folders
        if (uri.scheme !== 'file') {
          return false
        }

        // Check if URI is within a workspace folder
        const workspaceFolders = vscode.workspace.workspaceFolders || []
        const isInWorkspace = workspaceFolders.some((folder) => {
          const folderPath = folder.uri.fsPath
          return uri.fsPath.startsWith(folderPath)
        })

        if (!isInWorkspace) {
          return false
        }

        return true
      } catch {
        return false
      }
    })

    return filteredResults
  }

  private matchesFilePattern(path: string, pattern: string): boolean {
    return PatternMatcher.isFilePatternMatch(path, pattern)
  }
}

export class WorkspaceTextSearchProvider
  extends BaseWorkspaceSearchProvider
  implements vscode.TextSearchProvider
{
  async provideTextSearchResults(
    query: vscode.TextSearchQuery,
    options: vscode.TextSearchOptions,
    progress: vscode.Progress<vscode.TextSearchResult>,
    token: vscode.CancellationToken
  ): Promise<vscode.TextSearchComplete> {
    if (!this.isInitialized) {
      throw new SearchError('Search provider not initialized', 'NOT_INITIALIZED')
    }

    const resultsLimit = options.maxResults || this.config.maxResults
    let resultsCount = 0
    const searchStartTime = Date.now()

    SearchLogger.debug(`Starting text search with pattern: ${query.pattern}`)

    try {
      const regexp = new RegExp(query.pattern || '', query.isCaseSensitive ? 'g' : 'gi')

      for (const uri of this.cachedFiles) {
        // Check for search timeout
        if (Date.now() - searchStartTime > MAX_SEARCH_TIME_MS) {
          SearchLogger.warn(
            `Text search timeout (${MAX_SEARCH_TIME_MS}ms) reached for pattern: ${query.pattern}`
          )
          return { limitHit: false }
        }

        if (token.isCancellationRequested) {
          SearchLogger.debug('Text search cancelled')
          break
        }

        try {
          // Check file size before reading
          if (!(await this.isWithinSizeLimit(uri))) {
            SearchLogger.debug(`Skipping large file: ${uri.fsPath}`)
            continue
          }

          const fileContent = (await this.fileService.readFile(uri)).value.toString()
          const lines = fileContent.split('\n')

          for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            if (token.isCancellationRequested) break

            const line = lines[lineIndex]
            if (!line) continue

            let match

            while ((match = regexp.exec(line)) !== null) {
              if (token.isCancellationRequested) break

              const start = match.index
              const end = start + match[0].length
              const previewStart = Math.max(0, start - 50)
              const previewEnd = Math.min(line.length, end + 50)
              const previewText = line.substring(previewStart, previewEnd)

              progress.report({
                uri,
                ranges: [new vscode.Range(lineIndex, start, lineIndex, end)],
                preview: {
                  text: previewText,
                  matches: [new vscode.Range(0, start - previewStart, 0, end - previewStart)]
                }
              })

              resultsCount++
              if (resultsCount >= resultsLimit) {
                SearchLogger.debug(`Text search hit result limit of ${resultsLimit}`)
                return { limitHit: true }
              }

              // Continue searching in the same line
              if (!regexp.global) break
            }
          }
        } catch (error) {
          SearchLogger.warn(`Error reading file ${uri.fsPath}`, error as Error)
        }
      }
    } catch (error) {
      SearchLogger.error('Error during text search', error as Error)
      throw new SearchError('Failed to perform text search', 'SEARCH_FAILED', error as Error)
    }

    SearchLogger.info(`Text search completed. Found ${resultsCount} matches`)
    return { limitHit: false }
  }
}

const { getApi } = registerExtension(
  {
    name: 'searchProvider',
    publisher: 'codingame',
    version: '1.0.0',
    engines: {
      vscode: '*'
    },
    enabledApiProposals: ['fileSearchProvider', 'textSearchProvider']
  },
  ExtensionHostKind.LocalProcess,
  {
    system: true
  }
)

void getApi().then(async (api) => {
  try {
    console.log('[Search] Getting file service...')
    const fileService = await getService(IFileService)
    console.log('[Search] File service obtained, registering search providers...')

    const fileSearchProvider = new WorkspaceFileSearchProvider(fileService)
    const textSearchProvider = new WorkspaceTextSearchProvider(fileService)

    api.workspace.registerFileSearchProvider('file', fileSearchProvider)
    api.workspace.registerTextSearchProvider('file', textSearchProvider)

    console.log('[Search] Search providers registered successfully')
  } catch (error) {
    console.error('[Search] Failed to initialize search providers:', error)
  }
})
