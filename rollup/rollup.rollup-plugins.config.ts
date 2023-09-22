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

const config: rollup.RollupOptions[] = [{
  input: 'src/rollup-vsix-plugin.ts',
  output: 'dist/rollup-vsix-plugin',
  description: `Rollup plugin used to load VSCode extension files (VSIX), designed to be used with ${pkg.name}`
}, {
  input: 'src/rollup-extension-directory-plugin.ts',
  output: 'dist/rollup-extension-directory-plugin',
  description: `Rollup plugin used to load VSCode extension already extracted inside a directory, designed to be used with ${pkg.name}`
}].map(({ input, output, description }) => ({
  cache: false,
  external: [
    ...Object.keys({ ...pkg.dependencies }),
    '@rollup/pluginutils'
  ],
  output: [{
    format: 'esm',
    dir: output,
    entryFileNames: '[name].js',
    chunkFileNames: '[name].js'
  }],
  input,
  plugins: [
    commonjs(),
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
        outDir: output
      }
    }),
    json({
      compact: true,
      namedExports: false,
      preferConst: false
    })
  ]
}

export default config
