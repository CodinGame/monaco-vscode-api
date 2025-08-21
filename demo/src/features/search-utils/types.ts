import * as vscode from 'vscode'
import { FileChangeType } from '@codingame/monaco-vscode-api/vscode/vs/platform/files/common/files'

/**
 * Configuration interfaces for search functionality
 */
export interface SearchConfig {
  maxResults: number
  caseSensitive: boolean
  includeHiddenFiles: boolean
  excludePatterns: string[]
  maxFileSize: number // in bytes
  debounceDelay: number // in milliseconds
}

export interface FileChange {
  type: FileChangeType
  resource: vscode.Uri
}

// Default configuration
export const DEFAULT_CONFIG: SearchConfig = {
  maxResults: 1000,
  caseSensitive: false,
  includeHiddenFiles: true,
  excludePatterns: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/out/**'],
  maxFileSize: 1024 * 1024 * 10, // 10MB
  debounceDelay: 300
}

// Scalability limits
export const MAX_CACHED_FILES = 100000 // Maximum files to cache
export const MAX_SEARCH_TIME_MS = 5000 // Maximum search time before timeout
export const MAX_DIRECTORY_DEPTH = 10 // Maximum directory depth to traverse
