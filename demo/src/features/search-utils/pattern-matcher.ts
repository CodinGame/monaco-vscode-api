/**
 * Pattern matching utilities for file and text search operations
 * Provides enhanced pattern matching with fuzzy search and glob support
 */

// VS Code Glob Matching Implementation
export const GLOBSTAR = '**'
export const GLOB_SPLIT = '/'

const PATH_REGEX = '[/\\\\]' // any slash or backslash
const NO_PATH_REGEX = '[^/\\\\]' // any non-slash and non-backslash

function starsToRegExp(starCount: number, isLastPattern?: boolean): string {
  switch (starCount) {
    case 0:
      return ''
    case 1:
      return `${NO_PATH_REGEX}*?` // 1 star matches any number of characters except path separator (/ and \) - non greedy (?)
    default:
      // Matches:  (Path Sep OR Path Val followed by Path Sep) 0-many times except when it's the last pattern
      //           in which case also matches (Path Sep followed by Path Val)
      return `(?:${PATH_REGEX}|${NO_PATH_REGEX}+${PATH_REGEX}${isLastPattern ? `|${PATH_REGEX}${NO_PATH_REGEX}+` : ''})*?`
  }
}

export function splitGlobAware(pattern: string, splitChar: string): string[] {
  if (!pattern) {
    return []
  }

  const segments: string[] = []

  let inBraces = false
  let inBrackets = false

  let curVal = ''
  for (const char of pattern) {
    switch (char) {
      case splitChar:
        if (!inBraces && !inBrackets) {
          segments.push(curVal)
          curVal = ''
          continue
        }
        break
      case '{':
        inBraces = true
        break
      case '}':
        inBraces = false
        break
      case '[':
        inBrackets = true
        break
      case ']':
        inBrackets = false
        break
    }

    curVal += char
  }

  if (curVal) {
    segments.push(curVal)
  }

  return segments
}

function escapeRegExpCharacters(value: string): string {
  return value.replace(/[\\{}*+?|^$.[\]()]/g, '\\$&')
}

function parseRegExp(pattern: string): string {
  if (!pattern) {
    return ''
  }

  let regEx = ''

  const segments = splitGlobAware(pattern, GLOB_SPLIT)

  if (segments.every((segment) => segment === GLOBSTAR)) {
    regEx = '.*'
  } else {
    let previousSegmentWasGlobStar = false
    segments.forEach((segment, index) => {
      if (segment === GLOBSTAR) {
        if (previousSegmentWasGlobStar) {
          return
        }

        regEx += starsToRegExp(2, index === segments.length - 1)
      } else {
        let inBraces = false
        let braceVal = ''

        let inBrackets = false
        let bracketVal = ''

        for (const char of segment) {
          if (char !== '}' && inBraces) {
            braceVal += char
            continue
          }

          if (inBrackets && (char !== ']' || !bracketVal)) {
            let res: string

            if (char === '-') {
              res = char
            } else if ((char === '^' || char === '!') && !bracketVal) {
              res = '^'
            } else if (char === GLOB_SPLIT) {
              res = ''
            } else {
              res = escapeRegExpCharacters(char)
            }

            bracketVal += res
            continue
          }

          switch (char) {
            case '{':
              inBraces = true
              continue

            case '[':
              inBrackets = true
              continue

            case '}': {
              const choices = splitGlobAware(braceVal, ',')

              const braceRegExp = `(?:${choices.map((choice) => parseRegExp(choice)).join('|')})`

              regEx += braceRegExp

              inBraces = false
              braceVal = ''

              break
            }

            case ']': {
              regEx += '[' + bracketVal + ']'

              inBrackets = false
              bracketVal = ''

              break
            }

            case '?':
              regEx += NO_PATH_REGEX
              continue

            case '*':
              regEx += starsToRegExp(1)
              continue

            default:
              regEx += escapeRegExpCharacters(char)
          }
        }

        if (
          index < segments.length - 1 &&
          (segments[index + 1] !== GLOBSTAR || index + 2 < segments.length)
        ) {
          regEx += PATH_REGEX
        }
      }

      previousSegmentWasGlobStar = segment === GLOBSTAR
    })
  }

  return regEx
}

