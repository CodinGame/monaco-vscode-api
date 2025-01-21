import { fileURLToPath } from 'node:url'
import * as fs from 'node:fs'
import * as nodePath from 'node:path'

export const pkg = JSON.parse(
  fs.readFileSync(new URL('../../package.json', import.meta.url).pathname).toString()
)

const __dirname = nodePath.dirname(fileURLToPath(import.meta.url))

export const EXTENSIONS = ['', '.ts', '.js']

export const BASE_DIR = nodePath.resolve(__dirname, '../..')
export const TSCONFIG = nodePath.resolve(BASE_DIR, 'tsconfig.rollup.json')
export const SRC_DIR = nodePath.resolve(BASE_DIR, 'src')
export const DIST_DIR = nodePath.resolve(BASE_DIR, 'dist')
export const DIST_DIR_MAIN = nodePath.resolve(DIST_DIR, 'tmp')
export const VSCODE_DIR = nodePath.resolve(BASE_DIR, 'vscode')
export const VSCODE_SRC_DIR = nodePath.resolve(VSCODE_DIR, 'src')
export const OVERRIDE_PATH = nodePath.resolve(BASE_DIR, 'src/override')

const externals = Object.keys({ ...pkg.dependencies })
export const external = (source: string, importer?: string): boolean => {
  if (importer != null && importer.startsWith(VSCODE_DIR) && source === 'vscode') {
    // if vscode is imported from vscode code itself, mark it as external
    return true
  }
  if (source.includes('tas-client-umd')) return true
  return externals.some((external) => source === external || source.startsWith(`${external}/`))
}
