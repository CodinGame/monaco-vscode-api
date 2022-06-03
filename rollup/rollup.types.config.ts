import * as rollup from 'rollup'
import dts from 'rollup-plugin-dts'
import * as path from 'path'

const VSCODE_DIR = path.join(__dirname, '../vscode')

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
      name: 'resolve-vscode',
      resolveId: async function (importee, importer) {
        if (!importee.startsWith('vs/') && importer != null && importer.startsWith(VSCODE_DIR)) {
          importee = path.relative(VSCODE_DIR, path.resolve(path.dirname(importer), importee))
        }
        if (importee.startsWith('vs/')) {
          return path.join(VSCODE_DIR, `${importee}.d.ts`)
        }
      }
    },
    dts({
      respectExternal: true
    })
  ]
})
