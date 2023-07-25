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
import getViewsServiceOverride, { isEditorPartVisible, renderSidebarPart, renderActivitybarPar, renderEditorPart, renderPanelPart, renderStatusBarPart } from 'vscode/service-override/views'
import getDebugServiceOverride from 'vscode/service-override/debug'
import getPreferencesServiceOverride from 'vscode/service-override/preferences'
import getSnippetServiceOverride from 'vscode/service-override/snippets'
import getQuickAccessServiceOverride from 'vscode/service-override/quickaccess'
import getOutputServiceOverride from 'vscode/service-override/output'
import getTerminalServiceOverride from 'vscode/service-override/terminal'
import getSearchAccessServiceOverride from 'vscode/service-override/search'
import getMarkersAccessServiceOverride from 'vscode/service-override/markers'
import getAccessibilityAccessServiceOverride from 'vscode/service-override/accessibility'
import getExtensionServiceOverride from 'vscode/service-override/extensions'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker'
import TextMateWorker from 'vscode/workers/textMate.worker?worker'
import OutputLinkComputerWorker from 'vscode/workers/outputLinkComputer.worker?worker'
import ExtensionHostWorker from 'vscode/workers/extensionHost.worker?worker'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import { TerminalBackend } from './features/terminal'
import { openNewCodeEditor } from './features/editor'
import { toWorkerConfig } from './tools/workers'

// Workers
export type WorkerLoader = () => Worker
const workerLoaders: Partial<Record<string, WorkerLoader>> = {
  editorWorkerService: () => new EditorWorker(),
  textMateWorker: () => new TextMateWorker(),
  outputLinkComputer: () => new OutputLinkComputerWorker()
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
  ...getSearchAccessServiceOverride(),
  ...getMarkersAccessServiceOverride(),
  ...getAccessibilityAccessServiceOverride()
})
StandaloneServices.get(ILogService).setLevel(LogLevel.Off)

await initializeVscodeExtensions()

renderSidebarPart(document.querySelector<HTMLDivElement>('#sidebar')!)
renderActivitybarPar(document.querySelector<HTMLDivElement>('#activityBar')!)
renderPanelPart(document.querySelector<HTMLDivElement>('#panel')!)
renderEditorPart(document.querySelector<HTMLDivElement>('#editors')!)
renderStatusBarPart(document.querySelector<HTMLDivElement>('#statusBar')!)
