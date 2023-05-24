import { applyPatches, ParsedDiff } from 'diff'
import * as fs from 'fs/promises'
import * as path from 'path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

async function run () {
  const ownPackageJson = JSON.parse((await fs.readFile(require.resolve('../package.json'))).toString('utf-8'))
  const expectedMonacoVersion = ownPackageJson.peerDependencies['monaco-editor']

  const patchContent = await fs.readFile(require.resolve('../monaco-editor-treemending.patch'))

  const monacoDirectory = path.dirname(require.resolve('monaco-editor/monaco.d.ts', { paths: [process.cwd()] }))
  const monacoEsmDirectory = path.resolve(monacoDirectory, 'esm')
  const monacoPackageJsonFile = path.resolve(monacoDirectory, 'package.json')

  const monacoPackageJson = JSON.parse((await fs.readFile(monacoPackageJsonFile)).toString('utf-8'))
  const monacoVersion = monacoPackageJson.version

  if (expectedMonacoVersion !== monacoVersion) {
    console.error(`Wrong monaco-editor version: expecting ${expectedMonacoVersion}, got ${monacoVersion}`)
    process.exit(1)
  }

  const alreadyPatched: boolean = monacoPackageJson.treemended ?? false
  if (alreadyPatched) {
    // eslint-disable-next-line no-console
    console.info('Monaco-editor has already been tree-mended, ignoring')
    process.exit(0)
  }

  function getMonacoFile (diff: ParsedDiff) {
    return path.resolve(monacoEsmDirectory, diff.oldFileName!.slice('a/'.length))
  }

  await new Promise<void>((resolve, reject) => {
    applyPatches(patchContent.toString('utf-8'), {
      loadFile: async function (index: ParsedDiff, callback: (err: unknown, data: string) => void): Promise<void> {
        try {
          const monacoFile = await fs.readFile(getMonacoFile(index))
          callback(null, monacoFile.toString('utf-8'))
        } catch (err) {
          callback(null, '')
        }
      },
      patched: async function (index: ParsedDiff, content: string | false, callback: (err: unknown) => void): Promise<void> {
        const file = getMonacoFile(index)
        if (content === false) {
          callback(new Error(`Unable to apply patch on ${file}`))
          return
        }
        try {
          await fs.mkdir(path.dirname(file), { recursive: true })
          await fs.writeFile(file, content)
          callback(null)
        } catch (err) {
          callback(err)
        }
      },
      complete: function (err: unknown): void {
        if (err != null) {
          reject(err)
        } else {
          resolve()
        }
      }
    })
  })

  // Mark monaco as treemended
  await fs.writeFile(monacoPackageJsonFile, JSON.stringify({
    ...monacoPackageJson,
    treemended: true
  }, null, 2))

  // eslint-disable-next-line no-console
  console.info('Monaco-editor was tree-mended')
  process.exit(0)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
