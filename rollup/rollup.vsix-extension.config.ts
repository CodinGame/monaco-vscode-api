import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import typescript from '@rollup/plugin-typescript'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXTENSIONS = ['', '.ts', '.js']
const BASE_DIR = path.resolve(__dirname, '..')
const TSCONFIG = path.resolve(BASE_DIR, 'tsconfig.json')

const config: rollup.RollupOptions = {
  cache: false,
  treeshake: {
    preset: 'smallest'
  },
  external: ['@rollup/pluginutils', 'path', 'yauzl'],
  output: [{
    format: 'esm',
    dir: 'dist',
    entryFileNames: '[name].js'
  }],
  input: 'src/rollup-vsix-plugin.ts',
  plugins: [
    nodeResolve({
      extensions: EXTENSIONS
    }),
    typescript({
      noEmitOnError: true,
      tsconfig: TSCONFIG
    })
  ]
}

export default config
