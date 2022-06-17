/**
 * This script was inspired by https://dev.to/antongolub/you-don-t-need-semantic-release-sometimes-3k6k
 */

import { $ } from 'zx'
import semver from 'semver'
import fs from 'fs/promises'

const { GIT_COMMITTER_NAME, GITHUB_TOKEN, NPM_TOKEN } = process.env
if (GITHUB_TOKEN == null || GIT_COMMITTER_NAME == null || NPM_TOKEN == null) {
  throw new Error('env.GITHUB_TOKEN, env.NPM_TOKEN & env.GIT_COMMITTER_EMAIL must be set')
}

function escapeRegExp (string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const vscodeVersion = process.argv[process.argv.length - 1]!
const minorVscodeVersion = `${semver.major(vscodeVersion)}.${semver.minor(vscodeVersion)}`
const tagPattern = new RegExp(`^v?(${escapeRegExp(minorVscodeVersion)}\\.\\d+)$`)

async function getLastTag () {
  const tags = (await $`git tag -l --sort=-v:refname`).toString().split('\n').map(tag => tag.trim())

  const lastTag = tags.find(tag => tagPattern.test(tag))
  return lastTag
}

async function getNextVersion (lastTag?: string) {
  return lastTag != null ? semver.inc(tagPattern.exec(lastTag)![1]!, 'patch')! : `${minorVscodeVersion}.0`
}

interface RepositoryInfos {
  publicUrl: string
  authedUrl: string
  name: string
}
async function getRepoInformations (): Promise<RepositoryInfos> {
  const gitAuth = `${GIT_COMMITTER_NAME}:${GITHUB_TOKEN}`
  const originUrl = (await $`git config --get remote.origin.url`).toString().trim()
  const [,, repoHost, repoName] = originUrl.replace(':', '/').replace(/\.git/, '').match(/.+(@|\/\/)([^/]+)\/(.+)$/)!
  const publicUrl = `https://${repoHost}/${repoName}`
  const authedUrl = `https://${gitAuth}@${repoHost}/${repoName}`

  return {
    publicUrl,
    authedUrl,
    name: repoName!
  }
}

async function generateReleaseNodes (repoInfos: RepositoryInfos, version: string, lastTag?: string) {
  const tag = `v${version}`

  const newCommits = (lastTag != null
    ? await $`git log --format=+++%s__%b__%h__%H ${await $`git rev-list -1 ${lastTag}`}..HEAD`
    : await $`git log --format=+++%s__%b__%h__%H HEAD`)
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
  const tag = `v${version}`

  const releaseData = JSON.stringify({
    name: tag,
    tag_name: tag,
    body: releaseNotes
  })
  await $`curl -u ${GIT_COMMITTER_NAME}:${GITHUB_TOKEN} -H "Accept: application/vnd.github.v3+json" https://api.github.com/repos/${repoInfos.name}/releases -d ${releaseData}`
}

async function publishNpm (version: string) {
  await fs.writeFile('.npmrc', `//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n`)
  await $`npm --no-git-tag-version version ${version}`
  await $`npm publish --no-git-tag-version`
}

async function run () {
  const repoInfos = await getRepoInformations()
  const lastTag = await getLastTag()
  const nextVersion = await getNextVersion(lastTag)
  const releaseNotes = await generateReleaseNodes(repoInfos, nextVersion, lastTag)
  await releaseGithub(repoInfos, nextVersion, releaseNotes)
  await publishNpm(nextVersion)
}

void run()
