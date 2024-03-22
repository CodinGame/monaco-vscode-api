import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { PackageJson } from 'type-fest'
import replace from '@rollup/plugin-replace'
import copy from 'rollup-plugin-copy'
import * as path from 'path'
import { fileURLToPath } from 'url'
import metadataPlugin from './rollup-metadata-plugin.js'
import pkg from '../package.json' assert { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXTENSIONS = ['', '.ts', '.js']
const BASE_DIR = path.resolve(__dirname, '..')
const TSCONFIG = path.resolve(BASE_DIR, 'tsconfig.rollup.json')

const externals = Object.keys(pkg.dependencies)
export default (args: Record<string, string>): rollup.RollupOptions => {
  const vscodeVersion = args['vscode-version']
  delete args['vscode-version']
  const vscodeRef = args['vscode-ref']
  delete args['vscode-ref']
  if (vscodeVersion == null) {
    throw new Error('Vscode version is mandatory')
  }
  return rollup.defineConfig({
    cache: false,
    external: (source) => {
      if (source === 'graceful-fs') {
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
      copy({
        targets: [{
          src: 'vscode-default-extensions-node/*',
          dest: 'dist/server/extensions/'
        }, {
          src: 'vscode/src/vs/workbench/contrib/terminal/browser/media/*.(sh|zsh|ps1)',
          dest: 'dist/server/out/vs/workbench/contrib/terminal/browser/media/'
        }, {
          src: 'vscode/src/vs/base/node/*.sh',
          dest: 'dist/server/out/vs/base/node/'
        }, {
          src: 'vscode/product.json',
          dest: 'dist/server/'
        }]
      }),
      replace({
        VSCODE_VERSION: JSON.stringify(vscodeVersion),
        VSCODE_REF: JSON.stringify(vscodeRef),
        preventAssignment: true
      }),
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
  })
}
