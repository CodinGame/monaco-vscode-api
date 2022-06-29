import * as rollup from 'rollup'
import dts from 'rollup-plugin-dts'
import * as path from 'path'
import * as fs from 'fs'

const VSCODE_DIR = path.join(__dirname, '../vscode')
const OVERRIDE_PATH = path.resolve(__dirname, '../src/override')

export default rollup.defineConfig({
  input: './dist/types/src/services.d.ts',
  output: [{
    file: 'dist/services.d.ts',
    format: 'es'
  }],
  external: function isExternal (id) {
    if (id === 'vscode') {
      return true
    }
    return false
  },
  plugins: [
    {
      name: 'ignore-css',
      load (id) {
        if (id.includes('vs/css!')) {
          return 'export default undefined;'
        }
        return undefined
      }
    },
    {
      name: 'change-unsupported-syntax',
      transform (code) {
        return code.replace('export import Severity = BaseSeverity;', 'type Severity = BaseSeverity; export { Severity }')
      }
    },
    {
      name: 'resolve-vscode',
      resolveId: async function (importee, importer) {
        if (importee.startsWith('vscode/')) {
          return path.resolve(VSCODE_DIR, path.relative('vscode', `${importee}.d.ts`))
        }
        if (!importee.startsWith('vs/') && importer != null && importer.startsWith(VSCODE_DIR)) {
          importee = path.relative(VSCODE_DIR, path.resolve(path.dirname(importer), importee))
        }
        const overridePath = path.resolve(OVERRIDE_PATH, `${importee}.d.ts`)
        if (fs.existsSync(overridePath)) {
          return overridePath
        }
        if (importee.startsWith('vs/')) {
          return path.join(VSCODE_DIR, `${importee}.d.ts`)
        }
        return undefined
      }
    },
    dts({
      respectExternal: true
    })
  ]
})
