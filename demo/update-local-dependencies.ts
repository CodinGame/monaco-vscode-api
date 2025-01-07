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

const newPackageJson = {
  ...packageJson,
  dependencies: {
    ...Object.fromEntries(
      Object.entries(packageJson.dependencies!).filter(
        ([, version]) => !version!.startsWith('file:')
      )
    ),
    ...Object.fromEntries(
      await Promise.all(
        packages.map(async (absoluteDirectory) => {
          const packageJsonPath = nodePath.resolve(absoluteDirectory, './package.json')
          const packageName = (<PackageJson>(
            JSON.parse((await fs.promises.readFile(packageJsonPath)).toString('utf-8'))
          )).name!

          return [
            aliases[packageName] ?? packageName,
            `file:${nodePath.relative(nodePath.dirname(new URL(import.meta.url).pathname), absoluteDirectory)}`
          ]
        })
      )
    )
  }
}

await fs.promises.writeFile(packageJsonFile, JSON.stringify(newPackageJson, null, 2))

// TODO rollup plugins to dev dependencies
