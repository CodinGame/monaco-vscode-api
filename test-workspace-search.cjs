#!/usr/bin/env node

/**
 * Simple test file for WorkspaceSearchProvider
 * Run with: node test-workspace-search.js
 */

const fs = require('fs')
const path = require('path')

// Mock VSCode services and types
class MockLogger {
  info(message, ...args) {
    console.log(`[INFO] ${message}`, ...args)
  }

  debug(message, ...args) {
    console.log(`[DEBUG] ${message}`, ...args)
  }

  warn(message, ...args) {
    console.log(`[WARN] ${message}`, ...args)
  }

  error(message, ...args) {
    console.log(`[ERROR] ${message}`, ...args)
  }
}

class MockFileService {
  constructor(testFiles) {
    this.testFiles = testFiles
  }

  async readFile(uri) {
    const filePath = uri.fsPath
    if (this.testFiles[filePath]) {
      return {
        value: Buffer.from(this.testFiles[filePath])
      }
    }
    throw new Error(`File not found: ${filePath}`)
  }
}

class MockWorkspaceContextService {
  constructor(workspaceFolders) {
    this.workspaceFolders = workspaceFolders
  }

  getWorkspace() {
    return {
      folders: this.workspaceFolders
    }
  }
}

class MockConfigurationService {
  getValue(key) {
    if (key === 'search.maxResults') {
      return 1000
    }
    return undefined
  }
}

// Mock VSCode URI
class MockURI {
  constructor(fsPath) {
    this.fsPath = fsPath
    this.scheme = 'file'
  }

  toString() {
    return `file://${this.fsPath}`
  }
}

// Mock Range class
class MockRange {
  constructor(startLine, startCol, endLine, endCol) {
    this.startLineNumber = startLine
    this.startColumn = startCol
    this.endLineNumber = endLine
    this.endColumn = endCol
  }
}

// Mock the VSCode modules that the provider needs
const mockVscode = {
  Range: MockRange,
  workspace: {
    workspaceFolders: [new MockURI('/test-workspace')]
  }
}

// Set up global mocks
global.vscode = mockVscode

// Mock the imports that the provider needs
const mockImports = {
  'vs/base/common/strings': {
    fuzzyContains: (str, pattern) => str.includes(pattern)
  },
  'vs/base/common/glob': {
    match: (pattern, str) => {
      const regex = new RegExp(pattern.replace('*', '.*'))
      return regex.test(str)
    }
  },
  'vs/base/common/uri': {
    URI: MockURI
  },
  'vs/editor/common/core/range': {
    Range: MockRange
  },
  'vs/base/common/cancellation': {
    CancellationToken: class {
      isCancellationRequested = false
    }
  },
  'vs/workbench/services/search/common/search': {
    SearchCompletionExitCode: {
      Normal: 0
    },
    TextSearchCompleteMessageType: {
      Information: 'information',
      Warning: 'warning'
    },
    FileMatch: class FileMatch {
      constructor(resource) {
        this.resource = resource
        this.results = []
      }
    },
    SearchError: class SearchError {
      constructor(message, code) {
        this.message = message
        this.code = code
      }
    },
    SearchErrorCode: {
      regexParseError: 'regexParseError',
      canceled: 'canceled'
    },
    resultIsMatch: (result) => {
      return !!(result.rangeLocations && result.previewText)
    }
  },
  'vs/workbench/services/search/common/searchExtConversionTypes': {
    newToOldPreviewOptions: (options) => {
      return {
        matchLines: options?.matchLines ?? 1,
        charsPerLine: options?.charsPerLine ?? 1000
      }
    }
  }
}

