import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import typescript from '@rollup/plugin-typescript'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXTENSIONS = ['', '.ts', '.js']
const BASE_DIR = path.resolve(__dirname, '..')
const TSCONFIG = path.resolve(BASE_DIR, 'tsconfig.rollup.json')

const config: rollup.RollupOptions = {
  cache: false,
  external: ['path'],
  output: [{
    format: 'esm',
    dir: 'dist',
    entryFileNames: '[name].js'
  }],
  input: [
    'src/monaco-treemending.ts'
  ],
  plugins: [
    nodeResolve({
      extensions: EXTENSIONS,
      modulePaths: ['vscode/'],
      browser: false,
      preferBuiltins: true
    }),
    typescript({
      noEmitOnError: true,
      tsconfig: TSCONFIG
    })
  ]
}

export default config
