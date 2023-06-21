import * as monaco from 'monaco-editor'
import { DisposableStore, IDisposable } from 'vs/base/common/lifecycle'
import { URI } from 'vs/base/common/uri'
import { RegisteredFileSystemProvider, registerFileSystemOverlay } from './service-override/files'

class TypescriptWorkerFileSystemProvider extends RegisteredFileSystemProvider {
  private libDisposable: IDisposable | undefined

  constructor () {
    super(true)
    this._register(monaco.languages.typescript.typescriptDefaults.onDidExtraLibsChange(this.updateLibs))
    this._register(monaco.languages.typescript.javascriptDefaults.onDidExtraLibsChange(this.updateLibs))
    this.updateLibs()
  }

  private updateLibs = () => {
    this.libDisposable?.dispose()
    const disposable = new DisposableStore()
    for (const [path, lib] of Object.entries(monaco.languages.typescript.typescriptDefaults.getExtraLibs())) {
      disposable.add(this.registerFile(URI.file(path), async () => lib.content))
    }
    for (const [path, lib] of Object.entries(monaco.languages.typescript.javascriptDefaults.getExtraLibs())) {
      disposable.add(this.registerFile(URI.file(path), async () => lib.content))
    }
    this.libDisposable = disposable
  }
}

function registerTypescriptWorkerFileProvider (): IDisposable {
  return registerFileSystemOverlay(-1, new TypescriptWorkerFileSystemProvider())
}

export {
  registerTypescriptWorkerFileProvider
}
