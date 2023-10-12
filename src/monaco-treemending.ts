import { applyPatches, ParsedDiff } from 'diff'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

declare const MONACO_VERSION: string

const require = createRequire(import.meta.url)

async function run () {
  const patchContent = await fs.readFile(fileURLToPath(new URL('../monaco-editor-treemending.patch', import.meta.url)))

  const monacoDirectory = path.dirname(require.resolve('monaco-editor/monaco.d.ts', { paths: [process.cwd()] }))
  const monacoEsmDirectory = path.resolve(monacoDirectory, 'esm')
  const monacoPackageJsonFile = path.resolve(monacoDirectory, 'package.json')

  const monacoPackageJson = JSON.parse((await fs.readFile(monacoPackageJsonFile)).toString('utf-8'))
  const monacoVersion = monacoPackageJson.version

  const alreadyPatched: boolean = monacoPackageJson.treemended ?? false
  if (alreadyPatched) {
    // eslint-disable-next-line no-console
    console.info('Monaco-editor has already been tree-mended, ignoring')
    process.exit(0)
  }

  if (typeof MONACO_VERSION !== 'undefined' && MONACO_VERSION !== monacoVersion) {
    console.error(`Wrong monaco-editor version: expecting ${MONACO_VERSION}, got ${monacoVersion}`)
    process.exit(1)
  }

  // pnpm WA: copy files to a temp directory and patch files there. When finished copy back
  let workingDir = monacoEsmDirectory
  let tmpDir: string
  const havePnpm = monacoEsmDirectory.includes('.pnpm')
  if (havePnpm) {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esm-'))
    workingDir = path.resolve(tmpDir, 'esm')
    await fs.cp(monacoEsmDirectory, workingDir, { recursive: true })
  }

  function getMonacoFile (diff: ParsedDiff) {
    return path.resolve(workingDir, diff.oldFileName!.slice('a/'.length))
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

  // in case of pnpm copy the temp esm back
  if (havePnpm) {
    await fs.cp(tmpDir!, monacoDirectory, { recursive: true, force: true })
  }

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
