import 'monaco-editor/esm/vs/editor/editor.all'
import 'monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp'
import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess'
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess'
import 'monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch'
import onigFile from 'vscode-oniguruma/release/onig.wasm?url'
import { StandaloneServices } from 'vscode/services'
import getModelEditorServiceOverride from 'vscode/service-override/modelEditor'
import getMessageServiceOverride from 'vscode/service-override/messages'
import getConfigurationServiceOverride from 'vscode/service-override/configuration'
import getKeybindingsServiceOverride from 'vscode/service-override/keybindings'
import getTextmateServiceOverride, { setGrammars } from 'vscode/service-override/textmate'
import getThemeServiceOverride, { setDefaultThemes, IThemeExtensionPoint } from 'vscode/service-override/theme'
import geTokenClassificationServiceOverride from 'vscode/service-override/tokenClassification'
import getLanguageConfigurationServiceOverride, { setLanguageConfiguration } from 'vscode/service-override/languageConfiguration'
import getSnippetConfigurationServiceOverride from 'vscode/service-override/snippets'
import getLanguagesServiceOverride, { setLanguages } from 'vscode/service-override/languages'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import themes from './resources/themes/themes.json'

// Workers
interface WrappedWorker {
	new(): Worker
}
export type WorkerLoader = () => WrappedWorker | Promise<WrappedWorker>
const workerLoaders: Partial<Record<string, WorkerLoader>> = {
	editorWorkerService: () => EditorWorker,
	json: () => JsonWorker
}
window.MonacoEnvironment = {
	getWorker: async function (moduleId, label) {
		const workerFactory = workerLoaders[label]
		if (workerFactory != null) {
			const Worker = await workerFactory()
			return new Worker()
		}
		throw new Error(`Unimplemented worker ${label} (${moduleId})`)
	}
}

// Override services
StandaloneServices.initialize({
	...getModelEditorServiceOverride(async (model, options) => {
		console.log('trying to open a model', model, options)
		return undefined
	}),
	...getMessageServiceOverride(),
	...getConfigurationServiceOverride(),
	...getKeybindingsServiceOverride(),
	...getTextmateServiceOverride(async () => {
		const response = await fetch(onigFile)
		return await response.arrayBuffer()
	}),
	...getThemeServiceOverride(),
	...geTokenClassificationServiceOverride(),
	...getLanguageConfigurationServiceOverride(),
	...getSnippetConfigurationServiceOverride(),
	...getLanguagesServiceOverride()
})

const loader = {
	'/themes/dark_plus.json': async () => (await import('./resources/themes/theme-defaults~dark_plus.json?raw')).default,
	'/themes/light_plus.json': async () => (await import('./resources/themes/theme-defaults~light_plus.json?raw')).default,
	'/themes/dark_vs.json': async () => (await import('./resources/themes/theme-defaults~dark_vs.json?raw')).default,
	'/themes/light_vs.json': async () => (await import('./resources/themes/theme-defaults~light_vs.json?raw')).default,
	'/themes/hc_black.json': async () => (await import('./resources/themes/theme-defaults~hc_black.json?raw')).default,
	'/themes/hc_light.json': async () => (await import('./resources/themes/theme-defaults~hc_light.json?raw')).default
} as Partial<Record<string, () => Promise<string>>>
setDefaultThemes(themes as IThemeExtensionPoint[], async (theme) => loader[theme.path.slice(1)]!())

setLanguages([{
	id: 'java',
	extensions: [
		'.java',
		'.jav'
	],
	aliases: [
		'Java',
		'java'
	],
	configuration: `./java-configuration.json`
}, {
	id: 'json',
	aliases: [
		'JSON',
		'json'
	],
	extensions: [
		'.json'
	],
	mimetypes: [
		'application/json',
		'application/manifest+json'
	],
	configuration: `./json-configuration.json`
}])
setLanguageConfiguration(`/java-configuration.json`, async () => {
	return (await import('./resources/java-language-configuration.json?raw')).default
})
setLanguageConfiguration(`/json-configuration.json`, async () => {
	return (await import('./resources/json-language-configuration.json?raw')).default
})
setGrammars([{
	language: 'java',
	scopeName: 'source.java',
	path: './java-grammar.json'
}, {
	language: 'json',
	scopeName: 'source.json',
	path: './json-grammar.json'
}], async (grammar) => {
	switch (grammar.language) {
		case 'java': return (await import('./resources/java.tmLanguage.json?raw')).default
		case 'json': return (await import('./resources/JSON.tmLanguage.json?raw')).default
	}
	throw new Error('grammar not found')
})