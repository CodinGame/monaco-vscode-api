import * as vscode from 'vscode'
import { FileChangeType } from '@codingame/monaco-vscode-api/vscode/vs/platform/files/common/files'

export interface SearchConfig {
  maxResults: number
  caseSensitive: boolean
  includeHiddenFiles: boolean
  excludePatterns: string[]
  maxFileSize: number
  debounceDelay: number
}

export interface FileChange {
  type: FileChangeType
  resource: vscode.Uri
}

export const DEFAULT_CONFIG: SearchConfig = {
  maxResults: 1000,
  caseSensitive: false,
  includeHiddenFiles: true,
  excludePatterns: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/out/**'],
  maxFileSize: 1024 * 1024 * 10,
  debounceDelay: 300
}

export const MAX_CACHED_FILES = 100000
export const MAX_SEARCH_TIME_MS = 5000
export const MAX_DIRECTORY_DEPTH = 10
