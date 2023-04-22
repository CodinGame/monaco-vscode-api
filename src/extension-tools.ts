import type { ILocalizedString } from 'vs/platform/action/common/action'
import type { IExtensionManifest } from 'vs/platform/extensions/common/extensions'
import type { ITMSyntaxExtensionPoint } from 'vs/workbench/services/textMate/common/TMGrammars'
import { IConfigurationNode } from 'vs/platform/configuration/common/configurationRegistry'
import { IDebuggerContribution } from 'vs/workbench/contrib/debug/common/debug'
import { IRawLanguageExtensionPoint } from 'vs/workbench/services/language/common/languageService'
import { IThemeExtensionPoint } from 'vs/workbench/services/themes/common/workbenchThemeService'

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

function extractCommandPaths (command: IUserFriendlyCommand | IUserFriendlyCommand[]): string[] {
  if (Array.isArray(command)) {
    return command.flatMap(extractCommandPaths)
  }
  if (command.icon != null) {
    if (typeof command.icon === 'object') {
      return [command.icon.light, command.icon.dark]
    } else {
      return [command.icon]
    }
  }
  return []
}

function extractGrammarPaths (grammar: ITMSyntaxExtensionPoint): string[] {
  return [grammar.path]
}

function extractLanguagePaths (language: Partial<IRawLanguageExtensionPoint>): string[] {
  const paths: string[] = []
  if (language.icon != null) {
    paths.push(language.icon.dark, language.icon.light)
  }
  if (language.configuration != null) {
    paths.push(language.configuration)
  }
  return paths
}

function extractSnippetsPaths (snippet: ISnippetsExtensionPoint): string[] {
  return [snippet.path]
}

function extractThemePaths (theme: IThemeExtensionPoint): string[] {
  return [theme.path]
}

function extractPathsFromExtensionManifestContribute (contribute: RealContribute): string[] {
  const paths: string[] = []
  if (contribute.commands != null) paths.push(...extractCommandPaths(contribute.commands))
  if (contribute.grammars != null) paths.push(...contribute.grammars.flatMap(extractGrammarPaths))
  if (contribute.languages != null) paths.push(...contribute.languages.flatMap(extractLanguagePaths))
  if (contribute.snippets != null) paths.push(...contribute.snippets.flatMap(extractSnippetsPaths))
  if (contribute.themes != null) paths.push(...contribute.themes.flatMap(extractThemePaths))
  if (contribute.iconThemes != null) paths.push(...contribute.iconThemes.flatMap(extractThemePaths))
  if (contribute.productIconThemes != null) paths.push(...contribute.productIconThemes.flatMap(extractThemePaths))
  return Array.from(new Set(paths))
}

export function extractPathsFromExtensionManifest (manifest: IExtensionManifest): string[] {
  return manifest.contributes != null ? extractPathsFromExtensionManifestContribute(manifest.contributes as RealContribute) : []
}
