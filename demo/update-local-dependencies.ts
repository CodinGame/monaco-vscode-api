import { PackageJson } from 'type-fest'
import * as fs from 'node:fs'
import * as nodePath from 'node:path'

const packageJsonFile = new URL('./package.json', import.meta.url).pathname
const packageJson: PackageJson = JSON.parse(
  (await fs.promises.readFile(packageJsonFile)).toString('utf-8')
)

const packagesUrl = new URL('../dist/packages', import.meta.url)

const aliases: Record<string, string> = {
  '@codingame/monaco-vscode-api': 'vscode',
  '@codingame/monaco-vscode-editor-api': 'monaco-editor'
}

const packages = (await fs.promises.readdir(packagesUrl)).map((name) =>
  nodePath.resolve(packagesUrl.pathname, name)
)

const allLocalDependencies = await Promise.all(
  packages.map(async (absoluteDirectory) => {
    const packageJsonPath = nodePath.resolve(absoluteDirectory, './package.json')
    const packageName = (<PackageJson>(
      JSON.parse((await fs.promises.readFile(packageJsonPath)).toString('utf-8'))
    )).name!

    return <[string, string]>[
      aliases[packageName] ?? packageName,
      `file:${nodePath.relative(nodePath.dirname(new URL(import.meta.url).pathname), absoluteDirectory)}`
    ]
  })
)
const localDependencies = Object.fromEntries(
  allLocalDependencies.filter(([name]) => !name.includes('rollup'))
)
const localDevDependencies = Object.fromEntries(
  allLocalDependencies.filter(([name]) => name.includes('rollup'))
)

const newPackageJson = {
  ...packageJson,
  dependencies: {
    ...Object.fromEntries(
      Object.entries(packageJson.dependencies!).filter(
        ([, version]) => !version!.startsWith('file:')
      )
    ),
    ...localDependencies
  },
  devDependencies: {
    ...Object.fromEntries(
      Object.entries(packageJson.devDependencies!).filter(
        ([, version]) => !version!.startsWith('file:')
      )
    ),
    ...localDevDependencies
  }
}

await fs.promises.writeFile(packageJsonFile, JSON.stringify(newPackageJson, null, 2))
