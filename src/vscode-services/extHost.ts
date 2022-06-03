import { ExtHostCommands } from 'vs/workbench/api/common/extHostCommands'
import { IExtHostRpcService } from 'vs/workbench/api/common/extHostRpcService'
import { ILogService, LogLevel } from 'vs/platform/log/common/log'
import { MainThreadCommands } from 'vs/workbench/api/browser/mainThreadCommands'
import { IExtHostContext } from 'vs/workbench/services/extensions/common/extHostCustomers'
import { ExtensionHostKind, IExtensionService } from 'vs/workbench/services/extensions/common/extensions'
import { StandaloneServices } from 'vs/editor/standalone/browser/standaloneServices'
import { ICommandService } from 'vs/platform/commands/common/commands'
import { Emitter, Event } from 'vs/base/common/event'
import { ExtensionIdentifier, IExtensionDescription, TargetPlatform } from 'vs/platform/extensions/common/extensions'
import { URI } from 'vs/base/common/uri'
import { IExtHostApiDeprecationService } from 'vs/workbench/api/common/extHostApiDeprecationService'
import { ExtHostContext, IMainContext, MainContext, MainThreadDiagnosticsShape, MainThreadDocumentsShape } from 'vs/workbench/api/common/extHost.protocol'
import { ExtHostDiagnostics } from 'vs/workbench/api/common/extHostDiagnostics'
import { ExtHostFileSystemInfo } from 'vs/workbench/api/common/extHostFileSystemInfo'
import * as monaco from 'monaco-editor'
import { IMarkerData } from 'vs/platform/markers/common/markers'
import { IMessagePassingProtocol } from 'vs/base/parts/ipc/common/ipc'
import { RPCProtocol } from 'vs/workbench/services/extensions/common/rpcProtocol'
import { BufferedEmitter } from 'vs/base/parts/ipc/common/ipc.net'
import { VSBuffer } from 'vs/base/common/buffer'
import { Proxied, ProxyIdentifier } from 'vs/workbench/services/extensions/common/proxyIdentifier'
import { ExtHostDocumentData } from 'vs/workbench/api/common/extHostDocumentData'
import { DisposableStore } from 'vs/base/common/lifecycle'
import { ExtHostDocuments } from 'vs/workbench/api/common/extHostDocuments'
import { TextDocumentChangeReason } from 'vs/workbench/api/common/extHostTypes'
import * as typeConvert from 'vs/workbench/api/common/extHostTypeConverters'
import * as vscode from 'vscode'
import { noop, unsupported } from '../tools'

const extensionDescription: IExtensionDescription = {
  identifier: new ExtensionIdentifier('monaco'),
  targetPlatform: TargetPlatform.WEB,
  isBuiltin: true,
  isUserBuiltin: true,
  isUnderDevelopment: false,
  extensionLocation: URI.file('extension'),
  name: 'monaco',
  publisher: 'microsoft',
  version: '1.0.0',
  engines: {
    vscode: '1.67.2'
  }
}

class SimpleMessagePassingProtocol implements IMessagePassingProtocol {
  private readonly _onMessage = new BufferedEmitter<VSBuffer>()
  readonly onMessage: Event<VSBuffer> = this._onMessage.event
  send (buffer: VSBuffer): void {
    this._onMessage.fire(buffer)
  }
}

const imessagePassingProtocol = new SimpleMessagePassingProtocol()

const rpcProtocol = new RPCProtocol(imessagePassingProtocol, null, null)

const extHostFileSystemInfo = new ExtHostFileSystemInfo()

const mainContext: IMainContext = {
  getProxy: function <T> (identifier: ProxyIdentifier<T>): Proxied<T> {
    return rpcProtocol.getProxy(identifier)
  },
  set: function <T, R extends T> (identifier: ProxyIdentifier<T>, instance: R): R {
    return rpcProtocol.set(identifier, instance)
  },
  assertRegistered: function (identifiers: ProxyIdentifier<unknown>[]): void {
    rpcProtocol.assertRegistered(identifiers)
  },
  drain: function (): Promise<void> {
    return rpcProtocol.drain()
  },
  dispose: function (): void {
    rpcProtocol.dispose()
  }
}

