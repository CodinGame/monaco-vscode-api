/**
 * This script was inspired by https://dev.to/antongolub/you-don-t-need-semantic-release-sometimes-3k6k
 */

import { $ } from 'zx'
import semver from 'semver'
import packageJson from 'package-json'
import path from 'path'
import fs from 'fs/promises'
import syncFs from 'fs'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Comes from https://github.com/semantic-release/semantic-release/blob/9589a96239826abe9b07e8deffcc7d8aeb9c2e40/index.js#L45
 */
const COMMIT_NAME = 'release-bot'
const COMMIT_EMAIL = 'release-bot@codingame.com'
$.env = {
  GIT_AUTHOR_NAME: COMMIT_NAME,
  GIT_AUTHOR_EMAIL: COMMIT_EMAIL,
  GIT_COMMITTER_NAME: COMMIT_NAME,
  GIT_COMMITTER_EMAIL: COMMIT_EMAIL,
  ...process.env,
  GIT_ASKPASS: 'echo',
  GIT_TERMINAL_PROMPT: '0'
}

const vscodeVersion = process.argv[process.argv.length - 1]!
const vscodeVersionRange = `${semver.major(vscodeVersion)}.${semver.minor(vscodeVersion)}.*`

async function getNextVersion () {
  const allVersions = new Set(Object.keys((await packageJson('@codingame/monaco-vscode-api', {
    allVersions: true
  })).versions))

  const lastPublishedVersion = semver.maxSatisfying(Array.from(allVersions), vscodeVersionRange, { includePrerelease: true })

  if (lastPublishedVersion != null) {
    return semver.inc(lastPublishedVersion, 'prerelease', true, 'next')!
  } else {
    return `${semver.major(vscodeVersion)}.${semver.minor(vscodeVersion)}.0-next.0`
  }
}

async function publishNpm (version: string) {
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
      await fs.writeFile(packageJsonFile, JSON.stringify(packageJson, null, 2))

      $.cwd = libDir
      await $`npm publish --tag next --access public`
    }
  }
}

async function run () {
  const nextVersion = await getNextVersion()
  await publishNpm(nextVersion)
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
