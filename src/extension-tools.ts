// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./types/css-url-parser.d.ts" />

import type {
  IColorTheme,
  ICommand,
  IExtensionContributions,
  IExtensionManifest,
  IGrammar,
  IIconTheme,
  IJSONValidation,
  ILanguage,
  ISnippet
} from 'vs/platform/extensions/common/extensions'
import { type ParseError, parse } from 'vs/base/common/json.js'
import { getParseErrorMessage } from 'vs/base/common/jsonErrorMessages'
import type { IUserFriendlyViewsContainerDescriptor } from 'vs/workbench/api/browser/viewsExtensionPoint'
import parseCssUrl from 'css-url-parser'
import * as mime from 'mime-types'
import { type FileSystemAdapter, glob } from 'fast-glob'
import * as path from 'node:path'
import type nodeFs from 'node:fs'

export interface ExtensionResource {
  path: string
  extensionPaths: string[]
  mimeType?: string
  size: number
}

const plainTextExtensions = ['.d.ts']

function lookupMime(path: string) {
  if (plainTextExtensions.some((e) => path.endsWith(e))) {
    return 'text/plain'
  }
  const mimeType = mime.lookup(path)
  if (mimeType === false) {
    return undefined
  }
  return mimeType
}

function getPaths(filePath: string) {
  const paths = [filePath]
  if (path.extname(filePath) === '.js') {
    paths.push(filePath.substring(0, filePath.lastIndexOf('.')))
  }
  return paths
}

export function toResource(
  resourcePath: string,
  fs: typeof nodeFs,
  cwd: string
): ExtensionResource {
  return {
    path: resourcePath,
    extensionPaths: getPaths(resourcePath),
    mimeType: lookupMime(resourcePath),
    size: fs.statSync(path.resolve(cwd, resourcePath)).size
  }
}

function extractCommandResources(command: ICommand | ICommand[]): string[] {
  if (Array.isArray(command)) {
    return command.flatMap(extractCommandResources)
  }
  if (command.icon != null) {
    if (typeof command.icon === 'object') {
      return [command.icon.light!, command.icon.dark!]
    } else {
      return [command.icon]
    }
  }
  return []
}

function extractGrammarResources(grammar: IGrammar): string[] {
  return [grammar.path]
}

function extractLanguageResources(language: ILanguage): string[] {
  const resources: string[] = []
  if (language.icon != null) {
    resources.push(language.icon.dark!, language.icon.light!)
  }
  if (language.configuration != null) {
    resources.push(language.configuration)
  }
  return resources
}

function extractSnippetsResources(snippet: ISnippet): string[] {
  return [snippet.path]
}

interface IconDefinition {
  iconPath?: string
}

interface FontDefinition {
  src: { path: string; format: string }[]
}

interface IconThemeDocument {
  iconDefinitions?: { [key: string]: IconDefinition }
  fonts?: FontDefinition[]
}

async function extractThemeResources(
  theme: IColorTheme | IIconTheme,
  fs: typeof nodeFs,
  cwd: string
): Promise<string[]> {
  const themeContent = await fs.promises.readFile(path.join(cwd, theme.path))
  const themeDocument = parseJson<IconThemeDocument>(theme.path, themeContent.toString('utf8'))
  const paths: string[] = [theme.path]
  if (themeDocument.fonts != null) {
    for (const font of themeDocument.fonts) {
      for (const src of font.src) {
        paths.push(path.join(path.dirname(theme.path), src.path))
      }
    }
  }
  if (themeDocument.iconDefinitions != null) {
    for (const iconDefinition of Object.values(themeDocument.iconDefinitions)) {
      if (iconDefinition.iconPath != null) {
        paths.push(path.join(path.dirname(theme.path), iconDefinition.iconPath))
      }
    }
  }
  return paths
}

function extractJsonValidationResources(jsonValidation: IJSONValidation): string[] {
  if (jsonValidation.url.startsWith('./')) {
    return [jsonValidation.url]
  }
  return []
}

function extractViewsContainerResources(viewContainers: {
  [loc: string]: IUserFriendlyViewsContainerDescriptor[]
}): string[] {
  return Object.values(viewContainers).flatMap((containers) =>
    containers.map((container) => container.icon)
  )
}

function extractIconResources(icons: NonNullable<IExtensionContributions['icons']>): string[] {
  return Object.values(icons).flatMap((icon) => {
    if (typeof icon.default === 'object') {
      return [icon.default.fontPath]
    }
    return []
  })
}

