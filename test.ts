import { $ } from 'zx'
import semver from 'semver'
import fs from 'fs'

const test2 = semver.parse('2.1.2+vscode-1-68.monaco-0-33')!
console.log(test2, semver.inc(test2, 'patch', { includePrerelease: true }))

function escapeRegExp (string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

async function test () {
  const monacoVersion = (await $`npm view monaco-editor version`).toString()
  const minorMonacoVersion = `${semver.major(monacoVersion)}.${semver.minor(monacoVersion)}`
  const vscodeVersion = fs.readFileSync('VERSION', 'utf8')
  const minorVscodeVersion = `${semver.major(vscodeVersion)}.${semver.minor(vscodeVersion)}`

  const tags = (await $`git tag -l --sort=-v:refname`).toString().split('\n').map(tag => tag.trim())

  const pattern = new RegExp(`^v?${escapeRegExp(minorVscodeVersion)}\\.(\\d+)-monaco-\\d+\\.\\d+$`)
  console.log(pattern)
  const lastTag = tags.find(tag => pattern.test(tag))

  if (lastTag == null) {
    return
  }

  const match = pattern.exec(lastTag)!
  const patchVersion = parseInt(match[1]!)

  const nextVersion = `${minorVscodeVersion}.${patchVersion + 1}-`

  console.log(tags, lastTag, patchVersion)
}

test()
