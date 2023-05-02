import type { ILocalizedString } from 'vs/platform/action/common/action'
import type { IExtensionManifest } from 'vs/platform/extensions/common/extensions'
import type { ITMSyntaxExtensionPoint } from 'vs/workbench/services/textMate/common/TMGrammars'
import { IConfigurationNode } from 'vs/platform/configuration/common/configurationRegistry'
import { IDebuggerContribution } from 'vs/workbench/contrib/debug/common/debug'
import { IRawLanguageExtensionPoint } from 'vs/workbench/services/language/common/languageService'
import { IThemeExtensionPoint } from 'vs/workbench/services/themes/common/workbenchThemeService'
import { ParseError, parse } from 'vs/base/common/json.js'
import { getParseErrorMessage } from 'vs/base/common/jsonErrorMessages'
import { InputPluginOption, rollup } from 'rollup'
import { addExtension } from '@rollup/pluginutils'
import * as path from 'path'

export interface ExtensionResource {
  path: string
  sync: boolean // Does this resource need to be loaded synchronously to have a blob url
}

type IUserFriendlyIcon = string | { light: string, dark: string }
interface IUserFriendlyCommand {
  command: string
  title: string | ILocalizedString
  shortTitle?: string | ILocalizedString
  enablement?: string
  category?: string | ILocalizedString
  icon?: IUserFriendlyIcon
}

interface IJSONValidationExtensionPoint {
  fileMatch: string | string[]
  url: string
}

interface ContributedKeyBinding {
  command: string
  args?: unknown
  key: string
  when?: string
  mac?: string
  linux?: string
  win?: string
}

interface ISnippetsExtensionPoint {
  language: string
  path: string
}

interface RealContribute {
  commands?: IUserFriendlyCommand | IUserFriendlyCommand[]
  configuration?: IConfigurationNode
  debuggers?: IDebuggerContribution[]
  grammars?: ITMSyntaxExtensionPoint[]
  jsonValidation?: IJSONValidationExtensionPoint[]
  keybindings?: ContributedKeyBinding | ContributedKeyBinding[]
  languages?: IRawLanguageExtensionPoint[]
  snippets?: ISnippetsExtensionPoint[]
  themes?: IThemeExtensionPoint[]
  iconThemes?: IThemeExtensionPoint[]
  productIconThemes?: IThemeExtensionPoint[]
}

function extractCommandResources (command: IUserFriendlyCommand | IUserFriendlyCommand[]): ExtensionResource[] {
  if (Array.isArray(command)) {
    return command.flatMap(extractCommandResources)
  }
  if (command.icon != null) {
    if (typeof command.icon === 'object') {
      return [{ path: command.icon.light, sync: false }, { path: command.icon.dark, sync: false }]
    } else {
      return [{ path: command.icon, sync: false }]
    }
  }
  return []
}

function extractGrammarResources (grammar: ITMSyntaxExtensionPoint): ExtensionResource[] {
  return [{ path: grammar.path, sync: false }]
}

function extractLanguageResources (language: Partial<IRawLanguageExtensionPoint>): ExtensionResource[] {
  const paths: ExtensionResource[] = []
  if (language.icon != null) {
    paths.push({ path: language.icon.dark, sync: false }, { path: language.icon.light, sync: false })
  }
  if (language.configuration != null) {
    paths.push({ path: language.configuration, sync: false })
  }
  return paths
}

function extractSnippetsResources (snippet: ISnippetsExtensionPoint): ExtensionResource[] {
  return [{ path: snippet.path, sync: false }]
}

interface IconDefinition {
  iconPath?: string
}

interface FontDefinition {
  src: { path: string, format: string }[]
}

interface IconThemeDocument {
  iconDefinitions?: { [key: string]: IconDefinition }
  fonts?: FontDefinition[]
}

async function extractThemeResources (theme: IThemeExtensionPoint, getFileContent: (path: string) => Promise<Buffer>): Promise<ExtensionResource[]> {
  const themeContent = await getFileContent(theme.path)
  const themeDocument = parseJson<IconThemeDocument>(theme.path, themeContent.toString('utf8'))
  const paths: ExtensionResource[] = [{ path: theme.path, sync: false }]
  if (themeDocument.fonts != null) {
    for (const font of themeDocument.fonts) {
      for (const src of font.src) {
        paths.push({ path: path.join(path.dirname(theme.path), src.path), sync: true })
      }
    }
  }
  if (themeDocument.iconDefinitions != null) {
    for (const iconDefinition of Object.values(themeDocument.iconDefinitions)) {
      if (iconDefinition.iconPath != null) {
        paths.push({ path: path.join(path.dirname(theme.path), iconDefinition.iconPath), sync: true })
      }
    }
  }
  return paths
}

async function extractResourcesFromExtensionManifestContribute (contribute: RealContribute, getFileContent: (path: string) => Promise<Buffer>): Promise<ExtensionResource[]> {
  const resources: ExtensionResource[] = []
  if (contribute.commands != null) resources.push(...extractCommandResources(contribute.commands))
  if (contribute.grammars != null) resources.push(...contribute.grammars.flatMap(extractGrammarResources))
  if (contribute.languages != null) resources.push(...contribute.languages.flatMap(extractLanguageResources))
  if (contribute.snippets != null) resources.push(...contribute.snippets.flatMap(extractSnippetsResources))
  if (contribute.themes != null) resources.push(...((await Promise.all(contribute.themes.map(theme => extractThemeResources(theme, getFileContent), getFileContent))).flat()))
  if (contribute.iconThemes != null) resources.push(...((await Promise.all(contribute.iconThemes.map(theme => extractThemeResources(theme, getFileContent), getFileContent))).flat()))
  if (contribute.productIconThemes != null) resources.push(...((await Promise.all(contribute.productIconThemes.map(theme => extractThemeResources(theme, getFileContent), getFileContent))).flat()))
  return resources.filter((resource, index, list) => !resource.path.startsWith('$(') && !list.slice(0, index).some(o => o.path === resource.path))
}

export async function extractResourcesFromExtensionManifest (manifest: IExtensionManifest, getFileContent: (path: string) => Promise<Buffer>): Promise<ExtensionResource[]> {
  const resources: ExtensionResource[] = []

  if (manifest.contributes != null) {
    resources.push(...await extractResourcesFromExtensionManifestContribute(manifest.contributes as RealContribute, getFileContent))
  }
  if (manifest.browser != null) {
    resources.push({
      path: addExtension(manifest.browser, '.js'),
      sync: false
    })
  }
  return resources
}

export function parseJson<T> (path: string, text: string): T {
  const errors: ParseError[] = []
  const result = parse(text, errors)
  if (errors.length > 0) {
    throw new Error(`Failed to parse ${path}:\n${errors.map(error => `    ${getParseErrorMessage(error.error)}`).join('\n')}`)
  }
  return result
}

export async function buildExtensionCode (path: string, rollupPlugins: InputPluginOption[], getFileContent?: (path: string) => Promise<string>): Promise<string> {
  const build = await rollup({
    input: path,
    external: ['vscode'],
    plugins: [
      ...(getFileContent != null
        ? [<InputPluginOption>{
          name: 'loader',
          resolveId (source) {
            return source
          },
          load (id) {
            return getFileContent(id.replace(/\?.*$/, ''))
          }
        }]
        : []),
      ...rollupPlugins
    ]
  })
  const { output } = await build.generate({ format: 'cjs' })
  return output[0].code
}

export function compressResource (path: string, content: string): string {
  try {
    return JSON.stringify(parseJson(path, content))
  } catch (e) {
    return content
  }
}
