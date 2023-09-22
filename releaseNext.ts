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

function escapeRegExp (string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const vscodeVersion = process.argv[process.argv.length - 1]!
const minorVscodeVersion = `${semver.major(vscodeVersion)}.${semver.minor(vscodeVersion)}`
const tagPattern = new RegExp(`^v?(${escapeRegExp(minorVscodeVersion)}\\.\\d+)$`)

async function getLastTag () {
  const tags = (await $`git tag -l --sort=-v:refname`).toString().split('\n').map(tag => tag.trim())

  const matchingTags = tags.filter(tag => tagPattern.test(tag)).sort(semver.compare)
  const lastTag = matchingTags[matchingTags.length - 1]!

  return lastTag
}

async function getNextVersion (lastTag: string) {
  // Find available next version
  const allVersions = new Set(Object.keys((await packageJson('@codingame/monaco-vscode-api', {
    allVersions: true
  })).versions))
  let nextVersion: string = lastTag
  do {
    nextVersion = semver.inc(nextVersion, 'prerelease', true, 'next')!
  } while (allVersions.has(nextVersion))

  return nextVersion
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
      await fs.writeFile(packageJsonFile, JSON.stringify(packageJson, null, 2))

      $.cwd = libDir
      await $`npm publish --tag next`
    }
  }
}

async function run () {
  const lastTag = await getLastTag()
  const nextVersion = await getNextVersion(lastTag)
  await publishNpm(nextVersion)
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
