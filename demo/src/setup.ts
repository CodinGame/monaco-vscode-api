import { ILogService, LogLevel, StandaloneServices, initialize as initializeMonacoService } from 'vscode/services'
import { initialize as initializeVscodeExtensions } from 'vscode/extensions'
import getModelServiceOverride from 'vscode/service-override/model'
import getNotificationServiceOverride from 'vscode/service-override/notifications'
import getDialogsServiceOverride from 'vscode/service-override/dialogs'
import getConfigurationServiceOverride from 'vscode/service-override/configuration'
import getKeybindingsServiceOverride from 'vscode/service-override/keybindings'
import getTextmateServiceOverride from 'vscode/service-override/textmate'
import getThemeServiceOverride from 'vscode/service-override/theme'
import getLanguagesServiceOverride from 'vscode/service-override/languages'
import getAudioCueServiceOverride from 'vscode/service-override/audioCue'
import getViewsServiceOverride, {
  isEditorPartVisible,
  Parts,
  onPartVisibilityChange,
  isPartVisibile,
  attachPart
} from 'vscode/service-override/views'
import getDebugServiceOverride from 'vscode/service-override/debug'
import getPreferencesServiceOverride from 'vscode/service-override/preferences'
import getSnippetServiceOverride from 'vscode/service-override/snippets'
import getQuickAccessServiceOverride from 'vscode/service-override/quickaccess'
import getOutputServiceOverride from 'vscode/service-override/output'
import getTerminalServiceOverride from 'vscode/service-override/terminal'
import getSearchServiceOverride from 'vscode/service-override/search'
import getMarkersServiceOverride from 'vscode/service-override/markers'
import getAccessibilityServiceOverride from 'vscode/service-override/accessibility'
import getLanguageDetectionWorkerServiceOverride from 'vscode/service-override/languageDetectionWorker'
import getStorageServiceOverride, { IStorageItemsChangeEvent, StorageScope } from 'vscode/service-override/storage'
import getExtensionServiceOverride from 'vscode/service-override/extensions'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker'
import TextMateWorker from 'vscode/workers/textMate.worker?worker'
import OutputLinkComputerWorker from 'vscode/workers/outputLinkComputer.worker?worker'
import ExtensionHostWorker from 'vscode/workers/extensionHost.worker?worker'
import LanguageDetectionWorker from 'vscode/workers/languageDetection.worker?worker'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import { TerminalBackend } from './features/terminal'
import { openNewCodeEditor } from './features/editor'
import { toCrossOriginWorker, toWorkerConfig } from './tools/workers'

// Workers
export type WorkerLoader = () => Worker
const workerLoaders: Partial<Record<string, WorkerLoader>> = {
  editorWorkerService: () => new (toCrossOriginWorker(EditorWorker))(),
  textMateWorker: () => new (toCrossOriginWorker(TextMateWorker))(),
  outputLinkComputer: () => new (toCrossOriginWorker(OutputLinkComputerWorker))(),
  languageDetectionWorkerService: () => new (toCrossOriginWorker(LanguageDetectionWorker))()
}
window.MonacoEnvironment = {
  getWorker: function (moduleId, label) {
    const workerFactory = workerLoaders[label]
    if (workerFactory != null) {
      return workerFactory()
    }
    throw new Error(`Unimplemented worker ${label} (${moduleId})`)
  }
}

const onStorageChange = new monaco.Emitter<IStorageItemsChangeEvent>()

// Override services
await initializeMonacoService({
  ...getExtensionServiceOverride(toWorkerConfig(ExtensionHostWorker)),
  ...getModelServiceOverride(),
  ...getNotificationServiceOverride(),
  ...getDialogsServiceOverride(),
  ...getConfigurationServiceOverride(monaco.Uri.file('/tmp')),
  ...getKeybindingsServiceOverride(),
  ...getTextmateServiceOverride(),
  ...getThemeServiceOverride(),
  ...getLanguagesServiceOverride(),
  ...getAudioCueServiceOverride(),
  ...getDebugServiceOverride(),
  ...getPreferencesServiceOverride(),
  ...getViewsServiceOverride(openNewCodeEditor),
  ...getSnippetServiceOverride(),
  ...getQuickAccessServiceOverride({
    isKeybindingConfigurationVisible: isEditorPartVisible,
    shouldUseGlobalPicker: isEditorPartVisible
  }),
  ...getOutputServiceOverride(),
  ...getTerminalServiceOverride(new TerminalBackend()),
  ...getSearchServiceOverride(),
  ...getMarkersServiceOverride(),
  ...getAccessibilityServiceOverride(),
  ...getLanguageDetectionWorkerServiceOverride(),
  ...getStorageServiceOverride({
    read (scope) {
      return new Map(Object.entries(JSON.parse(localStorage.getItem(`storage-${scope}`) ?? '{}')))
    },
    async write (scope, data) {
      localStorage.setItem(`storage-${scope}`, JSON.stringify(Object.fromEntries(data.entries())))
    },
    onDidChange: onStorageChange.event
  })
})
StandaloneServices.get(ILogService).setLevel(LogLevel.Off)

export function clearStorage (): void {
  const allKeys = new Set([StorageScope.APPLICATION, StorageScope.PROFILE, StorageScope.WORKSPACE].flatMap(scope => Object.keys(JSON.parse(localStorage.getItem(`storage-${scope}`) ?? '{}'))))
  localStorage.removeItem(`storage-${StorageScope.APPLICATION}`)
  localStorage.removeItem(`storage-${StorageScope.PROFILE}`)
  localStorage.removeItem(`storage-${StorageScope.WORKSPACE}`)
  onStorageChange.fire({
    deleted: allKeys,
    changed: new Map()
  })
}

await initializeVscodeExtensions()

for (const { part, element } of [
  { part: Parts.SIDEBAR_PART, element: '#sidebar' },
  { part: Parts.ACTIVITYBAR_PART, element: '#activityBar' },
  { part: Parts.PANEL_PART, element: '#panel' },
  { part: Parts.EDITOR_PART, element: '#editors' },
  { part: Parts.STATUSBAR_PART, element: '#statusBar' },
  { part: Parts.AUXILIARYBAR_PART, element: '#auxiliaryBar' }
]) {
  const el = document.querySelector<HTMLDivElement>(element)!
  attachPart(part, el)

  if (!isPartVisibile(part)) {
    el.style.display = 'none'
  }

  onPartVisibilityChange(part, visible => {
    el.style.display = visible ? 'block' : 'none'
  })
}
