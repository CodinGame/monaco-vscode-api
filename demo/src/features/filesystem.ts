import { RegisteredFileSystemProvider, registerFileSystemOverlay } from 'vscode/service-override/files'
import * as vscode from 'vscode'

const fileSystemProvider = new RegisteredFileSystemProvider(true)
fileSystemProvider.registerFile(vscode.Uri.file('/tmp/test2.js'), async () => 'This is another static file')

registerFileSystemOverlay(-1, fileSystemProvider)
