import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import type { PackageJson } from 'type-fest'
import dts from 'rollup-plugin-dts'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'

const pkg = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url).pathname).toString()
)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXTENSIONS = ['', '.ts', '.js']
const BASE_DIR = path.resolve(__dirname, '..')
const TSCONFIG = path.resolve(BASE_DIR, 'tsconfig.rollup.json')

const config: rollup.RollupOptions[] = [
  {
    input: 'src/rollup-vsix-plugin.ts',
    output: 'dist/packages/monaco-vscode-rollup-vsix-plugin',
    description: `Rollup plugin used to load VSCode extension files (VSIX), designed to be used with ${pkg.name}`
  },
  {
    input: 'src/rollup-extension-directory-plugin.ts',
    output: 'dist/packages/monaco-vscode-rollup-extension-directory-plugin',
    description: `Rollup plugin used to load VSCode extension already extracted inside a directory, designed to be used with ${pkg.name}`
  }
].flatMap(({ input, output, description }) => [
  {
    external: [...Object.keys({ ...pkg.dependencies }), '@rollup/pluginutils'],
    output: [
      {
        format: 'esm',
        dir: output,
        entryFileNames: '[name].d.ts'
      }
    ],
    input,
    plugins: [
      nodeResolve({
        extensions: EXTENSIONS,
        modulePaths: ['vscode/src/'],
        browser: false,
        preferBuiltins: true
      }),
      dts()
    ]
  },
  {
    cache: false,
    external: [...Object.keys({ ...pkg.dependencies }), '@rollup/pluginutils'],
    output: [
      {
        format: 'esm',
        dir: output,
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js'
      }
    ],
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
        include: [input, 'src/extension-tools.ts'],
        compilerOptions: {
          outDir: output
        }
      }),
      json({
        compact: true,
        namedExports: false,
        preferConst: false
      }),
      {
        name: 'bundleGenerator',
        generateBundle(options, bundle) {
          const outputFile = Object.values(bundle).find(
            (i) => i.type === 'chunk' && i.isEntry
          )!.name

          const externalDependencies = new Set(
            Array.from(this.getModuleIds()).filter((id) => this.getModuleInfo(id)!.isExternal)
          )

          const packageJson: PackageJson = {
            name: `@codingame/${path.basename(output)}`,
            ...Object.fromEntries(
              Object.entries(pkg).filter(([key]) =>
                ['version', 'keywords', 'author', 'license', 'repository', 'type'].includes(key)
              )
            ),
            private: false,
            description,
            main: `${outputFile}.js`,
            module: `${outputFile}.js`,
            types: `${outputFile}.d.ts`,
            dependencies: {
              ...Object.fromEntries(
                Object.entries(pkg.dependencies as Record<string, string>).filter(([key]) =>
                  externalDependencies.has(key)
                )
              )
            }
          }
          this.emitFile({
            fileName: 'package.json',
            needsCodeReference: false,
            source: JSON.stringify(packageJson, null, 2),
            type: 'asset'
          })
        }
      }
    ]
  }
])

export default config
