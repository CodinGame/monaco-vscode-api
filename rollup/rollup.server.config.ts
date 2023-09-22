import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { PackageJson } from 'type-fest'
import * as path from 'path'
import { fileURLToPath } from 'url'
import metadataPlugin from './rollup-metadata-plugin.js'
import pkg from '../package.json' assert { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXTENSIONS = ['', '.ts', '.js']
const BASE_DIR = path.resolve(__dirname, '..')
const TSCONFIG = path.resolve(BASE_DIR, 'tsconfig.rollup.json')

const externals = Object.keys(pkg.dependencies)
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
    chunkFileNames: '[name].js',
    banner: (module) => module.isEntry ? '#!/usr/bin/env node' : ''
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
      tsconfig: TSCONFIG,
      compilerOptions: {
        outDir: 'dist/server'
      }
    }),
    metadataPlugin({
      handle (_, dependencies) {
        const packageJson: PackageJson = {
          name: '@codingame/monaco-vscode-server',
          ...Object.fromEntries(Object.entries(pkg).filter(([key]) => ['version', 'keywords', 'author', 'license', 'repository', 'type'].includes(key))),
          private: false,
          description: `VSCode server designed to be used with ${pkg.name}`,
          bin: {
            'vscode-ext-host-server': './server.js'
          },
          dependencies: {
            vscode: `npm:${pkg.name}@^${pkg.version}`,
            ...Object.fromEntries(Object.entries(pkg.dependencies).filter(([key]) => dependencies.has(key)))
          }
        }
        this.emitFile({
          fileName: 'package.json',
          needsCodeReference: false,
          source: JSON.stringify(packageJson, null, 2),
          type: 'asset'
        })
      }
    })
  ]
}

export default config
