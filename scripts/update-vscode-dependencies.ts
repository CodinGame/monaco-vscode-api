import semver from 'semver'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const EXCLUDE_VSCODE_DEPENDENCIES = new Set([
  'typescript',
  'eslint',
  '@vscode/vscode-languagedetection'
])

function getAbsolutePackageJsonPath (relativePath: string) {
  return path.join(__dirname, relativePath, 'package.json')
}

async function readJson (jsonPath: string) {
  const packageJson = JSON.parse(await readFile(jsonPath, 'utf8'))
  return packageJson
}

async function updateVSCodeDependencies () {
  console.debug('Reading monaco-vscode-api package.json...')
  const apiPackageJsonPath = getAbsolutePackageJsonPath('..')
  const apiPackageJson = await readJson(apiPackageJsonPath)

  console.debug('Reading vscode package.json...')
  const vsCodePackageJson = await readJson(getAbsolutePackageJsonPath('../vscode'))

  console.debug('Updating monaco-vscode-api dependencies with vscode dependencies versions...')
  const vscodeDependencies: string[] = []

  for (const dependency in apiPackageJson.dependencies) {
    if (EXCLUDE_VSCODE_DEPENDENCIES.has(dependency)) {
      continue
    }
    const vscodeDependencyVersion = vsCodePackageJson.dependencies[dependency] ?? vsCodePackageJson.devDependencies[dependency]
    if (vscodeDependencyVersion != null) {
      apiPackageJson.dependencies[dependency] = vscodeDependencyVersion
      vscodeDependencies.push(dependency)
    }
  }

  console.debug('Updating monaco-vscode-api overrides with vscode dependencies versions...')
  for (const dependency in apiPackageJson.overrides) {
    if (dependency in vsCodePackageJson.dependencies) {
      apiPackageJson.overrides[dependency] = vsCodePackageJson.dependencies[dependency]
    }
  }

  console.debug('Updating monaco-vscode-api ncurc to prevent VSCode dependencies from being updated by ncu')
  const ncuRcPath = path.join(__dirname, '../.ncurc.json')
  const ncuRc = await readJson(ncuRcPath)
  ncuRc.reject = [
    '@types/node',
    '@types/vscode',
    'vscode-semver',
    'marked',
    '@types/vscode-semver',
    ...vscodeDependencies
  ].sort()
  await writeFile(ncuRcPath, JSON.stringify(ncuRc, null, 2))

  // update the dev dependency @types/vscode version to the same as config.version in the package.json
  const version = semver.parse(vsCodePackageJson.version)!
  version.patch = 0
  apiPackageJson.devDependencies['@types/vscode'] = `~${version.format()}`

  console.debug('Writing monaco-vscode-api package.json...')
  await writeFile(apiPackageJsonPath, `${JSON.stringify(apiPackageJson, null, 2)}\n`)
  console.debug('Dependencies updated')
}

updateVSCodeDependencies().catch(error => {
  console.error('Unable to update monaco-vscode-api dependencies', error)
  process.exit(1)
})