const extHostRpcService: IExtHostRpcService = {
  _serviceBrand: undefined,
  getProxy: function <T> (identifier: ProxyIdentifier<T>): Proxied<T> {
    return rpcProtocol.getProxy(identifier)
  },
  set: function <T, R extends T> (identifier: ProxyIdentifier<T>, instance: R): R {
    return rpcProtocol.set(identifier, instance)
  },
  assertRegistered: function (identifiers: ProxyIdentifier<unknown>[]): void {
    rpcProtocol.assertRegistered(identifiers)
  },
  drain: function (): Promise<void> {
    return rpcProtocol.drain()
  },
  dispose: function (): void {
    rpcProtocol.dispose()
  }
}

const extHostContext: IExtHostContext = {
  remoteAuthority: null,
  extensionHostKind: ExtensionHostKind.LocalProcess,
  getProxy: function <T> (identifier: ProxyIdentifier<T>): Proxied<T> {
    return rpcProtocol.getProxy(identifier)
  },
  set: function <T, R extends T> (identifier: ProxyIdentifier<T>, instance: R): R {
    return rpcProtocol.set(identifier, instance)
  },
  assertRegistered: function (identifiers: ProxyIdentifier<unknown>[]): void {
    rpcProtocol.assertRegistered(identifiers)
  },
  drain: function (): Promise<void> {
    return rpcProtocol.drain()
  },
  dispose: function (): void {
    rpcProtocol.dispose()
  }
}

const extHostLogService: ILogService = {
  _serviceBrand: undefined,
  onDidChangeLogLevel: Event.None,
  getLevel: function (): LogLevel {
    return LogLevel.Off
  },
  setLevel: noop,
  trace: noop,
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
  critical: noop,
  flush: noop,
  dispose: noop
}

const extensionService = <Pick<IExtensionService, 'activateByEvent'>>{
  activateByEvent: async function (): Promise<void> {
    // ignore
  }
} as IExtensionService

const commandsService = StandaloneServices.get(ICommandService)

rpcProtocol.set(MainContext.MainThreadCommands, new MainThreadCommands(extHostContext, commandsService, extensionService))
const extHostCommands = new ExtHostCommands(extHostRpcService, extHostLogService)
rpcProtocol.set(ExtHostContext.ExtHostCommands, extHostCommands)

const extHostApiDeprecationService: IExtHostApiDeprecationService = {
  _serviceBrand: undefined,
  report: function (): void {
    // ignore
  }
}

class MainThreadDiagnostics implements MainThreadDiagnosticsShape {
  $changeMany (owner: string, entries: [monaco.UriComponents, IMarkerData[] | undefined][]): void {
    for (const entry of entries) {
      const [uri, markers] = entry
      if (markers != null) {
        for (const marker of markers) {
          if (marker.relatedInformation != null) {
            for (const relatedInformation of marker.relatedInformation) {
              relatedInformation.resource = URI.revive(relatedInformation.resource)
            }
          }
          if (marker.code != null && typeof marker.code !== 'string') {
            marker.code.target = URI.revive(marker.code.target)
          }
        }
      }
      monaco.editor.setModelMarkers(monaco.editor.getModel(URI.revive(uri))!, owner, markers as monaco.editor.IMarkerData[])
    }
  }

  $clear (owner: string): void {
    // FIXME can be improved (https://github.com/microsoft/monaco-editor/issues/3129)
    const markers = monaco.editor.getModelMarkers({
      owner
    })
    const models = new Set<monaco.editor.ITextModel>()
    for (const marker of markers) {
      models.add(monaco.editor.getModel(marker.resource)!)
    }
    for (const model of models) {
      monaco.editor.setModelMarkers(model, owner, [])
    }
  }

  dispose (): void {
    // Nothing to do
  }
}
rpcProtocol.set(MainContext.MainThreadDiagnostics, new MainThreadDiagnostics())

const extHostDiagnostics = new ExtHostDiagnostics(mainContext, extHostLogService, extHostFileSystemInfo)

const unsupportedMainThreadDocumentsShape: MainThreadDocumentsShape = {
  $tryCreateDocument: unsupported,
  $tryOpenDocument: unsupported,
  $trySaveDocument: unsupported,
  dispose () { }
}

function createDocumentDataFromModel (model: monaco.editor.ITextModel): ExtHostDocumentData {
  return new ExtHostDocumentData(
    unsupportedMainThreadDocumentsShape,
    model.uri,
    model.getLinesContent(),
    model.getEOL(),
    model.getVersionId(),
    model.getLanguageId(),
    false
  )
}