// regexes to check for trivial glob patterns that just check for String#endsWith
const T1 = /^\*\*\/\*\.[\w.-]+$/ // **/*.something
const T2 = /^\*\*\/([\w.-]+)\/?$/ // **/something
const T3 = /^{\*\*\/\*\.?[\w.-]+\/?(,\*\*\/\*\.?[\w.-]+\/?)*}$/ // {**/*.something,**/*.else} or {**/package.json,**/project.json}
const T4 = /^\*\*((\/[\w.-]+)+)\/?$/ // **/something/else
const T5 = /^([\w.-]+(\/[\w.-]+)*)\/?$/ // something/else

export type ParsedPattern = (path: string, basename?: string) => boolean

interface ParsedStringPattern {
  (path: string, basename?: string): string | null
  basenames?: string[]
  patterns?: string[]
  allBasenames?: string[]
  allPaths?: string[]
}

const NULL = function (): string | null {
  return null
}

function parsePattern(pattern: string): ParsedStringPattern {
  if (!pattern) {
    return NULL
  }

  // Whitespace trimming
  pattern = pattern.trim()

  let match: RegExpExecArray | null
  if (T1.test(pattern)) {
    return trivia1(pattern.substr(4), pattern)
  } else if ((match = T2.exec(pattern))) {
    return trivia2(match[1]!, pattern)
  } else if (T3.test(pattern)) {
    return trivia3(pattern)
  } else if ((match = T4.exec(pattern))) {
    return trivia4and5(match[1]!.substr(1), pattern, true)
  } else if ((match = T5.exec(pattern))) {
    return trivia4and5(match[1]!, pattern, false)
  } else {
    return toRegExp(pattern)
  }
}

function trivia1(base: string, pattern: string): ParsedStringPattern {
  return function (path: string) {
    return typeof path === 'string' && path.endsWith(base) ? pattern : null
  }
}

function trivia2(base: string, pattern: string): ParsedStringPattern {
  const slashBase = `/${base}`
  const backslashBase = `\\${base}`

  const parsedPattern: ParsedStringPattern = function (path: string, basename?: string) {
    if (typeof path !== 'string') {
      return null
    }

    if (basename) {
      return basename === base ? pattern : null
    }

    return path === base || path.endsWith(slashBase) || path.endsWith(backslashBase)
      ? pattern
      : null
  }

  const basenames = [base]
  parsedPattern.basenames = basenames
  parsedPattern.patterns = [pattern]
  parsedPattern.allBasenames = basenames

  return parsedPattern
}

function trivia3(pattern: string): ParsedStringPattern {
  const parsedPatterns = pattern
    .slice(1, -1)
    .split(',')
    .map((pattern) => parsePattern(pattern))
    .filter((pattern) => pattern !== NULL)

  const patternsLength = parsedPatterns.length
  if (!patternsLength) {
    return NULL
  }

  if (patternsLength === 1) {
    return parsedPatterns[0]!
  }

  const parsedPattern: ParsedStringPattern = function (path: string, basename?: string) {
    for (let i = 0, n = parsedPatterns.length; i < n; i++) {
      if (parsedPatterns[i]!(path, basename)) {
        return pattern
      }
    }

    return null
  }

  const withBasenames = parsedPatterns.find((pattern) => !!pattern.allBasenames)
  if (withBasenames) {
    parsedPattern.allBasenames = withBasenames.allBasenames
  }

  const allPaths = parsedPatterns.reduce(
    (all, current) => (current.allPaths ? all.concat(current.allPaths) : all),
    [] as string[]
  )
  if (allPaths.length) {
    parsedPattern.allPaths = allPaths
  }

  return parsedPattern
}

