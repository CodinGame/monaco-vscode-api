/**
 * Error handling and logging utilities for search operations
 */

// Enhanced error handling
export class SearchError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'SearchError'
  }
}

// Logger utility
export class SearchLogger {
  private static logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info'

  static debug(message: string, ...args: unknown[]): void {
    if (this.logLevel === 'debug') {
      console.debug(`[Search] ${message}`, ...args)
    }
  }

  static info(message: string, ...args: unknown[]): void {
    if (this.logLevel !== 'error') {
      console.info(`[Search] ${message}`, ...args)
    }
  }

  static warn(message: string, ...args: unknown[]): void {
    console.warn(`[Search] ${message}`, ...args)
  }

  static error(message: string, error?: Error, ...args: unknown[]): void {
    console.error(`[Search] ${message}`, error, ...args)
  }
}
