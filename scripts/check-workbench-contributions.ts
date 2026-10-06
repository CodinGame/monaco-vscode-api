import path from 'node:path'
import { fileURLToPath } from 'node:url'
import glob from 'fast-glob'
import ts from 'typescript'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = path.join(repositoryRoot, 'src')
const vscodeSourceRoot = path.join(repositoryRoot, 'vscode/src')
const sourceFilePattern = 'src/**/*.{ts,tsx,js,jsx,mjs,cjs}'

const ignoredContributions = new Set([
  'vs/platform/actionWidget/browser/actionWidget',
  'vs/workbench/services/extensionManagement/browser/extensionBisect'
])

const checks = {
  workbench: {
    entryPoint: 'vs/workbench/workbench.web.main.js',
    excludedSourceFilePattern: 'src/service-override/*/session.ts'
  },
  sessions: {
    entryPoint: 'vs/sessions/sessions.web.main.js',
    excludedSourceFilePattern: 'src/service-override/*/classic.ts'
  }
} as const

const checkName = process.argv[2] ?? 'workbench'
if (!(checkName in checks)) {
  throw new Error(
    `Unknown contribution check "${checkName}". Expected: ${Object.keys(checks).join(', ')}`
  )
}

const check = checks[checkName as keyof typeof checks]
const entryPoint = path.join(vscodeSourceRoot, check.entryPoint)

const configPath = path.join(repositoryRoot, 'tsconfig.json')
const config = ts.readConfigFile(configPath, ts.sys.readFile)

if (config.error != null) {
  throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'))
}

const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, repositoryRoot)

function isInside(parent: string, candidate: string): boolean {
  const relativePath = path.relative(parent, candidate)
  return (
    relativePath !== '..' &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  )
}

interface ImportedModule {
  moduleName: string
  sideEffectOnly: boolean
}

interface ImportGraph {
  contributionCandidates: Set<string>
  visited: Set<string>
}

function getImportedModules(filePath: string): ImportedModule[] {
  const sourceText = ts.sys.readFile(filePath)
  if (sourceText == null) {
    throw new Error(`Unable to read ${path.relative(repositoryRoot, filePath)}`)
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS
  )
  const importedModules: ImportedModule[] = []

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      importedModules.push({
        moduleName: statement.moduleSpecifier.text,
        sideEffectOnly: statement.importClause == null
      })
    } else if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier != null &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      importedModules.push({
        moduleName: statement.moduleSpecifier.text,
        sideEffectOnly: false
      })
    }
  }

  return importedModules
}

function containsContributionSideEffects(filePath: string): boolean {
  const sourceText = ts.sys.readFile(filePath)
  if (sourceText == null) {
    throw new Error(`Unable to read ${path.relative(repositoryRoot, filePath)}`)
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS
  )

  return sourceFile.statements.some((statement) => {
    if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) {
      return false
    }

    const calledExpression = statement.expression.expression
    const methodName = ts.isIdentifier(calledExpression)
      ? calledExpression.text
      : ts.isPropertyAccessExpression(calledExpression)
        ? calledExpression.name.text
        : undefined

    return (
      methodName === 'registerConfiguration' ||
      methodName === 'registerContribution' ||
      methodName === 'registerContribution2' ||
      methodName === 'registerAction' ||
      methodName === 'registerAction2' ||
      methodName === 'registerExtensionPoint'
    )
  })
}

function resolveImportedModule(moduleName: string, containingFile: string): string | undefined {
  const resolvedFile = ts.resolveModuleName(moduleName, containingFile, options, ts.sys)
    .resolvedModule?.resolvedFileName
  if (resolvedFile == null) {
    return undefined
  }

  const runtimeFile = resolvedFile
    .replace(/\.d\.mts$/, '.mjs')
    .replace(/\.d\.cts$/, '.cjs')
    .replace(/\.d\.ts$/, '.js')

  return runtimeFile !== resolvedFile && ts.sys.fileExists(runtimeFile) ? runtimeFile : resolvedFile
}

function getModuleName(filePath: string): string {
  return path
    .relative(vscodeSourceRoot, filePath)
    .split(path.sep)
    .join('/')
    .replace(/\.[cm]?[jt]sx?$/, '')
}

function analyzeImportGraph(entryPoints: string[], excludedFiles = new Set<string>()): ImportGraph {
  const contributionCandidates = new Set<string>()
  const visited = new Set<string>()
  const pending = [...entryPoints]

  while (pending.length > 0) {
    const filePath = path.resolve(pending.pop()!)
    if (visited.has(filePath) || excludedFiles.has(filePath)) {
      continue
    }
    visited.add(filePath)

    if (isInside(vscodeSourceRoot, filePath) && containsContributionSideEffects(filePath)) {
      contributionCandidates.add(filePath)
    }

    for (const importedModule of getImportedModules(filePath)) {
      const resolvedFile = resolveImportedModule(importedModule.moduleName, filePath)
      if (
        resolvedFile != null &&
        (isInside(sourceRoot, resolvedFile) || isInside(vscodeSourceRoot, resolvedFile))
      ) {
        pending.push(resolvedFile)
      }
    }
  }

  return { contributionCandidates, visited }
}

function getContributions(graph: ImportGraph, candidates: Set<string>): Set<string> {
  return new Set(
    [...candidates]
      .filter((candidate) => graph.visited.has(candidate))
      .map((candidate) => getModuleName(candidate))
  )
}

const sourceFiles = await glob(sourceFilePattern, {
  absolute: true,
  cwd: repositoryRoot,
  ignore: [check.excludedSourceFilePattern]
})
const excludedSourceFiles = new Set(
  await glob(check.excludedSourceFilePattern, { absolute: true, cwd: repositoryRoot })
)

const entryPointGraph = analyzeImportGraph([entryPoint])
const sourceGraph = analyzeImportGraph(sourceFiles, excludedSourceFiles)
const contributionCandidates = new Set([
  ...entryPointGraph.contributionCandidates,
  ...sourceGraph.contributionCandidates
])
const entryPointContributions = getContributions(entryPointGraph, contributionCandidates)
const sourceContributions = getContributions(sourceGraph, contributionCandidates)
const onlyInEntryPoint = [...entryPointContributions]
  .filter((contribution) => !sourceContributions.has(contribution))
  .filter((contribution) => !ignoredContributions.has(contribution))
  .sort()
const onlyInSource = [...sourceContributions]
  .filter((contribution) => !entryPointContributions.has(contribution))
  .filter((contribution) => !ignoredContributions.has(contribution))
  .sort()

if (onlyInEntryPoint.length > 0) {
  console.error(`Contributions imported only from vscode/src/${check.entryPoint}:`)
  console.error(onlyInEntryPoint.map((contribution) => `  - ${contribution}`).join('\n'))
}

if (onlyInSource.length > 0) {
  console.error('Contributions imported only from src:')
  console.error(onlyInSource.map((contribution) => `  - ${contribution}`).join('\n'))
}

if (onlyInEntryPoint.length > 0 || onlyInSource.length > 0) {
  process.exitCode = 1
} else {
  console.log(
    `All ${entryPointContributions.size} ${checkName} contributions are imported from src.`
  )
}