function trivia4and5(
  targetPath: string,
  pattern: string,
  matchPathEnds: boolean
): ParsedStringPattern {
  const nativePathEnd = '/' + targetPath
  const targetPathEnd = '/' + targetPath

  let parsedPattern: ParsedStringPattern
  if (matchPathEnds) {
    parsedPattern = function (path: string) {
      return typeof path === 'string' &&
        (path === targetPath || path.endsWith(nativePathEnd) || path.endsWith(targetPathEnd))
        ? pattern
        : null
    }
  } else {
    parsedPattern = function (path: string) {
      return typeof path === 'string' && (path === targetPath || path === targetPath)
        ? pattern
        : null
    }
  }

  parsedPattern.allPaths = [(matchPathEnds ? '*/' : './') + targetPath]

  return parsedPattern
}

function toRegExp(pattern: string): ParsedStringPattern {
  try {
    const regExp = new RegExp(`^${parseRegExp(pattern)}$`)
    return function (path: string) {
      regExp.lastIndex = 0

      return typeof path === 'string' && regExp.test(path) ? pattern : null
    }
  } catch {
    return NULL
  }
}

/**
 * Simplified glob matching. Supports a subset of glob patterns:
 * * `*` to match zero or more characters in a path segment
 * * `?` to match on one character in a path segment
 * * `**` to match any number of path segments, including none
 * * `{}` to group conditions (e.g. *.{ts,js} matches all TypeScript and JavaScript files)
 * * `[]` to declare a range of characters to match in a path segment (e.g., `example.[0-9]` to match on `example.0`, `example.1`, …)
 * * `[!...]` to negate a range of characters to match in a path segment (e.g., `example.[!0-9]` to match on `example.a`, `example.b`, but not `example.0`)
 */
export function match(pattern: string, path: string): boolean {
  if (!pattern || typeof path !== 'string') {
    return false
  }

  const parsedPattern = parsePattern(pattern)
  return !!parsedPattern(path)
}

// Enhanced pattern matching utilities
export class PatternMatcher {
  static matchesGlob(text: string, pattern: string, caseSensitive: boolean = false): boolean {
    // Convert glob pattern to regex
    const regexPattern = this.globToRegex(pattern, caseSensitive)
    const regex = new RegExp(regexPattern)
    return regex.test(text)
  }

  static globToRegex(glob: string, caseSensitive: boolean = false): string {
    let regex = glob
      .replace(/\*/g, '.*') // * matches any sequence
      .replace(/\?/g, '.') // ? matches single character
      .replace(/\./g, '\\.') // escape dots
      .replace(/\//g, '\\/') // escape forward slashes
      .replace(/\[/g, '\\[') // escape brackets
      .replace(/\]/g, '\\]')

    // Add anchors - only start anchor, not end anchor for partial matching
    if (!regex.startsWith('.*')) {
      regex = '^' + regex
    }
    // Remove end anchor to allow partial matches (e.g., "index" matches "index.html")
    // Only add end anchor if it already has one or contains explicit wildcards
    if (!regex.includes('*') && !regex.includes('?')) {
      // For simple patterns without wildcards, allow partial matching
      // Don't add $ anchor to enable substring matching
    } else if (!regex.endsWith('.*')) {
      regex = regex + '$'
    }

    return caseSensitive ? regex : regex + 'i'
  }

  static shouldExclude(path: string, excludePatterns: string[]): boolean {
    return excludePatterns.some((pattern) => match(pattern, path))
  }

  /**
   * Checks if the characters of the provided query string are included in the
   * target string. The characters do not have to be contiguous within the string.
   * This is similar to VS Code's fuzzy matching behavior.
   */
  static fuzzyContains(target: string, query: string): boolean {
    if (!target || !query) {
      return false // return early if target or query are undefined
    }

    if (target.length < query.length) {
      return false // impossible for query to be contained in target
    }

    const queryLen = query.length
    const targetLower = target.toLowerCase()

    let index = 0
    let lastIndexOf = -1
    while (index < queryLen) {
      const queryChar = query[index]
      if (!queryChar) {
        return false
      }
      const indexOf = targetLower.indexOf(queryChar, lastIndexOf + 1)
      if (indexOf < 0) {
        return false
      }

      lastIndexOf = indexOf

      index++
    }

    return true
  }

  /**
   * Enhanced file pattern matching that combines fuzzy matching with glob support
   */
  static isFilePatternMatch(path: string, pattern: string): boolean {
    return this.fuzzyContains(path, pattern)
  }
}
