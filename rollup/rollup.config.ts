import nodeResolve from '@rollup/plugin-node-resolve'
import * as rollup from 'rollup'
import typescript from '@rollup/plugin-typescript'
import cleanup from 'js-cleanup'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars'
import styles from 'rollup-plugin-styles'
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets'
import copy from 'rollup-plugin-copy'
import * as fs from 'node:fs'
import * as nodePath from 'node:path'
import carryDtsPlugin from './plugins/rollup-carry-dts-plugin.js'
import { configuredSubpackagePlugin } from './tools/configuredSubpackagePlugin.js'
import {
  relativizeVscodeImportsTransformer,
  resolveVscodePlugin,
  vscodeLocalizationPlugin
} from './tools/vscode.js'
import vscodeAssetGlobMetaUrl from './plugins/vscode-asset-glob-meta-url-plugin.js'
import dynamicImportPolyfillPlugin from './plugins/dynamic-import-polyfill-plugin.js'
import resolveAssetUrlPlugin from './plugins/resolve-asset-url-plugin.js'
import { typeDedupReplaceTransformer } from './tools/typeDedup.js'
import {
  DIST_DIR_MAIN,
  EXTENSIONS,
  SRC_DIR,
  TSCONFIG,
  external,
  VSCODE_SRC_DIR
} from './tools/config.js'
import { transformImportEqualsTransformerFactory } from './tools/typescript.js'

const input = {
  'extension.api': './src/extension.api.ts',
  'editor.api': './src/editor.api.ts',
  localExtensionHost: './src/localExtensionHost.ts',
  extensions: './src/extensions.ts',
  services: './src/services.ts',
  l10n: './src/l10n.ts',
  assets: './src/assets.ts',
  lifecycle: './src/lifecycle.ts',
  workbench: './src/workbench.ts',
  'missing-services': './src/missing-services.ts',
  tools: './src/tools.ts',
  monaco: './src/monaco.ts',
  ...Object.fromEntries(
    fs
      .readdirSync(nodePath.resolve(SRC_DIR, 'service-override'), { withFileTypes: true })
      .filter((f) => f.isFile())
      .map((f) => f.name)
      .map((name) => [
        `service-override/${nodePath.basename(name, '.ts')}`,
        `./src/service-override/${name}`
      ])
  ),
  ...Object.fromEntries(
    fs
      .readdirSync(nodePath.resolve(SRC_DIR, 'workers'), { withFileTypes: true })
      .filter((f) => f.isFile())
      .map((f) => f.name)
      .map((name) => [`workers/${nodePath.basename(name, '.ts')}`, `./src/workers/${name}`])
  )
}

export default (args: Record<string, string>): rollup.RollupOptions => {
  const vscodeVersion = args['vscode-version']
  delete args['vscode-version']
  const vscodeCommit = args['vscode-commit']
  delete args['vscode-commit']
  const vscodeRef = args['vscode-ref']
  delete args['vscode-ref']
  if (vscodeVersion == null) {
    throw new Error('Vscode version is mandatory')
  }
  return rollup.defineConfig({
    cache: false,
    treeshake: {
      annotations: true,
      preset: 'smallest',
      moduleSideEffects(id) {
        if (id.includes('terminalContribExports') || id.includes('amdX')) {
          return false
        }
        return true
      },
      tryCatchDeoptimization: true
    },
    external,
    output: [
      {
        preserveModules: true,
        preserveModulesRoot: 'src',
        minifyInternalExports: false,
        assetFileNames: 'assets/[name][extname]',
        format: 'esm',
        dir: DIST_DIR_MAIN,
        entryFileNames: (chunkInfo) => {
          // Rename node_modules to external so it's not removed while publishing the package
          // tslib and rollup-plugin-styles are bundled
          if (chunkInfo.name.includes('node_modules')) {
            return chunkInfo.name.replace('node_modules', 'external') + '.js'
          }

          return '[name].js'
        },
        hoistTransitiveImports: false
      }
    ],
    input,
    plugins: [
      importMetaAssets({
        include: ['**/*.ts', '**/*.js']
      }),
      commonjs({
        include: '**/vscode-semver/**/*'
      }),
      resolveAssetUrlPlugin(),
      nodeResolve({
        extensions: EXTENSIONS
      }),
      carryDtsPlugin({
        external,
        transformers: [typeDedupReplaceTransformer]
      }),
      resolveVscodePlugin(),
      vscodeLocalizationPlugin(),
      typescript({
        noEmitOnError: true,
        tsconfig: TSCONFIG,
        compilerOptions: {
          rootDir: SRC_DIR,
          declaration: true,
          declarationDir: DIST_DIR_MAIN,
          outDir: DIST_DIR_MAIN,
          allowJs: true
        },
        transformers: {
          afterDeclarations: [relativizeVscodeImportsTransformer],
          before: [
            {
              type: 'program',
              factory: transformImportEqualsTransformerFactory
            }
          ]
        }
      }),
      replace({
        VSCODE_VERSION: JSON.stringify(vscodeVersion),
        VSCODE_REF: JSON.stringify(vscodeRef),
        VSCODE_COMMIT: JSON.stringify(vscodeCommit),
        BUILD_ID: JSON.stringify(`${vscodeRef}-${crypto.randomUUID()}`),
        'globalThis.require': 'undefined',
        preventAssignment: true
      }),
      vscodeAssetGlobMetaUrl({ vscodeSrcDir: VSCODE_SRC_DIR }),
      styles({
        mode: 'inject',
        minimize: true
      }),
      dynamicImportPolyfillPlugin(),
      dynamicImportVars({
        exclude: ['**/amdX.js']
      }),
      {
        name: 'cleanup',
        renderChunk(code) {
          return cleanup(code, null, {
            comments: 'none',
            sourcemap: false
          }).code
        }
      },
      configuredSubpackagePlugin(),
      copy({
        hook: 'writeBundle',
        targets: [
          { src: ['README.md'], dest: 'dist/packages/monaco-vscode-api' },
          {
            src: 'vscode/src/vs/workbench/contrib/debug/common/debugProtocol.d.ts',
            dest: 'dist/packages/monaco-vscode-api/'
          },
          {
            src: 'vscode/src/vscode-dts/*.d.ts',
            dest: 'dist/packages/monaco-vscode-api/vscode-dts'
          }
        ]
      })
    ]
  })
}
