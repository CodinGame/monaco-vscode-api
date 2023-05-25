import * as os from 'os'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { normalize, resolve } from 'path'
import { createHash } from 'node:crypto'

const walk = async (basePath: string, dirPath: string) => {
  const entries = await readdir(dirPath, {
    encoding: 'binary',
    withFileTypes: true
  })
  let hashes: string[] = []
  for (const entry of entries) {
    const childPath = join(dirPath, entry.name)
    if (entry.isDirectory()) {
      const res = await walk(basePath, childPath)
      hashes = [...hashes, ...res]
    } else {
      const content = await readFile(childPath)
      const output = `{ path: ${childPath.replace(basePath, '')}, hash: ${createHash('sha3-256').update(content).digest('hex')} }`
      hashes.push(output)
    }
  }
  return hashes
}

export const calcModuleHash = async (basePath: string, writeOutput: boolean, outputFile?: string): Promise<string> => {
  const res = await walk(basePath, basePath)
  const joined = res.join(os.EOL)
  const joinedHash = createHash('sha3-256').update(joined).digest('hex')
  if (writeOutput && outputFile != null) {
    await writeFile(outputFile, joinedHash)
  }
  return joined
}

// work as script
const script = process.argv[2]
if (script === '--script') {
  const dirIn = process.argv[3]
  const outputFileIn = process.argv[4]

  if (dirIn != null && outputFileIn != null) {
    const dir = resolve(normalize(dirIn))
    const outputFile = resolve(normalize(outputFileIn))

    const run = async () => {
      await calcModuleHash(dir, true, outputFile)
    }

    run().then(() => {
      // eslint-disable-next-line no-console
      console.info('Monaco-editor hashes were successfully created here: ' + outputFile)
    }, err => {
      console.error(err)
    })
  }
}
