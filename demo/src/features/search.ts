import { ExtensionHostKind, registerExtension } from '@codingame/monaco-vscode-api/extensions'
import { fuzzyContains } from '@codingame/monaco-vscode-api/vscode/vs/base/common/strings'
import { IFileService, ILogService, getService } from '@codingame/monaco-vscode-api'
import * as glob from '@codingame/monaco-vscode-api/vscode/vs/base/common/glob'
import { BaseWorkspaceSearchProvider } from './search-utils/base-provider'
import * as vscode from 'vscode'

function isFilePatternMatch(path: string, filePatternToUse: string, fuzzy = true): boolean {
  return fuzzy ? fuzzyContains(path, filePatternToUse) : glob.match(filePatternToUse, path)
}

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
      throw new Error('Search provider not initialized')
    }

    const maxResults = options.maxResults || this.config.maxResults
    const results: vscode.Uri[] = []
    const searchPattern = query.pattern

    this.logger.debug(`Starting file search with pattern: ${searchPattern}`)

    for (const uri of this.cachedFiles) {
      if (token.isCancellationRequested) {
        this.logger.debug('File search cancelled')
        break
      }

      try {
        const matches = this.matchesFilePattern(uri.fsPath, searchPattern)

        if (matches) {
          // Validate URI before adding to results
          if (!uri || !uri.fsPath || !uri.scheme) {
            continue
          }

          results.push(uri)

          if (results.length >= maxResults) {
            this.logger.debug(`File search hit result limit of ${maxResults}`)
            break
          }
        }
      } catch {
        continue
      }
    }

    this.logger.info(`File search completed. Found ${results.length} matches`)

    // Filter results to only include URIs with proper workspace folder context
    // This prevents Monaco integration errors with URIs that don't have workspace folder info
    const filteredResults = results.filter((uri) => {
      try {
        if (uri.scheme !== 'file') {
          return false
        }

        const workspaceFolders = vscode.workspace.workspaceFolders || []
        const isInWorkspace = workspaceFolders.some((folder) => {
          const folderPath = folder.uri.fsPath
          return uri.fsPath.startsWith(folderPath)
        })

        return isInWorkspace
      } catch {
        return false
      }
    })

    return filteredResults
  }

  private matchesFilePattern(path: string, pattern: string): boolean {
    if (!pattern) {
      return true
    }

    return isFilePatternMatch(path, pattern)
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
      throw new Error('Search provider not initialized')
    }

    const resultsLimit = options.maxResults || this.config.maxResults
    let resultsCount = 0

    this.logger.debug(`Starting text search with pattern: ${query.pattern}`)

    try {
      const regexp = new RegExp(query.pattern || '', query.isCaseSensitive ? 'g' : 'gi')

      for (const uri of this.cachedFiles) {
        if (token.isCancellationRequested) {
          this.logger.debug('Text search cancelled')
          break
        }

        try {
          // Check file size before reading
          if (!(await this.isWithinSizeLimit(uri))) {
            this.logger.debug(`Skipping large file: ${uri.fsPath}`)
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
                this.logger.debug(`Text search hit result limit of ${resultsLimit}`)
                return { limitHit: true }
              }

              // Continue searching in the same line
              if (!regexp.global) break
            }
          }
        } catch (error) {
          this.logger.warn(`Error reading file ${uri.fsPath}`, error as Error)
        }
      }
    } catch (error) {
      this.logger.error('Error during text search', error as Error)
      throw new Error('Failed to perform text search')
    }

    this.logger.info(`Text search completed. Found ${resultsCount} matches`)
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
    const fileService = await getService(IFileService)
    const logService = await getService(ILogService)
    const fileSearchProvider = new WorkspaceFileSearchProvider(fileService, logService)
    const textSearchProvider = new WorkspaceTextSearchProvider(fileService, logService)

    api.workspace.registerFileSearchProvider('file', fileSearchProvider)
    api.workspace.registerTextSearchProvider('file', textSearchProvider)
  } catch (error) {
    console.error('[Search] Failed to initialize search providers:', error)
  }
})
