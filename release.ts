/**
 * This script was inspired by https://dev.to/antongolub/you-don-t-need-semantic-release-sometimes-3k6k
 */
import semanticRelease, { Options as SemanticReleaseOptions } from 'semantic-release'
import { $ } from 'zx'
import yargs, { Options } from 'yargs'
import path from 'path'
import fs from 'fs/promises'
import syncFs from 'fs'
import { fileURLToPath } from 'url'
import util from 'node:util'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const { NPM_TOKEN } = process.env
if (NPM_TOKEN == null) {
  throw new Error('env.NPM_TOKEN must be set')
}

async function publishNpm (version: string, tag: string = 'latest') {
  const distDir = path.resolve(__dirname, 'dist')
  for (const dirName of await fs.readdir(distDir)) {
    const libDir = path.resolve(distDir, dirName)
    const packageJsonFile = path.resolve(libDir, 'package.json')
    if (syncFs.existsSync(packageJsonFile)) {
      const packageJson = JSON.parse((await fs.readFile(packageJsonFile)).toString())
      packageJson.version = version
      if (packageJson.dependencies?.vscode != null) {
        packageJson.dependencies.vscode = `npm:@codingame/monaco-vscode-api@${version}`
      }
      for (const dependency in packageJson.dependencies) {
        if (dependency.startsWith('@codingame/monaco-vscode-')) {
          packageJson.dependencies[dependency] = version
        }
      }
      await fs.writeFile(path.resolve(libDir, '.npmrc'), `//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n`)
      await fs.writeFile(packageJsonFile, JSON.stringify(packageJson, null, 2))

      $.cwd = libDir
      await $`npm publish --tag "${tag}" --access public`
    }
  }
}

async function run (options: SemanticReleaseOptions) {
  const result = await semanticRelease(
    {
      ...options,
      plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        '@semantic-release/github'
      ],
      branches: [
        'main',
        { name: '*', channel: 'next', prerelease: true }
      ],
      extends: '@codingame/semantic-release-config'
    }
  )

  if (result === false) {
    return
  }

  if (options.dryRun ?? false) {
    return
  }

  await publishNpm(result.nextRelease.version, result.nextRelease.channel)
}

async function cli () {
  const stringList: Options = {
    type: 'string',
    array: true,
    coerce: (values: string[]) =>
      values.length === 1 && values[0]!.trim() === 'false'
        ? []
        : values.reduce((values, value) => values.concat(value.split(',').map((value) => value.trim())), <string[]>[])
  }

  const argv = process.argv.slice(2)
  const cli = yargs(argv)
    .command('$0', 'Run automated package publishing', (yargs) => {
      yargs.demandCommand(0, 0).usage(`Run automated package publishing

  Usage:
  release [options] [plugins]`)
    })
    .option('b', { alias: 'branches', describe: 'Git branches to release from', ...stringList, group: 'Options' })
    .option('r', { alias: 'repository-url', describe: 'Git repository URL', type: 'string', group: 'Options' })
    .option('t', { alias: 'tag-format', describe: 'Git tag format', type: 'string', group: 'Options' })
    .option('p', { alias: 'plugins', describe: 'Plugins', ...stringList, group: 'Options' })
    .option('e', { alias: 'extends', describe: 'Shareable configurations', ...stringList, group: 'Options' })
    .option('ci', { describe: 'Toggle CI verifications', type: 'boolean', group: 'Options' })
    .option('verify-conditions', { ...stringList, group: 'Plugins' })
    .option('analyze-commits', { type: 'string', group: 'Plugins' })
    .option('verify-release', { ...stringList, group: 'Plugins' })
    .option('generate-notes', { ...stringList, group: 'Plugins' })
    .option('prepare', { ...stringList, group: 'Plugins' })
    .option('publish', { ...stringList, group: 'Plugins' })
    .option('success', { ...stringList, group: 'Plugins' })
    .option('fail', { ...stringList, group: 'Plugins' })
    .option('d', { alias: 'dry-run', describe: 'Skip publishing', type: 'boolean', group: 'Options' })
    .option('h', { alias: 'help', group: 'Options' })
    .strict(false)
    .exitProcess(false)

  const { help, version, ...options } = await cli.parse(argv)

  if (Boolean(help) || Boolean(version)) {
    return
  }

  await run(options)
}

cli().catch(error => {
  console.error(util.inspect(error, { colors: true }))
  process.exit(1)
})
