/**
 * This script was inspired by https://dev.to/antongolub/you-don-t-need-semantic-release-sometimes-3k6k
 */

import { $ } from 'zx'
import semver from 'semver'
import { Octokit } from '@octokit/rest'
import path from 'path'
import fs from 'fs/promises'
import syncFs from 'fs'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const githubToken = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN
if (githubToken == null) {
  throw new Error('env.GITHUB_TOKEN or env.GH_TOKEN must be set')
}

const { NPM_TOKEN } = process.env
if (NPM_TOKEN == null) {
  throw new Error('env.NPM_TOKEN must be set')
}

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
  const lastTag = matchingTags[matchingTags.length - 1]

  return lastTag
}

async function getNextVersion (lastTag?: string) {
  return lastTag != null ? semver.inc(tagPattern.exec(lastTag)![1]!, 'patch')! : `${minorVscodeVersion}.0`
}

function parseGithubUrl (repositoryUrl: string) {
  const [match, auth, host, path] = /^(?!.+:\/\/)(?:(?<auth>.*)@)?(?<host>.*?):(?<path>.*)$/.exec(repositoryUrl) ?? []
  try {
    const [, owner, repo] = /^\/(?<owner>[^/]+)?\/?(?<repo>.+?)(?:\.git)?$/.exec(
      new URL(match != null ? `ssh://${auth != null ? `${auth}@` : ''}${host}/${path}` : repositoryUrl).pathname
    )!
    return { owner, repo }
  } catch {
    return {}
  }
}

interface RepositoryInfos {
  publicUrl: string
  name: string
  owner: string
  repo: string
}
async function getRepoInformations (): Promise<RepositoryInfos> {
  const originUrl = (await $`git config --get remote.origin.url`).toString().trim()
  const [,, repoHost, repoName] = originUrl.replace(':', '/').replace(/\.git/, '').match(/.+(@|\/\/)([^/]+)\/(.+)$/)!
  const publicUrl = `https://${repoHost}/${repoName}`

  const { owner, repo } = parseGithubUrl(originUrl)

  return {
    publicUrl,
    name: repoName!,
    owner: owner!,
    repo: repo!
  }
}

async function generateReleaseNotes (repoInfos: RepositoryInfos, version: string, lastTag?: string) {
  const tag = `v${version}`

  const newCommits = (lastTag != null
    ? await $`git log --format=+++%s__%b__%h__%H ${await $`git rev-list -1 ${lastTag}`}..HEAD --no-merges`
    : await $`git log --format=+++%s__%b__%h__%H HEAD --no-merges`)
    .toString()
    .split('+++')
    .filter(commit => commit.trim() !== '')
    .map(msg => {
      const [subj, body, short, hash] = msg.split('__').map(raw => raw.trim())
      return { subj, body, short, hash }
    })

  const title = lastTag != null ? `[${version}](${repoInfos.publicUrl}/compare/${lastTag}...${tag})` : version
  const releaseDiffRef = `## ${title} (${new Date().toISOString().slice(0, 10)})`

  const releaseDetails = newCommits.map(({ hash, subj, short }) => `* ${subj} ([${short}](${repoInfos.publicUrl}/commit/${hash}))`).join('\n')

  const releaseNotes = releaseDiffRef + '\n' + releaseDetails + '\n'

  return releaseNotes
}

async function releaseGithub (repoInfos: RepositoryInfos, version: string, releaseNotes: string) {
  const gitTag = `v${version}`

  await $`git tag -a ${gitTag} HEAD -m "chore(release): ${version} [skip ci]"`
  await $`git push --follow-tags origin HEAD:refs/heads/master`

  const octokit = new Octokit({
    auth: `token ${githubToken}`
  })

  await octokit.repos.createRelease({
    owner: repoInfos.owner,
    repo: repoInfos.repo,
    tag_name: gitTag,
    body: releaseNotes
  })
}

async function publishNpm (version: string) {
  await fs.writeFile('.npmrc', `//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n`)

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
      await $`npm publish --access public`
    }
  }
}

async function run () {
  const repoInfos = await getRepoInformations()
  const lastTag = await getLastTag()
  const nextVersion = await getNextVersion(lastTag)
  const releaseNotes = await generateReleaseNotes(repoInfos, nextVersion, lastTag)

  await releaseGithub(repoInfos, nextVersion, releaseNotes)
  await publishNpm(nextVersion)
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
