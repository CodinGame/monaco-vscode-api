import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import typescript from '@rollup/plugin-typescript'
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets'
import replace from '@rollup/plugin-replace'
import * as path from 'path'
import { fileURLToPath } from 'url'
import pkg from '../package.json' assert { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXTENSIONS = ['', '.ts', '.js']
const BASE_DIR = path.resolve(__dirname, '..')
const TSCONFIG = path.resolve(BASE_DIR, 'tsconfig.rollup.json')

const config: rollup.RollupOptions = {
  cache: false,
  external: ['path'],
  output: [{
    format: 'esm',
    dir: 'dist/main',
    entryFileNames: '[name].js'
  }],
  input: [
    'src/monaco-treemending.ts'
  ],
  plugins: [
    replace({
      MONACO_VERSION: JSON.stringify(pkg.dependencies['monaco-editor']),
      preventAssignment: true
    }),
    nodeResolve({
      extensions: EXTENSIONS,
      modulePaths: ['vscode/src/'],
      browser: false,
      preferBuiltins: true
    }),
    typescript({
      noEmitOnError: true,
      tsconfig: TSCONFIG,
      compilerOptions: {
        outDir: 'dist/main'
      }
    }),
    importMetaAssets()
  ]
}

export default config
