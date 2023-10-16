import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getAbsolutePackageJsonPath (relativePath: string) {
  return path.join(__dirname, relativePath, 'package.json')
}

async function readPackageJson (packageJsonPath: string) {
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))
  return packageJson
}

async function updateVSCodeDependencies () {
  console.debug('Reading monaco-vscode-api package.json...')
  const apiPackageJsonPath = getAbsolutePackageJsonPath('..')
  const apiPackageJson = await readPackageJson(apiPackageJsonPath)

  console.debug('Reading vscode package.json...')
  const vsCodePackageJson = await readPackageJson(getAbsolutePackageJsonPath('../vscode'))

  console.debug('Updating monaco-vscode-api dependencies with vscode dependencies versions...')
  for (const dependency in apiPackageJson.dependencies) {
    if (dependency in vsCodePackageJson.dependencies) {
      apiPackageJson.dependencies[dependency] = vsCodePackageJson.dependencies[dependency]
    }
  }

  console.debug('Updating monaco-vscode-api overrides with vscode dependencies versions...')
  for (const dependency in apiPackageJson.overrides) {
    if (dependency in vsCodePackageJson.dependencies) {
      apiPackageJson.overrides[dependency] = vsCodePackageJson.dependencies[dependency]
    }
  }
  // update the dev dependency @types/vscode version to the same as config.version in the package.json
  apiPackageJson.devDependencies['@types/vscode'] = `~${vsCodePackageJson.version}`

  console.debug('Writing monaco-vscode-api package.json...')
  await writeFile(apiPackageJsonPath, JSON.stringify(apiPackageJson, null, 2))
  console.debug('Dependencies updated')
}

updateVSCodeDependencies().catch(error => {
  console.error('Unable to update monaco-vscode-api dependencies', error)
  process.exit(1)
})