// Create test files
const testFiles = {
  '/test-workspace/test.js': `// Test JavaScript file
function hello() {
  console.log("Hello World");
  return "test";
}

const html = "<html lang="en">";
const regex = /test/g;`,

  '/test-workspace/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test Page</title>
</head>
<body>
    <h1>Hello World</h1>
    <p>This is a test page.</p>
    <script>
        const html = "<html>";
        console.log(html);
    </script>
</body>
</html>`,

  '/test-workspace/readme.md': `# Test Project

This is a test markdown file.

## Features
- Feature 1
- Feature 2
- HTML example: <html>
`
}

// Mock the require function to return our mocks
const originalRequire = require
require = function (moduleName) {
  if (mockImports[moduleName]) {
    return mockImports[moduleName]
  }
  return originalRequire(moduleName)
}

// Now load the actual provider
let WorkspaceSearchProvider
try {
  const providerModule = require('./src/service-override/tools/search-providers/workspace-search-provider.ts')
  WorkspaceSearchProvider = providerModule.WorkspaceSearchProvider
} catch (e) {
  console.error('Failed to load WorkspaceSearchProvider:', e.message)
  process.exit(1)
}

async function testWorkspaceSearch() {
  console.log('🚀 Starting WorkspaceSearchProvider Test\n')

  // Create mock services
  const logger = new MockLogger()
  const fileService = new MockFileService(testFiles)
  const workspaceContextService = new MockWorkspaceContextService([new MockURI('/test-workspace')])
  const configurationService = new MockConfigurationService()

  // Create provider instance
  const provider = new WorkspaceSearchProvider(
    fileService,
    workspaceContextService,
    configurationService,
    logger
  )

  try {
    // Initialize the provider
    console.log('📁 Initializing provider...')
    await provider.initialize()
    console.log('✅ Provider initialized\n')

    // Test 1: Search for "html"
    console.log('🔍 Test 1: Searching for "html"')
    console.log('='.repeat(50))

    const htmlQuery = {
      contentPattern: {
        pattern: 'html',
        isCaseSensitive: false,
        isMultiline: false,
        isUnicode: false
      },
      maxResults: 100,
      previewOptions: {
        matchLines: 1,
        charsPerLine: 1000
      }
    }

    const htmlResults = await provider.textSearch(htmlQuery)
    console.log(`\n📊 HTML Search Results:`)
    console.log(`   Files found: ${htmlResults.results.length}`)
    console.log(
      `   Total matches: ${htmlResults.results.reduce((sum, r) => sum + (r.results?.length || 0), 0)}`
    )
    console.log(`   Limit hit: ${htmlResults.limitHit}`)

    htmlResults.results.forEach((fileMatch, index) => {
      console.log(
        `   File ${index + 1}: ${fileMatch.resource.fsPath} (${fileMatch.results?.length || 0} matches)`
      )
      fileMatch.results?.forEach((result, resultIndex) => {
        const isValid =
          mockImports['vs/workbench/services/search/common/search'].resultIsMatch(result)
        console.log(
          `     Match ${resultIndex + 1}: valid=${isValid}, previewText="${result.previewText?.substring(0, 50) || 'N/A'}"`
        )
      })
    })

    // Test 2: Search for "function"
    console.log('\n🔍 Test 2: Searching for "function"')
    console.log('='.repeat(50))

    const functionQuery = {
      contentPattern: {
        pattern: 'function',
        isCaseSensitive: false,
        isMultiline: false,
        isUnicode: false
      },
      maxResults: 100,
      previewOptions: {
        matchLines: 1,
        charsPerLine: 1000
      }
    }

    const functionResults = await provider.textSearch(functionQuery)
    console.log(`\n📊 Function Search Results:`)
    console.log(`   Files found: ${functionResults.results.length}`)
    console.log(
      `   Total matches: ${functionResults.results.reduce((sum, r) => sum + (r.results?.length || 0), 0)}`
    )

    functionResults.results.forEach((fileMatch, index) => {
      console.log(
        `   File ${index + 1}: ${fileMatch.resource.fsPath} (${fileMatch.results?.length || 0} matches)`
      )
    })

    // Test 3: File search
    console.log('\n🔍 Test 3: File search for "*.js"')
    console.log('='.repeat(50))

    const fileQuery = {
      filePattern: '*.js',
      maxResults: 100
    }

    const fileResults = await provider.fileSearch(fileQuery)
    console.log(`\n📊 File Search Results:`)
    console.log(`   Files found: ${fileResults.results.length}`)
    console.log(`   Limit hit: ${fileResults.limitHit}`)

    fileResults.results.forEach((fileMatch, index) => {
      console.log(`   File ${index + 1}: ${fileMatch.resource.fsPath}`)
    })

    console.log('\n✅ All tests completed!')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error(error.stack)
  }
}

// Run the test
testWorkspaceSearch().catch(console.error)
