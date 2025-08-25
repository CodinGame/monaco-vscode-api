import { IConfigurationService } from 'vs/platform/configuration/common/configuration.service'
import type { ISearchConfiguration } from 'vs/workbench/services/search/common/search'
import { getExcludes } from 'vs/workbench/services/search/common/search'
import type { URI } from 'vs/base/common/uri'

export interface SearchConfig {
  maxResults: number
  caseSensitive: boolean
  includeHiddenFiles: boolean
  excludePatterns: string[]
  maxFileSize: number
  debounceDelay: number
}

/**
 * Gets exclude patterns from VS Code's configuration using VS Code's native getExcludes function
 * @param configurationService VS Code's configuration service
 * @param resource The resource (folder) to get configuration for
 * @param includeSearchExcludes Whether to include search.exclude settings
 * @returns Array of exclude patterns
 */
export function getExcludePatterns(
  configurationService?: IConfigurationService,
  resource?: URI,
  includeSearchExcludes: boolean = true
): string[] {
  if (configurationService?.getValue) {
    try {
      const config = configurationService.getValue({ resource })
      const excludes = getExcludes(config as ISearchConfiguration, includeSearchExcludes)

      if (!excludes) {
        return []
      }

      return Object.keys(excludes).filter((key) => excludes[key])
    } catch (error) {
      console.warn('Failed to access VS Code configuration, using default exclude patterns', error)
    }
  }

  return []
}

/**
 * Gets search configuration from VS Code's native settings
 * @param configurationService VS Code's configuration service
 * @param resource The resource (folder) to get configuration for
 * @returns SearchConfig with values from VS Code where available
 */
export function getSearchConfigFromVSCode(
  configurationService?: IConfigurationService,
  resource?: URI
): Partial<SearchConfig> {
  if (!configurationService?.getValue) {
    return {}
  }

  try {
    const config = configurationService.getValue({ resource }) as ISearchConfiguration

    return {
      maxResults: config.search?.maxResults || undefined,
      caseSensitive: config.search?.smartCase ? undefined : false,
      debounceDelay: config.search?.searchOnTypeDebouncePeriod,
      excludePatterns: getExcludePatterns(configurationService, resource)
    }
  } catch (error) {
    console.warn('Failed to get search configuration from VS Code', error)
    return {}
  }
}

export const DEFAULT_INCLUDE_HIDDEN_FILES = true

export const DEFAULT_CONFIG: SearchConfig = {
  maxResults: 1000,
  caseSensitive: false,
  includeHiddenFiles: DEFAULT_INCLUDE_HIDDEN_FILES,
  excludePatterns: [],
  maxFileSize: 1024 * 1024 * 10,
  debounceDelay: 300
}

export const MAX_CACHED_FILES = 100000
export const MAX_DIRECTORY_DEPTH = 10
