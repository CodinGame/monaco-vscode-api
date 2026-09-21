import type { IEditorOverrideServices } from 'vs/editor/standalone/browser/standaloneServices'
import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors'
import { MeteredConnectionService } from 'vs/platform/meteredConnection/browser/meteredConnectionService'
import { IMeteredConnectionService } from 'vs/platform/meteredConnection/common/meteredConnection.service'
import 'vs/workbench/contrib/meteredConnection/browser/meteredConnection.contribution'

export default function getServiceOverride(): IEditorOverrideServices {
  return {
    [IMeteredConnectionService.toString()]: new SyncDescriptor(MeteredConnectionService, [], true)
  }
}
