import { SimpleTextFileSystemProvider, registerFileSystemOverlay, FileType, HTMLFileSystemProvider } from 'vscode/service-override/files'
import * as vscode from 'vscode'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'

class FakeFileSystem extends SimpleTextFileSystemProvider {
  private files: Record<string, string> = {
    [vscode.Uri.file('/tmp/test2.js').toString(true)]: 'This is another file'
  }

  protected override async getFileContent (resource: monaco.Uri): Promise<string | undefined> {
    return this.files[resource.toString(true)]
  }

  protected override async setFileContent (resource: monaco.Uri, content: string): Promise<void> {
    this.files[resource.toString(true)] = content
  }

  override async delete (): Promise<void> {
  }

  override async readdir (directory: monaco.Uri): Promise<[string, FileType][]> {
    if (directory.path === '/tmp') {
      return [['test2.js', FileType.File]]
    }
    return []
  }
}

registerFileSystemOverlay(new FakeFileSystem())
