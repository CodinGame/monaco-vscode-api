import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

// The main thread customers of the optional extension host contributions (chat, notebook, mcp...) are only registered by
// the corresponding service overrides, but the extension host requires all of them to be registered.
// This check makes sure they all have a fallback in missingMainThreadCustomers.ts

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const apiBrowserRoot = path.join(repositoryRoot, 'vscode/src/vs/workbench/api/browser')
const missingMainThreadCustomersPath = path.join(
  repositoryRoot,
  'src/service-override/tools/missingMainThreadCustomers.ts'
)

const baseContribution = './extensionHost.base.contribution.js'

function parseFile(filePath: string): ts.SourceFile {
  return ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, 'utf-8'),
    ts.ScriptTarget.Latest,
    true
  )
}

function getSideEffectImports(filePath: string): string[] {
  return parseFile(filePath)
    .statements.filter(
      (statement): statement is ts.ImportDeclaration & { moduleSpecifier: ts.StringLiteral } =>
        ts.isImportDeclaration(statement) &&
        statement.importClause == null &&
        ts.isStringLiteral(statement.moduleSpecifier) &&
        statement.moduleSpecifier.text.startsWith('./')
    )
    .map((statement) => statement.moduleSpecifier.text)
}

// Returns X for a `MainContext.X` expression
function getMainContextId(node: ts.Node | undefined): string | undefined {
  if (
    node != null &&
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'MainContext'
  ) {
    return node.name.text
  }
  return undefined
}

// Customers registered using `extHostNamedCustomer(MainContext.X)` or `extHostContext.set(MainContext.X, ...)`
function getRegisteredCustomers(filePath: string): string[] {
  const customers: string[] = []
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const callee = node.expression
      const isRegistration =
        (ts.isIdentifier(callee) && callee.text === 'extHostNamedCustomer') ||
        (ts.isPropertyAccessExpression(callee) && callee.name.text === 'set')
      const customer = isRegistration ? getMainContextId(node.arguments[0]) : undefined
      if (customer != null) {
        customers.push(customer)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(parseFile(filePath))
  return customers
}

// Ids of the `missingMainThreadCustomers` array entries
function getDeclaredCustomers(filePath: string): Set<string> {
  const customers = new Set<string>()
  let found = false
  function visit(node: ts.Node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'missingMainThreadCustomers' &&
      node.initializer != null &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      found = true
      for (const element of node.initializer.elements) {
        const customer = ts.isArrayLiteralExpression(element)
          ? getMainContextId(element.elements[0])
          : undefined
        if (customer == null) {
          throw new Error(`Unexpected missingMainThreadCustomers entry: ${element.getText()}`)
        }
        customers.add(customer)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(parseFile(filePath))
  if (!found) {
    throw new Error(`missingMainThreadCustomers array not found in ${filePath}`)
  }
  return customers
}

const optionalContributions = getSideEffectImports(
  path.join(apiBrowserRoot, 'extensionHost.contribution.js')
).filter((contribution) => contribution !== baseContribution)

if (optionalContributions.length === 0) {
  throw new Error('No optional extension host contribution found')
}

const expectedCustomers = new Map<string, string>()
for (const contribution of optionalContributions) {
  for (const mainThreadFile of getSideEffectImports(path.join(apiBrowserRoot, contribution))) {
    for (const customer of getRegisteredCustomers(path.join(apiBrowserRoot, mainThreadFile))) {
      expectedCustomers.set(customer, contribution)
    }
  }
}

const declaredCustomers = getDeclaredCustomers(missingMainThreadCustomersPath)

const missing = [...expectedCustomers.keys()].filter((customer) => !declaredCustomers.has(customer))
const extra = [...declaredCustomers].filter((customer) => !expectedCustomers.has(customer))

if (missing.length > 0) {
  console.error(
    `Main thread customers without fallback in ${path.relative(repositoryRoot, missingMainThreadCustomersPath)}:`
  )
  console.error(
    missing
      .sort()
      .map((customer) => `  - ${customer} (from ${expectedCustomers.get(customer)})`)
      .join('\n')
  )
}

if (extra.length > 0) {
  console.error(
    'Main thread customers declared as missing but not registered by an optional contribution:'
  )
  console.error(
    extra
      .sort()
      .map((customer) => `  - ${customer}`)
      .join('\n')
  )
}

if (missing.length > 0 || extra.length > 0) {
  process.exitCode = 1
} else {
  console.log(`All ${expectedCustomers.size} optional main thread customers have a fallback.`)
}
