import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import * as path from 'path'
import { fileURLToPath } from 'url'
import pkg from '../package.json' assert { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXTENSIONS = ['', '.ts', '.js']
const BASE_DIR = path.resolve(__dirname, '..')
const TSCONFIG = path.resolve(BASE_DIR, 'tsconfig.rollup.json')

const externals = Object.keys(pkg.peerDependencies)
const config: rollup.RollupOptions = {
  cache: false,
  external: (source) => {
    if (source === 'graceful-fs' || source === 'xterm-headless') {
      // commonjs module
      return false
    }
    return externals.some(external => source === external || source.startsWith(`${external}/`))
  },
  output: [{
    format: 'esm',
    dir: 'dist/server',
    entryFileNames: '[name].js',
    chunkFileNames: '[name].js'
  }],
  input: {
    server: 'src/server/server.ts',
    'bootstrap-fork': 'src/server/bootstrap-fork.ts'
  },
  plugins: [
    json({
      compact: true,
      namedExports: false,
      preferConst: false
    }),
    commonjs({
      ignoreDynamicRequires: true
    }),
    nodeResolve({
      extensions: EXTENSIONS,
      modulePaths: ['vscode/src'],
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
