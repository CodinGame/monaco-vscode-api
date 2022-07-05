import * as rollup from 'rollup'
import dts from 'rollup-plugin-dts'
import * as path from 'path'

const VSCODE_DIR = path.join(__dirname, '../vscode')

const interfaceOverride = new Map<string, string>()
interfaceOverride.set('Event<T>', 'vscode.Event<T>')
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
      name: 'replace-interfaces',
      transform (code, id) {
        interfaceOverride.forEach((value, key) => {
          const [, path, name] = /(?:(.*):)?(.*)/.exec(key)!
          if (path == null || path === id) {
            code = code.replace(`interface ${name} `, `type ${name} = ${value}\ninterface _${name} `)
          }
        })

        return `import * as monaco from 'monaco-editor'\nimport * as vscode from 'vscode'\n${code}`
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
