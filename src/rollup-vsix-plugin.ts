import { createFilter, type FilterPattern } from '@rollup/pluginutils'
import type { Plugin } from 'rollup'
import * as yauzl from 'yauzl'
import type { IExtensionManifest } from 'vs/platform/extensions/common/extensions'
import { type IFs, createFsFromVolume, Volume } from 'memfs'
import { Readable } from 'stream'
import * as path from 'path'
import type nodeFs from 'node:fs'
import { getExtensionResources, parseJson } from './extension-tools.js'
import type { ExtensionFileMetadata } from './extensions.js'

interface Options {
  include?: FilterPattern
  exclude?: FilterPattern
  transformManifest?: (manifest: IExtensionManifest) => IExtensionManifest
}

function read(stream: Readable): Promise<Buffer> {
  const bufs: Buffer[] = []
  return new Promise((resolve) => {
    stream.on('data', function (d) {
      bufs.push(d)
    })
    stream.on('end', function () {
      resolve(Buffer.concat(bufs))
    })
  })
}

async function readVsix(file: string): Promise<IFs> {
  return await new Promise((resolve) => {
    const files: Record<string, Buffer> = {}
    yauzl.open(file, { lazyEntries: true }, (err, zipfile) => {
      if (err != null) throw err
      zipfile.readEntry()
      zipfile.on('entry', function (entry: yauzl.Entry) {
        if (/\/$/.test(entry.fileName) || !entry.fileName.startsWith('extension/')) {
          zipfile.readEntry()
        } else {
          zipfile.openReadStream(entry, async function (err, readStream) {
            if (err != null) throw err
            readStream.on('end', function () {
              zipfile.readEntry()
            })
            files[entry.fileName.slice('extension/'.length)] = await read(readStream)
          })
        }
      })
      zipfile.on('end', function () {
        resolve(createFsFromVolume(Volume.fromJSON(files, '/')))
      })
    })
  })
}

function getVsixPath(file: string) {
  return path.posix.relative('/', path.posix.resolve('/', file))
}

export default function plugin({
  include = '**/*.vsix',
  exclude,
  transformManifest = (manifest) => manifest
}: Options = {}): Plugin {
  const filter = createFilter(include, exclude)

  return {
    name: 'vsix-loader',
    resolveId(source) {
      if (filter(source)) {
        return source
      }
      if (source.startsWith('vsix:')) {
        return source
      }
      return undefined
    },
    async load(id) {
      if (!filter(id)) return null

      const vsixFS = await readVsix(id)
      const readFileSync = (filePath: string) =>
        vsixFS.readFileSync(path.join('/', filePath)) as Buffer
      const manifest = transformManifest(
        parseJson<IExtensionManifest>(id, readFileSync('package.json').toString('utf8'))
      )

      const resources = await getExtensionResources(manifest, <typeof nodeFs>(<unknown>vsixFS), '/')

      const resourcePaths = resources.map((r) => r.path)
      const readmePath = resourcePaths.filter((child) => /^readme(\.txt|\.md|)$/i.test(child))[0]
      const changelogPath = resourcePaths.filter((child) =>
        /^changelog(\.txt|\.md|)$/i.test(child)
      )[0]

      const pathMapping = (
        await Promise.all(
          resources.map(async (resource) => {
            const assetPath = getVsixPath(resource.path)
            let url: string
            if (process.env.NODE_ENV === 'development') {
              const fileType = resource.mimeType ?? 'text/javascript'
              url = `'data:${fileType};base64,${readFileSync(assetPath).toString('base64')}'`
            } else {
              url =
                'import.meta.ROLLUP_FILE_URL_' +
                this.emitFile({
                  type: 'asset',
                  name: `${path.basename(id)}/${path.basename(assetPath)}`,
                  source: readFileSync(assetPath)
                })
            }

            return resource.extensionPaths.map((extensionPath) => ({
              pathInExtension: getVsixPath(extensionPath),
              url,
              mimeType: resource.mimeType,
              size: resource.size
            }))
          })
        )
      ).flat()

      return `
import { registerExtension } from 'vscode/extensions'

const manifest = ${JSON.stringify(manifest)}

const { registerFileUrl, whenReady } = registerExtension(manifest, undefined, ${JSON.stringify({ system: true, readmePath, changelogPath })})

${pathMapping
  .map(
    ({ pathInExtension, url, mimeType, size }) => `
registerFileUrl('${pathInExtension}', ${url}, ${JSON.stringify(<ExtensionFileMetadata>{
      mimeType,
      size
    })})`
  )
  .join('\n')}

export { whenReady }
`
    }
  }
}

export type { IExtensionManifest }