async function extractResourcesFromExtensionManifestContribute(
  contribute: IExtensionContributions & { [customKey: string]: unknown },
  fs: typeof nodeFs,
  cwd: string
): Promise<string[]> {
  const resources: string[] = []
  if (contribute.icons != null) resources.push(...extractIconResources(contribute.icons))
  if (contribute.commands != null) resources.push(...extractCommandResources(contribute.commands))
  if (contribute.grammars != null)
    resources.push(...contribute.grammars.flatMap(extractGrammarResources))
  if (contribute.languages != null)
    resources.push(...contribute.languages.flatMap(extractLanguageResources))
  if (contribute.snippets != null)
    resources.push(...contribute.snippets.flatMap(extractSnippetsResources))
  if (contribute.themes != null)
    resources.push(
      ...(
        await Promise.all(contribute.themes.map((theme) => extractThemeResources(theme, fs, cwd)))
      ).flat()
    )
  if (contribute.iconThemes != null)
    resources.push(
      ...(
        await Promise.all(
          contribute.iconThemes.map((theme) => extractThemeResources(theme, fs, cwd))
        )
      ).flat()
    )
  if (contribute.productIconThemes != null)
    resources.push(
      ...(
        await Promise.all(
          contribute.productIconThemes.map((theme) => extractThemeResources(theme, fs, cwd))
        )
      ).flat()
    )
  if (contribute.jsonValidation != null)
    resources.push(...contribute.jsonValidation.flatMap(extractJsonValidationResources))
  if (contribute.viewsContainers != null)
    resources.push(...extractViewsContainerResources(contribute.viewsContainers))
  if (contribute['markdown.previewStyles'] != null) {
    resources.push(
      ...(
        await Promise.all(
          (<string[]>contribute['markdown.previewStyles']).map(async (path) => [
            path,
            ...(await extractResources(path, fs, cwd))
          ])
        )
      ).flat()
    )
  }
  if (contribute['markdown.previewScripts'] != null) {
    resources.push(
      ...(
        await Promise.all(
          (<string[]>contribute['markdown.previewScripts']).map(async (path) => [
            path,
            ...(await extractResources(path, fs, cwd))
          ])
        )
      ).flat()
    )
  }
  return resources.filter(
    (resource, index, list) =>
      !resource.startsWith('$(') && !list.slice(0, index).some((o) => o === resource)
  )
}

export async function getExtensionResources(
  manifest: IExtensionManifest,
  fs: typeof nodeFs,
  cwd: string
): Promise<ExtensionResource[]> {
  if (
    manifest.browser != null ||
    manifest.contributes?.typescriptServerPlugins != null ||
    (manifest.contributes?.notebookRenderer != null &&
      manifest.contributes.notebookRenderer.length > 0)
  ) {
    // there is some js in the extension, it's impossible to predict which file will be used, bundle everything
    return (
      await glob('**/*', {
        fs: <FileSystemAdapter>fs,
        cwd,
        onlyFiles: true
      })
    ).map((p) => toResource(p, fs, cwd))
  } else {
    return (await extractResourcesFromExtensionManifest(manifest, fs, cwd)).map((p) =>
      toResource(p, fs, cwd)
    )
  }
}

async function extractResourcesFromExtensionManifest(
  manifest: IExtensionManifest,
  fs: typeof nodeFs,
  cwd: string
): Promise<string[]> {
  const resources: string[] = []

  const children = await fs.promises.readdir('/')
  const readme = children.filter((child) => /^readme(\.txt|\.md|)$/i.test(child))[0]
  if (readme != null) resources.push(readme)
  const changelog = children.filter((child) => /^changelog(\.txt|\.md|)$/i.test(child))[0]
  if (changelog != null) resources.push(changelog)

  if (manifest.contributes != null) {
    resources.push(
      ...(await extractResourcesFromExtensionManifestContribute(
        <IExtensionContributions & { [customKey: string]: unknown }>manifest.contributes,
        fs,
        cwd
      ))
    )
  }

  const manifestFiles = await glob('{package.nls.json,package.nls.*.json,package.json}', {
    fs: <FileSystemAdapter>fs,
    cwd,
    onlyFiles: true
  })
  resources.push(...manifestFiles.map((path) => path))
  if (manifest.l10n != null) {
    const bundleFiles = await glob('{bundle.l10n.json,bundle.l10n.*.json}', {
      fs: <FileSystemAdapter>fs,
      cwd: path.join(cwd, manifest.l10n),
      onlyFiles: true
    })
    resources.push(...bundleFiles)
  }

  if (manifest.icon != null) {
    resources.push(manifest.icon)
  }

  // remove duplicates
  return Array.from(new Set(resources))
}

async function extractResources(
  resourcePath: string,
  fs: typeof nodeFs,
  cwd: string
): Promise<string[]> {
  const resources: string[] = []
  const content = (await fs.promises.readFile(resourcePath)).toString('utf-8')

  if (resourcePath.endsWith('.css')) {
    const urls = parseCssUrl(content)
    for (const url of urls) {
      const assetPath = './' + path.join(path.dirname(resourcePath), url)
      try {
        await fs.promises.access(path.join(cwd, assetPath))
        resources.push(assetPath)
      } catch {
        // ignore, the file doesn't exist
        // It happens for the markdown-math extension without consequences
      }
    }
  }

  return resources
}

export function parseJson<T>(path: string, text: string): T {
  const errors: ParseError[] = []
  const result = parse(text, errors)
  if (errors.length > 0) {
    throw new Error(
      `Failed to parse ${path}:\n${errors.map((error) => `    ${getParseErrorMessage(error.error)}`).join('\n')}`
    )
  }
  return result
}
