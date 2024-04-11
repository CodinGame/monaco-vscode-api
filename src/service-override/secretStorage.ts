import { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { IEncryptionService } from 'vs/platform/encryption/common/encryptionService'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { ISecretStorageService } from 'vs/platform/secrets/common/secrets'
import { EncryptionService } from 'vs/workbench/services/encryption/browser/encryptionService'
import { BrowserSecretStorageService } from 'vs/workbench/services/secrets/browser/secretStorageService'

export default function getServiceOverride (): IEditorOverrideServices {
  return {
    [ISecretStorageService.toString()]: new SyncDescriptor(BrowserSecretStorageService, [], true),
    [IEncryptionService.toString()]: new SyncDescriptor(EncryptionService, [], true)
  }
}
