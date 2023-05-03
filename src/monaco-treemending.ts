import { applyPatches, ParsedDiff } from 'diff'
import * as fs from 'fs/promises'
import * as path from 'path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

async function run () {
  const patchContent = await fs.readFile(require.resolve('../monaco-editor-treemending.patch'))

  const monacoDirectory = path.resolve(path.dirname(require.resolve('monaco-editor/monaco.d.ts', { paths: [process.cwd()] })), 'esm')

  function getMonacoFile (diff: ParsedDiff) {
    return path.resolve(monacoDirectory, diff.oldFileName!.slice('a/'.length))
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
}

run().then(() => {
  // eslint-disable-next-line no-console
  console.info('Monaco-editor was tree-mended')
}, err => {
  console.error(err)
})