class MonacoExtHostDocuments implements Omit<ExtHostDocuments, ''>, vscode.Disposable {
  protected readonly disposableStore = new DisposableStore()
  private documentsData = new Map<string, ExtHostDocumentData>()
  private documentDisposables = new Map<string, vscode.Disposable>()
  private readonly _onDidAddDocument = new Emitter<vscode.TextDocument>()
  private readonly _onDidRemoveDocument = new Emitter<vscode.TextDocument>()
  private readonly _onDidChangeDocument = new Emitter<vscode.TextDocumentChangeEvent>()

  constructor () {
    for (const model of monaco.editor.getModels()) {
      this.addModel(model)
    }
    this.disposableStore.add(monaco.editor.onDidCreateModel(model => this.addModel(model)))
    this.disposableStore.add(monaco.editor.onWillDisposeModel(model => this.removeModel(model)))
    this.disposableStore.add(monaco.editor.onDidChangeModelLanguage((event) => {
      this.removeModel(event.model)
      this.addModel(event.model)
    }))
  }

  private addModel (model: monaco.editor.IModel): void {
    const uri = model.uri.toString()
    const documentData = this.setModel(uri, model)
    this._onDidAddDocument.fire(documentData.document)
    this.documentDisposables.set(uri, model.onDidChangeContent(event =>
      this.onDidChangeContent(uri, event)
    ))
  }

  private removeModel (model: monaco.editor.IModel): void {
    const uri = model.uri.toString()
    const documentData = this.documentsData.get(uri)
    if (documentData != null) {
      this.documentsData.delete(uri)
      this._onDidRemoveDocument.fire(documentData.document)
    }
    const disposable = this.documentDisposables.get(uri)
    if (disposable != null) {
      disposable.dispose()
      this.documentDisposables.delete(uri)
    }
  }

  private onDidChangeContent (uri: string, event: monaco.editor.IModelContentChangedEvent) {
    const textDocumentData = this.documentsData.get(uri)!
    textDocumentData.onEvents(event)

    this._onDidChangeDocument.fire({
      document: textDocumentData.document,
      contentChanges: event.changes.map(change => ({
        range: typeConvert.Range.to(change.range),
        rangeLength: change.rangeLength,
        rangeOffset: change.rangeOffset,
        text: change.text
      })),
      reason: event.isUndoing ? TextDocumentChangeReason.Undo : event.isRedoing ? TextDocumentChangeReason.Redo : undefined
    })
  }

  private setModel (uri: string, model: monaco.editor.IModel): ExtHostDocumentData {
    const documentData = createDocumentDataFromModel(model)
    this.documentsData.set(uri, documentData)
    return documentData
  }

  getDocument (resource: vscode.Uri): vscode.TextDocument {
    const data = this.getDocumentData(resource)
    if ((data?.document) == null) {
      throw new Error(`Unable to retrieve document from URI '${resource}'`)
    }
    return data.document
  }

  getDocumentData (resource: vscode.Uri): ExtHostDocumentData | undefined {
    const model = monaco.editor.getModel(monaco.Uri.from(resource))
    if (model == null) {
      throw new Error(`Unable to retrieve document from URI '${resource}'`)
    }
    return createDocumentDataFromModel(model)
  }

  get onDidAddDocument () { return this._onDidAddDocument.event }
  get onDidRemoveDocument () { return this._onDidRemoveDocument.event }
  get onDidChangeDocument () { return this._onDidChangeDocument.event }
  onDidSaveDocument = Event.None

  public getAllDocumentData (): ExtHostDocumentData[] {
    return Array.from(this.documentsData.values())
  }

  ensureDocumentData = unsupported
  createDocumentData = unsupported
  $acceptModelLanguageChanged = unsupported
  $acceptModelSaved = unsupported
  $acceptDirtyStateChanged = unsupported
  $acceptModelChanged = unsupported
  setWordDefinitionFor = unsupported

  dispose () {
    this.disposableStore.dispose()
  }
}

const extHostDocuments = new MonacoExtHostDocuments() as unknown as ExtHostDocuments

export {
  extHostCommands,
  extHostDiagnostics,
  extHostApiDeprecationService,
  extHostLogService,
  extensionDescription,
  extHostDocuments
}
