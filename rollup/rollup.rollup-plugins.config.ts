import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXTENSIONS = ['', '.ts', '.js']
const BASE_DIR = path.resolve(__dirname, '..')
const TSCONFIG = path.resolve(BASE_DIR, 'tsconfig.rollup.json')

const config: rollup.RollupOptions = {
  cache: false,
  external: ['@rollup/pluginutils', 'path', 'yauzl'],
  output: [{
    format: 'esm',
    dir: 'dist',
    entryFileNames: '[name].js',
    chunkFileNames: '[name].js'
  }],
  input: [
    'src/rollup-vsix-plugin.ts',
    'src/rollup-extension-directory-plugin.ts',
    'src/workers/extensionWorker.ts'
  ],
  plugins: [
    commonjs(),
    nodeResolve({
      extensions: EXTENSIONS,
      modulePaths: ['vscode/'],
      browser: false,
      preferBuiltins: true
    }),
    typescript({
      noEmitOnError: true,
      tsconfig: TSCONFIG
    }),
    json({
      compact: true,
      namedExports: false,
      preferConst: false
    })
  ]
}

export default config
